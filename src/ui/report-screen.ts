// Session report (T23). The host fills the numbers. This screen does not estimate
// missing fields: a null row is omitted. CONTINUE waits 800 ms. Space does not close it.
// The export-reminder slot is an empty container for src/save/reminder.ts. This file
// does not build that reminder.
import './m1-screens.css';
import { el } from './dom';
import { M1_COPY, M1_UI_COPY } from './m1-copy';

/** Tap guard from ui-m1 §3.7. */
export const REPORT_CONTINUE_MS = 800;

export interface SessionOrderLine {
  title: string;
  result: string;
}

/**
 * Numbers the host already logged. Null means "not in the log" and the row is skipped.
 * `permanentChanges` should hold at least one real change (a skill, a contract, the grid,
 * a note, credits kept). The screen prints that list and does not invent one.
 */
export interface SessionReportData {
  outcome: 'evac' | 'death';
  timeInZone: string | null;
  depth: number | null;
  itemsBroughtBack: number | null;
  itemsLeftInZone: number | null;
  creditsGained: number | null;
  creditsLost: number | null;
  gridPct: number | null;
  /** Shown as (+10%) next to the grid percent. Null hides it. */
  gridDeltaPct: number | null;
  kills: number | null;
  killedBy: string | null;
  orders: readonly SessionOrderLine[];
  permanentChanges: readonly string[];
}

export interface ReportScreenOptions {
  /** Host clock. Leave unset in tests and call `advance`. */
  now?: () => number;
  onContinue(): void;
  doc?: Document;
}

export interface ReportScreen {
  /** Move the internal clock. Ignored as a time source when `now` is set; still repaints. */
  advance(ms: number): void;
  refresh(): void;
  destroy(): void;
  readonly element: HTMLElement;
  /** Empty node. The host appends the export reminder here. */
  readonly exportSlot: HTMLElement;
}

/** Footer from the outcome. Death with nothing lost uses M1_BASE_14B. */
export function reportFooter(data: SessionReportData): string {
  if (data.outcome === 'evac') return M1_COPY.M1_BASE_13;
  const items = data.itemsLeftInZone ?? 0;
  const credits = data.creditsLost ?? 0;
  return items > 0 || credits > 0 ? M1_COPY.M1_BASE_14 : M1_COPY.M1_BASE_14B;
}

export function mountReportScreen(
  root: HTMLElement,
  data: SessionReportData,
  opts: ReportScreenOptions,
): ReportScreen {
  const doc = opts.doc ?? document;
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'report';
  const panel = el('div', { className: 'm1-panel' });
  const title = el('h1', { className: 'm1-title', textContent: M1_COPY.M1_BASE_11 });
  const body = el('div', { className: 'm1-col' });
  const death = data.outcome === 'death';

  const add = (field: string, label: string, value: string) => {
    const line = el('div', { className: 'm1-report-row' });
    line.dataset.field = field;
    line.append(el('span', { textContent: label }), el('span', { textContent: value }));
    body.append(line);
  };

  if (data.timeInZone !== null) add('time', M1_UI_COPY.M1_UI_REP_TIME, data.timeInZone);
  if (data.depth !== null) add('depth', M1_UI_COPY.M1_UI_REP_DEPTH, String(data.depth));
  if (!death && data.itemsBroughtBack !== null) {
    add('items-in', M1_UI_COPY.M1_UI_REP_ITEMS_IN, String(data.itemsBroughtBack));
  }
  if (!death && data.itemsLeftInZone !== null) {
    add('items-lost', M1_UI_COPY.M1_UI_REP_ITEMS_LOST, String(data.itemsLeftInZone));
  }
  if (death && data.killedBy) {
    add('killed-by', M1_UI_COPY.M1_UI_REP_KILLED_BY, data.killedBy);
  }
  if (death && (data.creditsLost !== null || data.itemsLeftInZone !== null)) {
    const lostCr = data.creditsLost ?? 0;
    const lostItems = data.itemsLeftInZone ?? 0;
    add('lost', M1_UI_COPY.M1_UI_REP_LOST, `${lostCr} cr (${lostItems} items)`);
  }
  if (data.creditsGained !== null)
    add('credits-gained', M1_UI_COPY.M1_UI_REP_CREDITS, formatCredits(data.creditsGained));
  if (data.creditsLost !== null && !death) {
    add('credits-lost', M1_UI_COPY.M1_UI_REP_CREDITS_LOST, String(data.creditsLost));
  }
  if (data.gridPct !== null) {
    const delta = data.gridDeltaPct === null ? '' : ` (+${data.gridDeltaPct}%)`;
    add('grid', M1_UI_COPY.M1_UI_REP_GRID, `${data.gridPct}%${delta}`);
  }
  if (data.kills !== null) add('kills', M1_UI_COPY.M1_UI_REP_KILLS, String(data.kills));
  if (data.orders.length > 0) {
    add(
      'orders',
      M1_UI_COPY.M1_UI_REP_ORDERS,
      data.orders.map((order) => `${order.title} ${order.result}`).join(' · '),
    );
  }

  const progress = el('div', { className: 'm1-report-row' });
  progress.dataset.field = 'permanent';
  const changes = el('ul');
  for (const change of data.permanentChanges) changes.append(el('li', { textContent: change }));
  progress.append(el('span', { textContent: M1_UI_COPY.M1_UI_REP_PROGRESS }), changes);
  body.append(progress);

  const footer = el('p', { className: 'm1-footer', textContent: reportFooter(data) });
  footer.dataset.field = 'footer';
  const button = el('button', {
    type: 'button',
    textContent: M1_COPY.M1_UI_BTN_CONTINUE,
    tabIndex: 0,
    disabled: true,
  });
  button.dataset.action = 'continue';
  const exportSlot = el('div', { className: 'm1-export-slot' });
  exportSlot.dataset.slot = 'export-reminder';
  panel.append(title, body, footer, button, exportSlot);
  screen.append(panel);
  root.append(screen);

  let extra = 0;
  const started = opts.now?.() ?? 0;
  const elapsed = () => (opts.now ? opts.now() - started : extra);
  let continued = false;

  const paint = () => {
    button.disabled = elapsed() < REPORT_CONTINUE_MS;
  };

  const go = () => {
    if (continued || elapsed() < REPORT_CONTINUE_MS) return;
    continued = true;
    opts.onContinue();
  };

  button.addEventListener('click', (event) => {
    event.preventDefault();
    go();
  });

  const held = new Set<string>();
  const onKey = (event: KeyboardEvent) => {
    if (!screen.isConnected) return;
    const fresh = !event.repeat && !held.has(event.code);
    held.add(event.code);
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!fresh) return;
    if (event.code !== 'Enter' && event.code !== 'NumpadEnter') return;
    if (elapsed() < REPORT_CONTINUE_MS) return;
    event.preventDefault();
    event.stopPropagation();
    go();
  };
  const onUp = (event: KeyboardEvent) => held.delete(event.code);
  doc.addEventListener('keydown', onKey, true);
  doc.addEventListener('keyup', onUp, true);
  paint();

  return {
    element: screen,
    exportSlot,
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

function formatCredits(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}
