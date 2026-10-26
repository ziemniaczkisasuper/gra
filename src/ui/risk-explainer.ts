// One-time loss explainer (T22 panel, shown from the death path before the report).
// Two pages of M1_RISK_04. NEXT waits 1500 ms. OK waits 500 ms. Space does nothing.
// The host stores `seen` (riskExplainerSeen). This module only decides and flips the flag.
import './m1-screens.css';
import { el } from './dom';
import { M1_COPY, fillCopy } from './m1-copy';

export const RISK_NEXT_MS = 1500;
export const RISK_OK_MS = 500;

export interface RiskExplainerInput {
  seen: boolean;
  /** AT RISK at the moment of death. The panel is only for a death that lost something. */
  atRisk: number;
}

/** True only for the first death that actually lost something. */
export function shouldShowRiskExplainer(input: RiskExplainerInput): boolean {
  return !input.seen && input.atRisk > 0;
}

/** Host calls this when the player presses OK, then saves the flag. */
export function markSeen<T extends { seen: boolean }>(flag: T): T {
  return { ...flag, seen: true };
}

/** Page 1 is the loss. Page 2 is what stays. Split on the lore [[PAGE]] marker. */
export function riskPages(itemsLost: number, crLost: number): readonly [string, string] {
  const filled = fillCopy(M1_COPY.M1_RISK_04, { items_lost: itemsLost, cr_lost: crLost });
  const parts = filled.split('[[PAGE]]');
  return [(parts[0] ?? '').trim(), (parts[1] ?? '').trim()];
}

export interface RiskExplainerOptions {
  itemsLost: number;
  crLost: number;
  /** Host clock. Tests call `advance` and leave this unset. */
  now?: () => number;
  onOk(): void;
  doc?: Document;
}

export interface RiskExplainer {
  advance(ms: number): void;
  refresh(): void;
  destroy(): void;
  readonly element: HTMLElement;
  readonly page: number;
}

export function mountRiskExplainer(root: HTMLElement, opts: RiskExplainerOptions): RiskExplainer {
  const doc = opts.doc ?? document;
  const pages = riskPages(opts.itemsLost, opts.crLost);
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'risk-explainer';
  const panel = el('div', { className: 'm1-panel' });
  const text = el('p', { className: 'm1-pages' });
  text.dataset.role = 'page';
  const next = el('button', { type: 'button', textContent: M1_COPY.M1_TERM_BTN_NEXT, tabIndex: 0 });
  next.dataset.action = 'next';
  const ok = el('button', { type: 'button', textContent: M1_COPY.M1_RISK_04_OK, tabIndex: 0 });
  ok.dataset.action = 'ok';
  const actions = el('div', { className: 'm1-actions' }, [next, ok]);
  panel.append(text, actions);
  screen.append(panel);
  root.append(screen);

  let page = 0;
  let extra = 0;
  let pageStart = opts.now?.() ?? 0;
  let closed = false;
  const held = new Set<string>();

  const current = () => (opts.now ? opts.now() : 0) + extra;
  const elapsed = () => current() - pageStart;
  const unlocked = () => elapsed() >= (page === 0 ? RISK_NEXT_MS : RISK_OK_MS);

  const paint = () => {
    screen.dataset.page = String(page);
    text.textContent = pages[page] ?? '';
    const openNext = page === 0;
    next.hidden = !openNext;
    ok.hidden = openNext;
    next.disabled = openNext && elapsed() < RISK_NEXT_MS;
    ok.disabled = !openNext && elapsed() < RISK_OK_MS;
  };

  const showNextPage = () => {
    if (page !== 0 || elapsed() < RISK_NEXT_MS) return;
    page = 1;
    pageStart = current();
    paint();
  };

  const finish = () => {
    if (closed || page !== 1 || elapsed() < RISK_OK_MS) return;
    closed = true;
    opts.onOk();
  };

  next.addEventListener('click', (event) => {
    event.preventDefault();
    showNextPage();
  });
  ok.addEventListener('click', (event) => {
    event.preventDefault();
    finish();
  });

  const onKey = (event: KeyboardEvent) => {
    if (!screen.isConnected) return;
    const fresh = !event.repeat && !held.has(event.code);
    held.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!fresh || !unlocked()) return;
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      event.stopPropagation();
      if (page === 0) showNextPage();
      else finish();
      return;
    }
    if (event.code === 'Escape' && page === 1) {
      event.preventDefault();
      event.stopPropagation();
      finish();
    }
  };
  const onUp = (event: KeyboardEvent) => held.delete(event.code);
  doc.addEventListener('keydown', onKey, true);
  doc.addEventListener('keyup', onUp, true);
  paint();

  return {
    element: screen,
    get page() {
      return page;
    },
    advance(ms: number) {
      extra += ms;
      paint();
    },
    refresh() {
      paint();
    },
    destroy() {
      doc.removeEventListener('keydown', onKey, true);
      doc.removeEventListener('keyup', onUp, true);
      screen.remove();
    },
  };
}
