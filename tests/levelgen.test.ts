import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COMBAT_EXTRAS, ENEMY_TYPES } from '../src/data/combat-m0';
import { M0 } from '../src/data/mechanics-m0';
import { Rng, streamSeed } from '../src/core/rng';
import {
  ARENA_M1,
  BASE_M1,
  DEPTH_PARAMS,
  GENERATOR_VERSION,
  fallbackLevel,
  generateLevel,
  type Depth,
  type LevelResult,
} from '../src/world/levelgen/index';
import { cpythonSetOrder, cpythonTupleHash } from '../src/world/levelgen/pyset';
import { levelStreamSeed } from '../src/world/levelgen/rng-util';
import type { Cell } from '../src/world/levelgen/types';

/** Murmur finaliser, same as the private one in core/rng.ts. Prototype seeds are fmix32(1 + i). */
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

function signed64(h: bigint): bigint {
  const sign = 1n << 63n;
  return h >= sign ? h - (1n << 64n) : h;
}

const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/** Rendered-map floors. `<` and `O` stay walls; every other object glyph is a floor. */
const PASS = new Set([
  '.',
  ',',
  ';',
  '=',
  "'",
  '@',
  '>',
  'G',
  '&',
  's',
  'd',
  'h',
  't',
  '■',
  '?',
  '$',
  '%',
  '§',
]);

function passAt(rows: readonly string[], x: number, y: number): boolean {
  const row = rows[y];
  if (!row || x < 0 || x >= row.length) return false;
  return PASS.has(row[x]!);
}

function bfs(rows: readonly string[], starts: readonly Cell[]): Int32Array {
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
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
  while (qh < qt) {
    const i = q[qh++]!;
    const x = i % W;
    const y = (i - x) / W;
    const nd = dist[i]! + 1;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const ni = ny * W + nx;
      if (dist[ni] !== -1 || !passAt(rows, nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!passAt(rows, x + dx, y) || !passAt(rows, x, y + dy))) continue;
      dist[ni] = nd;
      q[qt++] = ni;
    }
  }
  return dist;
}

function los(rows: readonly string[], a: Cell, b: Cell): boolean {
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
    if ((x0 !== x1 || y0 !== y1) && !passAt(rows, x0, y0)) return false;
  }
  return true;
}

function chebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

function findGlyph(rows: readonly string[], ch: string): Cell[] {
  const out: Cell[] = [];
  for (let y = 0; y < rows.length; y++) {
    const row = rows[y]!;
    for (let x = 0; x < row.length; x++) if (row[x] === ch) out.push({ x, y });
  }
  return out;
}

function at(dist: Int32Array, W: number, c: Cell): number {
  return dist[c.y * W + c.x]!;
}

/**
 * Independent §2.4 / §8 check on the rendered rows.
 * Shaft distance is min(passable neighbour) + 1, because `<` is a wall.
 * Enemy distance from the shaft starts on the shaft cell (distance 0) and steps onto floors.
 */
function audit(level: LevelResult): string[] {
  const problems: string[] = [];
  const rows = level.rows;
  const H = rows.length;
  const W = rows[0]?.length ?? 0;
  const bad = (msg: string) => problems.push(msg);
  if (rows.some((r) => r.length !== W)) bad('ragged rows');
  const entries = findGlyph(rows, '@');
  const shafts = findGlyph(rows, '<');
  const downCh = level.depth < 3 ? '>' : 'G';
  const downs = findGlyph(rows, downCh);
  const terms = findGlyph(rows, '&');
  if (entries.length !== 1) bad(`entry count ${entries.length}`);
  if (shafts.length !== 1) bad(`shaft count ${shafts.length}`);
  if (downs.length !== 1) bad(`down count ${downs.length}`);
  if (terms.length !== 1) bad(`terminal count ${terms.length}`);
  if (problems.length > 0) return problems;
  const entry = entries[0]!;
  const shaft = shafts[0]!;
  const down = downs[0]!;
  const terminal = terms[0]!;
  if (entry.x !== level.entry.x || entry.y !== level.entry.y) bad('entry descriptor');
  if (shaft.x !== level.shaft.x || shaft.y !== level.shaft.y) bad('shaft descriptor');
  if (down.x !== level.down.x || down.y !== level.down.y) bad('down descriptor');
  if (terminal.x !== level.terminal.x || terminal.y !== level.terminal.y)
    bad('terminal descriptor');

  const dW = bfs(rows, [entry]);
  let passable = 0;
  let reached = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!passAt(rows, x, y)) continue;
      passable++;
      if (dW[y * W + x]! >= 0) reached++;
    }
  }
  if (reached !== passable) bad(`components ${reached}/${passable}`);
  const pct = (passable + 1) / (W * H);
  if (pct < 0.4 || pct > 0.5) bad(`passable ${pct}`);
  if (Math.abs(pct - level.passablePct) > 1e-12) bad(`pct field ${level.passablePct} vs ${pct}`);

  let neigh = Infinity;
  let shaftNb = 0;
  for (const [dx, dy] of DIRS) {
    const nx = shaft.x + dx;
    const ny = shaft.y + dy;
    if (!passAt(rows, nx, ny)) continue;
    shaftNb++;
    const v = dW[ny * W + nx]!;
    if (v >= 0 && v < neigh) neigh = v;
  }
  const dShaft = neigh + 1;
  if (shaftNb < 2) bad(`shaft neighbours ${shaftNb}`);
  if (shaftNb !== level.shaftNeighbors) bad(`shaftNeighbours field ${level.shaftNeighbors}`);
  const horiz = !passAt(rows, shaft.x - 1, shaft.y) && !passAt(rows, shaft.x + 1, shaft.y);
  const vert = !passAt(rows, shaft.x, shaft.y - 1) && !passAt(rows, shaft.x, shaft.y + 1);
  if (horiz || vert) bad('shaft in a 1-wide corridor');

  const P = DEPTH_PARAMS[level.depth];
  if (dShaft < P.shaft[0] || dShaft > P.shaft[1]) bad(`W→< ${dShaft}`);
  const dDown = at(dW, W, down);
  if (dDown < P.down[0] || dDown > P.down[1]) bad(`W→> ${dDown}`);
  const dTerm = at(dW, W, terminal);
  if (dTerm < 0) bad('terminal unreachable');

  const dS = bfs(rows, [shaft]);
  const shaftToDown = at(dS, W, down);
  if (shaftToDown < 20) bad(`<→> ${shaftToDown}`);
  const shaftToTerm = at(dS, W, terminal);
  if (shaftToTerm < 25 || shaftToTerm > 40) bad(`<→& ${shaftToTerm}`);

  if (level.distances.entryToShaft !== dShaft) bad('stored W→<');
  if (level.distances.entryToDown !== dDown) bad('stored W→>');
  if (level.distances.shaftToDown !== shaftToDown) bad('stored <→>');
  if (level.distances.shaftToTerminal !== shaftToTerm) bad('stored <→&');
  if (level.distances.entryToTerminal !== dTerm) bad('stored W→&');

  const dT = bfs(rows, [terminal]);
  const enemyCells: Cell[] = [];
  for (const ch of ['s', 'd', 'h', 't']) enemyCells.push(...findGlyph(rows, ch));
  if (enemyCells.length !== level.enemies.length) bad(`enemy glyphs ${enemyCells.length}`);
  for (const e of level.enemies) {
    if (rows[e.y]?.[e.x] !== e.glyph) bad(`enemy ${e.glyph} at ${e.x},${e.y}`);
    const c = { x: e.x, y: e.y };
    const fromW = at(dW, W, c);
    const fromS = at(dS, W, c);
    const fromT = at(dT, W, c);
    if (fromW < 10 || fromS < 10) bad(`enemy near W/< ${e.x},${e.y} (${fromW},${fromS})`);
    if (fromT < 8 || chebyshev(c, terminal) < 5) bad(`enemy near terminal ${e.x},${e.y}`);
    for (const p of [entry, shaft]) {
      if (chebyshev(c, p) <= 8 && los(rows, c, p)) bad(`enemy LOS ${e.x},${e.y}`);
    }
    const hpMult = COMBAT_EXTRAS.DEPTH_HP_MULT[level.depth - 1] ?? 1;
    if (e.hp !== Math.round(ENEMY_TYPES[e.type].hp * hpMult)) bad(`hp ${e.type}`);
    if (e.dmgMult !== (COMBAT_EXTRAS.DEPTH_DMG_MULT[level.depth - 1] ?? 1)) bad(`dmg ${e.type}`);
    if (e.wanderRadius !== M0.ENEMY_WANDER_RADIUS) bad('wander');
  }
  const pool = level.enemies.filter((e) => !e.contract).length;
  if (pool < P.enemies[0] || pool > P.enemies[1]) bad(`pool ${pool}`);

  const chests = findGlyph(rows, '■');
  const notes = findGlyph(rows, '?');
  const credits = findGlyph(rows, '$');
  const burrows = findGlyph(rows, 'O');
  const bodies = findGlyph(rows, '%');
  if (chests.length !== P.chests) bad(`chests ${chests.length}`);
  if (notes.length < P.notes[0] || notes.length > P.notes[1]) bad(`notes ${notes.length}`);
  if (credits.length < P.credits[0] || credits.length > P.credits[1])
    bad(`credits ${credits.length}`);
  if (burrows.length !== P.burrows) bad(`burrows ${burrows.length}`);
  if (level.depth === 2) {
    if (bodies.length !== 1) bad('body46 missing');
  } else if (bodies.length !== 0) bad('unexpected body');
  if (level.generatorVersion !== 1) bad('version');
  return problems;
}

function loadExample(name: string): { grid: string; footer: string } {
  const text = new TextDecoder()
    .decode(readFileSync(`docs/design/tools/${name}`))
    .replace(/\r\n/g, '\n');
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const footer = lines[lines.length - 1] ?? '';
  return { grid: lines.slice(0, -1).join('\n'), footer };
}

function assertGrid(actual: readonly string[], expected: string): void {
  const got = actual.join('\n');
  if (got === expected) return;
  const a = got.split('\n');
  const b = expected.split('\n');
  const diffs: string[] = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n && diffs.length < 6; i++) {
    if (a[i] !== b[i]) diffs.push(`line ${i}\n got ${a[i] ?? ''}\n exp ${b[i] ?? ''}`);
  }
  expect.fail(`grid mismatch (${a.length} vs ${b.length} rows)\n${diffs.join('\n')}`);
}

function footerNum(footer: string, key: string): number {
  const m = footer.match(new RegExp(`'${key}': ([0-9.]+)`));
  if (!m) throw new Error(`missing ${key} in ${footer}`);
  return Number(m[1]);
}

function pythonGrid(seed: number, depth: number, contracts = '', prologue = false): string {
  const args = [
    'docs/design/tools/levelgen_m1.py',
    '--show',
    String(seed),
    '--depth',
    String(depth),
  ];
  if (contracts) args.push('--contracts', contracts);
  if (prologue) args.push('--prologue');
  const out = execFileSync('python3', args, { encoding: 'utf8' });
  const lines = out.replace(/\r\n/g, '\n').trimEnd().split('\n');
  return lines.slice(0, -1).join('\n');
}

describe('levelgen PRNG and CPython set order', () => {
  it('matches the §8 stream vectors', () => {
    expect(streamSeed(1, 'lvl:s1:d1:a0:layout')).toBe(0x82d8d768);
    expect(levelStreamSeed(1, 1, 0, 'layout')).toBe(0x82d8d768);
    const layout = new Rng(0x82d8d768);
    expect(layout.next()).toBe(0.996280133491382);
    expect(layout.next()).toBe(0.8438291070051491);
    expect(layout.next()).toBe(0.1616089278832078);
    expect(streamSeed(0x47a11e, 'world')).toBe(0x4a3f2ad1);
    const one = new Rng(1);
    expect(one.next()).toBe(0.6270739405881613);
    expect(one.next()).toBe(0.002735721180215478);
    expect(one.next()).toBe(0.5274470399599522);
    expect(GENERATOR_VERSION).toBe(1);
  });

  it('walks a set of int pairs in CPython 3.12 order', () => {
    expect(signed64(cpythonTupleHash(0, 0))).toBe(-8458139203682520985n);
    expect(signed64(cpythonTupleHash(1, 0))).toBe(-5164621852614943976n);
    expect(signed64(cpythonTupleHash(0, 1))).toBe(-1950498447580522560n);
    expect(signed64(cpythonTupleHash(2, 3))).toBe(8409376899596376432n);
    const small: Cell[] = [];
    for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) small.push({ x, y });
    expect(cpythonSetOrder(small)).toEqual([
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
      { x: 0, y: 0 },
      { x: 3, y: 1 },
      { x: 1, y: 1 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 0, y: 2 },
      { x: 2, y: 2 },
      { x: 1, y: 0 },
      { x: 3, y: 2 },
    ]);
    const full: Cell[] = [];
    for (let y = 0; y < 40; y++) for (let x = 0; x < 64; x++) full.push({ x, y });
    expect(cpythonSetOrder(full).slice(0, 10)).toEqual([
      { x: 26, y: 21 },
      { x: 18, y: 17 },
      { x: 50, y: 6 },
      { x: 63, y: 25 },
      { x: 42, y: 2 },
      { x: 29, y: 32 },
      { x: 8, y: 9 },
      { x: 0, y: 5 },
      { x: 19, y: 18 },
      { x: 60, y: 19 },
    ]);
  });
});

describe('example maps (seed 47)', () => {
  it('reproduces przyklad-d1.txt', () => {
    const { grid, footer } = loadExample('przyklad-d1.txt');
    const lv = generateLevel({ expSeed: 47, depth: 1 });
    assertGrid(lv.rows, grid);
    expect(lv.attempt).toBe(0);
    expect(lv.fallback).toBe(false);
    expect(lv.distances.entryToShaft).toBe(footerNum(footer, 'dWS'));
    expect(lv.distances.entryToDown).toBe(footerNum(footer, 'dWD'));
    expect(lv.distances.shaftToDown).toBe(footerNum(footer, 'dSD'));
    expect(lv.distances.shaftToTerminal).toBe(footerNum(footer, 'dST'));
    expect(lv.distances.entryToTerminal).toBe(footerNum(footer, 'dWT'));
    expect(lv.distances.farthestFromEntry).toBe(footerNum(footer, 'far'));
    expect(lv.passablePct).toBe(footerNum(footer, 'pct'));
    expect(lv.shaftNeighbors).toBe(footerNum(footer, 'shaft_nb'));
    expect(lv.loop).toBe(true);
    expect(audit(lv)).toEqual([]);
    const withTerminal = generateLevel({
      expSeed: 47,
      depth: 1,
      contracts: [{ contractId: 1, kind: 'terminal' }],
    });
    expect(withTerminal.rows).toEqual(lv.rows);
  });

  it('reproduces przyklad-d2.txt (datacore then clearpath)', () => {
    const { grid, footer } = loadExample('przyklad-d2.txt');
    const contracts = [{ kind: 'datacore' as const }, { kind: 'clearpath' as const }];
    const lv = generateLevel({ expSeed: 47, depth: 2, contracts });
    assertGrid(lv.rows, grid);
    expect(lv.attempt).toBe(0);
    expect(lv.contractObjects).toHaveLength(1);
    expect(lv.contractObjects[0]?.glyph).toBe('§');
    expect(lv.enemies.some((e) => e.tag === 'datacore' && e.contract)).toBe(true);
    expect(lv.enemies.some((e) => e.tag === 'clearpath' && e.contract)).toBe(true);
    expect(lv.distances.entryToShaft).toBe(footerNum(footer, 'dWS'));
    expect(lv.distances.entryToDown).toBe(footerNum(footer, 'dWD'));
    expect(lv.passablePct).toBe(footerNum(footer, 'pct'));
    expect(lv.body46).not.toBeNull();
    expect(audit(lv)).toEqual([]);
    const spawned = generateLevel({
      expSeed: 47,
      depth: 2,
      contracts: [
        {
          contractId: 4,
          kind: 'item',
          itemId: 'M1_ITEM_DATA_CORE',
          distFromShaft: [30, 45],
          guards: 3,
          guardGroups: ['ddh'],
          enemyLoot: 0,
        },
        {
          contractId: 5,
          kind: 'enemies',
          count: 6,
          distFromShaft: [12, 20],
          groups: ['sss', 'dht'],
          enemyLoot: 0,
        },
      ],
    });
    expect(spawned.rows).toEqual(lv.rows);
  });

  it('reproduces przyklad-d3.txt', () => {
    const { grid, footer } = loadExample('przyklad-d3.txt');
    const lv = generateLevel({ expSeed: 47, depth: 3 });
    assertGrid(lv.rows, grid);
    expect(lv.downGlyph).toBe('G');
    expect(lv.attempt).toBe(0);
    expect(lv.distances.entryToShaft).toBe(footerNum(footer, 'dWS'));
    expect(lv.distances.entryToDown).toBe(footerNum(footer, 'dWD'));
    expect(lv.distances.shaftToDown).toBe(footerNum(footer, 'dSD'));
    expect(lv.passablePct).toBe(footerNum(footer, 'pct'));
    expect(audit(lv)).toEqual([]);
  });

  it('reproduces przyklad-prolog.txt', () => {
    const { grid, footer } = loadExample('przyklad-prolog.txt');
    const lv = generateLevel({ expSeed: 47, depth: 1, prologue: true });
    assertGrid(lv.rows, grid);
    expect(lv.attempt).toBe(2);
    expect(lv.terminalVariant).toBe('M1_TERM_04');
    expect(lv.prologue).toEqual({
      scrapperDist: 17,
      guardDist: 23,
      chestDist: 26,
      guardRoom: { w: 5, h: 5 },
      pairDist: 40,
      terminalDist: 59,
      pairToTerminal: 20,
    });
    expect(footer).toContain("'attempt': 2");
    expect(audit(lv)).toEqual([]);
  });
});

describe('python oracle', () => {
  it('matches levelgen_m1.py on a few seeds', () => {
    for (const seed of [1, 99]) {
      for (const depth of [1, 2, 3] as const) {
        const lv = generateLevel({ expSeed: seed, depth });
        expect(lv.rows.join('\n')).toBe(pythonGrid(seed, depth));
        expect(audit(lv)).toEqual([]);
      }
    }
    const d2 = generateLevel({
      expSeed: 47,
      depth: 2,
      contracts: [{ kind: 'datacore' }, { kind: 'clearpath' }],
    });
    expect(d2.rows.join('\n')).toBe(pythonGrid(47, 2, 'datacore,clearpath'));
    const pro = generateLevel({ expSeed: 47, depth: 1, prologue: true });
    expect(pro.rows.join('\n')).toBe(pythonGrid(47, 1, '', true));
  }, 120_000);
});

describe('determinism and fallback', () => {
  it('same expSeed and depth are deep-equal', () => {
    const opts = {
      expSeed: 47,
      depth: 2 as const,
      contracts: [{ kind: 'datacore' as const }, { kind: 'clearpath' as const }],
      solvedVariants: ['M1_TERM_05'],
      readNotes: ['M1_NOTE_05'],
    };
    expect(generateLevel(opts)).toEqual(generateLevel(opts));
    const pro = { expSeed: 47, depth: 1 as const, prologue: true };
    expect(generateLevel(pro)).toEqual(generateLevel(pro));
  });

  it('returns a playable GENERATOR_VERSION 1 map when attempts are exhausted', () => {
    const forced = generateLevel({ expSeed: 1, depth: 1, maxAttempts: 0 });
    expect(forced.fallback).toBe(true);
    expect(forced.attempt).toBe(0);
    expect(forced.generatorVersion).toBe(1);
    expect(forced.expSeed).toBe(1);
    expect(audit(forced)).toEqual([]);
    for (const depth of [1, 2, 3] as const) {
      const lv = fallbackLevel(depth, 99, 20, 'test');
      expect(lv.fallback).toBe(true);
      expect(lv.generatorVersion).toBe(1);
      expect(lv.attempt).toBe(20);
      expect(lv.theme).toBe(depth === 1 ? 'outskirts' : depth === 2 ? 'solar' : 'depot');
      expect(audit(lv)).toEqual([]);
    }
    expect(BASE_M1).toHaveLength(10);
    expect(BASE_M1[0]).toHaveLength(29);
    expect(BASE_M1[4]?.[2]).toBe('@');
    expect(ARENA_M1).toHaveLength(16);
    expect(ARENA_M1[0]).toHaveLength(30);
    expect(ARENA_M1[7]?.startsWith('G@')).toBe(true);
  });
});

describe('validation §2.4 and §8', () => {
  it('accepts 1000 prototype seeds at each of 3 depths', () => {
    for (let i = 0; i < 1000; i++) {
      const expSeed = fmix32(1 + i);
      for (const depth of [1, 2, 3] as const satisfies readonly Depth[]) {
        const lv = generateLevel({ expSeed, depth });
        const problems = audit(lv);
        if (lv.fallback || problems.length > 0) {
          throw new Error(
            `seed ${expSeed} (i=${i}) depth ${depth} attempt ${lv.attempt} fallback=${lv.fallback} ${lv.fallbackReason ?? ''} ${problems.join('; ')}`,
          );
        }
      }
    }
  }, 300_000);
});
