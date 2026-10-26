// Theme layouts g1 Outskirts, g2 Solar Fields, g3 Rail Depot, plus the passable-cell tune.
// Port of gen_outskirts / gen_solar / gen_depot / tune_passable in levelgen_m1.py.
// Every `chance` / `pyInt` / `pick` / `shuffle` is in the prototype's order.

import type { Rng } from '../../core/rng';
import { Grid, buildRoom, makeRoom, type Room } from './grid';
import { PASSABLE_TUNE_MAX_RUN, PASSABLE_TUNE_TARGET, PROLOGUE_HOUSE_MIN } from './params';
import { cpythonSetOrder } from './pyset';
import { chance, pyInt, shuffle } from './rng-util';
import type { Cell } from './types';

export interface Layout {
  g: Grid;
  rooms: Room[];
}

function addDoor(g: Grid, r: Room, side: string, rng: Rng): { door: Cell; outside: Cell } | null {
  let x: number;
  let y: number;
  let ox: number;
  let oy: number;
  if (side === 'N' || side === 'S') {
    x = pyInt(rng, r.x0, r.x1);
    y = side === 'N' ? r.y0 - 1 : r.y1 + 1;
    ox = x;
    oy = y + (side === 'N' ? -1 : 1);
  } else {
    y = pyInt(rng, r.y0, r.y1);
    x = side === 'W' ? r.x0 - 1 : r.x1 + 1;
    oy = y;
    ox = x + (side === 'W' ? -1 : 1);
  }
  if (!(ox >= 1 && ox < g.W - 1 && oy >= 1 && oy < g.H - 1)) return null;
  g.set(x, y, "'");
  const door = { x, y };
  r.doors.push(door);
  return { door, outside: { x: ox, y: oy } };
}

/** g1. Streets, house lots, barricades, wrecks, rubble. `prologue` widens the street gap and houses. */
export function genOutskirts(W: number, H: number, rng: Rng, prologue: boolean): Layout {
  const g = new Grid(W, H);
  const rooms: Room[] = [];
  const vx: Array<{ x: number; w: number }> = [];
  let x = 1;
  for (;;) {
    x += pyInt(rng, 13, 18);
    if (x + 2 > W - 8) break;
    vx.push({ x, w: 2 });
    x += 2;
  }
  const hy: Array<{ y: number; w: number }> = [];
  let y = 1;
  let mainDone = false;
  for (;;) {
    y += prologue ? pyInt(rng, 10, 12) : pyInt(rng, 8, 11);
    const sw: number = !mainDone && y > Math.floor(H / 3) ? 3 : 2;
    if (y + sw > H - 6) break;
    hy.push({ y, w: sw });
    mainDone = mainDone || sw === 3;
    y += sw;
  }
  for (const v of vx) g.rect(v.x, 1, v.x + v.w - 1, H - 2, '.');
  for (const h of hy) g.rect(1, h.y, W - 2, h.y + h.w - 1, '.');

  // Captured before houses. Rubble draws in CPython set order, not row-major.
  const streetList: Cell[] = [];
  const street = new Set<number>();
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (!g.pas(xx, yy)) continue;
      streetList.push({ x: xx, y: yy });
      street.add(yy * W + xx);
    }
  }

  const xs = [1, ...vx.map((v) => v.x + v.w)];
  const xe = [...vx.map((v) => v.x - 1), W - 2];
  const ys = [1, ...hy.map((h) => h.y + h.w)];
  const ye = [...hy.map((h) => h.y - 1), H - 2];
  for (let bi = 0; bi < xs.length; bi++) {
    const bx0 = xs[bi]!;
    const bx1 = xe[bi]!;
    for (let bj = 0; bj < ys.length; bj++) {
      const by0 = ys[bj]!;
      const by1 = ye[bj]!;
      const bw = bx1 - bx0 + 1;
      let lots: Array<[number, number]> = [[bx0, bx1]];
      if (bw >= 15) {
        const cut = pyInt(rng, bx0 + 7, bx1 - 7);
        lots = [
          [bx0, cut - 1],
          [cut + 1, bx1],
        ];
      }
      for (const [lx0, lx1] of lots) {
        const lw = lx1 - lx0 + 1;
        const lh = by1 - by0 + 1;
        if (lw < 6 || lh < 5) continue;
        const top = street.has((by0 - 1) * W + lx0);
        const bot = street.has((by1 + 1) * W + lx0);
        let face: string;
        if (top && (!bot || chance(rng, 0.5))) face = 'N';
        else if (bot) face = 'S';
        else face = rng.pick(['N', 'S'] as const);
        const mi = prologue ? PROLOGUE_HOUSE_MIN : ([4, 3] as const);
        const iwHi = Math.min(8, lw - 2);
        const ihHi = Math.min(6, lh - 3);
        const iw = pyInt(rng, Math.min(mi[0], iwHi), iwHi);
        const ih = pyInt(rng, Math.min(mi[1], ihHi), ihHi);
        const hx0 = pyInt(rng, lx0 + 1, lx1 - iw);
        const yardLo = Math.min(1, lh - ih - 2);
        const yardHi = Math.min(2, lh - ih - 2);
        const yard = pyInt(rng, yardLo, yardHi);
        const hy0 = face === 'N' ? by0 + 1 + yard : by1 - yard - ih;
        const r = makeRoom(hx0, hy0, hx0 + iw - 1, hy0 + ih - 1, 'house');
        buildRoom(g, r);
        if (yard !== 0) {
          const yy0 = face === 'N' ? by0 : r.y1 + 2;
          const yy1 = face === 'N' ? r.y0 - 2 : by1;
          const xx0 = Math.max(lx0, r.x0 - 1);
          const xx1 = Math.min(lx1, r.x1 + 1);
          for (let yy = yy0; yy <= yy1; yy++) {
            for (let xx = xx0; xx <= xx1; xx++) g.set(xx, yy, chance(rng, 0.3) ? ';' : '.');
          }
        }
        addDoor(g, r, face, rng);
        if (chance(rng, 0.35)) {
          const side = face === 'N' ? 'S' : 'N';
          const res = addDoor(g, r, side, rng);
          if (res) {
            const step = side === 'S' ? 1 : -1;
            const ox = res.outside.x;
            let oy = res.outside.y;
            const path: Cell[] = [];
            while (oy > 0 && oy < H - 1 && !street.has(oy * W + ox) && path.length < 6) {
              path.push({ x: ox, y: oy });
              oy += step;
            }
            if (street.has(oy * W + ox)) {
              for (const p of path) g.set(p.x, p.y, '.');
            } else {
              g.set(res.door.x, res.door.y, '#');
              r.doors.pop();
            }
          }
        }
        rooms.push(r);
      }
    }
  }

  const barricades = pyInt(rng, 2, 4);
  for (let i = 0; i < barricades; i++) {
    if (vx.length === 0) break;
    const v = rng.pick(vx);
    const by = pyInt(rng, 3, H - 4);
    if (hy.some((h) => h.y - 1 <= by && by <= h.y + h.w)) continue;
    g.rect(v.x, by, v.x + v.w - 1, by, '#');
  }
  for (const h of hy) {
    if (h.w !== 3) continue;
    for (let wx = 2; wx < W - 3; wx++) {
      if (chance(rng, 0.06)) {
        g.set(wx, h.y, '#');
        g.set(wx + 1, h.y, '#');
      }
    }
  }
  for (const c of cpythonSetOrder(streetList)) {
    if (g.get(c.x, c.y) === '.' && chance(rng, 0.04)) g.set(c.x, c.y, ',');
  }
  return { g, rooms };
}

function boxesOverlap(
  a: readonly [number, number, number, number],
  b: readonly [number, number, number, number],
): boolean {
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

/** g2. Returns null when fewer than 3 buildings were placed (the attempt fails). */
export function genSolar(W: number, H: number, rng: Rng): Layout | null {
  const g = new Grid(W, H);
  const rooms: Room[] = [];
  g.rect(2, 2, W - 3, H - 3, '.');
  const bites = pyInt(rng, 10, 16);
  for (let i = 0; i < bites; i++) {
    const side = rng.pick(['N', 'S', 'W', 'E'] as const);
    const d = pyInt(rng, 2, 6);
    const L = pyInt(rng, 6, 14);
    if (side === 'N' || side === 'S') {
      const x0 = pyInt(rng, 2, W - 3 - L);
      const y0 = side === 'N' ? 2 : H - 2 - d;
      g.rect(x0, y0, x0 + L, y0 + d - 1, '#');
    } else {
      const y0 = pyInt(rng, 2, H - 3 - L);
      const x0 = side === 'W' ? 2 : W - 2 - d;
      g.rect(x0, y0, x0 + d - 1, y0 + L, '#');
    }
  }
  const occupied: Array<[number, number, number, number]> = [];
  const tries = pyInt(rng, 3, 5) * 6;
  for (let i = 0; i < tries; i++) {
    if (rooms.length >= 5) break;
    const iw = pyInt(rng, 6, 10);
    const ih = pyInt(rng, 4, 6);
    const x0 = pyInt(rng, 4, W - 5 - iw);
    const y0 = pyInt(rng, 4, H - 5 - ih);
    const box: [number, number, number, number] = [x0 - 3, y0 - 3, x0 + iw + 2, y0 + ih + 2];
    if (occupied.some((b) => boxesOverlap(box, b))) continue;
    const r = makeRoom(x0, y0, x0 + iw - 1, y0 + ih - 1, 'building');
    occupied.push(box);
    rooms.push(r);
  }
  if (rooms.length < 3) return null;

  const roadsX: number[] = [];
  let rx = 2;
  for (;;) {
    rx += pyInt(rng, 16, 22);
    if (rx > W - 8) break;
    roadsX.push(rx);
    rx += 2;
  }
  const roadsY: number[] = [];
  let ry = 2;
  for (;;) {
    ry += pyInt(rng, 9, 13);
    if (ry > H - 7) break;
    roadsY.push(ry);
    ry += 2;
  }
  const onRoad = (cx: number, cy: number) =>
    roadsX.some((a) => cx >= a && cx <= a + 1) || roadsY.some((a) => cy >= a && cy <= a + 1);
  const nearBld = (cx: number, cy: number) =>
    occupied.some((b) => cx >= b[0] + 1 && cx <= b[2] - 1 && cy >= b[1] + 1 && cy <= b[3] - 1);

  const phase = pyInt(rng, 0, 3);
  for (let yy = 3; yy < H - 3; yy++) {
    if ((yy + phase) % 4 !== 0 && (yy + phase) % 4 !== 1) continue;
    let xx = 3;
    while (xx < W - 3) {
      const L = pyInt(rng, 8, 14);
      const gap = 1;
      const end = Math.min(xx + L, W - 3);
      for (let k = xx; k < end; k++) {
        if (!onRoad(k, yy) && !nearBld(k, yy) && g.get(k, yy) === '.') g.set(k, yy, '#');
      }
      xx += L + gap;
    }
  }
  for (const r of rooms) {
    buildRoom(g, r);
    const sides = shuffle(rng, ['N', 'S', 'W', 'E']);
    const n = chance(rng, 0.5) ? 1 : 2;
    for (const side of sides.slice(0, n)) {
      const res = addDoor(g, r, side, rng);
      if (res) g.set(res.outside.x, res.outside.y, '.');
    }
  }
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (g.get(xx, yy) !== '.' || rooms.some((r) => roomHolds(r, xx, yy))) continue;
      if (chance(rng, 0.08)) g.set(xx, yy, ';');
      else if (chance(rng, 0.02)) g.set(xx, yy, ',');
    }
  }
  return { g, rooms };
}

function roomHolds(r: Room, x: number, y: number): boolean {
  return x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1;
}

/** g3. Three track corridors, halls, offices, vertical links, dead branches. */
export function genDepot(W: number, H: number, rng: Rng): Layout {
  const g = new Grid(W, H);
  const rooms: Room[] = [];
  const n = 3;
  const band = Math.floor((H - 2) / n);
  const tracks: number[] = [];
  for (let i = 0; i < n; i++) {
    tracks.push(1 + band * i + Math.floor(band / 2) + pyInt(rng, -1, 1));
  }
  for (const ty of tracks) {
    const x0 = pyInt(rng, 1, 3);
    const x1 = pyInt(rng, W - 4, W - 2);
    g.rect(x0, ty - 1, x1, ty + 1, '.');
    g.rect(x0, ty, x1, ty, '=');
  }
  const bounds = [1, ...tracks.map((t) => t + 3)];
  const ends = [...tracks.map((t) => t - 3), H - 2];
  for (let bi = 0; bi < bounds.length; bi++) {
    const by0 = bounds[bi]!;
    const by1 = ends[bi]!;
    if (by1 - by0 < 4) continue;
    let x = pyInt(rng, 2, 5);
    while (x < W - 8) {
      const space = by1 - by0 + 1;
      if (chance(rng, 0.4) && space >= 9 && x + 16 < W - 3) {
        const iw = pyInt(rng, 14, Math.min(22, W - 4 - x));
        const ih = Math.min(space - 2, pyInt(rng, 7, 11));
        const y0 = by0 + 1 + pyInt(rng, 0, space - 2 - ih);
        const r = makeRoom(x, y0, x + iw - 1, y0 + ih - 1, 'hall');
        buildRoom(g, r);
        const cy = Math.floor((r.y0 + r.y1) / 2);
        g.rect(r.x0, cy, r.x1, cy, '=');
        const wx = pyInt(rng, r.x0 + 2, r.x1 - 9);
        g.rect(wx, cy, wx + pyInt(rng, 5, 8), cy, '#');
        if (r.y1 - r.y0 >= 6) {
          for (let px = r.x0 + 2; px < r.x1 - 1; px += 5) {
            g.set(px, r.y0 + 1, '#');
            g.set(px, r.y1 - 1, '#');
          }
        }
        rooms.push(r);
        x += iw + 3;
      } else {
        const iw = pyInt(rng, 4, 7);
        const ih = Math.min(space - 2, pyInt(rng, 3, 5));
        if (ih < 3) {
          x += 3;
          continue;
        }
        const y0 = by0 + 1 + pyInt(rng, 0, space - 2 - ih);
        const r = makeRoom(x, y0, x + iw - 1, y0 + ih - 1, 'office');
        buildRoom(g, r);
        rooms.push(r);
        x += iw + pyInt(rng, 2, 4);
      }
    }
  }
  for (const r of rooms) {
    const want = r.kind === 'hall' ? 2 : chance(rng, 0.3) ? 2 : 1;
    const up = tracks.filter((t) => t + 1 < r.y0);
    const dn = tracks.filter((t) => t - 1 > r.y1);
    const sides: Array<{ side: 'N' | 'S'; ty: number }> = [];
    if (up.length > 0) sides.push({ side: 'N', ty: Math.max(...up) + 1 });
    if (dn.length > 0) sides.push({ side: 'S', ty: Math.min(...dn) - 1 });
    shuffle(rng, sides);
    for (const { side, ty } of sides.slice(0, want)) {
      const dx = pyInt(rng, r.x0, r.x1);
      if (side === 'N') {
        for (let yy = ty + 1; yy < r.y0; yy++) g.set(dx, yy, '.');
        r.doors.push({ x: dx, y: r.y0 - 1 });
        g.set(dx, r.y0 - 1, "'");
      } else {
        for (let yy = r.y1 + 1; yy < ty; yy++) g.set(dx, yy, '.');
        r.doors.push({ x: dx, y: r.y1 + 1 });
        g.set(dx, r.y1 + 1, "'");
      }
    }
  }
  for (let i = 0; i < n - 1; i++) {
    const links = pyInt(rng, 1, 2);
    for (let k = 0; k < links; k++) {
      const cx = pyInt(rng, 4, W - 6);
      g.rect(cx, tracks[i]! + 2, cx + 1, tracks[i + 1]! - 2, '.');
    }
  }
  const branches = pyInt(rng, 2, 4);
  for (let i = 0; i < branches; i++) {
    const ty = rng.pick(tracks);
    const cx = pyInt(rng, 3, W - 4);
    const L = pyInt(rng, 4, 7);
    const s = rng.pick([-1, 1] as const);
    for (let k = 2; k < 2 + L; k++) g.set(cx, ty + s * k, '.');
  }
  for (let yy = 0; yy < H; yy++) {
    for (let xx = 0; xx < W; xx++) {
      if (g.get(xx, yy) === '.' && chance(rng, 0.03)) g.set(xx, yy, ',');
    }
  }
  return { g, rooms };
}

/**
 * Nudge the passable ratio toward 41–49% without breaking room doors.
 * Too few floors: punch a straight run of at most 12 walls between two floors, away from rooms.
 * Too many: drop a pillar on a cell whose 8 neighbours are all floors.
 * The `tries` counter is shared by both loops, matching the prototype.
 */
export function tunePassable(g: Grid, rooms: readonly Room[], rng: Rng): void {
  const { W, H } = g;
  const tot = W * H;
  const nearRoom = (x: number, y: number) =>
    rooms.some((r) => x >= r.x0 - 2 && x <= r.x1 + 2 && y >= r.y0 - 2 && y <= r.y1 + 2);
  let npas = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.pas(x, y)) npas++;
  const [lo, hi] = PASSABLE_TUNE_TARGET;
  let tries = 0;
  while (npas < lo * tot && tries < 400) {
    tries++;
    const x = pyInt(rng, 2, W - 3);
    const y = pyInt(rng, 2, H - 3);
    if (g.pas(x, y) || nearRoom(x, y)) continue;
    const [dx, dy] = rng.pick([
      [1, 0],
      [0, 1],
    ] as const);
    if (!g.pas(x - dx, y - dy)) continue;
    let run: Cell[] | null = [];
    let cx = x;
    let cy = y;
    while (
      run !== null &&
      !g.pas(cx, cy) &&
      run.length <= PASSABLE_TUNE_MAX_RUN &&
      cx >= 1 &&
      cx < W - 1 &&
      cy >= 1 &&
      cy < H - 1
    ) {
      if (nearRoom(cx, cy)) {
        run = null;
        break;
      }
      run.push({ x: cx, y: cy });
      cx += dx;
      cy += dy;
    }
    if (!run || run.length === 0 || run.length > PASSABLE_TUNE_MAX_RUN || !g.pas(cx, cy)) continue;
    for (const c of run) g.set(c.x, c.y, '.');
    npas += run.length;
  }
  while (npas > hi * tot && tries < 4000) {
    tries++;
    const x = pyInt(rng, 2, W - 3);
    const y = pyInt(rng, 2, H - 3);
    const ch = g.get(x, y);
    if ((ch !== '.' && ch !== ',' && ch !== ';') || nearRoom(x, y)) continue;
    let neighbours = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        if (g.pas(x + dx, y + dy)) neighbours++;
      }
    }
    if (neighbours < 8) continue;
    g.set(x, y, '#');
    npas--;
  }
}
