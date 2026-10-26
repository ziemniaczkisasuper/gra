// Emergency map returned after every attempt throws GenFail.
// The prototype reports {"fail", "attempt": max_attempts} and does not load a map.
// fixed_maps_m1.py has only the base and the arena, so the depth maps are the frozen
// seed-47 layouts in fallback-data.ts. They already satisfy §2.4.

import type { Depth } from '../../data/contracts-m1';
import { terminalChoice } from './content';
import { describeEnemy, isEnemyGlyph } from './enemy-spawn';
import { FALLBACK_SNAPSHOTS } from './fallback-data';
import { GENERATOR_VERSION, NOTE_POOL } from './params';
import { levelStreamSeed } from './rng-util';
import type { Cell, EnemySpawn, LevelResult } from './types';

const THEME = { 1: 'outskirts', 2: 'solar', 3: 'depot' } as const;

function cell(p: readonly [number, number]): Cell {
  return { x: p[0], y: p[1] };
}

function chebyshev(a: Cell, b: Cell): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * Playable level for `depth`. `attempt` is the number of attempts that were exhausted
 * (0 when the caller asked for no attempts). `expSeed` is the caller's seed, not the
 * seed the snapshot was baked from.
 */
export function fallbackLevel(
  depth: Depth,
  expSeed = 0,
  attempt = 0,
  reason = 'exhausted',
): LevelResult {
  const snap = FALLBACK_SNAPSHOTS[depth - 1];
  if (!snap || snap.depth !== depth) throw new Error(`levelgen: no fallback for depth ${depth}`);

  const enemies: EnemySpawn[] = [];
  let group = -1;
  let anchor: Cell = { x: 0, y: 0 };
  for (const e of snap.enemies) {
    if (!isEnemyGlyph(e.glyph)) throw new Error(`levelgen: bad fallback glyph ${e.glyph}`);
    const here = { x: e.x, y: e.y };
    // Members of one place_group sit within Chebyshev 2 of the anchor. The snapshot lists
    // them in placement order, so a jump farther than that starts the next group.
    if (group < 0 || chebyshev(here, anchor) > 2) {
      group += 1;
      anchor = here;
    }
    enemies.push(describeEnemy(e.glyph, e.x, e.y, group, depth, null, false, null));
  }

  const term = terminalChoice(depth, [], false);
  const noteIds = NOTE_POOL[depth];
  return {
    generatorVersion: GENERATOR_VERSION,
    expSeed: expSeed >>> 0,
    depth,
    attempt,
    fallback: true,
    fallbackReason: reason,
    theme: THEME[depth],
    width: snap.rows[0]?.length ?? 0,
    height: snap.rows.length,
    rows: snap.rows,
    passablePct: snap.passablePct,
    entry: cell(snap.entry),
    shaft: cell(snap.shaft),
    down: cell(snap.down),
    downGlyph: depth < 3 ? '>' : 'G',
    terminal: cell(snap.terminal),
    terminalVariant: term.variant,
    terminalRetune: term.retune,
    burrows: snap.burrows.map((b) => ({ wall: cell(b.wall), mouth: cell(b.mouth) })),
    enemies,
    chests: snap.chests.map(cell),
    notes: snap.notes.map((p, i) => ({ x: p[0], y: p[1], textId: noteIds[i] ?? noteIds[0]! })),
    credits: snap.credits.map(cell),
    body46: snap.body46 ? cell(snap.body46) : null,
    contractObjects: [],
    lootSeed: levelStreamSeed(expSeed, depth, attempt, 'loot'),
    distances: { ...snap.distances },
    loop: snap.loop,
    shaftNeighbors: snap.shaftNeighbors,
    prologue: null,
  };
}
