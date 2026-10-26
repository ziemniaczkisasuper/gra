// QA-M0-005 regression: a newer-version or corrupt save is never silently overwritten.
import { describe, expect, it } from 'vitest';
import { EventBus, type GameEvents } from '../src/core/events';
import { createSaveApi } from '../src/save/api';
import { loadGame } from '../src/save/boot';
import { SAVE_VERSION, snapshot } from '../src/save';
import {
  BACKUP_INDEX_KEY,
  BACKUP_PREFIX,
  listSaveBackups,
  loadSave,
  MAX_SAVE_BACKUPS,
  memoryStore,
  saveWritesBlocked,
  STORAGE_KEY,
  writeSave,
} from '../src/save/storage';

const quiet = { warn: () => {} };
const newerSave = JSON.stringify({
  version: SAVE_VERSION + 1,
  savedAt: 1,
  player: { x: 30, y: 15 },
});

function setup(raw: string | null, now = 1000) {
  const store = memoryStore();
  if (raw !== null) store.setItem(STORAGE_KEY, raw);
  const { state, failure } = loadGame(store, {}, { ...quiet, now: () => now });
  const bus = new EventBus<GameEvents>();
  const events: unknown[] = [];
  bus.on('save:loadFailed', (p) => events.push(p));
  const api = createSaveApi({ getState: () => state, store, bus, now: () => now });
  if (failure) api.reportLoadFailure(failure);
  return { store, state, failure, api, events };
}

describe('QA-M0-005: newer / corrupt save protection', () => {
  it('newer version: backup copy, event, auto-save blocked, original kept', () => {
    const s = setup(newerSave);
    expect(s.failure).toEqual({ reason: 'newerVersion', backupKey: `${BACKUP_PREFIX}1000` });
    expect(s.events).toEqual([{ reason: 'newerVersion', backupKey: `${BACKUP_PREFIX}1000` }]);
    expect(s.store.getItem(`${BACKUP_PREFIX}1000`)).toBe(newerSave);
    expect(saveWritesBlocked(s.store)).toBe('newerVersion');
    // what the first auto-pause does (main.ts save())
    expect(writeSave(s.store, snapshot(s.state, 2000))).toBe(false);
    expect(s.store.getItem(STORAGE_KEY)).toBe(newerSave);
    // exports still work, but do not overwrite the slot
    s.api.snoozeExportReminder();
    expect(s.store.getItem(STORAGE_KEY)).toBe(newerSave);
  });

  it("player's decision (resolveLoadFailure) unblocks and saves the new game", () => {
    const s = setup(newerSave);
    s.api.resolveLoadFailure();
    expect(saveWritesBlocked(s.store)).toBeNull();
    expect(s.api.getLoadFailure()).toBeNull();
    expect(JSON.parse(s.store.getItem(STORAGE_KEY)!).version).toBe(SAVE_VERSION);
    expect(s.store.getItem(`${BACKUP_PREFIX}1000`)).toBe(newerSave); // copy stays
  });

  it.each([
    ['garbage', '{not json'],
    ['bad field', JSON.stringify({ version: 3, savedAt: 1, seed: 1, tick: -5 })],
    ['array', '[]'],
  ])('corrupt (%s): backup + event, writes allowed (raw text is safe)', (_n, raw) => {
    const s = setup(raw);
    expect(s.failure).toEqual({ reason: 'corrupt', backupKey: `${BACKUP_PREFIX}1000` });
    expect(s.store.getItem(`${BACKUP_PREFIX}1000`)).toBe(raw);
    expect(saveWritesBlocked(s.store)).toBeNull();
    expect(writeSave(s.store, snapshot(s.state, 2000))).toBe(true);
  });

  it('corrupt and the copy fails (quota): writes blocked too', () => {
    const store = memoryStore();
    store.setItem(STORAGE_KEY, '{x');
    const set = store.setItem;
    store.setItem = (k, v) => {
      if (k.startsWith(BACKUP_PREFIX)) throw new Error('QuotaExceededError');
      set(k, v);
    };
    const r = loadSave(store, quiet);
    expect(r).toMatchObject({ status: 'failed', reason: 'corrupt', backupKey: null });
    expect(saveWritesBlocked(store)).toBe('corrupt');
  });

  it('max 3 backups (oldest dropped), the same text is not copied twice', () => {
    const store = memoryStore();
    for (let i = 0; i < 5; i++) {
      store.setItem(STORAGE_KEY, `{bad ${i}`);
      loadSave(store, { ...quiet, now: () => 100 + i });
      loadSave(store, { ...quiet, now: () => 200 + i }); // reload with the same text
    }
    const keys = listSaveBackups(store);
    expect(keys).toEqual([102, 103, 104].map((t) => `${BACKUP_PREFIX}${t}`));
    expect(keys.length).toBe(MAX_SAVE_BACKUPS);
    expect(store.getItem(`${BACKUP_PREFIX}100`)).toBeNull();
    expect(JSON.parse(store.getItem(BACKUP_INDEX_KEY)!)).toEqual(keys);
  });

  it('empty / valid saves: no failure, no backup, no lock', () => {
    expect(setup(null).failure).toBeNull();
    const store = memoryStore();
    const a = loadGame(store).state;
    writeSave(store, snapshot(a, 1));
    const s = setup(store.getItem(STORAGE_KEY));
    expect(s.failure).toBeNull();
    expect(listSaveBackups(s.store)).toEqual([]);
    expect(saveWritesBlocked(s.store)).toBeNull();
  });
});
