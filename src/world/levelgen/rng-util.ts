// Draws that the Python prototype adds on top of mulberry32. The core generator is `Rng`
// from src/core/rng.ts; these helpers only fix the call pattern so the sequence matches.

import { Rng, streamSeed } from '../../core/rng';

/** `streamSeed(expSeed, "lvl:s1:d{depth}:a{attempt}:{stream}")` (level-m1.md §2.1). */
export function levelStreamSeed(
  expSeed: number,
  depth: number,
  attempt: number,
  stream: 'layout' | 'objects' | 'enemies' | 'contracts' | 'loot',
): number {
  return streamSeed(expSeed >>> 0, `lvl:s1:d${depth}:a${attempt}:${stream}`);
}

export function levelRng(
  expSeed: number,
  depth: number,
  attempt: number,
  stream: 'layout' | 'objects' | 'enemies' | 'contracts' | 'loot',
): Rng {
  return new Rng(levelStreamSeed(expSeed, depth, attempt, stream));
}

/** Python `Rng.chance`: one `next()` compared with `<`. */
export function chance(rng: Rng, p: number): boolean {
  return rng.next() < p;
}

/**
 * Inclusive integer. Matches `Rng.int` when `hi >= lo`.
 * Python `int()` truncates toward 0, so a negative span (a few house-size rolls) must not
 * use `Math.floor`.
 */
export function pyInt(rng: Rng, lo: number, hi: number): number {
  if (hi >= lo) return rng.int(lo, hi);
  const n = rng.next() * (hi - lo + 1);
  return lo + Math.ceil(n);
}

/** Fisher–Yates from the end, same index draws as the prototype (`int(0, i)`). */
export function shuffle<T>(rng: Rng, a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    const t = a[i]!;
    a[i] = a[j]!;
    a[j] = t;
  }
  return a;
}
