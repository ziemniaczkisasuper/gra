// English lines for the M1 base screens.
// Lore sentences are copied from docs/fabula/teksty-m1-en.md. Do not edit that file from here.
// M1_UI_INV_COMBAT has an id in prog/ui-m1.md §2.6 and no sentence in the lore file yet.
// The line below is that section's meaning: the fight is still going and the game did not stop.
// Labels in M1_UI_COPY are the working English for ids ui-m1.md §8 still owes to Lore.

export const M1_COPY = {
  M1_BASE_01: 'Hunter 47. Print complete. Grid status: dark.',
  M1_BASE_02:
    'Your task is simple. Go up, find the power lines, and turn them back on. The lift is ready.',
  M1_BASE_03: 'Hunter 47. Print complete. Your gear is gone. Your memory is here.',
  M1_BASE_03B: 'Hunter 47. Print complete. Your memory is here.',
  M1_BASE_04: 'Signal lost. Hunter 47 is down. Starting a new print.',
  M1_BASE_05: 'Welcome back, Hunter 47. Syncing memory. Please do not move during the sync.',
  M1_BASE_06: 'The lift is here. I can hold it for 10 seconds. Please be fast.',
  M1_BASE_07: 'The lift is going down. I cannot hold it longer. Call again when you can.',
  M1_BASE_08:
    'Power to the bunker is back. The lights above the base are on. You can see them from the zone now.',
  M1_BASE_09: 'Line restored. A new part of Sector 1 is on the map. Good work.',
  M1_BASE_10: 'New order on the terminal. It is short. You can do it before the next long run.',
  M1_BASE_11: 'SESSION REPORT — HUNTER 47',
  M1_BASE_12:
    'Time in zone: {time} · Deepest level: {depth} · Items brought back: {items_in} · Items left in zone: {items_lost} · Credits: {credits} · Grid restored: {grid_pct}%',
  M1_BASE_13: 'All data is saved. The grid is a little less dark.',
  M1_BASE_14: 'All data is saved. Your gear is gone.',
  M1_BASE_14B: 'All data is saved. Nothing was lost.',
  M1_BASE_15:
    'More lights above the base. The Exchange lit one more shelf, and the locker has more room.',
  M1_BASE_16:
    'All lights above the base are on. The Exchange now finds Grid-Grade goods more often. It looks happy, for a machine.',
  M1_BASE_17: 'The lift stops at depth 2 now. The Vat prints better Issue gear for you.',
  M1_RISK_02: 'Can be lost if you die.',
  M1_RISK_02_TAG: 'AT RISK',
  M1_RISK_03: 'Issue gear. You never lose it.',
  M1_RISK_04:
    'You lost your bag, your gear except Issue, and the credits from this zone: {items_lost} items, {cr_lost} cr. You cannot get them back from your body. [[PAGE]] Safe: your locker, base credits, base upgrades, the grid and solved terminals.',
  M1_RISK_04_OK: 'OK',
  M1_TERM_BTN_NEXT: 'NEXT',
  M1_UI_INV_COMBAT: 'The fight goes on. The game did not stop.',
  M1_EXCH_01: 'EXCHANGE ONLINE. Supply must keep flowing. How can I help you, customer?',
  M1_EXCH_02: 'Purchase complete. Thank you for keeping supply flowing.',
  M1_EXCH_03: 'Item accepted. {credits} Grid credits added. Scrap is also supply.',
  M1_EXCH_04: 'Not enough credits. Please bring more scrap. I am always open.',
  M1_EXCH_05: 'Your bag is full. I cannot give you more. Please sell something first.',
  M1_EXCH_06: 'Come back soon. You are my only customer this year.',
  M1_EXCH_07: 'New stats are ready. Please choose. I do not judge.',
  M1_SYS_06: 'Bag full.',
  M1_GEAR_MEDPATCH: 'Med-Patch',
  M1_CAL_BTN: 'NEW STATS',
  M1_CAL_COST: 'Cost: {CALIBRATE_COST} cr. You pay before you choose.',
  M1_CAL_CONFIRM: 'You pay first. The money does not come back, even if you keep the old stats.',
  M1_CAL_CONFIRM_YES: 'PAY',
  M1_CAL_CONFIRM_NO: 'BACK',
  M1_CAL_NOT_R1: 'Only Tuned or Grid-Grade items.',
  M1_CAL_NOT_ISSUE: 'Issue gear cannot get new stats.',
  M1_CAL_OLD_HEAD: 'OLD',
  M1_CAL_NEW_HEAD: 'NEW',
  M1_CAL_KEEP: 'KEEP OLD',
  M1_CAL_TAKE: 'TAKE NEW',
  M1_UI_BTN_LIFT: 'LIFT',
  M1_UI_BTN_CONTINUE: 'CONTINUE',
  M1_DEATH_01: 'Killed by: {enemy_name}',
} as const;

export type M1CopyId = keyof typeof M1_COPY;

/** Working labels for ui-m1.md §8 ids that Lore has not written yet. */
export const M1_UI_COPY = {
  M1_UI_SCR_EXCHANGE: 'EXCHANGE',
  M1_UI_SCR_LOCKER: 'LOCKER',
  M1_UI_SCR_GEAR: 'GEAR',
  M1_UI_SCR_ORDERS: 'ORDERS',
  M1_UI_SCR_SETTINGS: 'SETTINGS',
  M1_UI_BTN_BACK: 'BACK',
  M1_UI_BTN_BUY: 'BUY',
  M1_UI_BTN_SELL: 'SELL',
  M1_UI_BTN_TAKE: 'TAKE',
  M1_UI_BTN_STORE: 'STORE',
  M1_UI_BTN_EQUIP: 'EQUIP',
  M1_UI_BTN_UNEQUIP: 'UNEQUIP',
  M1_UI_BTN_DROP: 'DROP',
  M1_UI_BTN_REFRESH: 'REFRESH',
  M1_UI_BTN_CONFIRM: 'CONFIRM',
  M1_UI_SAFE: 'SAFE',
  M1_UI_CAN_BE_LOST: 'CAN BE LOST',
  M1_UI_EMPTY_SLOT: '(empty)',
  M1_UI_CANT_SELL: "CAN'T SELL",
  M1_UI_EMPTY_SELL: 'Nothing to sell.',
  M1_UI_EMPTY_LOCKER: 'The locker is empty.',
  M1_UI_LOCKER_FULL: 'Locker full.',
  M1_UI_ISSUE_TAG: 'ISSUE',
  M1_UI_CONFIRM_SELL_RARE: 'Sell this Grid-Grade item? This cannot be undone.',
  M1_UI_CONFIRM_DROP: 'Drop this? It stays in the zone until the run ends.',
  M1_UI_REP_TIME: 'Time in zone',
  M1_UI_REP_DEPTH: 'Deepest level',
  M1_UI_REP_ITEMS_IN: 'Items brought back',
  M1_UI_REP_ITEMS_LOST: 'Items left in zone',
  M1_UI_REP_CREDITS: 'Credits',
  M1_UI_REP_CREDITS_LOST: 'Credits lost',
  M1_UI_REP_GRID: 'Grid restored',
  M1_UI_REP_KILLS: 'Enemies destroyed',
  M1_UI_REP_ORDERS: 'Orders',
  M1_UI_REP_PROGRESS: 'Progress',
  M1_UI_REP_KILLED_BY: 'Killed by',
  M1_UI_REP_LOST: 'Lost',
  M1_UI_SLOT_WEAPON: 'WEAPON',
  M1_UI_SLOT_ARMOR: 'ARMOR',
  M1_UI_SLOT_MODULE: 'MODULE',
  M1_UI_SLOT_TOOL: 'TOOL',
  M1_UI_BAG: 'BAG',
  M1_UI_AT_RISK: 'AT RISK',
} as const;

/** Replace `{token}` placeholders. Unknown tokens stay as written. */
export function fillCopy(
  template: string,
  tokens: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (raw, key: string) =>
    Object.prototype.hasOwnProperty.call(tokens, key) ? String(tokens[key]) : raw,
  );
}
