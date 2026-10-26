// Lift from base, descent `>` / arena gate, and evacuation `<`.
// Timers advance only through `advanceExpedition(state, dtMs)` (unpaused dt from the
// main loop). `stepGame` does not tick outside `zone`, and a descent confirm freezes
// the zone tick. Pause therefore freezes every countdown: the loop simply stops
// passing dt. Nothing here reads Date.now().
import { peekCombat } from '../combat/combat';
import { enterMode, type GameState } from '../core/game';
import { streamSeed } from '../core/rng';
import { M0 } from '../data/mechanics-m0';
import type { ActionState } from '../input/actions';
import { emptyActions } from '../input/actions';
import {
  computeAtRisk,
  issueTopUp,
  medPatchCountOf,
  onEvacuated,
  setInventory,
} from '../inventory/inventory';
import type { InventoryState } from '../inventory/types';
import { medPatchTopUpFor, type LightsLevel } from '../data/inventory-m1';
import { askBeforeDeeper } from '../ui/settings';
import { enemiesInAlarmRadius } from './alarm';
import { bindExpeditionHooks } from './hooks';
import { installArena, installGeneratedFloor, openInstalledShaft } from './level';
import { getExpedition, peekExpedition, type Cell, type ExpeditionState } from './state';
import {
  EVAC_ALERT_RADIUS,
  EVAC_CALL_HOLD_MS,
  EVAC_HOLD_MS,
  EVAC_RECALL_COOLDOWN_MS,
  LIFT_DEPART_MS,
  LIFT_RIDE_MS,
  LIFT_RIDE_SKIP_AFTER_MS,
  evacArriveMs,
  isZoneDepth,
  type ZoneDepth,
} from './timing';

export { getExpedition, peekExpedition };
export type { ExpeditionState };

function push<T extends ExpeditionState['pending'][number]>(ex: ExpeditionState, event: T): void {
  ex.pending.push(event);
}

function chebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function readStops(ex: ExpeditionState): ZoneDepth[] {
  const out: ZoneDepth[] = [];
  for (const stop of ex.stops) {
    if (isZoneDepth(stop) && !out.includes(stop)) out.push(stop);
  }
  return out.length > 0 ? out : [1];
}

function nextExpSeed(state: GameState, ex: ExpeditionState): number {
  ex.nonce += 1;
  let seed = streamSeed(state.seed, `expedition:${ex.nonce}`);
  if (seed === 0) seed = 1;
  if (seed === ex.expSeed) seed = (seed + 1) >>> 0 || 1;
  return seed;
}

function inventoryOf(state: GameState): InventoryState | null {
  const raw = state.sections.inventory;
  if (!raw || typeof raw !== 'object') return null;
  if (!('bag' in raw) || !('zoneCr' in raw) || !('baseCr' in raw)) return null;
  return raw as InventoryState;
}

function lightsOf(state: GameState): LightsLevel {
  for (const value of Object.values(state.sections)) {
    if (!value || typeof value !== 'object') continue;
    const record = value as Record<string, unknown>;
    for (const key of ['lights', 'lightsLevel', 'lightsAboveBase'] as const) {
      const n = record[key];
      if (n === 0 || n === 1 || n === 2 || n === 3) return n;
    }
  }
  return 0;
}

function atRiskOf(state: GameState): number {
  const inv = inventoryOf(state);
  if (!inv) return 0;
  return computeAtRisk(inv);
}

function patchesOf(state: GameState): number {
  const inv = inventoryOf(state);
  return inv ? medPatchCountOf(inv) : 0;
}

function hpOf(state: GameState): { hp: number; maxHp: number } {
  const combat = peekCombat(state);
  if (!combat) return { hp: M0.PLAYER_HP, maxHp: M0.PLAYER_HP };
  return { hp: Math.max(0, combat.player.hp), maxHp: combat.player.maxHp };
}

/** Issue tops Med-Patches up when an inventory section exists. Returns patches added. */
function applyTopUp(state: GameState, ex: ExpeditionState): number {
  const inv = inventoryOf(state);
  if (!inv) return 0;
  const topped = issueTopUp(inv, medPatchTopUpFor(lightsOf(state)));
  setInventory(state, topped.state);
  for (const event of topped.events) push(ex, event);
  if (topped.medPatchAdded > 0) {
    ex.notices = [...ex.notices, 'M1_GEAR_ISSUE_TOPUP'];
  }
  return topped.medPatchAdded;
}

function bankEvac(state: GameState, ex: ExpeditionState): void {
  // Top up first (location → zone), then onEvacuated (zone credits → base, location → base).
  applyTopUp(state, ex);
  const inv = inventoryOf(state);
  if (!inv) return;
  const banked = onEvacuated(inv);
  setInventory(state, banked.state);
  for (const event of banked.events) push(ex, event);
}

function scanShafts(state: GameState, ex: ExpeditionState): void {
  const shafts: Cell[] = [];
  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      if (state.map.tile(x, y) === '<') shafts.push({ x, y });
    }
  }
  ex.shafts = shafts;
}

/** Mark the run as an expedition (descent and `<` start working). Scans shafts. */
export function armExpedition(state: GameState): ExpeditionState {
  const ex = getExpedition(state);
  ex.active = true;
  scanShafts(state, ex);
  return ex;
}

export function setLiftStops(state: GameState, stops: readonly ZoneDepth[]): void {
  const ex = getExpedition(state);
  ex.stops = [];
  for (const stop of stops) if (isZoneDepth(stop) && !ex.stops.includes(stop)) ex.stops.push(stop);
  if (ex.stops.length === 0) ex.stops = [1];
}

function nearestShaft(state: GameState, ex: ExpeditionState): Cell | null {
  const here = { x: state.player.x, y: state.player.y };
  let best: Cell | null = null;
  let bestD = Infinity;
  for (const shaft of ex.shafts) {
    const d = chebyshev(here, shaft);
    if (d < bestD) {
      best = shaft;
      bestD = d;
    }
  }
  return best;
}

function inCallRange(state: GameState, ex: ExpeditionState): Cell | null {
  const here = { x: state.player.x, y: state.player.y };
  let best: Cell | null = null;
  let bestD = Infinity;
  for (const shaft of ex.shafts) {
    const d = chebyshev(here, shaft);
    if (d === 0 || d > 1) continue;
    if (d < bestD) {
      best = shaft;
      bestD = d;
    }
  }
  return best;
}

function playerOnShaft(state: GameState): boolean {
  return state.map.tile(state.player.x, state.player.y) === '<';
}

function beginZoneRide(state: GameState, ex: ExpeditionState, depth: ZoneDepth): void {
  ex.active = true;
  ex.lift.phase = 'ride';
  ex.lift.toZone = true;
  ex.lift.ms = 0;
  ex.lift.destination = depth;
  ex.rideTextId = null;
  enterMode(state, 'lift');
}

/** USE on the base lift. One unlocked stop rides at once; more than one opens the picker. */
export function useBaseLift(state: GameState): void {
  const ex = getExpedition(state);
  if (state.mode !== 'base' || ex.lift.phase !== 'idle') return;
  ex.active = true;
  const stops = readStops(ex);
  if (stops.length > 1) {
    ex.lift.phase = 'picker';
    ex.lift.focus = stops.includes(ex.lift.focus) ? ex.lift.focus : stops[0]!;
    ex.lift.toZone = false;
    enterMode(state, 'lift');
    return;
  }
  beginZoneRide(state, ex, stops[0] ?? 1);
}

export function setLiftFocus(state: GameState, depth: ZoneDepth): void {
  const ex = getExpedition(state);
  if (ex.lift.phase !== 'picker') return;
  if (!readStops(ex).includes(depth)) return;
  ex.lift.focus = depth;
}

export function chooseLiftStop(state: GameState, depth: ZoneDepth): boolean {
  const ex = getExpedition(state);
  if (ex.lift.phase !== 'picker') return false;
  if (!readStops(ex).includes(depth)) return false;
  beginZoneRide(state, ex, depth);
  return true;
}

export function cancelLiftPicker(state: GameState): void {
  const ex = getExpedition(state);
  if (ex.lift.phase !== 'picker') return;
  ex.lift.phase = 'idle';
  enterMode(state, 'base');
}

function arriveInZone(state: GameState, ex: ExpeditionState): void {
  const depth = ex.lift.destination;
  const seed = nextExpSeed(state, ex);
  installGeneratedFloor(state, ex, depth, seed);
  ex.lift.phase = 'idle';
  ex.lift.toZone = false;
  ex.lift.ms = 0;
  ex.evac.phase = 'idle';
  ex.evac.holdMs = 0;
  ex.evac.msLeft = 0;
  ex.rideTextId = null;
  enterMode(state, 'zone');
  applyTopUp(state, ex);
  if (ex.entry) push(ex, { type: 'levelStart', cell: { ...ex.entry } });
}

function kindAt(ex: ExpeditionState, tile: string): 'stairs' | 'gate' | null {
  if (ex.inArena) return null;
  if (tile === 'G') return ex.depth >= 3 ? 'gate' : null;
  if (tile !== '>') return null;
  // Depth 3 has no deeper generated floor. `>` there is the arena gate, same as `G`.
  return ex.depth >= 3 ? 'gate' : 'stairs';
}

function needsConfirm(state: GameState): boolean {
  return askBeforeDeeper() && atRiskOf(state) > 0;
}

function openConfirm(state: GameState, ex: ExpeditionState, kind: 'stairs' | 'gate'): void {
  const hp = hpOf(state);
  ex.confirm = {
    kind,
    textId: kind === 'gate' ? 'M1_RISK_01B' : 'M1_RISK_01',
    yesId: kind === 'gate' ? 'M1_RISK_01B_YES' : 'M1_RISK_01_YES',
    noId: 'M1_RISK_01_NO',
    focus: 'stay',
    atRisk: atRiskOf(state),
    hp: hp.hp,
    maxHp: hp.maxHp,
    patches: patchesOf(state),
  };
  ex.worldPaused = true;
  ex.pauseRequested = true;
  ex.inputsCleared = true;
}

function descendNow(state: GameState, ex: ExpeditionState, kind: 'stairs' | 'gate'): void {
  ex.confirm = null;
  ex.worldPaused = false;
  ex.pauseRequested = false;
  ex.descentLatch = false;
  ex.evac.phase = 'idle';
  ex.evac.holdMs = 0;
  ex.evac.msLeft = 0;
  ex.hud = null;
  if (kind === 'gate') {
    installArena(state, ex);
    return;
  }
  const next = ex.depth + 1;
  const depth: ZoneDepth = next >= 3 ? 3 : next === 2 ? 2 : 1;
  // `>` on depth 1 or 2. Depth 3 is the gate branch above.
  if (ex.depth >= 3) {
    installArena(state, ex);
    return;
  }
  installGeneratedFloor(state, ex, depth, nextExpSeed(state, ex));
}

/** GO DOWN / GO IN. Safe to call when no window is open (immediate descent). */
export function confirmGoDown(state: GameState): void {
  const ex = getExpedition(state);
  const kind = ex.confirm?.kind ?? kindAt(ex, state.map.tile(state.player.x, state.player.y));
  if (!kind) return;
  descendNow(state, ex, kind);
}

/** STAY: stay on the same cell, do not change depth, latch the window. */
export function stayDescent(state: GameState): void {
  const ex = getExpedition(state);
  if (!ex.confirm) return;
  ex.confirm = null;
  ex.worldPaused = false;
  ex.pauseRequested = false;
  ex.descentLatch = true;
  ex.latchX = state.player.x;
  ex.latchY = state.player.y;
}

export function setDescentFocus(state: GameState, focus: 'stay' | 'go'): void {
  const ex = getExpedition(state);
  if (!ex.confirm) return;
  ex.confirm.focus = focus;
}

export function acceptDescent(state: GameState): void {
  const ex = getExpedition(state);
  if (!ex.confirm) return;
  if (ex.confirm.focus === 'go') confirmGoDown(state);
  else stayDescent(state);
}

function onZoneStep(state: GameState, actions: ActionState): boolean {
  const ex = peekExpedition(state);
  if (!ex?.active) return false;
  if (ex.confirm) return true;
  const tile = state.map.tile(state.player.x, state.player.y);
  const kind = kindAt(ex, tile);
  const useEdge = actions.use && !ex.prevUse;
  if (!kind) {
    ex.descentLatch = false;
    ex.prevUse = actions.use;
    return false;
  }
  const entered = !ex.descentLatch || ex.latchX !== state.player.x || ex.latchY !== state.player.y;
  if (!entered && !useEdge) {
    ex.prevUse = actions.use;
    return false;
  }
  ex.latchX = state.player.x;
  ex.latchY = state.player.y;
  if (needsConfirm(state)) openConfirm(state, ex, kind);
  else descendNow(state, ex, kind);
  ex.prevUse = actions.use;
  return true;
}

/** True when some enemy is in CHASE/ATTACK (resume counts down 1 s). Boss chase counts too. */
export function engagedThreat(state: GameState): boolean {
  const combat = peekCombat(state);
  if (!combat) return false;
  for (const enemy of combat.enemies.values()) {
    if (enemy.ai === 'chase' || enemy.ai === 'attack') return true;
  }
  return combat.boss?.phase === 'chase';
}

function livingEnemies(state: GameState): { id: number; x: number; y: number }[] {
  const combat = peekCombat(state);
  if (!combat) return [];
  const out: { id: number; x: number; y: number }[] = [];
  for (const [id, enemy] of combat.enemies) {
    if (enemy.hp <= 0 || enemy.ai === 'dead') continue;
    const entity = state.entities.find((e) => e.id === id);
    if (!entity) continue;
    out.push({ id, x: entity.x, y: entity.y });
  }
  return out;
}

function terrainPassable(state: GameState): (x: number, y: number) => boolean {
  return (x, y) => {
    if (state.map.tile(x, y) === '<') return false;
    return !state.map.isSolid(x, y);
  };
}

function raiseAlarm(state: GameState, ex: ExpeditionState, shaft: Cell): void {
  const ids = enemiesInAlarmRadius(
    state.map.width,
    state.map.height,
    terrainPassable(state),
    shaft,
    livingEnemies(state),
    EVAC_ALERT_RADIUS,
  );
  ex.alarmIds = ids;
  ex.notices = ['M1_BASE_06', 'M1_SYS_05'];
  push(ex, { type: 'liftArrived', cell: { ...shaft }, alertedIds: ids });
}

function cancelReason(actions: ActionState): ExpeditionState['evac']['lastInterrupt'] {
  if (actions.move.x !== 0 || actions.move.y !== 0) return 'move';
  if (actions.attack || actions.aimFire) return 'attack';
  if (actions.skill1 || actions.skill2 || actions.skill3) return 'skill';
  if (!actions.use) return 'release';
  return null;
}

function interruptCall(
  ex: ExpeditionState,
  reason: NonNullable<ExpeditionState['evac']['lastInterrupt']>,
): void {
  const shaft = ex.evac.shaft;
  ex.evac.phase = 'idle';
  ex.evac.holdMs = 0;
  ex.evac.msLeft = 0;
  ex.evac.lastInterrupt = reason;
  ex.hud = null;
  if (shaft) push(ex, { type: 'evacCallInterrupted', cell: { ...shaft } });
}

function beginArriving(ex: ExpeditionState, depth: ZoneDepth): void {
  const shaft = ex.evac.shaft ?? { x: 0, y: 0 };
  ex.evac.phase = 'arriving';
  ex.evac.holdMs = EVAC_CALL_HOLD_MS;
  ex.evac.msLeft = evacArriveMs(depth);
  ex.hud = { textId: 'M1_UI_LIFT_COMING', seconds: Math.max(1, Math.ceil(ex.evac.msLeft / 1000)) };
  push(ex, { type: 'evacCallDone', cell: { ...shaft }, depth });
}

function beginOpen(state: GameState, ex: ExpeditionState): void {
  const shaft = ex.evac.shaft ??
    nearestShaft(state, ex) ?? { x: state.player.x, y: state.player.y };
  ex.evac.phase = 'open';
  ex.evac.msLeft = EVAC_HOLD_MS;
  ex.hud = { textId: 'M1_UI_LIFT_HERE', seconds: Math.ceil(ex.evac.msLeft / 1000) };
  raiseAlarm(state, ex, shaft);
}

function beginCabin(ex: ExpeditionState, cell: Cell): void {
  ex.evac.phase = 'cabin';
  ex.evac.msLeft = LIFT_DEPART_MS;
  ex.hud = null;
  push(ex, { type: 'playerEvacuated', cell: { ...cell } });
}

function beginReturnRide(state: GameState, ex: ExpeditionState, cell: Cell): void {
  ex.evac.phase = 'ride';
  ex.evac.rideMs = 0;
  ex.evac.msLeft = 0;
  ex.rideTextId = 'M1_BASE_05';
  ex.hud = null;
  enterMode(state, 'lift');
  push(ex, { type: 'liftDeparted', cell: { ...cell } });
}

function finishEvac(state: GameState, ex: ExpeditionState): void {
  bankEvac(state, ex);
  ex.evac.phase = 'idle';
  ex.evac.msLeft = 0;
  ex.evac.holdMs = 0;
  ex.evac.rideMs = 0;
  ex.evac.shaft = null;
  ex.hud = null;
  ex.worldPaused = false;
  ex.inArena = false;
  enterMode(state, 'report');
}

function beginCooldown(ex: ExpeditionState): void {
  ex.evac.phase = 'cooldown';
  ex.evac.msLeft = EVAC_RECALL_COOLDOWN_MS;
  ex.hud = null;
  ex.notices = ['M1_BASE_07'];
}

function syncHud(ex: ExpeditionState): void {
  if (ex.evac.phase === 'arriving') {
    ex.hud = {
      textId: 'M1_UI_LIFT_COMING',
      seconds: Math.max(1, Math.ceil(ex.evac.msLeft / 1000)),
    };
  } else if (ex.evac.phase === 'open') {
    ex.hud = {
      textId: 'M1_UI_LIFT_HERE',
      seconds: Math.max(0, Math.ceil(ex.evac.msLeft / 1000)),
    };
  }
}

function tryStartCall(state: GameState, ex: ExpeditionState, actions: ActionState): boolean {
  if (ex.evac.phase !== 'idle') return false;
  if (!actions.use) return false;
  if (cancelReason(actions)) return false;
  const shaft = inCallRange(state, ex);
  if (!shaft) return false;
  ex.evac.phase = 'calling';
  ex.evac.holdMs = 0;
  ex.evac.shaft = shaft;
  ex.evac.lastInterrupt = null;
  push(ex, { type: 'evacCallStart', cell: { ...shaft } });
  return true;
}

function updateEvac(state: GameState, ex: ExpeditionState, dt: number, actions: ActionState): void {
  let left = dt;
  for (let guard = 0; guard < 6; guard++) {
    const phase = ex.evac.phase;
    if (phase === 'cooldown') {
      const step = Math.min(left, ex.evac.msLeft);
      ex.evac.msLeft -= step;
      left -= step;
      if (ex.evac.msLeft <= 0) {
        const shaft = ex.evac.shaft;
        ex.evac.phase = 'idle';
        ex.evac.msLeft = 0;
        ex.notices = ex.notices.filter((id) => id !== 'M1_BASE_07');
        if (shaft) push(ex, { type: 'cooldownEnd', cell: { ...shaft } });
        // A USE held through the cooldown does not start the next call in this same dt.
      }
      break;
    }
    if (phase === 'idle') {
      if (tryStartCall(state, ex, actions)) continue;
      break;
    }
    if (phase === 'calling') {
      // Damage is intentionally not a reason (EVAC_CALL_INTERRUPT_ON_DAMAGE = false).
      const reason = cancelReason(actions);
      if (reason) {
        interruptCall(ex, reason);
        break;
      }
      const need = EVAC_CALL_HOLD_MS - ex.evac.holdMs;
      const step = Math.min(left, need);
      ex.evac.holdMs += step;
      left -= step;
      if (ex.evac.holdMs >= EVAC_CALL_HOLD_MS) {
        const depth: ZoneDepth = ex.inArena ? 3 : ex.depth;
        beginArriving(ex, depth);
        continue;
      }
      break;
    }
    if (phase === 'arriving') {
      const step = Math.min(left, ex.evac.msLeft);
      ex.evac.msLeft -= step;
      left -= step;
      syncHud(ex);
      if (ex.evac.msLeft <= 0) {
        beginOpen(state, ex);
        continue;
      }
      break;
    }
    if (phase === 'open') {
      if (playerOnShaft(state)) {
        beginCabin(ex, { x: state.player.x, y: state.player.y });
        continue;
      }
      const step = Math.min(left, ex.evac.msLeft);
      ex.evac.msLeft -= step;
      left -= step;
      syncHud(ex);
      if (ex.evac.msLeft <= 0) {
        beginCooldown(ex);
        continue;
      }
      break;
    }
    if (phase === 'cabin') {
      const step = Math.min(left, ex.evac.msLeft);
      ex.evac.msLeft -= step;
      left -= step;
      if (ex.evac.msLeft <= 0) {
        const cell = ex.evac.shaft ?? { x: state.player.x, y: state.player.y };
        beginReturnRide(state, ex, cell);
        continue;
      }
      break;
    }
    if (phase === 'ride') {
      ex.evac.rideMs += left;
      left = 0;
      if (ex.evac.rideMs >= LIFT_RIDE_MS) finishEvac(state, ex);
      break;
    }
    break;
  }
  syncHud(ex);
}

export interface AdvanceOptions {
  /**
   * A hit landed this step. Recorded so callers can show the case; it does not
   * cancel the hold (mechaniki §2.9, EVAC_CALL_INTERRUPT_ON_DAMAGE = false).
   */
  playerDamaged?: boolean;
}

/** Advance lift and evac timers by unpaused dt. No-op while the descent confirm is up. */
export function advanceExpedition(
  state: GameState,
  dtMs: number,
  actions: ActionState = emptyActions(),
  opts: AdvanceOptions = {},
): void {
  const ex = getExpedition(state);
  // A hit during the hold is visible to the caller and is not an interrupt.
  if (opts.playerDamaged) ex.evac.lastInterrupt = null;
  if (!ex.active || ex.worldPaused) {
    ex.prevUse = actions.use;
    return;
  }
  const dt = Math.max(0, dtMs);
  if (ex.lift.phase === 'ride' && ex.lift.toZone) {
    ex.lift.ms += dt;
    if (ex.lift.ms >= LIFT_RIDE_MS) arriveInZone(state, ex);
  } else if (state.mode === 'zone' || ex.evac.phase === 'ride' || ex.evac.phase === 'cabin') {
    updateEvac(state, ex, dt, actions);
  }
  ex.prevUse = actions.use;
}

/** Skip the ride down to base once 500 ms have passed. Outbound rides do not skip. */
export function skipReturnRide(state: GameState): boolean {
  const ex = peekExpedition(state);
  if (!ex || ex.evac.phase !== 'ride') return false;
  if (ex.evac.rideMs < LIFT_RIDE_SKIP_AFTER_MS) return false;
  finishEvac(state, ex);
  return true;
}

/** After the boss arena, the extra shaft (`X`) becomes `<`. */
export function openArenaShaft(state: GameState): boolean {
  const ex = getExpedition(state);
  return openInstalledShaft(state, ex);
}

/** Report → base. The report screen (another task) calls this on CONTINUE. */
export function finishReport(state: GameState): void {
  if (state.mode !== 'report') return;
  enterMode(state, 'base');
  const ex = getExpedition(state);
  ex.lift.phase = 'idle';
  ex.lift.toZone = false;
  ex.rideTextId = null;
  ex.evac.phase = 'idle';
  ex.hud = null;
}

export function drainExpeditionEvents(state: GameState): ExpeditionState['pending'] {
  const ex = peekExpedition(state);
  if (!ex) return [];
  const events = ex.pending;
  ex.pending = [];
  return events;
}

/** One-shot: the main loop should pause ('text') and clear inputs. */
export function takeSimPause(state: GameState): boolean {
  const ex = peekExpedition(state);
  if (!ex?.pauseRequested) return false;
  ex.pauseRequested = false;
  return true;
}

/** 10-cell (HUD) or 5-cell (USE button) hold bar. `progress` is 0..1. */
export function evacHoldBar(progress: number, cells = 10): string {
  const n = Math.max(0, cells);
  const filled = Math.max(0, Math.min(n, Math.round(progress * n)));
  // A full hold fills every cell. Rounding matches 10 × 100 ms steps.
  const count = progress >= 1 ? n : filled;
  return '#'.repeat(count) + '-'.repeat(n - count);
}

export function holdProgress(state: GameState): number {
  const ex = peekExpedition(state);
  if (!ex || ex.evac.phase !== 'calling') return 0;
  return Math.max(0, Math.min(1, ex.evac.holdMs / EVAC_CALL_HOLD_MS));
}

function shaftBlocks(state: GameState, x: number, y: number): boolean {
  const ex = peekExpedition(state);
  if (!ex?.active) return false;
  if (state.map.tile(x, y) !== '<') return false;
  return ex.evac.phase !== 'open';
}

function controlsLocked(state: GameState): boolean {
  const phase = peekExpedition(state)?.evac.phase;
  return phase === 'cabin' || phase === 'ride';
}

bindExpeditionHooks({
  frozen: (state) => peekExpedition(state)?.worldPaused === true,
  controlsLocked,
  blocksShaft: shaftBlocks,
  onZoneStep,
});
