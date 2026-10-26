// Exchange screen (T28). Buy Med-Patches and the shelf into the locker. Sell from the
// bag, the locker, and equipped gear. Rarity 3 asks twice. NEW STATS pays first.
import './m1-screens.css';
import type { Rng } from '../core/rng';
import { AFFIXES } from '../data/loot-m1';
import { LOOT_RARITY } from '../data/style';
import {
  MEDPATCH_BUY_PRICE,
  applyCalibration,
  beginCalibration,
  buyMedPatch,
  buyOffer,
  canSell,
  paidRefresh,
  quoteCalibration,
  refreshCost,
  sell,
  type CalibrationOffer,
  type ExchangeShelf,
  type ItemRef,
} from '../inventory/exchange';
import { getCredits, getGear, getLocker, getRunInventory } from '../inventory/inventory';
import type { InventoryState, ItemStack } from '../inventory/types';
import { el } from './dom';
import { M1_COPY, M1_UI_COPY, fillCopy } from './m1-copy';

export interface ExchangeScreenOptions {
  getState(): InventoryState;
  commit(next: InventoryState): void;
  getShelf(): ExchangeShelf;
  setShelf(shelf: ExchangeShelf): void;
  /** Visit rng. Paid refresh and NEW STATS both draw from it. */
  rng: Rng;
  onBack(): void;
  doc?: Document;
}

export interface ExchangeScreen {
  refresh(): void;
  destroy(): void;
  readonly element: HTMLElement;
}

type Tab = 'buy' | 'sell';

interface SellRow {
  ref: ItemRef;
  stack: ItemStack;
}

export function mountExchangeScreen(
  root: HTMLElement,
  opts: ExchangeScreenOptions,
): ExchangeScreen {
  const doc = opts.doc ?? document;
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'exchange';
  const panel = el('div', { className: 'm1-panel' });
  screen.append(panel);
  root.append(screen);

  let tab: Tab = 'buy';
  let selected = 0;
  let status: string = M1_COPY.M1_EXCH_01;
  let confirmSell: SellRow | null = null;
  let confirmCal: SellRow | null = null;
  let offer: CalibrationOffer | null = null;

  const render = () => {
    const state = opts.getState();
    const shelf = opts.getShelf();
    const credits = getCredits(state);
    const title = el('span', { className: 'm1-title', textContent: M1_UI_COPY.M1_UI_SCR_EXCHANGE });
    const purse = el('span', { textContent: `CREDITS ${credits} cr` });
    purse.dataset.field = 'credits';
    const back = actionButton(M1_UI_COPY.M1_UI_BTN_BACK, 'back', () => opts.onBack());
    const head = el('div', { className: 'm1-head' }, [title, purse, back]);
    const buyTab = actionButton(M1_UI_COPY.M1_UI_BTN_BUY, 'tab-buy', () => {
      tab = 'buy';
      selected = 0;
      confirmSell = null;
      render();
    });
    const sellTab = actionButton(M1_UI_COPY.M1_UI_BTN_SELL, 'tab-sell', () => {
      tab = 'sell';
      selected = 0;
      render();
    });
    if (tab === 'buy') buyTab.classList.add('is-selected');
    else sellTab.classList.add('is-selected');
    const statusLine = el('p', { className: 'm1-status', textContent: status });
    statusLine.dataset.role = 'status';

    const body = tab === 'buy' ? buyColumn(state, shelf, credits) : sellColumn(state);
    panel.replaceChildren(
      head,
      el('div', { className: 'm1-actions' }, [buyTab, sellTab]),
      statusLine,
      body,
    );
  };

  const buyColumn = (state: InventoryState, shelf: ExchangeShelf, credits: number) => {
    const run = getRunInventory(state);
    const col = el('div', { className: 'm1-col' });
    const patch = actionButton(
      `${M1_COPY.M1_GEAR_MEDPATCH}  ${MEDPATCH_BUY_PRICE} cr  ${run.medPatchCount}/${run.medPatchMax}`,
      'buy-medpatch',
      () => {
        const result = buyMedPatch(opts.getState(), 1);
        if (!result.ok) {
          status =
            result.reason === 'insufficientCredits'
              ? M1_COPY.M1_EXCH_04
              : M1_UI_COPY.M1_UI_LOCKER_FULL;
          render();
          return;
        }
        opts.commit(result.state);
        status = M1_COPY.M1_EXCH_02;
        render();
      },
    );
    patch.dataset.price = String(MEDPATCH_BUY_PRICE);
    patch.disabled = credits < MEDPATCH_BUY_PRICE;
    col.append(patch);

    shelf.offers.forEach((row, index) => {
      if (!row) {
        const empty = el('div', {
          className: 'm1-choice',
          textContent: M1_UI_COPY.M1_UI_EMPTY_SLOT,
        });
        empty.dataset.index = String(index);
        col.append(empty);
        return;
      }
      const name = `${row.gear.slot} ${LOOT_RARITY[row.gear.rarity].name}`;
      const button = actionButton(
        `${name}  ${row.priceCr} cr  ${M1_COPY.M1_RISK_02_TAG}`,
        'buy-shelf',
        () => {
          const result = buyOffer(opts.getState(), opts.getShelf(), index);
          if (!result.ok) {
            status =
              result.reason === 'insufficientCredits'
                ? M1_COPY.M1_EXCH_04
                : M1_UI_COPY.M1_UI_LOCKER_FULL;
            render();
            return;
          }
          opts.commit(result.state);
          opts.setShelf(result.shelf);
          status = M1_COPY.M1_EXCH_02;
          render();
        },
      );
      button.dataset.index = String(index);
      button.dataset.price = String(row.priceCr);
      button.dataset.rarity = String(row.gear.rarity);
      button.disabled = credits < row.priceCr;
      const risk = el('span', { className: 'm1-risk-tag', textContent: M1_COPY.M1_RISK_02 });
      col.append(button, risk);
    });

    const cost = refreshCost(shelf.refreshesUsed);
    const refresh = actionButton(
      cost === null ? M1_UI_COPY.M1_UI_BTN_REFRESH : `${M1_UI_COPY.M1_UI_BTN_REFRESH} ${cost} cr`,
      'refresh',
      () => {
        const result = paidRefresh(opts.getState(), opts.getShelf(), opts.rng);
        if (!result.ok) {
          status =
            result.reason === 'insufficientCredits'
              ? M1_COPY.M1_EXCH_04
              : M1_UI_COPY.M1_UI_BTN_REFRESH;
          render();
          return;
        }
        opts.commit(result.state);
        opts.setShelf(result.shelf);
        status = M1_COPY.M1_EXCH_01;
        render();
      },
    );
    refresh.dataset.price = cost === null ? '' : String(cost);
    refresh.disabled = cost === null || credits < cost;
    col.append(refresh);
    return col;
  };

  const sellColumn = (state: InventoryState) => {
    const rows = sellRows(state);
    const col = el('div', { className: 'm1-col' });
    if (rows.length === 0) col.append(el('p', { textContent: M1_UI_COPY.M1_UI_EMPTY_SELL }));
    rows.forEach((row, index) => {
      const sellable = canSell(itemOf(state, row.ref));
      const price = sellable ? row.stack.valueCr : 0;
      const tag = sellable ? `${price} cr` : M1_UI_COPY.M1_UI_CANT_SELL;
      const button = actionButton(
        `${row.stack.glyph} ${row.stack.nameId}  ${tag}`,
        'sell-row',
        () => {
          selected = index;
          confirmSell = null;
          confirmCal = null;
          offer = null;
          render();
        },
      );
      button.dataset.index = String(index);
      if (!sellable) button.dataset.cantSell = 'yes';
      if (index === selected) button.classList.add('is-selected');
      col.append(button);
    });
    const row = rows[selected];
    if (row && canSell(itemOf(state, row.ref))) {
      col.append(
        actionButton(`${M1_UI_COPY.M1_UI_BTN_SELL} ${row.stack.valueCr} cr`, 'sell', () =>
          doSell(row, false),
        ),
      );
    }
    if (confirmSell) {
      col.append(el('p', { textContent: M1_UI_COPY.M1_UI_CONFIRM_SELL_RARE }));
      col.append(
        actionButton(M1_UI_COPY.M1_UI_BTN_CONFIRM, 'confirm-sell', () =>
          doSell(confirmSell!, true),
        ),
      );
    }
    if (row) {
      const quote = quoteCalibration(itemOf(state, row.ref));
      if (quote.eligible) {
        const label = `${M1_COPY.M1_CAL_BTN} ${quote.costCr} cr`;
        col.append(
          actionButton(label, 'calibrate', () => {
            confirmCal = row;
            status = fillCopy(M1_COPY.M1_CAL_COST, { CALIBRATE_COST: quote.costCr });
            render();
          }),
        );
      } else if (quote.reason === 'rarity') {
        col.append(el('p', { textContent: M1_COPY.M1_CAL_NOT_R1 }));
      }
    }
    if (confirmCal && !offer) {
      col.append(el('p', { textContent: M1_COPY.M1_CAL_CONFIRM }));
      col.append(actionButton(M1_COPY.M1_CAL_CONFIRM_YES, 'pay-cal', () => payCal(confirmCal!)));
      col.append(
        actionButton(M1_COPY.M1_CAL_CONFIRM_NO, 'cal-back', () => {
          confirmCal = null;
          render();
        }),
      );
    }
    if (offer) {
      col.append(el('p', { textContent: M1_COPY.M1_EXCH_07 }));
      const oldHead = el('p', {
        textContent: `${M1_COPY.M1_CAL_OLD_HEAD} ${affixLine(offer.oldAffixes)}`,
      });
      oldHead.dataset.role = 'cal-old';
      const newHead = el('p', {
        textContent: `${M1_COPY.M1_CAL_NEW_HEAD} ${affixLine(offer.newAffixes)}`,
      });
      newHead.dataset.role = 'cal-new';
      col.append(oldHead, newHead);
      col.append(actionButton(M1_COPY.M1_CAL_KEEP, 'keep-old', () => choose('keep')));
      col.append(actionButton(M1_COPY.M1_CAL_TAKE, 'take-new', () => choose('take')));
    }
    return col;
  };

  const doSell = (row: SellRow, confirm: boolean) => {
    const result = sell(opts.getState(), row.ref, confirm);
    if (!result.ok) {
      if (result.reason === 'needsConfirm') {
        confirmSell = row;
        status = M1_UI_COPY.M1_UI_CONFIRM_SELL_RARE;
        render();
        return;
      }
      status = M1_UI_COPY.M1_UI_CANT_SELL;
      render();
      return;
    }
    opts.commit(result.state);
    confirmSell = null;
    status = fillCopy(M1_COPY.M1_EXCH_03, { credits: result.gained });
    render();
  };

  const payCal = (row: SellRow) => {
    const result = beginCalibration(opts.getState(), row.ref, opts.rng);
    if (!result.ok) {
      status = result.reason === 'insufficientCredits' ? M1_COPY.M1_EXCH_04 : M1_COPY.M1_CAL_NOT_R1;
      render();
      return;
    }
    opts.commit(result.state);
    offer = result.offer;
    confirmCal = null;
    status = M1_COPY.M1_EXCH_07;
    render();
  };

  const choose = (choice: 'keep' | 'take') => {
    if (!offer) return;
    const result = applyCalibration(opts.getState(), offer, choice);
    if (!result.ok) {
      status = M1_COPY.M1_CAL_NOT_R1;
      render();
      return;
    }
    opts.commit(result.state);
    offer = null;
    status = M1_COPY.M1_EXCH_02;
    render();
  };

  const onKey = (event: KeyboardEvent) => {
    if (!screen.isConnected) return;
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      opts.onBack();
    }
  };
  doc.addEventListener('keydown', onKey, true);
  render();

  return {
    element: screen,
    refresh() {
      render();
    },
    destroy() {
      doc.removeEventListener('keydown', onKey, true);
      screen.remove();
    },
  };
}

function sellRows(state: InventoryState): SellRow[] {
  const rows: SellRow[] = [];
  getRunInventory(state).slots.forEach((stack, index) => {
    if (stack) rows.push({ ref: { kind: 'bag', index }, stack });
  });
  getLocker(state).slots.forEach((stack, index) => {
    if (stack) rows.push({ ref: { kind: 'locker', index }, stack });
  });
  const gear = getGear(state);
  (['weapon', 'armor', 'module', 'tool'] as const).forEach((slot) => {
    const stack = gear[slot];
    if (stack && stack.tag !== 'ISSUE') rows.push({ ref: { kind: 'gear', slot }, stack });
  });
  return rows;
}

function itemOf(state: InventoryState, ref: ItemRef) {
  if (ref.kind === 'bag') return state.bag[ref.index] ?? null;
  if (ref.kind === 'locker') return state.locker[ref.index] ?? null;
  return state.gear[ref.slot];
}

function affixLine(affixes: readonly { id: string; value: number }[]): string {
  return affixes
    .map((affix) => {
      const name = AFFIXES.find((row) => row.id === affix.id)?.prefix ?? affix.id;
      return `${name} +${affix.value}`;
    })
    .join(', ');
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
