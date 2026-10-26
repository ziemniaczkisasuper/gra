import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GameRng, Rng, streamSeed } from '../src/core/rng';
import {
  AFFIXES,
  CHEST_MEDPATCH_PERCENT,
  COPPER_MIN_DEPTH,
  DEPTH_RARITY_ODDS,
  ENEMY_ITEM_DROP_PERCENT,
} from '../src/data/loot-m1';
import {
  COPPER_ITEM_ID,
  GEAR_SELL_VALUE,
  MEDPATCH_ITEM_ID,
  SCRAP_ITEM_ID,
} from '../src/data/inventory-m1';
import type { ItemSlot, Rarity } from '../src/data/style';
import {
  countGearItems,
  countScrap,
  enemyLootable,
  expectedItemsPerLevel,
  expectedScrapPerLevel,
  gearSellPrice,
  rollAffixes,
  rollChest,
  rollCreditPiles,
  rollEnemyDrop,
  rollGear,
  rollLevelSample,
  rollPrologueGuardChest,
  rollRarity,
  sellPrice,
} from '../src/loot/roll';
import type { LevelSample, LootDepth, LootDrop, LootGear } from '../src/loot/types';

const text = (rel: string) => new TextDecoder().decode(readFileSync(new URL(rel, import.meta.url)));

const DEPTHS: readonly LootDepth[] = [1, 2, 3];
const RARITIES: readonly Rarity[] = [1, 2, 3];
const SLOTS: readonly ItemSlot[] = ['weapon', 'armor', 'module', 'tool'];

/** SELL_ITEM from balans §3.3 / §4: r1 10/15/20, r2 40/60/80, r3 150/225/300. */
const DOC_SELL: Readonly<Record<Rarity, Readonly<Record<LootDepth, number>>>> = {
  1: { 1: 10, 2: 15, 3: 20 },
  2: { 1: 40, 2: 60, 3: 80 },
  3: { 1: 150, 2: 225, 3: 300 },
};

function lootRng(seed: number): Rng {
  return new Rng(streamSeed(seed, 'loot'));
}

function percent(count: number, total: number): number {
  return (count / total) * 100;
}

function expectWithinPp(actual: number, target: number, tolerance: number, label: string): void {
  const delta = Math.abs(actual - target);
  expect(
    delta,
    `${label}: ${actual.toFixed(3)} vs ${target} (Δ ${delta.toFixed(3)})`,
  ).toBeLessThanOrEqual(tolerance);
}

function armor(rarity: Rarity, ilvl: LootDepth): LootGear {
  return {
    kind: 'gear',
    itemId: 'M1_ITEM_GEAR_ARMOR',
    slot: 'armor',
    rarity,
    ilvl,
    base: { id: 'ARMOR_BASE', value: 6 },
    affixes: [{ id: 'M1_AFFIX_05', value: 2 }],
    nameId: 'M1_AFFIX_05',
  };
}

describe('rarity tables', () => {
  it('DEPTH_RARITY_ODDS sums to 100', () => {
    for (const depth of DEPTHS) {
      const [a, b, c] = DEPTH_RARITY_ODDS[depth];
      expect(a + b + c).toBe(100);
    }
  });

  it('100k draws sit within 1 percentage point of 80/18/2, 65/30/5, 50/38/12', () => {
    const draws = 100_000;
    for (const depth of DEPTHS) {
      const rng = lootRng(100 + depth);
      const counts: Record<Rarity, number> = { 1: 0, 2: 0, 3: 0 };
      for (let i = 0; i < draws; i++) counts[rollRarity(rng, depth)] += 1;
      const [common, uncommon, rare] = DEPTH_RARITY_ODDS[depth];
      const label = `depth ${depth} (${counts[1]}/${counts[2]}/${counts[3]})`;
      expectWithinPp(percent(counts[1], draws), common, 1, `${label} r1`);
      expectWithinPp(percent(counts[2], draws), uncommon, 1, `${label} r2`);
      expectWithinPp(percent(counts[3], draws), rare, 1, `${label} r3`);
    }
  });
});

describe('affixes and base stats', () => {
  it('lists M1_AFFIX_01 through M1_AFFIX_12 once', () => {
    expect(AFFIXES.map((affix) => affix.id)).toEqual([
      'M1_AFFIX_01',
      'M1_AFFIX_02',
      'M1_AFFIX_03',
      'M1_AFFIX_04',
      'M1_AFFIX_05',
      'M1_AFFIX_06',
      'M1_AFFIX_07',
      'M1_AFFIX_08',
      'M1_AFFIX_09',
      'M1_AFFIX_10',
      'M1_AFFIX_11',
      'M1_AFFIX_12',
    ]);
  });

  it('gear has rarity affixes, legal for the slot, inside the rarity range', () => {
    for (const depth of DEPTHS) {
      for (const slot of SLOTS) {
        const rng = lootRng(200 + depth * 10 + slot.length);
        const seenBase = new Set<number>();
        for (let i = 0; i < 400; i++) {
          const gear = rollGear(rng, depth, { slot });
          expect(gear.ilvl).toBe(depth);
          expect(gear.slot).toBe(slot);
          expect(gear.affixes).toHaveLength(gear.rarity);
          const ids = gear.affixes.map((affix) => affix.id);
          expect(new Set(ids).size).toBe(ids.length);
          for (const affix of gear.affixes) {
            const def = AFFIXES.find((row) => row.id === affix.id);
            expect(def, affix.id).toBeDefined();
            expect(def?.slots).toContain(slot);
            const range = def?.range[gear.rarity];
            expect(range).toBeDefined();
            if (!range) continue;
            expect(affix.value).toBeGreaterThanOrEqual(range[0]);
            expect(affix.value).toBeLessThanOrEqual(range[1]);
          }
          if (gear.slot === 'weapon') {
            expect(gear.weaponKind === 'melee' || gear.weaponKind === 'ranged').toBe(true);
            expect(gear.base.id).toBe(
              gear.weaponKind === 'melee' ? 'WEAPON_MELEE_DMG' : 'WEAPON_RANGED_DMG',
            );
          } else {
            expect('weaponKind' in gear).toBe(false);
          }
          if (slot === 'module') {
            expect(gear.base).toEqual({ id: 'MODULE_HP_BASE', value: [0, 5, 10, 15][depth] });
          }
          if (slot === 'tool') {
            expect(gear.base).toEqual({ id: 'TOOL_SALVAGE_PCT', value: [0, 10, 15, 20][depth] });
          }
          if (slot === 'armor') {
            expect(gear.base.id).toBe('ARMOR_BASE');
            const ranges: Record<LootDepth, readonly [number, number]> = {
              1: [6, 10],
              2: [13, 19],
              3: [20, 28],
            };
            const [min, max] = ranges[depth];
            expect(gear.base.value).toBeGreaterThanOrEqual(min);
            expect(gear.base.value).toBeLessThanOrEqual(max);
            seenBase.add(gear.base.value);
          }
        }
        if (slot === 'armor') {
          const ranges: Record<LootDepth, readonly [number, number]> = {
            1: [6, 10],
            2: [13, 19],
            3: [20, 28],
          };
          expect(seenBase.has(ranges[depth][0])).toBe(true);
          expect(seenBase.has(ranges[depth][1])).toBe(true);
        }
      }
    }
  });

  it('M1_AFFIX_12 is +1 / +1 / +2', () => {
    for (const rarity of RARITIES) {
      const rng = lootRng(300 + rarity);
      let seen = 0;
      for (let i = 0; i < 2000; i++) {
        for (const affix of rollAffixes(rng, 'armor', rarity)) {
          if (affix.id !== 'M1_AFFIX_12') continue;
          seen += 1;
          expect(affix.value).toBe(rarity === 3 ? 2 : 1);
        }
      }
      expect(seen).toBeGreaterThan(0);
    }
  });

  it('weapon affix weights match 100/80/80/60 on the first draw', () => {
    const draws = 20_000;
    const rng = lootRng(77);
    const counts = { M1_AFFIX_01: 0, M1_AFFIX_02: 0, M1_AFFIX_03: 0, M1_AFFIX_08: 0 };
    for (let i = 0; i < draws; i++) {
      const [only] = rollAffixes(rng, 'weapon', 1);
      expect(only).toBeDefined();
      if (!only) continue;
      expect(only.id in counts).toBe(true);
      counts[only.id as keyof typeof counts] += 1;
    }
    // Weights 100 + 80 + 80 + 60 = 320.
    expectWithinPp(percent(counts.M1_AFFIX_01, draws), (100 / 320) * 100, 2, 'affix 01');
    expectWithinPp(percent(counts.M1_AFFIX_02, draws), (80 / 320) * 100, 2, 'affix 02');
    expectWithinPp(percent(counts.M1_AFFIX_03, draws), (80 / 320) * 100, 2, 'affix 03');
    expectWithinPp(percent(counts.M1_AFFIX_08, draws), (60 / 320) * 100, 2, 'affix 08');
  });

  it('slots are equal weight and weapon kinds are equal weight', () => {
    const draws = 20_000;
    const rng = lootRng(78);
    const slots: Record<ItemSlot, number> = { weapon: 0, armor: 0, module: 0, tool: 0 };
    const kinds = { melee: 0, ranged: 0 };
    for (let i = 0; i < draws; i++) {
      const gear = rollGear(rng, 2);
      slots[gear.slot] += 1;
      if (gear.slot === 'weapon') kinds[gear.weaponKind] += 1;
    }
    for (const slot of SLOTS) expectWithinPp(percent(slots[slot], draws), 25, 2, slot);
    const weapons = kinds.melee + kinds.ranged;
    expectWithinPp(percent(kinds.melee, weapons), 50, 2, 'melee');
    expectWithinPp(percent(kinds.ranged, weapons), 50, 2, 'ranged');
  });
});

describe('sell price', () => {
  it('matches the §3.3 / §4 table and GEAR_SELL_VALUE', () => {
    for (const rarity of RARITIES) {
      for (const ilvl of DEPTHS) {
        const price = gearSellPrice(rarity, ilvl);
        expect(price, `r${rarity} ilvl ${ilvl}`).toBe(DOC_SELL[rarity][ilvl]);
        expect(price).toBe(GEAR_SELL_VALUE[rarity][ilvl]);
        expect(sellPrice(armor(rarity, ilvl))).toBe(price);
      }
    }
    // r3 ilvl 2: 150 × (1 + 0.5 × 1) = 225. Affixes do not change the price.
    const tuned = armor(3, 2);
    const other: LootGear = {
      ...tuned,
      affixes: [
        { id: 'M1_AFFIX_04', value: 28 },
        { id: 'M1_AFFIX_06', value: 35 },
        { id: 'M1_AFFIX_07', value: 12 },
      ],
      base: { id: 'ARMOR_BASE', value: 28 },
    };
    expect(sellPrice(other)).toBe(225);
  });

  it('Scrap is 2 kr, Copper is 5 kr, Med-Patch is 0', () => {
    expect(sellPrice({ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 1 })).toBe(2);
    expect(sellPrice({ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 2 })).toBe(4);
    expect(sellPrice({ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 3 })).toBe(6);
    expect(sellPrice({ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 4 })).toBe(8);
    expect(sellPrice({ kind: 'copper', itemId: COPPER_ITEM_ID, count: 1 })).toBe(5);
    expect(sellPrice({ kind: 'copper', itemId: COPPER_ITEM_ID, count: 3 })).toBe(15);
    expect(sellPrice({ kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 1 })).toBe(0);
    expect(sellPrice({ kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 6 })).toBe(0);
  });
});

describe('enemy drops', () => {
  it('contract enemies and boss drones drop nothing and do not spend the stream', () => {
    const rng = lootRng(9);
    const before = rng.getState();
    expect(enemyLootable('contract')).toBe(false);
    expect(enemyLootable('bossDrone')).toBe(false);
    expect(enemyLootable('pool')).toBe(true);
    expect(rollEnemyDrop(rng, { depth: 1, lootable: enemyLootable('contract') })).toEqual([]);
    expect(rollEnemyDrop(rng, { depth: 3, lootable: enemyLootable('bossDrone') })).toEqual([]);
    expect(rng.getState()).toBe(before);
    const afterSkip = rollGear(rng, 2);
    const fresh = lootRng(9);
    expect(rollGear(fresh, 2)).toEqual(afterSkip);
  });

  it('a lootable enemy always drops Scrap 2–4 and at most one gear piece', () => {
    const rng = lootRng(10);
    let gear = 0;
    const kills = 5_000;
    for (let i = 0; i < kills; i++) {
      const drops = rollEnemyDrop(rng, { depth: 2, lootable: true });
      const scrap = drops.filter((drop) => drop.kind === 'scrap');
      const pieces = drops.filter((drop) => drop.kind === 'gear');
      expect(scrap).toHaveLength(1);
      expect(pieces.length).toBeLessThanOrEqual(1);
      expect(drops.some((drop) => drop.kind === 'medPatch' || drop.kind === 'copper')).toBe(false);
      const stack = scrap[0];
      if (stack?.kind !== 'scrap') throw new Error('missing scrap');
      expect(stack.count).toBeGreaterThanOrEqual(2);
      expect(stack.count).toBeLessThanOrEqual(4);
      expect(stack.itemId).toBe(SCRAP_ITEM_ID);
      gear += pieces.length;
    }
    expectWithinPp(percent(gear, kills), ENEMY_ITEM_DROP_PERCENT, 2, 'enemy gear rate');
  });
});

describe('chests', () => {
  it('holds 1–2 gear, Med-Patch is not gear and does not sell, Copper only from depth 2', () => {
    for (const depth of DEPTHS) {
      const rng = lootRng(400 + depth);
      let med = 0;
      let gearPieces = 0;
      const chests = 4_000;
      for (let i = 0; i < chests; i++) {
        const drops = rollChest(rng, depth);
        const gear = drops.filter((drop): drop is LootGear => drop.kind === 'gear');
        const patches = drops.filter((drop) => drop.kind === 'medPatch');
        const copper = drops.filter((drop) => drop.kind === 'copper');
        expect(gear.length === 1 || gear.length === 2).toBe(true);
        expect(patches.length).toBeLessThanOrEqual(1);
        gearPieces += gear.length;
        for (const patch of patches) {
          expect(patch.kind).toBe('medPatch');
          expect(patch.itemId).toBe(MEDPATCH_ITEM_ID);
          expect(sellPrice(patch)).toBe(0);
          med += 1;
        }
        if (depth < COPPER_MIN_DEPTH) {
          expect(copper).toEqual([]);
        } else {
          expect(copper).toHaveLength(1);
          const stack = copper[0];
          if (stack?.kind !== 'copper') throw new Error('missing copper');
          expect(stack.count).toBeGreaterThanOrEqual(1);
          expect(stack.count).toBeLessThanOrEqual(3);
          expect(sellPrice(stack)).toBe(stack.count * 5);
        }
      }
      expectWithinPp(gearPieces / chests, 1.5, 0.05, `depth ${depth} chest gear`);
      expectWithinPp(percent(med, chests), CHEST_MEDPATCH_PERCENT, 2, `depth ${depth} med-patch`);
    }
  });

  it('the prologue guard chest is one r1 item plus an unsold Med-Patch', () => {
    const rng = lootRng(5);
    for (let i = 0; i < 200; i++) {
      const drops = rollPrologueGuardChest(rng);
      expect(drops).toHaveLength(2);
      const [gear, patch] = drops;
      expect(gear?.kind).toBe('gear');
      if (gear?.kind !== 'gear') throw new Error('missing gear');
      expect(gear.rarity).toBe(1);
      expect(gear.ilvl).toBe(1);
      expect(gear.affixes).toHaveLength(1);
      expect(sellPrice(gear)).toBe(10);
      expect(patch).toEqual({ kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 1 });
      expect(sellPrice(patch as LootDrop)).toBe(0);
      expect(drops.some((drop) => drop.kind === 'copper')).toBe(false);
    }
  });

  it('credit piles are 5–20 kr and are not chest items', () => {
    for (const depth of DEPTHS) {
      const rng = lootRng(600 + depth);
      for (let i = 0; i < 300; i++) {
        const piles = rollCreditPiles(rng, depth);
        const [minPiles, maxPiles] = depth === 1 ? [1, 1] : [1, 2];
        expect(piles.length).toBeGreaterThanOrEqual(minPiles);
        expect(piles.length).toBeLessThanOrEqual(maxPiles);
        for (const amount of piles) {
          expect(amount).toBeGreaterThanOrEqual(5);
          expect(amount).toBeLessThanOrEqual(20);
        }
      }
    }
  });
});

describe('what counts as an item', () => {
  it('the 6.3 figure is gear only', () => {
    const gearA = armor(1, 1);
    const gearB = armor(2, 1);
    const sample: LevelSample = {
      depth: 1,
      enemyCount: 2,
      enemies: [
        [{ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 4 }],
        [{ kind: 'scrap', itemId: SCRAP_ITEM_ID, count: 2 }, gearA],
      ],
      chests: [
        [
          gearB,
          { kind: 'medPatch', itemId: MEDPATCH_ITEM_ID, count: 1 },
          { kind: 'copper', itemId: COPPER_ITEM_ID, count: 2 },
        ],
      ],
      credits: [5, 20],
    };
    expect(countGearItems(sample)).toBe(2);
    expect(countScrap(sample)).toBe(6);
    expect(sellPrice(sample.chests[0]?.[1] as LootDrop)).toBe(0);
  });

  it('the closed form is 6.3 / 8.6 / 9.0 gear and 27 / 39 / 45 scrap', () => {
    expect(expectedItemsPerLevel(1)).toBeCloseTo(6.3, 10);
    expect(expectedItemsPerLevel(2)).toBeCloseTo(8.6, 10);
    expect(expectedItemsPerLevel(3)).toBeCloseTo(9, 10);
    expect(expectedScrapPerLevel(1)).toBe(27);
    expect(expectedScrapPerLevel(2)).toBe(39);
    expect(expectedScrapPerLevel(3)).toBe(45);
  });
});

describe('determinism', () => {
  it('the same loot seed rolls the same level, a different seed does not', () => {
    const once = rollLevelSample(lootRng(12345), 2);
    const twice = rollLevelSample(lootRng(12345), 2);
    expect(twice).toEqual(once);
    expect(rollLevelSample(lootRng(12346), 2)).not.toEqual(once);
  });

  it('GameRng stream loot matches Rng(streamSeed)', () => {
    const fromGame = new GameRng(99).stream('loot');
    const fromSeed = new Rng(streamSeed(99, 'loot'));
    expect(rollLevelSample(fromGame, 3)).toEqual(rollLevelSample(fromSeed, 3));
  });

  it('roll.ts does not call Math.random', () => {
    const src = text('../src/loot/roll.ts');
    expect(src.includes('Math.random')).toBe(false);
  });
});

describe('20_000 levels', () => {
  it('mean gear items are about 6.3 / 8.6 / 9.0', () => {
    const levels = 20_000;
    const rng = lootRng(1);
    const gearSum: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const scrapSum: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const medSum: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const copperSum: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const enemySum: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const enemyGear: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };
    const rarityCounts: Record<LootDepth, Record<Rarity, number>> = {
      1: { 1: 0, 2: 0, 3: 0 },
      2: { 1: 0, 2: 0, 3: 0 },
      3: { 1: 0, 2: 0, 3: 0 },
    };
    const gearN: Record<LootDepth, number> = { 1: 0, 2: 0, 3: 0 };

    for (const depth of DEPTHS) {
      for (let i = 0; i < levels; i++) {
        const sample = rollLevelSample(rng, depth);
        gearSum[depth] += countGearItems(sample);
        scrapSum[depth] += countScrap(sample);
        enemySum[depth] += sample.enemyCount;
        for (const drops of sample.enemies) {
          for (const drop of drops) {
            if (drop.kind !== 'gear') continue;
            enemyGear[depth] += 1;
            rarityCounts[depth][drop.rarity] += 1;
            gearN[depth] += 1;
          }
        }
        for (const drops of sample.chests) {
          for (const drop of drops) {
            if (drop.kind === 'gear') {
              rarityCounts[depth][drop.rarity] += 1;
              gearN[depth] += 1;
            } else if (drop.kind === 'medPatch') medSum[depth] += drop.count;
            else if (drop.kind === 'copper') copperSum[depth] += drop.count;
          }
        }
      }
    }

    const gearMean = DEPTHS.map((depth) => gearSum[depth] / levels);
    const scrapMean = DEPTHS.map((depth) => scrapSum[depth] / levels);
    const medMean = DEPTHS.map((depth) => medSum[depth] / levels);
    const copperMean = DEPTHS.map((depth) => copperSum[depth] / levels);
    const message =
      `measured gear ${gearMean.map((mean) => mean.toFixed(4)).join(' / ')} ` +
      `(target 6.3 / 8.6 / 9.0); scrap ${scrapMean.map((mean) => mean.toFixed(3)).join(' / ')} ` +
      `(target 27 / 39 / 45); med ${medMean.map((mean) => mean.toFixed(3)).join(' / ')} ` +
      `(target 0.9 / 1.2 / 1.2); copper ${copperMean.map((mean) => mean.toFixed(3)).join(' / ')} ` +
      `(target 0 / 8 / 8)`;
    // Visible on a green run. The same string is the assertion message below.
    console.log(message);

    expectWithinPp(gearMean[0] ?? 0, 6.3, 0.15, message);
    expectWithinPp(gearMean[1] ?? 0, 8.6, 0.15, message);
    expectWithinPp(gearMean[2] ?? 0, 9, 0.15, message);
    expectWithinPp(scrapMean[0] ?? 0, 27, 0.5, message);
    expectWithinPp(scrapMean[1] ?? 0, 39, 0.5, message);
    expectWithinPp(scrapMean[2] ?? 0, 45, 0.5, message);
    expectWithinPp(medMean[0] ?? 0, 0.9, 0.05, message);
    expectWithinPp(medMean[1] ?? 0, 1.2, 0.05, message);
    expectWithinPp(medMean[2] ?? 0, 1.2, 0.05, message);
    expect(copperMean[0]).toBe(0);
    expectWithinPp(copperMean[1] ?? 0, 8, 0.15, message);
    expectWithinPp(copperMean[2] ?? 0, 8, 0.15, message);

    for (const depth of DEPTHS) {
      expectWithinPp(
        (enemyGear[depth] / enemySum[depth]) * 100,
        ENEMY_ITEM_DROP_PERCENT,
        1,
        `d${depth} drop`,
      );
      const [common, uncommon, rare] = DEPTH_RARITY_ODDS[depth];
      const total = gearN[depth];
      expectWithinPp(percent(rarityCounts[depth][1], total), common, 1, `d${depth} rolled r1`);
      expectWithinPp(percent(rarityCounts[depth][2], total), uncommon, 1, `d${depth} rolled r2`);
      expectWithinPp(percent(rarityCounts[depth][3], total), rare, 1, `d${depth} rolled r3`);
    }
  }, 30_000);
});
