// Power Lines – Line 1 (M1 terminal puzzle): data and result types. Pure logic module, no DOM.
// Rules: design/zagadki-m1/power-lines-line1.md; reference implementation: validate.py
// (Puzzle.simulate / Puzzle.preview), ported 1:1 in rules.ts. LUZ / Pracownik 4.

/** Grid cell [row, col] (0-based, same as the JSON). */
export type Cell = readonly [number, number];
/** Map key of a cell: `${row},${col}`. */
export type CellKey = `${number},${number}`;

export type FlowStatus = 'WIN' | 'DARK' | 'OVERLOAD' | 'FUSE' | 'TRIP' | 'SHORT';
export type ResultKey = FlowStatus | 'WIN_RETUNE';
export type ConsumerType = 'end' | 'mid';
export type Depth = 1 | 2 | 3;
export type ElementId =
  | 'source'
  | 'multi_source'
  | 'cable'
  | 'junction'
  | 'switch'
  | 'consumer'
  | 'ground'
  | 'fuse'
  | 'pass_through'
  | 'ring';

export interface SourceDef {
  at: Cell;
  power: number;
}
export interface FuseDef {
  at: Cell;
  max: number;
}
/** consumers[] entry (schema_version 2, data v0.5.1 – no name / type_text_id). */
export interface ConsumerDef {
  /** A–D in reading order. */
  id: string;
  at: Cell;
  need: number;
  consumer_type: ConsumerType;
}
export interface HintDef {
  /** Exactly 3 stages `<variantId>_TIP_1..3` (text ids only). */
  text_ids: readonly string[];
  tokens: Readonly<Record<string, readonly string[]>>;
  valid_if: Readonly<Record<string, unknown>>;
}

/** One variant as read from the JSON (fields the game needs; design-only fields are skipped). */
export interface PowerLinesVariant {
  id: string;
  order: number;
  depth: Depth;
  difficulty: number;
  name_text_id: string;
  context_text_id: string;
  grid: readonly string[];
  sources: readonly SourceDef[];
  fuses: readonly FuseDef[];
  consumers: readonly ConsumerDef[];
  elements: readonly ElementId[];
  new_elements: readonly ElementId[];
  affix_start_hint: Cell;
  hint: HintDef;
  solution: { taps: readonly Cell[]; final_grid: readonly string[] };
}

export interface PowerLinesHelp {
  fail_lock_ms: number;
  help_free_from_start: boolean;
  help_pulse_after_failed_sends: number;
  help_pulse_after_seconds: number;
}

export interface PowerLinesData {
  version: string;
  schema_version: 2;
  puzzle: string;
  header_text_id: string;
  retune_header_text_id: string;
  result_text_ids: Readonly<Record<ResultKey, string>>;
  help: PowerLinesHelp;
  consumer_limit: number;
  /** Sorted by `order`. */
  variants: readonly PowerLinesVariant[];
}

/** Panel row `{id} {x}/{y}`; x null = '–' (cannot be computed). */
export interface PanelRow {
  id: string;
  at: Cell;
  x: number | null;
  y: number;
  lit: boolean;
}

export interface FlowTokens {
  source_power?: number;
  box_power?: number;
  box_lines?: number;
  fuse_max?: number;
  fuse_power?: number;
}

/**
 * Result of simulate() (SEND) and preview() (live numbers) – the same keys as validate.py:
 * status, cell, got, lit, flow, through, tokens, panel. Extension: ringCells (only when
 * status === 'SHORT': cells of the closed ring(s) for the SHORT highlight, reading order).
 */
export interface FlowResult {
  status: FlowStatus;
  /** Problem cell (TRIP box, FUSE, OVERLOAD device); null otherwise. preview() never sets it. */
  cell: Cell | null;
  got: Record<CellKey, number | null>;
  lit: Record<CellKey, boolean>;
  flow: Record<CellKey, number | null>;
  /** Devices that pass power on in this state (reading order). */
  through: Cell[];
  tokens: FlowTokens;
  panel: PanelRow[];
  ringCells?: Cell[];
}
