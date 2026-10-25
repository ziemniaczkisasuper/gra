// Player step per tick (mechaniki §1.2): march, buffered direction changes during the cooldown.
import { M0, msToTicks } from '../data/mechanics-m0';
import type { Dir8 } from '../input/actions';
import { canStep, type OccupiedFn } from '../world/collision';
import type { TileMap } from '../world/tilemap';
import type { Entity } from './entity';
import { tryStep, type StepCosts, type StepResult } from './movement';

/** Per-player input memory between ticks (not saved: pause resets input anyway). */
export interface PlayerMoveMemory {
  /** Direction read in the previous tick (null = none). */
  prevDir: Dir8 | null;
  /** Direction of the last executed step. */
  stepDir: Dir8 | null;
  /** QA-M0-001: direction pressed while a step was not possible, valid up to tick `until`. */
  buffered: { dir: Dir8; until: number } | null;
  /** QA-M0-002: the current step is a straight one started from standstill (may turn diagonal). */
  upgradable: boolean;
}

export const freshPlayerMoveMemory = (): PlayerMoveMemory => ({
  prevDir: null,
  stepDir: null,
  buffered: null,
  upgradable: false,
});

export interface PlayerMoveOptions {
  costs: StepCosts;
  /** Minimum lifetime of a buffered tap (INPUT_TAP_BUFFER_MS in ticks). */
  tapBufferTicks?: number;
  /** DIAG_GRACE in ticks (default DIAG_GRACE_MS). 0 = no upgrade. */
  diagGraceTicks?: number;
  /** Input comes from digital keys (ActionState.digitalMove). The grace is keyboard-only. */
  digital?: boolean;
}

/**
 * QA-M0-002 (mechaniki §1.2 v0.5): a straight step from standstill starts at once; if within
 * DIAG_GRACE of its start the perpendicular key comes (step still running), the target becomes
 * the diagonal cell from the start cell. The step time is the diagonal cost counted from the
 * start (no rewind, no extra time). Only if the diagonal cell is free and no corner is cut.
 */
function tryUpgrade(
  e: Entity,
  dir: Dir8,
  mem: PlayerMoveMemory,
  map: TileMap,
  tick: number,
  costs: StepCosts,
  graceTicks: number,
  occupied?: OccupiedFn,
): boolean {
  const s = mem.stepDir;
  if (!mem.upgradable || !s || e.moveCooldown <= 0 || e.attackWindup > 0) return false;
  const elapsed = tick - e.moveTick;
  if (elapsed < 1 || elapsed > graceTicks || elapsed >= costs.diagTicks) return false;
  // perpendicular component of the new input (a diagonal containing s, or the pure perpendicular)
  const px = s.x === 0 ? dir.x : 0;
  const py = s.y === 0 ? dir.y : 0;
  if (px === 0 && py === 0) return false;
  if ((s.x !== 0 && dir.x === -s.x) || (s.y !== 0 && dir.y === -s.y)) return false;
  const diag = { x: (s.x || px) as Dir8['x'], y: (s.y || py) as Dir8['y'] };
  if (!canStep(map, e.fromX, e.fromY, diag.x, diag.y, occupied)) return false;
  e.x = e.fromX + diag.x;
  e.y = e.fromY + diag.y;
  e.facing = { x: diag.x, y: diag.y };
  e.moveTicks = costs.diagTicks;
  e.moveCooldown = costs.diagTicks - elapsed;
  mem.stepDir = diag;
  mem.upgradable = false;
  return true;
}

const same = (a: Dir8 | null, b: Dir8 | null) => !!a && !!b && a.x === b.x && a.y === b.y;

/**
 * One player step attempt (QA-M0-001):
 * - a held direction marches (a step whenever the cooldown is over);
 * - a direction CHANGE or a fresh press (after release) while the step is blocked by the
 *   cooldown or the attack wind-up is buffered until the block ends (at least
 *   INPUT_TAP_BUFFER_MS) and then gives exactly one step – so a 1-tick tap is never lost and
 *   two taps give two steps; holding the same direction for 2 ticks still gives one step.
 */
export function stepPlayer(
  e: Entity,
  dir: Dir8 | null,
  mem: PlayerMoveMemory,
  map: TileMap,
  tick: number,
  opts: PlayerMoveOptions,
  occupied?: OccupiedFn,
): StepResult {
  const tapTicks = opts.tapBufferTicks ?? msToTicks(M0.INPUT_TAP_BUFFER_MS);
  const graceTicks =
    opts.diagGraceTicks ?? (M0.DIAG_GRACE_MS > 0 ? msToTicks(M0.DIAG_GRACE_MS) : 0);
  if (dir && opts.digital && graceTicks > 0) {
    if (tryUpgrade(e, dir, mem, map, tick, opts.costs, graceTicks, occupied)) {
      mem.buffered = null;
      mem.prevDir = dir;
      return 'moved';
    }
  }
  const buf = mem.buffered && tick <= mem.buffered.until ? mem.buffered.dir : null;
  const use = dir ?? buf;
  const r = tryStep(e, use, map, opts.costs, tick, occupied);
  if (r === 'cooldown' || r === 'busy') {
    const fresh = dir && (!same(dir, mem.stepDir) || mem.prevDir === null);
    if (fresh) {
      const blockedFor = Math.max(e.moveCooldown, e.attackWindup);
      mem.buffered = { dir: dir!, until: tick + Math.max(tapTicks, blockedFor) };
    } else if (!buf) mem.buffered = null;
  } else {
    if (r === 'moved') {
      // straight step from standstill → DIAG_GRACE upgrade possible (keyboard only)
      mem.upgradable = !!opts.digital && mem.prevDir === null && (use!.x === 0 || use!.y === 0);
      mem.stepDir = use;
    }
    mem.buffered = null;
  }
  mem.prevDir = dir;
  return r;
}
