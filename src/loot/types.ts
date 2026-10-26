// Loot rolls for M1 (balans-m1.md §3–§4, mechaniki-m1.md §2.12, level-m1.md §3.2).
// This module only decides contents. T25 turns a drop into an inventory pickup.
//
// T25 mapping (do not import inventory logic here):
// - gear → pickupItem({
//     itemId: GEAR_ITEM_IDS[slot] (already stored on the drop),
//     count: 1,
//     gear: { slot, rarity, ilvl, affixes, nameId },
//   })
//   pickupItem assigns GearInfo.uid. `nameId` is the first rolled affix id
//   (M1_AFFIX_01–12) until Lore has a composed item-name text.
//   `weaponKind` is NOT on GearInfo today. Combat reads `weaponType` from the
//   item def, which is per id, not per rolled piece. T25 has to carry
//   weaponKind (extend GearInfo, or split melee / ranged item ids).
// - scrap → { itemId: M1_ITEM_SCRAP, count }           // sell 2 kr each
// - copper → { itemId: M1_ITEM_COPPER, count }         // sell 5 kr each, depth >= 2
// - medPatch → { itemId: M1_ITEM_MEDPATCH, count }     // sell price 0, not gear
// - credit piles are not items and are not sold. Add the amount to zone credits.
import type { ItemSlot, Rarity } from '../data/style';

export type { ItemSlot, Rarity };

/** Zone depth. Same 1 | 2 | 3 as GearInfo.ilvl and contracts Depth. */
export type LootDepth = 1 | 2 | 3;

export const LOOT_DEPTHS: readonly LootDepth[] = [1, 2, 3];

export type AffixId =
  | 'M1_AFFIX_01'
  | 'M1_AFFIX_02'
  | 'M1_AFFIX_03'
  | 'M1_AFFIX_04'
  | 'M1_AFFIX_05'
  | 'M1_AFFIX_06'
  | 'M1_AFFIX_07'
  | 'M1_AFFIX_08'
  | 'M1_AFFIX_09'
  | 'M1_AFFIX_10'
  | 'M1_AFFIX_11'
  | 'M1_AFFIX_12';

export type GearBaseId =
  'WEAPON_MELEE_DMG' | 'WEAPON_RANGED_DMG' | 'ARMOR_BASE' | 'MODULE_HP_BASE' | 'TOOL_SALVAGE_PCT';

export type WeaponKind = 'melee' | 'ranged';

/** One rolled property. Shape matches GearInfo.affixes. */
export interface AffixRoll {
  id: AffixId;
  value: number;
}

export interface GearBase {
  id: GearBaseId;
  value: number;
}

interface GearCommon {
  kind: 'gear';
  /** GEAR_ITEM_IDS[slot] from data/inventory-m1.ts. */
  itemId: string;
  rarity: Rarity;
  /** Item level = depth of the drop (balans §3.1). */
  ilvl: LootDepth;
  base: GearBase;
  /** Exactly `rarity` distinct affixes. */
  affixes: AffixRoll[];
  /** First rolled affix id. Passed through as GearInfo.nameId. */
  nameId: AffixId;
}

export type LootGear = GearCommon &
  ({ slot: 'weapon'; weaponKind: WeaponKind } | { slot: 'armor' | 'module' | 'tool' });

export interface StackDrop {
  kind: 'scrap' | 'copper' | 'medPatch';
  /** M1_ITEM_SCRAP / M1_ITEM_COPPER / M1_ITEM_MEDPATCH. */
  itemId: string;
  count: number;
}

/** One thing a kill or a chest places. Credit piles are not drops. */
export type LootDrop = LootGear | StackDrop;

/**
 * Who is dying, for the lootable flag.
 * Pool enemies are the 8–10 / 12–14 / 14–16 count. Contract enemies and the
 * two drones the Rail Guardian summons drop nothing. The boss itself is not
 * in that pool and has no M1 drop table.
 */
export type EnemyLootClass = 'pool' | 'contract' | 'bossDrone';

/**
 * One level of the §2.12 economy model (not map placement).
 * Gear pieces inside `enemies` and `chests` are the 6.3 / 8.6 / 9.0 items.
 * Scrap, Med-Patches, Copper, and credit piles are extra.
 */
export interface LevelSample {
  depth: LootDepth;
  /** How many pool enemies were rolled (uniform in the depth's range). */
  enemyCount: number;
  enemies: LootDrop[][];
  chests: LootDrop[][];
  /** Face value in kr of each ground pile ($). Not an item. */
  credits: number[];
}
