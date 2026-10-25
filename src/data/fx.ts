// Visual effects (FX) – types + registry. Data: src/data/fx-m1.ts, GENERATED from
// graf/assety-m1.md v1.0 (GRAF / Assety i Animacja, schema "graf-fx/1") by
// `node scripts/fx-import.mjs` – do not edit fx-m1.ts by hand, re-run the script.
// Style source: graf/styl-ascii.md v1.3 (ZATWIERDZONY by the Game Director).
// Colours ONLY as PaletteKey from data/style.ts (the importer maps every document hex to a key).
// All FX are purely visual: game logic never waits for an animation. Renderer hook: PROG / Silnik.
//
// ---- Frame format (graf-fx/1, assety-m1.md §0) --------------------------------------------------
// - A TRACK = { layer, priority, anchor, frames, loop?, hold?, durationMs?, reduceMotion? }.
//   An effect is one track (top-level fields), or several: `parts` (play together, optional
//   `startMs`), `states` (state machine of one object: drone, evac shaft, boss), `timelines`
//   (frame lists picked by a key, e.g. wind-up length) or `variants` (alternative frame lists).
// - A FRAME = { ms, cells?: FxCell[] } for cell layers; overlay frames carry `text` (+ fg/bold),
//   screen frames carry `dim` (+ `lines` of text ids). `ms`: positive multiple of 50 ms (1 tick),
//   or 'durationMs' (= the effect's duration) / 'untilNextState' (state-machine hold).
// - A CELL = GlyphStyle with palette keys + offset: { dx, dy, ch?, fg?, bg?, bold? }.
//   OMITTED field = INHERITED from what lies underneath (terrain → item → entity → earlier FX),
//   e.g. a cell with only `bg` recolours the background and keeps the glyph.
//   `ch` is one 1-cell glyph from the font subset, or a placeholder:
//     '{glyph}'          – the entity's own glyph (d, h, s, t, c …), for when the entity is gone;
//     '{random:<chars>}' – one random char of <chars> per frame (game PRNG; Noise glitch).
// - Timing: authored in ms; tick-synced effects use msToTicks(ms) (TICK_MS 50, data/mechanics-m0.ts),
//   cosmetic ones may run on rAF real time. Both stop while paused.
// - `loop: true` repeats the frames until durationMs / endsOn; `hold: true` = a single frame for the
//   whole duration. `durationMs` may be a mechanics parameter name ('attackWindupMs',
//   'SK3_DRONE_LIFE_MS', 'EVAC_ARRIVE_MS[depth]', 'untilNextState').
// - Layers (draw order) and priorities (higher wins inside a layer): FX_COMMON.layers / .priorities.
// - reduceMotion (GRAF §6): 'same' | 'skip' | own frame list | per-part map of those.
// Unknown/metadata fields (note, params, trigger payloads, side effects …) are kept as-is
// (`[extra: string]: unknown`) so nothing from the document is lost.
import type { PaletteKey } from './style';
import { FX_COMMON_DATA, FX_GLYPHS_M1_DATA, FX_M1_DATA, SCREEN_BASE_M1_DATA } from './fx-m1';

export type FxLayer = 'terrain' | 'ground' | 'entity' | 'cell' | 'overlay' | 'screen';
/** Frame time: ms, or a keyword resolved at runtime (see FX_DURATION_KEYWORDS in fx-params.ts). */
export type FxMs = number | string;

/** Screen-layer text line: a text id (with {tokens}) or a literal label. */
export interface FxLine {
  textId?: string;
  text?: string;
  fg: PaletteKey;
  bold?: boolean;
  /** Token → description of the runtime value, e.g. enemy_name, hit_1. */
  tokens?: Readonly<Record<string, string | undefined>>;
  /** Colour of the substituted token values. */
  tokenFg?: PaletteKey;
  /** Condition (prose), e.g. 'zjazd do bazy'. */
  onlyWhen?: string;
  /** Hide the whole line in this case, e.g. 'killerUnknown …' (M1_DEATH_01). */
  hideWhen?: string;
  /** Token order (prose), e.g. chronological, {hit_3} = killing blow. */
  order?: string;
  /** Separator between repeated tokens, e.g. ' · '. */
  separator?: string;
  /** Formatting rules (prose), e.g. how to drop empty slots. */
  rules?: readonly string[];
  /** Button line (M1_DEATH_BTN): enabled from this ms of the screen, accepted inputs. */
  activeFromMs?: number;
  input?: readonly string[];
  readonly [extra: string]: unknown;
}

/** One cell of a frame: GlyphStyle with palette keys + offset from the anchor. */
export interface FxCell {
  dx: number;
  dy: number;
  ch?: string;
  fg?: PaletteKey;
  bg?: PaletteKey;
  bold?: boolean;
}

export interface FxFrame {
  ms: FxMs;
  /** Cell layers. */
  cells?: readonly FxCell[];
  /** Overlay layer: text above the anchor (may contain {placeholders}). */
  text?: string;
  fg?: PaletteKey;
  bold?: boolean;
  /** Overlay: rise in rows during the frame (floating numbers). */
  riseRows?: number;
  /** Screen layer: dim the whole map. */
  dim?: { color: PaletteKey; alpha: number };
  /** Screen layer: text lines. */
  lines?: readonly FxLine[];
  /** Named phase of a screen (fx_death_screen: 'locked' = no skip, 'continue' = CONTINUE shown). */
  phase?: string;
  /** Cell to draw instead when the target cell is occupied (player / drone stays visible). */
  ifOccupied?: FxCell;
  readonly [extra: string]: unknown;
}

export type FxFrameList = readonly FxFrame[];
export type FxReduceMotion = 'same' | 'skip' | FxFrameList;

/** One playable track. */
export interface FxTrack {
  layer?: FxLayer;
  priority?: number;
  anchor?: string;
  frames?: FxFrameList;
  loop?: boolean;
  hold?: boolean;
  durationMs?: number | string;
  startMs?: number;
  trigger?: string | readonly string[];
  endsOn?: readonly string[];
  reduceMotion?: FxReduceMotion | Readonly<Record<string, FxReduceMotion>>;
  /** Anchor per runtime case (killerHighlight: killerAlive / killerDiedSameTick / killerUnknown). */
  anchorRules?: readonly FxAnchorRule[];
  /** Side alarm started with this state (fx_evac_shaft.states.open: R6 A). */
  alarm?: FxAlarm;
  readonly [extra: string]: unknown;
}

export interface FxAnchorRule {
  case: string;
  anchor: string;
  /** 'skip' = draw nothing in this case. */
  action?: 'skip' | string;
  cells?: string;
  frames?: string;
  note?: string;
}

export interface FxAlarm {
  trigger: string;
  /** Effect id played on every target (e.g. 'fx_alert'). */
  effect: string;
  targets: string;
  /** FX_PARAMS name of the radius. */
  radiusParam: string;
  textId?: string;
  note?: string;
}

/** An effect: a single track and/or composite parts / states / timelines / variants. */
export interface FxDef extends FxTrack {
  id: string;
  parts?: readonly (FxTrack & { name: string })[];
  states?: Readonly<Record<string, FxTrack>>;
  timelines?: Readonly<Record<string, FxFrameList>>;
  variants?: Readonly<Record<string, FxFrameList>>;
}

/** fx_common: tick, layers, anchors, priorities and the document's colour names → PaletteKey. */
export interface FxCommon {
  id: 'fx_common';
  schema: string;
  tickMs: number;
  /** Document colour name (assety-m1.md §1) → our PALETTE key (names differ, hex identical). */
  palette: Readonly<Record<string, PaletteKey>>;
  layers: readonly { name: FxLayer; order: number; note?: string }[];
  anchors: Readonly<Record<string, string>>;
  priorities: Readonly<Record<string, number>>;
  reduceMotionRule: string;
}

export const FX_COMMON: FxCommon = FX_COMMON_DATA;
/** glyphs_m1: base entity glyphs used by the effects (cells without dx/dy). */
export const FX_GLYPHS_M1: Readonly<Record<string, unknown>> = FX_GLYPHS_M1_DATA;
/** screen_base_m1: base screen layout (17×9 rows + legend) – UI / Level Design data. */
export const SCREEN_BASE_M1: Readonly<Record<string, unknown>> = SCREEN_BASE_M1_DATA;

/** Effect registry (graf/assety-m1.md v1.0). Keys = document ids. */
export const FX: Readonly<Record<string, FxDef>> = FX_M1_DATA;
export type FxId = keyof typeof FX_M1_DATA;

/** Every track of an effect (top-level, parts, states, nested state tracks like tracer/overlay). */
export function fxTracks(def: FxDef): { path: string; track: FxTrack }[] {
  const out: { path: string; track: FxTrack }[] = [];
  if (def.frames) out.push({ path: def.id, track: def });
  for (const p of def.parts ?? []) out.push({ path: `${def.id}.parts.${p.name}`, track: p });
  for (const [k, s] of Object.entries(def.states ?? {})) {
    if (s.frames) out.push({ path: `${def.id}.states.${k}`, track: s });
    for (const [nk, nv] of Object.entries(s))
      if (nv && typeof nv === 'object' && 'frames' in nv)
        out.push({ path: `${def.id}.states.${k}.${nk}`, track: nv as FxTrack });
  }
  for (const [k, f] of Object.entries(def.timelines ?? {}))
    out.push({ path: `${def.id}.timelines.${k}`, track: { ...def, frames: f } });
  for (const [k, f] of Object.entries(def.variants ?? {}))
    out.push({ path: `${def.id}.variants.${k}`, track: { ...def, frames: f } });
  return out;
}
