/** Seeded PRNG (mulberry32). Deterministic, 32-bit state, serialisable. */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
  }

  get state(): number {
    return this.s;
  }

  set state(v: number) {
    this.s = v >>> 0;
  }

  /** Serialisable 32-bit state. */
  getState(): number {
    return this.s;
  }

  setState(v: number): void {
    this.s = v >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] (inclusive). */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Rng.pick: empty array');
    return items[Math.floor(this.next() * items.length)] as T;
  }
}

/** Known stream names (any string works; these are the agreed ones). */
export type StreamName = 'combat' | 'world' | 'loot' | 'contracts' | (string & {});

/** FNV-1a 32-bit hash of a string (UTF-16 code units). */
export function hashName(name: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < name.length; i++) {
    h ^= name.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** murmur3 finaliser – spreads seed^hash so nearby seeds give unrelated streams. */
function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Initial state of a named stream for a game seed (pure, deterministic). */
export function streamSeed(seed: number, name: string): number {
  return fmix32((hashName(name) ^ (seed >>> 0)) >>> 0);
}

/** Key of the legacy base generator (`state.rng.next()`) in serialised rng state. */
export const DEFAULT_STREAM_KEY = 'default';

/**
 * Game RNG: the base generator (legacy `state.rng.next()/int()/pick()`) plus independent
 * named streams `stream('combat' | 'world' | 'loot' | 'contracts' | ...)`, each derived
 * deterministically from the game seed. Drawing from one stream never changes another.
 *
 * NOTE: the base generator is kept only for compatibility – new code should use
 * `stream(name)`; Gameplay: replace with `stream('combat')`.
 */
export class GameRng extends Rng {
  private readonly streams = new Map<string, Rng>();

  constructor(readonly seed: number) {
    super(seed);
  }

  /** Named stream (created lazily from the seed; same object on every call). */
  stream(name: StreamName): Rng {
    let r = this.streams.get(name);
    if (!r) {
      r = new Rng(streamSeed(this.seed, name));
      this.streams.set(name, r);
    }
    return r;
  }

  /** All generator states for saving: { default: base, <stream>: state, ... }. */
  getStates(): Record<string, number> {
    const out: Record<string, number> = { [DEFAULT_STREAM_KEY]: this.getState() };
    for (const [k, r] of this.streams) out[k] = r.getState();
    return out;
  }

  /** Restore states saved by getStates(). Streams not listed start fresh from the seed. */
  setStates(states: Readonly<Record<string, number>>): void {
    this.streams.clear();
    for (const [k, v] of Object.entries(states)) {
      if (k === DEFAULT_STREAM_KEY) this.setState(v);
      else this.stream(k).setState(v);
    }
  }
}

/** rngState of a brand-new game (used by the v2 → v3 save migration). */
export function freshRngStates(seed: number): Record<string, number> {
  return { [DEFAULT_STREAM_KEY]: seed >>> 0 };
}
