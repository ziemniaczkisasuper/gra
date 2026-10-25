// Engine wiring of the contracts module (PROG / Silnik) – see prog/kontrakty-m1.md "Jak wpiąć".
// src/contracts/ is owned by LUZ and is not edited here.
//
// - Side-effect import registers the 'contracts' save section (save v3). Because ES imports
//   are evaluated before main.ts runs, the section exists before readSave()/gameFromSave().
// - A 'world'-phase system turns existing gameplay events into ContractInputEvents:
//     combat 'playerDied' → { type: 'died' }
//   Not wired yet (no source system exists): terminalSolved, itemPicked, itemLost,
//   contractEnemyKilled (needs enemies tagged with contractId), evacuated, refill at base.
// - Output events (contract:*) are handed to `emit` (main.ts → bus.emit(e.type, e.payload)).
import { peekCombat } from '../combat/combat';
import { registerSystem, type GameState } from '../core/game';
import { applyContractEvent } from '../contracts/progress';
import { getContracts, refillContracts, setContracts } from '../contracts/save';
import '../contracts/save';
import type { BoardContext, ContractInputEvent, ContractOutputEvent } from '../contracts/types';

export type ContractEmit = (e: ContractOutputEvent) => void;

/** Apply input events to the board in `state`; returns the module's output events (pure). */
export function feedContracts(
  state: GameState,
  inputs: readonly ContractInputEvent[],
): ContractOutputEvent[] {
  const out: ContractOutputEvent[] = [];
  for (const ev of inputs) {
    const r = applyContractEvent(getContracts(state), ev);
    setContracts(state, r.state);
    out.push(...r.events);
  }
  return out;
}

/** Contract inputs derived from this tick's combat events (combat runs earlier in 'world'). */
export function contractInputsFromCombat(state: GameState): ContractInputEvent[] {
  const c = peekCombat(state);
  if (!c) return [];
  const inputs: ContractInputEvent[] = [];
  for (const e of c.events) if (e.type === 'playerDied') inputs.push({ type: 'died' });
  return inputs;
}

/**
 * Refill after returning to base (after evacuation / death reprint). To be called by the base
 * flow once it exists; `ctx` comes from the lift and terminal systems.
 */
export function refillContractsAtBase(
  state: GameState,
  ctx: BoardContext,
  emit: ContractEmit,
): void {
  for (const e of refillContracts(state, ctx).events) emit(e);
}

/** Registers the contracts system (call once at boot, AFTER installCombat()). */
export function installContracts(emit: ContractEmit): () => void {
  return registerSystem((state) => {
    const inputs = contractInputsFromCombat(state);
    if (inputs.length === 0) return;
    for (const e of feedContracts(state, inputs)) emit(e);
  }, 'world');
}
