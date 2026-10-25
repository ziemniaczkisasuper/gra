// Canvas overlay for combat feedback (§1.6, §1.7, §1.8; GRAF §9): floating numbers, 'miss',
// '+1 kill', '!' above enemies (grey = ALERT, yellow = attack wind-up),
// SIGNAL LOST screen, and a FALLBACK HP line until PROG / UI ships the real HUD.
// Read-only: never mutates game state. Called after renderScene() each frame.
import type { GameState } from '../core/game';
import { COMBAT_STRINGS } from '../data/combat-m0';
import { COMBAT_STYLE, FONT } from '../data/style';
import { computeCamera } from '../render/camera';
import type { GlyphRenderer } from '../render/glyph-renderer';
import { visualPos } from '../render/scene';
import { peekCombat } from './combat';

export interface CombatOverlayOptions {
  /** Draw the temporary HP line (turn off once UI's DOM HUD shows HP via getCombatHud()). */
  fallbackHud?: boolean;
}

/** `HP [########--] 80/100` (§1.16 pt 8). */
export function hpBarText(hp: number, maxHp: number, width = 10): string {
  const filled = maxHp > 0 ? Math.round((Math.max(0, hp) / maxHp) * width) : 0;
  return `HP [${'#'.repeat(filled)}${'-'.repeat(width - filled)}] ${Math.max(0, hp)}/${maxHp}`;
}

export function renderCombatOverlay(
  r: GlyphRenderer,
  state: GameState,
  alpha: number,
  opts: CombatOverlayOptions = {},
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
    label(
      COMBAT_STRINGS.alert,
      cx(v.x),
      cy(v.y),
      ec.attack ? COMBAT_STYLE.text.telegraph : COMBAT_STYLE.text.alert,
    );
  }
  // Floating texts: rise ~0.8 cell over FLOAT_TEXT_MS.
  for (const f of c.floats) {
    const prog = 1 - (f.ttl - alpha) / f.maxTtl;
    label(f.text, cx(f.cell.x), cy(f.cell.y) - prog * 0.8 * r.cellH, COMBAT_STYLE.text[f.style]);
  }

  if (opts.fallbackHud ?? true) {
    const hp = Math.max(0, c.player.hp);
    const ratio = hp / c.player.maxHp;
    const color =
      ratio > 0.5
        ? COMBAT_STYLE.text.hpHigh
        : ratio >= 0.25
          ? COMBAT_STYLE.text.hpMid
          : COMBAT_STYLE.text.hpLow;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    const hudPx = 16 * r.dpr;
    const flash = c.player.hitFlash > 0;
    label(
      hpBarText(hp, c.player.maxHp),
      12 * r.dpr,
      14 * r.dpr,
      flash ? COMBAT_STYLE.text.dmgToPlayer : color,
      hudPx,
    );
    label(
      `kills ${c.stats.kills} · deaths ${c.stats.deaths}`,
      12 * r.dpr,
      14 * r.dpr + hudPx * 1.3,
      COMBAT_STYLE.text.miss,
      11 * r.dpr,
    );
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
