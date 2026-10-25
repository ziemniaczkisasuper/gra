import { COMBAT_STYLE, FONT, UI_STYLE } from '../data/style';

/** CSS custom property names fed from data/style.ts (style.css uses only these vars). */
export const CSS_VARS: Readonly<Record<string, string>> = {
  '--ui-bg': UI_STYLE.bg,
  '--ui-text': UI_STYLE.text,
  '--ui-text-strong': UI_STYLE.textStrong,
  '--ui-frame': UI_STYLE.frame,
  '--ui-accent': UI_STYLE.accent,
  '--ui-warning': UI_STYLE.warning,
  '--ui-danger': UI_STYLE.danger,
  '--ui-panel-bg': UI_STYLE.panelBg,
  '--ui-overlay-bg': UI_STYLE.overlayBg,
  '--ui-hud-bg': UI_STYLE.hudBg,
  '--ui-control-bg': UI_STYLE.controlBg,
  '--ui-control-active-bg': UI_STYLE.controlActiveBg,
  '--ui-text-backdrop': UI_STYLE.textBackdrop,
  '--ui-font': FONT.family,
  /** fx_death_screen.dim (background α 0.72) – same value as COMBAT_STYLE.text.dim. */
  '--ui-death-dim': COMBAT_STYLE.text.dim,
};

export function applyCssVars(target: HTMLElement = document.documentElement): void {
  for (const [k, v] of Object.entries(CSS_VARS)) target.style.setProperty(k, v);
}
