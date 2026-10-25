import { describe, expect, it } from 'vitest';
import { createGame, isOccupied, stepGame } from '../src/core/game';
import { ARENA_M0, TEST_MAP_LARGE } from '../src/data/maps';
import type { TileMap } from '../src/world/tilemap';
import { emptyActions, toDir8, type ActionState } from '../src/input/actions';
import { canStep } from '../src/world/collision';
import { parseMap } from '../src/world/tilemap';

const ROOM = ['#######', '#.....#', '#.#...#', '#..@..#', '#...E.#', '#######'];

const move = (x: number, y: number): ActionState => ({ ...emptyActions(), move: { x, y } });

/** Bresenham line of sight between cell centres; walls on the line (excluding ends) block. */
function los(map: TileMap, x0: number, y0: number, x1: number, y1: number): boolean {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    if (!(x === x0 && y === y0) && !(x === x1 && y === y1) && map.isSolid(x, y)) return false;
    if (x === x1 && y === y1) return true;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

describe('test maps', () => {
  it('arena M0 is 40x20 with outer walls, 4 pillars and a 1-wide corridor (mechaniki 1.10)', () => {
    expect(ARENA_M0).toHaveLength(20);
    for (const row of ARENA_M0) expect(row).toHaveLength(40);
    const { map, spawns } = parseMap(ARENA_M0);
    for (let x = 0; x < 40; x++) expect(map.isSolid(x, 0) && map.isSolid(x, 19)).toBe(true);
    for (let y = 0; y < 20; y++) expect(map.isSolid(0, y) && map.isSolid(39, y)).toBe(true);
    // corridor x 13..16 on row 10: floor, walls directly above and below
    for (let x = 13; x <= 16; x++) {
      expect(map.isSolid(x, 10)).toBe(false);
      expect(map.isSolid(x, 9) && map.isSolid(x, 11)).toBe(true);
    }
    // pillars: free-standing wall cells right of the dividing wall
    let pillarCells = 0;
    for (let y = 1; y < 19; y++) for (let x = 17; x < 39; x++) if (map.isSolid(x, y)) pillarCells++;
    expect(pillarCells).toBe(16); // 4 pillars x 2x2
    expect(spawns.map((s) => s.ch).sort()).toEqual(['@', 'E']);
  });

  it('arena: player starts >= 12 cells from the enemy and out of its line of sight', () => {
    const { map, spawns } = parseMap(ARENA_M0);
    const p = spawns.find((s) => s.ch === '@')!;
    const e = spawns.find((s) => s.ch === 'E')!;
    expect(Math.max(Math.abs(p.x - e.x), Math.abs(p.y - e.y))).toBeGreaterThanOrEqual(12);
    expect(los(map, e.x, e.y, p.x, p.y)).toBe(false);
    expect(los(map, e.x, e.y, e.x + 3, e.y)).toBe(true); // sanity
  });

  it('large map (secondary) is 60x30, closed, with one @ and one E', () => {
    expect(TEST_MAP_LARGE).toHaveLength(30);
    for (const row of TEST_MAP_LARGE) expect(row).toHaveLength(60);
    const { map, spawns } = parseMap(TEST_MAP_LARGE);
    expect(spawns.map((s) => s.ch).sort()).toEqual(['@', 'E']);
    for (let x = 0; x < 60; x++) expect(map.isSolid(x, 0) && map.isSolid(x, 29)).toBe(true);
  });

  it('createGame uses the arena by default', () => {
    const g = createGame();
    expect([g.map.width, g.map.height]).toEqual([40, 20]);
    expect([g.player.x, g.player.y]).toEqual([3, 3]);
  });
});

describe('collision', () => {
  const { map } = parseMap(ROOM);
  it('walls and outside of the map block', () => {
    expect(canStep(map, 1, 1, -1, 0)).toBe(false);
    expect(canStep(map, 1, 1, 1, 0)).toBe(true);
    expect(map.isSolid(-5, 2)).toBe(true);
  });
  it('no corner cutting on diagonals', () => {
    // from (1,1) going SE: (2,1) floor, (1,2) floor, target (2,2) is a wall → blocked
    expect(canStep(map, 1, 1, 1, 1)).toBe(false);
    // from (1,3) going NE: (2,3) floor but (1,2) floor and target (2,2) wall → blocked
    expect(canStep(map, 1, 3, 1, -1)).toBe(false);
    // from (3,3) going NW: target (2,2) wall
    expect(canStep(map, 3, 3, -1, -1)).toBe(false);
    // from (3,2) going SW: target (2,3) floor, but orthogonal (2,2) is a wall → blocked
    expect(canStep(map, 3, 2, -1, 1)).toBe(false);
    expect(canStep(map, 3, 3, 1, 1)).toBe(true);
  });
  it('entities block', () => {
    const g = createGame({ mapRows: ROOM });
    expect(isOccupied(g, 4, 4)).toBe(true);
    for (let i = 0; i < 10; i++) stepGame(g, move(1, 1), 50); // towards E at (4,4)
    expect([g.player.x, g.player.y]).toEqual([3, 3]);
    expect(g.player.facing).toEqual({ x: 1, y: 1 });
  });
});

describe('grid movement timing (mechaniki 1.2)', () => {
  it('straight step every 3 ticks (150 ms), diagonal every 4 ticks (200 ms)', () => {
    const g = createGame({ mapRows: ARENA_M0 });
    const x0 = g.player.x;
    for (let i = 0; i < 9; i++) stepGame(g, move(1, 0), 50);
    expect(g.player.x - x0).toBe(3);
    const g2 = createGame({ mapRows: ARENA_M0 });
    const { x, y } = g2.player;
    for (let i = 0; i < 8; i++) stepGame(g2, move(1, 1), 50);
    expect([g2.player.x - x, g2.player.y - y]).toEqual([2, 2]);
  });
  it('bumping a wall costs no time', () => {
    const g = createGame({ mapRows: ROOM });
    g.player.x = 1;
    g.player.y = 1;
    stepGame(g, move(-1, 0), 50);
    expect(g.player.moveCooldown).toBe(0);
    stepGame(g, move(1, 0), 50);
    expect(g.player.x).toBe(2);
  });
  it('quantises move vectors to 8 directions with a dead zone', () => {
    expect(toDir8({ x: 0.1, y: 0 })).toBeNull();
    expect(toDir8({ x: 0.7, y: 0.7 })).toEqual({ x: 1, y: 1 });
    expect(toDir8({ x: -1, y: 0.2 })).toEqual({ x: -1, y: 0 });
    expect(toDir8({ x: 0, y: -1 })).toEqual({ x: 0, y: -1 });
  });
});
