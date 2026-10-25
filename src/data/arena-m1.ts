// Boss arena M1 (Rail Guardian) – map from Level Design (design/level-m1.md §5, ARENA_M1 30×16,
// interior 28×14). Debug letters converted for the TileMap: `G` (gate, stays OPEN – §10 pt 1)
// → floor outside the interior rectangle, `X` (hidden shaft, a wall until the boss dies) → '#',
// `B` (boss top-left 3×2) → floor; `@` stays (player spawn marker for parseMap).
// Tracks `=`: rows 3–4 and 11–12, two 2-row lanes wall to wall (charge lanes, §2.11 GD).
// PROG / Gameplay test arena; the real map switch through the gate is Silnik's.
type Cell = { x: number; y: number };

/** Level Design source rows (debug glyphs kept for reference). */
export const ARENA_M1_LD = [
  '##############################',
  '#............................#',
  '#...,....................,...#',
  '#============================#',
  '#============================#',
  '#............................#',
  '#............................#',
  'G@..................B........X',
  '#............................#',
  '#............................#',
  '#............................#',
  '#============================#',
  '#============================#',
  '#...,....................,...#',
  '#............................#',
  '##############################',
] as const;

export interface ArenaDef {
  /** Map rows for parseMap (`@` = player entry). */
  rows: readonly string[];
  /** Boss anchor (top-left of the 3×2 body). */
  boss: Cell;
  /** Gate cell (open; the player standing there is outside the arena). */
  gate: Cell;
  /** Arena interior rectangle (inclusive). Leaving it resets the boss (resetBossArena). */
  rect: { x0: number; y0: number; x1: number; y1: number };
}

function findLetter(rows: readonly string[], ch: string): Cell {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y]!.indexOf(ch);
    if (x >= 0) return { x, y };
  }
  throw new Error(`arena: no '${ch}'`);
}

/** Converts LD rows to a playable arena definition. */
export function buildArena(ld: readonly string[]): ArenaDef {
  const boss = findLetter(ld, 'B');
  const gate = findLetter(ld, 'G');
  const rows = ld.map((r) => r.replace('G', '.').replace('X', '#').replace('B', '.'));
  const w = ld[0]!.length;
  return { rows, boss, gate, rect: { x0: 1, y0: 1, x1: w - 2, y1: ld.length - 2 } };
}

export const ARENA_M1: ArenaDef = buildArena(ARENA_M1_LD);
