// Twin-stick aim input: actions.aim (Dir8 | null), independent of movement.
import { describe, expect, it } from 'vitest';
import { InputManager } from '../src/input/actions';
import { AimStickSource, aimTowards, MouseAimSource, type PointerTarget } from '../src/input/aim';
import { KeyboardSource } from '../src/input/keyboard';
import { FakeKeys } from './helpers/keys';

class FakePointer implements PointerTarget {
  fns: Record<string, ((e: { clientX: number; clientY: number; pointerType?: string }) => void)[]> =
    {};
  addEventListener(t: string, fn: (e: { clientX: number; clientY: number }) => void) {
    (this.fns[t] ??= []).push(fn);
  }
  emit(t: string, x = 0, y = 0, pointerType = 'mouse') {
    for (const f of this.fns[t] ?? []) f({ clientX: x, clientY: y, pointerType });
  }
}

/** 10×10 px cells, canvas 0..300 × 0..200, camera at 0 → cell = floor(px / 10). */
const toCell = (x: number, y: number) =>
  x < 0 || y < 0 || x >= 300 || y >= 200 ? null : { x: Math.floor(x / 10), y: Math.floor(y / 10) };

function rig() {
  const keys = new FakeKeys();
  const ptr = new FakePointer();
  const stick = new AimStickSource();
  const player = { x: 10, y: 10 };
  const m = new InputManager();
  m.add(new KeyboardSource(keys));
  m.add(new MouseAimSource(ptr, toCell, () => player));
  m.add(stick);
  return { keys, ptr, stick, player, m };
}

describe('keyboard aim (arrows)', () => {
  it('arrows set aim, WASD only moves; nothing pressed = null', () => {
    const { keys, m } = rig();
    expect(m.sample().aim).toBeNull();
    keys.down('ArrowRight');
    keys.down('KeyW');
    const a = m.sample();
    expect(a.aim).toEqual({ x: 1, y: 0 });
    expect(a.move).toEqual({ x: 0, y: -1 });
    keys.up('ArrowRight');
    expect(m.sample().aim).toBeNull();
  });

  it('per axis the last pressed arrow wins; releasing it returns to the held one', () => {
    const { keys, m } = rig();
    keys.down('ArrowRight');
    keys.down('ArrowLeft');
    expect(m.sample().aim).toEqual({ x: -1, y: 0 });
    keys.up('ArrowLeft');
    expect(m.sample().aim).toEqual({ x: 1, y: 0 });
  });

  it('DIAG_GRACE: diagonal at once with the 2nd key; releasing both 1 tick apart keeps it', () => {
    const { keys, m } = rig();
    keys.down('ArrowUp');
    expect(m.sample().aim).toEqual({ x: 0, y: -1 });
    keys.down('ArrowRight');
    expect(m.sample().aim).toEqual({ x: 1, y: -1 });
    keys.up('ArrowUp');
    expect(m.sample().aim).toEqual({ x: 1, y: -1 }); // grace tick
    keys.up('ArrowRight');
    expect(m.sample().aim).toBeNull();
    // holding only one key longer than the grace: straight
    keys.down('ArrowUp');
    keys.down('ArrowRight');
    m.sample();
    keys.up('ArrowUp');
    m.sample();
    expect(m.sample().aim).toEqual({ x: 1, y: 0 });
  });

  it('arrows win over the mouse', () => {
    const { keys, ptr, m } = rig();
    ptr.emit('pointermove', 105, 155); // cell (10,15): straight down
    expect(m.sample().aim).toEqual({ x: 0, y: 1 });
    keys.down('ArrowLeft');
    const a = m.sample();
    expect(a.aim).toEqual({ x: -1, y: 0 });
    expect(a.digitalAim).toBe(true);
  });
});

describe('mouse aim', () => {
  it('8 sectors of 45° from the player cell to the cursor cell', () => {
    expect(aimTowards({ x: 0, y: 0 }, { x: 5, y: 1 })).toEqual({ x: 1, y: 0 });
    expect(aimTowards({ x: 0, y: 0 }, { x: 5, y: 3 })).toEqual({ x: 1, y: 1 });
    expect(aimTowards({ x: 0, y: 0 }, { x: -1, y: -4 })).toEqual({ x: 0, y: -1 });
    expect(aimTowards({ x: 0, y: 0 }, { x: 0, y: 0 })).toBeNull();
  });

  it('null on the player cell, outside the canvas, after leave and after reset (pause)', () => {
    const { ptr, player, m } = rig();
    ptr.emit('pointermove', 155, 55); // (15,5): up-right
    expect(m.sample().aim).toEqual({ x: 1, y: -1 });
    player.x = 15; // player moved under the cursor's row/col: re-quantised every poll
    expect(m.sample().aim).toEqual({ x: 0, y: -1 });
    ptr.emit('pointermove', 155, 105); // player cell (15,10)
    expect(m.sample().aim).toBeNull();
    ptr.emit('pointermove', 500, 50); // outside
    expect(m.sample().aim).toBeNull();
    ptr.emit('pointermove', 5, 105);
    expect(m.sample().aim).toEqual({ x: -1, y: 0 });
    ptr.emit('pointerleave');
    expect(m.sample().aim).toBeNull();
    ptr.emit('pointermove', 5, 105);
    m.reset();
    expect(m.sample().aim).toBeNull();
    ptr.emit('pointermove', 5, 105, 'touch'); // touch does not aim by pointer
    expect(m.sample().aim).toBeNull();
  });
});

describe('aim stick (touch, setAimStick)', () => {
  it('dead zone = MOVE_DEADZONE, 8 directions, null when released', () => {
    const { stick, m } = rig();
    stick.set({ x: 0.1, y: 0 });
    expect(m.sample().aim).toBeNull();
    stick.set({ x: 0.7, y: 0.7 });
    expect(m.sample().aim).toEqual({ x: 1, y: 1 });
    stick.set(null);
    expect(m.sample().aim).toBeNull();
  });

  it('pause reset: the held stick stays dead until released', () => {
    const { stick, m } = rig();
    stick.set({ x: -1, y: 0 });
    expect(m.sample().aim).toEqual({ x: -1, y: 0 });
    m.reset();
    stick.set({ x: -1, y: 0 });
    expect(m.sample().aim).toBeNull();
    stick.set(null);
    stick.set({ x: -1, y: 0 });
    expect(m.sample().aim).toEqual({ x: -1, y: 0 });
  });
});
