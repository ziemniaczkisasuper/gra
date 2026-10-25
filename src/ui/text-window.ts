import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import { button, el } from './dom';

export interface TextWindowHandlers {
  /** Window opened: pause the game with reason 'text'. */
  onOpen(): void;
  /**
   * Window closed: resume (main.ts: `loop.resume({ countdown: loop.autoPausedDuring })`).
   * `closingKey` = KeyboardEvent.code that closed it (none for the CLOSE button); it must not
   * act in the game until released (mechaniki v0.4).
   */
  onClose(closingKey?: string): void;
}

export interface TextWindow {
  /** Open with text fragments (2–3 sentences each, one page per fragment). */
  show(fragments: readonly string[]): void;
  close(): void;
  next(): void;
  readonly isOpen: boolean;
  readonly page: number;
}

/** Keys that turn the page (or close on the last page). Esc always closes. */
export const TEXT_NEXT_CODES: readonly string[] = ['Enter', 'NumpadEnter', 'Space', 'KeyE', 'KeyJ'];

/**
 * In-world text window (notes, terminals – sterowanie.md "Pauza przy czytaniu tekstów").
 * Centred, dark, larger font than the HUD; NEXT / CLOSE buttons (≥ 48 dp). Taps outside the
 * window do nothing. While open it owns the keyboard (capture phase on `document`), so Esc
 * closes the text and never reaches the input layer / pause menu.
 */
export function createTextWindow(
  root: HTMLElement,
  h: TextWindowHandlers,
  doc: Document = document,
): TextWindow {
  const pageInfo = el('span', { className: 'text-page' });
  const closeBtn = button(STRINGS.textClose, () => api.close(), 'text-close');
  const body = el('p', { className: 'text-body' });
  const nextBtn = button(
    `${STRINGS.textNext} ${UI_GLYPHS.textNext}`,
    () => api.next(),
    'text-next',
  );
  const hint = el('span', { className: 'text-hint', textContent: STRINGS.textCloseHint });
  const panel = el('div', { className: 'text-window' }, [
    el('div', { className: 'text-head' }, [pageInfo, closeBtn]),
    body,
    el('div', { className: 'text-foot' }, [hint, nextBtn]),
  ]);
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  const backdrop = el('div', { className: 'text-backdrop' }, [panel]);
  // Taps outside the window must not close it (nor reach the game / controls).
  backdrop.addEventListener('pointerdown', (e) => e.stopPropagation());
  root.append(backdrop);

  let fragments: readonly string[] = [];
  let page = 0;
  let open = false;
  /** Code of the key being handled (set only inside the keydown handler). */
  let key: string | undefined;

  const render = () => {
    body.textContent = fragments[page] ?? '';
    const many = fragments.length > 1;
    pageInfo.textContent = many ? `${STRINGS.textPage} ${page + 1}/${fragments.length}` : '';
    nextBtn.hidden = page >= fragments.length - 1;
  };

  doc.addEventListener(
    'keydown',
    (e) => {
      if (!open) return;
      e.stopPropagation(); // the game does not see keys while reading
      e.preventDefault();
      if (e.repeat) return;
      key = e.code;
      try {
        if (e.code === 'Escape') api.close();
        else if (TEXT_NEXT_CODES.includes(e.code)) api.next();
      } finally {
        key = undefined;
      }
    },
    true,
  );

  const api: TextWindow = {
    show(f) {
      fragments = f.length ? [...f] : [''];
      page = 0;
      render();
      if (!open) {
        open = true;
        backdrop.classList.add('visible');
        h.onOpen();
      }
    },
    next() {
      if (!open) return;
      if (page < fragments.length - 1) {
        page++;
        render();
      } else api.close();
    },
    close() {
      if (!open) return;
      open = false;
      backdrop.classList.remove('visible');
      h.onClose(key);
    },
    get isOpen() {
      return open;
    },
    get page() {
      return page;
    },
  };
  return api;
}
