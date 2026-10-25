// Engine wiring of contracts (src/integration/contracts.ts): save v3 section + events.
import { describe, expect, it } from 'vitest';
import { createCombatData, setCombat } from '../src/combat/combat';
import { createGame, stepGame } from '../src/core/game';
import { serializeContracts } from '../src/contracts/board';
import { getContracts } from '../src/contracts/save';
import { emptyActions } from '../src/input/actions';
import {
  contractInputsFromCombat,
  feedContracts,
  installContracts,
} from '../src/integration/contracts';
import { gameFromSave, parseSave, saveToJson, snapshot } from '../src/save';
import { DEFAULT_SEED } from '../src/data/game';
import type { ContractOutputEvent } from '../src/contracts/types';

const D = { seed: DEFAULT_SEED };
const roundTrip = (g: ReturnType<typeof gameFromSave>) =>
  gameFromSave(parseSave(JSON.parse(saveToJson(snapshot(g, 1))), D));

describe('contracts wiring: save v3 section', () => {
  it('new game has the board in state.sections.contracts (section registered by import)', () => {
    const g = gameFromSave(null);
    expect(g.sections.contracts).toBeDefined();
    expect(g.sections.contracts).toBe(getContracts(g));
  });

  it('new game rolls the board from stream("contracts"), deterministic per seed', () => {
    const a = gameFromSave(null);
    const b = gameFromSave(null);
    expect(getContracts(a).base.some((c) => c !== null)).toBe(true);
    expect(serializeContracts(getContracts(a))).toEqual(serializeContracts(getContracts(b)));
    expect(a.rng.getStates().contracts).toBeDefined();
  });

  it('snapshot contains the contracts section and round-trips with rngState', () => {
    const g = gameFromSave(null);
    const snap = snapshot(g, 1);
    expect(snap.contracts).toEqual(serializeContracts(getContracts(g)));
    const g2 = roundTrip(g);
    expect(serializeContracts(getContracts(g2))).toEqual(serializeContracts(getContracts(g)));
    expect(g2.rng.stream('contracts').next()).toBe(g.rng.stream('contracts').next());
  });

  it('a v2 save (no section) gets a fresh, rolled board', () => {
    const g = gameFromSave(
      parseSave({ version: 2, savedAt: 1, seed: 5, player: { x: 3, y: 3 } }, D),
    );
    expect(getContracts(g).base.some((c) => c !== null)).toBe(true);
  });

  it('a broken contracts section rejects the whole save', () => {
    const snap = JSON.parse(saveToJson(snapshot(gameFromSave(null), 1)));
    snap.contracts = { v: 1, nextId: 'x' };
    expect(() => parseSave(snap, D)).toThrow(/contracts/);
  });
});

describe('contracts wiring: events', () => {
  it("combat 'playerDied' becomes a contract 'died' input; output events use the contract: prefix", () => {
    const g = gameFromSave(null);
    const c = createCombatData(g);
    c.events.push({ type: 'playerDied' });
    setCombat(g, c);
    expect(contractInputsFromCombat(g)).toEqual([{ type: 'died' }]);
    const out = feedContracts(g, contractInputsFromCombat(g));
    for (const e of out) expect(e.type.startsWith('contract:')).toBe(true);
    // died after a run in progress: every active contract reports failed
    expect(out.every((e) => e.type === 'contract:failed')).toBe(true);
  });

  it('installed system emits through the callback and can be uninstalled', () => {
    const g = createGame();
    const seen: ContractOutputEvent[] = [];
    const off = installContracts((e) => seen.push(e));
    stepGame(g, emptyActions(), 50); // no combat events → nothing
    expect(seen).toEqual([]);
    off();
  });
});
