// Grid, 8-direction BFS, and Bresenham line of sight.
// Step cost is 1. A diagonal step is rejected when either orthogonal neighbour is blocked,
// matching `canStep` / the Python prototype's `bfs`.

import type { Cell } from './types';

/** E, W, S, N, SE, NE, SW, NW. BFS tie-breaks and burrow mouths depend on this order. */
export const DIRS8: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const PASSABLE = new Set(['.', ',', ';', '=', "'"]);

export function isTerrainPassable(ch: string): boolean {
  return PASSABLE.has(ch);
}

export interface Room {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  kind: string;
  doors: Cell[];
}

export function makeRoom(x0: number, y0: number, x1: number, y1: number, kind: string): Room {
  return { x0, y0, x1, y1, kind, doors: [] };
}

export function roomCells(r: Room): Cell[] {
  const out: Cell[] = [];
  for (let y = r.y0; y <= r.y1; y++) {
    for (let x = r.x0; x <= r.x1; x++) out.push({ x, y });
  }
  return out;
}

export function roomInside(r: Room, x: number, y: number): boolean {
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
}

/**
 * Flat char grid. `set` refuses the map border (the prototype's `Grid.set`).
 * `put` writes any in-bounds cell, including the border — used for the shaft and for
 * walling off unreachable floors.
 */
export class Grid {
  readonly cells: string[];

  constructor(
    readonly W: number,
    readonly H: number,
    fill = '#',
  ) {
    this.cells = Array.from({ length: W * H }, () => fill);
  }

  idx(x: number, y: number): number {
    return y * this.W + x;
  }

  get(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.W || y >= this.H) return '#';
    return this.cells[this.idx(x, y)]!;
  }

  set(x: number, y: number, ch: string): void {
    if (x >= 1 && x < this.W - 1 && y >= 1 && y < this.H - 1) this.cells[this.idx(x, y)] = ch;
  }

  put(x: number, y: number, ch: string): void {
    this.cells[this.idx(x, y)] = ch;
  }

  pas(x: number, y: number): boolean {
    return isTerrainPassable(this.get(x, y));
  }

  rect(x0: number, y0: number, x1: number, y1: number, ch: string): void {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) this.set(x, y, ch);
    }
  }

  rows(): string[] {
    const out: string[] = [];
    for (let y = 0; y < this.H; y++) {
      out.push(this.cells.slice(y * this.W, (y + 1) * this.W).join(''));
    }
    return out;
  }
}

export function chebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

export function nPas8(g: Grid, x: number, y: number): number {
  let n = 0;
  for (const [dx, dy] of DIRS8) if (g.pas(x + dx, y + dy)) n++;
  return n;
}

/** Orthogonal walls among E, W, S, N. */
export function wallOrth(g: Grid, x: number, y: number): number {
  let n = 0;
  for (let i = 0; i < 4; i++) {
    const d = DIRS8[i]!;
    if (!g.pas(x + d[0], y + d[1])) n++;
  }
  return n;
}

/** Width-1 corridor: both horizontal neighbours blocked, or both vertical ones. */
export function corridor1(g: Grid, x: number, y: number): boolean {
  return (!g.pas(x - 1, y) && !g.pas(x + 1, y)) || (!g.pas(x, y - 1) && !g.pas(x, y + 1));
}

/**
 * BFS distance. Every in-bounds start is distance 0 even when it is not passable (the shaft).
 * `block` is a set of flat indexes (`y * W + x`). An empty set blocks nothing — CPython treats
 * an empty set as false, and the prototype writes `if block and cell in block`.
 */
export function bfs(
  g: Grid,
  starts: readonly Cell[],
  block?: ReadonlySet<number> | null,
): Int32Array {
  const W = g.W;
  const H = g.H;
  const dist = new Int32Array(W * H);
  dist.fill(-1);
  const q = new Int32Array(W * H);
  let qh = 0;
  let qt = 0;
  for (const s of starts) {
    if (s.x < 0 || s.y < 0 || s.x >= W || s.y >= H) continue;
    const i = s.y * W + s.x;
    if (dist[i] !== -1) continue;
    dist[i] = 0;
    q[qt++] = i;
  }
  const useBlock = !!block && block.size > 0;
  while (qh < qt) {
    const i = q[qh++]!;
    const x = i % W;
    const y = (i - x) / W;
    const nd = dist[i]! + 1;
    for (let d = 0; d < 8; d++) {
      const dir = DIRS8[d]!;
      const dx = dir[0];
      const dy = dir[1];
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (dist[ni] !== -1 || !g.pas(nx, ny)) continue;
      if (useBlock && block!.has(ni)) continue;
      if (dx !== 0 && dy !== 0 && (!g.pas(x + dx, y) || !g.pas(x, y + dy))) continue;
      dist[ni] = nd;
      q[qt++] = ni;
    }
  }
  return dist;
}

export function largestComponent(g: Grid): Set<number> {
  const seen = new Set<number>();
  let best = new Set<number>();
  for (let y = 0; y < g.H; y++) {
    for (let x = 0; x < g.W; x++) {
      const k = g.idx(x, y);
      if (seen.has(k) || !g.pas(x, y)) continue;
      const dist = bfs(g, [{ x, y }]);
      const comp = new Set<number>();
      for (let i = 0; i < dist.length; i++) if (dist[i]! >= 0) comp.add(i);
      for (const c of comp) seen.add(c);
      if (comp.size > best.size) best = comp;
    }
  }
  return best;
}

/** Bresenham. Endpoints are not tested. Any other non-passable cell blocks the sightline. */
export function los(g: Grid, a: Cell, b: Cell): boolean {
  let x0 = a.x;
  let y0 = a.y;
  const x1 = b.x;
  const y1 = b.y;
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  while (x0 !== x1 || y0 !== y1) {
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x0 += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y0 += sy;
    }
    if ((x0 !== x1 || y0 !== y1) && !g.pas(x0, y0)) return false;
  }
  return true;
}

/** Carve a room: a wall rectangle, then a floor interior. */
export function buildRoom(g: Grid, r: Room, floor = '.'): void {
  g.rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1, '#');
  g.rect(r.x0, r.y0, r.x1, r.y1, floor);
}
