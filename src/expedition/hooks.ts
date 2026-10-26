// Hooks the engine tick calls. `machine.ts` binds the real implementations.
// game.ts imports only this file, so loading the engine does not load the expedition
// state machine (and does not create an import cycle).
import type { GameState } from '../core/game';
import type { ActionState } from '../input/actions';

export interface ExpeditionHooks {
  /** Descent confirm is up: the zone tick must not run. */
  frozen(state: GameState): boolean;
  /** Player is in the evac cabin: no movement. */
  controlsLocked(state: GameState): boolean;
  /** Closed `<` blocks the player the way a wall does. */
  blocksShaft(state: GameState, x: number, y: number): boolean;
  /**
   * After the player has had a chance to step. Returns true when this tick should
   * not run world systems (confirm just opened, or the floor was just replaced).
   */
  onZoneStep(state: GameState, actions: ActionState): boolean;
}

const noop: ExpeditionHooks = {
  frozen: () => false,
  controlsLocked: () => false,
  blocksShaft: () => false,
  onZoneStep: () => false,
};

let hooks: ExpeditionHooks = noop;

export function bindExpeditionHooks(next: ExpeditionHooks): void {
  hooks = next;
}

export const zoneSimFrozen = (state: GameState): boolean => hooks.frozen(state);
export const zoneControlsLocked = (state: GameState): boolean => hooks.controlsLocked(state);
export const shaftBlocksPlayer = (state: GameState, x: number, y: number): boolean =>
  hooks.blocksShaft(state, x, y);
export const onZoneStep = (state: GameState, actions: ActionState): boolean =>
  hooks.onZoneStep(state, actions);
