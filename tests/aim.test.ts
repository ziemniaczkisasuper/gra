// Twin-stick aim input: actions.aim (Dir8 | null), independent of movement.
import { describe, expect, it } from 'vitest';
import { M0 } from '../src/data/mechanics-m0';
import { InputManager } from '../src/input/actions';
import {
  AimStickSource,
  aimTowards,
  MouseAimSource,
  type PointerEventLike,
  type PointerTarget,
} from '../src/input/aim';
import { KeyboardSource } from '../src/input/keyboard';
import { FakeKeys } from './helpers/keys';

class FakePointer implements PointerTarget {
  fns: Record<string, ((e: PointerEventLike) => void)[]> = {};
  addEventListener(t: string, fn: (e: PointerEventLike) => void) {
    (this.fns[t] ??= []).push(fn);
  }
  emit(t: string, x = 0, y = 0, pointerType = 'mouse', button?: number) {
    for (const f of this.fns[t] ?? []) f({ clientX: x, clientY: y, pointerType, button });
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
    expect(a.aimFire).toBe(true);
    expect(a.move).toEqual({ x: 0, y: -1 });
    keys.up('ArrowRight');
    const released = m.sample();
    expect(released.aim).toBeNull();
    expect(released.aimFire).toBe(false); // WASD still held: movement only
    expect(released.move).toEqual({ x: 0, y: -1 });
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

  it('last used source wins between arrows and the mouse', () => {
    const { keys, ptr, m } = rig();
    ptr.emit('pointermove', 105, 155); // cell (10,15): straight down
    const mouse = m.sample();
    expect(mouse.aim).toEqual({ x: 0, y: 1 });
    expect(mouse.aimFire).toBe(false);
    expect(mouse.aimCell).toEqual({ x: 10, y: 15 });

    keys.down('ArrowLeft');
    ptr.emit('pointermove', 108, 158); // same cell: not a use, arrows keep winning
    const arrows = m.sample();
    expect(arrows.aim).toEqual({ x: -1, y: 0 });
    expect(arrows.digitalAim).toBe(true);
    expect(arrows.aimFire).toBe(true);
    expect(arrows.aimCell).toBeNull();

    ptr.emit('pointermove', 155, 105); // cell (15,10): ≥ 1 cell, arrow still held
    const moved = m.sample();
    expect(moved.aim).toEqual({ x: 1, y: 0 });
    expect(moved.digitalAim).toBeUndefined();
    expect(moved.aimFire).toBe(true);
    expect(moved.aimCell).toEqual({ x: 15, y: 10 });

    keys.up('ArrowLeft');
    const released = m.sample();
    expect(released.aim).toEqual({ x: 1, y: 0 });
    expect(released.aimFire).toBe(false);
    expect(released.aimCell).toEqual({ x: 15, y: 10 });
  });

  it('releasing arrows restores the mouse still over the canvas', () => {
    const { keys, ptr, m } = rig();
    ptr.emit('pointermove', 105, 155); // (10,15) down
    expect(m.sample().aim).toEqual({ x: 0, y: 1 });
    keys.down('ArrowLeft');
    expect(m.sample().aim).toEqual({ x: -1, y: 0 });
    keys.up('ArrowLeft');
    const a = m.sample();
    expect(a.aim).toEqual({ x: 0, y: 1 });
    expect(a.aimCell).toEqual({ x: 10, y: 15 });
    expect(a.aimFire).toBe(false);
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
    ptr.emit('pointermove', 155, 105); // player cell (15,10): direction null, cell still reported
    const onPlayer = m.sample();
    expect(onPlayer.aim).toBeNull();
    expect(onPlayer.aimCell).toEqual({ x: 15, y: 10 });
    expect(onPlayer.aimFire).toBe(false);
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

  it('pointing does not fire; LMB (button 0) attacks and counts as a use', () => {
    const { keys, ptr, m } = rig();
    ptr.emit('pointermove', 155, 105); // (15,10) east of the player
    const aimOnly = m.sample();
    expect(aimOnly.aim).toEqual({ x: 1, y: 0 });
    expect(aimOnly.aimFire).toBe(false);
    expect(aimOnly.attack).toBe(false);

    keys.down('ArrowDown');
    m.sample();
    ptr.emit('pointerdown', 156, 106, 'mouse'); // no button, same cell: not a click
    const noClick = m.sample();
    expect(noClick.attack).toBe(false);
    expect(noClick.aim).toEqual({ x: 0, y: 1 });

    ptr.emit('pointerdown', 155, 105, 'mouse', 0); // click back east, arrow still held
    const click = m.sample();
    expect(click.attack).toBe(true);
    expect(click.aim).toEqual({ x: 1, y: 0 });
    expect(click.aimCell).toEqual({ x: 15, y: 10 });
    expect(m.sample().attack).toBe(true); // still held
    ptr.emit('pointerup', 155, 105, 'mouse', 0);
    expect(m.sample().attack).toBe(false);

    ptr.emit('pointerdown', 155, 105, 'mouse', 0);
    ptr.emit('pointerup', 155, 105, 'mouse', 0); // tap shorter than a tick
    expect(m.sample().attack).toBe(true);
  });
});

describe('aim stick (touch, setAimStick)', () => {
  it('dead zone = AIM_DEADZONE, 8 directions, null when released', () => {
    const { stick, m } = rig();
    expect(0.2).toBeGreaterThan(M0.MOVE_DEADZONE);
    expect(0.2).toBeLessThan(M0.AIM_DEADZONE);
    stick.set({ x: 0.2, y: 0 }); // above the move dead zone, inside the aim dead zone
    const inside = m.sample();
    expect(inside.aim).toBeNull();
    expect(inside.aimFire).toBe(false);
    stick.set({ x: 0.35, y: 0 });
    const edge = m.sample();
    expect(edge.aim).toEqual({ x: 1, y: 0 });
    expect(edge.aimFire).toBe(true);
    stick.set({ x: 0.7, y: 0.7 });
    const diag = m.sample();
    expect(diag.aim).toEqual({ x: 1, y: 1 });
    expect(diag.aimFire).toBe(true);
    stick.set(null);
    const released = m.sample();
    expect(released.aim).toBeNull();
    expect(released.aimFire).toBe(false);
  });

  it('a newer mouse aim survives a stick that is still out, and its release', () => {
    const { ptr, stick, m } = rig();
    stick.set({ x: 1, y: 0 });
    expect(m.sample().aim).toEqual({ x: 1, y: 0 });
    ptr.emit('pointermove', 105, 155); // down, while the stick stays deflected
    const mouse = m.sample();
    expect(mouse.aim).toEqual({ x: 0, y: 1 });
    expect(mouse.aimCell).toEqual({ x: 10, y: 15 });
    expect(mouse.aimFire).toBe(true);
    stick.set(null);
    const released = m.sample();
    expect(released.aim).toEqual({ x: 0, y: 1 });
    expect(released.aimFire).toBe(false);
    expect(released.aimCell).toEqual({ x: 10, y: 15 });
  });

  it('releasing arrows returns to a stick that is still deflected', () => {
    const { keys, stick, m } = rig();
    stick.set({ x: 0, y: 1 });
    expect(m.sample().aim).toEqual({ x: 0, y: 1 });
    keys.down('ArrowLeft');
    const arrows = m.sample();
    expect(arrows.aim).toEqual({ x: -1, y: 0 });
    expect(arrows.aimFire).toBe(true);
    expect(arrows.aimCell).toBeNull();
    keys.up('ArrowLeft');
    const back = m.sample();
    expect(back.aim).toEqual({ x: 0, y: 1 });
    expect(back.aimFire).toBe(true);
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
