// Level generator constants from docs/design/level-m1.md §2–§3 and the Python prototype
// docs/design/tools/levelgen_m1.py. Names match the prototype so the attempt loop stays aligned.

import type { Depth } from '../../data/contracts-m1';

export const GENERATOR_VERSION = 1 as const;

/** Failed attempts before the frozen emergency map (level-m1.md §2.4). */
export const LEVEL_GEN_MAX_ATTEMPTS = 20;

export interface DepthParams {
  name: string;
  W: number;
  H: number;
  /** BFS entry → shaft, inclusive. */
  shaft: readonly [number, number];
  /** BFS entry → descent / arena gate, inclusive. */
  down: readonly [number, number];
  enemies: readonly [number, number];
  chests: number;
  burrows: number;
  notes: readonly [number, number];
  credits: readonly [number, number];
}

export const DEPTH_PARAMS: Record<Depth, DepthParams> = {
  1: {
    name: 'Outskirts',
    W: 64,
    H: 40,
    shaft: [25, 40],
    down: [40, 60],
    enemies: [8, 10],
    chests: 3,
    burrows: 2,
    notes: [2, 2],
    credits: [1, 1],
  },
  2: {
    name: 'Solar Fields',
    W: 72,
    H: 44,
    shaft: [30, 50],
    down: [45, 65],
    enemies: [12, 14],
    chests: 4,
    burrows: 3,
    notes: [1, 2],
    credits: [1, 2],
  },
  3: {
    name: 'Rail Depot',
    W: 80,
    H: 48,
    shaft: [35, 55],
    down: [50, 70],
    enemies: [14, 16],
    chests: 4,
    burrows: 3,
    notes: [2, 2],
    credits: [1, 2],
  },
};

/** Hard acceptance band (§2.4). The tune step aims at the tighter band below. */
export const PASSABLE_PCT: readonly [number, number] = [0.4, 0.5];
export const PASSABLE_TUNE_TARGET: readonly [number, number] = [0.41, 0.49];
export const PASSABLE_TUNE_MAX_RUN = 12;

export const STAIRS_GATE_MIN_DIST_FROM_SHAFT = 20;
export const NO_ENEMY_RADIUS_ENTRY_SHAFT = 10;
export const TERMINAL_DIST_FROM_SHAFT: readonly [number, number] = [25, 40];
export const TERMINAL_NO_ENEMY_RADIUS = 8;
export const BURROW_MIN_SPACING = 30;
export const BURROW_MIN_DIST_ENTRY_SHAFT = 10;
export const CLEARPATH_ENEMY_DIST: readonly [number, number] = [12, 20];
export const DATACORE_DIST: readonly [number, number] = [30, 45];
export const CHEST_MIN_SPACING = 12;
export const CHEST_MIN_DIST_ENTRY = 10;
export const GROUP_MIN_SPACING = 10;
export const NOTE_MIN_SPACING = 10;
export const TERMINAL_MIN_CHEB = 5;
export const ENTRY_LOS_SAFE = 8;
export const SHAFT_MIN_PASSABLE_NEIGHBORS = 2;
export const SHAFT_PREF_PASSABLE_NEIGHBORS = 3;

export const PROLOGUE_TERMINAL_DIST_FROM_ENTRY: readonly [number, number] = [45, 60];
export const PROLOGUE_SCRAPPER_DIST: readonly [number, number] = [12, 18];
export const PROLOGUE_GUARD_DIST: readonly [number, number] = [20, 30];
export const PROLOGUE_GUARD_ROOM_MIN = 5;
export const PROLOGUE_PAIR_DIST: readonly [number, number] = [30, 40];
export const PROLOGUE_NEAR_ROUTE = 2;
export const PROLOGUE_GUARD_ROOM_FROM_ROUTE = 8;
export const PROLOGUE_TERMINAL_TRIES = 15;
export const PROLOGUE_HOUSE_MIN: readonly [number, number] = [5, 4];
export const PROLOGUE_ROUTE_CLEAR = 6;

/** M2 rule. Off in M1: coverage is not a reason to reject a level. */
export const M2_BURROW_COVERAGE_CHECK = false;
export const SCRAPPER_BURROW_MIN_DIST = 20;

/** Clear the Path groups by depth (balans v1.2 / level-m1.md §3.5). */
export const CLEARPATH_GROUPS: Record<Depth, readonly [string, string]> = {
  1: ['sss', 'ddh'],
  2: ['sss', 'dht'],
  3: ['sss', 'ddh'],
};

/** Data Core guard composition (one group). */
export const DATACORE_GUARDS = 'ddh';

/**
 * Balance group template. `enemyGroups` adjusts ±1 so the letters sum to the rolled count.
 * g1: the leading `s` run becomes 2–4. g2: 12 → `sss`, 14 → `sss` + `ss`. g3: 14 → `sh`, 16 → `sh`.
 */
export const ENEMY_TEMPLATE: Record<Depth, readonly string[]> = {
  1: ['sss', 'dd', 'dd', 'h', 'h'],
  2: ['ssss', 'dd', 'dd', 'h', 'ht', 'ht'],
  3: ['ssh', 'sst', 'ddh', 'ddt', 'ht', 'h'],
};

/** Remainder of the prologue pool after the scripted inserts (s, h, ss). Keyed by total count. */
export const PROLOGUE_REST: Record<number, readonly string[]> = {
  8: ['dd', 'dd'],
  9: ['dd', 'dd', 'h'],
  10: ['dd', 'dd', 'sh'],
};

/** Unread-first note ids (level-m1.md §3.3). */
export const NOTE_POOL: Record<Depth, readonly string[]> = {
  1: ['M1_NOTE_01', 'M1_NOTE_02', 'M1_NOTE_03', 'M1_NOTE_04'],
  2: ['M1_NOTE_05', 'M1_NOTE_06'],
  3: ['M1_NOTE_07', 'M1_NOTE_08', 'M1_NOTE_09'],
};

export const BODY46_TEXT_ID = 'M1_NOTE_46';

export function inRange(r: readonly [number, number], v: number): boolean {
  return v >= r[0] && v <= r[1];
}
