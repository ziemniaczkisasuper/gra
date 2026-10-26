// Contract loop for one expedition (T29). Pure aside from writing the contracts and inventory
// sections: no DOM, no Math.random. Rolls use the Rng the caller passes — that must be the
// contracts stream (`contractsRng(game)` / `streamSeed(seed, 'contracts')`).
//
// main.ts calls these; this file does not register a system:
// - base enter: `boardAtBase(state, contractsRng(state), ctx)`
// - level gen: `generateLevel({ ..., contracts: contractsForLevel(state, depth) })`
// - evacuation: `settleContractsOnEvac(state)` (then the economy's onEvacuated for zone credits)
// - death: `settleContractsOnDeath(state)` (inventory `onDeath` stays with combat; it does not
//   touch this board)
import type { GameState } from '../core/game';
import type { Rng } from '../core/rng';
import type { Depth } from '../data/contracts-m1';
import {
  applyContractReward,
  getInventory,
  INVENTORY_SECTION,
  setInventory,
} from '../inventory/inventory';
import type { InventoryOutputEvent, InventoryState } from '../inventory/types';
import { contractSpawns, refillBoard, type ContractSpawn } from './board';
import { applyContractEvent } from './progress';
import { getContracts, NEW_GAME_BOARD_CONTEXT, setContracts } from './save';
import type { BoardContext, ContractOutputEvent } from './types';

/** What a loop step did. State is already stored on `game`; emit `events` on the bus. */
export interface ContractRunResult {
  events: ContractOutputEvent[];
  /** From `applyContractReward` (evacuation only). Empty for the board and for death. */
  inventoryEvents: InventoryOutputEvent[];
  /** Copper / Med-Patches that fit in neither the locker nor the bag (evacuation only). */
  overflow: { copper: number; medPatches: number };
}

function noPayout(events: ContractOutputEvent[] = []): ContractRunResult {
  return { events, inventoryEvents: [], overflow: { copper: 0, medPatches: 0 } };
}

function storedInventory(game: GameState): InventoryState | undefined {
  const raw = game.sections[INVENTORY_SECTION];
  if (typeof raw !== 'object' || raw === null || !('location' in raw)) return undefined;
  const location = (raw as { location?: unknown }).location;
  if (location !== 'base' && location !== 'zone') return undefined;
  return raw as InventoryState;
}

/**
 * The player is in the base hub: expedition mode `'base'`, or the inventory section already
 * says `location: 'base'` (evacuation and the death reprint both set that before the hub opens).
 */
export function playerAtBase(game: GameState): boolean {
  if (game.mode === 'base') return true;
  return storedInventory(game)?.location === 'base';
}

/**
 * Fill empty BASE slots when the player is in the base. A full board is left as it is
 * (`refillBoard` only writes null slots, and does not draw RNG for them), so a second call
 * does not offer duplicates.
 *
 * `ctx` defaults to depth 1 and no solved variants (`NEW_GAME_BOARD_CONTEXT`). Pass the real
 * lift stops and solved variants once those systems exist. Outside the base this is a no-op
 * and does not draw from `rng`.
 */
export function boardAtBase(
  game: GameState,
  rng: Rng,
  ctx: BoardContext = NEW_GAME_BOARD_CONTEXT,
): ContractRunResult {
  if (!playerAtBase(game)) return noPayout();
  const res = refillBoard(getContracts(game), rng, ctx);
  setContracts(game, res.state);
  return noPayout(res.events);
}

/**
 * Spawns for `generateLevel({ contracts })` at `depth`. This is `contractSpawns`: levelgen
 * already accepts `kind: 'item'` (Data Core `§` + `guardGroups`) and `kind: 'enemies'`
 * (Clear the Path). Order follows the board (slot 0 first). A `terminal` entry places nothing
 * extra — the level terminal is always there. Met objectives are omitted.
 */
export function contractsForLevel(game: GameState, depth: Depth): ContractSpawn[] {
  return contractSpawns(getContracts(game), depth);
}

/**
 * Evacuation settlement. Completed BASE contracts (objective already met) pay
 * `applyContractReward` with the reward on `contract:completed` (balans-m1 §5) and leave the
 * board. An unmet contract stays, with progress reset, and pays nothing. Does not move zone
 * credits — that is inventory `onEvacuated`.
 */
export function settleContractsOnEvac(game: GameState): ContractRunResult {
  const applied = applyContractEvent(getContracts(game), { type: 'evacuated' });
  setContracts(game, applied.state);

  let inv = getInventory(game);
  const inventoryEvents: InventoryOutputEvent[] = [];
  const overflow = { copper: 0, medPatches: 0 };
  let paidAny = false;
  for (const e of applied.events) {
    if (e.type !== 'contract:completed') continue;
    const paid = applyContractReward(inv, e.payload.reward, e.payload.contractId);
    inv = paid.state;
    inventoryEvents.push(...paid.events);
    overflow.copper += paid.overflow.copper;
    overflow.medPatches += paid.overflow.medPatches;
    paidAny = true;
  }
  if (!paidAny) return noPayout(applied.events);
  setInventory(game, inv);
  return { events: applied.events, inventoryEvents, overflow };
}

/**
 * Death settlement (mechaniki §2.7): every active BASE contract stays on the board with
 * progress 0 and pays nothing. `contract:failed` is returned for the caller to emit.
 *
 * Inventory `onDeath` does not call into this module. It only clears the bag and returns
 * `itemLost` for a carried Data Core; combat is the one allowed to call it. Applying those
 * `itemLost` events here as well as `died` would report the same loss twice, so this function
 * applies `died` once and does not call `onDeath`.
 */
export function settleContractsOnDeath(game: GameState): ContractRunResult {
  const applied = applyContractEvent(getContracts(game), { type: 'died' });
  setContracts(game, applied.state);
  return noPayout(applied.events);
}
