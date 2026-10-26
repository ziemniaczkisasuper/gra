// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VARIANT_SEQUENCE, createNetworkProgress, solveVariant } from '../src/progress/network';
import { powerLinesLine1 } from '../src/puzzles/power-lines/rules';
import { TERM_COPY } from '../src/ui/terminal-copy';
import {
  SWITCH_HIT_PX,
  mountTerminalScreen,
  terminalLayout,
  type TerminalScreen,
} from '../src/ui/terminal-screen';

const GRID = { width: 667, height: 375 };
const SHORT = { width: 568, height: 320 };

const live: TerminalScreen[] = [];
afterEach(() => {
  for (const screen of live) screen.destroy();
  live.length = 0;
  document.body.innerHTML = '';
});

function mount() {
  document.body.innerHTML = '<div id="ui"></div>';
  const onPause = vi.fn();
  const onBlocked = vi.fn();
  const onSolved = vi.fn();
  const parent = document.getElementById('ui');
  if (!parent) throw new Error('missing #ui');
  const screen = mountTerminalScreen(parent, { onPause, onBlocked, onSolved, viewport: GRID });
  live.push(screen);
  return { screen, onPause, onBlocked, onSolved };
}

describe('terminal layout', () => {
  it('568×320 is the rotate gate and 667×375 is the grid', () => {
    expect(terminalLayout(SHORT)).toMatchObject({
      mode: 'rotate',
      rotateTextId: 'M1_UI_ROTATE_TERMINAL',
      cellPx: null,
      columns: 2,
    });
    expect(terminalLayout(GRID)).toMatchObject({
      mode: 'grid',
      rotateTextId: null,
      cellPx: 28,
      columns: 2,
    });
    expect(terminalLayout({ width: 400, height: 321 }).mode).toBe('grid');
  });
});

describe('terminal window', () => {
  it('refuses to open while enemies are alert and does not pause', () => {
    const { screen, onPause, onBlocked } = mount();
    expect(screen.open({ depth: 1, enemiesAlert: true })).toEqual({
      ok: false,
      code: 'M1_SYS_04',
    });
    expect(onBlocked).toHaveBeenCalledWith('M1_SYS_04');
    expect(onPause).not.toHaveBeenCalled();
    expect(screen.isOpen).toBe(false);
    expect(screen.element.hidden).toBe(true);
    expect(screen.element.querySelectorAll('.term-switch')).toHaveLength(0);
  });

  it('568×320 shows the rotate hint and no switch buttons', () => {
    const { screen, onPause } = mount();
    expect(screen.open({ depth: 1, enemiesAlert: false, viewport: SHORT }).ok).toBe(true);
    expect(onPause).toHaveBeenCalledWith(true);
    expect(screen.element.dataset.mode).toBe('rotate');
    expect(screen.element.querySelectorAll('.term-switch')).toHaveLength(0);
    expect(
      screen.element.querySelector('[data-text-id="M1_UI_ROTATE_TERMINAL"]')?.textContent,
    ).toBe(TERM_COPY.M1_UI_ROTATE_TERMINAL);
    screen.close();
    expect(onPause).toHaveBeenLastCalledWith(false);
    expect(screen.isOpen).toBe(false);
  });

  it('667×375 renders two columns, 48×48 switches, counters, and SEND / ? / RESET / EXIT', () => {
    const { screen } = mount();
    screen.open({ depth: 1, enemiesAlert: false, viewport: GRID });
    expect(screen.element.querySelectorAll('.term-columns > *')).toHaveLength(2);
    const switches = [...screen.element.querySelectorAll<HTMLButtonElement>('.term-switch')];
    expect(switches.length).toBeGreaterThan(0);
    for (const hit of switches) {
      expect(hit.style.width).toBe(`${SWITCH_HIT_PX}px`);
      expect(hit.style.height).toBe(`${SWITCH_HIT_PX}px`);
    }
    expect(SWITCH_HIT_PX).toBe(48);
    const actions = ['send', 'reset', 'exit', 'help'] as const;
    const labels = ['SEND', 'RESET', 'EXIT', '?'];
    actions.forEach((action, index) => {
      const node = screen.element.querySelector(`.term-actions [data-action="${action}"]`);
      expect(node?.textContent).toBe(labels[index]);
    });
    const counters = [...screen.element.querySelectorAll('.term-consumer')].map(
      (node) => node.textContent,
    );
    expect(counters[0]?.startsWith('A ')).toBe(true);
    expect(counters.length).toBeLessThanOrEqual(4);
    for (const text of counters) expect(text).toMatch(/^[A-D] (?:\d+|–)\/\d+$/);
  });

  it('grows the grid when the viewport goes from 320 to 375', () => {
    const { screen } = mount();
    screen.open({ depth: 1, enemiesAlert: false, viewport: SHORT });
    expect(screen.element.querySelectorAll('.term-switch')).toHaveLength(0);
    screen.resize(GRID);
    expect(screen.element.dataset.mode).toBe('grid');
    expect(screen.element.querySelectorAll('.term-switch').length).toBeGreaterThan(0);
  });

  it('RESET restores the start mask and EXIT closes', () => {
    const { screen, onPause } = mount();
    screen.open({ depth: 1, enemiesAlert: false, viewport: GRID });
    const start = screen.mask;
    screen.toggleSwitch(0);
    expect(screen.mask).not.toBe(start);
    screen.reset();
    expect(screen.mask).toBe(start);
    screen.toggleSwitch(0);
    const reset = screen.element.querySelector<HTMLButtonElement>(
      '.term-actions [data-action="reset"]',
    );
    reset?.click();
    expect(screen.mask).toBe(start);
    screen.element.querySelector<HTMLButtonElement>('.term-actions [data-action="exit"]')?.click();
    expect(screen.isOpen).toBe(false);
    expect(onPause).toHaveBeenLastCalledWith(false);
  });

  it('completes all 8 variants through SEND with the authored taps', () => {
    const { screen, onSolved } = mount();
    for (const variant of powerLinesLine1.variants) {
      const opened = screen.open({ depth: variant.depth, enemiesAlert: false, viewport: GRID });
      expect(opened.ok, variant.id).toBe(true);
      expect(screen.variantId).toBe(variant.id);
      const counters = [...screen.element.querySelectorAll('.term-consumer')];
      expect(counters.length, variant.id).toBeGreaterThan(0);
      expect(counters.length, variant.id).toBeLessThanOrEqual(4);
      screen.applyTaps(variant.solution.taps);
      screen.send();
      expect(screen.progress.solved, variant.id).toContain(variant.id);
      const event = onSolved.mock.calls.at(-1)?.[0] as
        | {
            variantId: string;
            firstSolve: boolean;
            copper: number;
            fragmentPct: number;
            mk2: { pole: { dmgMin: number; dmgMax: number }; suit: { armor: number } } | null;
          }
        | undefined;
      expect(event?.variantId).toBe(variant.id);
      expect(event?.firstSolve).toBe(true);
      expect(event?.fragmentPct).toBe(10);
      expect(event?.copper).toBe(variant.id === 'M1_TERM_08' ? 10 : 0);
      if (variant.id === 'M1_TERM_05') {
        expect(screen.progress.stops).toEqual([1, 2]);
        expect(event?.mk2?.pole.dmgMin).toBe(10);
        expect(event?.mk2?.pole.dmgMax).toBe(15);
        expect(event?.mk2?.suit.armor).toBe(6);
      }
      if (variant.id === 'M1_TERM_08') expect(screen.progress.stops).toEqual([1]);
      screen.close();
    }
    expect(screen.progress.solved).toEqual(powerLinesLine1.variants.map((variant) => variant.id));
    expect(onSolved).toHaveBeenCalledTimes(8);

    screen.open({ depth: 1, enemiesAlert: false, viewport: GRID });
    expect(screen.variantId).toBe('M1_TERM_08');
    const solved = powerLinesLine1.variants.find((variant) => variant.id === 'M1_TERM_08');
    if (!solved) throw new Error('missing M1_TERM_08');
    screen.applyTaps(solved.solution.taps);
    screen.send();
    expect(screen.progress.solved).toHaveLength(8);
    const retune = onSolved.mock.calls.at(-1)?.[0] as {
      firstSolve: boolean;
      copper: number;
      retune: boolean;
    };
    expect(retune.firstSolve).toBe(false);
    expect(retune.retune).toBe(true);
    expect(retune.copper).toBe(0);
    expect(screen.element.querySelector('.term-status')?.getAttribute('data-text-id')).toBe(
      'M1_TERM_OK_RETUNE',
    );
  });

  it('SEND on the start mask does not solve, and Enter sends a winning mask', () => {
    const { screen, onSolved } = mount();
    screen.open({ depth: 1, enemiesAlert: false, viewport: GRID });
    screen.send();
    expect(screen.progress.solved).toEqual([]);
    expect(screen.element.querySelector('.term-status')?.getAttribute('data-text-id')).not.toBe(
      'M1_TERM_OK',
    );
    screen.destroy();

    const next = mount();
    let progress = createNetworkProgress();
    for (const id of VARIANT_SEQUENCE[1].slice(0, 2)) progress = solveVariant(progress, id);
    next.screen.open({ depth: 1, enemiesAlert: false, viewport: GRID, progress });
    expect(next.screen.variantId).toBe('M1_TERM_08');
    const variant = powerLinesLine1.variants.find((entry) => entry.id === 'M1_TERM_08');
    if (!variant) throw new Error('missing M1_TERM_08');
    next.screen.applyTaps(variant.solution.taps);
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
    expect(next.screen.progress.solved).toContain('M1_TERM_08');
    expect(next.onSolved.mock.calls[0]?.[0]).toMatchObject({ copper: 10, fragmentPct: 10 });
    expect(onSolved).not.toHaveBeenCalled();
  });
});
