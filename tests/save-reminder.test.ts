// Save protection: export reminder thresholds, snoozes, iOS detection (injected clock).
import { describe, expect, it } from 'vitest';
import { EventBus, type GameEvents } from '../src/core/events';
import { stepGame } from '../src/core/game';
import { DEFAULT_SEED } from '../src/data/game';
import { EXPORT_REMINDER as R } from '../src/data/save-reminder';
import { emptyActions } from '../src/input/actions';
import { createSaveApi } from '../src/save/api';
import { decodeSaveCode } from '../src/save/codec';
import { gameFromSave, parseSave, saveToJson, snapshot } from '../src/save';
import { evaluateExportReminder, freshSaveMeta, type SaveMeta } from '../src/save/reminder';
import { memoryStore, readSave } from '../src/save/storage';
import {
  isIos,
  isIosNotStandalone,
  isStandalone,
  requestPersistentStorage,
} from '../src/save/storage-env';

const D = { seed: DEFAULT_SEED };
const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const T0 = 1_800_000_000_000;
const meta = (m: Partial<SaveMeta>): SaveMeta => ({ ...freshSaveMeta(), ...m });

describe('evaluateExportReminder', () => {
  it('neverExported only from 30 min playtime', () => {
    expect(
      evaluateExportReminder(meta({ playtimeSinceExportMs: 30 * MIN - 1 }), T0, false),
    ).toBeNull();
    expect(evaluateExportReminder(meta({ playtimeSinceExportMs: 30 * MIN }), T0, false)).toEqual({
      reasons: ['neverExported'],
      daysSinceExport: null,
      playtimeSinceExportMs: 30 * MIN,
    });
  });

  it('interval needs >= 3 days AND >= 30 min playtime since export', () => {
    const last = T0 - 3 * DAY;
    expect(
      evaluateExportReminder(
        meta({ lastExportAt: last + 1, playtimeSinceExportMs: 60 * MIN }),
        T0,
        false,
      ),
    ).toBeNull();
    expect(
      evaluateExportReminder(
        meta({ lastExportAt: last, playtimeSinceExportMs: 30 * MIN - 1 }),
        T0,
        false,
      ),
    ).toBeNull();
    const r = evaluateExportReminder(
      meta({ lastExportAt: last, playtimeSinceExportMs: 30 * MIN }),
      T0,
      false,
    );
    expect(r).toEqual({
      reasons: ['interval'],
      daysSinceExport: 3,
      playtimeSinceExportMs: 30 * MIN,
    });
  });

  it('snooze (24 h) blocks export reasons but not the iOS hint', () => {
    const m = meta({ playtimeSinceExportMs: 60 * MIN, exportReminderSnoozedUntil: T0 + 1 });
    expect(evaluateExportReminder(m, T0, false)).toBeNull();
    expect(evaluateExportReminder(m, T0, true)?.reasons).toEqual(['iosNotStandalone']);
    expect(evaluateExportReminder(m, T0 + 1, false)?.reasons).toEqual(['neverExported']);
  });

  it('iOS hint: shown on iOS tab, hidden until iosHintHiddenUntil, independent of snooze', () => {
    expect(evaluateExportReminder(meta({}), T0, true)?.reasons).toEqual(['iosNotStandalone']);
    const hidden = meta({ iosHintHiddenUntil: T0 + 1, playtimeSinceExportMs: 30 * MIN });
    expect(evaluateExportReminder(hidden, T0, true)?.reasons).toEqual(['neverExported']);
    expect(evaluateExportReminder(hidden, T0 + 1, true)?.reasons).toEqual([
      'neverExported',
      'iosNotStandalone',
    ]);
  });
});

function setup(iosTab = false) {
  let now = T0;
  const state = gameFromSave(null);
  const store = memoryStore();
  const bus = new EventBus<GameEvents>();
  const log: { type: string; payload: unknown }[] = [];
  for (const t of ['save:exportReminder', 'save:exported', 'save:exportSnoozed', 'saved'] as const)
    bus.on(t, (p: unknown) => log.push({ type: t, payload: p }));
  const downloads: unknown[] = [];
  const api = createSaveApi({
    getState: () => state,
    store,
    bus,
    now: () => now,
    iosNotStandalone: () => iosTab,
    download: (d) => downloads.push(d),
  });
  return { api, state, store, log, downloads, advance: (ms: number) => (now += ms) };
}

describe('saveApi', () => {
  it('playtime counts only simulation ticks (stepGame)', () => {
    const g = gameFromSave(null);
    for (let i = 0; i < 10; i++) stepGame(g, emptyActions(), 50);
    expect(g.meta.playtimeMs).toBe(500);
    expect(g.meta.playtimeSinceExportMs).toBe(500);
  });

  it('checkExportReminder emits one event with all reasons, nothing when no reason', () => {
    const s = setup(true);
    expect(s.api.checkExportReminder()?.reasons).toEqual(['iosNotStandalone']);
    s.state.meta.playtimeSinceExportMs = 30 * MIN;
    s.api.checkExportReminder();
    const ev = s.log.filter((e) => e.type === 'save:exportReminder');
    expect(ev).toHaveLength(2);
    expect((ev[1].payload as { reasons: string[] }).reasons).toEqual([
      'neverExported',
      'iosNotStandalone',
    ]);
    const quiet = setup(false);
    expect(quiet.api.checkExportReminder()).toBeNull();
    expect(quiet.log).toHaveLength(0);
  });

  it('exportFile: download, lastExportAt, reset playtimeSinceExport, saved + save:exported', async () => {
    const s = setup();
    s.state.meta.playtimeMs = s.state.meta.playtimeSinceExportMs = 40 * MIN;
    await s.api.exportFile();
    expect(s.downloads).toHaveLength(1);
    expect(s.state.meta).toMatchObject({
      lastExportAt: T0,
      playtimeSinceExportMs: 0,
      playtimeMs: 40 * MIN,
    });
    expect(readSave(s.store)?.lastExportAt).toBe(T0);
    expect(s.log.map((e) => e.type)).toEqual(['saved', 'save:exported']);
    expect(s.log[1].payload).toEqual({ method: 'file' });
    expect(s.api.checkExportReminder()).toBeNull();
  });

  it('exportCode returns a decodable code with the export recorded', async () => {
    const s = setup();
    const code = await s.api.exportCode();
    const d = await decodeSaveCode(code);
    expect(d.lastExportAt).toBe(T0);
    expect(s.log.at(-1)).toEqual({ type: 'save:exported', payload: { method: 'code' } });
  });

  it('snoozeExportReminder: 24 h quiet, then reminder again; persisted', () => {
    const s = setup();
    s.state.meta.playtimeSinceExportMs = 30 * MIN;
    s.api.snoozeExportReminder();
    expect(s.log.at(-1)).toEqual({
      type: 'save:exportSnoozed',
      payload: { until: T0 + R.snoozeMs },
    });
    expect(readSave(s.store)?.exportReminderSnoozedUntil).toBe(T0 + R.snoozeMs);
    s.advance(R.snoozeMs - 1);
    expect(s.api.checkExportReminder()).toBeNull();
    s.advance(1);
    expect(s.api.checkExportReminder()?.reasons).toEqual(['neverExported']);
  });

  it('dismissIosHint: 7 days hidden, persisted', () => {
    const s = setup(true);
    s.api.dismissIosHint();
    expect(readSave(s.store)?.iosHintHiddenUntil).toBe(T0 + R.iosHintHideMs);
    s.advance(R.iosHintHideMs - 1);
    expect(s.api.checkExportReminder()).toBeNull();
    s.advance(1);
    expect(s.api.checkExportReminder()?.reasons).toEqual(['iosNotStandalone']);
  });

  it('thresholds are the agreed values', () => {
    expect(R).toEqual({
      intervalMs: 3 * DAY,
      minPlaytimeSinceExportMs: 30 * MIN,
      snoozeMs: DAY,
      iosHintHideMs: 7 * DAY,
    });
  });
});

describe('save fields (no version bump)', () => {
  const rt = (g: ReturnType<typeof gameFromSave>) =>
    gameFromSave(parseSave(JSON.parse(saveToJson(snapshot(g, 1))), D));

  it('round-trip of all meta fields', () => {
    const g = gameFromSave(null);
    g.meta = {
      playtimeMs: 5,
      playtimeSinceExportMs: 3,
      lastExportAt: 7,
      exportReminderSnoozedUntil: 8,
      iosHintHiddenUntil: 9,
    };
    expect(rt(g).meta).toEqual(g.meta);
  });

  it('absent fields = defaults (older saves); playtimeSinceExport falls back to playtimeMs', () => {
    const g = gameFromSave(null);
    const snap = snapshot(g, 1) as unknown as Record<string, unknown>;
    delete snap.playtimeMs;
    delete snap.playtimeSinceExportMs;
    expect(gameFromSave(parseSave(snap, D)).meta).toEqual(freshSaveMeta());
    snap.playtimeMs = 99;
    expect(gameFromSave(parseSave(snap, D)).meta.playtimeSinceExportMs).toBe(99);
  });

  it('invalid values are rejected', () => {
    const snap = snapshot(gameFromSave(null), 1) as unknown as Record<string, unknown>;
    expect(() => parseSave({ ...snap, lastExportAt: 'x' }, D)).toThrow();
    expect(() => parseSave({ ...snap, playtimeMs: -1 }, D)).toThrow();
  });
});

describe('storage-env', () => {
  const nav = (n: object, standaloneMedia = false) => ({
    navigator: n,
    matchMedia: () => ({ matches: standaloneMedia }),
  });
  it('isIos: iPhone/iPad/iPod UA or MacIntel with touch', () => {
    expect(isIos(nav({ userAgent: 'Mozilla (iPhone; CPU iPhone OS 17_0)' }))).toBe(true);
    expect(isIos(nav({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 5 }))).toBe(true);
    expect(isIos(nav({ userAgent: 'Mac', platform: 'MacIntel', maxTouchPoints: 0 }))).toBe(false);
    expect(isIos(nav({ userAgent: 'Android' }))).toBe(false);
    expect(isIos({})).toBe(false);
  });
  it('isStandalone / isIosNotStandalone', () => {
    const ua = { userAgent: 'iPad' };
    expect(isStandalone(nav({ ...ua, standalone: true }))).toBe(true);
    expect(isStandalone(nav(ua, true))).toBe(true);
    expect(isIosNotStandalone(nav(ua))).toBe(true);
    expect(isIosNotStandalone(nav({ ...ua, standalone: true }))).toBe(false);
  });
  it('requestPersistentStorage: granted / denied / unsupported', async () => {
    expect(await requestPersistentStorage(nav({ storage: { persist: async () => true } }))).toBe(
      'granted',
    );
    expect(await requestPersistentStorage(nav({ storage: { persist: async () => false } }))).toBe(
      'denied',
    );
    expect(await requestPersistentStorage(nav({}))).toBe('unsupported');
  });
});
