// Save section 'contracts' (save v3 section registry, save/sections.ts). Registered as a SIDE
// EFFECT at module top level – this file must be imported (once) before the save is loaded/parsed:
// otherwise parseSave() drops the 'contracts' section as unknown and gameFromSave() never calls
// fresh()/apply(). Engine: `import './contracts/save';` next to the other module installs.
import type { GameState } from '../core/game';
import type { Rng } from '../core/rng';
import { registerSaveSection } from '../save/sections';
import {
  createContractsState,
  deserializeContracts,
  refillBoard,
  serializeContracts,
} from './board';
import type { BoardContext, ContractResult, ContractsState } from './types';

export const CONTRACTS_SECTION = 'contracts';
/** Named RNG stream of the module: all board rolls use state.rng.stream(CONTRACTS_STREAM). */
export const CONTRACTS_STREAM = 'contracts';

/**
 * Context for the very first roll of a brand-new board (new game / save without the section):
 * depth 1 only, nothing solved – true for a new game. Later refills get the real context from
 * the caller (lift stops, solved variants owned by other systems). [ASSUMPTION A6]
 */
export const NEW_GAME_BOARD_CONTEXT: BoardContext = { unlockedStops: [], solvedVariants: [] };

/** The module's RNG: a named stream of the game RNG (type Rng – same as board.ts expects). */
export function contractsRng(state: GameState): Rng {
  return state.rng.stream(CONTRACTS_STREAM);
}

/** Current board stored in state.sections.contracts (fresh empty board if not there yet). */
export function getContracts(state: GameState): ContractsState {
  const s = state.sections[CONTRACTS_SECTION] as ContractsState | undefined;
  return s ?? createContractsState();
}

export function setContracts(state: GameState, contracts: ContractsState): void {
  state.sections[CONTRACTS_SECTION] = contracts;
}

/** A board that has never been rolled (fresh() value): nextId 1 and all slots empty. */
export function isUnrolled(s: ContractsState): boolean {
  return s.nextId === 1 && s.base.every((c) => c === null);
}

/**
 * Refill at base with the module's stream – what the integrator calls after evacuation / after
 * the death reprint. Stores the new board in the state and returns the events to emit.
 */
export function refillContracts(state: GameState, ctx: BoardContext): ContractResult {
  const res = refillBoard(getContracts(state), contractsRng(state), ctx);
  setContracts(state, res.state);
  return res;
}

/**
 * fresh() gets no state/RNG in the section API, so it returns an EMPTY board; apply() (called by
 * gameFromSave after rng streams are restored) rolls it from state.rng.stream('contracts').
 * Deterministic for a given seed/rngState. The 'contract:offered' events of this first roll are
 * not emitted (no bus at load time) – the board is simply there at game start.
 */
export const unregisterContractsSave = registerSaveSection<ContractsState>(CONTRACTS_SECTION, {
  serialize: (state) => serializeContracts(getContracts(state)),
  deserialize: (raw) => deserializeContracts(raw),
  fresh: () => createContractsState(),
  apply: (state, value) => {
    const board = isUnrolled(value)
      ? refillBoard(value, contractsRng(state), NEW_GAME_BOARD_CONTEXT).state
      : value;
    setContracts(state, board);
  },
});
