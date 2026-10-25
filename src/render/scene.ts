import type { GameState } from '../core/game';
import { TILE_GLYPHS, UNKNOWN_GLYPH } from '../data/style';
import type { Entity } from '../entities/entity';
import { computeCamera } from './camera';
import type { GlyphRenderer } from './glyph-renderer';

/**
 * Visual position of an entity: logic jumps whole cells instantly; the renderer tweens the
 * last step over its duration (moveTicks) using the loop's alpha. Purely cosmetic.
 */
export function visualPos(e: Entity, tick: number, alpha: number): { x: number; y: number } {
  if (e.moveTicks <= 0) return { x: e.x, y: e.y };
  const t = Math.min(1, Math.max(0, (tick - e.moveTick + alpha) / e.moveTicks));
  return { x: e.fromX + (e.x - e.fromX) * t, y: e.fromY + (e.y - e.fromY) * t };
}

/** Draws the world (read-only access to state). */
export function renderScene(r: GlyphRenderer, state: GameState, alpha: number): void {
  const pv = visualPos(state.player, state.tick, alpha);
  // Camera follows the player's cell centre, keeping it out of the HUD safe margins.
  const cam = computeCamera(
    { x: pv.x + 0.5, y: pv.y + 0.5 },
    r.cols,
    r.rows,
    state.map.width,
    state.map.height,
  ); // margins = current UI insets (setCameraInsets), shared with the combat overlay
  // Snap the camera to whole device pixels to avoid shimmering glyphs.
  const camPxX = Math.round(cam.x * r.cellW);
  const camPxY = Math.round(cam.y * r.cellH);

  r.clear();
  const x0 = Math.max(0, Math.floor(cam.x));
  const y0 = Math.max(0, Math.floor(cam.y));
  const x1 = Math.min(state.map.width - 1, Math.ceil(cam.x + r.cols));
  const y1 = Math.min(state.map.height - 1, Math.ceil(cam.y + r.rows));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const g = TILE_GLYPHS[state.map.tile(x, y)] ?? UNKNOWN_GLYPH;
      r.draw(g, x * r.cellW - camPxX, y * r.cellH - camPxY);
    }
  }
  const drawAt = (e: Entity, v: { x: number; y: number }) =>
    r.draw(e.glyph, v.x * r.cellW - camPxX, v.y * r.cellH - camPxY);
  for (const e of state.entities) drawAt(e, visualPos(e, state.tick, alpha));
  drawAt(state.player, pv);
}
