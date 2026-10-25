// Run inventory M1 – data only (no logic). Rules: design/mechaniki-m1.md v0.5.2 §2.3 (safe vs
// at risk, Issue gear, Med-Patch top-up), §2.7 (death), §2.12 (loot categories, glyphs, bag 12,
// stacks 20 / 6, locker), §2.16 (STACK_*, STASH_SLOTS, ISSUE_MEDPATCH_TOPUP). Numbers:
// design/balans-m1.md (v1.1 values, v1.2 adds START_CREDITS, STASH_SLOTS per Lights level and the
// top-up 2 → 3 at Lights I). Glyphs / colours: keys of src/data/style.ts (GRAF §4, §9).
import { DATA_CORE_ITEM_ID, type Depth } from './contracts-m1';
import { ITEM_GLYPHS, PICKUP_GLYPHS, type ItemSlot, type PaletteKey, type Rarity } from './style';

export { DATA_CORE_ITEM_ID };

/** BAG_SLOTS: backpack slots (§2.12). The 4 equipped gear slots do not count. */
export const BACKPACK_SLOTS = 12;

/** Med-Patch limit: max. 6 pieces in the bag in total (GD, §2.12 / STACK_MEDPATCH). */
export const MEDPATCH_MAX = 6;

/** STACK_MATERIAL: Scrap / Copper per slot. */
export const STACK_MATERIAL = 20;
/** STACK_MEDPATCH: Med-Patches per slot (= MEDPATCH_MAX, so they always fit in one slot). */
export const STACK_MEDPATCH = 6;

/**
 * ISSUE_MEDPATCH_TOPUP: on EVERY lift departure (after a print and after an evacuation alike)
 * Issue tops Med-Patches in the bag up to this many, if the player has fewer (§2.3).
 * OPEN – waits for the GD decision: 2 (current docs and the Balance model) vs 6 (variant compared
 * by Balance, balans-m1.md §9). Keep it a parameter: issueTopUp() takes the target as an argument.
 */
export const MEDPATCH_TOPUP = 2;
/** Top-up from Lights I upward (balans-m1.md v1.2 §1: 2 / 3 / 3 / 3 for Lights 0 / I / II / III). */
export const MEDPATCH_TOPUP_UPGRADED = 3;

/** Lights Above the Base level owned (0 = none, 1–3 = Lights I–III; §2.15). */
export type LightsLevel = 0 | 1 | 2 | 3;

/** Top-up target for a Lights level (2, then 3 from Lights I). */
export function medPatchTopUpFor(lights: LightsLevel): number {
  return lights >= 1 ? MEDPATCH_TOPUP_UPGRADED : MEDPATCH_TOPUP;
}

/**
 * STASH_SLOTS per Lights level: 30 / 40 / 50 / 60 (balans-m1.md v1.2 §1, GD: every Lights level
 * +10). Mechanics only uses the token {STASH_SLOTS} (§2.15) – absolute numbers are Balance's.
 */
export const STASH_SLOTS_BY_LIGHTS: Readonly<Record<LightsLevel, number>> = {
  0: 30,
  1: 40,
  2: 50,
  3: 60,
};

/**
 * START_CREDITS (balans-m1.md v1.2 §1, QA R16): base account of a brand-new save.
 * Czeka na Mechaniki (not in mechaniki-m1.md v0.5.2 yet) – used by fresh() for baseCr.
 */
export const START_CREDITS = 50;

/**
 * SELL_ITEM (balans-m1.md §3.3 / §4): gear sale value by rarity and item level (ilvl = depth of
 * the drop) = base × (1 + 0.5 × (ilvl − 1)). This value also counts into AT RISK.
 */
export const GEAR_SELL_VALUE: Readonly<Record<Rarity, Readonly<Record<Depth, number>>>> = {
  1: { 1: 10, 2: 15, 3: 20 },
  2: { 1: 40, 2: 60, 3: 80 },
  3: { 1: 150, 2: 225, 3: 300 },
};

export type ItemCategory =
  /** Scrap, Copper – auto pickup, stack 20. */
  | 'material'
  /** Med-Patch – auto pickup within the limit, not sellable. */
  | 'medPatch'
  /** Contract items (Data Core) – USE pickup, 1 / slot, lost on death, handed over on completion. */
  | 'contract'
  /** Found gear (weapon / armor / module / tool) – generated instance (rarity, ilvl, affixes). */
  | 'gear'
  /** Issue starting gear – never lost, not sellable, never in the bag or the locker. */
  | 'issue';

export interface ItemDef {
  id: string;
  /** Text id (fabula/teksty-m1-en.md); UI shows the text, never a hard-coded name. */
  nameId: string;
  glyph: string;
  /** Key of PALETTE in style.ts. Gear: colour of rarity 1 – the instance's rarity overrides it. */
  colorKey: PaletteKey;
  /** Sale value per piece in kr (Exchange price = AT RISK contribution). Gear: see GEAR_SELL_VALUE. */
  valueCr: number;
  /** Pieces per slot. */
  stack: number;
  sellable: boolean;
  category: ItemCategory;
  /** Equipment slot (gear and Issue only). */
  slot?: ItemSlot;
}

export const SCRAP_ITEM_ID = 'M1_ITEM_SCRAP';
export const COPPER_ITEM_ID = 'M1_ITEM_COPPER';
export const MEDPATCH_ITEM_ID = 'M1_ITEM_MEDPATCH';
export const ISSUE_BATON_ITEM_ID = 'M1_ITEM_ISSUE_BATON';
export const ISSUE_SUIT_ITEM_ID = 'M1_ITEM_ISSUE_SUIT';

/** Item id of a generated gear piece per slot (instance data: rarity, ilvl, affixes). */
export const GEAR_ITEM_IDS: Readonly<Record<ItemSlot, string>> = {
  weapon: 'M1_ITEM_GEAR_WEAPON',
  armor: 'M1_ITEM_GEAR_ARMOR',
  module: 'M1_ITEM_GEAR_MODULE',
  tool: 'M1_ITEM_GEAR_TOOL',
};

const GEAR_NAME_IDS: Readonly<Record<ItemSlot, string>> = {
  weapon: 'M1_ITEM_SLOT_WEAPON',
  armor: 'M1_ITEM_SLOT_ARMOR',
  module: 'M1_ITEM_SLOT_MODULE',
  tool: 'M1_ITEM_SLOT_TOOL',
};

const gearDef = (slot: ItemSlot): ItemDef => ({
  id: GEAR_ITEM_IDS[slot],
  // Default name = slot text; the loot generator can give an instance its own nameId (affix name).
  nameId: GEAR_NAME_IDS[slot],
  glyph: ITEM_GLYPHS[slot].glyph,
  colorKey: 'rarity1',
  valueCr: 0, // per instance: GEAR_SELL_VALUE[rarity][ilvl]
  stack: 1,
  sellable: true,
  category: 'gear',
  slot,
});

export const ITEMS_M1: readonly ItemDef[] = [
  {
    id: SCRAP_ITEM_ID,
    // [ASSUMPTION] no text id for Scrap / Copper in teksty-m1-en.md yet – proposed for Lore.
    nameId: 'M1_MAT_SCRAP',
    glyph: PICKUP_GLYPHS.material.glyph,
    colorKey: PICKUP_GLYPHS.material.color,
    valueCr: 2, // SELL_SCRAP
    stack: STACK_MATERIAL,
    sellable: true,
    category: 'material',
  },
  {
    id: COPPER_ITEM_ID,
    nameId: 'M1_MAT_COPPER',
    glyph: PICKUP_GLYPHS.material.glyph,
    colorKey: PICKUP_GLYPHS.material.color,
    valueCr: 5, // SELL_COPPER
    stack: STACK_MATERIAL,
    sellable: true,
    category: 'material',
  },
  {
    id: MEDPATCH_ITEM_ID,
    nameId: 'M1_GEAR_MEDPATCH',
    glyph: PICKUP_GLYPHS.medPatch.glyph,
    colorKey: PICKUP_GLYPHS.medPatch.color,
    valueCr: 0, // MEDPATCH_SELLABLE = false → sale value 0 (buy price 25 kr is not its value)
    stack: STACK_MEDPATCH,
    sellable: false,
    category: 'medPatch',
  },
  {
    id: DATA_CORE_ITEM_ID,
    nameId: 'M1_GEAR_DATACORE',
    glyph: PICKUP_GLYPHS.dataCore.glyph,
    colorKey: PICKUP_GLYPHS.dataCore.color,
    // [ASSUMPTION] Data Core has no sale value in the docs (its worth is the contract reward), so
    // 0 kr and not sellable – it adds nothing to AT RISK. Question to Balance.
    valueCr: 0,
    stack: 1,
    sellable: false,
    category: 'contract',
  },
  {
    id: ISSUE_BATON_ITEM_ID,
    nameId: 'M1_GEAR_ISSUE_BATON',
    glyph: ITEM_GLYPHS.weapon.glyph,
    colorKey: 'rarity1', // [ASSUMPTION] no own Issue colour in GRAF – grey like rarity 1
    valueCr: 0,
    stack: 1,
    sellable: false,
    category: 'issue',
    slot: 'weapon',
  },
  {
    id: ISSUE_SUIT_ITEM_ID,
    nameId: 'M1_GEAR_ISSUE_SUIT',
    glyph: ITEM_GLYPHS.armor.glyph,
    colorKey: 'rarity1',
    valueCr: 0,
    stack: 1,
    sellable: false,
    category: 'issue',
    slot: 'armor',
  },
  gearDef('weapon'),
  gearDef('armor'),
  gearDef('module'),
  gearDef('tool'),
];

export const ITEM_DEFS: Readonly<Record<string, ItemDef>> = Object.fromEntries(
  ITEMS_M1.map((d) => [d.id, d]),
);

/** Issue item that fills an empty slot (Issue Baton / Issue Suit; module and tool have none). */
export const ISSUE_FOR_SLOT: Readonly<Partial<Record<ItemSlot, string>>> = {
  weapon: ISSUE_BATON_ITEM_ID,
  armor: ISSUE_SUIT_ITEM_ID,
};

export const GEAR_SLOTS: readonly ItemSlot[] = ['weapon', 'armor', 'module', 'tool'];
