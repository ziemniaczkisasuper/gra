// Run inventory M1 – pure logic (no DOM, no bus, no RNG). Owner: LUZ / Pracownik 2; wiring: Silnik.
// Every operation takes an InventoryState and returns a NEW state (input is never mutated) plus
// the 'inventory:changed' events to emit and, where relevant, contract inputs (ContractInputEvent).
// Rules: design/mechaniki-m1.md v0.5.2 §2.3, §2.7, §2.12, §2.15; numbers: design/balans-m1.md.
// Nothing here rolls dice: chest / floor contents come ready from the zone generator through
// pickupItem(). If something ever needs randomness: state.rng.stream('loot'), never Math.random.
import type { GameState } from '../core/game';
import type { ContractReward } from '../data/contracts-m1';
import {
  BACKPACK_SLOTS,
  COPPER_ITEM_ID,
  DATA_CORE_ITEM_ID,
  GEAR_ITEM_IDS,
  GEAR_SELL_VALUE,
  GEAR_SLOTS,
  ISSUE_FOR_SLOT,
  ITEM_DEFS,
  MEDPATCH_ITEM_ID,
  MEDPATCH_MAX,
  SCRAP_ITEM_ID,
  START_CREDITS,
  STASH_SLOTS_BY_LIGHTS,
  medPatchTopUpFor,
  type ItemDef,
  type LightsLevel,
} from '../data/inventory-m1';
import { LOOT_RARITY } from '../data/style';
import type {
  ContractInputEvent,
  DeathLoss,
  DeathResult,
  DropResult,
  GearInfo,
  GearView,
  InvFailReason,
  InvItem,
  InvResult,
  InventoryChangeReason,
  InventoryOutputEvent,
  InventoryState,
  ItemSlot,
  ItemStack,
  ItemTag,
  LockerView,
  PickupInput,
  PickupResult,
  RewardResult,
  RunInventory,
  TopUpResult,
} from './types';

export const INVENTORY_SECTION = 'inventory';

// ---- state access (GameState ↔ section) ---------------------------------------------------------

/** Brand-new inventory: empty bag and locker, Issue Pole + Issue Suit equipped, START_CREDITS. */
export function createInventoryState(lights: LightsLevel = 0): InventoryState {
  return {
    location: 'base',
    bag: Array.from({ length: BACKPACK_SLOTS }, () => null),
    gear: {
      weapon: issueItem('weapon'),
      armor: issueItem('armor'),
      module: null,
      tool: null,
    },
    locker: Array.from({ length: STASH_SLOTS_BY_LIGHTS[lights] }, () => null),
    zoneCr: 0,
    baseCr: START_CREDITS,
    nextUid: 1,
  };
}

/** Inventory stored in state.sections.inventory (fresh one if not there yet – not stored). */
export function getInventory(state: GameState): InventoryState {
  const s = state.sections[INVENTORY_SECTION] as InventoryState | undefined;
  return s ?? createInventoryState();
}

export function setInventory(state: GameState, inv: InventoryState): void {
  state.sections[INVENTORY_SECTION] = inv;
}

/** Read-only getters accept either the GameState or an InventoryState. */
export type InvSource = GameState | InventoryState;

function src(s: InvSource): InventoryState {
  return 'sections' in s ? getInventory(s) : s;
}

// ---- helpers ------------------------------------------------------------------------------------

function issueItem(slot: ItemSlot): InvItem | null {
  const id = ISSUE_FOR_SLOT[slot];
  return id ? { itemId: id, count: 1 } : null;
}

function defOf(it: InvItem): ItemDef {
  const d = ITEM_DEFS[it.itemId];
  if (!d) throw new Error(`Unknown item id: ${it.itemId}`);
  return d;
}

const copyItem = (it: InvItem): InvItem => ({
  ...it,
  ...(it.gear
    ? {
        gear: {
          ...it.gear,
          ...(it.gear.base ? { base: { ...it.gear.base } } : {}),
          ...(it.gear.affixes ? { affixes: it.gear.affixes.map((a) => ({ ...a })) } : {}),
        },
      }
    : {}),
});

function clone(s: InventoryState): InventoryState {
  const c = (x: InvItem | null) => (x ? copyItem(x) : null);
  return {
    location: s.location,
    bag: s.bag.map(c),
    gear: {
      weapon: c(s.gear.weapon),
      armor: c(s.gear.armor),
      module: c(s.gear.module),
      tool: c(s.gear.tool),
    },
    locker: s.locker.map(c),
    zoneCr: s.zoneCr,
    baseCr: s.baseCr,
    nextUid: s.nextUid,
  };
}

/** Sale value of ONE piece (gear: GEAR_SELL_VALUE[rarity][ilvl]; Issue / Med-Patch / Data Core: 0). */
export function unitValueCr(it: InvItem): number {
  const d = defOf(it);
  if (d.category === 'gear' && it.gear) return GEAR_SELL_VALUE[it.gear.rarity][it.gear.ilvl];
  return d.valueCr;
}

export const stackValueCr = (it: InvItem): number => unitValueCr(it) * it.count;

const isIssue = (it: InvItem | null): boolean => !!it && defOf(it).category === 'issue';

function toStack(it: InvItem, tag: ItemTag, equipped: boolean): ItemStack {
  const d = defOf(it);
  const unit = unitValueCr(it);
  const s: ItemStack = {
    id: it.itemId,
    nameId: it.gear?.nameId ?? d.nameId,
    glyph: d.glyph,
    colorKey: it.gear ? LOOT_RARITY[it.gear.rarity].color : d.colorKey,
    count: it.count,
    valueCr: unit * it.count,
    tag,
    equipped,
    unitValueCr: unit,
    category: d.category,
  };
  if (d.slot) s.slot = d.slot;
  if (it.gear) {
    s.rarity = it.gear.rarity;
    s.ilvl = it.gear.ilvl;
    s.uid = it.gear.uid;
    if (it.gear.affixes) s.affixes = it.gear.affixes.map((a) => ({ ...a }));
  }
  if (it.contractId !== undefined) s.contractId = it.contractId;
  return s;
}

/** Med-Patches in the bag (all stacks). */
export function medPatchCountOf(s: InventoryState): number {
  let n = 0;
  for (const it of s.bag) if (it?.itemId === MEDPATCH_ITEM_ID) n += it.count;
  return n;
}

const usedSlotsOf = (slots: readonly (InvItem | null)[]) => slots.filter((x) => x).length;

/**
 * AT RISK – the ONE formula used by the HUD, the `>` / boss-gate window, LOST on the death screen
 * and the session report (mechaniki-m1.md v0.5.2 §2.1 pt 3, §2.3, §2.7, §2.17 pt 11):
 *
 *   AT RISK = zoneCr + Σ sale value of every bag stack + Σ sale value of equipped gear except Issue
 *
 * Sale value = Exchange price (Scrap 2, Copper 5, gear SELL_ITEM by rarity × ilvl). Med-Patches and
 * Data Core have sale value 0 (not sellable), so they add 0 although they ARE lost on death.
 * Issue gear is never lost and never counts. The locker and baseCr are safe and never count.
 * Equals DeathLoss.totalCr of onDeath()/snapshotAtDeath() in the same tick, to the credit.
 */
export function computeAtRisk(state: InvSource): number {
  const s = src(state);
  let sum = s.zoneCr;
  for (const it of s.bag) if (it) sum += stackValueCr(it);
  for (const slot of GEAR_SLOTS) {
    const g = s.gear[slot];
    if (g && !isIssue(g)) sum += stackValueCr(g);
  }
  return sum;
}

function changed(s: InventoryState, reason: InventoryChangeReason): InventoryOutputEvent {
  return {
    type: 'inventory:changed',
    payload: {
      atRisk: computeAtRisk(s),
      usedSlots: usedSlotsOf(s.bag),
      medPatchCount: medPatchCountOf(s),
      reason,
    },
  };
}

/** 'inventory:changed' with reason 'load' – Silnik emits it once after a save was loaded. */
export function loadedEvent(state: InvSource): InventoryOutputEvent {
  return changed(src(state), 'load');
}

const fail = <T extends object>(state: InventoryState, reason: InvFailReason, extra: T) => ({
  state,
  events: [] as InventoryOutputEvent[],
  ok: false as const,
  reason,
  ...extra,
});

/**
 * Put `count` pieces into a container (stack onto same items first, then empty slots).
 * Med-Patches respect `medLimit` (bag only). Mutates `slots`; returns pieces placed.
 */
function putStackable(
  slots: (InvItem | null)[],
  itemId: string,
  count: number,
  medLimit?: number,
): number {
  const d = ITEM_DEFS[itemId]!;
  let left = count;
  if (medLimit !== undefined) {
    let have = 0;
    for (const it of slots) if (it?.itemId === itemId) have += it.count;
    left = Math.min(left, Math.max(0, medLimit - have));
  }
  const want = left;
  for (const it of slots) {
    if (left <= 0) break;
    if (it && it.itemId === itemId && it.count < d.stack) {
      const n = Math.min(d.stack - it.count, left);
      it.count += n;
      left -= n;
    }
  }
  for (let i = 0; i < slots.length && left > 0; i++) {
    if (slots[i] === null) {
      const n = Math.min(d.stack, left);
      slots[i] = { itemId, count: n };
      left -= n;
    }
  }
  return want - left;
}

const validIndex = (arr: readonly unknown[], i: number) =>
  Number.isInteger(i) && i >= 0 && i < arr.length;

// ---- read-only views ----------------------------------------------------------------------------

/** Numbers the zone HUD prints. `atRisk` is `computeAtRisk()` (the same value every tick). */
export interface InventoryHudModel {
  atRisk: number;
  bagUsed: number;
  bagMax: number;
}

export function inventoryHudModel(state: InvSource): InventoryHudModel {
  const run = getRunInventory(state);
  return { atRisk: run.atRisk, bagUsed: run.usedSlots, bagMax: run.slotsMax };
}

/** HUD / bag screen / death screen data (agreed API with Gameplay and UI). */
export function getRunInventory(state: InvSource): RunInventory {
  const s = src(state);
  return {
    atRisk: computeAtRisk(s),
    slots: s.bag.map((it) => (it ? toStack(it, 'RISK', false) : null)),
    medPatchCount: medPatchCountOf(s),
    slotsMax: BACKPACK_SLOTS,
    medPatchMax: MEDPATCH_MAX,
    zoneCr: s.zoneCr,
    baseCr: s.baseCr,
    usedSlots: usedSlotsOf(s.bag),
    location: s.location,
  };
}

/** Equipped gear (4 slots). Issue → tag 'ISSUE', everything else 'RISK'; equipped: true. */
export function getGear(state: InvSource): GearView {
  const s = src(state);
  const v = (it: InvItem | null) => (it ? toStack(it, isIssue(it) ? 'ISSUE' : 'RISK', true) : null);
  return {
    weapon: v(s.gear.weapon),
    armor: v(s.gear.armor),
    module: v(s.gear.module),
    tool: v(s.gear.tool),
  };
}

/** Hunter Locker (always tag 'SAFE'). */
export function getLocker(state: InvSource): LockerView {
  const s = src(state);
  return {
    slots: s.locker.map((it) => (it ? toStack(it, 'SAFE', false) : null)),
    slotsMax: s.locker.length,
    usedSlots: usedSlotsOf(s.locker),
  };
}

/** Base account (baseCr). Moves to the engine's economy module later. */
export function getCredits(state: InvSource): number {
  return src(state).baseCr;
}

/**
 * What death would take right now – no side effects. Same value as onDeath().lost:
 * bag + equipped non-Issue gear (equipped: true) + zoneCr; totalCr = computeAtRisk().
 */
export function snapshotAtDeath(state: InvSource): DeathLoss {
  const s = src(state);
  const items: ItemStack[] = [];
  for (const it of s.bag) if (it) items.push(toStack(it, 'RISK', false));
  for (const slot of GEAR_SLOTS) {
    const g = s.gear[slot];
    if (g && !isIssue(g)) items.push(toStack(g, 'RISK', true));
  }
  return { items, zoneCr: s.zoneCr, totalCr: computeAtRisk(s) };
}

// ---- operations ---------------------------------------------------------------------------------

/**
 * Pick an item up into the bag. Materials / Med-Patches stack (20 / 6 per slot); Med-Patches stop
 * at MEDPATCH_MAX (rest stays on the floor); gear and contract items need an empty slot.
 * Full bag → ok: false, reason 'bagFull' (UI: M1_SYS_06); partial pickup → ok: true with left > 0
 * and reason set. Contract items (Data Core) also return contractEvents [itemPicked].
 */
export function pickupItem(state: InventoryState, input: PickupInput): PickupResult {
  const d = ITEM_DEFS[input.itemId];
  const count = input.count ?? 1;
  if (!d) return fail(state, 'unknownItem', { taken: 0, left: count });
  if (d.category === 'issue') return fail(state, 'issue', { taken: 0, left: count });
  if (!Number.isInteger(count) || count < 1) return fail(state, 'badAmount', { taken: 0, left: 0 });
  const s = clone(state);
  let taken = 0;
  let reason: InvFailReason | undefined;
  const contractEvents: ContractInputEvent[] = [];
  if (d.category === 'material' || d.category === 'medPatch') {
    const isMed = d.category === 'medPatch';
    const room = isMed ? Math.max(0, MEDPATCH_MAX - medPatchCountOf(s)) : Infinity;
    taken = putStackable(s.bag, d.id, count, isMed ? MEDPATCH_MAX : undefined);
    if (taken < count) reason = isMed && taken >= room ? 'medPatchLimit' : 'bagFull';
  } else {
    // gear / contract: 1 per slot
    if (d.category === 'gear' && (!input.gear || input.gear.slot !== d.slot))
      return fail(state, 'notGear', { taken: 0, left: count });
    for (let n = 0; n < count; n++) {
      const i = s.bag.indexOf(null);
      if (i < 0) {
        reason = 'bagFull';
        break;
      }
      const it: InvItem = { itemId: d.id, count: 1 };
      if (d.category === 'gear' && input.gear) {
        it.gear = { ...input.gear, uid: s.nextUid++ };
        if (input.gear.base) it.gear.base = { ...input.gear.base };
        if (input.gear.affixes) it.gear.affixes = input.gear.affixes.map((a) => ({ ...a }));
      }
      if (input.contractId !== undefined) it.contractId = input.contractId;
      s.bag[i] = it;
      taken++;
      if (d.category === 'contract') {
        const ev: ContractInputEvent = { type: 'itemPicked', itemId: d.id };
        if (input.contractId !== undefined) ev.contractId = input.contractId;
        contractEvents.push(ev);
      }
    }
  }
  if (taken === 0) return fail(state, reason ?? 'bagFull', { taken: 0, left: count });
  const res: PickupResult = {
    state: s,
    events: [changed(s, 'pickup')],
    ok: true,
    taken,
    left: count - taken,
  };
  if (reason) res.reason = reason;
  if (contractEvents.length) res.contractEvents = contractEvents;
  return res;
}

/** What is lying on a cell. `$` carries `credits`; `:` is Scrap unless `itemId` says Copper. */
export interface FloorOffer {
  glyph: string;
  credits?: number;
  itemId?: string;
  count?: number;
  gear?: Omit<GearInfo, 'uid'>;
  contractId?: number;
}

export interface FloorCollectResult extends InvResult {
  taken: number;
  left: number;
}

const AUTO_FLOOR = new Set(['$', ':', '+']);
const USE_FLOOR = new Set(['§', '/', '[', '"', '(']);

function floorItemId(glyph: string): string | undefined {
  switch (glyph) {
    case ':':
      return SCRAP_ITEM_ID;
    case '+':
      return MEDPATCH_ITEM_ID;
    case '§':
      return DATA_CORE_ITEM_ID;
    case '/':
      return GEAR_ITEM_IDS.weapon;
    case '[':
      return GEAR_ITEM_IDS.armor;
    case '"':
      return GEAR_ITEM_IDS.module;
    case '(':
      return GEAR_ITEM_IDS.tool;
    default:
      return undefined;
  }
}

/**
 * Pick up whatever is on the floor.
 * Stepping (`how: 'step'`) takes `$`, `:` and `+` only. Gear and `§` stay until USE
 * (`reason: 'needsUse'`). A full bag returns `reason: 'bagFull'` (UI text M1_SYS_06).
 */
export function collectFloor(
  state: InventoryState,
  offer: FloorOffer,
  how: 'step' | 'use',
): FloorCollectResult {
  const glyph = offer.glyph;
  const auto = AUTO_FLOOR.has(glyph);
  if (how === 'step' && !auto) {
    const left = offer.count ?? offer.credits ?? 1;
    return fail(state, USE_FLOOR.has(glyph) ? 'needsUse' : 'unknownItem', { taken: 0, left });
  }
  if (glyph === '$') {
    const amount = offer.credits ?? 0;
    const res = addZoneCredits(state, amount);
    return { ...res, taken: res.ok ? amount : 0, left: res.ok ? 0 : amount };
  }
  const itemId = offer.itemId ?? floorItemId(glyph);
  if (!itemId) return fail(state, 'unknownItem', { taken: 0, left: offer.count ?? 1 });
  const input: PickupInput = { itemId, count: offer.count ?? 1 };
  if (offer.gear) input.gear = offer.gear;
  if (offer.contractId !== undefined) input.contractId = offer.contractId;
  return pickupItem(state, input);
}

/**
 * Drop (the whole stack or `count` pieces) from a bag slot – zone only (in base: STORE / SELL).
 * Returns `dropped` for the world to place on the floor. Contract item → contractEvents [itemLost].
 */
export function dropItem(state: InventoryState, bagIndex: number, count?: number): DropResult {
  if (state.location !== 'zone') return fail(state, 'notInZone', { dropped: null });
  if (!validIndex(state.bag, bagIndex)) return fail(state, 'badIndex', { dropped: null });
  const cur = state.bag[bagIndex];
  if (!cur) return fail(state, 'emptySlot', { dropped: null });
  const n = count ?? cur.count;
  if (!Number.isInteger(n) || n < 1 || n > cur.count)
    return fail(state, 'badAmount', { dropped: null });
  const s = clone(state);
  const it = s.bag[bagIndex]!;
  const dropped = { ...copyItem(it), count: n };
  if (n === it.count) s.bag[bagIndex] = null;
  else it.count -= n;
  const res: DropResult = { state: s, events: [changed(s, 'drop')], ok: true, dropped };
  if (defOf(it).category === 'contract') {
    const ev: ContractInputEvent = { type: 'itemLost', itemId: it.itemId };
    if (it.contractId !== undefined) ev.contractId = it.contractId;
    res.contractEvents = [ev];
  }
  return res;
}

/**
 * Consume one Med-Patch from the bag (the heal itself, 40 HP over 2 s and the 4 s cooldown, is
 * Gameplay's – call this when the heal starts). No patch → ok: false, 'noMedPatch'.
 */
export function useMedPatch(state: InventoryState): InvResult {
  const idx = state.bag.findIndex((it) => it?.itemId === MEDPATCH_ITEM_ID);
  if (idx < 0) return fail(state, 'noMedPatch', {});
  const s = clone(state);
  const it = s.bag[idx]!;
  if (it.count <= 1) s.bag[idx] = null;
  else it.count -= 1;
  return { state: s, events: [changed(s, 'use')], ok: true };
}

/** `$` picked up in the zone (auto pickup) – at risk until evacuation. */
export function addZoneCredits(state: InventoryState, amount: number): InvResult {
  if (!Number.isInteger(amount) || amount <= 0) return fail(state, 'badAmount', {});
  const s = clone(state);
  s.zoneCr += amount;
  return { state: s, events: [changed(s, 'pickup')], ok: true };
}

/**
 * Change the base account (baseCr): + reward / sale, − purchase. Not below 0
 * ('insufficientCredits'). Temporary home of the account until the engine's economy module.
 */
export function addCredits(state: InventoryState, amount: number): InvResult {
  if (!Number.isInteger(amount) || amount === 0) return fail(state, 'badAmount', {});
  if (state.baseCr + amount < 0) return fail(state, 'insufficientCredits', {});
  const s = clone(state);
  s.baseCr += amount;
  return { state: s, events: [changed(s, 'credits')], ok: true };
}

/**
 * Pay a contract reward (from 'contract:completed', i.e. on evacuation – rewards are always safe,
 * §2.3):
 * - credits → baseCr;
 * - Copper → locker [ASSUMPTION: only useful in base, safest place], bag if the locker is full;
 * - Med-Patches → bag up to MEDPATCH_MAX [ASSUMPTION: needed in the zone], rest → locker;
 * - what fits nowhere is returned in `overflow` (not kept).
 * With `contractId` the contract's items (Data Core) are removed from the bag – handed over to BASE.
 */
export function applyContractReward(
  state: InventoryState,
  reward: ContractReward,
  contractId?: number,
): RewardResult {
  const s = clone(state);
  s.baseCr += Math.max(0, reward.credits);
  if (contractId !== undefined)
    s.bag = s.bag.map((it) =>
      it && it.contractId === contractId && defOf(it).category === 'contract' ? null : it,
    );
  let copper = Math.max(0, reward.copper);
  copper -= putStackable(s.locker, COPPER_ITEM_ID, copper);
  copper -= putStackable(s.bag, COPPER_ITEM_ID, copper);
  let med = Math.max(0, reward.medPatches);
  med -= putStackable(s.bag, MEDPATCH_ITEM_ID, med, MEDPATCH_MAX);
  med -= putStackable(s.locker, MEDPATCH_ITEM_ID, med);
  return {
    state: s,
    events: [changed(s, 'reward')],
    ok: true,
    overflow: { copper, medPatches: med },
  };
}

/** Evacuation (player entered the lift): everything is safe now, zoneCr → baseCr, location base. */
export function onEvacuated(state: InventoryState): InvResult {
  const s = clone(state);
  s.baseCr += s.zoneCr;
  s.zoneCr = 0;
  s.location = 'base';
  return { state: s, events: [changed(s, 'evac')], ok: true };
}

/**
 * Lift departure from base (after a print and after an evacuation alike, §2.3): location → zone,
 * Issue tops Med-Patches in the bag up to `target` if the player has fewer.
 * target = ISSUE_MEDPATCH_TOPUP: medPatchTopUpFor(lightsLevel) (2, 3 from Lights I; 2 vs 6 still
 * waits for GD – pass it in). medPatchAdded > 0 → text M1_GEAR_ISSUE_TOPUP.
 */
export function issueTopUp(state: InventoryState, target: number): TopUpResult {
  const s = clone(state);
  s.location = 'zone';
  const want = Math.max(0, Math.min(target, MEDPATCH_MAX) - medPatchCountOf(s));
  const added = want > 0 ? putStackable(s.bag, MEDPATCH_ITEM_ID, want, MEDPATCH_MAX) : 0;
  for (const slot of GEAR_SLOTS) if (!s.gear[slot]) s.gear[slot] = issueItem(slot);
  const res: TopUpResult = {
    state: s,
    events: [changed(s, 'topup')],
    ok: true,
    medPatchAdded: added,
  };
  if (added < want) res.reason = 'bagFull';
  return res;
}

function lightsLevelOf(state: GameState): LightsLevel {
  for (const name of ['progress', 'base']) {
    const raw = state.sections[name];
    if (typeof raw !== 'object' || raw === null) continue;
    const rec = raw as Record<string, unknown>;
    for (const key of ['lights', 'lightsLevel']) {
      const v = rec[key];
      if (v === 0 || v === 1 || v === 2 || v === 3) return v;
    }
  }
  return 0;
}

/**
 * Med-Patch top-up when the lift leaves base. 2 patches, or 3 when a progress/base
 * section already says Lights ≥ 1. No lights system is created here.
 */
export function topUpForDeparture(state: GameState): TopUpResult {
  const res = issueTopUp(getInventory(state), medPatchTopUpFor(lightsLevelOf(state)));
  setInventory(state, res.state);
  return res;
}

/**
 * Player death (§2.7): loses the whole bag, all equipped gear except Issue (weapon / armor fall back
 * to Issue Pole / Issue Suit) and zoneCr; location → base (print). Contract items (Data Core) give
 * contractEvents [itemLost] (ContractInputEvent).
 *
 * Woła wyłącznie walka (combat), raz na śmierć, w fazie śmierci ticka. Nikt inny nie może tego
 * wołać, bo itemLost zostałby wyemitowany podwójnie.
 *
 * Guard: a second call (nothing left at risk, already in base) changes nothing and emits nothing.
 * lost.totalCr === computeAtRisk() right before the call (= snapshotAtDeath()).
 */
export function onDeath(state: InventoryState): DeathResult {
  const lost = snapshotAtDeath(state);
  const nothing = lost.items.length === 0 && lost.zoneCr === 0 && state.location === 'base';
  if (nothing) return { state, lost, events: [], contractEvents: [] };
  const s = clone(state);
  const contractEvents: ContractInputEvent[] = [];
  for (const it of s.bag) {
    if (it && defOf(it).category === 'contract') {
      const ev: ContractInputEvent = { type: 'itemLost', itemId: it.itemId };
      if (it.contractId !== undefined) ev.contractId = it.contractId;
      contractEvents.push(ev);
    }
  }
  s.bag = s.bag.map(() => null);
  for (const slot of GEAR_SLOTS) if (!isIssue(s.gear[slot])) s.gear[slot] = issueItem(slot);
  s.zoneCr = 0;
  s.location = 'base';
  return { state: s, lost, events: [changed(s, 'death')], contractEvents };
}

/** Bag slot → locker (base only). Stackables merge. Contract items cannot be stored. */
export function moveToLocker(state: InventoryState, bagIndex: number): InvResult {
  if (state.location !== 'base') return fail(state, 'notInBase', {});
  if (!validIndex(state.bag, bagIndex)) return fail(state, 'badIndex', {});
  const it = state.bag[bagIndex];
  if (!it) return fail(state, 'emptySlot', {});
  if (defOf(it).category === 'contract') return fail(state, 'contractItem', {});
  const s = clone(state);
  const moved = s.bag[bagIndex]!;
  if (defOf(moved).stack > 1) {
    const n = putStackable(s.locker, moved.itemId, moved.count);
    if (n === 0) return fail(state, 'lockerFull', {});
    if (n === moved.count) s.bag[bagIndex] = null;
    else moved.count -= n;
  } else {
    const i = s.locker.indexOf(null);
    if (i < 0) return fail(state, 'lockerFull', {});
    s.locker[i] = moved;
    s.bag[bagIndex] = null;
  }
  return { state: s, events: [changed(s, 'deposit')], ok: true };
}

/** Locker slot → bag (base only). Med-Patches stop at MEDPATCH_MAX (rest stays in the locker). */
export function moveFromLocker(state: InventoryState, lockerIndex: number): InvResult {
  if (state.location !== 'base') return fail(state, 'notInBase', {});
  if (!validIndex(state.locker, lockerIndex)) return fail(state, 'badIndex', {});
  const it = state.locker[lockerIndex];
  if (!it) return fail(state, 'emptySlot', {});
  const s = clone(state);
  const moved = s.locker[lockerIndex]!;
  const d = defOf(moved);
  if (d.stack > 1) {
    const isMed = d.category === 'medPatch';
    const n = putStackable(s.bag, moved.itemId, moved.count, isMed ? MEDPATCH_MAX : undefined);
    if (n === 0)
      return fail(
        state,
        isMed && medPatchCountOf(state) >= MEDPATCH_MAX ? 'medPatchLimit' : 'bagFull',
        {},
      );
    if (n === moved.count) s.locker[lockerIndex] = null;
    else moved.count -= n;
  } else {
    const i = s.bag.indexOf(null);
    if (i < 0) return fail(state, 'bagFull', {});
    s.bag[i] = moved;
    s.locker[lockerIndex] = null;
  }
  return { state: s, events: [changed(s, 'withdraw')], ok: true };
}

/**
 * Equip gear from the bag (zone or base) or from the locker (base only). The previously equipped
 * non-Issue piece swaps into the same slot of the source container; Issue simply leaves the slot
 * (it is never carried, it comes back when the slot is emptied).
 */
export function equip(
  state: InventoryState,
  index: number,
  from: 'bag' | 'locker' = 'bag',
): InvResult {
  if (from === 'locker' && state.location !== 'base') return fail(state, 'notInBase', {});
  const box = from === 'bag' ? state.bag : state.locker;
  if (!validIndex(box, index)) return fail(state, 'badIndex', {});
  const it = box[index];
  if (!it) return fail(state, 'emptySlot', {});
  const d = defOf(it);
  if (d.category !== 'gear' || !d.slot) return fail(state, 'notGear', {});
  const s = clone(state);
  const sbox = from === 'bag' ? s.bag : s.locker;
  const prev = s.gear[d.slot];
  s.gear[d.slot] = sbox[index]!;
  sbox[index] = prev && !isIssue(prev) ? prev : null;
  return { state: s, events: [changed(s, 'equip')], ok: true };
}

/** Take gear off into the bag (or the locker, base only). Issue cannot be unequipped. */
export function unequip(
  state: InventoryState,
  slot: ItemSlot,
  to: 'bag' | 'locker' = 'bag',
): InvResult {
  if (to === 'locker' && state.location !== 'base') return fail(state, 'notInBase', {});
  const it = state.gear[slot];
  if (!it) return fail(state, 'emptySlot', {});
  if (isIssue(it)) return fail(state, 'issue', {});
  const box = to === 'bag' ? state.bag : state.locker;
  const i = box.indexOf(null);
  if (i < 0) return fail(state, to === 'bag' ? 'bagFull' : 'lockerFull', {});
  const s = clone(state);
  (to === 'bag' ? s.bag : s.locker)[i] = s.gear[slot]!;
  s.gear[slot] = issueItem(slot);
  return { state: s, events: [changed(s, 'unequip')], ok: true };
}

/**
 * Resize the locker to STASH_SLOTS of a Lights level (only grows; called by the base-upgrade code
 * after buying Lights I/II/III). No event (bag / AT RISK unchanged).
 */
export function setLockerSize(state: InventoryState, lights: LightsLevel): InventoryState {
  const n = STASH_SLOTS_BY_LIGHTS[lights];
  if (n <= state.locker.length) return state;
  const s = clone(state);
  while (s.locker.length < n) s.locker.push(null);
  return s;
}

/** Item id of generated gear for a slot (for the loot generator). */
export const gearItemId = (slot: ItemSlot): string => GEAR_ITEM_IDS[slot];
