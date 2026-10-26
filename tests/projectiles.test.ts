// v0.6 ranged shots (wariant-twin-stick §3–§4) and kiting (§5).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGame, stepGame, type GameState } from '../src/core/game';
import { COMBAT } from '../src/data/combat-m0';
import { RAIL_PISTOL_ITEM_ID } from '../src/data/inventory-m1';
import { emptyActions, type ActionState, type Dir8 } from '../src/input/actions';
import { getCombat, pickAimTarget, spawnEnemy } from '../src/combat/combat';
import { spawnBoss } from '../src/combat/boss';
import { installCombat } from '../src/combat/install';
import type { CombatEvent } from '../src/combat/state';
import type { Entity } from '../src/entities/entity';
import { createInventoryState, setInventory } from '../src/inventory/inventory';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const TICK = COMBAT.TICK_MS;

function act(
  o: { attack?: boolean; move?: [number, number]; aim?: Dir8 | null } = {},
): ActionState {
  const a = emptyActions();
  a.attack = !!o.attack;
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  if (o.aim !== undefined) a.aim = o.aim;
  return a;
}

function run(s: GameState, n: number, input: ActionState | ((i: number) => ActionState) = act()) {
  const out: Array<{ tick: number; ev: CombatEvent }> = [];
  for (let i = 0; i < n; i++) {
    const tick = s.tick;
    stepGame(s, typeof input === 'function' ? input(i) : input, TICK);
    for (const ev of getCombat(s).events) out.push({ tick, ev });
  }
  return out;
}

function open(px = 3, py = 5) {
  const rows = Array.from({ length: 14 }, (_, y) =>
    Array.from({ length: 24 }, (_, x) =>
      y === 0 || y === 13 || x === 0 || x === 23 ? '#' : '.',
    ).join(''),
  );
  rows[py] = rows[py]!.slice(0, px) + '@' + rows[py]!.slice(px + 1);
  const s = createGame({ mapRows: rows, seed: 3 });
  getCombat(s);
  return s;
}

function equipPistol(s: GameState) {
  const inv = createInventoryState();
  inv.gear.weapon = { itemId: RAIL_PISTOL_ITEM_ID, count: 1 };
  setInventory(s, inv);
}

/** Freeze so the enemy does not walk into (or out of) the shot. */
function hold(s: GameState, e: Entity) {
  const ec = getCombat(s).enemies.get(e.id)!;
  ec.ai = 'attack';
  ec.attack = { aim: { x: s.player.x, y: s.player.y }, target: 'player' };
  e.attackWindup = 9999;
}

describe('projectiles', () => {
  it('stops before a wall and does not hit an enemy behind it', () => {
    const grid: string[][] = Array.from({ length: 14 }, (_, y) =>
      Array.from({ length: 24 }, (_, x) =>
        y === 0 || y === 13 || x === 0 || x === 23 ? '#' : '.',
      ),
    );
    grid[5]![3] = '@';
    grid[5]![5] = '#';
    const s2 = createGame({ mapRows: grid.map((r) => r.join('')), seed: 3 });
    getCombat(s2);
    equipPistol(s2);
    const enemy = spawnEnemy(s2, 'crawler', { x: 8, y: 5 });
    hold(s2, enemy);
    const hp = getCombat(s2).enemies.get(enemy.id)!.hp;
    const ev = run(s2, 20, act({ attack: true }));
    expect(getCombat(s2).enemies.get(enemy.id)!.hp).toBe(hp);
    const fired = ev.find((x) => x.ev.type === 'projectileFired')!.ev as Extract<
      CombatEvent,
      { type: 'projectileFired' }
    >;
    expect(fired.cells.some((c) => c.x >= 5)).toBe(false);
    expect(fired.cells.length).toBeLessThanOrEqual(7);
    const end = ev.find((x) => x.ev.type === 'projectileHit')!.ev as Extract<
      CombatEvent,
      { type: 'projectileHit' }
    >;
    expect(end.hitId).toBeNull();
  });

  it('hits the first enemy and not the one behind it', () => {
    const s = open();
    equipPistol(s);
    const first = spawnEnemy(s, 'crawler', { x: 5, y: 5 });
    const second = spawnEnemy(s, 'crawler', { x: 8, y: 5 });
    hold(s, first);
    hold(s, second);
    const hp2 = getCombat(s).enemies.get(second.id)!.hp;
    const ev = run(s, 12, act({ attack: true }));
    const hits = ev.filter((x) => x.ev.type === 'enemyHit');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.every((x) => (x.ev as { enemyId: number }).enemyId === first.id)).toBe(true);
    expect(getCombat(s).enemies.get(second.id)!.hp).toBe(hp2);
    const dmg = (hits[0]!.ev as { dmg: number }).dmg;
    expect(dmg).toBeGreaterThanOrEqual(8);
    expect(dmg).toBeLessThanOrEqual(18);
  });

  it('does not hit past range 7', () => {
    const s = open();
    equipPistol(s);
    const far = spawnEnemy(s, 'crawler', { x: 3 + 8, y: 5 });
    hold(s, far);
    const hp = getCombat(s).enemies.get(far.id)!.hp;
    const ev = run(s, 24, act({ attack: true }));
    expect(getCombat(s).enemies.get(far.id)!.hp).toBe(hp);
    const fired = ev.filter((x) => x.ev.type === 'projectileFired');
    expect(fired.length).toBeGreaterThan(0);
    for (const x of fired) {
      const cells = (x.ev as Extract<CombatEvent, { type: 'projectileFired' }>).cells;
      expect(cells.length).toBeLessThanOrEqual(7);
      expect(cells.some((c) => c.x === far.x)).toBe(false);
    }
  });

  it('does not fire a fourth shot while three are in the air', () => {
    const s = open();
    equipPistol(s);
    const c = getCombat(s);
    const dummy = (id: number) => ({
      id,
      cells: [{ x: 1, y: 1 }],
      idx: -1,
      timer: 80,
      dmg: 1,
      crit: false,
      momentum: false,
      ownerId: s.player.id,
      dir: { x: 1, y: 0 },
      from: { x: s.player.x, y: s.player.y },
      endCell: { x: 1, y: 1 },
    });
    c.projectiles = [dummy(1), dummy(2), dummy(3)];
    c.nextProjectileId = 4;
    const ev = run(s, 6, act({ attack: true }));
    expect(c.projectiles.map((p) => p.id)).toEqual([1, 2, 3]);
    expect(ev.filter((x) => x.ev.type === 'projectileFired')).toHaveLength(0);
  });

  it('a projectile hits any boss body cell once', () => {
    const grid = Array.from({ length: 12 }, (_, y) =>
      Array.from({ length: 16 }, (_, x) =>
        y === 0 || y === 11 || x === 0 || x === 15 ? '#' : '.',
      ).join(''),
    );
    grid[4] = grid[4]!.slice(0, 2) + '@' + grid[4]!.slice(3);
    const s = createGame({ mapRows: grid, seed: 1 });
    getCombat(s);
    equipPistol(s);
    spawnBoss(s, { x: 6, y: 4 });
    const b = getCombat(s).boss!;
    b.phase = 'recover';
    b.timer = 9999;
    const hp = b.hp;
    const ev = run(s, 12, act({ attack: true }));
    const hits = ev.filter((x) => x.ev.type === 'bossHit');
    expect(hits.length).toBeGreaterThanOrEqual(1);
    expect(hits.length).toBe(1);
    expect(b.hp).toBe(hp - (hits[0]!.ev as { dmg: number }).dmg);
  });
});

describe('pickAimTarget', () => {
  it('selects an enemy at +(5, 2) when aiming east and not when aiming north', () => {
    const s = open(4, 6);
    const e = spawnEnemy(s, 'crawler', { x: 4 + 5, y: 6 + 2 });
    hold(s, e);
    const c = getCombat(s);
    expect(pickAimTarget(s, c, { x: 1, y: 0 }, c.cfg.RANGED_RANGE)?.id).toBe(e.id);
    expect(pickAimTarget(s, c, { x: 0, y: -1 }, c.cfg.RANGED_RANGE)).toBeNull();
  });
});

describe('kiting', () => {
  it('a step during the melee cycle costs ×1.35 (150 ms → 4 ticks)', () => {
    const s = open();
    run(s, 3, act({ attack: true }));
    expect(s.player.attackCooldown).toBeGreaterThan(0);
    run(s, 1, act({ move: [1, 0] }));
    expect(s.player.moveTicks).toBe(4);
  });

  it('a step during the ranged cycle costs ×1.5 (150 ms → 5 ticks)', () => {
    const s = open();
    equipPistol(s);
    run(s, 3, act({ attack: true }));
    expect(s.player.attackCooldown).toBeGreaterThan(0);
    run(s, 1, act({ move: [1, 0] }));
    expect(s.player.moveTicks).toBe(5);
  });

  it('a step outside the attack cycle is not kited', () => {
    const s = open();
    run(s, 1, act({ move: [1, 0] }));
    expect(s.player.moveTicks).toBe(3);
  });
});
