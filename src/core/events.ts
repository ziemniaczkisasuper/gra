import type { CombatEvent } from '../combat/state';
import type { ContractEvents } from '../contracts/types';
import type { ExportReminder } from '../save/reminder';

/**
 * Why the simulation is paused. 'text' = in-world text window (UI shows its own window).
 * 'tutorial' = Prologue freeze (ui-m1 §11.4): held directions are NOT reset, any direction
 * resumes without a countdown; a pause on top of it returns to 'tutorial' after its countdown.
 */
export type PauseReason = 'menu' | 'text' | 'auto' | 'tutorial';

/** Extra info for the PAUSED overlay. 'hitWhileAway' = §1.11 trigger D (or a hit during the idle E). */
export type PauseDetail = 'hitWhileAway';
export type SaveTrigger = PauseReason | 'manual' | 'import';

// --- FX trigger events (graf/assety-m1.md §13 + v1.1/v1.2 triggers) that do NOT exist yet.
// Emitted by Gameplay / Silnik / UI, never by the FX layer (render/fx-layer.ts only subscribes).
// Combat triggers (hits, kills, death, telegraph start/strike/interrupt, alert, Shock, Dash,
// Shock Pulse, Buddy Drone, boss charge lane) are read by the FX layer from getCombat(state)
// .events / combat state / getBossChargeLane (walka-m1.md §8) – they are not duplicated here.
// Payload fields: entityId – entity the FX anchors to; cells – zone / band cells; cell – a single
// cell (shaft, terminal). World grid coordinates; times in ms.

export interface FxCell {
  x: number;
  y: number;
}
export interface FxTriggerEvents {
  // Evacuation lift (Silnik / Gameplay; cell = the shaft '<')
  levelStart: { cell: FxCell };
  cooldownEnd: { cell: FxCell };
  evacCallStart: { cell: FxCell };
  evacCallInterrupted: { cell: FxCell };
  evacCallDone: { cell: FxCell; depth: 1 | 2 | 3 };
  /** R6 A: alertedIds = enemies alarmed by the arrival (fx_alert on each). */
  liftArrived: { cell: FxCell; alertedIds: readonly number[] };
  playerEvacuated: { cell: FxCell };
  liftDeparted: { cell: FxCell };
  // Boss Rail Guardian (Gameplay; entityId = boss, its top-left cell)
  bossIntro: { entityId: number };
  /** Boss telegraphs carry the kind the combat state cannot tell (swing / charge). */
  bossTelegraph: { entityId: number; kind: 'bossSwing' | 'bossCharge'; cells: readonly FxCell[] };
  chargeWallHit: { entityId: number; cells: readonly FxCell[] };
  bossStunned: { entityId: number };
  bossStunEnd: { entityId: number };
  bossSummon: { entityId: number; cells: readonly FxCell[] };
  summonedSpawn: { entityId: number };
  bossDefeated: { entityId: number; cell: FxCell };
}

export interface GameEvents extends FxTriggerEvents {
  /** PROG / Gameplay: every combat event, emitted in the tick it happened (several ticks per
   *  frame lose nothing). Same objects as getCombat(state).events (walka-m1.md §8). */
  'combat:event': { tick: number; event: CombatEvent };
  paused: { reason: PauseReason; detail?: PauseDetail };
  /** Resume countdown: emitted at start and whenever the shown digit changes (3·2·1). */
  countdown: { msLeft: number; digit: number; from: PauseReason };
  resumed: { from: PauseReason };
  /** pause('auto') hit an existing 'text' or 'menu' pause: reason kept, state still saved by the caller. */
  autoPauseSuppressed: { current: PauseReason };
  saved: { savedAt: number; trigger: SaveTrigger };
  /** Time to export the save (UI queues its window until the base). See README „Przypomnienie o eksporcie”. */
  'save:exportReminder': ExportReminder;
  /** Save exported via saveApi (lastExportAt set, playtimeSinceExport reset). */
  'save:exported': { method: 'file' | 'code' };
  /** Export reminder snoozed until `until` (Unix ms). */
  'save:exportSnoozed': { until: number };
  /**
   * QA-M0-005: the stored save could not be loaded (a new game runs). Raw text copied to
   * `backupKey` (null = copy failed). For 'newerVersion' (and a failed copy) auto-save is
   * blocked until saveApi.resolveLoadFailure() or an import.
   */
  'save:loadFailed': { reason: 'newerVersion' | 'corrupt'; backupKey: string | null };
  // --- BASE contracts (src/contracts/, owner LUZ / Pracownik 2). Emitted by the caller from the
  // events returned by applyContractEvent() / refillBoard() – the module itself is pure.
  'contract:offered': ContractEvents['contract:offered'];
  'contract:progress': ContractEvents['contract:progress'];
  'contract:objectiveMet': ContractEvents['contract:objectiveMet'];
  'contract:objectiveLost': ContractEvents['contract:objectiveLost'];
  'contract:completed': ContractEvents['contract:completed'];
  'contract:failed': ContractEvents['contract:failed'];
}

type Handler<T> = (payload: T) => void;

/** Minimal typed event bus. Handlers are called synchronously in subscription order. */
export class EventBus<E extends object = GameEvents> {
  private handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(type: K, handler: Handler<E[K]>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler as Handler<never>);
    return () => this.off(type, handler);
  }

  off<K extends keyof E>(type: K, handler: Handler<E[K]>): void {
    this.handlers.get(type)?.delete(handler as Handler<never>);
  }

  emit<K extends keyof E>(type: K, payload: E[K]): void {
    const set = this.handlers.get(type);
    if (!set) return;
    for (const h of [...set]) (h as Handler<E[K]>)(payload);
  }
}
