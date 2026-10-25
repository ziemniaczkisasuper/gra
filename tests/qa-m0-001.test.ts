// QA-M0-001 regression: a direction tap during the step cooldown is buffered, not lost.
import { describe, expect, it } from 'vitest';
import { keyGame } from './helpers/keys';

describe('QA-M0-001: buffered direction taps', () => {
  it('S tapped for 1 tick in cooldown tick 1 → one step down after the cooldown', () => {
    const k = keyGame(undefined, 0);
    const { x, y } = k.g.player;
    k.tick((t) => (t.down('KeyD'), t.up('KeyD'))); // tap D: step right, cooldown 3
    k.tick((t) => t.down('KeyS')); // cooldown tick 1
    k.tick((t) => t.up('KeyS'));
    k.run(8);
    expect(k.g.player).toMatchObject({ x: x + 1, y: y + 1 });
    expect(k.g.player.facing).toEqual({ x: 0, y: 1 });
  });

  it('S held for 2 ticks in the cooldown → exactly one step down', () => {
    const k = keyGame(undefined, 0);
    const { x, y } = k.g.player;
    k.tick((t) => (t.down('KeyD'), t.up('KeyD')));
    k.tick((t) => t.down('KeyS'));
    k.tick();
    k.tick((t) => t.up('KeyS'));
    k.run(8);
    expect(k.g.player).toMatchObject({ x: x + 1, y: y + 1 });
  });

  it('double tap D (1 tick, gap 1 tick, 1 tick) → two steps', () => {
    const k = keyGame(undefined, 0);
    const x = k.g.player.x;
    k.tick((t) => (t.down('KeyD'), t.up('KeyD')));
    k.tick();
    k.tick((t) => (t.down('KeyD'), t.up('KeyD')));
    k.run(8);
    expect(k.g.player.x).toBe(x + 2);
  });

  it('D held for 2 ticks (100 ms) → one step (hold ≠ double tap)', () => {
    const k = keyGame(undefined, 0);
    const x = k.g.player.x;
    k.tick((t) => t.down('KeyD'));
    k.tick((t) => t.up('KeyD'));
    k.run(8);
    expect(k.g.player.x).toBe(x + 1);
  });

  it('the buffered step comes right when the cooldown ends (3 ticks after the first)', () => {
    const k = keyGame(undefined, 0);
    const { x, y } = k.g.player;
    k.tick((t) => (t.down('KeyD'), t.up('KeyD'))); // tick 0
    k.tick((t) => (t.down('KeyS'), t.up('KeyS'))); // tick 1
    k.run(3); // ticks 2, 3, 4
    expect(k.log[2]).toEqual({ x: x + 1, y }); // still cooling down
    expect(k.log[3]).toEqual({ x: x + 1, y: y + 1 }); // tick 3 = 150 ms
  });

  it('holding keeps marching every 3 ticks (no extra steps from the buffer)', () => {
    const k = keyGame(undefined, 0);
    const x = k.g.player.x;
    k.tick((t) => t.down('KeyD'));
    k.run(8); // 9 ticks held → steps at 0, 3, 6 (wall at x=10 not reached)
    k.tick((t) => t.up('KeyD'));
    k.run(6);
    expect(k.g.player.x).toBe(x + 3);
  });
});
