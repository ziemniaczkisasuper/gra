// Grid helpers for combat: reach, line of sight, BFS (mechaniki-m1.md §1.2, §1.3, §1.6),
// melee arc (wariant-twin-stick §2) and ranged Bresenham (§3).
// Movement rules (walls, no corner cutting) come from world/collision.ts – one rule for all.
import { ARC_OFFSETS } from '../data/combat-m0';
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
const keyOf = (x: number, y: number) => `${x},${y}`;

/**
 * Melee swing cells (wariant-twin-stick §2.2), in ARC_OFFSETS order for `dir` (one of DIRS8).
 * A wall does not hit and blocks its distance-2 children. A distance-1 diagonal is cut when
 * both orthogonal neighbours are walls (same corner rule as movement). Entities do not block.
 * Cells outside the map are not included (outside counts as solid via TileMap).
 */
export function arcCells(map: TileMap, from: Cell, dir: Cell): Cell[] {
  const idx = DIRS8.findIndex((d) => d.x === dir.x && d.y === dir.y);
  if (idx < 0) return [];
  const offsets = ARC_OFFSETS[idx];
  if (!offsets) return [];
  const blocked = new Set<string>();
  const out: Cell[] = [];
  for (const [dx, dy] of offsets) {
    const dist = Math.max(Math.abs(dx), Math.abs(dy));
    const px = Math.sign(dx);
    const py = Math.sign(dy);
    if (dist >= 2 && blocked.has(keyOf(px, py))) continue;
    const x = from.x + dx;
    const y = from.y + dy;
    const solid = map.isSolid(x, y);
    const cut =
      dist === 1 &&
      dx !== 0 &&
      dy !== 0 &&
      map.isSolid(from.x + dx, from.y) &&
      map.isSolid(from.x, from.y + dy);
    if (dist === 1 && (solid || cut)) {
      blocked.add(keyOf(dx, dy));
      continue;
    }
    if (solid) continue;
    out.push({ x, y });
  }
  return out;
}

/**
 * Bresenham cells from `from` (exclusive) toward `to` (inclusive), at most `maxCells`.
 * Stops before a wall and before a diagonal step whose both orthogonal neighbours are walls.
 * The start cell is not included.
 */
export function bresenhamCells(map: TileMap, from: Cell, to: Cell, maxCells: number): Cell[] {
  const out: Cell[] = [];
  if (maxCells <= 0 || (from.x === to.x && from.y === to.y)) return out;
  let x = from.x;
  let y = from.y;
  const dx = Math.abs(to.x - from.x);
  const dy = -Math.abs(to.y - from.y);
  const sx = from.x < to.x ? 1 : -1;
  const sy = from.y < to.y ? 1 : -1;
  let err = dx + dy;
  for (let guard = 0; guard < 64 && out.length < maxCells; guard++) {
    if (x === to.x && y === to.y) break;
    const e2 = 2 * err;
    let nx = x;
    let ny = y;
    let stepX = false;
    let stepY = false;
    if (e2 >= dy) {
      err += dy;
      nx += sx;
      stepX = true;
    }
    if (e2 <= dx) {
      err += dx;
      ny += sy;
      stepY = true;
    }
    if (nx === x && ny === y) break;
    if (stepX && stepY && map.isSolid(x + sx, y) && map.isSolid(x, y + sy)) break;
    if (map.isSolid(nx, ny)) break;
    out.push({ x: nx, y: ny });
    x = nx;
    y = ny;
  }
  return out;
}

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
