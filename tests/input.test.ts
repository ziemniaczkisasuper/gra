import { describe, expect, it } from 'vitest';
import { InputManager, type ActionState, type InputSource } from '../src/input/actions';
import { KeyboardSource, type KeyEventLike, type KeyTarget } from '../src/input/keyboard';

class FakeTarget implements KeyTarget {
  private fns: Record<string, ((e: KeyEventLike) => void)[]> = { keydown: [], keyup: [] };
  addEventListener(t: 'keydown' | 'keyup', fn: (e: KeyEventLike) => void) {
    this.fns[t]!.push(fn);
  }
  removeEventListener() {}
  down(code: string, repeat = false) {
    for (const f of this.fns.keydown!) f({ code, repeat });
  }
  up(code: string) {
    for (const f of this.fns.keyup!) f({ code });
  }
}

const kb = (grace = 0) => {
  const t = new FakeTarget();
  const m = new InputManager(2, 50);
  m.add(new KeyboardSource(t, undefined, grace));
  return { t, m };
};

describe('InputManager + KeyboardSource', () => {
  it('a tap shorter than a tick is latched and buffered for 2 steps', () => {
    const { t, m } = kb();
    t.down('Space');
    t.up('Space');
    expect(m.sample().attack).toBe(true);
    expect(m.pressed.has('attack')).toBe(true);
    expect(m.sample().attack).toBe(true); // tap buffer (100 ms = 2 ticks)
    expect(m.pressed.has('attack')).toBe(false);
    expect(m.sample().attack).toBe(false);
  });

  it('pause is an edge, consumed by the first step', () => {
    const { t, m } = kb();
    t.down('Escape');
    expect(m.sample().pause).toBe(true);
    expect(m.sample().pause).toBe(false);
  });

  it('reset releases held keys; auto-repeat does not re-press them', () => {
    const { t, m } = kb();
    t.down('KeyW');
    t.down('Space');
    expect(m.sample().move.y).toBe(-1);
    m.reset();
    t.down('KeyW', true);
    t.down('Space', true);
    const a = m.sample();
    expect(a.move).toEqual({ x: 0, y: 0 });
    expect(a.attack).toBe(false);
    t.up('KeyW');
    t.down('KeyW');
    expect(m.sample().move.y).toBe(-1);
  });

  it('opposite keys: the last pressed wins (v0.5, QA-M0-009); diagonals are normalised', () => {
    const { t, m } = kb();
    t.down('KeyA');
    t.down('KeyD');
    expect(m.sample().move.x).toBe(1);
    t.up('KeyA');
    t.down('KeyS');
    const { x, y } = m.sample().move;
    expect(Math.hypot(x, y)).toBeCloseTo(1);
  });

  it('v0.5 (QA-M0-002): no DIAG_GRACE wait in the source – a straight key moves at once', () => {
    const { t, m } = kb(50);
    t.down('KeyW');
    const a = m.sample();
    expect(a.move).toEqual({ x: 0, y: -1 });
    expect(a.digitalMove).toBe(true); // the engine applies the grace (entities/player-move.ts)
    t.down('KeyD');
    expect(m.sample().move.x).toBeGreaterThan(0);
  });

  it('a quick tap gives exactly one poll with the direction', () => {
    const { t, m } = kb(50);
    t.down('KeyD');
    t.up('KeyD');
    expect(m.sample().move.x).toBe(1);
    expect(m.sample().move.x).toBe(0);
  });

  it('merges sources and tracks idle time', () => {
    const m = new InputManager(2, 50);
    let mv = { x: 0, y: 0 };
    const src: InputSource = { poll: (): Partial<ActionState> => ({ move: mv }), reset: () => {} };
    m.add(src);
    m.add({ poll: () => ({ move: { x: 0.8, y: 0 } }), reset: () => {} });
    expect(m.sample().move.x).toBe(0.8);
    mv = { x: 1, y: 0 };
    expect(m.sample().move.x).toBe(1);
    const idle = new InputManager(2, 50);
    for (let i = 0; i < 4; i++) idle.sample();
    expect(idle.idleMs).toBe(200);
  });
});

describe('InputManager during the resume countdown', () => {
  it('presses during the countdown act in the first tick after it', () => {
    const { t, m } = kb();
    t.down('KeyW'); // held before RESUME
    m.reset(); // loop.resume() → onResumeStart
    t.down('KeyW', true); // auto-repeat: still inactive
    expect(m.collect()).toBe(false);
    t.down('Space');
    t.up('Space'); // quick tap during the countdown
    expect(m.collect()).toBe(false);
    const a = m.sample(); // first tick
    expect(a.attack).toBe(true);
    expect(m.pressed.has('attack')).toBe(true);
    expect(a.move).toEqual({ x: 0, y: 0 }); // W was held before resume → ignored
  });

  it('a direction pressed during the countdown moves in the first tick', () => {
    const { t, m } = kb();
    m.reset();
    t.down('KeyD');
    m.collect();
    t.up('KeyD'); // released before the countdown ends
    m.collect();
    expect(m.sample().move.x).toBe(1);
    expect(m.sample().move.x).toBe(0);
  });

  it('collect() reports pause (Esc cancels the countdown)', () => {
    const { t, m } = kb();
    t.down('Escape');
    expect(m.collect()).toBe(true);
  });
});
