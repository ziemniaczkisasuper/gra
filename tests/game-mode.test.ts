import { describe, expect, it } from 'vitest';
import { createGame, enterMode, stepGame, type GameMode } from '../src/core/game';
import { DEFAULT_SEED } from '../src/data/game';
import { emptyActions } from '../src/input/actions';
import {
  gameFromSave,
  memoryStore,
  parseSave,
  registerSaveSection,
  SaveError,
  snapshot,
  startNewGame,
  STORAGE_KEY,
} from '../src/save';
import { loadGame } from '../src/save/boot';

const D = { seed: DEFAULT_SEED };
const step = (state: Parameters<typeof stepGame>[0]) => stepGame(state, emptyActions(), 50);

describe('game mode', () => {
  it('startNewGame begins in the base and stepGame does not tick', () => {
    const g = startNewGame();
    expect(g.mode).toBe('base');
    expect(g.tick).toBe(0);
    step(g);
    expect(g.tick).toBe(0);
    expect(g.meta.playtimeMs).toBe(0);
  });

  it('createGame defaults to zone so existing simulation tests keep ticking', () => {
    const g = createGame();
    expect(g.mode).toBe('zone');
    step(g);
    expect(g.tick).toBe(1);
    expect(gameFromSave(null).mode).toBe('zone');
  });

  it('transitions base → lift → zone → report → base with no DOM', () => {
    const g = startNewGame();
    expect(g.mode).toBe('base');
    step(g);
    expect(g.tick).toBe(0);

    enterMode(g, 'lift');
    step(g);
    expect(g.mode).toBe('lift');
    expect(g.tick).toBe(0);

    enterMode(g, 'zone');
    step(g);
    expect(g.mode).toBe('zone');
    expect(g.tick).toBe(1);

    enterMode(g, 'report');
    step(g);
    expect(g.mode).toBe('report');
    expect(g.tick).toBe(1);

    enterMode(g, 'base');
    step(g);
    expect(g.mode).toBe('base');
    expect(g.tick).toBe(1);

    enterMode(g, 'death');
    step(g);
    expect(g.mode).toBe('death');
    expect(g.tick).toBe(1);
  });

  it('snapshot round-trips mode and tick; a save without mode loads as zone', () => {
    const g = startNewGame({ seed: 5 });
    enterMode(g, 'zone');
    step(g);
    step(g);
    enterMode(g, 'report');
    const snap = snapshot(g, 1000);
    expect(snap.mode).toBe('report');
    expect(snap.tick).toBe(2);

    const restored = gameFromSave(parseSave(JSON.parse(JSON.stringify(snap)), D));
    expect(restored.mode).toBe('report');
    expect(restored.tick).toBe(2);
    expect(restored.seed).toBe(5);

    const legacy = { ...snap } as Record<string, unknown>;
    delete legacy.mode;
    const old = gameFromSave(parseSave(legacy, D));
    expect(old.mode).toBe('zone');
    expect(old.tick).toBe(2);
    step(old);
    expect(old.tick).toBe(3);
  });

  it('rejects an unknown mode in transitions and in saves', () => {
    const g = startNewGame();
    expect(() => enterMode(g, 'menu' as GameMode)).toThrow(/mode/);
    expect(g.mode).toBe('base');
    const snap = snapshot(g, 1);
    expect(() => parseSave({ ...snap, mode: 'menu' }, D)).toThrow(SaveError);
    expect(() => parseSave({ ...snap, mode: 'menu' }, D)).toThrow(/mode/);
    expect(() =>
      registerSaveSection('mode', {
        serialize: () => ({}),
        deserialize: (raw) => raw,
        fresh: () => ({}),
      }),
    ).toThrow(/reserved/);
  });

  it('loadGame with no usable save starts in the base', () => {
    const fresh = loadGame(memoryStore());
    expect(fresh.fromSave).toBe(false);
    expect(fresh.state.mode).toBe('base');
    step(fresh.state);
    expect(fresh.state.tick).toBe(0);

    const store = memoryStore();
    store.setItem(STORAGE_KEY, '{not json');
    const failed = loadGame(store, {}, { warn: () => {} });
    expect(failed.fromSave).toBe(false);
    expect(failed.state.mode).toBe('base');
  });
});
