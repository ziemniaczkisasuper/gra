// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createGame, placePlayer, stepGame } from '../src/core/game';
import { emptyActions, type ActionState } from '../src/input/actions';
import { addZoneCredits, createInventoryState, setInventory } from '../src/inventory/inventory';
import { startNewGame } from '../src/save';
import { setAskBeforeDeeper } from '../src/ui/settings';
import { mountDescentConfirm } from '../src/ui/descent-confirm';
import { mountEvacOverlay } from '../src/ui/evac-overlay';
import { mountLiftRide } from '../src/ui/lift-ride';
import {
  EVAC_CALL_HOLD_MS,
  acceptDescent,
  advanceExpedition,
  armExpedition,
  confirmGoDown,
  getExpedition,
  setLiftStops,
  stayDescent,
} from '../src/expedition';

function actions(partial: Partial<ActionState> = {}): ActionState {
  const base = emptyActions();
  return { ...base, ...partial, move: partial.move ?? base.move };
}

beforeEach(() => {
  setAskBeforeDeeper(true);
  document.body.innerHTML = '<div id="ui"></div>';
});

describe('expedition screens', () => {
  it('offers depth 2 and leaves when that stop is chosen', () => {
    const root = document.getElementById('ui')!;
    const view = mountLiftRide(root);
    const g = startNewGame({ seed: 71 });
    setLiftStops(g, [1, 2]);
    view.sync(g);
    const lift = root.querySelector('[data-text-id="M1_UI_BTN_LIFT"]');
    expect(lift?.textContent).toBe('LIFT');
    (lift as HTMLButtonElement).click();
    expect(getExpedition(g).lift.phase).toBe('picker');
    const stop = root.querySelector('[data-stop="2"]');
    expect(stop?.textContent).toContain('DEPTH 2');
    expect(stop?.textContent).toContain('Solar Fields');
    (stop as HTMLButtonElement).click();
    (root.querySelector('[data-action="go"]') as HTMLButtonElement).click();
    expect(getExpedition(g).lift.phase).toBe('ride');
    expect(getExpedition(g).lift.destination).toBe(2);
    expect(root.querySelector('.exp-ride')?.textContent).toContain('DEPTH 2');
  });

  it('opens on STAY and Enter keeps the player on the stair', () => {
    const root = document.getElementById('ui')!;
    const g = createGame({ mapRows: ['#######', '#@...>#', '#######'], seed: 72 });
    armExpedition(g);
    setInventory(g, addZoneCredits(createInventoryState(), 40).state);
    placePlayer(g, 4, 1);
    stepGame(g, actions({ move: { x: 1, y: 0 }, digitalMove: true }), 50);
    let stayed = 0;
    const view = mountDescentConfirm(root, {
      onAccept: () => acceptDescent(g),
      onStay: () => {
        stayed += 1;
        stayDescent(g);
      },
      onGo: () => confirmGoDown(g),
    });
    view.sync(g);
    const message = root.querySelector('[data-text-id="M1_RISK_01"]');
    expect(message?.textContent).toBe('Go deeper? You can lose 40 cr.');
    const stay = root.querySelector('[data-text-id="M1_RISK_01_NO"]');
    expect(stay?.textContent).toBe('STAY');
    expect(stay?.classList.contains('is-focused')).toBe(true);
    expect(root.querySelector('.exp-hp')?.textContent).toBe('HP 100/100 · + 0');
    expect(view.onKey('Enter')).toBe(true);
    expect(stayed).toBe(0);
    expect(getExpedition(g).confirm).toBeNull();
    expect(g.player.x).toBe(5);
    expect(g.player.y).toBe(1);
    expect(getExpedition(g).depth).toBe(1);
  });

  it('shows LIFT 5 while the cabin is on the way', () => {
    const root = document.getElementById('ui')!;
    const g = createGame({ mapRows: ['#####', '#<@.#', '#####'], seed: 73 });
    armExpedition(g);
    advanceExpedition(g, EVAC_CALL_HOLD_MS, actions({ use: true }));
    const view = mountEvacOverlay(root);
    view.sync(g);
    const line = root.querySelector('[data-text-id="M1_UI_LIFT_COMING"]');
    expect(line?.textContent).toBe('LIFT 5');
    expect(root.querySelector('[data-text-id="M1_UI_CALL"]')?.textContent).toBe('');
  });
});
