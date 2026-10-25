import { describe, expect, it } from 'vitest';
import { freshRngStates, GameRng, hashName, Rng, streamSeed } from '../src/core/rng';

describe('Rng (mulberry32)', () => {
  it('is deterministic for a seed', () => {
    const a = new Rng(12345);
    const b = new Rng(12345);
    const sa = Array.from({ length: 100 }, () => a.next());
    const sb = Array.from({ length: 100 }, () => b.next());
    expect(sa).toEqual(sb);
  });

  it('matches the reference mulberry32 sequence', () => {
    // Reference implementation (public domain, Tommy Ettinger).
    function ref(a: number) {
      return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }
    const r = new Rng(42);
    const f = ref(42);
    for (let i = 0; i < 1000; i++) expect(r.next()).toBe(f());
  });

  it('different seeds differ; values in [0,1); int inclusive', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
    const r = new Rng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const v = r.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      seen.add(r.int(8, 12));
    }
    expect([...seen].sort()).toEqual([10, 11, 12, 8, 9].sort());
  });

  it('state can be saved and restored', () => {
    const r = new Rng(99);
    r.next();
    const s = r.state;
    const x = r.next();
    r.state = s;
    expect(r.next()).toBe(x);
  });
});

describe('GameRng named streams', () => {
  it('streams are independent: drawing from one does not change another', () => {
    const a = new GameRng(1234);
    const b = new GameRng(1234);
    for (let i = 0; i < 500; i++) a.stream('combat').next();
    a.next(); // base generator too
    expect(a.stream('loot').next()).toBe(b.stream('loot').next());
    expect(a.stream('world').getState()).toBe(b.stream('world').getState());
  });

  it('deterministic per (seed, name); different names / seeds differ', () => {
    const seq = (seed: number, name: string) => {
      const r = new GameRng(seed).stream(name);
      return Array.from({ length: 20 }, () => r.next());
    };
    expect(seq(7, 'combat')).toEqual(seq(7, 'combat'));
    expect(seq(7, 'combat')).not.toEqual(seq(7, 'loot'));
    expect(seq(7, 'combat')).not.toEqual(seq(8, 'combat'));
    expect(streamSeed(7, 'combat')).toBe(streamSeed(7, 'combat'));
    expect(
      new Set(['combat', 'world', 'loot', 'contracts'].map((n) => streamSeed(7, n))).size,
    ).toBe(4);
    expect(hashName('combat')).toBe(hashName('combat'));
  });

  it('the same stream object is returned; base generator keeps legacy behaviour', () => {
    const g = new GameRng(42);
    expect(g.stream('combat')).toBe(g.stream('combat'));
    const legacy = new Rng(42);
    expect(g.next()).toBe(legacy.next());
  });

  it('getState/setState round-trip per stream and for all streams', () => {
    const g = new GameRng(99);
    g.stream('combat').next();
    g.stream('contracts').int(1, 100);
    g.next();
    const states = JSON.parse(JSON.stringify(g.getStates())) as Record<string, number>;
    expect(Object.keys(states).sort()).toEqual(['combat', 'contracts', 'default']);
    const expected = [
      g.next(),
      g.stream('combat').next(),
      g.stream('contracts').next(),
      g.stream('loot').next(),
    ];
    const h = new GameRng(99);
    h.setStates(states);
    expect([
      h.next(),
      h.stream('combat').next(),
      h.stream('contracts').next(),
      h.stream('loot').next(),
    ]).toEqual(expected);
    const r = h.stream('world');
    const s = r.getState();
    const x = r.next();
    r.setState(s);
    expect(r.next()).toBe(x);
    expect(freshRngStates(99)).toEqual({ default: 99 });
  });
});
