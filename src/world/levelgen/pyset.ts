// CPython 3.12 set iteration for pairs of small ints.
//
// Depth 1 scatters street rubble with `for (x, y) in street` where `street` is a set built in
// row-major order (levelgen_m1.py, gen_outskirts). Set membership does not care about order;
// that one loop does, because each '.' cell draws `chance(0.04)`. CPython 3.12 does not walk a
// set in insertion order: it probes a power-of-two table (Objects/setobject.c, LINEAR_PROBES 9,
// PERTURB_SHIFT 5, PySet_MINSIZE 8) keyed by the tuple hash (Objects/tupleobject.c, xxHash primes).
// Int hashes are the integers themselves. PYTHONHASHSEED does not affect them.

import type { Cell } from './types';

const LINEAR_PROBES = 9;
const MIN_SIZE = 8;
const MASK64 = (1n << 64n) - 1n;
const P1 = 11400714785074694791n;
const P2 = 14029467366897019727n;
const P5 = 2870177450012600261n;

/** Unsigned 64-bit CPython hash of `(x, y)`. The set probe uses this bit pattern. */
export function cpythonTupleHash(x: number, y: number): bigint {
  const rotl31 = (v: bigint) => ((v << 31n) | (v >> 33n)) & MASK64;
  let acc = P5;
  for (const n of [x, y]) {
    // Small-int hash. -1 is stored as -2 so it is not the error sentinel.
    const lane = (n === -1 ? -2n : BigInt(n)) & MASK64;
    acc = (acc + lane * P2) & MASK64;
    acc = rotl31(acc);
    acc = (acc * P1) & MASK64;
  }
  acc = (acc + (2n ^ (P5 ^ 3527539n))) & MASK64;
  // The all-ones hash is reserved; CPython returns this constant instead.
  if (acc === MASK64) return 1546275796n;
  return acc;
}

interface Entry {
  x: number;
  y: number;
  hash: bigint;
}

/**
 * Insertion-only set of cells. `order()` is the order CPython 3.12 yields for a set filled
 * with `add` in the same sequence (no deletions).
 */
export class CPythonCellSet {
  private mask = MIN_SIZE - 1;
  private fill = 0;
  private used = 0;
  private table: (Entry | null)[] = Array.from({ length: MIN_SIZE }, () => null);

  add(x: number, y: number): void {
    const hash = cpythonTupleHash(x, y);
    const mask = this.mask;
    let i = Number(hash & BigInt(mask));
    let perturb = hash;
    for (;;) {
      let idx = i;
      // do { check table[idx]; idx++; } while (probes--); probes starts at LINEAR_PROBES or 0.
      let probes = i + LINEAR_PROBES <= mask ? LINEAR_PROBES : 0;
      for (;;) {
        const entry = this.table[idx];
        if (entry === null) {
          this.table[idx] = { x, y, hash };
          this.fill++;
          this.used++;
          if (this.fill * 5 < mask * 3) return;
          this.resize();
          return;
        }
        if (entry.hash === hash && entry.x === x && entry.y === y) return;
        idx++;
        const cond = probes;
        probes--;
        if (cond === 0) break;
      }
      perturb >>= 5n;
      i = Number((BigInt(i) * 5n + 1n + perturb) & BigInt(mask));
    }
  }

  /** Table order, index 0 .. mask, skipping empty slots. Same as `set_next`. */
  order(): Cell[] {
    const out: Cell[] = [];
    for (let i = 0; i <= this.mask; i++) {
      const e = this.table[i];
      if (e) out.push({ x: e.x, y: e.y });
    }
    return out;
  }

  private resize(): void {
    const minused = this.used > 50000 ? this.used * 2 : this.used * 4;
    let newSize = MIN_SIZE;
    while (newSize <= minused) newSize <<= 1;
    const old = this.table;
    const oldMask = this.mask;
    this.table = Array.from({ length: newSize }, () => null);
    this.mask = newSize - 1;
    for (let i = 0; i <= oldMask; i++) {
      const e = old[i];
      if (e) this.insertClean(e);
    }
  }

  /** `set_insert_clean`: the key is known to be absent. `i` is not bumped by the linear run. */
  private insertClean(e: Entry): void {
    const mask = this.mask;
    let perturb = e.hash;
    let i = Number(e.hash & BigInt(mask));
    for (;;) {
      let idx = i;
      if (this.table[idx] === null) {
        this.table[idx] = e;
        return;
      }
      if (i + LINEAR_PROBES <= mask) {
        for (let j = 0; j < LINEAR_PROBES; j++) {
          idx++;
          if (this.table[idx] === null) {
            this.table[idx] = e;
            return;
          }
        }
      }
      perturb >>= 5n;
      i = Number((BigInt(i) * 5n + 1n + perturb) & BigInt(mask));
    }
  }
}

/** Iteration order of a set built by inserting `cells` from first to last. */
export function cpythonSetOrder(cells: readonly Cell[]): Cell[] {
  const set = new CPythonCellSet();
  for (const c of cells) set.add(c.x, c.y);
  return set.order();
}
