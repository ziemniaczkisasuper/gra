// Shortest tap sequence for a Power Lines puzzle.
// validate.py Puzzle.solve: BFS over switch masks, one tap = one bit flip.
// §4–§7a define the flow rules, not a separate search. The first WIN dequeued is a
// minimum-length solution; switch index 0 is expanded first, so ties match the reference.
// A retune instance still wins as WIN (WIN_RETUNE is only the result text id).

import { simulate, startMask, type PuzzleState } from './rules';
import type { Cell } from './types';

export interface PowerLinesSolution {
  /** Winning mask. Bit i means `puzzle.switches[i]` is ON. */
  mask: number;
  /** Taps from `start` to `mask`, minimum count. Empty when `start` is already a win. */
  taps: Cell[];
}

/**
 * BFS from `start` (the authored start mask when omitted).
 * Returns null when no mask simulates to WIN.
 */
export function solve(puzzle: PuzzleState, start = startMask(puzzle)): PowerLinesSolution | null {
  const n = puzzle.switches.length;
  if (n > 30) throw new Error(`Power Lines solver supports at most 30 switches, got ${n}`);
  const prev = new Map<number, number | null>([[start, null]]);
  const queue = [start];
  let found: number | null = null;
  for (let qi = 0; qi < queue.length; qi++) {
    const mask = queue[qi];
    if (mask === undefined) continue;
    if (simulate(puzzle, mask).status === 'WIN') {
      found = mask;
      break;
    }
    for (let i = 0; i < n; i++) {
      const next = mask ^ (1 << i);
      if (!prev.has(next)) {
        prev.set(next, mask);
        queue.push(next);
      }
    }
  }
  if (found === null) return null;

  const taps: Cell[] = [];
  let mask = found;
  let previous = prev.get(mask);
  while (previous !== undefined && previous !== null) {
    const diff = mask ^ previous;
    let bit = diff >>> 0;
    let index = 0;
    while ((bit & 1) === 0) {
      bit >>>= 1;
      index += 1;
    }
    const sw = puzzle.switches[index];
    if (!sw) throw new Error(`solver tap bit ${index} is not a switch`);
    taps.push([sw[0], sw[1]]);
    mask = previous;
    previous = prev.get(mask);
  }
  taps.reverse();
  return { mask: found, taps };
}
