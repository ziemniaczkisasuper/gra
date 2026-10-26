// Power Lines flow rules. 1:1 port of validate.py Puzzle.simulate / Puzzle.preview
// (design/zagadki-m1/power-lines-line1.md §4–§7a). Depth (§7a) limits which elements
// a variant may contain; it does not change the arithmetic below.
//
// simulate() is SEND: the first fault stops the walk (SHORT, then TRIP/FUSE in flow
// order, then OVERLOAD). preview() is the live panel: same numbers, but it keeps going
// so a later device still shows a value. preview() never sets `cell`, and it does not
// fill TRIP/FUSE tokens. WIN_RETUNE is not a flow status — a retune win is still WIN;
// the UI picks the retune text id.
//
// Extension vs Python: on SHORT, `ringCells` lists the cells of each closed ring
// (reading order) so the SHORT highlight can paint them. Feeder tails are not included.

import line1Json from './power-lines-line1.json';
import type {
  Cell,
  CellKey,
  ConsumerDef,
  ConsumerType,
  Depth,
  ElementId,
  FlowResult,
  FlowStatus,
  FlowTokens,
  FuseDef,
  HintDef,
  PowerLinesData,
  PowerLinesHelp,
  PowerLinesVariant,
  ResultKey,
  SourceDef,
} from './types';

const DIRS = [
  ['U', -1, 0],
  ['R', 0, 1],
  ['D', 1, 0],
  ['L', 0, -1],
] as const;

type Dir = (typeof DIRS)[number][0];

const OPP: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };

const DIR_ALL: ReadonlySet<Dir> = new Set(['U', 'R', 'D', 'L']);
const DIR_H: ReadonlySet<Dir> = new Set(['L', 'R']);
const DIR_V: ReadonlySet<Dir> = new Set(['U', 'D']);
const DIR_NONE: ReadonlySet<Dir> = new Set();

const ELEMENT_IDS: readonly ElementId[] = [
  'source',
  'multi_source',
  'cable',
  'junction',
  'switch',
  'consumer',
  'ground',
  'fuse',
  'pass_through',
  'ring',
];

/** Switch-mask puzzle. Bit i of a mask is `switches[i]` (reading order), as in validate.py. */
export interface PuzzleState {
  readonly grid: readonly string[];
  readonly height: number;
  readonly width: number;
  readonly sources: Readonly<Record<CellKey, number>>;
  /** Sources in reading order — the order simulate() walks them. */
  readonly sourceCells: readonly Cell[];
  readonly fuses: Readonly<Record<CellKey, number>>;
  readonly switches: readonly Cell[];
  readonly switchIndex: Readonly<Record<CellKey, number>>;
  readonly consumers: readonly Cell[];
  readonly letters: Readonly<Record<CellKey, string>>;
  /** Power of the only source, or null when the variant has several (or none). */
  readonly power: number | null;
}

interface PlacedPower {
  readonly at: readonly number[];
  readonly power: number;
}

interface PlacedFuse {
  readonly at: readonly number[];
  readonly max: number;
}

export function puzzleFromGrid(
  grid: readonly string[],
  sources: readonly PlacedPower[],
  fuses: readonly PlacedFuse[] = [],
): PuzzleState {
  const height = grid.length;
  const width = height > 0 ? (grid[0]?.length ?? 0) : 0;
  const switches: Cell[] = [];
  const consumers: Cell[] = [];
  for (let r = 0; r < height; r++) {
    const row = grid[r] ?? '';
    for (let c = 0; c < width; c++) {
      const glyph = row[c] ?? '';
      if (glyph === '=' || glyph === '/') switches.push([r, c]);
      else if (isConsumer(glyph)) consumers.push([r, c]);
    }
  }
  const switchIndex: Record<CellKey, number> = {};
  switches.forEach((p, i) => {
    switchIndex[key(p)] = i;
  });
  const letters: Record<CellKey, string> = {};
  consumers.forEach((p, i) => {
    letters[key(p)] = String.fromCharCode(65 + i);
  });
  const sourceMap: Record<CellKey, number> = {};
  const sourceCells: Cell[] = [];
  for (const source of sources) {
    const cell = placedCell(source.at, 'source');
    const id = key(cell);
    if (!(id in sourceMap)) sourceCells.push(cell);
    sourceMap[id] = source.power;
  }
  sourceCells.sort(compareCell);
  const fuseMap: Record<CellKey, number> = {};
  for (const fuse of fuses) {
    fuseMap[key(placedCell(fuse.at, 'fuse'))] = fuse.max;
  }
  const only = sourceCells[0];
  const power = sourceCells.length === 1 && only ? (sourceMap[key(only)] ?? null) : null;
  return {
    grid: [...grid],
    height,
    width,
    sources: sourceMap,
    sourceCells,
    fuses: fuseMap,
    switches,
    switchIndex,
    consumers,
    letters,
    power,
  };
}

export function puzzleFromVariant(variant: PowerLinesVariant): PuzzleState {
  return puzzleFromGrid(variant.grid, variant.sources, variant.fuses);
}

/** Bits set where the authored grid has `=`. */
export function startMask(puzzle: PuzzleState): number {
  let mask = 0;
  puzzle.switches.forEach((p, i) => {
    if (glyphAt(puzzle, p) === '=') mask |= 1 << i;
  });
  return mask;
}

/** Toggle each tap, starting from `start` (the authored start when omitted). */
export function maskAfterTaps(
  puzzle: PuzzleState,
  taps: readonly Cell[],
  start = startMask(puzzle),
): number {
  let mask = start;
  for (const tap of taps) {
    const index = puzzle.switchIndex[key(tap)];
    if (index === undefined) {
      throw new Error(`tap is not a switch: ${tap[0]},${tap[1]}`);
    }
    mask ^= 1 << index;
  }
  return mask;
}

/** Grid with switch glyphs rewritten for `mask`. Other cells stay as authored. */
export function gridForMask(puzzle: PuzzleState, mask: number): string[] {
  const rows = puzzle.grid.map((row) => row.split(''));
  puzzle.switches.forEach((p, i) => {
    const row = rows[p[0]];
    if (!row) return;
    row[p[1]] = (mask & (1 << i)) !== 0 ? '=' : '/';
  });
  return rows.map((row) => row.join(''));
}

/** SEND. First fault wins; later devices keep the initial 0 until the walk reaches them. */
export function simulate(puzzle: PuzzleState, mask: number): FlowResult {
  return evaluate(puzzle, mask, true);
}

/** Live numbers. Same keys as simulate(); `cell` stays null and the walk does not stop. */
export function preview(puzzle: PuzzleState, mask: number): FlowResult {
  return evaluate(puzzle, mask, false);
}

export function loadPowerLinesData(raw: unknown): PowerLinesData {
  const data = needRecord(raw, 'power lines data');
  if (data.schema_version !== 2) {
    throw new Error(`schema_version ${String(data.schema_version)} is not 2`);
  }
  const textIds = needRecord(data.result_text_ids, 'result_text_ids');
  const result_text_ids = {
    WIN: needString(textIds.WIN, 'result_text_ids.WIN'),
    WIN_RETUNE: needString(textIds.WIN_RETUNE, 'result_text_ids.WIN_RETUNE'),
    DARK: needString(textIds.DARK, 'result_text_ids.DARK'),
    OVERLOAD: needString(textIds.OVERLOAD, 'result_text_ids.OVERLOAD'),
    TRIP: needString(textIds.TRIP, 'result_text_ids.TRIP'),
    FUSE: needString(textIds.FUSE, 'result_text_ids.FUSE'),
    SHORT: needString(textIds.SHORT, 'result_text_ids.SHORT'),
  } satisfies Record<ResultKey, string>;
  const helpRaw = needRecord(data.help, 'help');
  const help: PowerLinesHelp = {
    fail_lock_ms: needNumber(helpRaw.fail_lock_ms, 'help.fail_lock_ms'),
    help_free_from_start: needBoolean(helpRaw.help_free_from_start, 'help.help_free_from_start'),
    help_pulse_after_failed_sends: needNumber(
      helpRaw.help_pulse_after_failed_sends,
      'help.help_pulse_after_failed_sends',
    ),
    help_pulse_after_seconds: needNumber(
      helpRaw.help_pulse_after_seconds,
      'help.help_pulse_after_seconds',
    ),
  };
  const variants = needArray(data.variants, 'variants')
    .map((entry, i) => parseVariant(entry, i))
    .sort((a, b) => a.order - b.order);
  return {
    version: needString(data.version, 'version'),
    schema_version: 2,
    puzzle: needString(data.puzzle, 'puzzle'),
    header_text_id: needString(data.header_text_id, 'header_text_id'),
    retune_header_text_id: needString(data.retune_header_text_id, 'retune_header_text_id'),
    result_text_ids,
    help,
    consumer_limit: needNumber(data.consumer_limit, 'consumer_limit'),
    variants,
  };
}

/** Line 1 terminals, variants sorted by `order`. */
export const powerLinesLine1: PowerLinesData = loadPowerLinesData(line1Json);

function evaluate(puzzle: PuzzleState, mask: number, strict: boolean): FlowResult {
  const got: Record<CellKey, number | null> = {};
  const lit: Record<CellKey, boolean> = {};
  const flow: Record<CellKey, number | null> = {};
  const through = new Set<CellKey>();
  const tokens: FlowTokens = {};
  if (puzzle.power !== null) tokens.source_power = puzzle.power;
  for (const consumer of puzzle.consumers) {
    got[key(consumer)] = 0;
    lit[key(consumer)] = false;
  }

  let fail: FlowStatus | null = null;
  const seenAll = new Set<CellKey>();
  const shorted = new Set<CellKey>();
  const rings: Cell[] = [];
  const sourceSet = new Set(puzzle.sourceCells.map(key));

  const finish = (status: FlowStatus, cell: Cell | null, ring?: readonly Cell[]): FlowResult => {
    const result: FlowResult = {
      status,
      cell,
      got,
      lit,
      flow,
      through: [...through].map(parseKey).sort(compareCell),
      tokens,
      panel: puzzle.consumers.map((p) => {
        const id = key(p);
        return {
          id: puzzle.letters[id] ?? '?',
          at: p,
          x: got[id] ?? null,
          y: Number(glyphAt(puzzle, p)),
          lit: lit[id] ?? false,
        };
      }),
    };
    if (status === 'SHORT') result.ringCells = ring ? dedupeSort(ring) : [];
    return result;
  };

  for (const source of puzzle.sourceCells) {
    const sk = key(source);
    if (seenAll.has(sk)) continue;
    const comp = new Set<CellKey>([sk]);
    const queue: Cell[] = [source];
    let deg = 0;
    for (let qi = 0; qi < queue.length; qi++) {
      const u = queue[qi];
      if (!u) continue;
      const nb = neighbours(puzzle, u, mask);
      deg += nb.length;
      for (const v of nb) {
        const vk = key(v);
        if (!comp.has(vk)) {
          comp.add(vk);
          queue.push(v);
        }
      }
    }
    for (const id of comp) seenAll.add(id);
    if (Math.floor(deg / 2) > comp.size - 1) {
      const cycle = ringCellsOf(puzzle, source, mask);
      if (strict) return finish('SHORT', null, cycle);
      for (const id of comp) shorted.add(id);
      rings.push(...cycle);
      fail = fail ?? 'SHORT';
    }
  }

  const deliveries = new Map<CellKey, (number | null)[]>();
  const leafOrder: Cell[] = [];

  for (const source of puzzle.sourceCells) {
    const sk = key(source);
    if (shorted.has(sk)) continue;
    const parent = new Map<CellKey, CellKey | null>([[sk, null]]);
    const children = new Map<CellKey, Cell[]>();
    const order: Cell[] = [source];
    for (let i = 0; i < order.length; i++) {
      const u = order[i];
      if (!u) continue;
      const uk = key(u);
      // Another source or a ground is a sink: the tree does not grow through it.
      if (uk !== sk && (sourceSet.has(uk) || glyphAt(puzzle, u) === '_')) {
        children.set(uk, []);
        continue;
      }
      const kids: Cell[] = [];
      const parentId = parent.get(uk) ?? null;
      for (const v of neighbours(puzzle, u, mask)) {
        if (key(v) !== parentId) kids.push(v);
      }
      children.set(uk, kids);
      for (const v of kids) {
        parent.set(key(v), uk);
        order.push(v);
      }
    }

    const live = new Map<CellKey, boolean>();
    for (let i = order.length - 1; i >= 0; i--) {
      const u = order[i];
      if (!u) continue;
      const uk = key(u);
      if (uk !== sk && sourceSet.has(uk)) {
        live.set(uk, false);
        continue;
      }
      const glyph = glyphAt(puzzle, u);
      let childLive = false;
      for (const v of children.get(uk) ?? []) {
        if (live.get(key(v))) {
          childLive = true;
          break;
        }
      }
      live.set(uk, glyph === '_' || isConsumer(glyph) || childLive);
    }

    const working = new Map<CellKey, number | null>();
    working.set(sk, puzzle.sources[sk] ?? null);
    for (const u of order) {
      const uk = key(u);
      if (!working.has(uk)) continue;
      // Null is a real value (power cannot be computed). `??` would also turn it into null.
      const stored = working.get(uk);
      const p: number | null = stored === undefined ? null : stored;
      flow[uk] = p;
      const glyph = glyphAt(puzzle, u);
      const outs: Cell[] = [];
      for (const v of children.get(uk) ?? []) {
        if (live.get(key(v))) outs.push(v);
      }

      if (glyph === '!' && p !== null) {
        const max = puzzle.fuses[uk];
        if (max === undefined) throw new Error(`fuse at ${uk} has no max`);
        if (p > max) {
          if (strict) {
            tokens.fuse_max = max;
            tokens.fuse_power = p;
            return finish('FUSE', u);
          }
          fail = fail ?? 'FUSE';
        }
      }

      if (isConsumer(glyph)) {
        const need = Number(glyph);
        if (outs.length > 0) {
          // On the path: keep `need`, pass the rest. Not enough → pass 0. Never overloads.
          through.add(uk);
          let rest: number | null;
          if (p === null) {
            got[uk] = null;
            rest = null;
          } else {
            got[uk] = p;
            lit[uk] = p >= need;
            rest = p >= need ? p - need : 0;
          }
          for (const v of outs) working.set(key(v), rest);
        } else {
          let batch = deliveries.get(uk);
          if (!batch) {
            batch = [];
            deliveries.set(uk, batch);
            leafOrder.push(u);
          }
          batch.push(p);
        }
        continue;
      }

      if (glyph === '_' || outs.length === 0) continue;
      if (p === null) {
        for (const v of outs) working.set(key(v), null);
      } else if (p % outs.length !== 0) {
        if (strict) {
          tokens.box_power = p;
          tokens.box_lines = outs.length;
          return finish('TRIP', u);
        }
        fail = fail ?? 'TRIP';
        for (const v of outs) working.set(key(v), null);
      } else {
        const share = Math.floor(p / outs.length);
        for (const v of outs) working.set(key(v), share);
      }
    }
  }

  for (const u of leafOrder) {
    const uk = key(u);
    const vals = deliveries.get(uk) ?? [];
    if (vals.some((value) => value === null)) {
      got[uk] = null;
      continue;
    }
    const tot = vals.reduce<number>((sum, value) => sum + (value ?? 0), 0);
    got[uk] = tot;
    const need = Number(glyphAt(puzzle, u));
    if (tot > need) {
      if (strict) return finish('OVERLOAD', u);
      fail = fail ?? 'OVERLOAD';
    }
    lit[uk] = tot === need;
  }

  for (const consumer of puzzle.consumers) {
    const id = key(consumer);
    if (shorted.has(id)) got[id] = null;
  }

  const allLit = puzzle.consumers.every((consumer) => lit[key(consumer)] === true);
  const status: FlowStatus = strict
    ? allLit
      ? 'WIN'
      : 'DARK'
    : (fail ?? (allLit ? 'WIN' : 'DARK'));
  return finish(status, null, status === 'SHORT' ? rings : undefined);
}

/**
 * Cells that sit on a cycle in the conducting component of `start`.
 * Undirected DFS: each back edge to a node still on the stack marks the tree path.
 */
function ringCellsOf(puzzle: PuzzleState, start: Cell, mask: number): Cell[] {
  const color = new Map<CellKey, number>();
  const parent = new Map<CellKey, CellKey | null>();
  const onCycle = new Set<CellKey>();
  const startId = key(start);
  parent.set(startId, null);

  const visit = (u: Cell): void => {
    const uk = key(u);
    color.set(uk, 1);
    for (const v of neighbours(puzzle, u, mask)) {
      const vk = key(v);
      if (parent.get(uk) === vk) continue;
      const seen = color.get(vk) ?? 0;
      if (seen === 0) {
        parent.set(vk, uk);
        visit(v);
      } else if (seen === 1) {
        let along: CellKey | null = uk;
        while (along !== null && along !== vk) {
          onCycle.add(along);
          const up = parent.get(along);
          along = up === undefined ? null : up;
        }
        onCycle.add(vk);
      }
    }
    color.set(uk, 2);
  };

  visit(start);
  return dedupeSort([...onCycle].map(parseKey));
}

function neighbours(puzzle: PuzzleState, p: Cell, mask: number): Cell[] {
  if (!conducts(puzzle, p, mask)) return [];
  const mine = ports(glyphAt(puzzle, p));
  const out: Cell[] = [];
  for (const [dir, dr, dc] of DIRS) {
    if (!mine.has(dir)) continue;
    const r = p[0] + dr;
    const c = p[1] + dc;
    if (r < 0 || c < 0 || r >= puzzle.height || c >= puzzle.width) continue;
    const q: Cell = [r, c];
    if (conducts(puzzle, q, mask) && ports(glyphAt(puzzle, q)).has(OPP[dir])) out.push(q);
  }
  return out;
}

function conducts(puzzle: PuzzleState, p: Cell, mask: number): boolean {
  const glyph = glyphAt(puzzle, p);
  if (glyph === '=' || glyph === '/') {
    const index = puzzle.switchIndex[key(p)];
    return index !== undefined && (mask & (1 << index)) !== 0;
  }
  return ports(glyph).size > 0;
}

function ports(glyph: string): ReadonlySet<Dir> {
  if (glyph === '-') return DIR_H;
  if (glyph === '|') return DIR_V;
  if (
    glyph === '*' ||
    glyph === '+' ||
    glyph === '=' ||
    glyph === '/' ||
    glyph === '!' ||
    glyph === '_' ||
    isConsumer(glyph)
  ) {
    return DIR_ALL;
  }
  return DIR_NONE;
}

function isConsumer(glyph: string): boolean {
  return glyph >= '1' && glyph <= '9';
}

function glyphAt(puzzle: PuzzleState, p: Cell): string {
  return puzzle.grid[p[0]]?.[p[1]] ?? '';
}

function key(p: Cell): CellKey {
  return `${p[0]},${p[1]}`;
}

function parseKey(id: CellKey): Cell {
  const comma = id.indexOf(',');
  return [Number(id.slice(0, comma)), Number(id.slice(comma + 1))];
}

function compareCell(a: Cell, b: Cell): number {
  if (a[0] !== b[0]) return a[0] - b[0];
  return a[1] - b[1];
}

function dedupeSort(cells: readonly Cell[]): Cell[] {
  const seen = new Set<CellKey>();
  const out: Cell[] = [];
  for (const cell of cells) {
    const id = key(cell);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(cell);
  }
  out.sort(compareCell);
  return out;
}

function placedCell(at: readonly number[], label: string): Cell {
  const r = at[0];
  const c = at[1];
  if (at.length < 2 || typeof r !== 'number' || typeof c !== 'number') {
    throw new Error(`${label} cell must be [row, col]`);
  }
  return [r, c];
}

function parseVariant(raw: unknown, index: number): PowerLinesVariant {
  const v = needRecord(raw, `variants[${index}]`);
  const hint = parseHint(v.hint, index);
  const solution = needRecord(v.solution, `variants[${index}].solution`);
  return {
    id: needString(v.id, `variants[${index}].id`),
    order: needNumber(v.order, `variants[${index}].order`),
    depth: asDepth(v.depth, index),
    difficulty: needNumber(v.difficulty, `variants[${index}].difficulty`),
    name_text_id: needString(v.name_text_id, `variants[${index}].name_text_id`),
    context_text_id: needString(v.context_text_id, `variants[${index}].context_text_id`),
    grid: needArray(v.grid, `variants[${index}].grid`).map((row, rowIndex) =>
      needString(row, `variants[${index}].grid[${rowIndex}]`),
    ),
    sources: needArray(v.sources, `variants[${index}].sources`).map((entry, i) =>
      parseSource(entry, index, i),
    ),
    fuses: needArray(v.fuses, `variants[${index}].fuses`).map((entry, i) =>
      parseFuse(entry, index, i),
    ),
    consumers: needArray(v.consumers, `variants[${index}].consumers`).map((entry, i) =>
      parseConsumer(entry, index, i),
    ),
    elements: needArray(v.elements, `variants[${index}].elements`).map((entry) =>
      asElementId(entry),
    ),
    new_elements: needArray(v.new_elements, `variants[${index}].new_elements`).map((entry) =>
      asElementId(entry),
    ),
    affix_start_hint: asCell(v.affix_start_hint, `variants[${index}].affix_start_hint`),
    hint,
    solution: {
      taps: needArray(solution.taps, `variants[${index}].solution.taps`).map((tap, i) =>
        asCell(tap, `variants[${index}].solution.taps[${i}]`),
      ),
      final_grid: needArray(solution.final_grid, `variants[${index}].solution.final_grid`).map(
        (row, i) => needString(row, `variants[${index}].solution.final_grid[${i}]`),
      ),
    },
  };
}

function parseHint(raw: unknown, index: number): HintDef {
  const hint = needRecord(raw, `variants[${index}].hint`);
  const text_ids = needArray(hint.text_ids, `variants[${index}].hint.text_ids`).map((id, i) =>
    needString(id, `variants[${index}].hint.text_ids[${i}]`),
  );
  const tokens: Record<string, string[]> = {};
  if (hint.tokens !== undefined) {
    const table = needRecord(hint.tokens, `variants[${index}].hint.tokens`);
    for (const [id, value] of Object.entries(table)) {
      tokens[id] = needArray(value, `hint.tokens.${id}`).map((token, i) =>
        needString(token, `hint.tokens.${id}[${i}]`),
      );
    }
  }
  const valid_if: Record<string, unknown> = {};
  if (hint.valid_if !== undefined) {
    const table = needRecord(hint.valid_if, `variants[${index}].hint.valid_if`);
    for (const [id, value] of Object.entries(table)) valid_if[id] = value;
  }
  return { text_ids, tokens, valid_if };
}

function parseSource(raw: unknown, variant: number, index: number): SourceDef {
  const source = needRecord(raw, `variants[${variant}].sources[${index}]`);
  return {
    at: asCell(source.at, `variants[${variant}].sources[${index}].at`),
    power: needNumber(source.power, `variants[${variant}].sources[${index}].power`),
  };
}

function parseFuse(raw: unknown, variant: number, index: number): FuseDef {
  const fuse = needRecord(raw, `variants[${variant}].fuses[${index}]`);
  return {
    at: asCell(fuse.at, `variants[${variant}].fuses[${index}].at`),
    max: needNumber(fuse.max, `variants[${variant}].fuses[${index}].max`),
  };
}

function parseConsumer(raw: unknown, variant: number, index: number): ConsumerDef {
  const consumer = needRecord(raw, `variants[${variant}].consumers[${index}]`);
  return {
    id: needString(consumer.id, `variants[${variant}].consumers[${index}].id`),
    at: asCell(consumer.at, `variants[${variant}].consumers[${index}].at`),
    need: needNumber(consumer.need, `variants[${variant}].consumers[${index}].need`),
    consumer_type: asConsumerType(consumer.consumer_type, variant, index),
  };
}

function asConsumerType(raw: unknown, variant: number, index: number): ConsumerType {
  if (raw === 'end' || raw === 'mid') return raw;
  throw new Error(`variants[${variant}].consumers[${index}].consumer_type is invalid`);
}

function asDepth(raw: unknown, index: number): Depth {
  if (raw === 1 || raw === 2 || raw === 3) return raw;
  throw new Error(`variants[${index}].depth is invalid`);
}

function asElementId(raw: unknown): ElementId {
  if (typeof raw === 'string' && (ELEMENT_IDS as readonly string[]).includes(raw)) {
    return raw as ElementId;
  }
  throw new Error(`unknown element ${String(raw)}`);
}

function asCell(raw: unknown, label: string): Cell {
  if (!Array.isArray(raw)) throw new Error(`${label} must be [row, col]`);
  return placedCell(raw, label);
}

function needRecord(raw: unknown, label: string): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`${label} must be an object`);
  }
  return raw as Record<string, unknown>;
}

function needArray(raw: unknown, label: string): unknown[] {
  if (!Array.isArray(raw)) throw new Error(`${label} must be an array`);
  return raw;
}

function needString(raw: unknown, label: string): string {
  if (typeof raw !== 'string') throw new Error(`${label} must be a string`);
  return raw;
}

function needNumber(raw: unknown, label: string): number {
  if (typeof raw !== 'number' || !Number.isFinite(raw))
    throw new Error(`${label} must be a number`);
  return raw;
}

function needBoolean(raw: unknown, label: string): boolean {
  if (typeof raw !== 'boolean') throw new Error(`${label} must be a boolean`);
  return raw;
}
