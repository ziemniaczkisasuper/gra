// Game start from the stored save (QA-M0-005): never lose a save that cannot be loaded.
import type { GameState, NewGameOptions } from '../core/game';
import type { LoadFailure } from './api';
import { gameFromSave } from './index';
import { failLoad, loadSave, STORAGE_KEY, type KeyValueStore, type LoadOptions } from './storage';

/**
 * Loads the stored save into a GameState, or a new game when there is none / it fails.
 * On failure: raw copy in a backup key, writes blocked for a newer version (storage.ts),
 * `failure` returned for save:loadFailed (main.ts → saveApi.reportLoadFailure).
 */
export function loadGame(
  store: KeyValueStore,
  game: NewGameOptions = {},
  opts: LoadOptions = {},
): { state: GameState; failure: LoadFailure | null } {
  const r = loadSave(store, opts);
  if (r.status === 'empty') return { state: gameFromSave(null, game), failure: null };
  if (r.status === 'failed')
    return {
      state: gameFromSave(null, game),
      failure: { reason: r.reason, backupKey: r.backupKey },
    };
  try {
    return { state: gameFromSave(r.data, game), failure: null };
  } catch (e) {
    // valid JSON + schema, but a module could not apply it (e.g. map changed) → corrupt
    (opts.warn ?? ((m: string, x?: unknown) => console.warn(m, x)))(
      'Save could not be applied:',
      e,
    );
    let text = '';
    try {
      text = store.getItem(STORAGE_KEY) ?? '';
    } catch {
      /* unreachable: loadSave read it */
    }
    const f = failLoad(store, text, 'corrupt', String((e as Error)?.message ?? e), opts);
    return {
      state: gameFromSave(null, game),
      failure: { reason: f.reason, backupKey: f.backupKey },
    };
  }
}
