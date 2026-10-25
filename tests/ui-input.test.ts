import { describe, expect, it } from 'vitest';
import { InputManager, toDir8 } from '../src/input/actions';
import { JOYSTICK, Joystick, nextSector, sectorOf } from '../src/input/joystick';
import {
  KeyboardSource,
  PAUSE_CODES,
  type BlurTarget,
  type KeyEventLike,
  type KeyTarget,
} from '../src/input/keyboard';
import { TouchSource } from '../src/input/touch';

const R = JOYSTICK.radius;
/** Offset at `deg` (screen coords, 0 = east, 90 = south) and `frac` of the radius. */
const at = (deg: number, frac = 1) => {
  const a = (deg * Math.PI) / 180;
  return [Math.cos(a) * R * frac, Math.sin(a) * R * frac] as const;
};

describe('joystick: 8 sectors, dead zone, hysteresis, hold below 25%', () => {
  it('maps angles to the nearest of 8 sectors (0 = east, clockwise on screen)', () => {
    expect(sectorOf(...at(0))).toBe(0);
    expect(sectorOf(...at(22))).toBe(0);
    expect(sectorOf(...at(23))).toBe(1);
    expect(sectorOf(...at(90))).toBe(2);
    expect(sectorOf(...at(180))).toBe(4);
    expect(sectorOf(...at(-90))).toBe(6);
    expect(sectorOf(...at(-30))).toBe(7);
  });

  it('dead zone 15%: no direction, and the remembered one is dropped', () => {
    expect(nextSector(null, ...at(0, 0.14))).toBeNull();
    expect(nextSector(3, ...at(0, 0.14))).toBeNull();
    expect(nextSector(null, ...at(0, 0.16))).toBe(0);
  });

  it('below 25% the previous direction is kept, above it the angle decides', () => {
    expect(nextSector(0, ...at(90, 0.2))).toBe(0); // jitter near the centre: no flip
    expect(nextSector(0, ...at(90, 0.3))).toBe(2);
    expect(nextSector(null, ...at(90, 0.2))).toBe(2); // fresh start: nearest sector
  });

  it('hysteresis 10°: a sector is left only 10° past its edge (22.5° + 10° = 32.5°)', () => {
    expect(nextSector(0, ...at(30))).toBe(0);
    expect(nextSector(0, ...at(32))).toBe(0);
    expect(nextSector(0, ...at(33))).toBe(1);
    expect(nextSector(1, ...at(13))).toBe(1); // 45 - 13 = 32 ≤ 32.5
    expect(nextSector(1, ...at(12))).toBe(0);
    expect(nextSector(0, ...at(-32))).toBe(0); // wraps around east
    expect(nextSector(0, ...at(-33))).toBe(7);
    expect(nextSector(4, ...at(-148))).toBe(4); // around west (±180°)
  });

  it('the vector agrees with the engine quantiser toDir8 for every sector', () => {
    const j = new Joystick();
    for (let s = 0; s < 8; s++) {
      j.start(100, 100);
      const [dx, dy] = at(s * 45, 0.9);
      j.move(100 + dx, 100 + dy);
      expect(j.sector).toBe(s);
      const d = toDir8(j.vector)!;
      expect([d.x, d.y]).toEqual([j.vector.x, j.vector.y]);
    }
  });

  it('the base follows the thumb outside the radius (never stuck on the edge)', () => {
    const j = new Joystick();
    j.start(100, 100);
    j.move(100 + 3 * R, 100);
    expect(j.baseX).toBeCloseTo(100 + 2 * R);
    expect(j.knobX - j.baseX).toBeCloseTo(R);
    j.move(100 + R, 100); // pulling back now goes west of the new base
    expect(j.sector).toBe(4);
  });
});

describe('TouchSource', () => {
  it('joystick and ATK work at the same time on different pointers', () => {
    const t = new TouchSource();
    const m = new InputManager(2, 50);
    m.add(t);
    expect(t.stickDown(1, 100, 200)).toBe(true);
    t.pointerMove(1, 100 + R * 0.8, 200);
    t.buttonDown(2, 'attack');
    const a = m.sample();
    expect(toDir8(a.move)).toEqual({ x: 1, y: 0 });
    expect(a.attack).toBe(true);
    expect(t.stickDown(3, 50, 50)).toBe(false); // a second finger cannot steal the stick
  });

  it('a short ATK tap is latched until the next poll', () => {
    const t = new TouchSource();
    t.buttonDown(5, 'attack');
    t.pointerUp(5);
    expect(t.poll().attack).toBe(true);
    expect(t.poll().attack).toBe(false);
  });

  it('a stick finger keeps driving the joystick when it slides anywhere', () => {
    const t = new TouchSource();
    t.stickDown(1, 100, 200);
    t.pointerMove(1, 900, 200); // far into the right half
    expect(t.poll().move).toEqual({ x: 1, y: 0 });
    t.pointerUp(1);
    expect(t.poll().move).toEqual({ x: 0, y: 0 });
  });

  it('reset() releases everything; fingers still down stay dead until lifted', () => {
    const t = new TouchSource();
    t.stickDown(1, 100, 200);
    t.pointerMove(1, 100, 200 - R);
    t.buttonDown(2, 'attack');
    t.reset();
    t.pointerMove(1, 100 + R, 200);
    t.buttonDown(2, 'attack'); // same finger, still on the screen
    let p = t.poll();
    expect(p.move).toEqual({ x: 0, y: 0 });
    expect(p.attack).toBe(false);
    expect(t.stickDown(1, 10, 10)).toBe(false);
    t.pointerUp(1);
    t.pointerUp(2);
    t.buttonDown(2, 'attack');
    expect(t.stickDown(1, 10, 10)).toBe(true);
    p = t.poll();
    expect(p.attack).toBe(true);
  });
});

class FakeTarget implements KeyTarget, BlurTarget {
  private fns: Record<string, ((e: KeyEventLike) => void)[]> = { keydown: [], keyup: [], blur: [] };
  addEventListener(t: string, fn: (e: KeyEventLike) => void) {
    this.fns[t]!.push(fn);
  }
  removeEventListener() {}
  down(code: string, repeat = false) {
    for (const f of this.fns.keydown!) f({ code, repeat });
  }
  up(code: string) {
    for (const f of this.fns.keyup!) f({ code });
  }
  blur() {
    for (const f of this.fns.blur!) f({ code: '' });
  }
}

const kb = (grace = 50) => {
  const t = new FakeTarget();
  const m = new InputManager(2, 50);
  m.add(new KeyboardSource(t, undefined, grace, t));
  return { t, m };
};

describe('KeyboardSource (UI i Menu)', () => {
  // mechaniki v0.5 / QA-M0-002 (PROG / Silnik): the DIAG_GRACE wait moved from the keyboard
  // source to the engine (entities/player-move.ts, tests/qa-m0-002.test.ts).
  it('v0.5: W then D – straight at once, then the diagonal (engine upgrades the step)', () => {
    const { t, m } = kb();
    t.down('KeyW');
    expect(toDir8(m.sample().move)).toEqual({ x: 0, y: -1 });
    t.down('KeyD');
    expect(toDir8(m.sample().move)).toEqual({ x: 1, y: -1 });
  });

  it('v0.5: a single key moves in the first poll', () => {
    const { t, m } = kb();
    t.down('ArrowLeft');
    expect(toDir8(m.sample().move)).toEqual({ x: -1, y: 0 });
  });

  it('a short tap is not lost', () => {
    const { t, m } = kb();
    t.down('KeyS');
    t.up('KeyS');
    expect(toDir8(m.sample().move)).toEqual({ x: 0, y: 1 });
  });

  it('window blur releases held keys; auto-repeat after it does not press them again', () => {
    const { t, m } = kb(0);
    t.down('KeyD');
    t.down('Space');
    expect(m.sample().move.x).toBe(1);
    t.blur();
    t.down('KeyD', true);
    t.down('Space', true);
    m.sample(); // tap buffer from before the blur may still run out
    const a = m.sample();
    expect(a.move).toEqual({ x: 0, y: 0 });
    expect(a.attack).toBe(false);
  });

  it('block(code): the key is dead until keyup, even without the repeat flag', () => {
    const { t, m } = kb(0);
    m.reset(); // as on resume
    const src = (m as unknown as { sources: KeyboardSource[] }).sources[0]!;
    src.block('Space');
    t.down('Space');
    expect(m.sample().attack).toBe(false);
    t.up('Space');
    t.down('Space');
    expect(m.sample().attack).toBe(true);
  });

  it('blur clears blocked keys (keyup may never arrive)', () => {
    const { t, m } = kb(0);
    const src = (m as unknown as { sources: KeyboardSource[] }).sources[0]!;
    src.block('KeyJ');
    t.blur();
    t.down('KeyJ');
    expect(m.sample().attack).toBe(true);
  });

  it('J and Space attack; 1/2/3 and K/L/; are skills; physical codes, not key names', () => {
    const { t, m } = kb(0);
    t.down('KeyJ');
    t.down('Digit2');
    t.down('Semicolon');
    const a = m.sample();
    expect(a.attack && a.skill2 && a.skill3).toBe(true);
    expect(a.skill1).toBe(false);
  });

  it('only Esc and P produce the pause edge (Space, Enter, letters do not)', () => {
    expect([...PAUSE_CODES].sort()).toEqual(['Escape', 'KeyP']);
    for (const code of ['Space', 'Enter', 'KeyA', 'KeyE', 'Digit1']) {
      const { t, m } = kb(0);
      t.down(code);
      expect(m.sample().pause).toBe(false);
    }
    for (const code of ['Escape', 'KeyP']) {
      const { t, m } = kb(0);
      t.down(code);
      expect(m.sample().pause).toBe(true);
    }
  });
});
