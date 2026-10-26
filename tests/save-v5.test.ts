import { describe, expect, it } from 'vitest';
import { enterMode } from '../src/core/game';
import { DEFAULT_SEED } from '../src/data/game';
import { advanceExpedition, getExpedition, LIFT_RIDE_MS, useBaseLift } from '../src/expedition';
import '../src/expedition/save';
import { addCredits, getInventory, setInventory } from '../src/inventory/inventory';
import '../src/inventory/save';
import { getNetworkProgress, setNetworkProgress, solveVariant } from '../src/progress/network';
import '../src/progress/save';
import {
  gameFromSave,
  parseSave,
  SAVE_VERSION,
  saveToJson,
  snapshot,
  startNewGame,
} from '../src/save';

const D = { seed: DEFAULT_SEED };

function v3Core(mode?: string) {
  return {
    version: 3,
    savedAt: 50,
    seed: 9,
    tick: 4,
    rngState: { default: 9 },
    player: { x: 1, y: 1, facing: 'E' as const },
    ...(mode ? { mode } : {}),
  };
}

describe('save v5', () => {
  it('loads a v3 save and defaults a missing mode to zone', () => {
    const data = parseSave(v3Core(), D);
    expect(data.version).toBe(5);
    expect(data.mode).toBe('zone');
    const game = gameFromSave(data);
    expect(game.mode).toBe('zone');
    expect(game.seed).toBe(9);
    expect(game.tick).toBe(4);
  });

  it('keeps a mode that a v3 save already wrote', () => {
    expect(parseSave(v3Core('base'), D).mode).toBe('base');
    expect(parseSave(v3Core('lift'), D).mode).toBe('lift');
    expect(parseSave(v3Core('report'), D).mode).toBe('report');
  });

  it('round-trips credits, a solved variant, expedition depth, and the explainer flag', () => {
    const game = startNewGame({ seed: 6 });
    useBaseLift(game);
    advanceExpedition(game, LIFT_RIDE_MS);
    const paid = addCredits(getInventory(game), 25);
    expect(paid.ok).toBe(true);
    setInventory(game, paid.state);
    const progress = solveVariant(getNetworkProgress(game), 'M1_TERM_04');
    setNetworkProgress(game, { ...progress, riskExplainerSeen: true });

    const snap = snapshot(game, 1_700_000_000_000);
    expect(snap.version).toBe(SAVE_VERSION);
    const back = gameFromSave(parseSave(JSON.parse(JSON.stringify(snap)), D));
    expect(back.mode).toBe('zone');
    expect(getInventory(back).baseCr).toBe(getInventory(game).baseCr);
    expect(getNetworkProgress(back).solved).toEqual(['M1_TERM_04']);
    expect(getNetworkProgress(back).riskExplainerSeen).toBe(true);
    expect(getExpedition(back).depth).toBe(getExpedition(game).depth);
  });

  it('restores base, lift, zone, and report', () => {
    const base = startNewGame({ seed: 8 });
    expect(gameFromSave(parseSave(JSON.parse(JSON.stringify(snapshot(base, 1))), D)).mode).toBe(
      'base',
    );

    const lift = startNewGame({ seed: 8 });
    useBaseLift(lift);
    expect(lift.mode).toBe('lift');
    expect(gameFromSave(parseSave(JSON.parse(JSON.stringify(snapshot(lift, 2))), D)).mode).toBe(
      'lift',
    );

    const zone = startNewGame({ seed: 8 });
    useBaseLift(zone);
    advanceExpedition(zone, LIFT_RIDE_MS);
    expect(zone.mode).toBe('zone');
    expect(gameFromSave(parseSave(JSON.parse(JSON.stringify(snapshot(zone, 3))), D)).mode).toBe(
      'zone',
    );

    const report = startNewGame({ seed: 8 });
    enterMode(report, 'report');
    expect(gameFromSave(parseSave(JSON.parse(JSON.stringify(snapshot(report, 4))), D)).mode).toBe(
      'report',
    );
  });

  it('parses a full expedition snapshot JSON back into the same depth', () => {
    const game = startNewGame({ seed: 10 });
    useBaseLift(game);
    advanceExpedition(game, LIFT_RIDE_MS);
    const json = saveToJson(snapshot(game, 1_800_000_000_000));
    const loaded = gameFromSave(parseSave(JSON.parse(json), D));
    expect(loaded.mode).toBe('zone');
    expect(getExpedition(loaded).depth).toBe(1);
    expect(getExpedition(loaded).expSeed).toBe(getExpedition(game).expSeed);
    expect(getExpedition(loaded).stops).toEqual(getExpedition(game).stops);
  });
});
