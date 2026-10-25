// Combat save section 'combat' – round-trip through the engine's real save/load
// (snapshot → JSON → parseSaveText (migrate + validate) → gameFromSave).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as core from '../src/core/game';
import { createGame, stepGame, type GameState } from '../src/core/game';
import { COMBAT, COMBAT_M1 } from '../src/data/combat-m0';
import { emptyActions, type ActionState } from '../src/input/actions';
import { gameFromSave, parseSaveText, saveToJson, snapshot, SaveError } from '../src/save';
import {
  getCombat,
  peekCombat,
  setCombatProfile,
  spawnEnemy,
  type CombatInitOptions,
} from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import type { CombatEvent } from '../src/combat/state';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const ROWS = [
  '################',
  '#..............#',
  '#..@...........#',
  '#.......##.....#',
  '#..........E...#',
  '#..............#',
  '################',
];

function act(i: number): ActionState {
  const a = emptyActions();
  a.attack = i % 5 < 2;
  if (i % 23 === 7) a.move = { x: 0, y: 1 };
  if (i % 31 === 11) a.move = { x: 1, y: 0 };
  return a;
}

function run(s: GameState, from: number, n: number) {
  const out: string[] = [];
  for (let i = from; i < from + n; i++) {
    const tick = s.tick;
    stepGame(s, act(i), COMBAT.TICK_MS);
    for (const ev of getCombat(s).events)
      out.push(JSON.stringify({ tick, ev: { ...ev, enemyId: 0 } as CombatEvent }));
  }
  return out;
}

/** Everything observable about combat, without entity ids. */
function fingerprint(s: GameState) {
  const c = getCombat(s);
  const enemies = s.entities
    .filter((e) => c.enemies.has(e.id))
    .map((e) => {
      const { id, ...ec } = c.enemies.get(e.id)!;
      void id;
      return {
        x: e.x,
        y: e.y,
        mc: e.moveCooldown,
        aw: e.attackWindup,
        ac: e.attackCooldown,
        ...ec,
      };
    });
  const p = s.player;
  const { attack, queuedTargetId, ...pc } = c.player;
  return {
    tick: s.tick,
    player: {
      x: p.x,
      y: p.y,
      mc: p.moveCooldown,
      aw: p.attackWindup,
      ac: p.attackCooldown,
      ...pc,
      attack: attack && { aim: attack.aim, hasTarget: attack.targetId !== null },
      q: queuedTargetId !== null,
    },
    enemies,
    death: c.death,
    stats: c.stats,
    rng: s.rng.stream('combat').getState(),
    corpse: s.entities.filter((e) => e.kind === 'corpse').map((e) => [e.x, e.y]),
  };
}

/**
 * In the game every save comes with a pause, and the pause resets the engine's (unsaved) player
 * step memory (Silnik, QA-M0-001 buffer) – do the same here so both runs start from equal input
 * memory. Optional lookup: the helper exists only in newer engine versions.
 */
const resetMoveMemory = (core as Record<string, unknown>).resetPlayerMoveMemory as
  ((s: GameState) => void) | undefined;
const saveLoad = (s: GameState) => {
  resetMoveMemory?.(s);
  return gameFromSave(parseSaveText(saveToJson(snapshot(s, 1234))), { mapRows: ROWS });
};

function game(opts: CombatInitOptions = {}) {
  const s = createGame({ mapRows: ROWS, seed: 42 });
  getCombat(s, opts);
  return s;
}

describe('combat save (save v3 section "combat")', () => {
  it('mid-combat save → load continues tick-exact (wind-ups, cooldowns, AI, RNG stream)', () => {
    const a = game();
    spawnEnemy(a, 'panelDrone', { x: 12, y: 1 });
    let i = 0;
    // advance until an enemy wind-up AND a player cooldown are in flight
    for (; i < 400; i++) {
      run(a, i, 1);
      const c = getCombat(a);
      const winding = [...c.enemies.values()].some((ec) => ec.attack);
      if (winding && a.player.attackCooldown > 0 && i > 30) break;
    }
    expect(i).toBeLessThan(400);
    const b = saveLoad(a);
    expect(peekCombat(b)).toBeDefined();
    expect(fingerprint(b)).toEqual(fingerprint(a));
    const ea = run(a, i + 1, 600);
    const eb = run(b, i + 1, 600);
    expect(eb).toEqual(ea);
    expect(fingerprint(b)).toEqual(fingerprint(a));
    expect(ea.some((x) => x.includes('playerHit'))).toBe(true);
  });

  it('save during the death sequence restores freeze / respawn timers and the body', () => {
    const a = game();
    getCombat(a).player.hp = 1;
    let i = 0;
    while (!getCombat(a).death && i < 300) run(a, i++, 1);
    run(a, i, 5);
    const b = saveLoad(a);
    expect(fingerprint(b)).toEqual(fingerprint(a));
    expect(run(b, i + 5, 120)).toEqual(run(a, i + 5, 120));
  });

  it('keeps armour, speed modifiers and scaled HP; profile / depth come from setCombatProfile', () => {
    const a = game({ cfg: COMBAT_M1, profile: 'm1', depth: 3, playerArmor: 21 });
    getCombat(a).player.attackTimeMod = -0.1;
    run(a, 0, 3);
    const data = snapshot(a, 1234);
    expect(data.combat).not.toHaveProperty('profile');
    expect(data.combat).not.toHaveProperty('depth');
    const b = gameFromSave(parseSaveText(saveToJson(data)), { mapRows: ROWS });
    setCombatProfile(b, 'm1', 3); // Silnik: right after gameFromSave
    const cb = getCombat(b);
    expect(cb.cfg).toBe(COMBAT_M1);
    expect(cb.depth).toBe(3);
    expect(cb.player.armor).toBe(21);
    expect(cb.player.attackTimeMod).toBe(-0.1);
    expect([...cb.enemies.values()][0]!.maxHp).toBe(176);
  });

  it('a save made before combat started loads as a new game (lazy init)', () => {
    const a = createGame({ mapRows: ROWS, seed: 7 });
    const data = snapshot(a, 0);
    expect(data.combat).toEqual({ v: 3, empty: true });
    const b = gameFromSave(parseSaveText(saveToJson(data)), { mapRows: ROWS });
    expect(peekCombat(b)).toBeUndefined();
    expect(getCombat(b).enemies.size).toBe(1);
  });

  it('bad combat data rejects the whole save with SaveError', () => {
    const a = game();
    run(a, 0, 10);
    const data = JSON.parse(saveToJson(snapshot(a, 0)));
    type C = {
      v: unknown;
      player: Record<string, unknown>;
      enemies: Array<Record<string, unknown>>;
    };
    const bad = (mut: (c: C) => void) => {
      const d = structuredClone(data);
      mut(d.combat);
      return () => parseSaveText(JSON.stringify(d));
    };
    expect(bad((c) => (c.v = 99))).toThrow(SaveError);
    expect(bad((c) => (c.player.hp = 'x'))).toThrow(SaveError);
    expect(bad((c) => (c.enemies[0].ai = 'dancing'))).toThrow(SaveError);
    expect(bad((c) => (c.enemies[0].type = 'dragon'))).toThrow(SaveError);
    expect(bad((c) => (c.player.attack = { target: 5, aim: { x: 1, y: 1 } }))).toThrow(SaveError);
    expect(bad((c) => (c.enemies[0].attackWindup = -1))).toThrow(SaveError);
  });

  it('holds no RNG state (the engine saves stream "combat" in rngState)', () => {
    const a = game();
    run(a, 0, 50);
    const data = snapshot(a, 0);
    expect(JSON.stringify(data.combat)).not.toMatch(/rng/i);
    expect(data.rngState.combat).toBe(a.rng.stream('combat').getState());
  });
});
