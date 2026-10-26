// Exchange shelf, buy, sell, paid refresh, and NEW STATS (T28).
// Numbers: design/balans-m1.md §4. Call rollShelf after every expedition, including death.
// Bought gear and Med-Patches go into the locker. Issue and Med-Patches are not sold.
// Grid-Grade (rarity 3) needs a second confirm. The calibration fee is spent before the
// player keeps or takes the new roll, and it is not returned.
// Randomness comes only from the Rng argument. This file never calls Math.random.
//
// newStatsCount is stored on the gear object (balans §4). inventory save v1 drops unknown
// gear fields on load, so the host must keep calibrationCounts() somewhere the save owns
// and stamp them back with applyCalibrationCounts() after a load.

import type { Rng } from '../core/rng';
import type { LightsLevel } from '../data/inventory-m1';
import { GEAR_SLOTS, ISSUE_FOR_SLOT, ITEM_DEFS, MEDPATCH_ITEM_ID } from '../data/inventory-m1';
import type { ItemSlot, Rarity } from '../data/style';
import { gearSellPrice, rollGear } from '../loot/roll';
import type { LootDepth, LootGear } from '../loot/types';
import { addCredits, unitValueCr } from './inventory';
import type { GearInfo, InvItem, InventoryState } from './types';

export const MEDPATCH_BUY_PRICE = 25;
export const SHOP_PRICE_MULT = 4;
export const SHOP_R3_PRICE_MULT = 5;
/** 0-based index. Balans SHOP_R3_SLOT = 1 (the first place on the shelf). */
export const SHOP_R3_SLOT = 0;
export const SHOP_R1_PERCENT = 70;
export const REFRESH_COSTS = [25, 50, 100] as const;
export const REFRESH_MAX_PER_VISIT = 3;
export const NEWSTATS_COST_MULT = 2;
export const NEWSTATS_COST_GROWTH = 1.5;
export const NEWSTATS_MIN_RARITY = 2;

const SHOP_STOCK_BY_LIGHTS: Readonly<Record<LightsLevel, number>> = { 0: 3, 1: 3, 2: 4, 3: 4 };
const SHOP_R3_PERCENT_BY_LIGHTS: Readonly<Record<LightsLevel, number>> = {
  0: 10,
  1: 10,
  2: 10,
  3: 20,
};

export type ExchangeFail =
  | 'insufficientCredits'
  | 'lockerFull'
  | 'badIndex'
  | 'emptySlot'
  | 'cantSell'
  | 'needsConfirm'
  | 'notInBase'
  | 'notGear'
  | 'rarity'
  | 'issue'
  | 'contractItem'
  | 'maxRefresh'
  | 'badAmount'
  | 'noOffer'
  | 'unknownItem'
  | 'missing';

export interface ShelfOffer {
  index: number;
  gear: LootGear;
  sellCr: number;
  priceCr: number;
  priceMult: number;
}

export interface ExchangeShelf {
  visitSeed: number;
  ilvl: LootDepth;
  lights: LightsLevel;
  /** First shelf after a death: the last place is a rarity-1 weapon (SHOP_DEATH_WEAPON). */
  afterDeath: boolean;
  offers: (ShelfOffer | null)[];
  refreshesUsed: number;
}

export interface RollShelfOptions {
  ilvl?: LootDepth;
  lights?: LightsLevel;
  afterDeath?: boolean;
  refreshesUsed?: number;
}

export type ItemRef =
  | { kind: 'bag'; index: number }
  | { kind: 'locker'; index: number }
  | { kind: 'gear'; slot: ItemSlot };

export interface CalibrationQuote {
  eligible: boolean;
  reason?: 'empty' | 'issue' | 'notGear' | 'rarity';
  costCr: number;
  /** Calibrations already paid on this piece. */
  n: number;
  /** Cost of the calibration after this one. Show it before the player pays. */
  nextCostCr: number;
  sellCr: number;
}

export interface AffixView {
  id: string;
  value: number;
}

export interface CalibrationOffer {
  uid: number;
  costCr: number;
  /** Count before this payment. The piece is stored at n + 1 once payment lands. */
  n: number;
  oldAffixes: AffixView[];
  newAffixes: AffixView[];
  oldNameId?: string;
  newNameId: string;
}

type GearCal = GearInfo & { newStatsCount?: number };

export function shopStock(lights: LightsLevel): number {
  return SHOP_STOCK_BY_LIGHTS[lights];
}

export function shopR3Percent(lights: LightsLevel): number {
  return SHOP_R3_PERCENT_BY_LIGHTS[lights];
}

/** Shelf price. Rarity 3 is ×5 and only rolled into slot 1. Everything else is ×4. */
export function shelfPrice(rarity: Rarity, ilvl: LootDepth): number {
  const sell = gearSellPrice(rarity, ilvl);
  return sell * (rarity === 3 ? SHOP_R3_PRICE_MULT : SHOP_PRICE_MULT);
}

/** 2 × sell price × 1.5^n, rounded to the nearest credit. */
export function calibrationCost(sellCr: number, n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new Error('exchange: bad calibration count');
  if (!Number.isInteger(sellCr) || sellCr < 0) throw new Error('exchange: bad sell price');
  return Math.round(NEWSTATS_COST_MULT * sellCr * NEWSTATS_COST_GROWTH ** n);
}

export function calibrationCount(item: InvItem | null): number {
  const n = (item?.gear as GearCal | undefined)?.newStatsCount;
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : 0;
}

/** uid → paid calibrations. Host can put this map in its own save section. */
export function calibrationCounts(state: InventoryState): Record<number, number> {
  const out: Record<number, number> = {};
  for (const item of eachItem(state)) {
    const n = calibrationCount(item);
    const uid = item?.gear?.uid;
    if (item && uid !== undefined && n > 0) out[uid] = n;
  }
  return out;
}

/** Stamp counts back onto gear after a load that dropped newStatsCount. */
export function applyCalibrationCounts(
  state: InventoryState,
  counts: Readonly<Record<number, number>>,
): InventoryState {
  const next = cloneState(state);
  for (const item of eachItem(next)) {
    const uid = item?.gear?.uid;
    if (!item?.gear || uid === undefined) continue;
    const n = counts[uid];
    if (n === undefined) continue;
    if (!Number.isInteger(n) || n < 0) throw new Error('exchange: bad calibration count');
    (item.gear as GearCal).newStatsCount = n;
  }
  return next;
}

export function refreshCost(refreshesUsed: number): number | null {
  if (
    !Number.isInteger(refreshesUsed) ||
    refreshesUsed < 0 ||
    refreshesUsed >= REFRESH_MAX_PER_VISIT
  ) {
    return null;
  }
  return REFRESH_COSTS[refreshesUsed] ?? null;
}

function rollShopRarity(rng: Rng, slotIndex: number, r3Percent: number): Rarity {
  if (slotIndex === SHOP_R3_SLOT && rng.int(1, 100) <= r3Percent) return 3;
  return rng.int(1, 100) <= SHOP_R1_PERCENT ? 1 : 2;
}

/**
 * Roll the shelf for one base visit.
 * `rng` is the only random source. `visitSeed` is stored so a later paid refresh
 * stays on the same visit (the refresh counter resets when the host rolls again).
 */
export function rollShelf(rng: Rng, visitSeed: number, opts: RollShelfOptions = {}): ExchangeShelf {
  const ilvl = opts.ilvl ?? 1;
  const lights = opts.lights ?? 0;
  const afterDeath = opts.afterDeath ?? false;
  const stock = shopStock(lights);
  const offers: ShelfOffer[] = [];
  for (let index = 0; index < stock; index++) {
    const deathWeapon = afterDeath && index === stock - 1;
    const rarity = deathWeapon ? 1 : rollShopRarity(rng, index, shopR3Percent(lights));
    const gear = deathWeapon
      ? rollGear(rng, ilvl, { rarity: 1, slot: 'weapon' })
      : rollGear(rng, ilvl, { rarity });
    const sellCr = gearSellPrice(gear.rarity, gear.ilvl);
    const priceMult = gear.rarity === 3 ? SHOP_R3_PRICE_MULT : SHOP_PRICE_MULT;
    offers.push({ index, gear, sellCr, priceCr: sellCr * priceMult, priceMult });
  }
  return {
    visitSeed,
    ilvl,
    lights,
    afterDeath,
    offers,
    refreshesUsed: opts.refreshesUsed ?? 0,
  };
}

export function paidRefresh(
  state: InventoryState,
  shelf: ExchangeShelf,
  rng: Rng,
):
  | { ok: true; state: InventoryState; shelf: ExchangeShelf; spent: number }
  | {
      ok: false;
      state: InventoryState;
      shelf: ExchangeShelf;
      reason: 'maxRefresh' | 'insufficientCredits' | 'notInBase';
    } {
  if (state.location !== 'base') return { ok: false, state, shelf, reason: 'notInBase' };
  const cost = refreshCost(shelf.refreshesUsed);
  if (cost === null) return { ok: false, state, shelf, reason: 'maxRefresh' };
  const paid = addCredits(state, -cost);
  if (!paid.ok) return { ok: false, state, shelf, reason: 'insufficientCredits' };
  const next = rollShelf(rng, shelf.visitSeed, {
    ilvl: shelf.ilvl,
    lights: shelf.lights,
    afterDeath: false,
    refreshesUsed: shelf.refreshesUsed + 1,
  });
  return { ok: true, state: paid.state, shelf: next, spent: cost };
}

/**
 * Put `item` in the locker using the same rules as moveToLocker (stackables merge,
 * gear takes the first empty place). The caller's state is not mutated: the locker
 * arrays on a clone are. inventory.ts has no direct insert, and a full bag must not
 * block a purchase that never enters the bag.
 */
export function insertLocker(
  state: InventoryState,
  item: InvItem,
):
  { ok: true; state: InventoryState } | { ok: false; state: InventoryState; reason: ExchangeFail } {
  if (state.location !== 'base') return { ok: false, state, reason: 'notInBase' };
  const def = ITEM_DEFS[item.itemId];
  if (!def) return { ok: false, state, reason: 'unknownItem' };
  if (def.category === 'issue') return { ok: false, state, reason: 'issue' };
  if (def.category === 'contract') return { ok: false, state, reason: 'contractItem' };
  if (!Number.isInteger(item.count) || item.count < 1)
    return { ok: false, state, reason: 'badAmount' };
  if (def.category === 'gear') {
    if (!item.gear || item.gear.slot !== def.slot) return { ok: false, state, reason: 'notGear' };
    if (!state.locker.includes(null)) return { ok: false, state, reason: 'lockerFull' };
  } else if (lockerRoom(state, item.itemId) < item.count) {
    return { ok: false, state, reason: 'lockerFull' };
  }

  const next = cloneState(state);
  if (def.stack > 1) {
    const placed = putStack(next.locker, item.itemId, item.count);
    if (placed !== item.count) return { ok: false, state, reason: 'lockerFull' };
  } else {
    const index = next.locker.indexOf(null);
    if (index < 0) return { ok: false, state, reason: 'lockerFull' };
    const gear = copyGear(item.gear!);
    if (gear.uid <= 0) gear.uid = next.nextUid++;
    next.locker[index] = { itemId: def.id, count: 1, gear };
  }
  return { ok: true, state: next };
}

export function buyMedPatch(
  state: InventoryState,
  count = 1,
):
  | { ok: true; state: InventoryState; spent: number }
  | {
      ok: false;
      state: InventoryState;
      reason: ExchangeFail;
    } {
  if (!Number.isInteger(count) || count < 1) return { ok: false, state, reason: 'badAmount' };
  const spent = MEDPATCH_BUY_PRICE * count;
  if (state.baseCr < spent) return { ok: false, state, reason: 'insufficientCredits' };
  const inserted = insertLocker(state, { itemId: MEDPATCH_ITEM_ID, count });
  if (!inserted.ok) return inserted;
  const paid = addCredits(inserted.state, -spent);
  if (!paid.ok) return { ok: false, state, reason: 'insufficientCredits' };
  return { ok: true, state: paid.state, spent };
}

export function buyOffer(
  state: InventoryState,
  shelf: ExchangeShelf,
  index: number,
):
  | { ok: true; state: InventoryState; shelf: ExchangeShelf }
  | {
      ok: false;
      state: InventoryState;
      shelf: ExchangeShelf;
      reason: ExchangeFail;
    } {
  if (!Number.isInteger(index) || index < 0 || index >= shelf.offers.length) {
    return { ok: false, state, shelf, reason: 'badIndex' };
  }
  const offer = shelf.offers[index];
  if (!offer) return { ok: false, state, shelf, reason: 'noOffer' };
  if (state.baseCr < offer.priceCr)
    return { ok: false, state, shelf, reason: 'insufficientCredits' };
  const inserted = insertLocker(state, offerToItem(offer.gear));
  if (!inserted.ok) return { ok: false, state, shelf, reason: inserted.reason };
  const paid = addCredits(inserted.state, -offer.priceCr);
  if (!paid.ok) return { ok: false, state, shelf, reason: 'insufficientCredits' };
  const offers = shelf.offers.map((row, i) => (i === index ? null : row));
  return { ok: true, state: paid.state, shelf: { ...shelf, offers } };
}

export function canSell(item: InvItem | null): boolean {
  if (!item) return false;
  const def = ITEM_DEFS[item.itemId];
  if (!def?.sellable) return false;
  if (def.category === 'issue' || def.category === 'medPatch') return false;
  return unitValueCr(item) > 0;
}

export function sell(
  state: InventoryState,
  ref: ItemRef,
  confirmRare = false,
):
  | { ok: true; state: InventoryState; gained: number }
  | {
      ok: false;
      state: InventoryState;
      reason: ExchangeFail;
      /** Set when rarity 3 is waiting for the second confirm. The state is unchanged. */
      priceCr?: number;
    } {
  if (state.location !== 'base') return { ok: false, state, reason: 'notInBase' };
  const item = readAt(state, ref);
  if (!item) return { ok: false, state, reason: refInRange(state, ref) ? 'emptySlot' : 'badIndex' };
  if (!canSell(item)) return { ok: false, state, reason: 'cantSell' };
  const priceCr = unitValueCr(item) * item.count;
  if (item.gear && item.gear.rarity === 3 && !confirmRare) {
    return { ok: false, state, reason: 'needsConfirm', priceCr };
  }
  const removed = removeAt(state, ref, item.count);
  if (!removed.ok) return { ok: false, state, reason: removed.reason };
  const paid = addCredits(removed.state, priceCr);
  if (!paid.ok) return { ok: false, state, reason: 'insufficientCredits' };
  return { ok: true, state: paid.state, gained: priceCr };
}

export function quoteCalibration(item: InvItem | null): CalibrationQuote {
  const blank: CalibrationQuote = { eligible: false, costCr: 0, n: 0, nextCostCr: 0, sellCr: 0 };
  if (!item) return { ...blank, reason: 'empty' };
  const def = ITEM_DEFS[item.itemId];
  if (!def || def.category === 'issue') return { ...blank, reason: 'issue' };
  if (def.category !== 'gear' || !item.gear) return { ...blank, reason: 'notGear' };
  if (item.gear.rarity < NEWSTATS_MIN_RARITY) return { ...blank, reason: 'rarity' };
  const sellCr = unitValueCr(item);
  const n = calibrationCount(item);
  return {
    eligible: true,
    costCr: calibrationCost(sellCr, n),
    nextCostCr: calibrationCost(sellCr, n + 1),
    n,
    sellCr,
  };
}

/**
 * Pay the fee and roll a new affix set. The piece keeps its old affixes until
 * applyCalibration. newStatsCount increases now, so a closed window cannot buy
 * the same n again. The fee is already gone if the player later keeps the old roll.
 */
export function beginCalibration(
  state: InventoryState,
  ref: ItemRef,
  rng: Rng,
):
  | { ok: true; state: InventoryState; offer: CalibrationOffer }
  | {
      ok: false;
      state: InventoryState;
      reason: ExchangeFail;
    } {
  if (state.location !== 'base') return { ok: false, state, reason: 'notInBase' };
  const item = readAt(state, ref);
  if (!item) return { ok: false, state, reason: refInRange(state, ref) ? 'emptySlot' : 'badIndex' };
  const quote = quoteCalibration(item);
  if (!quote.eligible || !item.gear) {
    return {
      ok: false,
      state,
      reason: quote.reason === 'rarity' ? 'rarity' : quote.reason === 'issue' ? 'issue' : 'notGear',
    };
  }
  const rolled = rollGear(rng, item.gear.ilvl, { rarity: item.gear.rarity, slot: item.gear.slot });
  const paid = addCredits(state, -quote.costCr);
  if (!paid.ok) return { ok: false, state, reason: 'insufficientCredits' };
  const next = paid.state;
  const stored = readAt(next, ref);
  if (!stored?.gear) return { ok: false, state, reason: 'missing' };
  (stored.gear as GearCal).newStatsCount = quote.n + 1;
  const offer: CalibrationOffer = {
    uid: stored.gear.uid,
    costCr: quote.costCr,
    n: quote.n,
    oldAffixes: copyAffixes(item.gear.affixes),
    newAffixes: rolled.affixes.map((affix) => ({ id: affix.id, value: affix.value })),
    newNameId: rolled.nameId,
  };
  if (item.gear.nameId !== undefined) offer.oldNameId = item.gear.nameId;
  return { ok: true, state: next, offer };
}

/** KEEP OLD leaves the affixes. TAKE NEW writes the rolled set. The fee stays spent either way. */
export function applyCalibration(
  state: InventoryState,
  offer: CalibrationOffer,
  choice: 'keep' | 'take',
):
  { ok: true; state: InventoryState } | { ok: false; state: InventoryState; reason: ExchangeFail } {
  const current = findByUid(state, offer.uid);
  if (!current?.gear) return { ok: false, state, reason: 'missing' };
  if (choice === 'keep') return { ok: true, state };
  const next = cloneState(state);
  const item = findByUid(next, offer.uid);
  if (!item?.gear) return { ok: false, state, reason: 'missing' };
  item.gear.affixes = offer.newAffixes.map((affix) => ({ id: affix.id, value: affix.value }));
  item.gear.nameId = offer.newNameId;
  return { ok: true, state: next };
}

function offerToItem(gear: LootGear): InvItem {
  return {
    itemId: gear.itemId,
    count: 1,
    gear: {
      uid: 0,
      slot: gear.slot,
      rarity: gear.rarity,
      ilvl: gear.ilvl,
      nameId: gear.nameId,
      affixes: gear.affixes.map((affix) => ({ id: affix.id, value: affix.value })),
    },
  };
}

function lockerRoom(state: InventoryState, itemId: string): number {
  const def = ITEM_DEFS[itemId];
  if (!def) return 0;
  let room = 0;
  for (const slot of state.locker) {
    if (slot === null) room += def.stack;
    else if (slot.itemId === itemId) room += def.stack - slot.count;
  }
  return room;
}

/** Same stacking as inventory.putStackable: fill partial stacks, then empty places. */
function putStack(slots: (InvItem | null)[], itemId: string, count: number): number {
  const def = ITEM_DEFS[itemId];
  if (!def) return 0;
  let left = count;
  for (const slot of slots) {
    if (left <= 0) break;
    if (slot && slot.itemId === itemId && slot.count < def.stack) {
      const n = Math.min(def.stack - slot.count, left);
      slot.count += n;
      left -= n;
    }
  }
  for (let i = 0; i < slots.length && left > 0; i++) {
    if (slots[i] === null) {
      const n = Math.min(def.stack, left);
      slots[i] = { itemId, count: n };
      left -= n;
    }
  }
  return count - left;
}

function copyGear(gear: GearInfo): GearCal {
  const copy: GearCal = {
    uid: gear.uid,
    slot: gear.slot,
    rarity: gear.rarity,
    ilvl: gear.ilvl,
  };
  if (gear.nameId !== undefined) copy.nameId = gear.nameId;
  if (gear.affixes) copy.affixes = copyAffixes(gear.affixes);
  const n = (gear as GearCal).newStatsCount;
  if (n !== undefined) copy.newStatsCount = n;
  return copy;
}

function copyAffixes(affixes: { id: string; value: number }[] | undefined): AffixView[] {
  return (affixes ?? []).map((affix) => ({ id: affix.id, value: affix.value }));
}

function copyItem(item: InvItem): InvItem {
  const copy: InvItem = { itemId: item.itemId, count: item.count };
  if (item.gear) copy.gear = copyGear(item.gear);
  if (item.contractId !== undefined) copy.contractId = item.contractId;
  return copy;
}

function cloneState(state: InventoryState): InventoryState {
  return {
    location: state.location,
    bag: state.bag.map((item) => (item ? copyItem(item) : null)),
    gear: {
      weapon: state.gear.weapon ? copyItem(state.gear.weapon) : null,
      armor: state.gear.armor ? copyItem(state.gear.armor) : null,
      module: state.gear.module ? copyItem(state.gear.module) : null,
      tool: state.gear.tool ? copyItem(state.gear.tool) : null,
    },
    locker: state.locker.map((item) => (item ? copyItem(item) : null)),
    zoneCr: state.zoneCr,
    baseCr: state.baseCr,
    nextUid: state.nextUid,
  };
}

function eachItem(state: InventoryState): (InvItem | null)[] {
  return [...state.bag, ...state.locker, ...GEAR_SLOTS.map((slot) => state.gear[slot])];
}

function readAt(state: InventoryState, ref: ItemRef): InvItem | null {
  if (!refInRange(state, ref)) return null;
  if (ref.kind === 'bag') return state.bag[ref.index] ?? null;
  if (ref.kind === 'locker') return state.locker[ref.index] ?? null;
  return state.gear[ref.slot];
}

function refInRange(state: InventoryState, ref: ItemRef): boolean {
  if (ref.kind === 'bag')
    return Number.isInteger(ref.index) && ref.index >= 0 && ref.index < state.bag.length;
  if (ref.kind === 'locker') {
    return Number.isInteger(ref.index) && ref.index >= 0 && ref.index < state.locker.length;
  }
  return GEAR_SLOTS.includes(ref.slot);
}

function issueFor(slot: ItemSlot): InvItem | null {
  const id = ISSUE_FOR_SLOT[slot];
  return id ? { itemId: id, count: 1 } : null;
}

function removeAt(
  state: InventoryState,
  ref: ItemRef,
  count: number,
): { ok: true; state: InventoryState } | { ok: false; reason: ExchangeFail } {
  const next = cloneState(state);
  const item = readAt(next, ref);
  if (!item) return { ok: false, reason: 'emptySlot' };
  if (!Number.isInteger(count) || count < 1 || count > item.count)
    return { ok: false, reason: 'badAmount' };
  if (ref.kind === 'gear') {
    next.gear[ref.slot] = issueFor(ref.slot);
    return { ok: true, state: next };
  }
  const box = ref.kind === 'bag' ? next.bag : next.locker;
  if (count === item.count) box[ref.index] = null;
  else item.count -= count;
  return { ok: true, state: next };
}

function findByUid(state: InventoryState, uid: number): InvItem | null {
  for (const item of eachItem(state)) if (item?.gear?.uid === uid) return item;
  return null;
}
