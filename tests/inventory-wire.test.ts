// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import { createContractsState, refillBoard } from '../src/contracts/board';
import { applyContractEvent } from '../src/contracts/progress';
import {
  BACKPACK_SLOTS,
  COPPER_ITEM_ID,
  GEAR_ITEM_IDS,
  GEAR_SELL_VALUE,
  SCRAP_ITEM_ID,
  START_CREDITS,
} from '../src/data/inventory-m1';
import {
  addCredits,
  addZoneCredits,
  collectFloor,
  computeAtRisk,
  createInventoryState,
  equip,
  getInventory,
  inventoryHudModel,
  medPatchCountOf,
  onDeath,
  onEvacuated,
  pickupItem,
  setInventory,
  topUpForDeparture,
} from '../src/inventory/inventory';
import '../src/inventory/save';
import { gameFromSave, snapshot, type SaveData } from '../src/save';
import { createHud } from '../src/ui/hud';

describe('inventory save section', () => {
  it('fresh inventory and the save fresh() path start at 50 credits', () => {
    expect(START_CREDITS).toBe(50);
    expect(createInventoryState().baseCr).toBe(50);
    const fresh = gameFromSave(null, { seed: 3 });
    expect(getInventory(fresh).baseCr).toBe(50);
    expect(getInventory(fresh).bag).toHaveLength(BACKPACK_SLOTS);
  });

  it('round-trips credits, a bag stack and a weapon stat through the registry', () => {
    const game = gameFromSave(null, { seed: 11 });
    let inv = getInventory(game);
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 4 }).state;
    inv = pickupItem(inv, {
      itemId: GEAR_ITEM_IDS.weapon,
      gear: {
        slot: 'weapon',
        rarity: 2,
        ilvl: 2,
        weaponKind: 'melee',
        nameId: 'M1_AFFIX_01',
        base: { id: 'WEAPON_MELEE_DMG', value: 14 },
        affixes: [{ id: 'M1_AFFIX_01', value: 8 }],
      },
    }).state;
    inv = addZoneCredits(inv, 9).state;
    inv = addCredits(inv, 15).state;
    setInventory(game, inv);

    const saved = JSON.parse(JSON.stringify(snapshot(game, 1_700_000_000_000))) as SaveData;
    const back = gameFromSave(saved);
    const got = getInventory(back);
    expect(got.baseCr).toBe(65);
    expect(got.zoneCr).toBe(9);
    expect(got.bag).toEqual(getInventory(game).bag);
    expect(got.nextUid).toBe(getInventory(game).nextUid);
    const weapon = got.bag.find((it) => it?.gear);
    expect(weapon?.gear?.base).toEqual({ id: 'WEAPON_MELEE_DMG', value: 14 });
    expect(weapon?.gear?.weaponKind).toBe('melee');
  });
});

describe('evacuation, top-up, AT RISK, death', () => {
  it('onEvacuated moves zone credits onto the account and keeps the bag', () => {
    let inv = addZoneCredits(createInventoryState(), 17).state;
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 3 }).state;
    const bag = inv.bag.map((it) => (it ? { ...it } : null));
    const res = onEvacuated(inv);
    expect(res.state.zoneCr).toBe(0);
    expect(res.state.baseCr).toBe(START_CREDITS + 17);
    expect(res.state.location).toBe('base');
    expect(res.state.bag).toEqual(bag);
    expect(medPatchCountOf(res.state)).toBe(0);
  });

  it('topUpForDeparture adds 2 patches, or 3 when Lights ≥ 1 is already on a section', () => {
    const plain = gameFromSave(null, { seed: 1 });
    const added = topUpForDeparture(plain);
    expect(added.medPatchAdded).toBe(2);
    expect(medPatchCountOf(getInventory(plain))).toBe(2);
    expect(getInventory(plain).location).toBe('zone');

    const lit = gameFromSave(null, { seed: 2 });
    lit.sections.progress = { lights: 1 };
    const more = topUpForDeparture(lit);
    expect(more.medPatchAdded).toBe(3);
    expect(medPatchCountOf(getInventory(lit))).toBe(3);

    lit.sections.progress = { lights: 0 };
    const again = topUpForDeparture(lit);
    expect(again.medPatchAdded).toBe(0);
    expect(medPatchCountOf(getInventory(lit))).toBe(3);
  });

  it('inventoryHudModel.atRisk stays equal to computeAtRisk', () => {
    let inv = createInventoryState();
    expect(inventoryHudModel(inv).atRisk).toBe(computeAtRisk(inv));
    inv = addZoneCredits(inv, 12).state;
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 5 }).state;
    inv = pickupItem(inv, { itemId: COPPER_ITEM_ID, count: 2 }).state;
    expect(inventoryHudModel(inv)).toEqual({
      atRisk: computeAtRisk(inv),
      bagUsed: 2,
      bagMax: 12,
    });
    expect(inventoryHudModel(inv).atRisk).toBe(12 + 5 * 2 + 2 * 5);
  });

  it('onDeath loss equals the last AT RISK, and the BASE contract stays on the board', () => {
    let inv = addZoneCredits(createInventoryState(), 20).state;
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 4 }).state;
    const picked = pickupItem(inv, {
      itemId: GEAR_ITEM_IDS.armor,
      gear: {
        slot: 'armor',
        rarity: 1,
        ilvl: 1,
        base: { id: 'ARMOR_BASE', value: 8 },
      },
    });
    const idx = picked.state.bag.findIndex((it) => it?.gear);
    const equippedRes = equip(picked.state, idx);
    expect(equippedRes.ok).toBe(true);
    const equipped = equippedRes.state;
    const before = computeAtRisk(equipped);
    expect(before).toBe(20 + 4 * 2 + GEAR_SELL_VALUE[1][1]);
    const dead = onDeath(equipped);
    expect(dead.lost.totalCr).toBe(before);
    expect(computeAtRisk(dead.state)).toBe(0);
    expect(dead.state.zoneCr).toBe(0);
    expect(dead.state.bag.every((it) => it === null)).toBe(true);
    expect(dead.state.baseCr).toBe(START_CREDITS);
    expect(dead.state.gear.armor?.itemId).toBe('M1_ITEM_ISSUE_SUIT');

    const board = refillBoard(createContractsState(), new Rng(1), {
      unlockedStops: [],
      solvedVariants: [],
    });
    const open = board.state.base.filter((c) => c !== null);
    expect(open).toHaveLength(2);
    const progressed = applyContractEvent(board.state, {
      type: 'terminalSolved',
      depth: 1,
      variant: 'M1_TERM_04',
      firstSolve: true,
    });
    const met = progressed.state.base.find(
      (c) => c?.progress.kind === 'solveTerminal' && c.progress.met,
    );
    expect(met).toBeTruthy();
    const failed = applyContractEvent(progressed.state, { type: 'died' });
    expect(failed.state.base.map((c) => c?.id)).toEqual(progressed.state.base.map((c) => c?.id));
    expect(failed.state.base.map((c) => c?.defId)).toEqual(
      progressed.state.base.map((c) => c?.defId),
    );
    for (const c of failed.state.base) {
      if (!c) continue;
      expect(c.progress.met).toBe(false);
      if (c.progress.kind === 'killContractEnemies') expect(c.progress.killed).toBe(0);
    }
    expect(failed.events.some((e) => e.type === 'contract:failed')).toBe(true);
  });
});

describe('floor pickup', () => {
  it('steps pick up $, : and +, gear and § wait for USE, a full bag is bagFull', () => {
    let inv = createInventoryState();
    const credits = collectFloor(inv, { glyph: '$', credits: 11 }, 'step');
    expect(credits.ok).toBe(true);
    expect(credits.state.zoneCr).toBe(11);
    const scrap = collectFloor(credits.state, { glyph: ':', count: 3 }, 'step');
    expect(scrap.ok).toBe(true);
    expect(scrap.state.bag.some((it) => it?.itemId === SCRAP_ITEM_ID && it.count === 3)).toBe(true);
    const copper = collectFloor(
      scrap.state,
      { glyph: ':', itemId: COPPER_ITEM_ID, count: 2 },
      'step',
    );
    expect(copper.state.bag.some((it) => it?.itemId === COPPER_ITEM_ID && it.count === 2)).toBe(
      true,
    );
    const patch = collectFloor(copper.state, { glyph: '+', count: 2 }, 'step');
    expect(medPatchCountOf(patch.state)).toBe(2);

    const gearOffer = {
      glyph: '/',
      gear: {
        slot: 'weapon' as const,
        rarity: 1 as const,
        ilvl: 1 as const,
        weaponKind: 'melee' as const,
        base: { id: 'WEAPON_MELEE_DMG', value: 10 },
      },
    };
    const stepped = collectFloor(patch.state, gearOffer, 'step');
    expect(stepped.ok).toBe(false);
    expect(stepped.reason).toBe('needsUse');
    expect(stepped.state).toBe(patch.state);
    const used = collectFloor(patch.state, gearOffer, 'use');
    expect(used.ok).toBe(true);
    expect(used.taken).toBe(1);

    const coreStep = collectFloor(used.state, { glyph: '§' }, 'step');
    expect(coreStep.reason).toBe('needsUse');
    const core = collectFloor(used.state, { glyph: '§' }, 'use');
    expect(core.ok).toBe(true);
    expect(core.state.bag.some((it) => it?.itemId === 'M1_ITEM_DATA_CORE')).toBe(true);

    let full = createInventoryState();
    for (let i = 0; i < BACKPACK_SLOTS; i++) {
      const put = pickupItem(full, {
        itemId: GEAR_ITEM_IDS.tool,
        gear: { slot: 'tool', rarity: 1, ilvl: 1, base: { id: 'TOOL_SALVAGE_PCT', value: 10 } },
      });
      expect(put.ok).toBe(true);
      full = put.state;
    }
    const blocked = collectFloor(full, { glyph: ':', count: 1 }, 'step');
    expect(blocked.ok).toBe(false);
    expect(blocked.reason).toBe('bagFull');
    expect(blocked.state).toBe(full);
  });
});

describe('HUD AT RISK and bag', () => {
  it('setInventory prints AT RISK and BAG occupancy', () => {
    document.body.innerHTML = '<div id="ui"></div>';
    const hud = createHud(document.getElementById('ui')!);
    expect(hud.slots.atRisk.hidden).toBe(true);
    expect(hud.slots.backpack.hidden).toBe(true);

    let inv = addZoneCredits(createInventoryState(), 37).state;
    inv = pickupItem(inv, { itemId: SCRAP_ITEM_ID, count: 1 }).state;
    const model = inventoryHudModel(inv);
    expect(model.atRisk).toBe(computeAtRisk(inv));
    hud.setInventory(model);
    expect(hud.slots.atRisk.hidden).toBe(false);
    expect(hud.slots.atRisk.textContent).toBe(`AT RISK: ${model.atRisk} cr`);
    expect(hud.slots.backpack.textContent).toBe(`BAG ${model.bagUsed}/12`);
    expect(hud.slots.backpack.classList.contains('is-full')).toBe(false);

    hud.setInventory({ atRisk: 0, bagUsed: 12, bagMax: 12 });
    expect(hud.slots.backpack.textContent).toBe('BAG 12/12 FULL');
    expect(hud.slots.backpack.classList.contains('is-full')).toBe(true);
    expect(hud.slots.atRisk.textContent).toBe('AT RISK: 0 cr');
  });
});
