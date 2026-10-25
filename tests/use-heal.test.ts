// ui-m1 S-T4: USE (E) and heal (Q) actions with the same tap buffer as ATK.
import { describe, expect, it } from 'vitest';
import { InputManager, emptyActions } from '../src/input/actions';
import { KeyboardSource } from '../src/input/keyboard';
import { TouchSource } from '../src/input/touch';
import { FakeKeys } from './helpers/keys';

describe('actions use / heal', () => {
  it('emptyActions has both false', () => {
    const a = emptyActions();
    expect([a.use, a.heal]).toEqual([false, false]);
  });

  it('E → use, Q → heal: held = true, a short tap stays true for the 2-tick buffer', () => {
    const keys = new FakeKeys();
    const input = new InputManager();
    input.add(new KeyboardSource(keys));
    keys.down('KeyE');
    expect(input.sample().use).toBe(true);
    expect(input.sample().use).toBe(true); // held
    keys.up('KeyE');
    keys.down('KeyQ');
    keys.up('KeyQ'); // tap shorter than a tick
    const a = input.sample();
    expect(a.heal).toBe(true);
    expect(input.pressed.has('heal')).toBe(true);
    expect(input.sample().heal).toBe(true); // buffer
    input.sample();
    expect(input.sample().heal).toBe(false);
  });

  it('touch buttons use / heal (UI draws them)', () => {
    const t = new TouchSource();
    t.buttonDown(1, 'use');
    expect(t.poll().use).toBe(true);
    t.pointerUp(1);
    t.buttonDown(2, 'heal');
    expect(t.poll().heal).toBe(true);
  });
});
