// Pure loot rolls. Pass the `loot` stream (`Rng` from streamSeed(seed, 'loot') or
// GameRng.stream('loot')). This file never draws from any other source.
//
// §2.12 model (gear items only — the published 6.3 / 8.6 / 9.0):
//   enemies uniform in 8–10 / 12–14 / 14–16, each with a 20% gear drop
//   + chests 3 / 4 / 4, each with 1–2 gear pieces.
// Scrap is a separate roll: 2–4 from every lootable enemy (means 27 / 39 / 45).
// A chest's Med-Patch (~30%) and its Copper (1–3 from depth 2) are extra too.
// Contract enemies and boss drones are not lootable and do not spend the stream,
// so a contract on the map cannot change the rest of the loot.
import type { Rng } from '../core/rng';
import {
  AFFIXES,
  ARMOR_BASE,
  CHEST_COPPER_COUNT,
  CHEST_GEAR_COUNT,
  CHEST_MEDPATCH_PERCENT,
  CHESTS_PER_LEVEL,
  COPPER_MIN_DEPTH,
  CREDIT_PILE_KR,
  CREDIT_PILES_PER_LEVEL,
  DEPTH_RARITY_ODDS,
  ENEMIES_PER_LEVEL,
  ENEMY_ITEM_DROP_PERCENT,
  ITEM_SLOT_WEIGHTS,
  MEDPATCH_SELL_PRICE,
  MODULE_HP_BASE,
  SCRAP_PER_ENEMY,
  SELL_COPPER,
  SELL_ITEM_BASE,
  SELL_SCRAP,
  SLOT_ROLL_ORDER,
  TOOL_SALVAGE_PCT,
  WEAPON_KIND_WEIGHTS,
  WEAPON_MELEE_DMG,
  WEAPON_RANGED_DMG,
  type AffixDef,
} from '../data/loot-m1';
import {
  COPPER_ITEM_ID,
  GEAR_ITEM_IDS,
  MEDPATCH_ITEM_ID,
  SCRAP_ITEM_ID,
} from '../data/inventory-m1';
import type { ItemSlot, Rarity } from '../data/style';
import type {
  AffixRoll,
  EnemyLootClass,
  GearBase,
  LevelSample,
  LootDepth,
  LootDrop,
  LootGear,
  WeaponKind,
} from './types';

export type { AffixRoll, LevelSample, LootDepth, LootDrop, LootGear } from './types';

const meanInclusive = (min: number, max: number): number => (min + max) / 2;

function assertDepth(depth: LootDepth): void {
  if (depth !== 1 && depth !== 2 && depth !== 3) {
    throw new Error(`loot: bad depth ${String(depth)}`);
  }
}

function assertRarity(rarity: Rarity): void {
  if (rarity !== 1 && rarity !== 2 && rarity !== 3) {
    throw new Error(`loot: bad rarity ${String(rarity)}`);
  }
}

function pickWeighted<T>(rng: Rng, items: readonly T[], weightOf: (item: T) => number): T {
  if (items.length === 0) throw new Error('loot: empty weighted pool');
  let total = 0;
  for (const item of items) total += weightOf(item);
  if (total <= 0) throw new Error('loot: weighted pool has no weight');
  let ticket = rng.int(1, total);
  for (const item of items) {
    ticket -= weightOf(item);
    if (ticket <= 0) return item;
  }
  throw new Error('loot: weighted pick fell through');
}

/** Pool enemies drop loot. Contract enemies and summoned boss drones do not. */
export function enemyLootable(source: EnemyLootClass): boolean {
  return source === 'pool';
}

/**
 * Rarity 1 / 2 / 3 from DEPTH_RARITY_ODDS.
 * One integer in 1..100: depth 1 is 1–80 / 81–98 / 99–100, and the same cut
 * for 65/30/5 and 50/38/12.
 */
export function rollRarity(rng: Rng, depth: LootDepth): Rarity {
  assertDepth(depth);
  const [common, uncommon] = DEPTH_RARITY_ODDS[depth];
  const roll = rng.int(1, 100);
  if (roll <= common) return 1;
  if (roll <= common + uncommon) return 2;
  return 3;
}

/** `rarity` distinct affixes legal on `slot`, weighted, then a uniform value in range. */
export function rollAffixes(rng: Rng, slot: ItemSlot, rarity: Rarity): AffixRoll[] {
  assertRarity(rarity);
  const remaining: AffixDef[] = AFFIXES.filter((affix) => affix.slots.includes(slot));
  if (remaining.length < rarity) {
    throw new Error(`loot: slot ${slot} has ${remaining.length} affixes, need ${rarity}`);
  }
  const rolled: AffixRoll[] = [];
  for (let i = 0; i < rarity; i++) {
    const affix = pickWeighted(rng, remaining, (item) => item.weight);
    const index = remaining.indexOf(affix);
    remaining.splice(index, 1);
    const [min, max] = affix.range[rarity];
    rolled.push({ id: affix.id, value: rng.int(min, max) });
  }
  return rolled;
}

export interface RollGearOptions {
  /** Skip the rarity roll (the prologue guard chest is always rarity 1). */
  rarity?: Rarity;
  /** Skip the slot roll. */
  slot?: ItemSlot;
}

function rollWeaponKind(rng: Rng): WeaponKind {
  return pickWeighted(rng, ['melee', 'ranged'] as const, (kind) => WEAPON_KIND_WEIGHTS[kind]);
}

function rollBase(
  rng: Rng,
  slot: ItemSlot,
  weaponKind: WeaponKind | undefined,
  depth: LootDepth,
): GearBase {
  if (slot === 'weapon') {
    if (weaponKind === 'ranged') {
      const [min, max] = WEAPON_RANGED_DMG[depth];
      return { id: 'WEAPON_RANGED_DMG', value: rng.int(min, max) };
    }
    if (weaponKind === 'melee') {
      const [min, max] = WEAPON_MELEE_DMG[depth];
      return { id: 'WEAPON_MELEE_DMG', value: rng.int(min, max) };
    }
    throw new Error('loot: weapon is missing a kind');
  }
  if (slot === 'armor') {
    const [min, max] = ARMOR_BASE[depth];
    return { id: 'ARMOR_BASE', value: rng.int(min, max) };
  }
  if (slot === 'module') {
    return { id: 'MODULE_HP_BASE', value: MODULE_HP_BASE[depth] };
  }
  return { id: 'TOOL_SALVAGE_PCT', value: TOOL_SALVAGE_PCT[depth] };
}

/**
 * One gear piece. Stream order: slot, weapon kind (weapons only), rarity,
 * base value (module and tool are fixed and skip that draw), then affixes.
 */
export function rollGear(rng: Rng, depth: LootDepth, opts?: RollGearOptions): LootGear {
  assertDepth(depth);
  const slot = opts?.slot ?? pickWeighted(rng, SLOT_ROLL_ORDER, (item) => ITEM_SLOT_WEIGHTS[item]);
  const weaponKind = slot === 'weapon' ? rollWeaponKind(rng) : undefined;
  const rarity = opts?.rarity ?? rollRarity(rng, depth);
  assertRarity(rarity);
  const base = rollBase(rng, slot, weaponKind, depth);
  const affixes = rollAffixes(rng, slot, rarity);
  const nameId = affixes[0]?.id;
  if (!nameId) throw new Error('loot: gear rolled no affix');
  if (slot === 'weapon') {
    if (!weaponKind) throw new Error('loot: weapon is missing a kind');
    return {
      kind: 'gear',
      itemId: GEAR_ITEM_IDS.weapon,
      slot: 'weapon',
      weaponKind,
      rarity,
      ilvl: depth,
      base,
      affixes,
      nameId,
    };
  }
  return {
    kind: 'gear',
    itemId: GEAR_ITEM_IDS[slot],
    slot,
    rarity,
    ilvl: depth,
    base,
    affixes,
    nameId,
  };
}

/**
 * One kill.
 * Not lootable (contract enemy or boss drone): [] and the stream is untouched.
 * Lootable: always Scrap 2–4, then an independent 20% chance of one gear piece.
 */
export function rollEnemyDrop(rng: Rng, opts: { depth: LootDepth; lootable: boolean }): LootDrop[] {
  assertDepth(opts.depth);
  if (!opts.lootable) return [];
  const drops: LootDrop[] = [
    {
      kind: 'scrap',
      itemId: SCRAP_ITEM_ID,
      count: rng.int(SCRAP_PER_ENEMY[0], SCRAP_PER_ENEMY[1]),
    },
  ];
  if (rng.int(1, 100) <= ENEMY_ITEM_DROP_PERCENT) drops.push(rollGear(rng, opts.depth));
  return drops;
}

/**
 * One chest. Stream order: gear count (1–2), those gear pieces, Med-Patch
 * check (~30%, one patch), then Copper 1–3 when depth >= 2.
 */
export function rollChest(rng: Rng, depth: LootDepth): LootDrop[] {
  assertDepth(depth);
  const gearCount = rng.int(CHEST_GEAR_COUNT[0], CHEST_GEAR_COUNT[1]);
  const drops: LootDrop[] = [];
  for (let i = 0; i < gearCount; i++) drops.push(rollGear(rng, depth));
  if (rng.int(1, 100) <= CHEST_MEDPATCH_PERCENT) {
    drops.push({ kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 1 });
  }
  if (depth >= COPPER_MIN_DEPTH) {
    drops.push({
      kind: 'copper',
      itemId: COPPER_ITEM_ID,
      count: rng.int(CHEST_COPPER_COUNT[0], CHEST_COPPER_COUNT[1]),
    });
  }
  return drops;
}

/**
 * Prolog chest behind the Guard (level-m1 §3.6): one rarity-1 item and one
 * Med-Patch. No Copper (depth 1). Rarity and the patch are not rolled.
 */
export function rollPrologueGuardChest(rng: Rng): LootDrop[] {
  return [
    rollGear(rng, 1, { rarity: 1 }),
    { kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 1 },
  ];
}

/** Ground credit piles for a level. Not items. */
export function rollCreditPiles(rng: Rng, depth: LootDepth): number[] {
  assertDepth(depth);
  const [minPiles, maxPiles] = CREDIT_PILES_PER_LEVEL[depth];
  const piles = rng.int(minPiles, maxPiles);
  const amounts: number[] = [];
  for (let i = 0; i < piles; i++) amounts.push(rng.int(CREDIT_PILE_KR[0], CREDIT_PILE_KR[1]));
  return amounts;
}

/**
 * Self-contained §2.12 level: pool enemy count, each pool enemy, each chest,
 * then credit piles, all on the rng you pass (the loot stream).
 * Level generation should call rollEnemyDrop / rollChest itself — enemy count
 * belongs to the enemies stream there. Rates match either way.
 * Contract enemies, boss drones, and the boss are omitted (they add nothing).
 */
export function rollLevelSample(rng: Rng, depth: LootDepth): LevelSample {
  assertDepth(depth);
  const [minEnemies, maxEnemies] = ENEMIES_PER_LEVEL[depth];
  const enemyCount = rng.int(minEnemies, maxEnemies);
  const enemies: LootDrop[][] = [];
  for (let i = 0; i < enemyCount; i++) {
    enemies.push(rollEnemyDrop(rng, { depth, lootable: true }));
  }
  const chests: LootDrop[][] = [];
  for (let i = 0; i < CHESTS_PER_LEVEL[depth]; i++) chests.push(rollChest(rng, depth));
  const credits = rollCreditPiles(rng, depth);
  return { depth, enemyCount, enemies, chests, credits };
}

/** Gear pieces only. Scrap, Med-Patches, Copper, and credits do not count. */
export function countGearItems(sample: LevelSample): number {
  let count = 0;
  for (const drops of sample.enemies)
    for (const drop of drops) if (drop.kind === 'gear') count += 1;
  for (const drops of sample.chests) for (const drop of drops) if (drop.kind === 'gear') count += 1;
  return count;
}

/** Scrap pieces from pool enemies. Chests do not roll a base scrap amount. */
export function countScrap(sample: LevelSample): number {
  let count = 0;
  for (const drops of sample.enemies) {
    for (const drop of drops) if (drop.kind === 'scrap') count += drop.count;
  }
  return count;
}

/**
 * Mean gear items per level: 6.3 / 8.6 / 9.0.
 * enemyMean × 0.20 + chests × 1.5.
 */
export function expectedItemsPerLevel(depth: LootDepth): number {
  assertDepth(depth);
  const [minEnemies, maxEnemies] = ENEMIES_PER_LEVEL[depth];
  return (
    meanInclusive(minEnemies, maxEnemies) * (ENEMY_ITEM_DROP_PERCENT / 100) +
    CHESTS_PER_LEVEL[depth] * meanInclusive(CHEST_GEAR_COUNT[0], CHEST_GEAR_COUNT[1])
  );
}

/** Mean scrap pieces per level: 27 / 39 / 45 (mean enemies × 3). */
export function expectedScrapPerLevel(depth: LootDepth): number {
  assertDepth(depth);
  const [minEnemies, maxEnemies] = ENEMIES_PER_LEVEL[depth];
  return (
    meanInclusive(minEnemies, maxEnemies) * meanInclusive(SCRAP_PER_ENEMY[0], SCRAP_PER_ENEMY[1])
  );
}

/** SELL_ITEM. base × (1 + 0.5 × (ilvl − 1)) = base × (ilvl + 1) / 2. */
export function gearSellPrice(rarity: Rarity, ilvl: LootDepth): number {
  assertRarity(rarity);
  assertDepth(ilvl);
  const numerator = SELL_ITEM_BASE[rarity] * (ilvl + 1);
  if (numerator % 2 !== 0) throw new Error(`loot: non-integer sell price r${rarity} ilvl ${ilvl}`);
  return numerator / 2;
}

/** Exchange sale value of one drop. Med-Patch is 0. Credits are not drops. */
export function sellPrice(drop: LootDrop): number {
  switch (drop.kind) {
    case 'gear':
      return gearSellPrice(drop.rarity, drop.ilvl);
    case 'scrap':
      return drop.count * SELL_SCRAP;
    case 'copper':
      return drop.count * SELL_COPPER;
    case 'medPatch':
      return MEDPATCH_SELL_PRICE;
    default: {
      const neverDrop: never = drop;
      return neverDrop;
    }
  }
}
