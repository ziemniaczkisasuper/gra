// Grid helpers for combat: reach, line of sight, BFS (mechaniki-m1.md §1.2, §1.3, §1.6).
// Movement rules (walls, no corner cutting) come from world/collision.ts – one rule for all.
import { canStep, type OccupiedFn } from '../world/collision';
import type { TileMap } from '../world/tilemap';

export interface Cell {
  x: number;
  y: number;
}

/** 8 directions, clockwise from north (§1.3 tie-break order). y grows downwards. */
export const DIRS8: readonly Cell[] = [
  { x: 0, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
];

export const sameCell = (a: Cell, b: Cell): boolean => a.x === b.x && a.y === b.y;

export const chebyshev = (a: Cell, b: Cell): number =>
  Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));

export const isDiagonal = (d: Cell): boolean => d.x !== 0 && d.y !== 0;

/** Clockwise angle from north in [0, 2π) – §1.3 tie-break. */
export function clockAngle(d: Cell): number {
  const a = Math.atan2(d.x, -d.y);
  return a < 0 ? a + 2 * Math.PI : a;
}

/** §1.6: Bresenham line of sight; walls on intermediate cells block (end cells ignored). */
export function lineOfSight(map: TileMap, a: Cell, b: Cell): boolean {
  let x = a.x;
  let y = a.y;
  const dx = Math.abs(b.x - a.x);
  const dy = -Math.abs(b.y - a.y);
  const sx = a.x < b.x ? 1 : -1;
  const sy = a.y < b.y ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    if (x === b.x && y === b.y) return true;
    if (!(x === a.x && y === a.y) && map.isSolid(x, y)) return false;
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

/**
 * Melee reach (§1.3): within Chebyshev `range`; an adjacent diagonal is blocked by a corner
 * exactly like movement. Range > 1 (M1) additionally needs line of sight.
 */
export function inMeleeReach(map: TileMap, from: Cell, to: Cell, range: number): boolean {
  const dist = chebyshev(from, to);
  if (dist === 0 || dist > range) return false;
  if (dist === 1) return canStep(map, from.x, from.y, to.x - from.x, to.y - from.y);
  return lineOfSight(map, from, to);
}

/**
 * §1.6: BFS over 8 directions without corner cutting, limited to Chebyshev `radius` around
 * `from`. Returns the first step of a shortest path to `goal`, or null (unreachable / there).
 * `occupied` cells are impassable except the goal itself (so we can path *to* the player).
 * Neighbour order = DIRS8 → deterministic tie-breaks.
 */
export function bfsFirstStep(
  map: TileMap,
  from: Cell,
  goal: Cell,
  radius: number,
  occupied?: OccupiedFn,
): Cell | null {
  if (sameCell(from, goal) || chebyshev(from, goal) > radius) return null;
  const side = radius * 2 + 1;
  const key = (x: number, y: number) => (y - from.y + radius) * side + (x - from.x + radius);
  const first = new Int8Array(side * side).fill(-1);
  const seen = new Uint8Array(side * side);
  seen[key(from.x, from.y)] = 1;
  const qx: number[] = [from.x];
  const qy: number[] = [from.y];
  for (let qi = 0; qi < qx.length; qi++) {
    const cx = qx[qi]!;
    const cy = qy[qi]!;
    for (let di = 0; di < DIRS8.length; di++) {
      const d = DIRS8[di]!;
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (Math.abs(nx - from.x) > radius || Math.abs(ny - from.y) > radius) continue;
      const k = key(nx, ny);
      if (seen[k]) continue;
      if (!canStep(map, cx, cy, d.x, d.y)) continue;
      const isGoal = nx === goal.x && ny === goal.y;
      if (!isGoal && occupied?.(nx, ny)) continue;
      seen[k] = 1;
      const fs = cx === from.x && cy === from.y ? di : first[key(cx, cy)]!;
      first[k] = fs;
      if (isGoal) return DIRS8[fs]!;
      qx.push(nx);
      qy.push(ny);
    }
  }
  return null;
}
