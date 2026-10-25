import { DEFAULT_SEED } from '../data/game';
import { parseSave, type SaveData } from './schema';

/**
 * localStorage key. The trailing number is the storage SLOT FORMAT generation (not the
 * schema version, which lives inside the JSON and is handled by migrations).
 */
export const STORAGE_KEY = 'gra.save.v1';

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

export function writeSave(store: KeyValueStore, data: SaveData): void {
  store.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** Returns null when there is no save; null + console warning when it is corrupt. */
export function readSave(store: KeyValueStore): SaveData | null {
  let text: string | null;
  try {
    text = store.getItem(STORAGE_KEY);
  } catch {
    return null; // storage disabled (private mode etc.)
  }
  if (text === null) return null;
  try {
    return parseSave(JSON.parse(text), { seed: DEFAULT_SEED });
  } catch (e) {
    console.warn('Ignoring corrupt save:', e);
    return null;
  }
}
