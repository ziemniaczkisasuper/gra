// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventBus, type GameEvents } from '../src/core/events';
import { GameLoop } from '../src/core/loop';
import { PALETTE, UI_STYLE } from '../src/data/style';
import { InputManager } from '../src/input/actions';
import { KeyboardSource } from '../src/input/keyboard';
import { TouchSource } from '../src/input/touch';
import { hpBar, hpLevel, hpText } from '../src/ui/hud';
import { createUi, MENU_RESUME_CODES, type Ui } from '../src/ui/overlay';

const key = (code: string, target: EventTarget = document.body) =>
  target.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));

/** Mirrors the wiring in main.ts (loop + input + UI), without canvas. */
function setup() {
  document.body.innerHTML = '<div id="ui"></div>';
  const root = document.getElementById('ui')!;
  const bus = new EventBus<GameEvents>();
  const input = new InputManager(2, 50);
  const kb = new KeyboardSource(window, undefined, 0, window);
  input.add(kb);
  const touch = new TouchSource();
  input.add(touch);
  const attacks: boolean[] = [];
  const loop: GameLoop = new GameLoop({
    events: bus,
    update: () => {
      const a = input.sample();
      attacks.push(a.attack);
      if (a.pause) loop.pause('menu');
    },
    render: () => {},
    countdownMs: 1000,
    onResumeStart: () => input.reset(),
    countdownTick: () => {
      if (input.collect()) loop.pause('menu');
    },
    idle: () => {
      if (input.sample().pause && loop.pauseReason !== 'text') loop.resume();
    },
  });
  const consumed = vi.fn((code: string) => kb.block(code));
  const resume = vi.fn((opts?: { countdown?: boolean }) => loop.resume(opts));
  const ui: Ui = createUi(
    root,
    {
      onPause: () => loop.pause('menu'),
      onResume: () => resume(),
      onExportFile() {},
      onImportFile() {},
      onCopyCode: async () => '',
      onImportCode() {},
      onOpenText: () => loop.pause('text'),
      onCloseText: () => resume({ countdown: loop.autoPausedDuring }),
      onKeyConsumed: (code) => consumed(code),
    },
    { touch, settings: { leftHanded: false, forceTouch: true } },
  );
  bus.on('paused', ({ reason }) => {
    input.reset();
    ui.hideCountdown();
    ui.showPaused(reason);
  });
  bus.on('countdown', ({ digit }) => {
    ui.hidePaused();
    ui.showCountdown(digit);
  });
  bus.on('resumed', () => {
    ui.hidePaused();
    ui.hideCountdown();
  });
  let now = 0;
  const frame = (ms = 50) => loop.frame((now += ms));
  frame();
  return { root, loop, ui, resume, frame, kb, attacks, consumed };
}

describe('pause menu: resume only with RESUME / Esc / P / Enter', () => {
  beforeEach(() => vi.useRealTimers());

  it('resume keys list', () => {
    expect(MENU_RESUME_CODES).toEqual(['Escape', 'KeyP', 'Enter', 'NumpadEnter']);
  });

  for (const code of ['Space', 'KeyJ', 'KeyW', 'ArrowUp', 'KeyA', 'Digit1', 'Tab']) {
    it(`${code} does not resume`, () => {
      const { loop, ui, frame } = setup();
      loop.pause('menu');
      expect(ui.overlayVisible).toBe(true);
      key(code);
      frame();
      frame();
      expect(loop.mode).toBe('paused');
      expect(ui.overlayVisible).toBe(true);
    });
  }

  for (const code of ['Escape', 'KeyP', 'Enter']) {
    it(`${code} resumes with the 1 s countdown`, () => {
      const { loop, ui, frame, root } = setup();
      loop.pause('auto');
      key(code);
      frame();
      expect(loop.mode).toBe('countdown');
      expect(ui.overlayVisible).toBe(false);
      expect(root.querySelector('.countdown')!.classList.contains('visible')).toBe(true);
      expect(root.querySelector('.cd-digit.now')!.textContent).toBe('3');
      for (let i = 0; i < 22; i++) frame();
      expect(loop.mode).toBe('running');
      expect(root.querySelector('.countdown')!.classList.contains('visible')).toBe(false);
    });
  }

  it('the [||] button pauses, the RESUME button resumes', () => {
    const { loop, root } = setup();
    (root.querySelector('.pause-btn') as HTMLButtonElement).click();
    expect(loop.pauseReason).toBe('menu');
    (root.querySelector('.resume') as HTMLButtonElement).click();
    expect(loop.mode).toBe('countdown');
  });
});

describe('text window', () => {
  it('opens with pause reason "text" and without the pause menu', () => {
    const { loop, ui, root } = setup();
    ui.showText(['One. Two.', 'Three.']);
    expect(loop.pauseReason).toBe('text');
    expect(ui.overlayVisible).toBe(false);
    expect(root.querySelector('.text-body')!.textContent).toBe('One. Two.');
    expect(root.querySelector('.text-next')!.textContent).toBe('NEXT >');
    expect(root.querySelector('.text-close')!.textContent).toBe('CLOSE');
  });

  it('Esc closes the text (no pause menu) and resumes at once, without countdown', () => {
    const { loop, ui, resume, frame } = setup();
    ui.showText(['Note.']);
    key('Escape');
    expect(ui.text.isOpen).toBe(false);
    expect(resume).toHaveBeenCalledWith({ countdown: false });
    expect(loop.mode).toBe('running');
    frame();
    frame();
    expect(loop.paused).toBe(false); // Esc did not leak into the input layer as "pause"
    expect(ui.overlayVisible).toBe(false);
  });

  it('P and Space do not leak into the game while reading; Space turns the page', () => {
    const { loop, ui, frame } = setup();
    ui.showText(['A.', 'B.']);
    key('KeyP');
    frame();
    expect(loop.pauseReason).toBe('text');
    key('Space');
    expect(ui.text.page).toBe(1);
    key('Space'); // last page → close
    expect(ui.text.isOpen).toBe(false);
    frame();
    frame();
    expect(loop.paused).toBe(false);
  });

  it('NEXT pages through fragments, CLOSE closes; tapping outside does nothing', () => {
    const { ui, root, loop } = setup();
    ui.showText(['A.', 'B.', 'C.']);
    const next = root.querySelector('.text-next') as HTMLButtonElement;
    next.click();
    next.click();
    expect(root.querySelector('.text-body')!.textContent).toBe('C.');
    expect(next.hidden).toBe(true);
    const backdrop = root.querySelector('.text-backdrop')!;
    backdrop.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(ui.text.isOpen).toBe(true);
    (root.querySelector('.text-close') as HTMLButtonElement).click();
    expect(ui.text.isOpen).toBe(false);
    expect(loop.mode).toBe('running');
  });

  it('after an auto-pause while reading, closing resumes WITH the countdown', () => {
    const { ui, resume, loop } = setup();
    ui.showText(['Note.']);
    loop.pause('auto'); // suppressed: keeps reason 'text', sets loop.autoPausedDuring
    expect(loop.pauseReason).toBe('text');
    expect(loop.autoPausedDuring).toBe(true);
    key('Escape');
    expect(resume).toHaveBeenCalledWith({ countdown: true });
    expect(loop.mode).toBe('countdown');
  });
});

const keyup = (code: string) =>
  document.body.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));

describe('the key that closed the text / resumed the menu does not act in the game', () => {
  for (const code of ['Space', 'KeyJ']) {
    it(`${code} closing the text attacks only after release + press again`, () => {
      const { ui, loop, frame, attacks, consumed } = setup();
      ui.showText(['Last page.']);
      key(code); // closes (last page)
      expect(ui.text.isOpen).toBe(false);
      expect(loop.mode).toBe('running');
      expect(consumed).toHaveBeenCalledWith(code);
      key(code); // still held: OS repeat without the repeat flag
      for (let i = 0; i < 4; i++) frame();
      expect(attacks.some(Boolean)).toBe(false);
      keyup(code);
      key(code); // deliberate new press
      frame();
      expect(attacks.at(-1)).toBe(true);
    });
  }

  it('Esc closing the text does not open the pause menu while still held', () => {
    const { ui, loop, frame } = setup();
    ui.showText(['Note.']);
    key('Escape');
    key('Escape'); // held, no repeat flag
    frame();
    frame();
    expect(loop.paused).toBe(false);
    keyup('Escape');
    key('Escape');
    frame();
    expect(loop.pauseReason).toBe('menu');
  });

  it('CLOSE button: no key is blocked', () => {
    const { ui, root, consumed, frame, attacks } = setup();
    ui.showText(['Note.']);
    (root.querySelector('.text-close') as HTMLButtonElement).click();
    expect(consumed).not.toHaveBeenCalled();
    key('Space');
    frame(); // first frame after resume only resets the time base
    frame();
    expect(attacks.at(-1)).toBe(true);
  });

  it('Enter resuming from the menu is consumed; Space held over the resume needs a new press', () => {
    const { loop, frame, attacks, consumed } = setup();
    key('Space'); // held from before the pause
    frame();
    loop.pause('menu');
    key('Enter');
    expect(consumed).toHaveBeenCalledWith('Enter');
    expect(loop.mode).toBe('countdown');
    for (let i = 0; i < 24; i++) frame();
    expect(loop.mode).toBe('running');
    attacks.length = 0;
    frame();
    expect(attacks.some(Boolean)).toBe(false);
    keyup('Space');
    key('Space');
    frame();
    expect(attacks.at(-1)).toBe(true);
  });
});

describe('HUD', () => {
  it('ASCII HP bar with number', () => {
    expect(hpText(80, 100)).toBe('HP [########--] 80/100');
    expect(hpBar(100, 100)).toBe('[##########]');
    expect(hpBar(99, 100)).toBe('[#########-]'); // hurt is never shown as full
    expect(hpBar(1, 100)).toBe('[#---------]'); // alive is never shown as empty
    expect(hpBar(0, 100)).toBe('[----------]');
    expect(hpBar(-5, 100)).toBe('[----------]');
  });

  it('colour bands: >50% high, 25–50% mid, <25% low', () => {
    expect(hpLevel(51, 100)).toBe('high');
    expect(hpLevel(50, 100)).toBe('mid');
    expect(hpLevel(25, 100)).toBe('mid');
    expect(hpLevel(24, 100)).toBe('low');
  });

  it('updates the DOM and reserves hidden rows for M1 under HP', () => {
    const { ui, root } = setup();
    ui.hud.setHp(80, 100);
    expect(root.querySelector('.hud-row.hp')!.textContent).toBe('HP [########--] 80/100');
    expect(root.querySelector('.hud-row.hp')!.getAttribute('data-level')).toBe('high');
    const reserved = [...root.querySelectorAll<HTMLElement>('.hud-reserved')];
    expect(reserved.map((r) => r.dataset.slot)).toEqual(['resource', 'at-risk', 'backpack']);
    expect(reserved.every((r) => r.hidden)).toBe(true);
  });
});

// WCAG contrast of HUD text over its plate composited on the brightest map tiles.
const rgb = (c: string): [number, number, number, number] => {
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1]!.split(',').map(Number);
    return [p[0]!, p[1]!, p[2]!, p[3] ?? 1];
  }
  const h = c.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)).concat(1) as never;
};
const over = (top: string, under: string) => {
  const [r, g, b, a] = rgb(top);
  const [r2, g2, b2] = rgb(under);
  return [r * a + r2 * (1 - a), g * a + g2 * (1 - a), b * a + b2 * (1 - a)];
};
const lum = ([r, g, b]: number[]) =>
  [r!, g!, b!]
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i]!, 0);
const contrast = (a: number[], b: number[]) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x! + 0.05) / (y! + 0.05);
};

describe('HUD contrast ≥ 4.5:1', () => {
  const fgs = [UI_STYLE.text, UI_STYLE.accent, UI_STYLE.warning, UI_STYLE.danger, UI_STYLE.frame];
  for (const under of [PALETTE.background, PALETTE.wall, PALETTE.player, PALETTE.enemy]) {
    it(`HUD plate over ${under}`, () => {
      const plate = over(UI_STYLE.hudBg, under);
      for (const fg of fgs)
        expect(contrast(over(fg, '#000000'), plate)).toBeGreaterThanOrEqual(4.5);
    });
  }
});
