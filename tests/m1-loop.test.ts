import { describe, expect, it } from 'vitest';
import { getExpedition, LIFT_RIDE_MS, useBaseLift, advanceExpedition } from '../src/expedition';
import { atRiskHud } from '../src/integration/m1-loop';
import {
  addZoneCredits,
  computeAtRisk,
  getInventory,
  inventoryHudModel,
  setInventory,
} from '../src/inventory/inventory';
import '../src/inventory/save';
import '../src/progress/save';
import '../src/expedition/save';
import { gameFromSave, parseSave, saveToJson, snapshot, startNewGame } from '../src/save';

describe('M1 loop wiring', () => {
  it('starts in base, rides to depth 1, and keeps that depth across a save', () => {
    const game = startNewGame({ seed: 4 });
    expect(game.mode).toBe('base');
    useBaseLift(game);
    advanceExpedition(game, LIFT_RIDE_MS);
    expect(game.mode).toBe('zone');
    expect(getExpedition(game).depth).toBe(1);

    const raw = JSON.parse(saveToJson(snapshot(game, 1_700_000_000_000))) as unknown;
    const restored = gameFromSave(parseSave(raw, { seed: 4 }));
    expect(restored.mode).toBe('zone');
    expect(getExpedition(restored).depth).toBe(1);
    expect(getExpedition(restored).stops).toEqual(getExpedition(game).stops);
  });

  it('AT RISK on the HUD helper matches computeAtRisk', () => {
    const game = startNewGame({ seed: 4 });
    const topped = addZoneCredits(getInventory(game), 15);
    expect(topped.ok).toBe(true);
    setInventory(game, topped.state);
    expect(atRiskHud(game)).toBe(computeAtRisk(game));
    expect(atRiskHud(game)).toBe(inventoryHudModel(game).atRisk);
    expect(atRiskHud(game)).toBe(15);
  });
});
