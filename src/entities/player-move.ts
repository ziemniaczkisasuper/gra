// Player step per tick (mechaniki §1.2): march, buffered direction changes during the cooldown.
import { M0, msToTicks } from '../data/mechanics-m0';
import type { Dir8 } from '../input/actions';
import type { OccupiedFn } from '../world/collision';
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
}

export const freshPlayerMoveMemory = (): PlayerMoveMemory => ({
  prevDir: null,
  stepDir: null,
  buffered: null,
});

export interface PlayerMoveOptions {
  costs: StepCosts;
  /** Minimum lifetime of a buffered tap (INPUT_TAP_BUFFER_MS in ticks). */
  tapBufferTicks?: number;
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
    if (r === 'moved') mem.stepDir = use;
    mem.buffered = null;
  }
  mem.prevDir = dir;
  return r;
}
