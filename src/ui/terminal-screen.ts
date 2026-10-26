// Power Lines terminal window (T31). Layout B: grid on the left, panel on the right
// (ui-m1.md §5, §12.1–§12.3; styl-ascii.md §11). The host pauses the world with onPause.
// Opening is refused while an enemy is in CHASE or ATTACK (`enemiesAlert` → M1_SYS_04).
import {
  copperAward,
  createNetworkProgress,
  issueMk2Grant,
  nextVariantId,
  solveVariant,
  TERMINAL_FRAGMENT_PCT,
  VARIANT_SEQUENCE,
  type Depth,
  type IssueMk2Grant,
  type NetworkProgress,
} from '../progress/network';
import {
  gridForMask,
  maskAfterTaps,
  powerLinesLine1,
  preview,
  puzzleFromVariant,
  simulate,
  startMask,
  type PuzzleState,
} from '../puzzles/power-lines/rules';
import type {
  Cell,
  CellKey,
  FlowResult,
  FlowStatus,
  FlowTokens,
  PowerLinesVariant,
} from '../puzzles/power-lines/types';
import { button, el } from './dom';
import {
  consumerCounter,
  TERM_COPY,
  TERM_HELP_ARIA,
  TERM_LEGEND,
  termLine,
  type TermTextId,
} from './terminal-copy';
import './terminal-screen.css';

/** Switch hit target (ui-m1.md §5.1, M7). */
export const SWITCH_HIT_PX = 48;

/**
 * At this height and below the window shows `M1_UI_ROTATE_TERMINAL` instead of the grid.
 * T31 checks 568×320. Taller viewports (667×375) get the 28 px grid.
 */
export const TERMINAL_ROTATE_MAX_HEIGHT = 320;

export const TERMINAL_BLOCKED_CODE = 'M1_SYS_04' as const;

export interface TerminalViewport {
  width: number;
  height: number;
}

export interface TerminalLayout {
  mode: 'grid' | 'rotate';
  rotateTextId: 'M1_UI_ROTATE_TERMINAL' | null;
  /** 28 when the 9-row grid fits, 26 otherwise. Null in the rotate gate. */
  cellPx: 26 | 28 | null;
  columns: 2;
  width: number;
  height: number;
}

/** Two-column layout, or the rotate gate when the viewport is too short for the grid. */
export function terminalLayout(viewport: TerminalViewport): TerminalLayout {
  if (viewport.height <= TERMINAL_ROTATE_MAX_HEIGHT) {
    return {
      mode: 'rotate',
      rotateTextId: 'M1_UI_ROTATE_TERMINAL',
      cellPx: null,
      columns: 2,
      width: viewport.width,
      height: viewport.height,
    };
  }
  // ui-m1.md §5.3: cell 28 when height − 20 fits 9×28, otherwise 26.
  const inner = viewport.height - 20;
  const cellPx: 26 | 28 = inner >= 9 * 28 ? 28 : 26;
  return {
    mode: 'grid',
    rotateTextId: null,
    cellPx,
    columns: 2,
    width: viewport.width,
    height: viewport.height,
  };
}

export interface TerminalOpenRequest {
  depth: Depth;
  /** True when any enemy is in CHASE or ATTACK. The window does not open. */
  enemiesAlert: boolean;
  viewport?: TerminalViewport;
  /** Progress to read. Omitted: keep the progress the screen already holds. */
  progress?: NetworkProgress;
}

export type TerminalOpenResult =
  { ok: true } | { ok: false; code: typeof TERMINAL_BLOCKED_CODE | 'no-variant' };

export interface TerminalSolved {
  variantId: string;
  firstSolve: boolean;
  retune: boolean;
  /** Copper from `copperAward`, only on the first solve. */
  copper: number;
  /** 10 on the first solve, otherwise 0. */
  fragmentPct: number;
  fragmentTextId: 'M1_BASE_09' | null;
  resultTextId: 'M1_TERM_OK' | 'M1_TERM_OK_RETUNE';
  progress: NetworkProgress;
  /** Set when this solve is the one that unlocks stop 2. */
  mk2: IssueMk2Grant | null;
}

export interface TerminalScreenOptions {
  /** Pause the world on open (`true`) and resume it on close (`false`). */
  onPause: (paused: boolean) => void;
  /** Open refused: an enemy is in CHASE or ATTACK. */
  onBlocked: (code: typeof TERMINAL_BLOCKED_CODE) => void;
  onSolved?: (event: TerminalSolved) => void;
  onProgress?: (progress: NetworkProgress) => void;
  progress?: NetworkProgress;
  viewport?: TerminalViewport;
  doc?: Document;
  /** Clock for the post-fail SEND lock. Default `Date.now`. */
  now?: () => number;
}

export interface TerminalScreen {
  open(request: TerminalOpenRequest): TerminalOpenResult;
  close(): void;
  send(): void;
  reset(): void;
  help(): void;
  /** Flip switch `index` (reading order, the same bits `simulate` uses). */
  toggleSwitch(index: number): void;
  /** Toggle each cell, starting from the current mask (authored taps assume the start mask). */
  applyTaps(taps: readonly Cell[]): void;
  resize(viewport: TerminalViewport): void;
  destroy(): void;
  readonly isOpen: boolean;
  readonly progress: NetworkProgress;
  readonly variantId: string | null;
  readonly mask: number;
  readonly element: HTMLElement;
}

const RESULT_TEXT: Readonly<Record<FlowStatus, TermTextId>> = {
  WIN: 'M1_TERM_OK',
  DARK: 'M1_TERM_LOW',
  OVERLOAD: 'M1_TERM_FAIL',
  FUSE: 'M1_TERM_FUSE',
  TRIP: 'M1_TERM_TRIP',
  SHORT: 'M1_TERM_SHORT',
};

const FAIL_LOCK_MS = powerLinesLine1.help.fail_lock_ms;

type Dir = 'U' | 'R' | 'D' | 'L';
const OPP: Record<Dir, Dir> = { U: 'D', D: 'U', L: 'R', R: 'L' };
const DIR_DELTA: Record<Dir, readonly [number, number]> = {
  U: [-1, 0],
  R: [0, 1],
  D: [1, 0],
  L: [0, -1],
};

function cellKey(row: number, col: number): CellKey {
  return `${row},${col}`;
}

function portsOf(glyph: string): ReadonlySet<Dir> {
  if (glyph === '-') return new Set(['L', 'R']);
  if (glyph === '|') return new Set(['U', 'D']);
  if (
    glyph === '*' ||
    glyph === '+' ||
    glyph === '=' ||
    glyph === '/' ||
    glyph === '!' ||
    glyph === '_' ||
    (glyph >= '1' && glyph <= '9')
  ) {
    return new Set(['U', 'R', 'D', 'L']);
  }
  return new Set();
}

/** Box-drawing glyph for a `+` cell, from the neighbours that face it (styl-ascii §11). */
function junctionGlyph(grid: readonly string[], row: number, col: number): string {
  const dirs: Dir[] = [];
  for (const dir of ['U', 'R', 'D', 'L'] as const) {
    const [dr, dc] = DIR_DELTA[dir];
    const glyph = grid[row + dr]?.[col + dc];
    if (glyph && portsOf(glyph).has(OPP[dir])) dirs.push(dir);
  }
  const shape: Record<string, string> = {
    URDL: '┼',
    RDL: '┬',
    URL: '┴',
    URD: '├',
    UDL: '┤',
    UR: '└',
    UL: '┘',
    RD: '┌',
    DL: '┐',
    UD: '│',
    RL: '─',
    U: '│',
    D: '│',
    R: '─',
    L: '─',
  };
  return shape[dirs.join('')] ?? '┼';
}

function hasCopy(id: string): id is TermTextId {
  return Object.prototype.hasOwnProperty.call(TERM_COPY, id);
}

function copyOf(id: string): string {
  return hasCopy(id) ? TERM_COPY[id] : id;
}

function tokenRecord(tokens: FlowTokens): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [key, value] of Object.entries(tokens)) {
    if (typeof value === 'number') out[key] = value;
  }
  return out;
}

function takeProgress(progress: NetworkProgress): NetworkProgress {
  return {
    solved: [...progress.solved],
    stops: [...progress.stops],
    lights: progress.lights,
    bossFragment: progress.bossFragment,
    mk2Announced: progress.mk2Announced,
  };
}

function pickVariant(
  depth: Depth,
  solved: readonly string[],
): { variant: PowerLinesVariant; retune: boolean } | null {
  const nextId = nextVariantId(depth, solved);
  const sequence = VARIANT_SEQUENCE[depth];
  const id = nextId ?? sequence[sequence.length - 1];
  if (!id) return null;
  const variant = powerLinesLine1.variants.find((entry) => entry.id === id);
  if (!variant) return null;
  return { variant, retune: nextId === null };
}

let mountSeq = 0;

/**
 * Mount the Power Lines window under `parent`. It stays hidden until `open`.
 * `onPause(true)` runs when the window opens and `onPause(false)` when it closes.
 */
export function mountTerminalScreen(
  parent: HTMLElement,
  options: TerminalScreenOptions,
): TerminalScreen {
  const doc = options.doc ?? document;
  const now = options.now ?? Date.now;
  const titleId = `term-title-${++mountSeq}`;

  const rotateText = el('p', {
    className: 'term-rotate-text',
    textContent: TERM_COPY.M1_UI_ROTATE_TERMINAL,
  });
  rotateText.dataset.textId = 'M1_UI_ROTATE_TERMINAL';
  const rotateExit = button(TERM_COPY.M1_TERM_BTN_EXIT, () => api.close(), 'term-exit');
  rotateExit.dataset.action = 'exit';
  const rotate = el('div', { className: 'term-rotate' }, [rotateText, rotateExit]);
  rotate.hidden = true;

  const grid = el('div', { className: 'term-grid' });
  const header = el('h2', { className: 'term-header', id: titleId });
  const name = el('p', { className: 'term-name' });
  const context = el('p', { className: 'term-context' });
  const consumers = el('ul', { className: 'term-consumers' });
  const status = el('p', { className: 'term-status' });
  const helpBox = el('div', { className: 'term-help' });
  helpBox.hidden = true;

  const sendBtn = button(TERM_COPY.M1_TERM_BTN_SEND, () => api.send(), 'term-send');
  sendBtn.dataset.action = 'send';
  const helpBtn = button(TERM_COPY.M1_TERM_BTN_HELP, () => api.help(), 'term-help-btn');
  helpBtn.dataset.action = 'help';
  helpBtn.setAttribute('aria-label', TERM_HELP_ARIA);
  const resetBtn = button(TERM_COPY.M1_TERM_BTN_RESET, () => api.reset(), 'term-reset');
  resetBtn.dataset.action = 'reset';
  const exitBtn = button(TERM_COPY.M1_TERM_BTN_EXIT, () => api.close(), 'term-exit');
  exitBtn.dataset.action = 'exit';
  const actions = el('div', { className: 'term-actions' }, [sendBtn, resetBtn, exitBtn, helpBtn]);

  const panel = el('div', { className: 'term-panel' }, [
    header,
    name,
    context,
    consumers,
    status,
    helpBox,
    actions,
  ]);
  const columns = el('div', { className: 'term-columns' }, [grid, panel]);
  const windowEl = el('div', { className: 'term-window' }, [rotate, columns]);
  windowEl.setAttribute('role', 'dialog');
  windowEl.setAttribute('aria-modal', 'true');
  windowEl.setAttribute('aria-labelledby', titleId);
  const backdrop = el('div', { className: 'term-backdrop' }, [windowEl]);
  backdrop.addEventListener('pointerdown', (event) => event.stopPropagation());
  const screen = el('div', { className: 'term-screen' }, [backdrop]);
  screen.hidden = true;
  parent.append(screen);

  let progress = takeProgress(options.progress ?? createNetworkProgress());
  let viewport: TerminalViewport = options.viewport ?? { width: 667, height: 375 };
  let openFlag = false;
  let variant: PowerLinesVariant | null = null;
  let puzzle: PuzzleState | null = null;
  let mask = 0;
  let retune = false;
  let cursor = 0;
  let helpOpen = false;
  let tipStage = 0;
  let lastFlow: FlowResult | null = null;
  let statusId: TermTextId | null = null;
  let lockUntil = 0;
  let lockTimer: ReturnType<typeof setTimeout> | null = null;

  const clearLock = () => {
    lockUntil = 0;
    if (lockTimer !== null) {
      clearTimeout(lockTimer);
      lockTimer = null;
    }
  };

  const armLock = () => {
    lockUntil = now() + FAIL_LOCK_MS;
    if (lockTimer !== null) clearTimeout(lockTimer);
    lockTimer = setTimeout(() => {
      lockTimer = null;
      if (openFlag) render();
    }, FAIL_LOCK_MS);
  };

  const onKey = (event: KeyboardEvent) => {
    if (!openFlag) return;
    event.stopPropagation();
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'Escape' || event.code === 'KeyE') {
      api.close();
      return;
    }
    if (terminalLayout(viewport).mode === 'rotate') return;
    if (event.code === 'Enter' || event.code === 'NumpadEnter') api.send();
    else if (event.code === 'KeyR') api.reset();
    else if (event.code === 'F1' || event.code === 'Slash' || event.key === '?') api.help();
    else if (event.code === 'Space') api.toggleSwitch(cursor);
    else if (event.code === 'ArrowUp') moveCursor('U');
    else if (event.code === 'ArrowDown') moveCursor('D');
    else if (event.code === 'ArrowLeft') moveCursor('L');
    else if (event.code === 'ArrowRight') moveCursor('R');
  };
  doc.addEventListener('keydown', onKey, true);

  function moveCursor(dir: Dir) {
    if (!puzzle || puzzle.switches.length === 0) return;
    const from = puzzle.switches[cursor] ?? puzzle.switches[0];
    if (!from) return;
    let best = -1;
    let bestScore = Infinity;
    puzzle.switches.forEach((sw, index) => {
      if (index === cursor) return;
      const dy = sw[0] - from[0];
      const dx = sw[1] - from[1];
      const along = dir === 'U' ? -dy : dir === 'D' ? dy : dir === 'L' ? -dx : dx;
      if (along <= 0) return;
      const cross = dir === 'U' || dir === 'D' ? Math.abs(dx) : Math.abs(dy);
      const score = along * 100 + cross;
      if (score < bestScore) {
        bestScore = score;
        best = index;
      }
    });
    if (best >= 0) {
      cursor = best;
      render();
    }
  }

  function paintGrid(layout: TerminalLayout) {
    grid.replaceChildren();
    if (!puzzle || layout.mode !== 'grid' || layout.cellPx === null) return;
    grid.style.setProperty('--term-cell', `${layout.cellPx}px`);
    grid.dataset.mask = String(mask);
    const rows = gridForMask(puzzle, mask);
    const showLetter = layout.cellPx >= 30;
    const ring = new Set((lastFlow?.ringCells ?? []).map((cell) => cellKey(cell[0], cell[1])));
    const fault = lastFlow?.cell ? cellKey(lastFlow.cell[0], lastFlow.cell[1]) : null;

    for (let r = 0; r < puzzle.height; r++) {
      const rowEl = el('div', { className: 'term-row' });
      const line = rows[r] ?? '';
      for (let c = 0; c < puzzle.width; c++) {
        const glyph = line[c] ?? '.';
        const key = cellKey(r, c);
        const cell = el('div', { className: 'term-cell' });
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        if (ring.has(key)) cell.classList.add('term-ring');
        if (fault === key) cell.classList.add('term-fault');

        if (glyph === '=' || glyph === '/') {
          const index = puzzle.switchIndex[key] ?? 0;
          const hit = el('button', {
            type: 'button',
            className: 'term-switch',
            textContent: glyph,
            tabIndex: -1,
          });
          hit.style.width = `${SWITCH_HIT_PX}px`;
          hit.style.height = `${SWITCH_HIT_PX}px`;
          hit.dataset.switch = String(index);
          hit.dataset.row = String(r);
          hit.dataset.col = String(c);
          hit.setAttribute('aria-pressed', glyph === '=' ? 'true' : 'false');
          if (glyph === '=') hit.classList.add('term-switch-on');
          if (index === cursor) hit.classList.add('term-switch-cursor');
          hit.addEventListener('click', (event) => {
            event.preventDefault();
            api.toggleSwitch(index);
          });
          cell.classList.add('term-cell-switch');
          cell.append(hit);
        } else {
          const shown = shownGlyph(glyph, rows, r, c, key);
          for (const name of shown.classes) cell.classList.add(name);
          const glyphEl = el('span', { className: 'term-glyph', textContent: shown.text });
          if (shown.letter && showLetter) {
            cell.append(el('span', { className: 'term-letter', textContent: shown.letter }));
          }
          cell.append(glyphEl);
        }
        rowEl.append(cell);
      }
      grid.append(rowEl);
    }
  }

  function shownGlyph(
    glyph: string,
    rows: readonly string[],
    row: number,
    col: number,
    key: CellKey,
  ): { text: string; classes: string[]; letter: string | null } {
    if (!puzzle) return { text: glyph, classes: ['term-cell-empty'], letter: null };
    if (glyph === '.') return { text: '·', classes: ['term-cell-empty'], letter: null };
    if (glyph === '*') {
      const power = puzzle.sources[key];
      return {
        text: power === undefined ? '*' : String(power),
        classes: ['term-cell-source'],
        letter: null,
      };
    }
    if (glyph === '-' || glyph === '|') {
      const flow = lastFlow?.flow[key];
      const powered = typeof flow === 'number' && flow > 0;
      return {
        text: glyph === '-' ? '─' : '│',
        classes: powered ? ['term-cell-cable', 'term-powered'] : ['term-cell-cable'],
        letter: null,
      };
    }
    if (glyph === '+') {
      return { text: junctionGlyph(rows, row, col), classes: ['term-cell-junction'], letter: null };
    }
    if (glyph === '_') return { text: '⊥', classes: ['term-cell-ground'], letter: null };
    if (glyph === '!') {
      const max = puzzle.fuses[key];
      return {
        text: max === undefined ? '!' : `≤${max}`,
        classes: ['term-cell-fuse'],
        letter: null,
      };
    }
    if (glyph >= '1' && glyph <= '9') {
      const need = Number(glyph);
      const letter = puzzle.letters[key] ?? null;
      const classes = ['term-cell-consumer'];
      let text = glyph;
      if (lastFlow) {
        const got = lastFlow.got[key];
        if (typeof got === 'number' && got > need) {
          classes.push('term-burned');
          text = 'x';
        } else if (got === need) classes.push('term-lit');
        else if (typeof got === 'number' && got < need) classes.push('term-dark');
      }
      return { text, classes, letter };
    }
    return { text: glyph, classes: ['term-cell-empty'], letter: null };
  }

  function paintPanel(layout: TerminalLayout) {
    const locked = now() < lockUntil;
    sendBtn.disabled = locked || layout.mode === 'rotate';
    sendBtn.textContent = locked ? TERM_COPY.M1_TERM_BTN_WAIT : TERM_COPY.M1_TERM_BTN_SEND;
    if (!puzzle || !variant || layout.mode !== 'grid') {
      consumers.replaceChildren();
      return;
    }
    header.textContent = TERM_COPY.M1_TERM_HEADER;
    header.dataset.textId = 'M1_TERM_HEADER';
    name.textContent = copyOf(variant.name_text_id);
    name.dataset.textId = variant.name_text_id;
    const contextId: TermTextId = retune
      ? 'M1_TERM_RETUNE'
      : hasCopy(variant.context_text_id)
        ? variant.context_text_id
        : 'M1_TERM_HEADER';
    context.textContent = termLine(contextId);
    context.dataset.textId = contextId;
    windowEl.dataset.variant = variant.id;

    consumers.replaceChildren();
    for (const row of preview(puzzle, mask).panel) {
      const item = el('li', {
        className: 'term-consumer',
        textContent: consumerCounter(row.id, row.x, row.y),
      });
      item.dataset.id = row.id;
      item.dataset.x = row.x === null ? '' : String(row.x);
      item.dataset.y = String(row.y);
      consumers.append(item);
    }

    if (statusId && lastFlow) {
      status.dataset.textId = statusId;
      status.textContent = termLine(statusId, tokenRecord(lastFlow.tokens));
    } else {
      delete status.dataset.textId;
      status.textContent = '';
    }
    status.classList.toggle(
      'term-status-win',
      statusId === 'M1_TERM_OK' || statusId === 'M1_TERM_OK_RETUNE',
    );
    paintHelp();
  }

  function paintHelp() {
    helpBox.replaceChildren();
    helpBox.hidden = !helpOpen || !variant || !puzzle;
    if (helpBox.hidden || !variant || !puzzle) return;
    helpBox.append(
      el('p', { className: 'term-help-line', textContent: TERM_COPY.M1_TERM_HELP_TITLE }),
    );
    const fresh = new Set<string>(variant.new_elements);
    for (const element of variant.elements) {
      const legend = TERM_LEGEND[element];
      const tag = fresh.has(element) ? ` [${TERM_COPY.M1_TERM_TAG_NEW}]` : '';
      helpBox.append(
        el('p', {
          className: 'term-help-line',
          textContent: `${legend.label}${tag}: ${termLine(legend.textId)}`,
        }),
      );
    }
    const tipId = variant.hint.text_ids[tipStage];
    const tipTokens: Record<string, number> = {};
    if (puzzle.power !== null) tipTokens.source_power = puzzle.power;
    helpBox.append(
      el('p', {
        className: 'term-help-line',
        textContent: termLine('M1_TERM_TAG_TIP_N', { n: tipStage + 1 }),
      }),
    );
    if (tipId && hasCopy(tipId)) {
      helpBox.append(
        el('p', { className: 'term-help-line', textContent: termLine(tipId, tipTokens) }),
      );
    }
    if (tipStage < variant.hint.text_ids.length - 1) {
      const more = button(TERM_COPY.M1_TERM_BTN_MORE, () => moreTip(), 'term-more');
      more.dataset.action = 'more';
      helpBox.append(more);
    }
  }

  function moreTip() {
    if (!variant) return;
    if (tipStage < variant.hint.text_ids.length - 1) tipStage += 1;
    render();
  }

  function render() {
    const layout = terminalLayout(viewport);
    screen.dataset.mode = layout.mode;
    rotate.hidden = layout.mode !== 'rotate';
    columns.hidden = layout.mode === 'rotate';
    paintGrid(layout);
    paintPanel(layout);
  }

  const api: TerminalScreen = {
    open(request) {
      if (request.enemiesAlert) {
        options.onBlocked(TERMINAL_BLOCKED_CODE);
        return { ok: false, code: TERMINAL_BLOCKED_CODE };
      }
      if (request.progress) progress = takeProgress(request.progress);
      if (request.viewport) viewport = request.viewport;
      const picked = pickVariant(request.depth, progress.solved);
      if (!picked) return { ok: false, code: 'no-variant' };
      variant = picked.variant;
      retune = picked.retune;
      puzzle = puzzleFromVariant(variant);
      mask = startMask(puzzle);
      cursor = 0;
      helpOpen = false;
      tipStage = 0;
      lastFlow = null;
      statusId = null;
      clearLock();
      const wasOpen = openFlag;
      openFlag = true;
      screen.hidden = false;
      render();
      if (!wasOpen) options.onPause(true);
      return { ok: true };
    },
    close() {
      if (!openFlag) return;
      openFlag = false;
      screen.hidden = true;
      clearLock();
      options.onPause(false);
    },
    send() {
      if (!openFlag || !puzzle || !variant) return;
      if (terminalLayout(viewport).mode === 'rotate') return;
      if (now() < lockUntil) return;
      const flow = simulate(puzzle, mask);
      lastFlow = flow;
      if (flow.status === 'WIN') {
        const id = variant.id;
        const first = !progress.solved.includes(id);
        const hadStop2 = progress.stops.includes(2);
        progress = solveVariant(progress, id);
        statusId = first ? 'M1_TERM_OK' : 'M1_TERM_OK_RETUNE';
        const grant = !hadStop2 && progress.stops.includes(2) ? issueMk2Grant(progress) : null;
        const event: TerminalSolved = {
          variantId: id,
          firstSolve: first,
          retune: !first,
          copper: first ? copperAward(id) : 0,
          fragmentPct: first ? TERMINAL_FRAGMENT_PCT : 0,
          fragmentTextId: first ? 'M1_BASE_09' : null,
          resultTextId: statusId,
          progress,
          mk2: grant,
        };
        options.onSolved?.(event);
        options.onProgress?.(progress);
      } else {
        statusId = RESULT_TEXT[flow.status];
        armLock();
      }
      render();
    },
    reset() {
      if (!openFlag || !puzzle) return;
      if (terminalLayout(viewport).mode === 'rotate') return;
      mask = startMask(puzzle);
      lastFlow = null;
      statusId = null;
      clearLock();
      render();
    },
    help() {
      if (!openFlag || terminalLayout(viewport).mode === 'rotate') return;
      helpOpen = !helpOpen;
      if (helpOpen) tipStage = 0;
      render();
    },
    toggleSwitch(index) {
      if (!openFlag || !puzzle) return;
      if (terminalLayout(viewport).mode === 'rotate') return;
      if (index < 0 || index >= puzzle.switches.length) return;
      mask ^= 1 << index;
      cursor = index;
      lastFlow = null;
      statusId = null;
      render();
    },
    applyTaps(taps) {
      if (!openFlag || !puzzle) return;
      if (terminalLayout(viewport).mode === 'rotate') return;
      mask = maskAfterTaps(puzzle, taps, mask);
      lastFlow = null;
      statusId = null;
      render();
    },
    resize(next) {
      viewport = next;
      if (openFlag) render();
    },
    destroy() {
      const wasOpen = openFlag;
      openFlag = false;
      clearLock();
      doc.removeEventListener('keydown', onKey, true);
      screen.remove();
      if (wasOpen) options.onPause(false);
    },
    get isOpen() {
      return openFlag;
    },
    get progress() {
      return progress;
    },
    get variantId() {
      return variant?.id ?? null;
    },
    get mask() {
      return mask;
    },
    get element() {
      return screen;
    },
  };

  return api;
}
