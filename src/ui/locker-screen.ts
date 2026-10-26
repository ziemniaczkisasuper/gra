// Hunter Locker (T28). Left column is safe. Right column can be lost.
// Size comes from getLocker (30 / 40 / 50 / 60). Moves use moveToLocker / moveFromLocker.
import './m1-screens.css';
import {
  equip,
  getGear,
  getLocker,
  getRunInventory,
  moveFromLocker,
  moveToLocker,
} from '../inventory/inventory';
import type { InventoryState, ItemStack } from '../inventory/types';
import { el } from './dom';
import { M1_COPY, M1_UI_COPY } from './m1-copy';

export interface LockerScreenOptions {
  getState(): InventoryState;
  commit(next: InventoryState): void;
  onBack(): void;
  doc?: Document;
}

export interface LockerScreen {
  refresh(): void;
  destroy(): void;
  readonly element: HTMLElement;
}

type Column = 'locker' | 'bag';

export function mountLockerScreen(root: HTMLElement, opts: LockerScreenOptions): LockerScreen {
  const doc = opts.doc ?? document;
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'locker';
  const panel = el('div', { className: 'm1-panel' });
  screen.append(panel);
  root.append(screen);

  let column: Column = 'locker';
  let index = 0;
  let status = '';

  const render = () => {
    const state = opts.getState();
    const locker = getLocker(state);
    const run = getRunInventory(state);
    const gear = getGear(state);
    const title = el('span', { className: 'm1-title', textContent: M1_UI_COPY.M1_UI_SCR_LOCKER });
    const back = actionButton(M1_UI_COPY.M1_UI_BTN_BACK, 'back', () => opts.onBack());
    const head = el('div', { className: 'm1-head' }, [title, back]);

    const leftHead = el('div', {
      textContent: `${M1_UI_COPY.M1_UI_SAFE}  ${locker.usedSlots}/${locker.slotsMax}`,
    });
    leftHead.dataset.role = 'locker-count';
    const left = el('div', { className: 'm1-col' }, [leftHead]);
    const leftList = el('ul', { className: 'm1-list' });
    if (locker.usedSlots === 0)
      leftList.append(el('li', { textContent: M1_UI_COPY.M1_UI_EMPTY_LOCKER }));
    locker.slots.forEach((stack, slot) => {
      if (!stack) return;
      leftList.append(rowButton('locker', slot, stack, column === 'locker' && index === slot));
    });
    left.append(leftList);

    const rightHead = el('div', {
      textContent: `${M1_UI_COPY.M1_UI_CAN_BE_LOST}  ${M1_UI_COPY.M1_UI_BAG} ${run.usedSlots}/${run.slotsMax}`,
    });
    rightHead.dataset.role = 'bag-count';
    const right = el('div', { className: 'm1-col' }, [rightHead]);
    const rightList = el('ul', { className: 'm1-list' });
    run.slots.forEach((stack, slot) => {
      if (!stack) return;
      rightList.append(rowButton('bag', slot, stack, column === 'bag' && index === slot));
    });
    (['weapon', 'armor', 'module', 'tool'] as const).forEach((slot) => {
      const stack = gear[slot];
      if (!stack || stack.tag === 'ISSUE') return;
      const button = actionButton(
        `${stack.glyph} ${stack.nameId} ${M1_COPY.M1_RISK_02_TAG}`,
        'gear-row',
        () => {
          column = 'bag';
          render();
        },
      );
      button.dataset.gear = slot;
      rightList.append(button);
    });
    right.append(rightList);

    const take = actionButton(M1_UI_COPY.M1_UI_BTN_TAKE, 'take', () => transfer('to-bag'));
    const store = actionButton(M1_UI_COPY.M1_UI_BTN_STORE, 'store', () => transfer('to-locker'));
    const equipBtn = actionButton(`${M1_UI_COPY.M1_UI_BTN_EQUIP} (F)`, 'equip', () => doEquip());
    const actions = el('div', { className: 'm1-actions' }, [take, store, equipBtn]);
    const note = el('p', { className: 'm1-status', textContent: status || M1_COPY.M1_RISK_02 });
    note.dataset.role = 'status';
    panel.replaceChildren(head, el('div', { className: 'm1-split' }, [left, right]), actions, note);
  };

  const rowButton = (kind: Column, slot: number, stack: ItemStack, selected: boolean) => {
    const tag = kind === 'bag' ? M1_COPY.M1_RISK_02_TAG : M1_UI_COPY.M1_UI_SAFE;
    const button = actionButton(
      `${stack.glyph} ×${stack.count} ${stack.nameId} ${tag}`,
      `${kind}-row`,
      () => {
        column = kind;
        index = slot;
        render();
      },
    );
    button.dataset[kind] = String(slot);
    if (kind === 'bag') button.dataset.risk = 'yes';
    if (selected) button.classList.add('is-selected');
    return button;
  };

  const transfer = (dir: 'to-bag' | 'to-locker') => {
    const state = opts.getState();
    if (dir === 'to-bag') {
      if (column !== 'locker') return;
      const result = moveFromLocker(state, index);
      if (!result.ok) {
        status = result.reason === 'bagFull' ? M1_COPY.M1_SYS_06 : M1_UI_COPY.M1_UI_LOCKER_FULL;
        render();
        return;
      }
      opts.commit(result.state);
      status = M1_COPY.M1_RISK_02;
    } else {
      if (column !== 'bag') return;
      const result = moveToLocker(state, index);
      if (!result.ok) {
        status = result.reason === 'lockerFull' ? M1_UI_COPY.M1_UI_LOCKER_FULL : M1_COPY.M1_SYS_06;
        render();
        return;
      }
      opts.commit(result.state);
      status = M1_UI_COPY.M1_UI_SAFE;
    }
    render();
  };

  const doEquip = () => {
    const state = opts.getState();
    const result = column === 'locker' ? equip(state, index, 'locker') : equip(state, index, 'bag');
    if (!result.ok) {
      if (result.reason === 'bagFull' || result.reason === 'lockerFull') status = M1_COPY.M1_SYS_06;
      render();
      return;
    }
    opts.commit(result.state);
    render();
  };

  const onKey = (event: KeyboardEvent) => {
    if (!screen.isConnected || event.repeat) return;
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.code === 'Escape') {
      event.preventDefault();
      opts.onBack();
      return;
    }
    if (event.code === 'Tab') {
      event.preventDefault();
      column = column === 'locker' ? 'bag' : 'locker';
      render();
      return;
    }
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      transfer(column === 'locker' ? 'to-bag' : 'to-locker');
      return;
    }
    if (event.code === 'KeyF') {
      event.preventDefault();
      doEquip();
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

function actionButton(label: string, action: string, onClick: () => void): HTMLButtonElement {
  const button = el('button', { type: 'button', textContent: label, tabIndex: 0 });
  button.dataset.action = action;
  button.addEventListener('click', (event) => {
    event.preventDefault();
    onClick();
  });
  return button;
}
