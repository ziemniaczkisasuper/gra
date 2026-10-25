// v0.6 melee arc (wariant-twin-stick §2): hardcoded offsets, wall clipping, multi-hit swing.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGame, placePlayer, stepGame, type GameState } from '../src/core/game';
import { ARC_OFFSETS, COMBAT, COMBAT_M1, RAIL_GUARDIAN as RG } from '../src/data/combat-m0';
import { emptyActions, type ActionState } from '../src/input/actions';
import { getCombat, spawnEnemy } from '../src/combat/combat';
import { spawnBoss } from '../src/combat/boss';
import { arcCells, bresenhamCells, DIRS8 } from '../src/combat/grid';
import { installCombat } from '../src/combat/install';
import type { CombatEvent } from '../src/combat/state';
import { parseMap } from '../src/world/tilemap';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const TICK = COMBAT.TICK_MS;

function act(o: { attack?: boolean; move?: [number, number]; skill?: 1 | 2 | 3 } = {}): ActionState {
  const a = emptyActions();
  a.attack = !!o.attack;
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  if (o.skill === 1) a.skill1 = true;
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

function openMap(w = 24, h = 24) {
  const rows = Array.from({ length: h }, (_, y) =>
    Array.from({ length: w }, (_, x) =>
      y === 0 || y === h - 1 || x === 0 || x === w - 1 ? '#' : '.',
    ).join(''),
  );
  return parseMap(rows).map;
}

describe('ARC_OFFSETS', () => {
  it('each of the 8 directions is the hardcoded 8-cell table', () => {
    const map = openMap();
    const from = { x: 10, y: 10 };
    expect(ARC_OFFSETS).toHaveLength(8);
    for (let i = 0; i < 8; i++) {
      expect(ARC_OFFSETS[i]).toHaveLength(8);
      const cells = arcCells(map, from, DIRS8[i]!);
      expect(cells).toEqual(
        ARC_OFFSETS[i]!.map(([dx, dy]) => ({ x: from.x + dx, y: from.y + dy })),
      );
    }
  });
});

describe('arcCells clipping', () => {
  it('a wall at distance 1 blocks its distance-2 children and is not a hit', () => {
    const rows = Array.from({ length: 16 }, () => '.'.repeat(16).split(''));
    rows[8]![9] = '#'; // offset (1, 0) from (8, 8) — the east centre cell
    const map = parseMap(rows.map((r) => r.join(''))).map;
    const cells = arcCells(map, { x: 8, y: 8 }, { x: 1, y: 0 });
    const rel = cells.map((c) => [c.x - 8, c.y - 8]);
    expect(rel).not.toContainEqual([1, 0]);
    expect(rel).not.toContainEqual([2, 0]);
    expect(rel).toEqual([
      [1, -1],
      [1, 1],
      [2, -2],
      [2, -1],
      [2, 1],
      [2, 2],
    ]);
  });

  it('a distance-1 diagonal is cut when both orthogonal neighbours are walls', () => {
    const rows = Array.from({ length: 16 }, () => '.'.repeat(16).split(''));
    rows[8]![9] = '#'; // (1, 0)
    rows[9]![8] = '#'; // (0, 1)
    const map = parseMap(rows.map((r) => r.join(''))).map;
    expect(arcCells(map, { x: 8, y: 8 }, { x: 1, y: 1 })).toEqual([]);
  });

  it('bresenham stops before a wall and before a corner cut', () => {
    const rows = Array.from({ length: 12 }, () => '.'.repeat(12).split(''));
    rows[5]![4] = '#';
    const map = parseMap(rows.map((r) => r.join(''))).map;
    const cells = bresenhamCells(map, { x: 2, y: 5 }, { x: 8, y: 5 }, 7);
    expect(cells.map((c) => c.x)).toEqual([3]);
    const cutRows = Array.from({ length: 12 }, () => '.'.repeat(12).split(''));
    cutRows[5]![3] = '#'; // (3, 5) orthogonal of the diagonal step (2,5) → (3,4)
    cutRows[4]![2] = '#'; // (2, 4)
    const cut = parseMap(cutRows.map((r) => r.join(''))).map;
    expect(bresenhamCells(cut, { x: 2, y: 5 }, { x: 4, y: 3 }, 7)).toEqual([]);
  });
});

describe('resolveSwing', () => {
  function room() {
    const rows = Array.from({ length: 12 }, (_, y) =>
      Array.from({ length: 16 }, (_, x) =>
        y === 0 || y === 11 || x === 0 || x === 15 ? '#' : '.',
      ).join(''),
    );
    rows[5] = rows[5]!.slice(0, 3) + '@' + rows[5]!.slice(4);
    const s = createGame({ mapRows: rows, seed: 2 });
    getCombat(s);
    return s;
  }

  it('one swing hits three enemies standing in the arc', () => {
    const s = room();
    const ids = [
      [4, 4],
      [4, 5],
      [4, 6],
    ].map(([x, y]) => spawnEnemy(s, 'crawler', { x: x!, y: y! }).id);
    const ev = run(s, 3, act({ attack: true }));
    const swings = ev.filter((x) => x.ev.type === 'playerSwing');
    expect(swings).toHaveLength(1);
    const swing = swings[0]!.ev as Extract<CombatEvent, { type: 'playerSwing' }>;
    expect(swing.hitIds.slice().sort((a, b) => a - b)).toEqual(ids.slice().sort((a, b) => a - b));
    const hits = ev.filter((x) => x.ev.type === 'enemyHit');
    expect(hits).toHaveLength(3);
    expect(hits.map((x) => x.tick)).toEqual([2, 2, 2]);
  });

  it('boss parts in two arc cells take one damage application', () => {
    const rows = Array.from({ length: 12 }, (_, y) =>
      Array.from({ length: 16 }, (_, x) =>
        y === 0 || y === 11 || x === 0 || x === 15 ? '#' : '.',
      ).join(''),
    );
    rows[4] = rows[4]!.slice(0, 8) + '@' + rows[4]!.slice(9);
    const s = createGame({ mapRows: rows, seed: 4 });
    getCombat(s);
    placePlayer(s, 8, 4);
    s.player.facing = { x: -1, y: 0 };
    spawnBoss(s, { x: 5, y: 3 });
    const b = getCombat(s).boss!;
    b.phase = 'recover';
    b.timer = 9999;
    const hp = b.hp;
    const ev = run(s, 3, act({ attack: true }));
    const hits = ev.filter((x) => x.ev.type === 'bossHit');
    expect(hits).toHaveLength(1);
    const dmg = (hits[0]!.ev as Extract<CombatEvent, { type: 'bossHit' }>).dmg;
    expect(b.hp).toBe(hp - dmg);
    expect(b.hp).toBeLessThan(RG.BOSS_HP);
    expect(b.hp).toBeGreaterThan(RG.BOSS_HP - 40);
  });

  it('dash cancels an in-progress swing and does not start the swing cooldown', () => {
    const rows = Array.from({ length: 9 }, (_, y) =>
      Array.from({ length: 14 }, (_, x) =>
        y === 0 || y === 8 || x === 0 || x === 13 ? '#' : '.',
      ).join(''),
    );
    rows[4] = rows[4]!.slice(0, 3) + '@' + rows[4]!.slice(4);
    const s = createGame({ mapRows: rows, seed: 1 });
    getCombat(s, { cfg: COMBAT_M1, profile: 'm1' });
    run(s, 1, act({ attack: true }));
    expect(getCombat(s).player.attack).not.toBeNull();
    expect(s.player.attackWindup).toBeGreaterThan(0);
    run(s, 1, act({ skill: 1, move: [1, 0] }));
    expect(getCombat(s).player.attack).toBeNull();
    expect(s.player.attackWindup).toBe(0);
    expect(s.player.attackCooldown).toBe(0);
    expect(getCombat(s).player.momentum).toBeGreaterThan(0);
    expect(s.player.x).toBeGreaterThan(3);
  });
});
