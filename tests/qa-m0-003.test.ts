// QA-M0-003 regression: combat state survives save → JSON → load (no heal on reload).
// Path = main.ts: gameFromSave(readSave(store)) → play → snapshot → writeSave → reload.
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCombat, peekCombat } from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import { stepGame, type GameState } from '../src/core/game';
import { M0 } from '../src/data/mechanics-m0';
import { emptyActions } from '../src/input/actions';
import {
  decodeSaveCode,
  encodeSaveCode,
  gameFromSave,
  memoryStore,
  parseSaveText,
  readSave,
  saveToJson,
  snapshot,
  writeSave,
} from '../src/save';

const text = (rel: string) => new TextDecoder().decode(readFileSync(new URL(rel, import.meta.url)));

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

function view(s: GameState) {
  const c = peekCombat(s)!;
  const enemies = s.entities
    .filter((e) => c.enemies.has(e.id))
    .map((e) => {
      const ec = c.enemies.get(e.id)!;
      return {
        x: e.x,
        y: e.y,
        hp: ec.hp,
        ai: ec.ai,
        attack: ec.attack,
        windup: e.attackWindup,
        cooldown: e.attackCooldown,
        move: e.moveCooldown,
      };
    });
  const p = s.player;
  return {
    tick: s.tick,
    hp: c.player.hp,
    player: { x: p.x, y: p.y, windup: p.attackWindup, cooldown: p.attackCooldown },
    enemies,
  };
}

/** New game on the real arena, player next to the enemy, attacking until both took damage. */
function fight(): GameState {
  const s = gameFromSave(readSave(memoryStore()));
  const c = getCombat(s);
  const enemy = s.entities.find((e) => c.enemies.has(e.id))!;
  s.player.x = s.player.fromX = enemy.x - 1;
  s.player.y = s.player.fromY = enemy.y;
  for (let i = 0; i < 400; i++) {
    const a = emptyActions();
    a.attack = true;
    stepGame(s, a, M0.TICK_MS);
    const ec = c.enemies.get(enemy.id)!;
    if (c.player.hp < 100 && ec.hp < ec.maxHp && ec.attack && i % 2 === 0) break;
  }
  return s;
}

describe('QA-M0-003: combat state in the save', () => {
  it('damage → localStorage save → reload: same HP (player + enemy), wind-up, cooldowns', () => {
    const a = fight();
    const before = view(a);
    expect(before.hp).toBeLessThan(100);
    expect(before.enemies[0]!.hp).toBeLessThan(80);
    expect(before.enemies[0]!.attack).not.toBeNull(); // telegraph in flight
    const store = memoryStore();
    writeSave(store, snapshot(a, 1)); // what autoPause() / pause do in main.ts
    const raw = JSON.parse(store.getItem('gra.save.v1')!);
    expect(raw.combat.player.hp).toBe(before.hp);
    const b = gameFromSave(readSave(store)); // reload = main.ts boot
    expect(view(b)).toEqual(before);
    // and it continues identically
    for (let i = 0; i < 100; i++) {
      stepGame(a, emptyActions(), M0.TICK_MS);
      stepGame(b, emptyActions(), M0.TICK_MS);
    }
    expect(view(b)).toEqual(view(a));
  });

  it('export file (JSON) and save code keep the combat state', async () => {
    const a = fight();
    const before = view(a);
    expect(view(gameFromSave(parseSaveText(saveToJson(snapshot(a, 1)))))).toEqual(before);
    const code = await encodeSaveCode(snapshot(a, 1));
    expect(view(gameFromSave(await decodeSaveCode(code)))).toEqual(before);
  });

  it('main.ts imports the combat + contracts save sections (hoisted before readSave)', () => {
    const src = text('../src/main.ts');
    expect(src).toMatch(/^import \{[^}]*installCombat[^}]*\} from '\.\/combat\/install';$/m);
    expect(src).toMatch(/^import '\.\/contracts\/save';/m);
    const install = text('../src/combat/install.ts');
    expect(install).toMatch(/^import '\.\/save';/m);
  });
});
