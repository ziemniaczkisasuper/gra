// Base hub (T27). Menu, not a walked map. Orders and LIFT are on the first frame.
// Shortcuts 1–5. One unlocked stop: LIFT calls onLift immediately (the host departs).
// The background is the fixed BASE_M1 art. This screen does not generate a level.
import './m1-screens.css';
import { fillBaseMap } from './base-map';
import { el } from './dom';
import { M1_COPY, M1_UI_COPY } from './m1-copy';

export interface BaseOrderView {
  id: string;
  title: string;
  detail: string;
}

export interface BaseHubData {
  credits: number;
  gridPct: number;
  medPatches: number;
  medPatchMax: number;
  /** Unlocked lift stops. 1 → LIFT departs with no stop list on this screen. */
  stops: number;
  /** Lights Above the Base, 0–3. Omitted means the cables stay dark. */
  lights?: number;
  orders: readonly BaseOrderView[];
}

export interface BaseHubHandlers {
  onLift(): void;
  onOrders(): void;
  onExchange(): void;
  onLocker(): void;
  onGear(): void;
  onSettings(): void;
}

export interface BaseHubOptions extends BaseHubHandlers {
  getData(): BaseHubData;
  doc?: Document;
}

export interface BaseHub {
  refresh(): void;
  destroy(): void;
  readonly element: HTMLElement;
}

const SHORTCUTS: Readonly<Record<string, keyof BaseHubHandlers>> = {
  Digit1: 'onExchange',
  Digit2: 'onLocker',
  Digit3: 'onGear',
  Digit4: 'onOrders',
  Digit5: 'onLift',
  KeyI: 'onGear',
  KeyL: 'onLift',
  Escape: 'onSettings',
};

/**
 * Mount the hub. LIFT is focused. Tab order starts at ORDERS, then LIFT, so the lift
 * is at most one button away from the first control and zero away from the initial focus.
 */
export function mountBaseHub(root: HTMLElement, opts: BaseHubOptions): BaseHub {
  const doc = opts.doc ?? document;
  const screen = el('section', { className: 'm1-screen' });
  screen.dataset.screen = 'base';
  const panel = el('div', { className: 'm1-panel' });
  const map = el('pre', { className: 'm1-base-map' });
  map.setAttribute('aria-hidden', 'true');
  screen.append(panel);
  root.append(screen);

  let selected = 0;

  const run = (name: keyof BaseHubHandlers) => {
    opts[name]();
  };

  const render = () => {
    const data = opts.getData();
    fillBaseMap(map, data.lights ?? 0);
    const credits = el('span', { textContent: `CREDITS ${data.credits} cr` });
    credits.dataset.field = 'credits';
    const grid = el('span', { textContent: `GRID ${data.gridPct}%` });
    grid.dataset.field = 'grid';
    const patches = el('span', { textContent: `[+] ${data.medPatches}/${data.medPatchMax}` });
    patches.dataset.field = 'patches';
    const head = el('div', { className: 'm1-head' }, [credits, grid, patches]);

    const board = el('div', { className: 'm1-col' });
    board.dataset.role = 'orders';
    const ordersBtn = actionButton(`4 ${M1_UI_COPY.M1_UI_SCR_ORDERS}`, 'orders', () =>
      run('onOrders'),
    );
    ordersBtn.dataset.shortcut = '4';
    const list = el('ul', { className: 'm1-list' });
    data.orders.forEach((order, index) => {
      const row = el('li', { textContent: `${order.title}  ${order.detail}` });
      row.dataset.order = order.id;
      if (index === selected) row.classList.add('is-selected');
      list.append(row);
    });
    if (data.orders.length === 0) {
      list.append(el('li', { textContent: M1_COPY.M1_BASE_10 }));
    }
    board.append(
      el('div', { className: 'm1-title', textContent: M1_UI_COPY.M1_UI_SCR_ORDERS }),
      ordersBtn,
      list,
    );

    const lift = actionButton(M1_COPY.M1_UI_BTN_LIFT, 'lift', () => run('onLift'));
    lift.classList.add('m1-lift');
    lift.dataset.shortcut = '5';
    lift.style.minWidth = '160px';
    lift.style.minHeight = '56px';
    lift.dataset.depart = data.stops <= 1 ? 'now' : 'choose';
    const hint = el('span', { textContent: 'Enter / L / 5' });

    const exchange = actionButton(`1 ${M1_UI_COPY.M1_UI_SCR_EXCHANGE}`, 'exchange', () =>
      run('onExchange'),
    );
    exchange.dataset.shortcut = '1';
    const locker = actionButton(`2 ${M1_UI_COPY.M1_UI_SCR_LOCKER}`, 'locker', () =>
      run('onLocker'),
    );
    locker.dataset.shortcut = '2';
    const gear = actionButton(`3 ${M1_UI_COPY.M1_UI_SCR_GEAR}`, 'gear', () => run('onGear'));
    gear.dataset.shortcut = '3';
    const settings = actionButton(M1_UI_COPY.M1_UI_SCR_SETTINGS, 'settings', () =>
      run('onSettings'),
    );

    const actions = el('div', { className: 'm1-col' }, [
      lift,
      hint,
      exchange,
      locker,
      gear,
      settings,
    ]);
    const layout = el('div', { className: 'm1-base-layout' }, [board, actions]);
    panel.replaceChildren(map, head, layout);
    if (root.isConnected) lift.focus();
  };

  const onKey = (event: KeyboardEvent) => {
    if (!screen.isConnected) return;
    if (event.repeat) return;
    if (event.code === 'Space') {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (event.code === 'ArrowDown' || event.code === 'ArrowUp') {
      const count = opts.getData().orders.length;
      if (count === 0) return;
      event.preventDefault();
      selected = (selected + (event.code === 'ArrowDown' ? 1 : count - 1)) % count;
      render();
      return;
    }
    if (event.code === 'Enter' || event.code === 'NumpadEnter') {
      event.preventDefault();
      event.stopPropagation();
      const focused = doc.activeElement;
      const action = focused instanceof HTMLElement ? focused.dataset.action : undefined;
      if (action === 'orders') run('onOrders');
      else if (action === 'exchange') run('onExchange');
      else if (action === 'locker') run('onLocker');
      else if (action === 'gear') run('onGear');
      else if (action === 'settings') run('onSettings');
      else run('onLift');
      return;
    }
    const name = SHORTCUTS[event.code];
    if (!name) return;
    event.preventDefault();
    event.stopPropagation();
    run(name);
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
