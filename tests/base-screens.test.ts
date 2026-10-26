// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyArmor } from '../src/combat/combat';
import { Rng } from '../src/core/rng';
import { COMBAT_M1 } from '../src/data/combat-m0';
import { GEAR_ITEM_IDS, MEDPATCH_ITEM_ID, SCRAP_ITEM_ID } from '../src/data/inventory-m1';
import {
  MEDPATCH_BUY_PRICE,
  applyCalibration,
  beginCalibration,
  buyMedPatch,
  buyOffer,
  calibrationCost,
  calibrationCount,
  canSell,
  paidRefresh,
  quoteCalibration,
  refreshCost,
  rollShelf,
  sell,
  shelfPrice,
  shopR3Percent,
  shopStock,
} from '../src/inventory/exchange';
import {
  addCredits,
  createInventoryState,
  equip,
  getCredits,
  getGear,
  getLocker,
  onDeath,
  pickupItem,
  setLockerSize,
  unequip,
} from '../src/inventory/inventory';
import type { InventoryState } from '../src/inventory/types';
import { gearSellPrice } from '../src/loot/roll';
import { mountBaseHub } from '../src/ui/base-hub';
import { mountExchangeScreen } from '../src/ui/exchange-screen';
import {
  drOfArmor,
  formatDrCompare,
  formatDrPercent,
  mountInventoryScreen,
} from '../src/ui/inventory-screen';
import { mountLockerScreen } from '../src/ui/locker-screen';
import { M1_COPY } from '../src/ui/m1-copy';
import { mountReportScreen, reportFooter } from '../src/ui/report-screen';
import {
  markSeen,
  mountRiskExplainer,
  riskPages,
  shouldShowRiskExplainer,
} from '../src/ui/risk-explainer';
import { BASE_M1 } from '../src/world/levelgen';

const key = (code: string, type: 'keydown' | 'keyup' = 'keydown') =>
  document.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true, cancelable: true }));

function root(): HTMLDivElement {
  const node = document.createElement('div');
  document.body.append(node);
  return node;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('exchange prices (balans §4)', () => {
  it('matches the shelf multipliers and the Med-Patch price', () => {
    expect(MEDPATCH_BUY_PRICE).toBe(25);
    expect(shelfPrice(1, 1)).toBe(40);
    expect(shelfPrice(2, 1)).toBe(160);
    expect(shelfPrice(3, 1)).toBe(750);
    expect(shelfPrice(1, 2)).toBe(60);
    expect(shelfPrice(2, 2)).toBe(240);
    expect(shelfPrice(3, 2)).toBe(1125);
    expect(shelfPrice(1, 3)).toBe(80);
    expect(shelfPrice(2, 3)).toBe(320);
    expect(shelfPrice(3, 3)).toBe(1500);
    expect(shelfPrice(2, 1)).toBe(gearSellPrice(2, 1) * 4);
    expect(shelfPrice(3, 3)).toBe(gearSellPrice(3, 3) * 5);
    expect(shopStock(0)).toBe(3);
    expect(shopStock(2)).toBe(4);
    expect(shopR3Percent(0)).toBe(10);
    expect(shopR3Percent(3)).toBe(20);
    expect(refreshCost(0)).toBe(25);
    expect(refreshCost(1)).toBe(50);
    expect(refreshCost(2)).toBe(100);
    expect(refreshCost(3)).toBeNull();
  });

  it('quotes NEW STATS as 2 × sell × 1.5^n', () => {
    expect(calibrationCost(80, 0)).toBe(160);
    expect(calibrationCost(80, 1)).toBe(240);
    expect(calibrationCost(80, 2)).toBe(360);
    expect(calibrationCost(80, 3)).toBe(540);
    expect(calibrationCost(300, 0)).toBe(600);
    expect(calibrationCost(300, 1)).toBe(900);
    expect(calibrationCost(300, 2)).toBe(1350);
    expect(calibrationCost(300, 3)).toBe(2025);
  });

  it('does not call Math.random', () => {
    const source = new TextDecoder().decode(readFileSync('src/inventory/exchange.ts'));
    expect(source).not.toMatch(/Math\.random\s*\(/);
  });
});

describe('exchange shelf', () => {
  it('rolls 3 items at ×4, and rarity 3 only in slot 1 at ×5', () => {
    let r3 = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const shelf = rollShelf(new Rng(seed), seed, { ilvl: 1, lights: 0 });
      expect(shelf.visitSeed).toBe(seed);
      expect(shelf.offers).toHaveLength(3);
      shelf.offers.forEach((offer, index) => {
        expect(offer).not.toBeNull();
        if (!offer) return;
        expect(offer.gear.ilvl).toBe(1);
        expect(offer.priceCr).toBe(shelfPrice(offer.gear.rarity, 1));
        if (offer.gear.rarity === 3) {
          expect(index).toBe(0);
          expect(offer.priceMult).toBe(5);
          r3 += 1;
        } else {
          expect(offer.priceMult).toBe(4);
        }
      });
    }
    expect(r3).toBeGreaterThan(15);
    expect(r3).toBeLessThan(80);
  });

  it('finds a rarity-3 first slot priced at 750', () => {
    let found = false;
    for (let seed = 1; seed <= 500 && !found; seed++) {
      const first = rollShelf(new Rng(seed), seed, { ilvl: 1 }).offers[0];
      if (first?.gear.rarity === 3) {
        expect(first.priceCr).toBe(750);
        found = true;
      }
    }
    expect(found).toBe(true);
  });

  it('gives Lights II four places and replaces the last place with a rarity-1 weapon after death', () => {
    const wide = rollShelf(new Rng(2), 2, { ilvl: 2, lights: 2 });
    expect(wide.offers).toHaveLength(4);
    for (let seed = 1; seed <= 20; seed++) {
      const shelf = rollShelf(new Rng(seed), seed, { ilvl: 2, afterDeath: true });
      const last = shelf.offers[2];
      expect(last?.gear.slot).toBe('weapon');
      expect(last?.gear.rarity).toBe(1);
      expect(last?.priceCr).toBe(60);
    }
  });
});

describe('paid refresh and selling', () => {
  it('charges 25, then 50, then 100, and stops', () => {
    let state = addCredits(createInventoryState(), 1000).state;
    let shelf = rollShelf(new Rng(1), 7, { ilvl: 1 });
    for (const cost of [25, 50, 100]) {
      const before = getCredits(state);
      const result = paidRefresh(state, shelf, new Rng(before + shelf.refreshesUsed + 3));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(getCredits(result.state)).toBe(before - cost);
      expect(result.spent).toBe(cost);
      expect(result.shelf.refreshesUsed).toBe(shelf.refreshesUsed + 1);
      expect(result.shelf.visitSeed).toBe(7);
      expect(result.shelf.afterDeath).toBe(false);
      state = result.state;
      shelf = result.shelf;
    }
    const blocked = paidRefresh(state, shelf, new Rng(9));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe('maxRefresh');
    expect(getCredits(blocked.state)).toBe(getCredits(state));
    expect(blocked.shelf).toBe(shelf);
  });

  it('does not refresh when the credits are short', () => {
    const state = addCredits(createInventoryState(), -30).state;
    expect(getCredits(state)).toBe(20);
    const shelf = rollShelf(new Rng(1), 1);
    const result = paidRefresh(state, shelf, new Rng(2));
    expect(result.ok).toBe(false);
    expect(getCredits(result.state)).toBe(20);
    expect(result.shelf).toBe(shelf);
  });

  it('sells scrap, refuses Issue and Med-Patches, and asks twice for rarity 3', () => {
    let state = createInventoryState();
    const scrap = pickupItem(state, { itemId: SCRAP_ITEM_ID, count: 3 });
    expect(scrap.ok).toBe(true);
    state = scrap.state;
    const soldScrap = sell(state, { kind: 'bag', index: 0 });
    expect(soldScrap.ok).toBe(true);
    if (!soldScrap.ok) return;
    expect(soldScrap.gained).toBe(6);
    expect(getCredits(soldScrap.state)).toBe(56);

    const issue = sell(createInventoryState(), { kind: 'gear', slot: 'weapon' });
    expect(issue.ok).toBe(false);
    if (!issue.ok) expect(issue.reason).toBe('cantSell');
    expect(getGear(createInventoryState()).weapon?.tag).toBe('ISSUE');

    const patch = pickupItem(createInventoryState(), { itemId: MEDPATCH_ITEM_ID, count: 1 });
    expect(patch.ok).toBe(true);
    expect(canSell(patch.state.bag[0] ?? null)).toBe(false);
    const soldPatch = sell(patch.state, { kind: 'bag', index: 0 });
    expect(soldPatch.ok).toBe(false);
    expect(patch.state.bag[0]?.count).toBe(1);

    const rare = pickupItem(createInventoryState(), {
      itemId: GEAR_ITEM_IDS.armor,
      gear: {
        slot: 'armor',
        rarity: 3,
        ilvl: 1,
        affixes: [
          { id: 'M1_AFFIX_04', value: 19 },
          { id: 'M1_AFFIX_05', value: 7 },
          { id: 'M1_AFFIX_06', value: 26 },
        ],
      },
    });
    expect(rare.ok).toBe(true);
    state = rare.state;
    const first = sell(state, { kind: 'bag', index: 0 });
    expect(first.ok).toBe(false);
    if (!first.ok) expect(first.reason).toBe('needsConfirm');
    expect(getCredits(state)).toBe(50);
    expect(state.bag[0]).not.toBeNull();
    const second = sell(state, { kind: 'bag', index: 0 }, true);
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.gained).toBe(150);
    expect(getCredits(second.state)).toBe(200);
    expect(second.state.bag[0]).toBeNull();
  });
});

describe('buy, equip, die, buy again', () => {
  it('puts the purchase in the locker and lets the credits buy another after death', () => {
    let state = addCredits(createInventoryState(), 5000).state;
    const shelf = rollShelf(new Rng(3), 99, { ilvl: 1 });
    const first = shelf.offers[0];
    const second = shelf.offers[1];
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (!first || !second) return;
    const bought = buyOffer(state, shelf, 0);
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    state = bought.state;
    expect(getCredits(state)).toBe(5050 - first.priceCr);
    expect(bought.shelf.offers[0]).toBeNull();
    const locker = getLocker(state);
    expect(locker.usedSlots).toBe(1);
    const uid = locker.slots[0]?.uid;
    expect(uid).toBeGreaterThan(0);

    const equipped = equip(state, 0, 'locker');
    expect(equipped.ok).toBe(true);
    state = equipped.state;
    expect(getLocker(state).usedSlots).toBe(0);
    expect(state.gear[first.gear.slot]?.gear?.uid).toBe(uid);

    state = onDeath(state).state;
    const alive = [state.bag, state.locker, Object.values(state.gear)].flat();
    expect(alive.some((item) => item?.gear?.uid === uid)).toBe(false);
    if (first.gear.slot === 'weapon' || first.gear.slot === 'armor') {
      expect(getGear(state)[first.gear.slot]?.tag).toBe('ISSUE');
    } else {
      expect(state.gear[first.gear.slot]).toBeNull();
    }

    expect(getCredits(state)).toBeGreaterThanOrEqual(second.priceCr);
    const again = buyOffer(state, bought.shelf, 1);
    expect(again.ok).toBe(true);
    if (!again.ok) return;
    expect(getLocker(again.state).usedSlots).toBe(1);
    expect(getCredits(again.state)).toBe(getCredits(state) - second.priceCr);
  });

  it('stacks bought Med-Patches in the locker and will not sell them', () => {
    let state = addCredits(createInventoryState(), 200).state;
    const bought = buyMedPatch(state, 7);
    expect(bought.ok).toBe(true);
    if (!bought.ok) return;
    state = bought.state;
    expect(bought.spent).toBe(175);
    expect(getCredits(state)).toBe(250 - 175);
    const stacks = getLocker(state).slots.flatMap((slot) => (slot ? [slot.count] : []));
    expect(stacks.sort((a, b) => a - b)).toEqual([1, 6]);
    const sold = sell(state, { kind: 'locker', index: 0 });
    expect(sold.ok).toBe(false);
    expect(getLocker(state).usedSlots).toBe(2);
  });
});

describe('calibration', () => {
  function tuned(state: InventoryState) {
    return pickupItem(state, {
      itemId: GEAR_ITEM_IDS.armor,
      gear: {
        slot: 'armor',
        rarity: 2,
        ilvl: 3,
        nameId: 'M1_AFFIX_05',
        affixes: [
          { id: 'M1_AFFIX_05', value: 7 },
          { id: 'M1_AFFIX_04', value: 12 },
        ],
      },
    });
  }

  it('spends the fee when the player keeps the old roll', () => {
    let state = addCredits(createInventoryState(), 1000).state;
    const picked = tuned(state);
    expect(picked.ok).toBe(true);
    state = picked.state;
    const before = getCredits(state);
    const quote = quoteCalibration(state.bag[0] ?? null);
    expect(quote).toMatchObject({ eligible: true, costCr: 160, nextCostCr: 240, n: 0, sellCr: 80 });
    const begun = beginCalibration(state, { kind: 'bag', index: 0 }, new Rng(4));
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    expect(getCredits(begun.state)).toBe(before - 160);
    const kept = applyCalibration(begun.state, begun.offer, 'keep');
    expect(kept.ok).toBe(true);
    if (!kept.ok) return;
    expect(getCredits(kept.state)).toBe(before - 160);
    expect(kept.state.bag[0]?.gear?.affixes).toEqual([
      { id: 'M1_AFFIX_05', value: 7 },
      { id: 'M1_AFFIX_04', value: 12 },
    ]);
    expect(calibrationCount(kept.state.bag[0] ?? null)).toBe(1);
    expect(quoteCalibration(kept.state.bag[0] ?? null).costCr).toBe(240);
  });

  it('writes the new roll only when the player takes it', () => {
    let state = addCredits(createInventoryState(), 1000).state;
    state = tuned(state).state;
    const begun = beginCalibration(state, { kind: 'bag', index: 0 }, new Rng(8));
    expect(begun.ok).toBe(true);
    if (!begun.ok) return;
    const taken = applyCalibration(begun.state, begun.offer, 'take');
    expect(taken.ok).toBe(true);
    if (!taken.ok) return;
    expect(taken.state.bag[0]?.gear?.affixes).toEqual(begun.offer.newAffixes);
    expect(taken.state.bag[0]?.gear?.nameId).toBe(begun.offer.newNameId);
    expect(calibrationCount(taken.state.bag[0] ?? null)).toBe(1);
    expect(getCredits(taken.state)).toBe(getCredits(begun.state));
  });

  it('refuses rarity 1 and a short purse', () => {
    const common = pickupItem(createInventoryState(), {
      itemId: GEAR_ITEM_IDS.tool,
      gear: { slot: 'tool', rarity: 1, ilvl: 1, affixes: [{ id: 'M1_AFFIX_10', value: 5 }] },
    });
    expect(quoteCalibration(common.state.bag[0] ?? null).eligible).toBe(false);
    expect(quoteCalibration(common.state.bag[0] ?? null).reason).toBe('rarity');
    const poor = beginCalibration(common.state, { kind: 'bag', index: 0 }, new Rng(1));
    expect(poor.ok).toBe(false);
    expect(getCredits(common.state)).toBe(50);

    const tunedItem = tuned(createInventoryState());
    const broke = beginCalibration(tunedItem.state, { kind: 'bag', index: 0 }, new Rng(1));
    expect(broke.ok).toBe(false);
    if (!broke.ok) expect(broke.reason).toBe('insufficientCredits');
    expect(getCredits(tunedItem.state)).toBe(50);
  });
});

describe('damage reduction', () => {
  it('matches applyArmor and truncates the comparison to one decimal', () => {
    for (const armor of [0, 1, 6, 10, 30, 100, 150, 1000]) {
      const dr = drOfArmor(armor);
      expect(dr).toBeLessThanOrEqual(0.6);
      if (armor <= 0) expect(dr).toBe(0);
      else expect(dr).toBe(Math.min(0.6, armor / (armor + 100)));
      const raw = 100;
      const expected = armor <= 0 ? raw : Math.max(1, Math.floor(raw * (1 - dr)));
      expect(applyArmor(raw, armor, COMBAT_M1)).toBe(expected);
    }
    expect(formatDrPercent(30)).toBe('23%');
    expect(formatDrPercent(1)).toBe('0.9%');
    expect(formatDrPercent(1000)).toBe('60%');
    expect(formatDrCompare(0, 4)).toBe('+3.8% DR');
    expect(formatDrCompare(30, 6)).toBe('−17.4% DR');
  });
});

describe('inventory screen', () => {
  it('shows 4 slots and 12 bag cells, pauses outside combat, and not during a fight', () => {
    const host = root();
    const pauses: boolean[] = [];
    let state = createInventoryState();
    state.location = 'zone';
    const screen = mountInventoryScreen(host, {
      getState: () => state,
      commit: (next) => {
        state = next;
      },
      inCombat: false,
      onPause: (paused) => pauses.push(paused),
      place: 'zone',
    });
    expect(screen.isOpen).toBe(false);
    expect(pauses).toEqual([]);
    screen.open();
    expect(pauses).toEqual([true]);
    expect(host.querySelectorAll('[data-gear]')).toHaveLength(4);
    expect(host.querySelectorAll('[data-bag]')).toHaveLength(12);
    expect(host.querySelector('[data-gear="weapon"]')?.getAttribute('data-issue')).toBe('yes');
    expect(host.querySelector('[data-role="details"]')?.textContent).toContain(M1_COPY.M1_RISK_03);
    expect(host.querySelector('[data-role="combat-bar"]')?.hasAttribute('hidden')).toBe(true);

    screen.setInCombat(true);
    expect(pauses).toEqual([true, false]);
    const bar = host.querySelector('[data-role="combat-bar"]');
    expect(bar?.hasAttribute('hidden')).toBe(false);
    expect(bar?.textContent).toBe(M1_COPY.M1_UI_INV_COMBAT);
    expect(host.querySelector('.m1-screen')?.classList.contains('is-combat')).toBe(true);
    screen.destroy();

    const quiet: boolean[] = [];
    const fighting = mountInventoryScreen(host, {
      getState: () => state,
      commit: (next) => {
        state = next;
      },
      inCombat: true,
      onPause: (paused) => quiet.push(paused),
      place: 'zone',
    });
    fighting.open();
    expect(quiet).toEqual([]);
    expect(host.querySelector('[data-role="combat-bar"]')?.textContent).toBe(
      M1_COPY.M1_UI_INV_COMBAT,
    );
    fighting.destroy();
  });

  it('toggles with I, equips with F, and confirms a rare drop with X', () => {
    const host = root();
    let state = createInventoryState();
    state.location = 'zone';
    const picked = pickupItem(state, {
      itemId: GEAR_ITEM_IDS.armor,
      gear: {
        slot: 'armor',
        rarity: 3,
        ilvl: 1,
        affixes: [
          { id: 'M1_AFFIX_05', value: 4 },
          { id: 'M1_AFFIX_04', value: 19 },
          { id: 'M1_AFFIX_07', value: 9 },
        ],
      },
    });
    state = picked.state;
    state.location = 'zone';
    const dropped: string[] = [];
    const screen = mountInventoryScreen(host, {
      getState: () => state,
      commit: (next) => {
        state = next;
      },
      inCombat: false,
      onPause: () => {},
      place: 'zone',
      onDrop: (item) => dropped.push(item.itemId),
    });
    key('KeyI');
    expect(screen.isOpen).toBe(true);
    (host.querySelector('[data-bag="0"]') as HTMLButtonElement).click();
    expect(host.querySelector('[data-bag="0"]')?.getAttribute('data-risk')).toBe('yes');
    expect(host.querySelector('[data-role="details"]')?.textContent).toContain(M1_COPY.M1_RISK_02);
    expect(host.querySelector('[data-role="dr"]')?.textContent).toContain('+3.8% DR');

    key('KeyF');
    expect(state.gear.armor?.gear?.rarity).toBe(3);
    expect(getGear(state).armor?.tag).toBe('RISK');

    const back = unequip(state, 'armor', 'bag');
    expect(back.ok).toBe(true);
    state = back.state;
    screen.close();
    screen.open();
    (host.querySelector('[data-bag="0"]') as HTMLButtonElement).click();
    key('KeyX');
    expect(state.bag[0]).not.toBeNull();
    expect(dropped).toEqual([]);
    key('KeyX');
    expect(state.bag[0]).toBeNull();
    expect(dropped).toEqual([GEAR_ITEM_IDS.armor]);
    key('KeyI');
    expect(screen.isOpen).toBe(false);
    screen.destroy();
  });
});

describe('base hub', () => {
  it('shows orders and LIFT first, with LIFT at most three activations away', () => {
    const host = root();
    const calls = { lift: 0, orders: 0, exchange: 0, locker: 0, gear: 0, settings: 0 };
    const hub = mountBaseHub(host, {
      getData: () => ({
        credits: 312,
        gridPct: 30,
        medPatches: 2,
        medPatchMax: 6,
        stops: 1,
        orders: [
          { id: 'relay', title: 'Restore Relay', detail: 'depth 1 · 35 cr' },
          { id: 'path', title: 'Clear the Path', detail: 'depth 1 · 1 Med-Patch' },
          { id: 'sell', title: 'Sell one Tuned item', detail: '+50 cr' },
        ],
      }),
      onLift: () => {
        calls.lift += 1;
      },
      onOrders: () => {
        calls.orders += 1;
      },
      onExchange: () => {
        calls.exchange += 1;
      },
      onLocker: () => {
        calls.locker += 1;
      },
      onGear: () => {
        calls.gear += 1;
      },
      onSettings: () => {
        calls.settings += 1;
      },
    });
    const buttons = [...host.querySelectorAll('button')];
    expect(buttons[0]?.dataset.action).toBe('orders');
    expect(buttons[1]?.dataset.action).toBe('lift');
    const lift = host.querySelector<HTMLButtonElement>('[data-action="lift"]')!;
    expect(lift.textContent).toBe('LIFT');
    expect(lift.style.minWidth).toBe('160px');
    expect(lift.style.minHeight).toBe('56px');
    expect(lift.dataset.depart).toBe('now');
    for (const digit of ['1', '2', '3', '4', '5']) {
      expect(host.querySelector(`[data-shortcut="${digit}"]`)).not.toBeNull();
    }
    const stops = buttons.filter((button) => button.tabIndex >= 0);
    const from = stops.indexOf(document.activeElement as HTMLButtonElement);
    const to = stops.indexOf(lift);
    const steps = from < 0 ? to : Math.abs(to - from);
    expect(steps).toBeLessThanOrEqual(3);
    expect(host.textContent).toContain('Restore Relay');
    expect(host.textContent).toContain('Sell one Tuned item');
    expect(host.querySelector('pre')?.textContent).toContain(BASE_M1[0]!);
    expect(host.textContent).toContain('CREDITS 312 cr');
    expect(host.textContent).toContain('GRID 30%');

    lift.click();
    expect(calls.lift).toBe(1);
    key('Space');
    expect(calls.lift).toBe(1);
    key('Digit1');
    expect(calls.exchange).toBe(1);
    key('Digit5');
    expect(calls.lift).toBe(2);
    key('Digit4');
    expect(calls.orders).toBe(1);
    hub.destroy();

    const lit = root();
    const litHub = mountBaseHub(lit, {
      getData: () => ({
        credits: 0,
        gridPct: 0,
        medPatches: 0,
        medPatchMax: 6,
        stops: 1,
        lights: 1,
        orders: [],
      }),
      onLift: () => {},
      onOrders: () => {},
      onExchange: () => {},
      onLocker: () => {},
      onGear: () => {},
      onSettings: () => {},
    });
    const cables = lit.querySelectorAll('.m1-cable-on');
    expect(cables.length).toBeGreaterThan(0);
    expect([...cables].every((node) => node.textContent === '-')).toBe(true);
    expect(lit.querySelector('pre')?.dataset.lights).toBe('1');
    litHub.destroy();

    const css = new TextDecoder().decode(readFileSync('src/ui/m1-screens.css'));
    expect(css.includes('position: fixed')).toBe(false);
    expect(css.includes('position:fixed')).toBe(false);
    expect(css).toContain('16px');
  });
});

describe('locker screen', () => {
  it('shows the safe locker, stores, and takes', () => {
    const host = root();
    let state = setLockerSize(createInventoryState(), 1);
    state = pickupItem(state, { itemId: SCRAP_ITEM_ID, count: 4 }).state;
    const screen = mountLockerScreen(host, {
      getState: () => state,
      commit: (next) => {
        state = next;
      },
      onBack: () => {},
    });
    expect(host.querySelector('[data-role="locker-count"]')?.textContent).toContain('SAFE');
    expect(host.querySelector('[data-role="locker-count"]')?.textContent).toContain('0/40');
    expect(host.querySelector('[data-role="bag-count"]')?.textContent).toContain('CAN BE LOST');
    (host.querySelector('[data-bag="0"]') as HTMLButtonElement).click();
    expect(host.querySelector('[data-bag="0"]')?.getAttribute('data-risk')).toBe('yes');
    (host.querySelector('[data-action="store"]') as HTMLButtonElement).click();
    expect(getLocker(state).usedSlots).toBe(1);
    expect(state.bag[0]).toBeNull();
    (host.querySelector('[data-locker="0"]') as HTMLButtonElement).click();
    expect(host.querySelector('[data-locker="0"]')?.hasAttribute('data-risk')).toBe(false);
    (host.querySelector('[data-action="take"]') as HTMLButtonElement).click();
    expect(state.bag[0]?.count).toBe(4);
    expect(getLocker(state).usedSlots).toBe(0);
    screen.destroy();
  });
});

describe('exchange screen', () => {
  it('lists the Med-Patch at 25 cr and the shelf prices', () => {
    const host = root();
    let state = addCredits(createInventoryState(), 1000).state;
    let shelf = rollShelf(new Rng(11), 11, { ilvl: 1 });
    const screen = mountExchangeScreen(host, {
      getState: () => state,
      commit: (next) => {
        state = next;
      },
      getShelf: () => shelf,
      setShelf: (next) => {
        shelf = next;
      },
      rng: new Rng(20),
      onBack: () => {},
    });
    const patch = host.querySelector<HTMLButtonElement>('[data-action="buy-medpatch"]')!;
    expect(patch.dataset.price).toBe('25');
    shelf.offers.forEach((offer, index) => {
      const button = host.querySelector<HTMLButtonElement>(
        `[data-action="buy-shelf"][data-index="${index}"]`,
      );
      expect(button?.dataset.price).toBe(String(offer?.priceCr));
    });
    patch.click();
    expect(getCredits(state)).toBe(1050 - 25);
    expect(getLocker(state).slots.some((slot) => slot?.id === MEDPATCH_ITEM_ID)).toBe(true);
    const before = getCredits(state);
    (host.querySelector('[data-action="refresh"]') as HTMLButtonElement).click();
    expect(getCredits(state)).toBe(before - 25);
    expect(shelf.refreshesUsed).toBe(1);
    screen.destroy();
  });
});

describe('session report', () => {
  const data = {
    outcome: 'evac' as const,
    timeInZone: '7:42',
    depth: 2,
    itemsBroughtBack: 9,
    itemsLeftInZone: 0,
    creditsGained: 186,
    creditsLost: 0,
    gridPct: 30,
    gridDeltaPct: 10,
    kills: 14,
    killedBy: null,
    orders: [{ title: 'Restore Relay', result: 'DONE +40 cr' }],
    permanentChanges: ['Dash 23/40'],
  };

  it('prints the logged numbers, waits to continue, and leaves the export slot empty', () => {
    const host = root();
    const continued = vi.fn();
    const screen = mountReportScreen(host, data, { onContinue: continued });
    expect(host.textContent).toContain(M1_COPY.M1_BASE_11);
    expect(host.querySelector('[data-field="time"]')?.textContent).toContain('7:42');
    expect(host.querySelector('[data-field="depth"]')?.textContent).toContain('2');
    expect(host.querySelector('[data-field="items-in"]')?.textContent).toContain('9');
    expect(host.querySelector('[data-field="credits-gained"]')?.textContent).toContain('+186');
    expect(host.querySelector('[data-field="grid"]')?.textContent).toContain('30%');
    expect(host.querySelector('[data-field="grid"]')?.textContent).toContain('(+10%)');
    expect(host.querySelector('[data-field="kills"]')?.textContent).toContain('14');
    expect(host.querySelector('[data-field="permanent"]')?.textContent).toContain('Dash 23/40');
    expect(host.querySelector('[data-field="footer"]')?.textContent).toBe(M1_COPY.M1_BASE_13);
    const slot = screen.exportSlot;
    expect(slot.dataset.slot).toBe('export-reminder');
    expect(slot.childElementCount).toBe(0);
    slot.append(document.createElement('p'));
    expect(slot.childElementCount).toBe(1);

    const button = host.querySelector<HTMLButtonElement>('[data-action="continue"]')!;
    expect(button.disabled).toBe(true);
    button.click();
    key('Enter');
    key('Space');
    expect(continued).not.toHaveBeenCalled();
    screen.advance(799);
    expect(button.disabled).toBe(true);
    screen.advance(1);
    expect(button.disabled).toBe(false);
    key('Space');
    expect(continued).not.toHaveBeenCalled();
    button.click();
    expect(continued).toHaveBeenCalledOnce();
    screen.destroy();
  });

  it('uses the death footers and skips a null row', () => {
    expect(reportFooter({ ...data, outcome: 'death', itemsLeftInZone: 9, creditsLost: 412 })).toBe(
      M1_COPY.M1_BASE_14,
    );
    expect(reportFooter({ ...data, outcome: 'death', itemsLeftInZone: 0, creditsLost: 0 })).toBe(
      M1_COPY.M1_BASE_14B,
    );
    const host = root();
    const screen = mountReportScreen(
      host,
      {
        ...data,
        outcome: 'death',
        itemsBroughtBack: null,
        itemsLeftInZone: 9,
        creditsLost: 412,
        creditsGained: null,
        kills: null,
        killedBy: 'Curfew Guard',
      },
      { onContinue: () => {} },
    );
    expect(host.querySelector('[data-field="items-in"]')).toBeNull();
    expect(host.querySelector('[data-field="kills"]')).toBeNull();
    expect(host.querySelector('[data-field="killed-by"]')?.textContent).toContain('Curfew Guard');
    expect(host.querySelector('[data-field="lost"]')?.textContent).toContain('412 cr (9 items)');
    expect(host.querySelector('[data-field="footer"]')?.textContent).toBe(M1_COPY.M1_BASE_14);
    screen.destroy();
  });
});

describe('risk explainer', () => {
  it('shows once, after a loss, and the second death stays quiet', () => {
    let flag = { seen: false };
    expect(shouldShowRiskExplainer({ seen: flag.seen, atRisk: 40 })).toBe(true);
    expect(shouldShowRiskExplainer({ seen: false, atRisk: 0 })).toBe(false);
    flag = markSeen(flag);
    expect(flag.seen).toBe(true);
    expect(shouldShowRiskExplainer({ seen: flag.seen, atRisk: 80 })).toBe(false);
    const [loss, safe] = riskPages(9, 412);
    expect(loss).toContain('9 items');
    expect(loss).toContain('412 cr');
    expect(loss).toContain('You cannot get them back');
    expect(safe).toContain('Safe: your locker');
    expect(safe.includes('[[PAGE]]')).toBe(false);
  });

  it('holds NEXT for 1500 ms and OK for 500 ms', () => {
    const host = root();
    const ok = vi.fn();
    const panel = mountRiskExplainer(host, { itemsLost: 2, crLost: 15, onOk: ok });
    const next = host.querySelector<HTMLButtonElement>('[data-action="next"]')!;
    const done = host.querySelector<HTMLButtonElement>('[data-action="ok"]')!;
    expect(next.disabled).toBe(true);
    panel.advance(1499);
    expect(next.disabled).toBe(true);
    next.click();
    key('Enter');
    key('Space');
    expect(panel.page).toBe(0);
    panel.advance(1);
    expect(next.disabled).toBe(false);
    key('Space');
    expect(panel.page).toBe(0);
    next.click();
    expect(panel.page).toBe(1);
    expect(done.hidden).toBe(false);
    expect(done.disabled).toBe(true);
    panel.advance(499);
    expect(done.disabled).toBe(true);
    done.click();
    expect(ok).not.toHaveBeenCalled();
    panel.advance(1);
    expect(done.disabled).toBe(false);
    key('Space');
    expect(ok).not.toHaveBeenCalled();
    done.click();
    expect(ok).toHaveBeenCalledOnce();
    panel.destroy();
  });
});
