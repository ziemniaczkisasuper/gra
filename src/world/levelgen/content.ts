// Terminal variant and note ids. Neither draw changes the map: variants use no RNG, and note
// ids are chosen after every prototype draw (an extra objects-stream shuffle only when the
// unread pool cannot fill the slots).

import { TERMINAL_VARIANTS, type Depth } from '../../data/contracts-m1';
import type { Rng } from '../../core/rng';
import { NOTE_POOL } from './params';
import { shuffle } from './rng-util';

export function terminalChoice(
  depth: Depth,
  solved: readonly string[],
  prologue: boolean,
): { variant: string | null; retune: boolean } {
  if (prologue) return { variant: 'M1_TERM_04', retune: false };
  for (const variant of TERMINAL_VARIANTS[depth]) {
    if (!solved.includes(variant)) return { variant, retune: false };
  }
  // Every variant of this depth is solved: the level is a retune. The puzzle template
  // itself is chosen later from the level seed (not rolled here).
  return { variant: null, retune: true };
}

/**
 * Unread notes of this depth first, in pool order. When that runs out, one Fisher–Yates of the
 * whole pool (objects stream) and then that order, repeating only if more notes were placed
 * than the pool holds.
 */
export function assignNoteIds(
  depth: Depth,
  count: number,
  read: readonly string[],
  rng: Rng,
): string[] {
  const pool = NOTE_POOL[depth];
  const seen = new Set(read);
  const ids: string[] = [];
  for (const id of pool) {
    if (seen.has(id)) continue;
    ids.push(id);
    if (ids.length === count) return ids;
  }
  const bag = shuffle(rng, [...pool]);
  for (let i = 0; ids.length < count; i++) ids.push(bag[i % bag.length]!);
  return ids;
}
