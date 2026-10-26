// Network progress (T32–T33): solved Power Lines variants, lift stops, Issue Mk2, sector
// fragments, Lights Above the Base. Pure functions — the input state is never mutated.
// Rules: design/mechaniki-m1.md §2.3 (Issue Mk2), §2.15 (variant order, fragments, Lights).
// Stash size and Med-Patch top-up come from data/inventory-m1.ts (do not duplicate the tables).
import type { GameState } from '../core/game';
import { DEPTHS, GRID_FRAGMENT_PCT, TERMINAL_VARIANTS, type Depth } from '../data/contracts-m1';
import {
  ISSUE_POLE_ITEM_ID,
  ISSUE_SUIT_ITEM_ID,
  STASH_SLOTS_BY_LIGHTS,
  medPatchTopUpFor,
  type LightsLevel,
} from '../data/inventory-m1';

export type { Depth, LightsLevel };

/** Save-section name. Registered by progress/save.ts. */
export const PROGRESS_SECTION = 'progress';

/**
 * Variant order per depth (§2.15): the level shows the first id that is not in `solvedIds`.
 * Same lists as data/contracts-m1.ts `TERMINAL_VARIANTS`.
 */
export const VARIANT_SEQUENCE: Readonly<Record<Depth, readonly string[]>> = TERMINAL_VARIANTS;

/** First solve of one terminal variant (8 × this + the boss = 100). */
export const TERMINAL_FRAGMENT_PCT = GRID_FRAGMENT_PCT;
/** Rail Guardian fragment (`M1_BOSS_DEFEAT`). */
export const BOSS_FRAGMENT_PCT = 20;
/** `TERM08_REWARD_COPPER` (§2.15). */
export const TERM08_COPPER = 10;
export const LIGHTS_I_GATE = 'M1_TERM_08';

const KNOWN_VARIANTS: ReadonlySet<string> = new Set(DEPTHS.flatMap((d) => VARIANT_SEQUENCE[d]));

export function isKnownVariant(id: string): boolean {
  return KNOWN_VARIANTS.has(id);
}

export function depthOfVariant(id: string): Depth | null {
  for (const depth of DEPTHS) {
    if (VARIANT_SEQUENCE[depth].includes(id)) return depth;
  }
  return null;
}

/**
 * Persistent network progress.
 * Fragment percent is derived (`gridPct`); the save stores the solved ids and the boss bit.
 * `riskExplainerSeen` and the prologue flags live here so a v5 save can carry them without
 * new required core fields. A missing flag on an older section loads as false / [].
 */
export interface NetworkProgress {
  /** Variant ids in first-solve order. A variant is stored once. */
  solved: string[];
  /** Lift stops. Stop 1 is always present. Depth 2 / 3 are added by the first solve there. */
  stops: Depth[];
  lights: LightsLevel;
  /** Boss fragment (`noteBossFragment`). Worth `BOSS_FRAGMENT_PCT`. */
  bossFragment: boolean;
  /** `M1_BASE_17` already shown on a lift departure. Set by `announceMk2`. */
  mk2Announced: boolean;
  /** First death with AT RISK already explained (`markSeen`). */
  riskExplainerSeen: boolean;
  /**
   * The next generated depth-1 floor should be the prologue.
   * True on a new game. Absent on a save from before this field → false.
   */
  prologue: boolean;
  /** `generateLevel({ prologue: true })` already ran for this profile. */
  prologueBuilt: boolean;
  /** Hint steps already passed (`T01` …). Hints that are off still record these. */
  tutSeen: string[];
}

export function createNetworkProgress(): NetworkProgress {
  return {
    solved: [],
    stops: [1],
    lights: 0,
    bossFragment: false,
    mk2Announced: false,
    riskExplainerSeen: false,
    prologue: true,
    prologueBuilt: false,
    tutSeen: [],
  };
}

function copyProgress(p: NetworkProgress): NetworkProgress {
  return {
    solved: [...p.solved],
    stops: [...p.stops],
    lights: p.lights,
    bossFragment: p.bossFragment,
    mk2Announced: p.mk2Announced,
    riskExplainerSeen: p.riskExplainerSeen,
    prologue: p.prologue,
    prologueBuilt: p.prologueBuilt,
    tutSeen: [...p.tutSeen],
  };
}

/** Progress stored on the game, or a fresh one when the section is absent (not written back). */
export function getNetworkProgress(state: GameState): NetworkProgress {
  const stored = state.sections[PROGRESS_SECTION] as NetworkProgress | undefined;
  return stored ?? createNetworkProgress();
}

export function setNetworkProgress(state: GameState, progress: NetworkProgress): void {
  state.sections[PROGRESS_SECTION] = progress;
}

/**
 * First unsolved variant for `depth`, or null when that depth is exhausted (retune).
 * `solvedIds` is any iterable of variant ids; order does not matter.
 */
export function nextVariantId(depth: Depth, solvedIds: readonly string[]): string | null {
  const solved = new Set(solvedIds);
  for (const id of VARIANT_SEQUENCE[depth]) {
    if (!solved.has(id)) return id;
  }
  return null;
}

function withStop(stops: readonly Depth[], depth: Depth): Depth[] {
  if (depth === 1 || stops.includes(depth)) return [...stops];
  return [...stops, depth].sort((a, b) => a - b);
}

/**
 * Record a solved variant. Unknown ids and repeat solves return the same object.
 * The first solve at depth 2 unlocks stop 2; the first at depth 3 unlocks stop 3.
 * Depth 1 does not add a stop.
 */
export function solveVariant(progress: NetworkProgress, variantId: string): NetworkProgress {
  if (!isKnownVariant(variantId) || progress.solved.includes(variantId)) return progress;
  const depth = depthOfVariant(variantId);
  const next = copyProgress(progress);
  next.solved.push(variantId);
  if (depth) next.stops = withStop(next.stops, depth);
  return next;
}

/** Rail Guardian fragment. A second call does not add another 20%. */
export function noteBossFragment(progress: NetworkProgress): NetworkProgress {
  if (progress.bossFragment) return progress;
  return { ...copyProgress(progress), bossFragment: true };
}

export interface GridFragment {
  id: string;
  pct: number;
}

/** Lit sector fragments: each known solved variant (10) then the boss (20) if recorded. */
export function fragments(progress: NetworkProgress): GridFragment[] {
  const out: GridFragment[] = [];
  const seen = new Set<string>();
  for (const id of progress.solved) {
    if (!isKnownVariant(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, pct: TERMINAL_FRAGMENT_PCT });
  }
  if (progress.bossFragment) out.push({ id: 'M1_BOSS_DEFEAT', pct: BOSS_FRAGMENT_PCT });
  return out;
}

/** 0–100. Eight terminals × 10 and the boss × 20. */
export function gridPct(progress: NetworkProgress): number {
  const sum = fragments(progress).reduce((n, f) => n + f.pct, 0);
  return Math.min(100, sum);
}

/** Copper granted for solving `variantId` the first time. Only `M1_TERM_08` pays. */
export function copperAward(variantId: string): number {
  return variantId === LIGHTS_I_GATE ? TERM08_COPPER : 0;
}

// ---- Issue Mk2 (§2.3) ---------------------------------------------------------------------------

/** Issue Pole II. Item id is the inventory Issue Pole; the name and the damage are Mk2. */
export interface IssueMk2Pole {
  itemId: typeof ISSUE_POLE_ITEM_ID;
  nameId: 'M1_GEAR_ISSUE_POLE_2_NAME';
  descId: 'M1_GEAR_ISSUE_POLE_2';
  slot: 'weapon';
  dmgMin: 10;
  dmgMax: 15;
  /** Attacks per second (§2.3, same cadence as Mk1). */
  attacksPerSecond: 2.5;
}

/** Issue Suit II. Item id is the inventory Issue Suit; armor is 6. */
export interface IssueMk2Suit {
  itemId: typeof ISSUE_SUIT_ITEM_ID;
  nameId: 'M1_GEAR_ISSUE_SUIT_2_NAME';
  descId: 'M1_GEAR_ISSUE_SUIT_2';
  slot: 'armor';
  armor: 6;
}

/** Items the host adds when stop 2 is unlocked. This module does not touch the inventory. */
export interface IssueMk2Grant {
  pole: IssueMk2Pole;
  suit: IssueMk2Suit;
}

const ISSUE_MK2: IssueMk2Grant = {
  pole: Object.freeze({
    itemId: ISSUE_POLE_ITEM_ID,
    nameId: 'M1_GEAR_ISSUE_POLE_2_NAME',
    descId: 'M1_GEAR_ISSUE_POLE_2',
    slot: 'weapon',
    dmgMin: 10,
    dmgMax: 15,
    attacksPerSecond: 2.5,
  }),
  suit: Object.freeze({
    itemId: ISSUE_SUIT_ITEM_ID,
    nameId: 'M1_GEAR_ISSUE_SUIT_2_NAME',
    descId: 'M1_GEAR_ISSUE_SUIT_2',
    slot: 'armor',
    armor: 6,
  }),
};

/**
 * Issue Pole II and Issue Suit II, once stop 2 is unlocked. Null before that.
 * The host adds the items; call this again after a load — the description does not change.
 */
export function issueMk2Grant(progress: NetworkProgress): IssueMk2Grant | null {
  return progress.stops.includes(2) ? ISSUE_MK2 : null;
}

/** Text id for the first lift departure after the Mk2 grant, or null. */
export function mk2Announcement(progress: NetworkProgress): 'M1_BASE_17' | null {
  if (!progress.stops.includes(2) || progress.mk2Announced) return null;
  return 'M1_BASE_17';
}

/** Host shows `M1_BASE_17` and then calls this. No effect until stop 2 exists. */
export function announceMk2(progress: NetworkProgress): NetworkProgress {
  if (!progress.stops.includes(2) || progress.mk2Announced) return progress;
  return { ...copyProgress(progress), mk2Announced: true };
}

// ---- Lights Above the Base (§2.15) --------------------------------------------------------------

export interface LightsCost {
  credits: number;
  copper: number;
}

/** `BASE_UPGRADE_COST` / `BASE_UPGRADE2_COST` / `BASE_UPGRADE3_COST`. */
export const LIGHTS_COSTS: Readonly<Record<1 | 2 | 3, LightsCost>> = {
  1: { credits: 150, copper: 10 },
  2: { credits: 600, copper: 25 },
  3: { credits: 1500, copper: 40 },
};

export interface LightsEffects {
  level: LightsLevel;
  /** `STASH_SLOTS_BY_LIGHTS`. */
  stashSlots: number;
  /** `ISSUE_MEDPATCH_TOPUP`: 2, then 3 from Lights I. */
  patchTopUp: number;
  /** Exchange shelf size: 3, then 4 from Lights II. */
  shelf: number;
  /** First shelf slot, rarity 3, in percent: 10, then 20 at Lights III. */
  shelfR3Pct: number;
}

const SHELF_BY_LIGHTS: Readonly<Record<LightsLevel, number>> = { 0: 3, 1: 3, 2: 4, 3: 4 };
const SHELF_R3_PCT: Readonly<Record<LightsLevel, number>> = { 0: 10, 1: 10, 2: 10, 3: 20 };

export function lightsEffects(level: LightsLevel): LightsEffects {
  return {
    level,
    stashSlots: STASH_SLOTS_BY_LIGHTS[level],
    patchTopUp: medPatchTopUpFor(level),
    shelf: SHELF_BY_LIGHTS[level],
    shelfR3Pct: SHELF_R3_PCT[level],
  };
}

/**
 * Base-map cable segments that Lights paints yellow.
 * Names follow level-m1.md §4 (row 1, locker wall) and styl-ascii.md §12
 * (hall sides at columns 0 and 28, rows 1–5; bottom wall, row 6).
 * Each level adds segments; a higher level includes the earlier ones.
 */
export const CABLE_SEGMENT_IDS = [
  'row1',
  'lockerWall',
  'hallSideCol0',
  'hallSideCol28',
  'hallBottomRow6',
] as const;
export type CableSegmentId = (typeof CABLE_SEGMENT_IDS)[number];

const CABLES_BY_LIGHTS: Readonly<Record<LightsLevel, readonly CableSegmentId[]>> = {
  0: [],
  1: ['row1', 'lockerWall'],
  2: ['row1', 'lockerWall', 'hallSideCol0', 'hallSideCol28'],
  3: ['row1', 'lockerWall', 'hallSideCol0', 'hallSideCol28', 'hallBottomRow6'],
};

export function lightsCableSegments(level: LightsLevel): readonly CableSegmentId[] {
  return CABLES_BY_LIGHTS[level];
}

export interface CreditWallet {
  credits: number;
  copper: number;
}

export type LightsDenyReason = 'gate' | 'credits' | 'copper' | 'max';

export type LightsPurchase =
  | { ok: true; progress: NetworkProgress; cost: LightsCost; effects: LightsEffects }
  | { ok: false; reason: LightsDenyReason; cost: LightsCost | null };

/**
 * Buy the next Lights level. Lights I requires `M1_TERM_08` and 150 kr + 10 Copper.
 * Later levels require the previous level and their own cost. The wallet is not changed;
 * the host subtracts `cost` when `ok` is true.
 */
export function buyLights(progress: NetworkProgress, wallet: CreditWallet): LightsPurchase {
  if (progress.lights >= 3) return { ok: false, reason: 'max', cost: null };
  const next = (progress.lights + 1) as 1 | 2 | 3;
  const cost = LIGHTS_COSTS[next];
  if (next === 1 && !progress.solved.includes(LIGHTS_I_GATE)) {
    return { ok: false, reason: 'gate', cost };
  }
  if (wallet.credits < cost.credits) return { ok: false, reason: 'credits', cost };
  if (wallet.copper < cost.copper) return { ok: false, reason: 'copper', cost };
  const level = next as LightsLevel;
  return {
    ok: true,
    progress: { ...copyProgress(progress), lights: level },
    cost,
    effects: lightsEffects(level),
  };
}
