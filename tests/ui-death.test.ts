// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { COMBAT_EXTRAS } from '../src/data/combat-m0';
import { FX } from '../src/data/fx';
import {
  acceptedCodes,
  createDeathScreen,
  DEATH_AUTO_MS,
  DEATH_INPUT,
  DEATH_MIN_MS,
  deathScreenData,
  enemyName,
  killedByText,
  lastHitsText,
} from '../src/ui/death-screen';
import { fillKeyTokens, KEY_TOKENS } from '../src/ui/key-tokens';

const key = (type: 'keydown' | 'keyup', code: string, repeat = false) =>
  document.body.dispatchEvent(
    new KeyboardEvent(type, { code, repeat, bubbles: true, cancelable: true }),
  );

function setup() {
  document.body.innerHTML = '<div id="ui"></div>';
  let now = 0;
  let paused = false;
  const clock = () => now; // stands in for loop.activeMs()
  const advance = (ms: number) => {
    if (!paused) now += ms; // activeMs does not grow in 'auto' / 'menu' pauses
    ds.update();
  };
  const onExit = vi.fn();
  const ds = createDeathScreen(document.getElementById('ui')!, { clock, onExit });
  ds.show({ killerName: 'Curfew Guard', lastHits: [6, 9, 18] });
  return { ds, onExit, advance, setPaused: (p: boolean) => (paused = p) };
}

describe('death screen: data and texts', () => {
  it('timings come from the data (1500 / 5000 ms)', () => {
    expect(DEATH_MIN_MS).toBe(1500);
    expect(DEATH_AUTO_MS).toBe(5000);
    expect(DEATH_MIN_MS).toBe(COMBAT_EXTRAS.DEATH_SCREEN_MIN_MS);
    expect(FX.fx_death_screen!.params).toMatchObject({
      DEATH_SCREEN_MIN_MS: DEATH_MIN_MS,
      DEATH_SCREEN_AUTO_MS: DEATH_AUTO_MS,
    });
  });

  it('inputs from fx_death_screen.input: tap + Enter, edge only', () => {
    expect(DEATH_INPUT.edgeOnly).toBe(true);
    expect(acceptedCodes()).toEqual(['Enter', 'NumpadEnter']);
    for (const c of ['Space', 'KeyJ']) expect(acceptedCodes()).not.toContain(c);
  });

  it('Killed by / Last hits lines', () => {
    expect(killedByText('Curfew Guard')).toBe('Killed by: Curfew Guard');
    expect(killedByText(null)).toBeNull();
    expect(lastHitsText([6, 9, 18])).toBe('Last hits: -6 · -9 · -18');
    expect(lastHitsText([12, 18])).toBe('Last hits: -12 · -18');
    expect(lastHitsText([4, 6, 9, 18])).toBe('Last hits: -6 · -9 · -18');
    expect(lastHitsText([])).toBeNull();
  });

  it('enemy names and data from getCombatDeath()', () => {
    expect(enemyName('panelDrone')).toBe('Panel Drone');
    expect(enemyName('curfewGuard')).toBe('Curfew Guard');
    expect(enemyName('railGuardian')).toBe('Rail Guardian');
    const hit = (dmg: number) => ({
      enemyType: 'scrapper' as const,
      enemyIndex: 0,
      from: { x: 1, y: 1 },
      aim: { x: 2, y: 1 },
      dmg,
      tick: dmg,
    });
    expect(deathScreenData({ killer: hit(18), lastHits: [hit(6), hit(18)] })).toEqual({
      killerName: 'Scrapper',
      lastHits: [6, 18],
      lost: null,
    });
    expect(deathScreenData(null)).toEqual({ killerName: null, lastHits: [], lost: null });
  });

  it('LOST line only when the field exists; hidden lines for unknown killer / no hits', () => {
    const { ds } = setup();
    const lost = ds.element.querySelector<HTMLElement>('.death-lost')!;
    expect(lost.hidden).toBe(true);
    ds.show({ killerName: null, lastHits: [], lost: { cr: 412, items: 9 } });
    expect(lost.hidden).toBe(false);
    expect(lost.textContent).toBe('Lost: 412 cr · 9 items');
    expect(ds.element.querySelector<HTMLElement>('.death-killer')!.hidden).toBe(true);
    expect(ds.element.querySelector<HTMLElement>('.death-hits')!.hidden).toBe(true);
  });
});

describe('death screen: input and clocks', () => {
  it('cannot be skipped for 1500 ms (Enter, tap)', () => {
    const { ds, onExit, advance } = setup();
    advance(1400);
    key('keydown', 'Enter');
    key('keyup', 'Enter');
    const btn = ds.element.querySelector<HTMLButtonElement>('.death-next')!;
    expect(btn.disabled).toBe(true);
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onExit).not.toHaveBeenCalled();
    expect(ds.isOpen).toBe(true);
  });

  it('Enter pressed after 1500 ms continues', () => {
    const { onExit, advance } = setup();
    advance(1500);
    key('keydown', 'Enter');
    expect(onExit).toHaveBeenCalledWith('next');
  });

  it('a tap on NEXT after 1500 ms continues', () => {
    const { ds, onExit, advance } = setup();
    advance(1600);
    const btn = ds.element.querySelector<HTMLButtonElement>('.death-next')!;
    expect(btn.disabled).toBe(false);
    btn.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onExit).toHaveBeenCalledWith('next');
  });

  it('Enter held from before 1500 ms does not continue (repeat, or repeats without the flag)', () => {
    const { onExit, advance } = setup();
    key('keydown', 'Enter'); // pressed during the locked phase and held
    advance(2000);
    key('keydown', 'Enter', true); // OS auto-repeat
    key('keydown', 'Enter', false); // repeat without the flag
    expect(onExit).not.toHaveBeenCalled();
    key('keyup', 'Enter');
    key('keydown', 'Enter'); // new press
    expect(onExit).toHaveBeenCalledWith('next');
  });

  it('Enter held since before the screen opened does not count', () => {
    document.body.innerHTML = '<div id="ui"></div>';
    let now = 0;
    const onExit = vi.fn();
    const ds = createDeathScreen(document.getElementById('ui')!, { clock: () => now, onExit });
    key('keydown', 'Enter'); // held while dying
    ds.show({ killerName: null, lastHits: [] });
    now = 1600;
    ds.update();
    key('keydown', 'Enter');
    expect(onExit).not.toHaveBeenCalled();
  });

  it('Space, J (ATK keys) never continue', () => {
    const { onExit, advance } = setup();
    advance(2000);
    for (const c of ['Space', 'KeyJ', 'KeyE', 'Escape']) {
      key('keydown', c);
      key('keyup', c);
    }
    expect(onExit).not.toHaveBeenCalled();
  });

  it('touch ATK / taps outside NEXT are swallowed and do not continue', () => {
    const { ds, onExit, advance } = setup();
    advance(2000);
    ds.element.dispatchEvent(new Event('pointerdown', { bubbles: true }));
    ds.element
      .querySelector('.death-panel')!
      .dispatchEvent(new Event('pointerdown', { bubbles: true }));
    expect(onExit).not.toHaveBeenCalled();
  });

  it('leaves by itself after 5000 ms', () => {
    const { ds, onExit, advance } = setup();
    advance(4950);
    expect(onExit).not.toHaveBeenCalled();
    advance(50);
    expect(onExit).toHaveBeenCalledWith('auto');
    expect(ds.isOpen).toBe(false);
  });

  it('a pause stops both clocks (activeMs)', () => {
    const { ds, onExit, advance, setPaused } = setup();
    advance(1000);
    setPaused(true);
    advance(60_000);
    expect(ds.elapsed).toBe(1000);
    key('keydown', 'Enter');
    key('keyup', 'Enter');
    expect(onExit).not.toHaveBeenCalled(); // still in the 1500 ms lock
    setPaused(false);
    advance(3999);
    expect(onExit).not.toHaveBeenCalled();
    advance(1);
    expect(onExit).toHaveBeenCalledWith('auto');
  });
});

describe('key tokens', () => {
  it('{KEY_MOVE} = WASD, {KEY_AIM} = arrows / mouse', () => {
    expect(KEY_TOKENS.KEY_MOVE).toBe('WASD');
    expect(fillKeyTokens('Move: {KEY_MOVE}.')).toBe('Move: WASD.');
    expect(fillKeyTokens('Aim: {KEY_AIM}. {KEY_NOPE}')).toBe('Aim: arrows / mouse. {KEY_NOPE}');
  });
});
