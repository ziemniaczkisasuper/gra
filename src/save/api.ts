// saveApi – save-protection API for PROG / UI i Menu (contract: README „Przypomnienie o eksporcie”).
// main.ts calls initSaveApi(deps) once; UI imports `saveApi` and calls its methods.
import type { EventBus, GameEvents } from '../core/events';
import type { GameState } from '../core/game';
import { EXPORT_REMINDER } from '../data/save-reminder';
import { encodeSaveCode } from './codec';
import { snapshot } from './index';
import { evaluateExportReminder, type ExportReminder } from './reminder';
import type { SaveData } from './schema';
import { writeSave, type KeyValueStore } from './storage';

export interface SaveApiDeps {
  getState(): GameState;
  store: KeyValueStore;
  bus: EventBus<GameEvents>;
  /** Injected clock (tests). Default Date.now. */
  now?: () => number;
  /** iOS browser tab detection (storage-env.ts isIosNotStandalone). */
  iosNotStandalone?: () => boolean;
  /** Browser download of the .json file (save/files.ts downloadSaveFile). */
  download?: (data: SaveData) => void;
}

export interface SaveApi {
  /** Download a .json save; sets lastExportAt, resets playtimeSinceExport, saves, emits save:exported. */
  exportFile(): Promise<void>;
  /** Text save code (UI copies it); same bookkeeping as exportFile, method 'code'. */
  exportCode(): Promise<string>;
  /** No export reasons for EXPORT_REMINDER.snoozeMs (24 h); emits save:exportSnoozed. */
  snoozeExportReminder(): void;
  /** Hide the 'iosNotStandalone' reason for EXPORT_REMINDER.iosHintHideMs (7 days). */
  dismissIosHint(): void;
  /** Evaluate now; emits save:exportReminder if there is any reason. Returns the payload or null. */
  checkExportReminder(): ExportReminder | null;
}

export function createSaveApi(deps: SaveApiDeps): SaveApi {
  const now = deps.now ?? (() => Date.now());
  const persist = (t: number): SaveData => {
    const data = snapshot(deps.getState(), t);
    writeSave(deps.store, data);
    deps.bus.emit('saved', { savedAt: t, trigger: 'manual' });
    return data;
  };
  const markExported = (): SaveData => {
    const t = now();
    const meta = deps.getState().meta;
    meta.lastExportAt = t;
    meta.playtimeSinceExportMs = 0;
    return persist(t);
  };
  return {
    async exportFile() {
      const data = markExported();
      deps.download?.(data);
      deps.bus.emit('save:exported', { method: 'file' });
    },
    async exportCode() {
      const data = markExported();
      const code = await encodeSaveCode(data);
      deps.bus.emit('save:exported', { method: 'code' });
      return code;
    },
    snoozeExportReminder() {
      const t = now();
      const until = t + EXPORT_REMINDER.snoozeMs;
      deps.getState().meta.exportReminderSnoozedUntil = until;
      persist(t);
      deps.bus.emit('save:exportSnoozed', { until });
    },
    dismissIosHint() {
      const t = now();
      deps.getState().meta.iosHintHiddenUntil = t + EXPORT_REMINDER.iosHintHideMs;
      persist(t);
    },
    checkExportReminder() {
      const r = evaluateExportReminder(
        deps.getState().meta,
        now(),
        deps.iosNotStandalone?.() ?? false,
      );
      if (r) deps.bus.emit('save:exportReminder', r);
      return r;
    },
  };
}

let impl: SaveApi | null = null;
const need = (): SaveApi => {
  if (!impl) throw new Error('saveApi not initialised (initSaveApi in main.ts)');
  return impl;
};

/** Called once by main.ts. */
export function initSaveApi(deps: SaveApiDeps): SaveApi {
  impl = createSaveApi(deps);
  return impl;
}

/** Singleton used by UI. */
export const saveApi: SaveApi = {
  exportFile: () => need().exportFile(),
  exportCode: () => need().exportCode(),
  snoozeExportReminder: () => need().snoozeExportReminder(),
  dismissIosHint: () => need().dismissIosHint(),
  checkExportReminder: () => need().checkExportReminder(),
};
