// Loot tables for M1. Numbers only.
// Rarity, affixes, base stats, sell prices: design/balans-m1.md §3 and §4.
// Drop rates, chest contents, the 6.3 / 8.6 / 9.0 model: design/mechaniki-m1.md §2.12
// (enemy counts and chest counts also in §2.11). Credit piles: level-m1.md §3.2.
import type { ItemSlot, Rarity } from './style';
import type { AffixId, LootDepth } from '../loot/types';

/** DEPTH_RARITY_ODDS: Salvaged / Tuned / Grid-Grade, whole percents, sum 100. */
export const DEPTH_RARITY_ODDS: Readonly<Record<LootDepth, readonly [number, number, number]>> = {
  1: [80, 18, 2],
  2: [65, 30, 5],
  3: [50, 38, 12],
};

/** ENEMY_ITEM_DROP = 0.20. Rolled as an integer percent so the bucket is exact. */
export const ENEMY_ITEM_DROP_PERCENT = 20;

/** Scrap pieces from every lootable enemy (inclusive). Separate from the gear roll. */
export const SCRAP_PER_ENEMY: readonly [number, number] = [2, 4];

/** Gear pieces in one chest (inclusive). Med-Patch and Copper are extra rolls. */
export const CHEST_GEAR_COUNT: readonly [number, number] = [1, 2];

/** Chance a chest also contains one Med-Patch. ~0.9 / 1.2 / 1.2 per level. */
export const CHEST_MEDPATCH_PERCENT = 30;

/** Copper pieces in a chest at depth >= COPPER_MIN_DEPTH (inclusive). ~8 per level. */
export const CHEST_COPPER_COUNT: readonly [number, number] = [1, 3];
export const COPPER_MIN_DEPTH: LootDepth = 2;

/**
 * Pool size the §2.12 averages use (uniform inclusive). Means 9 / 13 / 15.
 * Contract groups and the boss sit outside this range.
 */
export const ENEMIES_PER_LEVEL: Readonly<Record<LootDepth, readonly [number, number]>> = {
  1: [8, 10],
  2: [12, 14],
  3: [14, 16],
};

/** CHESTS_PER_LEVEL. Fixed, not rolled. */
export const CHESTS_PER_LEVEL: Readonly<Record<LootDepth, number>> = { 1: 3, 2: 4, 3: 4 };

/** CREDIT_PILES_PER_LEVEL and the 5–20 kr pile (mechaniki §2.12, level-m1 §3.2). */
export const CREDIT_PILES_PER_LEVEL: Readonly<Record<LootDepth, readonly [number, number]>> = {
  1: [1, 1],
  2: [1, 2],
  3: [1, 2],
};
export const CREDIT_PILE_KR: readonly [number, number] = [5, 20];

/** ITEM_SLOT_WEIGHTS: weapon / armor / module / tool, equal. */
export const ITEM_SLOT_WEIGHTS: Readonly<Record<ItemSlot, number>> = {
  weapon: 1,
  armor: 1,
  module: 1,
  tool: 1,
};

/**
 * Melee vs ranged inside the weapon slot. Balans §3 lists both ranges and does
 * not give a split, so each kind has weight 1 until Balance sets one.
 */
export const WEAPON_KIND_WEIGHTS: Readonly<Record<'melee' | 'ranged', number>> = {
  melee: 1,
  ranged: 1,
};

/** Order of the slot ticket. Equal weights, so this only affects which seed maps where. */
export const SLOT_ROLL_ORDER: readonly ItemSlot[] = ['weapon', 'armor', 'module', 'tool'];

/** SELL_ITEM bases (rarity 1 / 2 / 3). Price = base × (1 + 0.5 × (ilvl − 1)). */
export const SELL_ITEM_BASE: Readonly<Record<Rarity, number>> = { 1: 10, 2: 40, 3: 150 };

export const SELL_SCRAP = 2;
export const SELL_COPPER = 5;
/** MEDPATCH_SELLABLE = false. */
export const MEDPATCH_SELL_PRICE = 0;

/** WEAPON_MELEE_DMG by ilvl (inclusive). */
export const WEAPON_MELEE_DMG: Readonly<Record<LootDepth, readonly [number, number]>> = {
  1: [8, 12],
  2: [10, 15],
  3: [13, 19],
};

/** WEAPON_RANGED_DMG by ilvl (inclusive). Balans §3.1, not the older 8–12 working note. */
export const WEAPON_RANGED_DMG: Readonly<Record<LootDepth, readonly [number, number]>> = {
  1: [8, 11],
  2: [10, 14],
  3: [13, 18],
};

/** ARMOR_BASE by ilvl (inclusive). */
export const ARMOR_BASE: Readonly<Record<LootDepth, readonly [number, number]>> = {
  1: [6, 10],
  2: [13, 19],
  3: [20, 28],
};

/** MODULE_HP_BASE. Fixed per ilvl, so the roll does not spend RNG. */
export const MODULE_HP_BASE: Readonly<Record<LootDepth, number>> = { 1: 5, 2: 10, 3: 15 };

/** TOOL_SALVAGE_PCT. Fixed per ilvl. The bonus applies when scrap is collected, not here. */
export const TOOL_SALVAGE_PCT: Readonly<Record<LootDepth, number>> = { 1: 10, 2: 15, 3: 20 };

export interface AffixDef {
  id: AffixId;
  /** Design labels (prefix / suffix). UI text stays a text id. */
  prefix: string;
  suffix: string;
  param: string;
  slots: readonly ItemSlot[];
  /** Inclusive integer range for rarity 1 / 2 / 3. */
  range: Record<Rarity, readonly [number, number]>;
  weight: number;
  /**
   * Cap on the sum across equipped gear. Applied in combat, not while rolling.
   * null = this affix has no sum cap (Plated uses the global 60% DR cap).
   */
  totalCap: number | null;
}

/** M1_AFFIX_01–12. Count on an item equals its rarity. No repeats on one item. */
export const AFFIXES: readonly AffixDef[] = [
  {
    id: 'M1_AFFIX_01',
    prefix: 'Heavy',
    suffix: 'of Force',
    param: 'AFFIX_DMG_PCT',
    slots: ['weapon', 'module'],
    range: { 1: [5, 8], 2: [9, 14], 3: [15, 20] },
    weight: 100,
    totalCap: 50,
  },
  {
    id: 'M1_AFFIX_02',
    prefix: 'Quick',
    suffix: 'of the Rush',
    param: 'AFFIX_ATKSPD_PCT',
    slots: ['weapon', 'module'],
    range: { 1: [4, 6], 2: [7, 10], 3: [11, 15] },
    weight: 80,
    totalCap: 30,
  },
  {
    id: 'M1_AFFIX_03',
    prefix: 'Sharp',
    suffix: 'of the Weak Spot',
    param: 'AFFIX_CRIT_PP',
    slots: ['weapon', 'module', 'tool'],
    range: { 1: [3, 5], 2: [5, 8], 3: [8, 12] },
    weight: 80,
    totalCap: 25,
  },
  {
    id: 'M1_AFFIX_04',
    prefix: 'Thick',
    suffix: 'of the Long Shift',
    param: 'AFFIX_MAXHP',
    slots: ['armor', 'module'],
    range: { 1: [6, 10], 2: [11, 18], 3: [19, 28] },
    weight: 100,
    totalCap: 60,
  },
  {
    id: 'M1_AFFIX_05',
    prefix: 'Plated',
    suffix: 'of Steel',
    param: 'AFFIX_ARMOR',
    slots: ['armor', 'module'],
    range: { 1: [2, 4], 2: [4, 7], 3: [7, 10] },
    weight: 100,
    totalCap: null,
  },
  {
    id: 'M1_AFFIX_06',
    prefix: 'Patched',
    suffix: 'of Repair',
    param: 'AFFIX_MEDHEAL_PCT',
    slots: ['armor', 'module'],
    range: { 1: [10, 15], 2: [16, 25], 3: [26, 35] },
    weight: 60,
    totalCap: 60,
  },
  {
    id: 'M1_AFFIX_07',
    prefix: 'Light',
    suffix: 'of the Runner',
    param: 'AFFIX_MOVESPD_PCT',
    slots: ['armor', 'tool'],
    range: { 1: [3, 5], 2: [6, 8], 3: [9, 12] },
    weight: 60,
    totalCap: 20,
  },
  {
    id: 'M1_AFFIX_08',
    prefix: 'Charged',
    suffix: 'of the Spark',
    param: 'AFFIX_SKILLDMG_PCT',
    slots: ['weapon', 'module'],
    range: { 1: [10, 15], 2: [16, 25], 3: [26, 35] },
    weight: 60,
    totalCap: 60,
  },
  {
    id: 'M1_AFFIX_09',
    prefix: 'Ready',
    suffix: 'of the Second Try',
    param: 'AFFIX_CDR_PCT',
    slots: ['module', 'tool'],
    range: { 1: [4, 6], 2: [7, 10], 3: [11, 15] },
    weight: 60,
    totalCap: 30,
  },
  {
    id: 'M1_AFFIX_10',
    prefix: 'Lucky',
    suffix: 'of the Scavenger',
    param: 'AFFIX_LOOT_PCT',
    slots: ['tool'],
    range: { 1: [5, 8], 2: [9, 12], 3: [13, 18] },
    weight: 40,
    totalCap: 40,
  },
  {
    id: 'M1_AFFIX_11',
    prefix: 'Clever',
    suffix: 'of the Open Door',
    param: 'AFFIX_CHANNEL_PCT',
    slots: ['tool'],
    range: { 1: [10, 15], 2: [16, 25], 3: [26, 35] },
    weight: 60,
    totalCap: 50,
  },
  {
    id: 'M1_AFFIX_12',
    prefix: 'Long',
    suffix: 'of Reach',
    param: 'AFFIX_PICKUP_RADIUS',
    slots: ['armor', 'tool'],
    range: { 1: [1, 1], 2: [1, 1], 3: [2, 2] },
    weight: 50,
    totalCap: 2,
  },
];
