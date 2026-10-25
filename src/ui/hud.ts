import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import { el } from './dom';

export type HpLevel = 'high' | 'mid' | 'low';

/** `[########--]` – filled cells rounded, but never 0 while alive and never full while hurt. */
export function hpBar(hp: number, maxHp: number, cells: number = UI_GLYPHS.barCells): string {
  const max = Math.max(1, maxHp);
  const v = Math.min(max, Math.max(0, hp));
  let n = Math.round((v / max) * cells);
  if (v > 0 && n === 0) n = 1;
  if (v < max && n === cells) n = cells - 1;
  return (
    UI_GLYPHS.barOpen +
    UI_GLYPHS.barFull.repeat(n) +
    UI_GLYPHS.barEmpty.repeat(cells - n) +
    UI_GLYPHS.barClose
  );
}

/** Colour band (sterowanie.md §4): > 50% high, 25–50% mid, < 25% low (+ blink). */
export function hpLevel(hp: number, maxHp: number): HpLevel {
  const r = hp / Math.max(1, maxHp);
  return r > 0.5 ? 'high' : r >= 0.25 ? 'mid' : 'low';
}

/** Full HUD line, e.g. `HP [########--] 80/100`. */
export function hpText(hp: number, maxHp: number): string {
  const v = Math.max(0, Math.round(hp));
  return `${STRINGS.hpLabel} ${hpBar(hp, maxHp)} ${v}/${Math.round(maxHp)}`;
}

export interface Hud {
  setHp(hp: number, maxHp: number): void;
  readonly element: HTMLElement;
  /** Reserved rows under HP for M1 (AT RISK, backpack, resource) – empty and hidden in M0. */
  readonly slots: { resource: HTMLElement; atRisk: HTMLElement; backpack: HTMLElement };
}

/**
 * HUD overlay (top-left, inside the safe area). DOM over the canvas – takes no map rows.
 * ASCII only: label, bar and numbers are text; colour is a second signal (bar length + number).
 */
export function createHud(root: HTMLElement): Hud {
  const label = el('span', { className: 'hp-label', textContent: STRINGS.hpLabel });
  const bar = el('span', { className: 'hp-bar' });
  const num = el('span', { className: 'hp-num' });
  const hpRow = el('div', { className: 'hud-row hp' }, [label, ' ', bar, ' ', num]);
  hpRow.setAttribute('role', 'meter');
  hpRow.setAttribute('aria-label', STRINGS.hpAria);
  const reserved = (name: string) => {
    const r = el('div', { className: `hud-row hud-reserved ${name}` });
    r.dataset.slot = name; // M1 hook
    r.hidden = true;
    return r;
  };
  const slots = {
    resource: reserved('resource'),
    atRisk: reserved('at-risk'),
    backpack: reserved('backpack'),
  };
  const element = el('div', { className: 'hud' }, [
    hpRow,
    slots.resource,
    slots.atRisk,
    slots.backpack,
  ]);
  root.append(element);

  let lastHp = NaN;
  let lastMax = NaN;
  let flashTimer = 0;
  return {
    element,
    slots,
    setHp(hp, maxHp) {
      if (hp === lastHp && maxHp === lastMax) return;
      const hurt = hp < lastHp;
      lastHp = hp;
      lastMax = maxHp;
      bar.textContent = hpBar(hp, maxHp);
      num.textContent = `${Math.max(0, Math.round(hp))}/${Math.round(maxHp)}`;
      hpRow.dataset.level = hpLevel(hp, maxHp);
      hpRow.setAttribute('aria-valuenow', String(Math.round(hp)));
      hpRow.setAttribute('aria-valuemax', String(Math.round(maxHp)));
      if (hurt) {
        hpRow.classList.remove('hit');
        void hpRow.offsetWidth; // restart the flash animation
        hpRow.classList.add('hit');
        clearTimeout(flashTimer);
        flashTimer = window.setTimeout(() => hpRow.classList.remove('hit'), 300);
      }
    },
  };
}
