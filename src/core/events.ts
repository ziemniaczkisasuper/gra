import type { ContractEvents } from '../contracts/types';
import type { ExportReminder } from '../save/reminder';

/** Why the simulation is paused. 'text' = in-world text window (UI shows its own window). */
export type PauseReason = 'menu' | 'text' | 'auto';

export type SaveTrigger = PauseReason | 'manual' | 'import';

export interface GameEvents {
  paused: { reason: PauseReason };
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
