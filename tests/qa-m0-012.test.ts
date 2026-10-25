// QA-M0-012 regression: the player saved on the map's enemy spawn cell (E) is restored there,
// not on the map start (3,3). Scenario from the report: player (27,10), enemy (25,10), HP 60.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCombat, peekCombat } from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import { stepGame } from '../src/core/game';
import { M0 } from '../src/data/mechanics-m0';
import { ARENA_M0 } from '../src/data/maps';
import { emptyActions } from '../src/input/actions';
import {
  gameFromSave,
  memoryStore,
  parseSaveText,
  readSave,
  saveToJson,
  snapshot,
} from '../src/save';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const reload = (s: Parameters<typeof snapshot>[0]) =>
  gameFromSave(parseSaveText(saveToJson(snapshot(s, 1))));

describe('QA-M0-012: saved player cell restored exactly', () => {
  it('player on E (27,10), enemy at (25,10), HP 60 → same after reload', () => {
    expect(ARENA_M0[10]![27]).toBe('E');
    const s = gameFromSave(readSave(memoryStore()));
    const c = getCombat(s);
    stepGame(s, emptyActions(), M0.TICK_MS); // combat initialised, dummy replaced by an enemy
    const enemy = s.entities.find((e) => c.enemies.has(e.id))!;
    enemy.x = enemy.fromX = 25;
    enemy.y = enemy.fromY = 10;
    s.player.x = s.player.fromX = 27;
    s.player.y = s.player.fromY = 10;
    c.player.hp = 60;

    const r = reload(s);
    expect({ x: r.player.x, y: r.player.y }).toEqual({ x: 27, y: 10 });
    const rc = peekCombat(r) ?? getCombat(r);
    expect(rc.player.hp).toBe(60);
    const re = r.entities.find((e) => rc.enemies.has(e.id))!;
    expect({ x: re.x, y: re.y }).toEqual({ x: 25, y: 10 });
  });

  it('fallback to the map start only for a wall cell', () => {
    const s = gameFromSave(readSave(memoryStore()));
    getCombat(s);
    const data = snapshot(s, 1);
    data.player.x = 0; // border wall
    data.player.y = 0;
    const r = gameFromSave(data);
    const start = gameFromSave(null);
    expect({ x: r.player.x, y: r.player.y }).toEqual({ x: start.player.x, y: start.player.y });
  });
});
