import type { PauseReason } from '../core/events';
import { STRINGS } from '../data/strings';
import { UI_GLYPHS } from '../data/style';
import type { TouchSource } from '../input/touch';
import { createCountdown } from './countdown';
import { button, el } from './dom';
import { createHud, type Hud } from './hud';
import type { UiSettings } from './settings';
import { createTextWindow, type TextWindow } from './text-window';
import { createTouchControls, type TouchControls } from './touch-controls';

export interface UiHandlers {
  onPause(): void;
  onResume(): void;
  onExportFile(): void;
  onImportFile(): void;
  onCopyCode(): Promise<string>;
  onImportCode(code: string): void;
  /** Text window opened → loop.pause('text'). */
  onOpenText?(): void;
  /** Text window closed → resume (countdown only if an auto-pause fired while reading). */
  onCloseText?(): void;
  /** A key was used by the UI (closed the text / resumed the menu): keep it dead in the game
   * until released → KeyboardSource.block(code). Called after onCloseText / onResume. */
  onKeyConsumed?(code: string): void;
  /** Activity that does not pass through an InputSource (input.markActivity()). */
  onActivity?(): void;
}

export interface UiOptions {
  touch?: TouchSource;
  settings?: UiSettings;
}

export interface Ui {
  showPaused(reason: PauseReason): void;
  hidePaused(): void;
  toast(msg: string): void;
  setCode(code: string): void;
  /** Resume countdown 3·2·1 (event `countdown {digit}`). */
  showCountdown(digit: number): void;
  hideCountdown(): void;
  /** Open the in-world text window (pauses with reason 'text'). */
  showText(fragments: readonly string[]): void;
  readonly text: TextWindow;
  readonly hud: Hud;
  readonly touch: TouchControls | null;
  readonly overlayVisible: boolean;
}

/** Keys that resume from the PAUSED menu. Esc/P arrive via the input layer (pause edge),
 * Enter is handled here. Space (attack) and any other key never resume. */
export const MENU_RESUME_CODES: readonly string[] = ['Escape', 'KeyP', 'Enter', 'NumpadEnter'];
const ENTER_CODES = ['Enter', 'NumpadEnter'];

/**
 * DOM layer over the canvas (PROG / UI i Menu): HUD (HP), pause button `[||]`, PAUSED menu
 * (reasons 'menu' and 'auto'; RESUME + save export/import), resume countdown, text window
 * (reason 'text' – no pause menu) and touch controls. ASCII only, colours via CSS vars.
 */
export function createUi(root: HTMLElement, h: UiHandlers, opts: UiOptions = {}): Ui {
  const settings = opts.settings ?? { leftHanded: false, forceTouch: false };
  const hud = createHud(root);
  const touch = opts.touch ? createTouchControls(root, opts.touch, settings, h.onActivity) : null;

  const pauseBtn = button(UI_GLYPHS.pause, h.onPause, 'pause-btn');
  pauseBtn.title = STRINGS.pauseButton;
  pauseBtn.setAttribute('aria-label', STRINGS.pauseButton);

  const sub = el('div', { className: 'sub' });
  const code = el('textarea', { placeholder: STRINGS.codePlaceholder, spellcheck: false });
  const panel = el('div', { className: 'panel' }, [
    el('h1', { textContent: STRINGS.paused }),
    sub,
    button(STRINGS.resume, h.onResume, 'resume'),
    el('div', { className: 'sub', textContent: STRINGS.resumeHint }),
    el('div', { className: 'row' }, [
      button(STRINGS.exportFile, h.onExportFile),
      button(STRINGS.importFile, h.onImportFile),
    ]),
    code,
    el('div', { className: 'row' }, [
      button(STRINGS.copyCode, () => {
        void h.onCopyCode().then((c) => (code.value = c));
      }),
      button(STRINGS.importCode, () => h.onImportCode(code.value)),
    ]),
  ]);
  const overlay = el('div', { className: 'overlay' }, [panel]);
  const toastEl = el('div', { className: 'toast', role: 'status' });
  const hint = el('div', { className: 'hint', textContent: STRINGS.hint });
  root.append(pauseBtn, hint, overlay);
  const countdown = createCountdown(root);
  const text = createTextWindow(root, {
    onOpen: () => h.onOpenText?.(),
    onClose: (closingKey) => {
      h.onCloseText?.();
      if (closingKey) h.onKeyConsumed?.(closingKey);
    },
  });
  root.append(toastEl);

  // No browser long-press menu / callout anywhere on the game layer.
  root.addEventListener('contextmenu', (e) => {
    if ((e.target as HTMLElement | null)?.tagName !== 'TEXTAREA') e.preventDefault();
  });

  // Enter resumes while the PAUSED menu is visible (Esc/P go through the input layer).
  window.addEventListener('keydown', (e) => {
    if (!ENTER_CODES.includes(e.code) || e.repeat) return;
    if (!overlay.classList.contains('visible') || e.target === code) return;
    e.preventDefault();
    h.onResume();
    h.onKeyConsumed?.(e.code);
  });

  let toastTimer = 0;
  return {
    hud,
    text,
    touch,
    showPaused(reason) {
      if (reason === 'text') {
        overlay.classList.remove('visible');
        return;
      }
      sub.textContent = reason === 'auto' ? STRINGS.pausedAuto : STRINGS.pausedMenu;
      overlay.classList.add('visible');
    },
    hidePaused() {
      overlay.classList.remove('visible');
    },
    toast(msg) {
      toastEl.textContent = msg;
      toastEl.classList.add('visible');
      clearTimeout(toastTimer);
      toastTimer = window.setTimeout(() => toastEl.classList.remove('visible'), 1600);
    },
    showCountdown(digit) {
      countdown.show(digit);
    },
    hideCountdown() {
      countdown.hide();
    },
    showText(fragments) {
      overlay.classList.remove('visible');
      text.show(fragments);
    },
    setCode(c) {
      code.value = c;
    },
    get overlayVisible() {
      return overlay.classList.contains('visible');
    },
  };
}
