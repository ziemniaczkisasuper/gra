// Canvas overlay for combat feedback (§1.6, §1.7, §1.8; GRAF §9): floating numbers, 'miss',
// '+1 kill', '!' above enemies (grey = ALERT, yellow = attack wind-up),
// and the SIGNAL LOST screen. HP / kills / deaths are shown by the DOM HUD (ui/hud.ts, getCombatHud).
// Read-only: never mutates game state. Called after renderScene() each frame.
import type { GameState } from '../core/game';
import { COMBAT_STRINGS } from '../data/combat-m0';
import { COMBAT_STYLE, ENEMY_SIGNALS, FONT } from '../data/style';
import { computeCamera } from '../render/camera';
import type { GlyphRenderer } from '../render/glyph-renderer';
import { visualPos } from '../render/scene';
import { peekCombat } from './combat';

export interface CombatOverlayOptions {
  /** @deprecated ignored – the temporary canvas HP line was removed (HUD: ui/hud.ts). */
  fallbackHud?: boolean;
}

export function renderCombatOverlay(
  r: GlyphRenderer,
  state: GameState,
  alpha: number,
  _opts: CombatOverlayOptions = {},
): void {
  const c = peekCombat(state);
  if (!c) return;
  const ctx = r.ctx;
  const pv = visualPos(state.player, state.tick, alpha);
  const cam = computeCamera(
    { x: pv.x + 0.5, y: pv.y + 0.5 },
    r.cols,
    r.rows,
    state.map.width,
    state.map.height,
  );
  const camPxX = Math.round(cam.x * r.cellW);
  const camPxY = Math.round(cam.y * r.cellH);
  const cx = (x: number) => (x + 0.5) * r.cellW - camPxX;
  const cy = (y: number) => y * r.cellH - camPxY;
  const px = Math.max(12, Math.round(r.fontPx * 0.8)) * r.dpr; // §: numbers min 12 px with outline

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, 3 * r.dpr);
  ctx.strokeStyle = COMBAT_STYLE.text.outline;
  const label = (text: string, x: number, y: number, color: string, size = px) => {
    ctx.font = `bold ${size}px ${FONT.family}`;
    ctx.strokeText(text, x, y);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  };

  // '!' over the enemy's cell (glyph stays single): grey = ALERT 300 ms, yellow = wind-up (§1.7 pt 1).
  for (const e of state.entities) {
    const ec = c.enemies.get(e.id);
    if (!ec || (ec.ai !== 'alert' && !ec.attack)) continue;
    const v = visualPos(e, state.tick, alpha);
    const mark = ec.attack ? ENEMY_SIGNALS.telegraphMark : ENEMY_SIGNALS.alertMark;
    label(
      mark.glyph,
      cx(v.x),
      cy(v.y),
      ec.attack ? COMBAT_STYLE.text.telegraph : COMBAT_STYLE.text.alert,
    );
  }
  // §2.11 boss: yellow '!' over the middle top part during swing / charge wind-up (not summon).
  const b = c.boss;
  if (b && (b.phase === 'swing' || b.phase === 'chargeWindup')) {
    const top = state.entities.find((e) => e.id === b.partIds[1]);
    if (top) {
      const v = visualPos(top, state.tick, alpha);
      label(ENEMY_SIGNALS.telegraphMark.glyph, cx(v.x), cy(v.y), COMBAT_STYLE.text.telegraph);
    }
  }
  // Floating texts: rise ~0.8 cell over FLOAT_TEXT_MS.
  for (const f of c.floats) {
    const prog = 1 - (f.ttl - alpha) / f.maxTtl;
    label(f.text, cx(f.cell.x), cy(f.cell.y) - prog * 0.8 * r.cellH, COMBAT_STYLE.text[f.style]);
  }

  // §1.8: SIGNAL LOST after the 0.5 s freeze.
  if (c.death && c.death.freezeLeft === 0) {
    ctx.fillStyle = COMBAT_STYLE.text.dim;
    ctx.fillRect(0, 0, r.width, r.height);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    label(
      `${COMBAT_STRINGS.hunterTitle} – ${COMBAT_STRINGS.signalLost}`,
      r.width / 2,
      r.height / 2 - 14 * r.dpr,
      COMBAT_STYLE.text.deathTitle,
      24 * r.dpr,
    );
    label(
      COMBAT_STRINGS.reprinting,
      r.width / 2,
      r.height / 2 + 18 * r.dpr,
      COMBAT_STYLE.text.deathSub,
      16 * r.dpr,
    );
  }
  ctx.restore();
}
