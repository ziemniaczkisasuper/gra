import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import { el } from './dom';

export interface CountdownOverlay {
  show(digit: number, total?: number): void;
  hide(): void;
  readonly visible: boolean;
}

/** ASCII countdown `3 · 2 · 1`: the current digit is big and bright, passed ones fade out. */
export function createCountdown(root: HTMLElement, safetyMs = 1500): CountdownOverlay {
  const line = el('div', { className: 'countdown-line' });
  const box = el('div', { className: 'countdown', role: 'status' }, [line]);
  box.setAttribute('aria-label', STRINGS.countdownAria);
  root.append(box);
  let timer = 0;
  const api: CountdownOverlay = {
    show(digit, total = 3) {
      line.replaceChildren();
      for (let d = total; d >= 1; d--) {
        const s = el('span', { className: 'cd-digit', textContent: String(d) });
        if (d === digit) s.classList.add('now');
        else if (d > digit) s.classList.add('past');
        line.append(s);
        if (d > 1)
          line.append(el('span', { className: 'cd-sep', textContent: UI_GLYPHS.countdownSep }));
      }
      box.classList.add('visible');
      // Safety net: never leave the overlay up if 'resumed' is missed.
      clearTimeout(timer);
      timer = window.setTimeout(api.hide, safetyMs);
    },
    hide() {
      clearTimeout(timer);
      box.classList.remove('visible');
    },
    get visible() {
      return box.classList.contains('visible');
    },
  };
  return api;
}
