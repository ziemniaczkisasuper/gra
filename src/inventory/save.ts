// Save section 'inventory' (save v3 section registry, save/sections.ts). Registered as a SIDE
// EFFECT at module top level – import this file once before the save is loaded/parsed
// (Silnik: `import './inventory/save';` next to the other module installs), otherwise parseSave()
// drops the section as unknown. No apply(): the value lands in state.sections.inventory.
import type { Depth } from '../data/contracts-m1';
import {
  BACKPACK_SLOTS,
  GEAR_SLOTS,
  ISSUE_POLE_ITEM_ID,
  ITEM_DEFS,
  MEDPATCH_ITEM_ID,
  MEDPATCH_MAX,
  STASH_SLOTS_BY_LIGHTS,
} from '../data/inventory-m1';
import type { ItemSlot, Rarity } from '../data/style';
import { SaveError } from '../save/schema';
import { registerSaveSection } from '../save/sections';
import { createInventoryState, getInventory, INVENTORY_SECTION } from './inventory';
import type { GearInfo, InvItem, InventorySave, InventoryState } from './types';

export { getInventory, setInventory, INVENTORY_SECTION, createInventoryState } from './inventory';

/** Pure JSON copy of the state (v: 1). */
export function serializeInventory(s: InventoryState): InventorySave {
  return JSON.parse(
    JSON.stringify({
      v: 1,
      location: s.location,
      bag: s.bag,
      gear: s.gear,
      locker: s.locker,
      zoneCr: s.zoneCr,
      baseCr: s.baseCr,
      nextUid: s.nextUid,
    }),
  ) as InventorySave;
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const isInt = (x: unknown, min = 0, max = 2 ** 31): x is number =>
  typeof x === 'number' && Number.isInteger(x) && x >= min && x <= max;
const RARITY = new Set([1, 2, 3]);
const DEPTH = new Set([1, 2, 3]);
const GEAR_BASE_IDS: ReadonlySet<string> = new Set([
  'WEAPON_MELEE_DMG',
  'WEAPON_RANGED_DMG',
  'ARMOR_BASE',
  'MODULE_HP_BASE',
  'TOOL_SALVAGE_PCT',
]);

function readGear(raw: unknown, slot: ItemSlot | undefined, at: string): GearInfo {
  if (!isObj(raw)) throw new SaveError(`${at}: missing gear data`);
  if (!isInt(raw.uid, 1)) throw new SaveError(`${at}: bad gear uid`);
  if (raw.slot !== slot) throw new SaveError(`${at}: gear slot mismatch`);
  if (!RARITY.has(raw.rarity as number)) throw new SaveError(`${at}: bad rarity`);
  if (!DEPTH.has(raw.ilvl as number)) throw new SaveError(`${at}: bad ilvl`);
  const g: GearInfo = {
    uid: raw.uid,
    slot: slot!,
    rarity: raw.rarity as Rarity,
    ilvl: raw.ilvl as Depth,
  };
  if (raw.nameId !== undefined) {
    if (typeof raw.nameId !== 'string') throw new SaveError(`${at}: bad nameId`);
    g.nameId = raw.nameId;
  }
  if (raw.affixes !== undefined) {
    if (!Array.isArray(raw.affixes)) throw new SaveError(`${at}: bad affixes`);
    g.affixes = raw.affixes.map((a, i) => {
      if (
        !isObj(a) ||
        typeof a.id !== 'string' ||
        typeof a.value !== 'number' ||
        !Number.isFinite(a.value)
      )
        throw new SaveError(`${at}: bad affix ${i}`);
      return { id: a.id, value: a.value };
    });
  }
  if (raw.base !== undefined) {
    if (!isObj(raw.base) || typeof raw.base.id !== 'string' || !GEAR_BASE_IDS.has(raw.base.id))
      throw new SaveError(`${at}: bad gear base`);
    if (!isInt(raw.base.value, 0, 10_000)) throw new SaveError(`${at}: bad gear base value`);
    g.base = { id: raw.base.id, value: raw.base.value };
  }
  if (raw.weaponKind !== undefined) {
    if (slot !== 'weapon') throw new SaveError(`${at}: weaponKind on a non-weapon`);
    if (raw.weaponKind !== 'melee' && raw.weaponKind !== 'ranged')
      throw new SaveError(`${at}: bad weaponKind`);
    g.weaponKind = raw.weaponKind;
  }
  return g;
}

function readItem(raw: unknown, at: string): InvItem | null {
  if (raw === null) return null;
  if (!isObj(raw) || typeof raw.itemId !== 'string') throw new SaveError(`${at}: bad item`);
  const itemId = raw.itemId === 'M1_ITEM_ISSUE_BATON' ? ISSUE_POLE_ITEM_ID : raw.itemId;
  const d = ITEM_DEFS[itemId];
  if (!d) throw new SaveError(`${at}: unknown item ${raw.itemId}`);
  if (!isInt(raw.count, 1, d.stack)) throw new SaveError(`${at}: bad count`);
  const it: InvItem = { itemId: d.id, count: raw.count };
  if (d.category === 'gear') it.gear = readGear(raw.gear, d.slot, at);
  else if (raw.gear !== undefined) throw new SaveError(`${at}: gear data on non-gear item`);
  if (raw.contractId !== undefined) {
    if (!isInt(raw.contractId, 1)) throw new SaveError(`${at}: bad contractId`);
    it.contractId = raw.contractId;
  }
  return it;
}

/** Validate + convert a saved section. Bad data → SaveError (the whole save is rejected). Pure. */
export function deserializeInventory(raw: unknown): InventoryState {
  if (!isObj(raw)) throw new SaveError('inventory: not an object');
  if (raw.v !== 1) throw new SaveError(`inventory: unsupported version ${String(raw.v)}`);
  if (raw.location !== 'base' && raw.location !== 'zone')
    throw new SaveError('inventory: bad location');
  if (!Array.isArray(raw.bag) || raw.bag.length !== BACKPACK_SLOTS)
    throw new SaveError('inventory: bad bag');
  const bag = raw.bag.map((x, i) => {
    const it = readItem(x, `inventory.bag[${i}]`);
    if (it && ITEM_DEFS[it.itemId]!.category === 'issue')
      throw new SaveError(`inventory.bag[${i}]: Issue gear in the bag`);
    return it;
  });
  const med = bag.reduce((n, it) => n + (it?.itemId === MEDPATCH_ITEM_ID ? it.count : 0), 0);
  if (med > MEDPATCH_MAX) throw new SaveError('inventory: Med-Patch limit exceeded');
  const sizes = Object.values(STASH_SLOTS_BY_LIGHTS);
  if (!Array.isArray(raw.locker) || !sizes.includes(raw.locker.length))
    throw new SaveError('inventory: bad locker size');
  const locker = raw.locker.map((x, i) => {
    const it = readItem(x, `inventory.locker[${i}]`);
    if (it && ['issue', 'contract'].includes(ITEM_DEFS[it.itemId]!.category))
      throw new SaveError(`inventory.locker[${i}]: item not allowed in the locker`);
    return it;
  });
  if (!isObj(raw.gear)) throw new SaveError('inventory: bad gear');
  const gearRaw = raw.gear;
  const gear = {} as Record<ItemSlot, InvItem | null>;
  for (const slot of GEAR_SLOTS) {
    const it = readItem(gearRaw[slot] ?? null, `inventory.gear.${slot}`);
    if (it && ITEM_DEFS[it.itemId]!.slot !== slot)
      throw new SaveError(`inventory.gear.${slot}: wrong slot`);
    gear[slot] = it;
  }
  if (!isInt(raw.zoneCr)) throw new SaveError('inventory: bad zoneCr');
  if (!isInt(raw.baseCr)) throw new SaveError('inventory: bad baseCr');
  if (!isInt(raw.nextUid, 1)) throw new SaveError('inventory: bad nextUid');
  const uids = [...bag, ...locker, ...GEAR_SLOTS.map((s) => gear[s])]
    .map((it) => it?.gear?.uid)
    .filter((u): u is number => u !== undefined);
  if (new Set(uids).size !== uids.length) throw new SaveError('inventory: duplicate gear uid');
  if (uids.some((u) => u >= (raw.nextUid as number)))
    throw new SaveError('inventory: gear uid ≥ nextUid');
  return {
    location: raw.location,
    bag,
    gear,
    locker,
    zoneCr: raw.zoneCr,
    baseCr: raw.baseCr,
    nextUid: raw.nextUid,
  };
}

export const unregisterInventorySave = registerSaveSection<InventoryState>(INVENTORY_SECTION, {
  serialize: (state) => serializeInventory(getInventory(state)),
  deserialize: (raw) => deserializeInventory(raw),
  fresh: () => createInventoryState(),
});
