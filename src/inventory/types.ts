// Run inventory M1 (owner: LUZ / Pracownik 2; wiring: Silnik). Types only.
// Rules: design/mechaniki-m1.md v0.5.2 §2.3, §2.7, §2.12; numbers: design/balans-m1.md.
import type { ContractId, ContractInputEvent } from '../contracts/types';
import type { Depth } from '../data/contracts-m1';
import type { ItemCategory } from '../data/inventory-m1';
import type { ItemSlot, PaletteKey, Rarity } from '../data/style';

export type { ItemSlot, Rarity } from '../data/style';
export type { ContractInputEvent } from '../contracts/types';

/** Generated gear data (owned by the loot generator; this module only stores and prices it). */
export interface GearInfo {
  /** Inventory-unique id (assigned by pickupItem; kept in the save). */
  uid: number;
  slot: ItemSlot;
  rarity: Rarity;
  /** Item level = depth of the drop (balans §3.1). */
  ilvl: Depth;
  /** Own name text id (affix name from the generator); default = the slot text. */
  nameId?: string;
  /** Rolled properties (M1_AFFIX_01–12) – opaque here, JSON-safe. */
  affixes?: { id: string; value: number }[];
}

/** One occupied slot as stored in the state / save. */
export interface InvItem {
  /** Key of ITEM_DEFS (data/inventory-m1.ts). */
  itemId: string;
  count: number;
  /** Only for category 'gear'. */
  gear?: GearInfo;
  /** Contract item: id of the ContractInstance that spawned it (Data Core). */
  contractId?: ContractId;
}

/** Where the player is: zone (run) or base (menu hub). Locker works only in base. */
export type InvLocation = 'base' | 'zone';

export interface InventoryState {
  location: InvLocation;
  /** BACKPACK_SLOTS entries, null = empty. */
  bag: (InvItem | null)[];
  /** 4 equipped slots. Weapon / armor fall back to Issue when emptied; module / tool to null. */
  gear: Record<ItemSlot, InvItem | null>;
  /** Hunter Locker; length = current STASH_SLOTS (grows with Lights). */
  locker: (InvItem | null)[];
  /** Credits picked up in the zone ($) – lost on death, moved to baseCr on evacuation. */
  zoneCr: number;
  /** Base account (safe). Temporarily here until the engine's economy module exists. */
  baseCr: number;
  /** Next GearInfo.uid. */
  nextUid: number;
}

export type ItemTag = 'RISK' | 'SAFE' | 'ISSUE';

/** UI view of one slot (agreed with UI i Menu). */
export interface ItemStack {
  /** Item id (ITEM_DEFS key). */
  id: string;
  /** Text id of the name – UI resolves the text. */
  nameId: string;
  glyph: string;
  /** PALETTE key in style.ts (gear: colour of its rarity). */
  colorKey: PaletteKey;
  count: number;
  /** Sale value of the WHOLE stack (unit value × count) – what AT RISK adds for it. */
  valueCr: number;
  /** RISK = lost on death (bag, equipped non-Issue), SAFE = locker, ISSUE = Issue gear. */
  tag: ItemTag;
  equipped: boolean;
  // --- extra (additive) fields ---
  unitValueCr: number;
  category: ItemCategory;
  slot?: ItemSlot;
  rarity?: Rarity;
  ilvl?: Depth;
  uid?: number;
  contractId?: ContractId;
  affixes?: { id: string; value: number }[];
}

/** getRunInventory() result – HUD, bag screen, `>` window, death screen. */
export interface RunInventory {
  /** computeAtRisk(): zoneCr + bag value + equipped non-Issue gear value. */
  atRisk: number;
  slots: (ItemStack | null)[];
  medPatchCount: number;
  slotsMax: number;
  medPatchMax: number;
  zoneCr: number;
  baseCr: number;
  usedSlots: number;
  location: InvLocation;
}

export interface LockerView {
  slots: (ItemStack | null)[];
  slotsMax: number;
  usedSlots: number;
}

export type GearView = Record<ItemSlot, ItemStack | null>;

/** What death takes (also snapshotAtDeath()). totalCr = AT RISK right before death. */
export interface DeathLoss {
  /** Bag items + equipped non-Issue gear (equipped: true). */
  items: ItemStack[];
  zoneCr: number;
  totalCr: number;
}

export type InventoryChangeReason =
  | 'pickup'
  | 'drop'
  | 'use'
  | 'death'
  | 'evac'
  | 'reward'
  | 'topup'
  | 'deposit'
  | 'withdraw'
  | 'equip'
  | 'unequip'
  | 'load'
  /** Additive (not in the first agreement): base account changed by addCredits (shop, upgrades). */
  | 'credits';

/** Payload of the bus event 'inventory:changed' (core/events.ts). */
export interface InventoryChanged {
  atRisk: number;
  usedSlots: number;
  medPatchCount: number;
  reason: InventoryChangeReason;
}

export interface InventoryEvents {
  'inventory:changed': InventoryChanged;
}

export type InventoryOutputEvent = { type: 'inventory:changed'; payload: InventoryChanged };

export type InvFailReason =
  | 'bagFull'
  | 'medPatchLimit'
  | 'noMedPatch'
  | 'emptySlot'
  | 'badIndex'
  | 'unknownItem'
  | 'notGear'
  | 'issue'
  | 'contractItem'
  | 'lockerFull'
  | 'notInBase'
  | 'notInZone'
  | 'insufficientCredits'
  | 'badAmount';

/** Result of every operation. `ok: false` = state unchanged (same object), no events. */
export interface InvResult {
  state: InventoryState;
  events: InventoryOutputEvent[];
  /** Inputs for the contracts module (feedContracts / applyContractEvent). */
  contractEvents?: ContractInputEvent[];
  ok: boolean;
  reason?: InvFailReason;
}

/** What a chest / the floor hands to pickupItem (contents are decided by the zone generator). */
export interface PickupInput {
  itemId: string;
  /** Default 1. */
  count?: number;
  /** Required for gear: slot must match the item id; uid is assigned here. */
  gear?: Omit<GearInfo, 'uid'>;
  contractId?: ContractId;
}

export interface PickupResult extends InvResult {
  /** Pieces taken into the bag. */
  taken: number;
  /** Pieces left on the ground (bag full / Med-Patch limit). */
  left: number;
}

export interface DropResult extends InvResult {
  /** What left the bag (the world places it on the floor until the end of the run). */
  dropped: InvItem | null;
}

export interface RewardResult extends InvResult {
  /** Med-Patches / Copper that fit nowhere (bag at limit and locker full) – reported, not kept. */
  overflow: { copper: number; medPatches: number };
}

export interface TopUpResult extends InvResult {
  /** {medpatch_added} for M1_GEAR_ISSUE_TOPUP (show the text only when > 0). */
  medPatchAdded: number;
}

export interface DeathResult {
  state: InventoryState;
  lost: DeathLoss;
  events: InventoryOutputEvent[];
  contractEvents: ContractInputEvent[];
}

/** Save section 'inventory' (pure JSON). */
export interface InventorySave {
  v: 1;
  location: InvLocation;
  bag: (InvItem | null)[];
  gear: Record<ItemSlot, InvItem | null>;
  locker: (InvItem | null)[];
  zoneCr: number;
  baseCr: number;
  nextUid: number;
}
