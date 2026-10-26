import { afterEach, describe, expect, it } from 'vitest';
import { createGame, stepGame } from '../src/core/game';
import { DEFAULT_SEED } from '../src/data/game';
import { emptyActions } from '../src/input/actions';
import {
  decodeSaveCode,
  encodeSaveCode,
  gameFromSave,
  memoryStore,
  migrate,
  parseSave,
  parseSaveText,
  readSave,
  registerSaveSection,
  SAVE_VERSION,
  SaveError,
  saveToJson,
  snapshot,
  STORAGE_KEY,
  writeSave,
  type SaveData,
} from '../src/save';

const sample: SaveData = {
  version: SAVE_VERSION,
  savedAt: 1761420000000,
  seed: 0xdeadbeef,
  tick: 1234,
  rngState: { default: 42, combat: 7 },
  player: { x: 12, y: 7, facing: 'SW' },
};

const D = { seed: DEFAULT_SEED };
let cleanup: (() => void)[] = [];
afterEach(() => {
  for (const f of cleanup) f();
  cleanup = [];
});

/** Example module section: a kill counter stored in state.sections. */
function registerCounter() {
  cleanup.push(
    registerSaveSection<{ kills: number }>('counter', {
      serialize: (s) => ({ kills: (s.sections.counter as { kills: number }).kills }),
      deserialize: (raw) => {
        const k = (raw as { kills?: unknown }).kills;
        if (typeof k !== 'number' || k < 0) throw new Error('bad kills');
        return { kills: k };
      },
      fresh: () => ({ kills: 0 }),
    }),
  );
}

describe('save v3: localStorage round-trip', () => {
  it('writes and reads the same data under a versioned key', () => {
    const s = memoryStore();
    writeSave(s, sample);
    expect(STORAGE_KEY).toMatch(/v\d+$/);
    expect(s.getItem(STORAGE_KEY)).toContain(`"version":${SAVE_VERSION}`);
    expect(readSave(s)).toEqual(sample);
  });

  it('returns null for missing or corrupt saves', () => {
    const s = memoryStore();
    expect(readSave(s)).toBeNull();
    s.setItem(STORAGE_KEY, '{not json');
    expect(readSave(s)).toBeNull();
    s.setItem(STORAGE_KEY, JSON.stringify({ ...sample, player: { x: 'a', y: 1, facing: 'E' } }));
    expect(readSave(s)).toBeNull();
  });

  it('snapshot → gameFromSave restores cell, facing, seed, tick and every rng stream', () => {
    const g = createGame({ seed: 5 });
    for (let i = 0; i < 7; i++) stepGame(g, { ...emptyActions(), move: { x: 1, y: 1 } }, 50);
    g.rng.next();
    g.rng.stream('combat').next();
    g.rng.stream('loot').int(1, 6);
    const snap = parseSave(JSON.parse(JSON.stringify(snapshot(g, 1000))), D);
    const g2 = gameFromSave(snap);
    expect([g2.player.x, g2.player.y, g2.seed, g2.tick]).toEqual([
      g.player.x,
      g.player.y,
      5,
      g.tick,
    ]);
    expect(g2.player.facing).toEqual({ x: 1, y: 1 });
    expect(snap.player.facing).toBe('SE');
    expect(g2.rng.next()).toBe(g.rng.next());
    expect(g2.rng.stream('combat').next()).toBe(g.rng.stream('combat').next());
    expect(g2.rng.stream('loot').next()).toBe(g.rng.stream('loot').next());
    expect(g2.rng.stream('world').next()).toBe(g.rng.stream('world').next()); // never used: fresh
  });

  it('a saved position inside a wall falls back to spawn', () => {
    const spawn = createGame().player;
    const g = gameFromSave({ ...sample, seed: 1, player: { x: 0, y: 0, facing: 'E' } });
    expect([g.player.x, g.player.y]).toEqual([spawn.x, spawn.y]);
  });
});

describe('save: migrations', () => {
  it('v2 → current: tick 0, rngState from the seed, facing E, mode zone, no sections', () => {
    const v2 = { version: 2, savedAt: 5, player: { x: 3, y: 4 }, seed: 99 };
    const out = parseSave(v2, D);
    expect(out).toEqual({
      version: SAVE_VERSION,
      savedAt: 5,
      seed: 99,
      tick: 0,
      mode: 'zone',
      rngState: { default: 99 },
      player: { x: 3, y: 4, facing: 'E' },
    });
    // rngState from the seed = exactly a fresh game's generators
    const g = gameFromSave(out);
    expect(g.rng.next()).toBe(createGame({ seed: 99 }).rng.next());
  });

  it('v1 → current (through v2): default seed added, missing mode is zone', () => {
    const v1 = { version: 1, savedAt: 5, player: { x: 3, y: 4 } };
    expect(parseSave(v1, D)).toEqual({
      version: SAVE_VERSION,
      savedAt: 5,
      seed: DEFAULT_SEED,
      tick: 0,
      mode: 'zone',
      rngState: { default: DEFAULT_SEED },
      player: { x: 3, y: 4, facing: 'E' },
    });
  });

  it('rejects unknown, future and malformed versions / fields', () => {
    expect(() => migrate({ savedAt: 1 }, D)).toThrow(SaveError);
    expect(() => migrate({ version: 99 }, D)).toThrow(/newer/);
    expect(() => migrate([], D)).toThrow(SaveError);
    expect(() => parseSave({ ...sample, seed: -1 }, D)).toThrow(/seed/);
    expect(() => parseSave({ ...sample, savedAt: NaN }, D)).toThrow(SaveError);
    expect(() => parseSave({ ...sample, tick: 1.5 }, D)).toThrow(/tick/);
    expect(() => parseSave({ ...sample, rngState: { combat: -3 } }, D)).toThrow(/rngState/);
    expect(() => parseSave({ ...sample, player: { x: 1, y: 1, facing: 'UP' } }, D)).toThrow(
      /facing/,
    );
  });
});

describe('save: module sections (registry)', () => {
  it('round-trip with an example section', () => {
    registerCounter();
    const g = gameFromSave(null); // new game → fresh()
    expect(g.sections.counter).toEqual({ kills: 0 });
    (g.sections.counter as { kills: number }).kills = 3;
    const snap = snapshot(g, 1);
    expect(snap.counter).toEqual({ kills: 3 });
    const loaded = parseSave(JSON.parse(saveToJson(snap)), D);
    expect(gameFromSave(loaded).sections.counter).toEqual({ kills: 3 });
  });

  it('missing section in the save → fresh(); apply() is used when provided', () => {
    registerCounter();
    let applied: unknown = null;
    cleanup.push(
      registerSaveSection('applied', {
        serialize: () => ({ v: 1 }),
        deserialize: (raw) => raw,
        fresh: () => ({ v: 0 }),
        apply: (_s, v) => void (applied = v),
      }),
    );
    const g = gameFromSave(parseSave(sample, D));
    expect(g.sections.counter).toEqual({ kills: 0 });
    expect(applied).toEqual({ v: 0 });
    expect(g.sections.applied).toBeUndefined();
  });

  it('invalid section → SaveError, nothing is loaded', () => {
    registerCounter();
    expect(() => parseSave({ ...sample, counter: { kills: -1 } }, D)).toThrow(SaveError);
    expect(() => parseSave({ ...sample, counter: [1] }, D)).toThrow(/not an object/);
    const s = memoryStore();
    s.setItem(STORAGE_KEY, JSON.stringify({ ...sample, counter: { kills: 'x' } }));
    expect(readSave(s)).toBeNull();
  });

  it('unknown section in the save is ignored with a warning', () => {
    const warnings: string[] = [];
    const out = parseSave({ ...sample, mystery: { a: 1 } }, D, {
      onWarn: (m) => warnings.push(m),
    });
    expect(out).toEqual(sample);
    expect(warnings).toEqual(['Ignoring unknown save section "mystery"']);
  });

  it('section names: reserved and duplicate names are rejected', () => {
    registerCounter();
    const sec = { serialize: () => ({}), deserialize: (r: unknown) => r, fresh: () => ({}) };
    expect(() => registerSaveSection('counter', sec)).toThrow(/already/);
    expect(() => registerSaveSection('player', sec)).toThrow(/reserved/);
    expect(() => registerSaveSection('Bad name', sec)).toThrow(/Bad/);
  });
});

describe('save: export / import', () => {
  it('JSON file text round-trip', () => {
    expect(parseSaveText(saveToJson(sample))).toEqual(sample);
    expect(() => parseSaveText('nope')).toThrow(SaveError);
  });

  it('compressed text code round-trip (CompressionStream available)', async () => {
    const code = await encodeSaveCode(sample);
    expect(code.startsWith('GRA1z.')).toBe(true);
    expect(code).toMatch(/^[\w.-]+$/); // base64url, copy-paste safe
    expect(await decodeSaveCode(code)).toEqual(sample);
    expect(await decodeSaveCode(`  ${code.slice(0, 10)}\n${code.slice(10)} `)).toEqual(sample);
  });

  it('falls back to plain base64 without CompressionStream', async () => {
    const code = await encodeSaveCode(sample, {});
    expect(code.startsWith('GRA1j.')).toBe(true);
    expect(await decodeSaveCode(code, {})).toEqual(sample);
    await expect(decodeSaveCode(await encodeSaveCode(sample), {})).rejects.toThrow(SaveError);
  });

  it('rejects garbage codes', async () => {
    await expect(decodeSaveCode('hello')).rejects.toThrow(SaveError);
    await expect(decodeSaveCode('GRA1z.!!!!')).rejects.toThrow(SaveError);
    await expect(decodeSaveCode('GRA1z.AAAA')).rejects.toThrow(SaveError);
  });
});
