// QA-M0-009 regression (mechaniki §1.2 v0.5): opposite keys – the last pressed wins per axis.
import { describe, expect, it } from 'vitest';
import { keyGame } from './helpers/keys';

describe('QA-M0-009: opposite keys never stop the player', () => {
  it('hold D, add A → walks left; release A → right again (D still held)', () => {
    const k = keyGame();
    const x0 = k.g.player.x;
    k.tick((t) => t.down('KeyD')); // tick 0: right
    k.run(2);
    k.tick((t) => t.down('KeyA')); // tick 3: A pressed last → left
    expect(k.g.player.x).toBe(x0);
    k.run(2);
    k.tick(); // tick 6: still left
    expect(k.g.player.x).toBe(x0 - 1);
    k.tick((t) => t.up('KeyA')); // tick 7: D held → right
    k.run(1);
    k.tick(); // tick 9
    expect(k.g.player.x).toBe(x0);
    expect(k.g.player.facing).toEqual({ x: 1, y: 0 });
  });

  it('both pressed in the same tick: the later keydown wins; vertical axis too', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => (t.down('KeyA'), t.down('KeyD')));
    expect(k.g.player.x).toBe(x + 1);
    const v = keyGame();
    v.tick((t) => (t.down('ArrowDown'), t.down('KeyW')));
    expect(v.g.player.y).toBe(y - 1);
  });

  it('per axis: W held + A, D (D last) → up-right diagonal march', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => (t.down('KeyW'), t.down('KeyA'), t.down('KeyD')));
    expect(k.g.player).toMatchObject({ x: x + 1, y: y - 1 });
  });

  it('a tap of the opposite key while holding gives a step that way (not a stop)', () => {
    const k = keyGame();
    const x0 = k.g.player.x;
    k.tick((t) => t.down('KeyD')); // x0+1
    k.run(2);
    k.tick((t) => (t.down('KeyA'), t.up('KeyA'))); // tick 3: tap A → left
    expect(k.g.player.x).toBe(x0);
    k.run(2);
    k.tick(); // tick 6: D still held → right
    expect(k.g.player.x).toBe(x0 + 1);
  });
});
