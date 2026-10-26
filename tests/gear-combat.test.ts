import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGame, stepGame, type GameState } from '../src/core/game';
import { Rng } from '../src/core/rng';
import { applyArmor, getCombat, type CombatInitOptions } from '../src/combat/combat';
import {
  AFFIX_DMG_PCT,
  gearInfoFromLoot,
  medPatchHealTotal,
  medPatchRuntime,
  MEDPATCH_HEAL_HP,
} from '../src/combat/gear-stats';
import { installCombat } from '../src/combat/install';
import { COMBAT, COMBAT_M1, type CombatConfig } from '../src/data/combat-m0';
import {
  GEAR_ITEM_IDS,
  ISSUE_POLE_ITEM_ID,
  MEDPATCH_ITEM_ID,
  SCRAP_ITEM_ID,
  START_CREDITS,
} from '../src/data/inventory-m1';
import { WEAPON_MELEE_DMG } from '../src/data/loot-m1';
import { emptyActions, type ActionState } from '../src/input/actions';
import {
  addZoneCredits,
  computeAtRisk,
  createInventoryState,
  equip,
  getInventory,
  medPatchCountOf,
  pickupItem,
  setInventory,
} from '../src/inventory/inventory';
import type { GearInfo } from '../src/inventory/types';
import { rollGear } from '../src/loot/roll';
import type { LootGear } from '../src/loot/types';
import type { CombatEvent } from '../src/combat/state';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const STEP = COMBAT.TICK_MS;

function act(o: { move?: [number, number]; attack?: boolean; heal?: boolean } = {}): ActionState {
  const a = emptyActions();
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  a.attack = !!o.attack;
  a.heal = !!o.heal;
  return a;
}

function run(
  state: GameState,
  n: number,
  input: ActionState | ((i: number) => ActionState) = act(),
) {
  const out: Array<{ tick: number; ev: CombatEvent }> = [];
  for (let i = 0; i < n; i++) {
    const tick = state.tick;
    stepGame(state, typeof input === 'function' ? input(i) : input, STEP);
    for (const ev of getCombat(state).events) out.push({ tick, ev });
  }
  return out;
}

function room(opts: CombatInitOptions = {}, seed = 1, enemy = true): GameState {
  const rows = [
    '############',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '############',
  ];
  const chars = rows.map((r) => r.split(''));
  chars[3]![3] = '@';
  if (enemy) chars[3]![4] = 'E';
  const s = createGame({ mapRows: chars.map((r) => r.join('')), seed });
  getCombat(s, opts);
  return s;
}

function wear(state: GameState, itemId: string, gear: Omit<GearInfo, 'uid'>): void {
  const picked = pickupItem(createInventoryState(), { itemId, gear });
  expect(picked.ok).toBe(true);
  const idx = picked.state.bag.findIndex((it) => it !== null);
  const eq = equip(picked.state, idx);
  expect(eq.ok).toBe(true);
  setInventory(state, eq.state);
}

const hitsOf = (ev: Array<{ ev: CombatEvent }>) =>
  ev.filter((x) => x.ev.type === 'enemyHit') as Array<{
    ev: Extract<CombatEvent, { type: 'enemyHit' }>;
  }>;

describe('equipped weapon damage', () => {
  const quiet: CombatConfig = { ...COMBAT, PLAYER_CRIT_CHANCE: 0 };

  it('Issue Pole still rolls the profile 8–12 when no loot weapon is equipped', () => {
    const s = room({ cfg: quiet });
    setInventory(s, createInventoryState());
    const ev = run(s, 3, (i) => act({ attack: i === 0 }));
    const hit = hitsOf(ev)[0]!;
    expect(hit.ev.crit).toBe(false);
    expect(hit.ev.dmg).toBeGreaterThanOrEqual(COMBAT.PLAYER_DMG_MIN);
    expect(hit.ev.dmg).toBeLessThanOrEqual(COMBAT.PLAYER_DMG_MAX);
    expect(getInventory(s).gear.weapon?.itemId).toBe(ISSUE_POLE_ITEM_ID);
  });

  it('a hand-built melee weapon deals its gear stat (19), not the Issue Pole range', () => {
    const s = room({ cfg: quiet }, 2);
    wear(s, GEAR_ITEM_IDS.weapon, {
      slot: 'weapon',
      rarity: 1,
      ilvl: 3,
      weaponKind: 'melee',
      base: { id: 'WEAPON_MELEE_DMG', value: 19 },
    });
    const ev = run(s, 3, (i) => act({ attack: i === 0 }));
    const hit = hitsOf(ev)[0]!;
    expect(hit.ev.crit).toBe(false);
    expect(hit.ev.dmg).toBe(19);
    expect(hit.ev.dmg).toBeGreaterThan(COMBAT.PLAYER_DMG_MAX);
  });

  it('a rolled melee weapon deals its base stat after the damage affix, before the one round', () => {
    let drop: LootGear | undefined;
    const rng = new Rng(4);
    for (let i = 0; i < 40 && !drop; i++) {
      const g = rollGear(rng, 3, { slot: 'weapon' });
      if (g.slot === 'weapon' && g.weaponKind === 'melee') drop = g;
    }
    expect(drop).toBeTruthy();
    const gear = drop!;
    expect(gear.slot === 'weapon' && gear.base.id).toBe('WEAPON_MELEE_DMG');
    const [min, max] = WEAPON_MELEE_DMG[3];
    expect(gear.base.value).toBeGreaterThanOrEqual(min);
    expect(gear.base.value).toBeLessThanOrEqual(max);

    const s = room({ cfg: quiet }, 5);
    wear(s, gear.itemId, gearInfoFromLoot(gear));
    const ev = run(s, 3, (i) => act({ attack: i === 0 }));
    const pct = Math.min(
      50,
      gear.affixes.filter((a) => a.id === AFFIX_DMG_PCT).reduce((sum, a) => sum + a.value, 0),
    );
    const expected = Math.round(gear.base.value * (1 + pct / 100));
    expect(hitsOf(ev)[0]!.ev.dmg).toBe(expected);
    expect(expected).toBeGreaterThan(COMBAT.PLAYER_DMG_MAX);
  });

  it('damage affix stays fractional through crit so there is one round', () => {
    const cfg: CombatConfig = { ...COMBAT, PLAYER_CRIT_CHANCE: 1 };
    const s = room({ cfg }, 6);
    wear(s, GEAR_ITEM_IDS.weapon, {
      slot: 'weapon',
      rarity: 1,
      ilvl: 3,
      weaponKind: 'melee',
      base: { id: 'WEAPON_MELEE_DMG', value: 13 },
      affixes: [{ id: AFFIX_DMG_PCT, value: 5 }],
    });
    const ev = run(s, 3, (i) => act({ attack: i === 0 }));
    const hit = hitsOf(ev)[0]!.ev;
    expect(hit.crit).toBe(true);
    // 13 × 1.05 × 1.5 = 20.475 → 20. Rounding the affix first would yield 21.
    expect(hit.dmg).toBe(Math.round(13 * 1.05 * cfg.PLAYER_CRIT_MULT));
    expect(hit.dmg).toBe(20);
  });
});

describe('equipped armour', () => {
  const cfg: CombatConfig = { ...COMBAT, ENEMY_DMG_MIN: 15, ENEMY_DMG_MAX: 15 };

  it('an enemy blow is reduced exactly by applyArmor from the equipped piece', () => {
    const s = room({ cfg }, 7);
    wear(s, GEAR_ITEM_IDS.armor, {
      slot: 'armor',
      rarity: 1,
      ilvl: 3,
      base: { id: 'ARMOR_BASE', value: 100 },
    });
    getCombat(s).player.hp = getCombat(s).player.maxHp = 1_000_000;
    const ev = run(s, 80);
    const blow = ev.find((x) => x.ev.type === 'playerHit') as
      { ev: Extract<CombatEvent, { type: 'playerHit' }> } | undefined;
    expect(blow).toBeTruthy();
    expect(getCombat(s).player.armor).toBe(100);
    expect(applyArmor(15, 100, cfg)).toBe(7);
    expect(blow!.ev.dmg).toBe(7);
    expect(blow!.ev.dmg).toBe(applyArmor(15, getCombat(s).player.armor, cfg));
  });

  it('Plated is added to A before the armour step', () => {
    const s = room({ cfg }, 8);
    wear(s, GEAR_ITEM_IDS.armor, {
      slot: 'armor',
      rarity: 1,
      ilvl: 2,
      base: { id: 'ARMOR_BASE', value: 20 },
      affixes: [{ id: 'M1_AFFIX_05', value: 10 }],
    });
    getCombat(s).player.hp = getCombat(s).player.maxHp = 1_000_000;
    const ev = run(s, 80);
    const blow = ev.find((x) => x.ev.type === 'playerHit') as {
      ev: Extract<CombatEvent, { type: 'playerHit' }>;
    };
    expect(getCombat(s).player.armor).toBe(30);
    expect(applyArmor(15, 30, cfg)).toBe(11);
    expect(blow.ev.dmg).toBe(11);
  });
});

describe('Med-Patch', () => {
  it('Q heals +40 HP over 2 s and then waits out the 4 s cooldown', () => {
    const s = room({ cfg: COMBAT_M1 }, 9, false);
    const picked = pickupItem(createInventoryState(), { itemId: MEDPATCH_ITEM_ID, count: 3 });
    setInventory(s, picked.state);
    const c = getCombat(s);
    c.player.hp = 20;
    expect(medPatchHealTotal(s)).toBe(MEDPATCH_HEAL_HP);

    run(s, 1, act({ heal: true }));
    expect(medPatchCountOf(getInventory(s))).toBe(2);
    expect(c.player.hp).toBe(21);

    run(s, 39, act());
    expect(c.player.hp).toBe(20 + MEDPATCH_HEAL_HP);
    expect(medPatchRuntime(s).ticksLeft).toBe(0);
    expect(medPatchCountOf(getInventory(s))).toBe(2);

    run(s, 40, act());
    expect(medPatchRuntime(s).cooldown).toBe(0);
    expect(c.player.hp).toBe(60);
    expect(medPatchCountOf(getInventory(s))).toBe(2);

    run(s, 1, act({ heal: true }));
    expect(medPatchCountOf(getInventory(s))).toBe(1);
    expect(c.player.hp).toBe(61);
  });

  it('Patched raises the same 2 s heal, capped at +60%', () => {
    const s = room({ cfg: COMBAT_M1 }, 10, false);
    let inv = pickupItem(createInventoryState(), { itemId: MEDPATCH_ITEM_ID, count: 1 }).state;
    const armor = pickupItem(inv, {
      itemId: GEAR_ITEM_IDS.armor,
      gear: {
        slot: 'armor',
        rarity: 1,
        ilvl: 1,
        base: { id: 'ARMOR_BASE', value: 6 },
        affixes: [{ id: 'M1_AFFIX_06', value: 60 }],
      },
    });
    const idx = armor.state.bag.findIndex((it) => it?.gear);
    inv = equip(armor.state, idx).state;
    setInventory(s, inv);
    expect(medPatchHealTotal(s)).toBe(64);
    getCombat(s).player.hp = 10;
    run(s, 40, (i) => act({ heal: i === 0 }));
    expect(getCombat(s).player.hp).toBe(74);
  });
});

describe('death drops the last AT RISK', () => {
  it('the bag, non-Issue gear and zone credits are gone when the player dies', () => {
    const s = room({}, 11);
    let inv = addZoneCredits(createInventoryState(), 20).state;
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 4 }).state;
    const picked = pickupItem(inv, {
      itemId: GEAR_ITEM_IDS.weapon,
      gear: {
        slot: 'weapon',
        rarity: 1,
        ilvl: 1,
        weaponKind: 'melee',
        base: { id: 'WEAPON_MELEE_DMG', value: 11 },
      },
    });
    const idx = picked.state.bag.findIndex((it) => it?.gear);
    inv = equip(picked.state, idx).state;
    setInventory(s, inv);
    const before = computeAtRisk(s);
    expect(before).toBe(20 + 8 + 10);
    getCombat(s).player.hp = 1;
    run(s, 100);
    expect(getCombat(s).stats.deaths).toBe(1);
    expect(computeAtRisk(s)).toBe(0);
    expect(getInventory(s).zoneCr).toBe(0);
    expect(getInventory(s).baseCr).toBe(START_CREDITS);
    expect(getInventory(s).bag.every((it) => it === null)).toBe(true);
    expect(getInventory(s).gear.weapon?.itemId).toBe(ISSUE_POLE_ITEM_ID);
  });
});
