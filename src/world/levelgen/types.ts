// Public types for the M1 level generator. Glyphs match levelgen_m1.py `render`.

import type { ContractSpawn } from '../../contracts/board';
import type { EnemyTypeId } from '../../data/combat-m0';
import type { Depth } from '../../data/contracts-m1';

export type { Depth };

export interface Cell {
  x: number;
  y: number;
}

/** Shorthand used by tests and tools. `ContractSpawn` is the in-game shape (`contractSpawns`). */
export type GeneratorContract =
  | ContractSpawn
  | { kind: 'datacore'; contractId?: number; guards?: string; itemId?: string }
  | { kind: 'clearpath'; contractId?: number; groups?: readonly string[] };

export type EnemyGlyph = 's' | 'd' | 'h' | 't';

/**
 * One enemy the combat layer can spawn later via `spawnEnemy(state, type, {x, y}, opts)`.
 * HP is `round(base × DEPTH_HP_MULT)`. Damage is not pre-multiplied: combat applies
 * `dmgMult` to the rolled blow (mechaniki §2.11).
 */
export interface EnemySpawn {
  glyph: EnemyGlyph;
  type: EnemyTypeId;
  x: number;
  y: number;
  /** Shared by one `place_group` call. Pass as `spawnEnemy` `group` (wake-up, §2.10). */
  group: number;
  /** Contract enemies drop nothing (`CONTRACT_ENEMY_LOOT` = 0). */
  contract: boolean;
  /** `datacore` | `clearpath` | `prologue1` | `prologue2` | `prologue4`, or null. */
  tag: string | null;
  contractId: number | null;
  depth: Depth;
  hp: number;
  hpMult: number;
  dmgMult: number;
  dmgMin: number;
  dmgMax: number;
  /** `ENEMY_WANDER_RADIUS`. The idle timer is rolled by combat, not here. */
  wanderRadius: number;
}

export interface BurrowSpawn {
  /** Wall cell. Debug render draws `O` here; in play the burrow is invisible. */
  wall: Cell;
  /** Passable mouth. Scrapper groups are anchored on this cell. */
  mouth: Cell;
}

export interface NoteSpawn {
  x: number;
  y: number;
  /** Depth pool id (unread first). `M1_NOTE_01` … */
  textId: string;
}

export interface ContractObjectSpawn {
  glyph: '§';
  x: number;
  y: number;
  kind: 'datacore';
  contractId: number | null;
  itemId: string;
}

/** Scripted prologue inserts (level-m1.md §3.6). Distances are BFS from the entry unless noted. */
export interface PrologueInfo {
  scrapperDist: number;
  guardDist: number;
  chestDist: number;
  guardRoom: { w: number; h: number };
  pairDist: number;
  terminalDist: number;
  /** BFS from the terminal to the nearer of the Scrapper pair. */
  pairToTerminal: number;
}

export interface LevelDistances {
  entryToShaft: number;
  entryToDown: number;
  shaftToDown: number;
  shaftToTerminal: number;
  entryToTerminal: number;
  farthestFromEntry: number;
}

export interface LevelResult {
  generatorVersion: 1;
  expSeed: number;
  depth: Depth;
  /**
   * 0-based attempt that was accepted. When `fallback` is set this is the attempt count
   * that was exhausted (the prototype's `{"attempt": max_attempts}`).
   */
  attempt: number;
  fallback: boolean;
  /** Last `GenFail` message when `fallback` is set, otherwise null. */
  fallbackReason: string | null;
  theme: 'outskirts' | 'solar' | 'depot';
  width: number;
  height: number;
  /**
   * Python `render` rows: terrain plus objects. `@` entry, `<` shaft, `>` descent or `G` arena
   * gate, `&` terminal, `O` burrow (debug), `■` chest, `?` note, `$` credits, `%` body #46,
   * `§` Data Core, `s`/`d`/`h`/`t` enemies.
   */
  rows: readonly string[];
  /**
   * Passable fraction from §2.4, taken after unreachable cells are walled and before `<`
   * becomes a wall. The shaft cell is the one cell that leaves the count afterwards.
   */
  passablePct: number;
  entry: Cell;
  shaft: Cell;
  down: Cell;
  /** `>` on depths 1–2, `G` (arena gate) on depth 3. */
  downGlyph: '>' | 'G';
  terminal: Cell;
  /** First unsolved variant of this depth, or `M1_TERM_04` in the prologue. Null when retuning. */
  terminalVariant: string | null;
  terminalRetune: boolean;
  burrows: readonly BurrowSpawn[];
  enemies: readonly EnemySpawn[];
  chests: readonly Cell[];
  notes: readonly NoteSpawn[];
  credits: readonly Cell[];
  /** Depth 2 only, until the note has been read (the caller hides it; the generator still places it). */
  body46: Cell | null;
  contractObjects: readonly ContractObjectSpawn[];
  /**
   * `streamSeed(expSeed, "lvl:s1:d{depth}:a{attempt}:loot")`. Chest contents are rolled from
   * this stream by the loot module; this generator does not draw it.
   */
  lootSeed: number;
  distances: LevelDistances;
  /** An alternate entry → descent route exists after the shortest path is blocked. */
  loop: boolean;
  /** Passable cells among the 8 neighbours of `<`. §2.4 requires ≥ 2. */
  shaftNeighbors: number;
  prologue: PrologueInfo | null;
}

export interface GenerateLevelOptions {
  expSeed: number;
  depth: Depth;
  /**
   * Active contracts for this depth. Order is significant and matches the prototype:
   * Data Core (`item`) before Clear the Path (`enemies`) reproduces przyklad-d2.
   * A `terminal` spawn adds nothing; the level terminal is always placed.
   */
  contracts?: readonly GeneratorContract[];
  /** Prologue layout and scripted inserts (level-m1.md §3.6). Depth 1 only. */
  prologue?: boolean;
  /** Defaults to `LEVEL_GEN_MAX_ATTEMPTS`. `0` returns the emergency map immediately. */
  maxAttempts?: number;
  /** Solved Power Lines variant ids. The first unsolved variant of `depth` is chosen (no RNG). */
  solvedVariants?: readonly string[];
  /** Note ids the player has already read. Unread ids of this depth are assigned first. */
  readNotes?: readonly string[];
}
