// Gear screen (T26). 4 slots + backpack 12. Keys: I toggle, F equip/use, X drop.
// Outside combat in a zone the host is asked to pause. In combat it does not pause.
// DR comparison uses the same A/(A+100) cap 60% as combat applyArmor, truncated to 0.1.
import './m1-screens.css';
import { applyArmor } from '../combat/combat';
import { COMBAT_M1 } from '../data/combat-m0';
import type { ItemSlot } from '../data/style';
import { LOOT_RARITY } from '../data/style';
import {
  computeAtRisk,
  dropItem,
  equip,
  getGear,
  getRunInventory,
  moveToLocker,
  unequip,
  useMedPatch,
} from '../inventory/inventory';
import type { ContractInputEvent, InvItem, InventoryState, ItemStack } from '../inventory/types';
import { el } from './dom';
import { M1_COPY, M1_UI_COPY } from './m1-copy';

const GEAR_ORDER: readonly ItemSlot[] = ['weapon', 'armor', 'module', 'tool'];
const SLOT_LABEL: Record<ItemSlot, string> = {
  weapon: M1_UI_COPY.M1_UI_SLOT_WEAPON,
  armor: M1_UI_COPY.M1_UI_SLOT_ARMOR,
  module: M1_UI_COPY.M1_UI_SLOT_MODULE,
  tool: M1_UI_COPY.M1_UI_SLOT_TOOL,
};
const ARMOR_AFFIX = 'M1_AFFIX_05';

export interface InventoryScreenOptions {
  getState(): InventoryState;
  /** Store the returned state. Refresh the HUD from getRunInventory / computeAtRisk. */
  commit(next: InventoryState): void;
  /** Zone combat. The screen does not pause while this is true. */
  inCombat: boolean;
  /**
   * Zone, and not in combat: pause the world for as long as the screen is open.
   * Base never pauses. Combat never pauses.
   */
  onPause(paused: boolean): void;
  place: 'base' | 'zone';
  /** Issue suit armor. Mk1 is 0, Mk2 is 6. Default 0. */
  issueArmor?: number;
  /**
   * Rolled base armor plus affixes, when the host stored the base roll.
   * Without this, found armor uses the Plated affix only (GearInfo has no base).
   */
  armorOf?: (stack: ItemStack) => number;
  onDrop?(dropped: InvItem): void;
  /** Data Core drops. Feed these to the contracts module. */
  onContractEvents?(events: readonly ContractInputEvent[]): void;
  doc?: Document;
}

export interface InventoryScreen {
  open(): void;
  close(): void;
  toggle(): void;
  setInCombat(inCombat: boolean): void;
  destroy(): void;
  readonly isOpen: boolean;
  readonly element: HTMLElement;
}

type Focus = { column: 'gear' | 'bag'; index: number };

/** DR fraction. Same formula as applyArmor: min(cap, A / (A + K)), K = 100, cap = 60%. */
export function drOfArmor(armor: number): number {
  if (armor <= 0) return 0;
  return Math.min(COMBAT_M1.ARMOR_DR_CAP, armor / (armor + COMBAT_M1.ARMOR_DR_K));
}

/** What a raw hit becomes after armor. Delegates to combat so the screen cannot drift. */
export function previewArmorHit(rawDamage: number, armor: number): number {
  return applyArmor(rawDamage, armor, COMBAT_M1);
}

/** Truncate to one decimal percent. 23.07 → 23, 3.84 → 3.8. Whole numbers omit the decimal. */
export function formatDrPercent(armor: number): string {
  return formatTenths(Math.trunc(drOfArmor(armor) * 1000));
}

/** Change in displayed DR if `candidateArmor` replaces `equippedArmor`. */
export function formatDrCompare(equippedArmor: number, candidateArmor: number): string {
  const delta =
    Math.trunc(drOfArmor(candidateArmor) * 1000) - Math.trunc(drOfArmor(equippedArmor) * 1000);
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  return `${sign}${formatTenths(Math.abs(delta))} DR`;
}

function formatTenths(tenths: number): string {
  const whole = Math.trunc(tenths / 10);
  const frac = tenths % 10;
  return frac === 0 ? `${whole}%` : `${whole}.${frac}%`;
}

export function armorValueOf(
  stack: ItemStack | null,
  opts: { issueArmor?: number; armorOf?: (stack: ItemStack) => number } = {},
): number | null {
  if (!stack || stack.slot !== 'armor') return null;
  if (opts.armorOf) return opts.armorOf(stack);
  if (stack.tag === 'ISSUE') return opts.issueArmor ?? 0;
  let armor = 0;
  for (const affix of stack.affixes ?? []) if (affix.id === ARMOR_AFFIX) armor += affix.value;
  return armor;
}

export function mountInventoryScreen(
  root: HTMLElement,
  opts: InventoryScreenOptions,
): InventoryScreen {
  const doc = opts.doc ?? document;
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'gear';
  screen.hidden = true;
  const panel = el('div', { className: 'm1-panel' });
  screen.append(panel);
  root.append(screen);

  let open = false;
  let inCombat = opts.inCombat;
  let paused = false;
  let focus: Focus = { column: 'gear', index: 0 };
  let pendingDrop = false;

  const syncPause = () => {
    const want = open && opts.place === 'zone' && !inCombat;
    if (want === paused) return;
    paused = want;
    opts.onPause(want);
  };

  const render = () => {
    screen.classList.toggle('is-combat', opts.place === 'zone' && inCombat);
    screen.classList.toggle('is-paused', opts.place === 'zone' && !inCombat);
    const state = opts.getState();
    const run = getRunInventory(state);
    const gear = getGear(state);
    const atRisk = computeAtRisk(state);

    const combatBar = el('p', {
      className: 'm1-combat-bar',
      textContent: M1_COPY.M1_UI_INV_COMBAT,
    });
    combatBar.dataset.role = 'combat-bar';
    combatBar.hidden = !(opts.place === 'zone' && inCombat);

    const title = el('span', { className: 'm1-title', textContent: M1_UI_COPY.M1_UI_SCR_GEAR });
    const risk = el('span', { textContent: `${M1_UI_COPY.M1_UI_AT_RISK}: ${atRisk} cr` });
    risk.dataset.field = 'at-risk';
    const back = actionButton(M1_UI_COPY.M1_UI_BTN_BACK, 'back', () => api.close());
    const head = el('div', { className: 'm1-head' }, [title, risk, back]);

    const gearCol = el('div', { className: 'm1-col' });
    GEAR_ORDER.forEach((slot, index) => {
      const stack = gear[slot];
      const button = slotButton(
        SLOT_LABEL[slot],
        stack,
        focus.column === 'gear' && focus.index === index,
      );
      button.dataset.gear = slot;
      button.addEventListener('click', () => {
        focus = { column: 'gear', index };
        pendingDrop = false;
        render();
      });
      gearCol.append(button);
    });

    const bagLabel = el('div', {
      textContent: `${M1_UI_COPY.M1_UI_BAG} ${run.usedSlots}/${run.slotsMax}`,
    });
    const grid = el('div', { className: 'm1-grid' });
    run.slots.forEach((stack, index) => {
      const button = slotButton(
        stack ? `${stack.glyph} ×${stack.count}` : M1_UI_COPY.M1_UI_EMPTY_SLOT,
        stack,
        focus.column === 'bag' && focus.index === index,
      );
      button.dataset.bag = String(index);
      button.addEventListener('click', () => {
        focus = { column: 'bag', index };
        pendingDrop = false;
        render();
      });
      grid.append(button);
    });
    const bagCol = el('div', { className: 'm1-col' }, [bagLabel, grid]);

    const focused = focusedStack(gear, run.slots, focus);
    const details = el('div', { className: 'm1-details' });
    details.dataset.role = 'details';
    details.append(detailsBlock(focused, gear.armor, opts));
    if (pendingDrop) {
      details.append(el('p', { textContent: M1_UI_COPY.M1_UI_CONFIRM_DROP }));
    }

    const equipLabel =
      focused?.equipped && focused.tag !== 'ISSUE'
        ? M1_UI_COPY.M1_UI_BTN_UNEQUIP
        : M1_UI_COPY.M1_UI_BTN_EQUIP;
    const equipBtn = actionButton(`${equipLabel} (F)`, 'equip', () => actEquip());
    const dropLabel =
      opts.place === 'zone'
        ? `${M1_UI_COPY.M1_UI_BTN_DROP} (X)`
        : `${M1_UI_COPY.M1_UI_BTN_STORE} (X)`;
    const dropBtn = actionButton(
      pendingDrop ? M1_UI_COPY.M1_UI_BTN_CONFIRM : dropLabel,
      pendingDrop ? 'confirm-drop' : 'drop',
      () => actDrop(),
    );
    const actions = el('div', { className: 'm1-actions' }, [equipBtn, dropBtn]);

    const split = el('div', { className: 'm1-split' }, [
      el('div', { className: 'm1-col' }, [gearCol, bagCol]),
      el('div', { className: 'm1-col' }, [details, actions]),
    ]);
    panel.replaceChildren(combatBar, head, split);
  };

  const actEquip = () => {
    const state = opts.getState();
    if (focus.column === 'bag') {
      const stack = getRunInventory(state).slots[focus.index];
      if (!stack) return;
      if (stack.id === 'M1_ITEM_MEDPATCH') {
        const used = useMedPatch(state);
        if (!used.ok) return;
        opts.commit(used.state);
        render();
        return;
      }
      const result = equip(state, focus.index, 'bag');
      if (!result.ok) {
        if (result.reason === 'bagFull') showStatus(M1_COPY.M1_SYS_06);
        return;
      }
      opts.commit(result.state);
      pendingDrop = false;
      render();
      return;
    }
    const slot = GEAR_ORDER[focus.index];
    if (!slot) return;
    const result = unequip(state, slot, 'bag');
    if (!result.ok) {
      if (result.reason === 'bagFull') showStatus(M1_COPY.M1_SYS_06);
      return;
    }
    opts.commit(result.state);
    pendingDrop = false;
    render();
  };

  const actDrop = () => {
    const state = opts.getState();
    if (opts.place === 'base') {
      if (focus.column === 'bag') {
        const stored = moveToLocker(state, focus.index);
        if (!stored.ok) {
          if (stored.reason === 'lockerFull') showStatus(M1_UI_COPY.M1_UI_LOCKER_FULL);
          return;
        }
        opts.commit(stored.state);
      } else {
        const slot = GEAR_ORDER[focus.index];
        if (!slot) return;
        const stored = unequip(state, slot, 'locker');
        if (!stored.ok) {
          if (stored.reason === 'lockerFull') showStatus(M1_UI_COPY.M1_UI_LOCKER_FULL);
          return;
        }
        opts.commit(stored.state);
      }
      pendingDrop = false;
      render();
      return;
    }
    if (focus.column !== 'bag') return;
    const stack = getRunInventory(state).slots[focus.index];
    if (!stack) return;
    const rare = stack.rarity === 2 || stack.rarity === 3;
    if (rare && !pendingDrop) {
      pendingDrop = true;
      render();
      return;
    }
    const dropped = dropItem(state, focus.index);
    if (!dropped.ok) return;
    opts.commit(dropped.state);
    if (dropped.dropped) opts.onDrop?.(dropped.dropped);
    if (dropped.contractEvents?.length) opts.onContractEvents?.(dropped.contractEvents);
    pendingDrop = false;
    render();
  };

  const showStatus = (text: string) => {
    const line = el('p', { className: 'm1-status', textContent: text });
    line.dataset.role = 'status';
    panel.append(line);
  };

  const onKey = (event: KeyboardEvent) => {
    if (!root.isConnected && !screen.isConnected) return;
    if (!open) {
      if (event.code !== 'KeyI' || event.repeat) return;
      event.preventDefault();
      event.stopPropagation();
      api.open();
      return;
    }
    if (event.repeat) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    const handled = [
      'KeyI',
      'Escape',
      'KeyF',
      'KeyX',
      'Enter',
      'NumpadEnter',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'Tab',
    ];
    if (!handled.includes(event.code)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.code === 'KeyI' || event.code === 'Escape') {
      api.close();
      return;
    }
    if (event.code === 'KeyF' || event.code === 'Enter' || event.code === 'NumpadEnter') {
      actEquip();
      return;
    }
    if (event.code === 'KeyX') {
      actDrop();
      return;
    }
    moveFocus(event.code);
    pendingDrop = false;
    render();
  };

  const moveFocus = (code: string) => {
    if (code === 'Tab' || code === 'ArrowLeft' || code === 'ArrowRight') {
      focus = { column: focus.column === 'gear' ? 'bag' : 'gear', index: 0 };
      return;
    }
    const max = focus.column === 'gear' ? GEAR_ORDER.length : 12;
    if (code === 'ArrowDown') focus = { ...focus, index: (focus.index + 1) % max };
    if (code === 'ArrowUp') focus = { ...focus, index: (focus.index - 1 + max) % max };
  };

  doc.addEventListener('keydown', onKey, true);

  const api: InventoryScreen = {
    element: screen,
    get isOpen() {
      return open;
    },
    open() {
      if (open) return;
      open = true;
      screen.hidden = false;
      syncPause();
      render();
    },
    close() {
      if (!open) return;
      open = false;
      pendingDrop = false;
      screen.hidden = true;
      syncPause();
    },
    toggle() {
      if (open) api.close();
      else api.open();
    },
    setInCombat(next: boolean) {
      inCombat = next;
      syncPause();
      if (open) render();
    },
    destroy() {
      if (open) api.close();
      doc.removeEventListener('keydown', onKey, true);
      screen.remove();
    },
  };
  return api;
}

function focusedStack(
  gear: ReturnType<typeof getGear>,
  bag: readonly (ItemStack | null)[],
  focus: Focus,
): ItemStack | null {
  if (focus.column === 'gear') return gear[GEAR_ORDER[focus.index] ?? 'weapon'];
  return bag[focus.index] ?? null;
}

function detailsBlock(
  stack: ItemStack | null,
  equippedArmor: ItemStack | null,
  opts: InventoryScreenOptions,
): HTMLElement {
  const box = el('div');
  if (!stack) {
    box.append(el('p', { textContent: M1_UI_COPY.M1_UI_EMPTY_SLOT }));
    return box;
  }
  const rarity = stack.rarity ? LOOT_RARITY[stack.rarity].name : '';
  box.append(el('p', { textContent: `${stack.glyph} ${stack.nameId} ${rarity}`.trim() }));
  if (stack.tag === 'ISSUE') {
    const tag = el('span', { className: 'm1-issue-tag', textContent: M1_UI_COPY.M1_UI_ISSUE_TAG });
    box.append(tag, el('p', { textContent: M1_COPY.M1_RISK_03 }));
  } else if (stack.tag === 'RISK') {
    const tag = el('span', { className: 'm1-risk-tag', textContent: M1_COPY.M1_RISK_02_TAG });
    tag.dataset.risk = 'yes';
    box.append(tag, el('p', { textContent: M1_COPY.M1_RISK_02 }));
  }
  box.append(el('p', { textContent: `Value ${stack.valueCr} cr` }));
  const candidate = armorValueOf(stack, opts);
  const equipped = armorValueOf(equippedArmor, opts);
  if (candidate !== null && equipped !== null) {
    const line = el('p', {
      textContent: `DR ${formatDrPercent(candidate)} · vs equipped: ${formatDrCompare(equipped, candidate)} · 10 dmg → ${previewArmorHit(10, candidate)}`,
    });
    line.dataset.role = 'dr';
    box.append(line);
  }
  for (const affix of stack.affixes ?? []) {
    box.append(el('p', { textContent: `${affix.id} +${affix.value}` }));
  }
  return box;
}

function slotButton(label: string, stack: ItemStack | null, selected: boolean): HTMLButtonElement {
  const button = el('button', { type: 'button', tabIndex: 0 });
  button.className = selected ? 'is-selected' : '';
  const tag =
    stack?.tag === 'ISSUE'
      ? M1_UI_COPY.M1_UI_ISSUE_TAG
      : stack?.tag === 'RISK'
        ? M1_COPY.M1_RISK_02_TAG
        : '';
  button.textContent = tag ? `${label} ${tag}` : label;
  if (stack?.tag === 'RISK') button.dataset.risk = 'yes';
  if (stack?.tag === 'ISSUE') button.dataset.issue = 'yes';
  return button;
}

function actionButton(label: string, action: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { type: 'button', textContent: label, tabIndex: 0 });
  button.dataset.action = action;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    onClick();
  });
  return button;
}
