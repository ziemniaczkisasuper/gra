// Visual effects (FX) – data format only. Source of effects: graf/assety-m1.md (GRAF / Assety i
// Animacja) – NOT delivered yet, so this file defines types and the frame format, no effects.
// Style source: graf/styl-ascii.md v1.1 (PROPOZYCJA, not approved by the Game Director).
// Colours ONLY as PaletteKey from data/style.ts (no hex here). Renderer hook: PROG / Silnik.
//
// ---- Frame format ------------------------------------------------------------------------------
// An effect is a list of frames. Each frame is a GlyphStyle-like cell with palette keys:
//   { ch: '*', fg: 'playerShot', bg?: 'evacBg', bold?: true }
// - `ch` = exactly one code point, 1 cell wide, present in the font subset (same rule as style.ts).
// - `ch: null` = "draw the underlying cell unchanged" (gap frame for blinking / flashes);
//   `fg`/`bg` with `ch: null` recolour the underlying glyph (e.g. white hit flash, halo blink).
// - Duration: `frameMs` (all frames) or per-frame `ms`. Authored in ms (like mechanics data) and
//   converted by the renderer hook:
//     clock 'tick'   → msToTicks(ms) (50 ms TICK_MS, data/mechanics-m0.ts) – logic-synced FX
//                      (telegraph blink, strike marker), deterministic, pauses with the game;
//     clock 'render' → real-time ms in the rAF render loop – cosmetic FX (pulse, liquid,
//                      Noise glitch); still frozen while paused.
//   Durations should be multiples of 50 ms so both clocks agree.
// - `mode`: 'once' = play frames once, then the effect ends (removed); 'loop' = repeat until the
//   owner removes it; `loopDelayMs` = idle gap between loops (e.g. rarity-3 flash every 1500 ms).
// - `reduceMotion`: what to do when the "Reduce motion" setting is on (GRAF §6):
//   'skip' = don't play; 'static' = show `staticFrame` (or frame 0) instead of animating.
// - `anchor`: 'cell' = on the target cell; 'over' = overlay above the target (e.g. '!');
//   cells in `offsets` (dx, dy) for multi-cell effects (boss charge line, 3×3 swing).
import type { PaletteKey } from './style';

/** One FX cell frame – GlyphStyle with palette keys instead of hex. */
export interface FxFrame {
  /** One glyph, or null = keep the underlying glyph (only recolour / gap). */
  ch: string | null;
  fg?: PaletteKey;
  bg?: PaletteKey;
  bold?: boolean;
  /** Per-frame duration in ms (overrides FxDef.frameMs). */
  ms?: number;
}

export type FxClock = 'tick' | 'render';
export type FxMode = 'once' | 'loop';
export type FxReduceMotion = 'skip' | 'static';
export type FxAnchor = 'cell' | 'over';

export interface FxDef {
  frames: readonly FxFrame[];
  /** Default frame duration in ms (multiple of 50). */
  frameMs: number;
  clock: FxClock;
  mode: FxMode;
  /** Loop only: idle gap between repetitions, ms. */
  loopDelayMs?: number;
  reduceMotion: FxReduceMotion;
  /** Frame shown with reduceMotion 'static' (default: frames[0]). */
  staticFrame?: FxFrame;
  anchor: FxAnchor;
  /** Extra cells relative to the anchor (default: [[0, 0]]). */
  offsets?: readonly (readonly [number, number])[];
  /** Short note: source row in graf/assety-m1.md. */
  source?: string;
}

/**
 * Effect registry – EMPTY until graf/assety-m1.md arrives. Keys = effect ids from that document.
 * Usage: `export const FX = { strike: {...} } as const satisfies Record<string, FxDef>;`
 */
export const FX = {} as const satisfies Record<string, FxDef>;
export type FxId = keyof typeof FX;
