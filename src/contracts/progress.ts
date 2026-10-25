// BASE contract progress: objective state and completion. Pure function – applyContractEvent()
// RETURNS output events instead of emitting them; the caller (Engine, via registerSystem / the
// gameplay hooks) forwards them to the bus: `for (const e of res.events) bus.emit(e.type, e.payload)`.
import { CONTRACT_DEFS, GRID_FRAGMENT_PCT, TERMINAL_VARIANTS } from '../data/contracts-m1';
import { cloneState, freshProgress } from './board';
import type {
  ContractInputEvent,
  ContractInstance,
  ContractOutputEvent,
  ContractProgress,
  ContractResult,
  ContractsState,
} from './types';

function hadProgress(p: ContractProgress): boolean {
  return p.met || (p.kind === 'killContractEnemies' && p.killed > 0);
}

/** Reward the contract would pay if settled now (depth reward, or the retune reward). */
export function contractReward(c: ContractInstance) {
  const def = CONTRACT_DEFS[c.defId];
  const r = c.retune && def.retune ? def.retune.reward : def.reward[c.depth];
  if (!r) throw new Error(`No reward for ${c.defId} at depth ${c.depth}`);
  return { ...r };
}

/**
 * Applies one gameplay event to the board. Never mutates `state`.
 * - objectives are met during the run, but a BASE contract completes ONLY on `evacuated` (2.4);
 * - `died`: every open contract fails, its progress is reset and it stays on the board (no penalty);
 * - `evacuated` with the objective not met: progress reset, contract stays (new level next time);
 * - completed slots become empty – call refillBoard() back at base.
 */
export function applyContractEvent(state: ContractsState, ev: ContractInputEvent): ContractResult {
  const s = cloneState(state);
  const events: ContractOutputEvent[] = [];
  const open = (): ContractInstance[] => s.base.filter((c): c is ContractInstance => c !== null);

  switch (ev.type) {
    case 'terminalSolved': {
      // Unknown variant for that depth = ignored (defensive; the terminal system owns variants).
      if (!TERMINAL_VARIANTS[ev.depth].includes(ev.variant)) break;
      for (const c of open()) {
        const p = c.progress;
        if (p.kind !== 'solveTerminal' || p.met || c.depth !== ev.depth) continue;
        p.met = true;
        p.variant = ev.variant;
        // Fragment only on the first solve of the variant, never for a retune, never twice.
        // [ASSUMPTION A5] The grid fragment belongs to the variant (2.15: 8 variants × 10%); the
        // completion only REPORTS it – the grid/terminal system must not light it twice.
        p.fragment = !c.retune && ev.firstSolve && !s.creditedVariants.includes(ev.variant);
        events.push({
          type: 'contract:objectiveMet',
          payload: { contractId: c.id, defId: c.defId },
        });
      }
      break;
    }
    case 'itemPicked':
    case 'itemLost': {
      const picked = ev.type === 'itemPicked';
      for (const c of open()) {
        const o = CONTRACT_DEFS[c.defId].objective;
        const p = c.progress;
        if (p.kind !== 'recoverItem' || o.type !== 'recoverItem' || o.itemId !== ev.itemId)
          continue;
        if (ev.contractId !== undefined && ev.contractId !== c.id) continue;
        if (p.met === picked) continue;
        p.met = picked;
        events.push({
          type: picked ? 'contract:objectiveMet' : 'contract:objectiveLost',
          payload: { contractId: c.id, defId: c.defId },
        });
      }
      break;
    }
    case 'contractEnemyKilled': {
      const c = open().find((x) => x.id === ev.contractId);
      const p = c?.progress;
      if (!c || !p || p.kind !== 'killContractEnemies' || p.met) break;
      p.killed = Math.min(p.required, p.killed + 1);
      events.push({
        type: 'contract:progress',
        payload: { contractId: c.id, current: p.killed, required: p.required },
      });
      if (p.killed >= p.required) {
        p.met = true;
        events.push({
          type: 'contract:objectiveMet',
          payload: { contractId: c.id, defId: c.defId },
        });
      }
      break;
    }
    case 'evacuated': {
      s.base = s.base.map((c) => {
        if (!c) return null;
        const def = CONTRACT_DEFS[c.defId];
        if (!c.progress.met) return { ...c, progress: freshProgress(def) };
        const p = c.progress;
        const fragVariant = p.kind === 'solveTerminal' && p.fragment ? p.variant : null;
        if (fragVariant) s.creditedVariants.push(fragVariant);
        events.push({
          type: 'contract:completed',
          payload: {
            contractId: c.id,
            defId: c.defId,
            depth: c.depth,
            reward: contractReward(c),
            gridFragmentVariant: fragVariant,
            gridFragmentPct: fragVariant ? GRID_FRAGMENT_PCT : 0,
          },
        });
        return null;
      });
      break;
    }
    case 'died': {
      // [ASSUMPTION A4] "wraca na tablicę" (2.3/2.4/2.7) = the SAME contract stays on the board with
      // reset progress; it is not re-rolled. Only completed slots are refilled at base.
      s.base = s.base.map((c) => {
        if (!c) return null;
        events.push({
          type: 'contract:failed',
          payload: {
            contractId: c.id,
            defId: c.defId,
            depth: c.depth,
            reason: 'died',
            hadProgress: hadProgress(c.progress),
          },
        });
        return { ...c, progress: freshProgress(CONTRACT_DEFS[c.defId]) };
      });
      break;
    }
  }
  return { state: s, events };
}

/** Convenience: apply several events in order, concatenating output events. */
export function applyContractEvents(
  state: ContractsState,
  evs: readonly ContractInputEvent[],
): ContractResult {
  let s = state;
  const events: ContractOutputEvent[] = [];
  for (const ev of evs) {
    const r = applyContractEvent(s, ev);
    s = r.state;
    events.push(...r.events);
  }
  return { state: s, events };
}
