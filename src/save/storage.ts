import { DEFAULT_SEED } from '../data/game';
import { parseSave, SaveError, type SaveData, type SaveFailReason } from './schema';

/**
 * localStorage key. The trailing number is the storage SLOT FORMAT generation (not the
 * schema version, which lives inside the JSON and is handled by migrations).
 */
export const STORAGE_KEY = 'gra.save.v1';
/** QA-M0-005: raw copies of saves that could not be loaded: `<STORAGE_KEY>.backup-<ms>`. */
export const BACKUP_PREFIX = `${STORAGE_KEY}.backup-`;
/** JSON list of backup keys, oldest first (KeyValueStore cannot enumerate keys). */
export const BACKUP_INDEX_KEY = `${STORAGE_KEY}.backups`;
export const MAX_SAVE_BACKUPS = 3;

export type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, String(v)),
    removeItem: (k) => void m.delete(k),
  };
}

// ---- write lock (QA-M0-005) ------------------------------------------------------------------
const locks = new WeakMap<KeyValueStore, SaveFailReason>();

/** Stop every writeSave() to this store (the stored save must survive until the player decides). */
export function blockSaveWrites(store: KeyValueStore, reason: SaveFailReason): void {
  locks.set(store, reason);
}
/** Player decided (overwrite / import): writes allowed again. */
export function unblockSaveWrites(store: KeyValueStore): void {
  locks.delete(store);
}
export function saveWritesBlocked(store: KeyValueStore): SaveFailReason | null {
  return locks.get(store) ?? null;
}

/** Writes the save; returns false (nothing written) while writes are blocked. */
export function writeSave(store: KeyValueStore, data: SaveData): boolean {
  if (locks.has(store)) return false;
  store.setItem(STORAGE_KEY, JSON.stringify(data));
  return true;
}

/** Returns null when there is no save; null + console warning when it is corrupt. No backup. */
export function readSave(store: KeyValueStore): SaveData | null {
  const r = loadSave(store, { backup: false, warn: (m, e) => console.warn(m, e) });
  return r.status === 'ok' ? r.data : null;
}

export type LoadResult =
  | { status: 'empty' }
  | { status: 'ok'; data: SaveData }
  | { status: 'failed'; reason: SaveFailReason; backupKey: string | null; error: string };

export interface LoadOptions {
  /** Clock for the backup key (tests). Default Date.now. */
  now?: () => number;
  /** Copy the raw text to a backup key on failure. Default true. */
  backup?: boolean;
  warn?: (msg: string, err?: unknown) => void;
}

/**
 * Reads + validates the stored save (QA-M0-005). On failure the raw text is copied to
 * `<STORAGE_KEY>.backup-<ms>` (max MAX_SAVE_BACKUPS, oldest dropped; the same text is not copied
 * twice) and writes are BLOCKED for a newer-version save, or when the copy failed – the caller
 * reports `save:loadFailed` and unblocks after the player's decision.
 */
export function loadSave(store: KeyValueStore, opts: LoadOptions = {}): LoadResult {
  const warn = opts.warn ?? ((m: string, e?: unknown) => console.warn(m, e));
  let text: string | null;
  try {
    text = store.getItem(STORAGE_KEY);
  } catch {
    return { status: 'empty' }; // storage disabled (private mode etc.)
  }
  if (text === null) return { status: 'empty' };
  try {
    return { status: 'ok', data: parseSave(JSON.parse(text), { seed: DEFAULT_SEED }) };
  } catch (e) {
    const reason: SaveFailReason = e instanceof SaveError ? e.reason : 'corrupt';
    warn(`Save could not be loaded (${reason}):`, e);
    return failLoad(store, text, reason, String((e as Error)?.message ?? e), opts);
  }
}

/** Failure path shared with main.ts (save parsed but could not be applied → 'corrupt'). */
export function failLoad(
  store: KeyValueStore,
  text: string,
  reason: SaveFailReason,
  error: string,
  opts: LoadOptions = {},
): Extract<LoadResult, { status: 'failed' }> {
  const backupKey =
    opts.backup === false ? null : backupRawSave(store, text, opts.now?.() ?? Date.now());
  if (opts.backup !== false && (reason === 'newerVersion' || backupKey === null))
    blockSaveWrites(store, reason);
  return { status: 'failed', reason, backupKey, error };
}

function readIndex(store: KeyValueStore): string[] {
  try {
    const v: unknown = JSON.parse(store.getItem(BACKUP_INDEX_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

/** Copies `text` to a backup key; returns the key (existing one if the same text) or null. */
export function backupRawSave(store: KeyValueStore, text: string, now: number): string | null {
  try {
    const index = readIndex(store).filter((k) => store.getItem(k) !== null);
    for (const k of index) if (store.getItem(k) === text) return k;
    let key = `${BACKUP_PREFIX}${now}`;
    for (let n = 1; index.includes(key) || store.getItem(key) !== null; n++)
      key = `${BACKUP_PREFIX}${now}-${n}`;
    store.setItem(key, text);
    index.push(key);
    while (index.length > MAX_SAVE_BACKUPS) store.removeItem(index.shift()!);
    store.setItem(BACKUP_INDEX_KEY, JSON.stringify(index));
    return key;
  } catch {
    return null; // quota / storage disabled
  }
}

/** Backup keys, oldest first. */
export function listSaveBackups(store: KeyValueStore): string[] {
  return readIndex(store).filter((k) => store.getItem(k) !== null);
}
