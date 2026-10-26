// M1 level generator. Port of docs/design/tools/levelgen_m1.py (placement steps and the
// attempt loop). Streams come from src/core/rng.ts `streamSeed` / `Rng`, not from the
// prototype's copy of mulberry32. After LEVEL_GEN_MAX_ATTEMPTS failures the frozen
// emergency map is returned (the Python prototype only reported the failure).

import { DATA_CORE_ITEM_ID, type Depth } from '../../data/contracts-m1';
import { assignNoteIds, terminalChoice } from './content';
import { describeEnemy, isEnemyGlyph } from './enemy-spawn';
import { fallbackLevel } from './fallback';
import {
  DIRS8,
  Grid,
  bfs,
  chebyshev,
  corridor1,
  largestComponent,
  los,
  nPas8,
  roomCells,
  roomInside,
  wallOrth,
  type Room,
} from './grid';
import { genDepot, genOutskirts, genSolar, tunePassable } from './layout';
import {
  BURROW_MIN_DIST_ENTRY_SHAFT,
  BURROW_MIN_SPACING,
  CHEST_MIN_DIST_ENTRY,
  CHEST_MIN_SPACING,
  CLEARPATH_ENEMY_DIST,
  CLEARPATH_GROUPS,
  DATACORE_DIST,
  DATACORE_GUARDS,
  DEPTH_PARAMS,
  ENEMY_TEMPLATE,
  ENTRY_LOS_SAFE,
  GENERATOR_VERSION,
  GROUP_MIN_SPACING,
  LEVEL_GEN_MAX_ATTEMPTS,
  M2_BURROW_COVERAGE_CHECK,
  NO_ENEMY_RADIUS_ENTRY_SHAFT,
  NOTE_MIN_SPACING,
  PASSABLE_PCT,
  PROLOGUE_GUARD_DIST,
  PROLOGUE_GUARD_ROOM_FROM_ROUTE,
  PROLOGUE_GUARD_ROOM_MIN,
  PROLOGUE_NEAR_ROUTE,
  PROLOGUE_PAIR_DIST,
  PROLOGUE_REST,
  PROLOGUE_ROUTE_CLEAR,
  PROLOGUE_SCRAPPER_DIST,
  PROLOGUE_TERMINAL_DIST_FROM_ENTRY,
  PROLOGUE_TERMINAL_TRIES,
  SCRAPPER_BURROW_MIN_DIST,
  SHAFT_MIN_PASSABLE_NEIGHBORS,
  SHAFT_PREF_PASSABLE_NEIGHBORS,
  STAIRS_GATE_MIN_DIST_FROM_SHAFT,
  TERMINAL_DIST_FROM_SHAFT,
  TERMINAL_MIN_CHEB,
  TERMINAL_NO_ENEMY_RADIUS,
  inRange,
} from './params';
import { chance, levelRng, levelStreamSeed, pyInt, shuffle } from './rng-util';
import type {
  BurrowSpawn,
  Cell,
  ContractObjectSpawn,
  EnemySpawn,
  GenerateLevelOptions,
  GeneratorContract,
  LevelResult,
  NoteSpawn,
  PrologueInfo,
} from './types';

/** A placement rule failed. The attempt loop retries; anything else propagates. */
export class GenFail extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GenFail';
  }
}

const THEME = { 1: 'outskirts', 2: 'solar', 3: 'depot' } as const;

interface NormContract {
  kind: 'datacore' | 'clearpath';
  contractId: number | null;
  guards: string;
  groups: readonly string[];
  itemId: string;
}

function normalizeContracts(depth: Depth, list: readonly GeneratorContract[]): NormContract[] {
  const out: NormContract[] = [];
  for (const c of list) {
    if (c.kind === 'terminal') continue;
    if (c.kind === 'datacore') {
      out.push({
        kind: 'datacore',
        contractId: c.contractId ?? null,
        guards: c.guards ?? DATACORE_GUARDS,
        groups: [],
        itemId: c.itemId ?? DATA_CORE_ITEM_ID,
      });
    } else if (c.kind === 'clearpath') {
      out.push({
        kind: 'clearpath',
        contractId: c.contractId ?? null,
        guards: '',
        groups: c.groups ?? CLEARPATH_GROUPS[depth],
        itemId: '',
      });
    } else if (c.kind === 'item') {
      out.push({
        kind: 'datacore',
        contractId: c.contractId,
        guards: c.guardGroups[0] ?? DATACORE_GUARDS,
        groups: [],
        itemId: c.itemId,
      });
    } else {
      out.push({
        kind: 'clearpath',
        contractId: c.contractId,
        guards: '',
        groups: c.groups ?? CLEARPATH_GROUPS[depth],
        itemId: '',
      });
    }
  }
  return out;
}

function enemyGroups(depth: Depth, n: number): string[] {
  const gr = [...ENEMY_TEMPLATE[depth]];
  const base = gr.reduce((s, x) => s + x.length, 0);
  if (depth === 1) gr[0] = 's'.repeat(3 + n - base);
  else if (depth === 2) {
    if (n === base - 1) gr[0] = 'sss';
    else if (n === base + 1) {
      gr[0] = 'sss';
      gr.push('ss');
    }
  } else if (n === base - 1) gr[0] = 'sh';
  else if (n === base + 1) gr[5] = 'sh';
  const total = gr.reduce((s, x) => s + x.length, 0);
  if (total !== n) throw new Error(`levelgen: enemy groups sum to ${total}, expected ${n}`);
  return gr;
}

function objectFloor(ch: string): boolean {
  return ch === '.' || ch === ',' || ch === ';' || ch === '=';
}

function removeCell(list: Cell[], c: Cell): void {
  const i = list.findIndex((p) => p.x === c.x && p.y === c.y);
  if (i >= 0) list.splice(i, 1);
}

function groupPoints(anchor: Cell): Cell[] {
  const pts: Cell[] = [anchor];
  for (const dy of [-1, 0, 1, -2, 2]) {
    for (const dx of [-1, 0, 1, -2, 2]) {
      if (dx === 0 && dy === 0) continue;
      pts.push({ x: anchor.x + dx, y: anchor.y + dy });
    }
  }
  return pts;
}

function invariant(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`levelgen invariant: ${msg}`);
}

function burrowCoverage(free: readonly Cell[], bD: readonly Int32Array[], W: number): number {
  if (free.length === 0) return 0;
  let ok = 0;
  for (const c of free) {
    const i = c.y * W + c.x;
    if (bD.some((D) => D[i]! >= SCRAPPER_BURROW_MIN_DIST)) ok++;
  }
  return ok / free.length;
}

function trace(g: Grid, D: Int32Array, target: Cell, start: Cell): Cell[] {
  const W = g.W;
  const path: Cell[] = [target];
  let c = target;
  for (let steps = 0; steps < 100000; steps++) {
    if (c.x === start.x && c.y === start.y) break;
    let nxt: Cell | null = null;
    for (const [dx, dy] of DIRS8) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= g.W || ny >= g.H) continue;
      const diagonalOk = dx === 0 || dy === 0 || (g.pas(c.x + dx, c.y) && g.pas(c.x, c.y + dy));
      if (D[ny * W + nx] === D[c.y * W + c.x]! - 1 && diagonalOk) {
        nxt = { x: nx, y: ny };
        break;
      }
    }
    if (!nxt) throw new GenFail('trace');
    c = nxt;
    path.push(c);
  }
  return path;
}

function renderRows(
  g: Grid,
  depth: Depth,
  entry: Cell,
  shaft: Cell,
  down: Cell,
  terminal: Cell,
  burrows: readonly BurrowSpawn[],
  chests: readonly Cell[],
  notes: readonly NoteSpawn[],
  credits: readonly Cell[],
  body46: Cell | null,
  contractObjects: readonly ContractObjectSpawn[],
  enemies: readonly EnemySpawn[],
): string[] {
  const rows = g.rows().map((r) => [...r]);
  const put = (x: number, y: number, ch: string) => {
    rows[y]![x] = ch;
  };
  for (const b of burrows) put(b.wall.x, b.wall.y, 'O');
  for (const c of chests) put(c.x, c.y, '■');
  for (const n of notes) put(n.x, n.y, '?');
  for (const c of credits) put(c.x, c.y, '$');
  if (body46) put(body46.x, body46.y, '%');
  for (const o of contractObjects) put(o.x, o.y, o.glyph);
  for (const e of enemies) put(e.x, e.y, e.glyph);
  put(terminal.x, terminal.y, '&');
  put(shaft.x, shaft.y, '<');
  put(down.x, down.y, depth < 3 ? '>' : 'G');
  put(entry.x, entry.y, '@');
  return rows.map((r) => r.join(''));
}

function attemptLevel(
  expSeed: number,
  depth: Depth,
  attempt: number,
  contracts: readonly NormContract[],
  prologue: boolean,
  solvedVariants: readonly string[],
  readNotes: readonly string[],
): LevelResult {
  const P = DEPTH_PARAMS[depth];
  const W = P.W;
  const H = P.H;
  const keyOf = (c: Cell) => c.y * W + c.x;
  const at = (D: Int32Array, c: Cell) => D[keyOf(c)]!;

  const rLay = levelRng(expSeed, depth, attempt, 'layout');
  const laid =
    depth === 1
      ? genOutskirts(W, H, rLay, prologue)
      : depth === 2
        ? genSolar(W, H, rLay)
        : genDepot(W, H, rLay);
  if (!laid) throw new GenFail('layout');
  const g = laid.g;
  let rooms: Room[] = laid.rooms;
  const rObj = levelRng(expSeed, depth, attempt, 'objects');
  const rEn = levelRng(expSeed, depth, attempt, 'enemies');
  const rCon = levelRng(expSeed, depth, attempt, 'contracts');
  tunePassable(g, rooms, rLay);

  const side = depth === 3 ? 'W' : rObj.pick(['N', 'S', 'W', 'E'] as const);
  const band = 8;
  let entryCand: Cell[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!g.pas(x, y) || nPas8(g, x, y) < 5) continue;
      if (rooms.some((r) => roomInside(r, x, y))) continue;
      const onEdge =
        (side === 'W' && x <= band) ||
        (side === 'E' && x >= W - 1 - band) ||
        (side === 'N' && y <= band) ||
        (side === 'S' && y >= H - 1 - band);
      if (onEdge) entryCand.push({ x, y });
    }
  }
  const comp = largestComponent(g);
  entryCand = entryCand.filter((c) => comp.has(keyOf(c)));
  if (entryCand.length === 0) throw new GenFail('entry');
  const entry = rObj.pick(entryCand);

  let dW = bfs(g, [entry]);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (g.pas(x, y) && dW[y * W + x]! < 0) g.put(x, y, '#');
    }
  }
  rooms = rooms.filter((r) => {
    if (dW[r.y0 * W + r.x0]! >= 0) return true;
    return roomCells(r).some((c) => dW[keyOf(c)]! >= 0);
  });
  let npas = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g.pas(x, y)) npas++;
  const pct = npas / (W * H);
  if (!inRange(PASSABLE_PCT, pct)) throw new GenFail(`passable ${pct.toFixed(2)}`);

  const roomOf = new Map<number, number>();
  rooms.forEach((r, i) => {
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) roomOf.set(y * W + x, i);
    }
  });
  const free: Cell[] = [];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) if (objectFloor(g.get(x, y))) free.push({ x, y });
  }
  const taken = new Set<number>([keyOf(entry)]);

  const shaftBase = free.filter(
    (c) =>
      inRange(P.shaft, at(dW, c)) &&
      !roomOf.has(keyOf(c)) &&
      wallOrth(g, c.x, c.y) >= 1 &&
      !corridor1(g, c.x, c.y) &&
      nPas8(g, c.x, c.y) >= SHAFT_MIN_PASSABLE_NEIGHBORS,
  );
  const shaftPref = shaftBase.filter((c) => nPas8(g, c.x, c.y) >= SHAFT_PREF_PASSABLE_NEIGHBORS);
  const shaftCand = (shaftPref.length > 0 ? shaftPref : shaftBase).slice();
  shuffle(rObj, shaftCand);
  let shaft: Cell | null = null;
  const shaftTries = Math.min(30, shaftCand.length);
  for (let i = 0; i < shaftTries; i++) {
    const c = shaftCand[i]!;
    g.put(c.x, c.y, '<');
    const dW2 = bfs(g, [entry]);
    let neigh = -99;
    for (const [dx, dy] of DIRS8) {
      const nx = c.x + dx;
      const ny = c.y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const v = dW2[ny * W + nx]!;
      if (v >= 0 && (neigh === -99 || v < neigh)) neigh = v;
    }
    const dIn = neigh + 1;
    let connected = inRange(P.shaft, dIn);
    if (connected) {
      for (let y = 0; y < H && connected; y++) {
        for (let x = 0; x < W; x++) {
          if (g.pas(x, y) && dW2[y * W + x]! < 0) {
            connected = false;
            break;
          }
        }
      }
    }
    if (connected) {
      shaft = c;
      dW = dW2;
      break;
    }
    // The prototype always restores a rejected shaft cell to '.', not to its previous glyph.
    g.put(c.x, c.y, '.');
  }
  if (!shaft) throw new GenFail('shaft');
  removeCell(free, shaft);
  taken.add(keyOf(shaft));
  const dS = bfs(g, [shaft]);
  let shaftStep = Infinity;
  for (const [dx, dy] of DIRS8) {
    const nx = shaft.x + dx;
    const ny = shaft.y + dy;
    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
    const v = dW[ny * W + nx]!;
    if (v >= 0 && v < shaftStep) shaftStep = v;
  }
  dW[keyOf(shaft)] = shaftStep + 1;

  const downCand = free.filter(
    (c) =>
      inRange(P.down, at(dW, c)) &&
      at(dS, c) >= STAIRS_GATE_MIN_DIST_FROM_SHAFT &&
      !roomOf.has(keyOf(c)) &&
      wallOrth(g, c.x, c.y) >= 1,
  );
  if (downCand.length === 0) throw new GenFail('down');
  const down = rObj.pick(downCand);
  taken.add(keyOf(down));

  const enemies: EnemySpawn[] = [];
  const contractObjects: ContractObjectSpawn[] = [];
  let groupId = 0;
  // Assigned before any enemyOk call. The prologue overwrites both per terminal candidate.
  let terminal: Cell = { x: 0, y: 0 };
  // Widened: `bfs` returns Int32Array<ArrayBufferLike>, `new Int32Array` is ArrayBuffer.
  let dT: Int32Array<ArrayBufferLike> = new Int32Array(W * H);

  const enemyOk = (c: Cell): boolean => {
    if (taken.has(keyOf(c)) || !objectFloor(g.get(c.x, c.y))) return false;
    if (at(dW, c) < NO_ENEMY_RADIUS_ENTRY_SHAFT || at(dS, c) < NO_ENEMY_RADIUS_ENTRY_SHAFT)
      return false;
    if (at(dT, c) < TERMINAL_NO_ENEMY_RADIUS || chebyshev(c, terminal) < TERMINAL_MIN_CHEB)
      return false;
    for (const p of [entry, shaft]) {
      if (chebyshev(c, p) <= ENTRY_LOS_SAFE && los(g, c, p)) return false;
    }
    return true;
  };

  const placeGroup = (
    anchor: Cell,
    letters: string,
    extra: (c: Cell) => boolean,
    tag: string | null,
    contract: boolean,
    contractId: number | null,
  ): boolean => {
    const picked: Cell[] = [];
    for (const c of groupPoints(anchor)) {
      if (picked.length === letters.length) break;
      if (enemyOk(c) && extra(c) && at(dW, c) >= 0) picked.push(c);
    }
    if (picked.length < letters.length) return false;
    const group = groupId++;
    for (let i = 0; i < picked.length; i++) {
      const c = picked[i]!;
      const glyph = letters[i]!;
      if (!isEnemyGlyph(glyph)) throw new Error(`levelgen: bad enemy glyph ${glyph}`);
      taken.add(keyOf(c));
      enemies.push(describeEnemy(glyph, c.x, c.y, group, depth, tag, contract, contractId));
    }
    return true;
  };

  const okRooms = new Set<number>();
  rooms.forEach((r, i) => {
    if (r.doors.length >= 1 && r.doors.length <= 2) okRooms.add(i);
  });
  const termCand = free.filter((c) => {
    const ri = roomOf.get(keyOf(c));
    if (ri === undefined || !okRooms.has(ri)) return false;
    if (!inRange(TERMINAL_DIST_FROM_SHAFT, at(dS, c))) return false;
    if (wallOrth(g, c.x, c.y) < 1) return false;
    const room = rooms[ri]!;
    for (const dr of room.doors) if (chebyshev(c, dr) <= 1) return false;
    if (prologue && !inRange(PROLOGUE_TERMINAL_DIST_FROM_ENTRY, at(dW, c))) return false;
    return true;
  });
  if (termCand.length === 0) throw new GenFail('terminal');

  let chests: Cell[] = [];
  let cD: Int32Array[] = [];
  let prologueInfo: PrologueInfo | null = null;
  let routeOk: (c: Cell) => boolean = () => true;
  let groups: string[];
  // One enemies-stream draw, before the terminal-candidate loop. `placePrologue` reuses it
  // for PROLOGUE_REST so the rest of the pool is not a second roll.
  let prologueRoll = 0;
  let prologueGroups: readonly string[] | null = null;

  if (!prologue) {
    terminal = rObj.pick(termCand);
    taken.add(keyOf(terminal));
    dT = bfs(g, [terminal]);
  } else {
    shuffle(rObj, termCand);
    prologueRoll = pyInt(rEn, P.enemies[0], P.enemies[1]);
    let placed: PrologueInfo | null = null;
    const tries = termCand.slice(0, PROLOGUE_TERMINAL_TRIES);
    for (const tc of tries) {
      terminal = tc;
      dT = bfs(g, [terminal]);
      const nEn0 = enemies.length;
      const tk0 = new Set(taken);
      taken.add(keyOf(terminal));
      chests = [];
      cD = [];
      try {
        placed = placePrologue();
        break;
      } catch (e) {
        if (!(e instanceof GenFail)) throw e;
        enemies.length = nEn0;
        taken.clear();
        for (const k of tk0) taken.add(k);
        placed = null;
      }
    }
    if (!placed) throw new GenFail('prologue');
    prologueInfo = placed;
  }

  const mouths: BurrowSpawn[] = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (g.pas(x, y)) continue;
      for (let d = 0; d < 4; d++) {
        const dir = DIRS8[d]!;
        const m = { x: x + dir[0], y: y + dir[1] };
        if (
          g.pas(m.x, m.y) &&
          !roomOf.has(keyOf(m)) &&
          at(dW, m) >= BURROW_MIN_DIST_ENTRY_SHAFT &&
          at(dS, m) >= BURROW_MIN_DIST_ENTRY_SHAFT &&
          at(dT, m) >= TERMINAL_NO_ENEMY_RADIUS + 2 &&
          chebyshev(m, terminal) >= TERMINAL_MIN_CHEB + 2
        ) {
          mouths.push({ wall: { x, y }, mouth: m });
          break;
        }
      }
    }
  }
  shuffle(rObj, mouths);
  const burrows: BurrowSpawn[] = [];
  const bD: Int32Array[] = [];
  for (const mouth of mouths) {
    if (bD.every((D) => at(D, mouth.mouth) >= BURROW_MIN_SPACING)) {
      burrows.push(mouth);
      bD.push(bfs(g, [mouth.mouth]));
      if (burrows.length === P.burrows) break;
    }
  }
  if (burrows.length < P.burrows) throw new GenFail('burrows');

  for (const con of contracts) {
    if (con.kind === 'datacore') {
      const cand = free.filter((c) => inRange(DATACORE_DIST, at(dS, c)) && enemyOk(c));
      shuffle(rCon, cand);
      let placed = false;
      for (const c of cand) {
        taken.add(keyOf(c));
        if (placeGroup(c, con.guards, (q) => at(dS, q) >= 12, 'datacore', true, con.contractId)) {
          contractObjects.push({
            glyph: '§',
            x: c.x,
            y: c.y,
            kind: 'datacore',
            contractId: con.contractId,
            itemId: con.itemId,
          });
          placed = true;
          break;
        }
        taken.delete(keyOf(c));
      }
      if (!placed) throw new GenFail('datacore');
    }
    if (con.kind === 'clearpath') {
      if (con.groups.length < 2) throw new Error('levelgen: clearpath needs two groups');
      const cand = free.filter((c) => inRange(CLEARPATH_ENEMY_DIST, at(dS, c)) && enemyOk(c));
      shuffle(rCon, cand);
      const anchors: Int32Array[] = [];
      let done = 0;
      for (const c of cand) {
        if (done === 2) break;
        if (anchors.some((A) => at(A, c) < 6)) continue;
        const compG = con.groups[done]!;
        if (
          placeGroup(
            c,
            compG,
            (q) => inRange(CLEARPATH_ENEMY_DIST, at(dS, q)),
            'clearpath',
            true,
            con.contractId,
          )
        ) {
          anchors.push(bfs(g, [c]));
          done++;
        }
      }
      if (done < 2) throw new GenFail('clearpath');
    }
  }

  const anchorsD: Int32Array[] = [];
  const freeB = burrows.map((_, i) => i);
  if (prologue) {
    if (!prologueInfo || !prologueGroups) throw new GenFail('prologue');
    groups = [...prologueGroups];
  } else {
    chests = [];
    cD = [];
    const n = pyInt(rEn, P.enemies[0], P.enemies[1]);
    groups = enemyGroups(depth, n);
  }

  for (const compG of groups) {
    let cand: Cell[];
    if (compG[0] === 's' && freeB.length > 0) {
      const b = freeB.shift()!;
      const mouth = burrows[b]!.mouth;
      cand = [mouth];
      for (const c of free) {
        const dist = at(bD[b]!, c);
        if (dist >= 1 && dist <= 4) cand.push(c);
      }
    } else {
      cand = [];
      for (const c of free) {
        const ri = roomOf.get(keyOf(c));
        if (ri === undefined || rooms[ri]!.kind !== 'house' || chance(rEn, 0.3)) cand.push(c);
      }
      shuffle(rEn, cand);
      if (compG.includes('t')) {
        cand.sort((a, b) => nPas8(g, b.x, b.y) - nPas8(g, a.x, a.y));
      }
    }
    let ok = false;
    for (const c of cand.slice(0, 400)) {
      if (!enemyOk(c) || !routeOk(c)) continue;
      if (anchorsD.some((A) => at(A, c) < GROUP_MIN_SPACING)) continue;
      if (placeGroup(c, compG, routeOk, null, false, null)) {
        anchorsD.push(bfs(g, [c]));
        ok = true;
        break;
      }
    }
    if (!ok) throw new GenFail(`enemies ${compG}`);
  }

  const chestCand = free.filter(
    (c) =>
      !taken.has(keyOf(c)) &&
      at(dW, c) >= CHEST_MIN_DIST_ENTRY &&
      wallOrth(g, c.x, c.y) >= 1 &&
      chebyshev(c, terminal) > 3,
  );
  shuffle(rObj, chestCand);
  chestCand.sort((a, b) => (roomOf.has(keyOf(a)) ? 0 : 1) - (roomOf.has(keyOf(b)) ? 0 : 1));
  for (const c of chestCand) {
    if (cD.every((D) => at(D, c) >= CHEST_MIN_SPACING)) {
      chests.push(c);
      cD.push(bfs(g, [c]));
      taken.add(keyOf(c));
      if (chests.length === P.chests) break;
    }
  }
  if (chests.length < P.chests) throw new GenFail('chests');

  const noteWant = pyInt(rObj, P.notes[0], P.notes[1]);
  const noteCand = free.filter((c) => roomOf.has(keyOf(c)) && !taken.has(keyOf(c)));
  shuffle(rObj, noteCand);
  const noteCells: Cell[] = [];
  const nD: Int32Array[] = [];
  for (const c of noteCand) {
    if (nD.every((D) => at(D, c) >= NOTE_MIN_SPACING)) {
      noteCells.push(c);
      nD.push(bfs(g, [c]));
      taken.add(keyOf(c));
      if (noteCells.length === noteWant) break;
    }
  }
  if (noteCells.length < noteWant) throw new GenFail('notes');

  let body46: Cell | null = null;
  if (depth === 2) {
    const bodyCand = free.filter(
      (c) =>
        !roomOf.has(keyOf(c)) &&
        !taken.has(keyOf(c)) &&
        at(dW, c) >= 25 &&
        at(dW, c) <= 60 &&
        at(dS, c) >= 10 &&
        wallOrth(g, c.x, c.y) >= 1,
    );
    if (bodyCand.length === 0) throw new GenFail('body46');
    body46 = rObj.pick(bodyCand);
    taken.add(keyOf(body46));
  }
  const credits: Cell[] = [];
  const creditN = pyInt(rObj, P.credits[0], P.credits[1]);
  for (let i = 0; i < creditN; i++) {
    const credCand = free.filter((c) => !taken.has(keyOf(c)) && at(dW, c) >= 10);
    const c = rObj.pick(credCand);
    credits.push(c);
    taken.add(keyOf(c));
  }

  invariant(inRange(P.shaft, at(dW, shaft)), 'shaft distance');
  invariant(inRange(P.down, at(dW, down)), 'descent distance');
  invariant(at(dS, down) >= STAIRS_GATE_MIN_DIST_FROM_SHAFT, 'shaft to descent');
  invariant(inRange(TERMINAL_DIST_FROM_SHAFT, at(dS, terminal)), 'terminal distance');
  for (const e of enemies) {
    const c = { x: e.x, y: e.y };
    invariant(at(dW, c) >= 10 && at(dS, c) >= 10 && at(dT, c) >= 8, 'enemy distance');
  }
  for (let i = 0; i < burrows.length; i++) {
    for (let j = i + 1; j < burrows.length; j++) {
      invariant(at(bD[i]!, burrows[j]!.mouth) >= BURROW_MIN_SPACING, 'burrow spacing');
    }
  }
  for (const c of [...chests, ...noteCells, ...credits, terminal, shaft, down]) {
    invariant(at(dW, c) >= 0, 'object unreachable from entry');
  }
  if (M2_BURROW_COVERAGE_CHECK && burrowCoverage(free, bD, W) < 1) {
    throw new GenFail('burrow-coverage-M2');
  }
  invariant(nPas8(g, shaft.x, shaft.y) >= SHAFT_MIN_PASSABLE_NEIGHBORS, 'shaft neighbours');

  const blockedPath = trace(g, dW, down, entry);
  const block = new Set<number>();
  for (const p of blockedPath) {
    if (chebyshev(p, entry) > 2 && chebyshev(p, down) > 2) block.add(keyOf(p));
  }
  const alt = bfs(g, [entry], block);
  let far = -1;
  for (let i = 0; i < dW.length; i++) if (dW[i]! > far) far = dW[i]!;

  const noteIds = assignNoteIds(depth, noteCells.length, readNotes, rObj);
  const notes: NoteSpawn[] = noteCells.map((c, i) => ({ x: c.x, y: c.y, textId: noteIds[i]! }));
  const term = terminalChoice(depth, solvedVariants, prologue);
  const rows = renderRows(
    g,
    depth,
    entry,
    shaft,
    down,
    terminal,
    burrows,
    chests,
    notes,
    credits,
    body46,
    contractObjects,
    enemies,
  );

  return {
    generatorVersion: GENERATOR_VERSION,
    expSeed: expSeed >>> 0,
    depth,
    attempt,
    fallback: false,
    fallbackReason: null,
    theme: THEME[depth],
    width: W,
    height: H,
    rows,
    passablePct: pct,
    entry,
    shaft,
    down,
    downGlyph: depth < 3 ? '>' : 'G',
    terminal,
    terminalVariant: term.variant,
    terminalRetune: term.retune,
    burrows,
    enemies,
    chests,
    notes,
    credits,
    body46,
    contractObjects,
    lootSeed: levelStreamSeed(expSeed, depth, attempt, 'loot'),
    distances: {
      entryToShaft: at(dW, shaft),
      entryToDown: at(dW, down),
      shaftToDown: at(dS, down),
      shaftToTerminal: at(dS, terminal),
      entryToTerminal: at(dW, terminal),
      farthestFromEntry: far,
    },
    loop: alt[keyOf(down)]! >= 0,
    shaftNeighbors: nPas8(g, shaft.x, shaft.y),
    prologue: prologueInfo,
  };

  function placePrologue(): PrologueInfo {
    const route = trace(g, dW, terminal, entry);
    const dR = bfs(g, route);
    const near = (c: Cell) => {
      for (const p of route) if (chebyshev(c, p) <= PROLOGUE_NEAR_ROUTE) return true;
      return false;
    };
    const info: PrologueInfo = {
      scrapperDist: 0,
      guardDist: 0,
      chestDist: 0,
      guardRoom: { w: 0, h: 0 },
      pairDist: 0,
      terminalDist: 0,
      pairToTerminal: 0,
    };

    const scrCand = free.filter(
      (c) => inRange(PROLOGUE_SCRAPPER_DIST, at(dW, c)) && enemyOk(c) && near(c),
    );
    shuffle(rEn, scrCand);
    const scr = scrCand[0];
    if (!scr || !placeGroup(scr, 's', () => true, 'prologue1', false, null))
      throw new GenFail('prologue s');
    info.scrapperDist = at(dW, scr);

    const rl = rooms.filter((r) => {
      if (r.doors.length < 1 || r.doors.length > 2) return false;
      if (r.x1 - r.x0 + 1 < PROLOGUE_GUARD_ROOM_MIN) return false;
      if (r.y1 - r.y0 + 1 < PROLOGUE_GUARD_ROOM_MIN) return false;
      if (terminal.x >= r.x0 && terminal.x <= r.x1 && terminal.y >= r.y0 && terminal.y <= r.y1)
        return false;
      let doorDist = 999;
      for (const dr of r.doors) {
        const dd = dR[keyOf(dr)]!;
        const v = dd >= 0 ? dd : 999;
        if (v < doorDist) doorDist = v;
      }
      return doorDist <= PROLOGUE_GUARD_ROOM_FROM_ROUTE;
    });
    shuffle(rEn, rl);
    let best: { r: Room; guard: Cell; chest: Cell } | null = null;
    for (const r of rl) {
      const gc = roomCells(r).filter((c) => inRange(PROLOGUE_GUARD_DIST, at(dW, c)) && enemyOk(c));
      shuffle(rEn, gc);
      for (const guard of gc.slice(0, 12)) {
        const zone = new Set<number>();
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const nx = guard.x + dx;
            const ny = guard.y + dy;
            if (nx >= 0 && ny >= 0 && nx < W && ny < H) zone.add(ny * W + nx);
          }
        }
        const dBlk = bfs(g, [entry], zone);
        const ch: Cell[] = [];
        for (const c of roomCells(r)) {
          if (taken.has(keyOf(c)) || zone.has(keyOf(c))) continue;
          if (at(dW, c) < at(dW, guard) + 2) continue;
          if (dBlk[keyOf(c)]! < 0) ch.push(c);
        }
        if (ch.length > 0) {
          best = { r, guard, chest: maxChest(ch) };
          break;
        }
      }
      if (best) break;
    }
    if (!best) throw new GenFail('prologue guard room');
    if (!placeGroup(best.guard, 'h', () => true, 'prologue2', false, null))
      throw new GenFail('prologue h');
    taken.add(keyOf(best.chest));
    chests.push(best.chest);
    cD.push(bfs(g, [best.chest]));
    info.guardDist = at(dW, best.guard);
    info.chestDist = at(dW, best.chest);
    info.guardRoom = { w: best.r.x1 - best.r.x0 + 1, h: best.r.y1 - best.r.y0 + 1 };

    const pairCand = free.filter(
      (c) => inRange(PROLOGUE_PAIR_DIST, at(dW, c)) && enemyOk(c) && near(c),
    );
    shuffle(rEn, pairCand);
    let pair: Cell | null = null;
    for (const c of pairCand) {
      if (
        placeGroup(c, 'ss', (q) => inRange(PROLOGUE_PAIR_DIST, at(dW, q)), 'prologue4', false, null)
      ) {
        pair = c;
        break;
      }
    }
    if (!pair) throw new GenFail('prologue ss');
    info.pairDist = at(dW, pair);
    info.terminalDist = at(dW, terminal);
    let pairT = Infinity;
    for (const e of enemies) {
      if (e.tag !== 'prologue4') continue;
      const d = at(dT, { x: e.x, y: e.y });
      if (d < pairT) pairT = d;
    }
    info.pairToTerminal = pairT;

    const rest = PROLOGUE_REST[prologueRoll];
    if (!rest) throw new Error(`levelgen: prologue pool ${prologueRoll}`);
    prologueGroups = rest;
    routeOk = (c) => dR[keyOf(c)]! >= PROLOGUE_ROUTE_CLEAR;
    return info;
  }

  function maxChest(cells: Cell[]): Cell {
    let best = cells[0]!;
    let bestD = at(dW, best);
    let bestW = wallOrth(g, best.x, best.y);
    for (let i = 1; i < cells.length; i++) {
      const c = cells[i]!;
      const d = at(dW, c);
      const w = wallOrth(g, c.x, c.y);
      if (d > bestD || (d === bestD && w > bestW)) {
        best = c;
        bestD = d;
        bestW = w;
      }
    }
    return best;
  }
}

/**
 * Build one Sector 1 level. Pure: the same `expSeed`, depth, contracts, and prologue flag
 * always return the same result. A failed attempt retries with `attempt + 1` (new streams).
 * After `maxAttempts` failures the frozen emergency map for that depth is returned.
 */
export function generateLevel(opts: GenerateLevelOptions): LevelResult {
  const depth = opts.depth;
  const expSeed = opts.expSeed;
  const maxAttempts = opts.maxAttempts ?? LEVEL_GEN_MAX_ATTEMPTS;
  const contracts = normalizeContracts(depth, opts.contracts ?? []);
  const prologue = opts.prologue ?? false;
  const solved = opts.solvedVariants ?? [];
  const readNotes = opts.readNotes ?? [];
  let last = 'no attempts';
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return attemptLevel(expSeed, depth, attempt, contracts, prologue, solved, readNotes);
    } catch (e) {
      if (!(e instanceof GenFail)) throw e;
      last = e.message;
    }
  }
  return fallbackLevel(depth, expSeed, maxAttempts, last);
}
