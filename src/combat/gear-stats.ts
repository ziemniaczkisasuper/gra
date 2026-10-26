// Equipped gear → combat numbers (T25). Damage order is mechaniki §2.11:
// roll (already × damage affix, still fractional) → crit → Momentum → depth → one round → armour.
// Armour affixes are added to A before that last step. Issue Pole / Issue Suit stay the defaults.
import type { GameState } from '../core/game';
import type { Rng } from '../core/rng';
import type { CombatConfig } from '../data/combat-m0';
import {
  ITEM_DEFS,
  GEAR_SLOTS,
  ISSUE_POLE_ITEM_ID,
  ISSUE_SUIT_ITEM_ID,
} from '../data/inventory-m1';
import { getNetworkProgress, issueMk2Grant } from '../progress/network';
import { msToTicks } from '../data/mechanics-m0';
import { getInventory, INVENTORY_SECTION, setInventory, useMedPatch } from '../inventory/inventory';
import type { GearInfo, InventoryState } from '../inventory/types';
import type { LootGear } from '../loot/types';

export const AFFIX_DMG_PCT = 'M1_AFFIX_01';
export const AFFIX_ARMOR = 'M1_AFFIX_05';
export const AFFIX_MEDHEAL_PCT = 'M1_AFFIX_06';

/** +% basic-attack damage, summed across equipped gear (balans §3.2). */
export const AFFIX_DMG_CAP = 50;
/** +% Med-Patch healing. The 2 s duration does not change. */
export const AFFIX_HEAL_CAP = 60;

/** +40 HP over 2 s, then 4 s before the next patch (mechaniki §2.13). */
export const MEDPATCH_HEAL_HP = 40;
export const MEDPATCH_HEAL_MS = 2000;
export const MEDPATCH_COOLDOWN_MS = 4000;

interface PatchRuntime {
  prev: boolean;
  leftMilli: number;
  ticksLeft: number;
  acc: number;
  cooldown: number;
}

const patches = new WeakMap<GameState, PatchRuntime>();

function runtime(state: GameState): PatchRuntime {
  let rt = patches.get(state);
  if (!rt) {
    rt = { prev: false, leftMilli: 0, ticksLeft: 0, acc: 0, cooldown: 0 };
    patches.set(state, rt);
  }
  return rt;
}

function section(state: GameState): InventoryState | undefined {
  return state.sections[INVENTORY_SECTION] as InventoryState | undefined;
}

function affixSum(inv: InventoryState, id: string, cap: number | null): number {
  let sum = 0;
  for (const slot of GEAR_SLOTS) {
    const affixes = inv.gear[slot]?.gear?.affixes;
    if (!affixes) continue;
    for (const a of affixes) if (a.id === id) sum += a.value;
  }
  if (cap === null) return sum;
  return Math.min(cap, Math.max(0, sum));
}

/**
 * Issue Suit is 0 until stop 2 (`issueArmor`, from `issueMk2Grant`).
 * A rolled armour piece contributes its ARMOR_BASE, then Plated on armour and module.
 */
export function equippedArmorValue(inv: InventoryState, issueArmor = 0): number {
  const piece = inv.gear.armor;
  const base = piece?.gear?.base;
  const fromPiece = base?.id === 'ARMOR_BASE' ? base.value : 0;
  const fromIssue = !base && piece?.itemId === ISSUE_SUIT_ITEM_ID ? issueArmor : 0;
  return fromPiece + fromIssue + affixSum(inv, AFFIX_ARMOR, null);
}

/** Write `c.player.armor` from the equipped piece. No inventory section → leave the combat value alone. */
export function syncPlayerArmor(state: GameState, player: { armor: number }): void {
  const inv = section(state);
  if (!inv) return;
  const grant = issueMk2Grant(getNetworkProgress(state));
  player.armor = equippedArmorValue(inv, grant?.suit.armor ?? 0);
}

export function equippedWeaponKind(state: GameState): 'melee' | 'ranged' {
  const weapon = section(state)?.gear.weapon;
  const kind = weapon?.gear?.weaponKind;
  if (kind === 'melee' || kind === 'ranged') return kind;
  const id = weapon?.itemId;
  return id && ITEM_DEFS[id]?.weaponType === 'ranged' ? 'ranged' : 'melee';
}

/**
 * Inclusive roll for one swing or shot.
 * Issue Pole (no rolled base) keeps the profile min/max, which is the Issue Pole 8–12.
 * A loot weapon uses its rolled gear stat as both ends.
 */
export function weaponDamageBounds(
  state: GameState,
  cfg: CombatConfig,
  kind: 'melee' | 'ranged',
): { min: number; max: number } {
  const fallback =
    kind === 'ranged'
      ? { min: cfg.RANGED_DMG_MIN, max: cfg.RANGED_DMG_MAX }
      : { min: cfg.PLAYER_DMG_MIN, max: cfg.PLAYER_DMG_MAX };
  const weapon = section(state)?.gear.weapon;
  const base = weapon?.gear?.base;
  if (!base && kind === 'melee' && weapon?.itemId === ISSUE_POLE_ITEM_ID) {
    const pole = issueMk2Grant(getNetworkProgress(state))?.pole;
    if (pole) return { min: pole.dmgMin, max: pole.dmgMax };
  }
  if (!base) return fallback;
  if (kind === 'melee' && base.id === 'WEAPON_MELEE_DMG')
    return { min: base.value, max: base.value };
  if (kind === 'ranged' && base.id === 'WEAPON_RANGED_DMG')
    return { min: base.value, max: base.value };
  return fallback;
}

/**
 * One damage roll. Calls `rng.int` exactly once (same stream position as the old min/max roll).
 * A damage affix multiplies that roll and stays fractional so crit / Momentum share the one `round`.
 */
export function rollWeaponDamage(
  state: GameState,
  cfg: CombatConfig,
  rng: Rng,
  kind: 'melee' | 'ranged',
): number {
  const bounds = weaponDamageBounds(state, cfg, kind);
  const rolled = rng.int(bounds.min, bounds.max);
  const inv = section(state);
  if (!inv) return rolled;
  const pct = affixSum(inv, AFFIX_DMG_PCT, AFFIX_DMG_CAP);
  if (pct === 0) return rolled;
  return rolled * (1 + pct / 100);
}

/** Whole HP a Med-Patch will deliver, including Patched / of Repair up to +60%. */
export function medPatchHealTotal(state: GameState): number {
  const inv = section(state);
  const pct = inv ? affixSum(inv, AFFIX_MEDHEAL_PCT, AFFIX_HEAL_CAP) : 0;
  return Math.round(MEDPATCH_HEAL_HP * (1 + pct / 100));
}

export function medPatchRuntime(state: GameState): { cooldown: number; ticksLeft: number } {
  const rt = patches.get(state);
  return { cooldown: rt?.cooldown ?? 0, ticksLeft: rt?.ticksLeft ?? 0 };
}

/** Drop a heal that was still ticking (death). A held Q must be pressed again. */
export function clearMedPatch(state: GameState): void {
  const rt = patches.get(state);
  if (!rt) return;
  rt.leftMilli = 0;
  rt.ticksLeft = 0;
  rt.acc = 0;
  rt.cooldown = 0;
  rt.prev = true;
}

/**
 * Rising edge of Q / the heal button. Consumes one Med-Patch and starts the 2 s heal.
 * Cooldown, an empty bag, or full HP does not consume a patch.
 */
export function handleMedPatchInput(
  state: GameState,
  cfg: CombatConfig,
  healDown: boolean,
  player: { hp: number; maxHp: number },
): void {
  const rt = runtime(state);
  const pressed = healDown && !rt.prev;
  rt.prev = healDown;
  if (!pressed || rt.cooldown > 0) return;
  if (player.hp <= 0 || player.hp >= player.maxHp) return;
  if (!section(state)) return;
  const res = useMedPatch(getInventory(state));
  if (!res.ok) return;
  setInventory(state, res.state);
  const ticks = msToTicks(MEDPATCH_HEAL_MS, cfg.TICK_MS);
  rt.leftMilli = medPatchHealTotal(state) * 1000;
  rt.ticksLeft = ticks;
  rt.acc = 0;
  rt.cooldown = msToTicks(MEDPATCH_COOLDOWN_MS, cfg.TICK_MS);
}

/** Apply this tick's share of the open Med-Patch and count the cooldown down. */
export function tickMedPatch(state: GameState, player: { hp: number; maxHp: number }): void {
  const rt = patches.get(state);
  if (!rt) return;
  if (rt.ticksLeft > 0 && player.hp > 0) {
    const chunk = Math.floor(rt.leftMilli / rt.ticksLeft);
    rt.leftMilli -= chunk;
    rt.acc += chunk;
    const gain = Math.floor(rt.acc / 1000);
    rt.acc -= gain * 1000;
    if (gain > 0 && player.hp < player.maxHp) {
      player.hp = Math.min(player.maxHp, player.hp + gain);
    }
    rt.ticksLeft -= 1;
    if (rt.ticksLeft === 0) {
      rt.leftMilli = 0;
      rt.acc = 0;
    }
  }
  if (rt.cooldown > 0) rt.cooldown -= 1;
}

/** Store a loot roll on an inventory gear piece (uid is assigned by pickupItem). */
export function gearInfoFromLoot(drop: LootGear): Omit<GearInfo, 'uid'> {
  const info: Omit<GearInfo, 'uid'> = {
    slot: drop.slot,
    rarity: drop.rarity,
    ilvl: drop.ilvl,
    nameId: drop.nameId,
    affixes: drop.affixes.map((a) => ({ id: a.id, value: a.value })),
    base: { id: drop.base.id, value: drop.base.value },
  };
  if (drop.slot === 'weapon') info.weaponKind = drop.weaponKind;
  return info;
}
