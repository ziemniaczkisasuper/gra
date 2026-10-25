import { describe, expect, it } from 'vitest';
import { Rng } from '../src/core/rng';
import {
  CONTRACT_DEFS,
  CONTRACT_SLOTS_BASE,
  CONTRACT_SLOTS_EXCHANGE,
  CONTRACTS_M1,
  DATA_CORE_ITEM_ID,
  GRID_FRAGMENT_PCT,
  TERMINAL_VARIANTS,
  type ContractDefId,
  type Depth,
} from '../src/data/contracts-m1';
import {
  allowedDepths,
  contractPool,
  contractSpawns,
  createContractsState,
  deserializeContracts,
  freshProgress,
  loadContracts,
  refillBoard,
  serializeContracts,
} from '../src/contracts/board';
import { applyContractEvent, applyContractEvents } from '../src/contracts/progress';
import type {
  BoardContext,
  ContractInstance,
  ContractOutputEvent,
  ContractsState,
} from '../src/contracts/types';
import { SaveError } from '../src/save/schema';

const CTX1: BoardContext = { unlockedStops: [], solvedVariants: [] };
const CTX_ALL: BoardContext = { unlockedStops: [2, 3], solvedVariants: [] };

function inst(id: number, defId: ContractDefId, depth: Depth, retune = false): ContractInstance {
  return { id, defId, depth, retune, progress: freshProgress(CONTRACT_DEFS[defId]) };
}

function board(...cs: (ContractInstance | null)[]): ContractsState {
  const s = createContractsState();
  const base = [...cs, ...Array.from({ length: CONTRACT_SLOTS_BASE }, () => null)].slice(
    0,
    CONTRACT_SLOTS_BASE,
  );
  const maxId = Math.max(0, ...cs.map((c) => c?.id ?? 0));
  return { ...s, base, nextId: maxId + 1 };
}

const types = (evs: ContractOutputEvent[]) => evs.map((e) => e.type);
const relay = (d: Depth) => inst(1, 'M1_CONTR_01', d);
const core = () => inst(2, 'M1_CONTR_02', 2);
const clear = (d: Depth) => inst(3, 'M1_CONTR_03', d);

describe('contracts: definitions match mechaniki-m1 §2.4 / §2.16', () => {
  it('has exactly the three BASE contracts with text ids', () => {
    expect(CONTRACTS_M1.map((d) => d.id)).toEqual(['M1_CONTR_01', 'M1_CONTR_02', 'M1_CONTR_03']);
    for (const d of CONTRACTS_M1) {
      expect(d.textId).toBe(d.id);
      expect(d.issuer).toBe('BASE');
      expect(CONTRACT_DEFS[d.id]).toBe(d);
    }
    expect(CONTRACT_SLOTS_BASE).toBe(2);
    expect(CONTRACT_SLOTS_EXCHANGE).toBe(1);
  });

  it('Restore Relay: depths 1–3, 40 kr, retune 40 kr ×0.5', () => {
    const d = CONTRACT_DEFS.M1_CONTR_01;
    expect(d.depths).toEqual([1, 2, 3]);
    expect(d.objective).toEqual({ type: 'solveTerminal' });
    for (const depth of [1, 2, 3] as Depth[])
      expect(d.reward[depth]).toEqual({ credits: 40, copper: 0, medPatches: 0 });
    expect(d.retune).toEqual({
      reward: { credits: 40, copper: 0, medPatches: 0 },
      weightMult: 0.5,
    });
    expect(d.weight).toBe(1);
    expect(GRID_FRAGMENT_PCT).toBe(10);
  });

  it('Data Core: depth 2 only, 30–45 fields, 3 guards, 40 kr + 3 Copper', () => {
    const d = CONTRACT_DEFS.M1_CONTR_02;
    expect(d.depths).toEqual([2]);
    expect(d.objective).toEqual({
      type: 'recoverItem',
      itemId: DATA_CORE_ITEM_ID,
      distFromShaft: [30, 45],
      guards: 3,
    });
    expect(d.reward).toEqual({ 2: { credits: 40, copper: 3, medPatches: 0 } });
  });

  it('Clear the Path: depths 1–2, 6 enemies 12–20 fields, 1 patch / 25 kr + 1 patch', () => {
    const d = CONTRACT_DEFS.M1_CONTR_03;
    expect(d.depths).toEqual([1, 2]);
    expect(d.objective).toEqual({ type: 'killContractEnemies', count: 6, distFromShaft: [12, 20] });
    expect(d.reward[1]).toEqual({ credits: 0, copper: 0, medPatches: 1 });
    expect(d.reward[2]).toEqual({ credits: 25, copper: 0, medPatches: 1 });
  });

  it('terminal variants: 3 / 3 / 2 in difficulty order (8 fragments)', () => {
    expect(TERMINAL_VARIANTS[1]).toEqual(['M1_TERM_04', 'M1_TERM_07', 'M1_TERM_08']);
    expect(TERMINAL_VARIANTS[2]).toEqual(['M1_TERM_05', 'M1_TERM_01', 'M1_TERM_02']);
    expect(TERMINAL_VARIANTS[3]).toEqual(['M1_TERM_06', 'M1_TERM_03']);
  });
});

describe('contracts: board rolling', () => {
  it('depth 1 is always allowed, other depths only with an unlocked lift stop', () => {
    expect(allowedDepths(CTX1)).toEqual([1]);
    expect(allowedDepths({ unlockedStops: [3], solvedVariants: [] })).toEqual([1, 3]);
    expect(allowedDepths(CTX_ALL)).toEqual([1, 2, 3]);
  });

  it('is deterministic for the same seed', () => {
    const a = refillBoard(createContractsState(), new Rng(1234), CTX_ALL);
    const b = refillBoard(createContractsState(), new Rng(1234), CTX_ALL);
    expect(a).toEqual(b);
    expect(a.state.base.every((c) => c !== null)).toBe(true);
    expect(types(a.events)).toEqual(['contract:offered', 'contract:offered']);
    expect(a.state.exchange).toEqual([null]);
  });

  it('rolls only on unlocked depths and never duplicates a (contract, depth) pair', () => {
    for (let seed = 0; seed < 300; seed++) {
      const { state } = refillBoard(createContractsState(), new Rng(seed), CTX1);
      const keys = state.base.map((c) => `${c!.defId}@${c!.depth}`);
      expect(state.base.every((c) => c!.depth === 1)).toBe(true);
      expect(new Set(keys).size).toBe(2);
      // Only Relay@1 and Clear@1 are possible with no lift stops.
      expect(keys.sort()).toEqual(['M1_CONTR_01@1', 'M1_CONTR_03@1']);
    }
    const ctx3: BoardContext = { unlockedStops: [3], solvedVariants: [] };
    for (let seed = 0; seed < 300; seed++) {
      const { state } = refillBoard(createContractsState(), new Rng(seed), ctx3);
      for (const c of state.base) expect(c!.depth === 1 || c!.depth === 3).toBe(true);
      expect(state.base.some((c) => c!.defId === 'M1_CONTR_02')).toBe(false);
    }
  });

  it('pool weights: type weight split over its depths, retune ×0.5', () => {
    const pool = contractPool(createContractsState(), CTX_ALL);
    const w = (id: ContractDefId, d: Depth) => pool.find((e) => e.defId === id && e.depth === d);
    expect(w('M1_CONTR_01', 1)?.weight).toBeCloseTo(1 / 3);
    expect(w('M1_CONTR_02', 2)?.weight).toBe(1);
    expect(w('M1_CONTR_03', 1)?.weight).toBe(0.5);
    const solved = { unlockedStops: [2, 3] as Depth[], solvedVariants: [...TERMINAL_VARIANTS[1]] };
    const pool2 = contractPool(createContractsState(), solved);
    const r1 = pool2.find((e) => e.defId === 'M1_CONTR_01' && e.depth === 1)!;
    const r2 = pool2.find((e) => e.defId === 'M1_CONTR_01' && e.depth === 2)!;
    expect(r1.retune).toBe(true);
    expect(r1.weight).toBeCloseTo(0.5 / 3);
    expect(r2.retune).toBe(false);
    expect(r2.weight).toBeCloseTo(1 / 3);
  });

  it('weighted pick follows the pool weights statistically', () => {
    // All depths unlocked: first slot frequency ≈ type weight / total (1/3 each).
    const counts: Record<string, number> = {};
    const N = 6000;
    for (let seed = 0; seed < N; seed++) {
      const { state } = refillBoard(createContractsState(), new Rng(seed * 7919 + 1), CTX_ALL);
      const c = state.base[0]!;
      counts[c.defId] = (counts[c.defId] ?? 0) + 1;
    }
    for (const id of ['M1_CONTR_01', 'M1_CONTR_02', 'M1_CONTR_03'])
      expect(counts[id]! / N).toBeGreaterThan(0.29);
    // Retune halves Relay's share: with all variants solved Relay ≈ 0.5 / 2.5 = 20%.
    const allSolved: BoardContext = {
      unlockedStops: [2, 3],
      solvedVariants: Object.values(TERMINAL_VARIANTS).flat(),
    };
    let relay = 0;
    for (let seed = 0; seed < N; seed++) {
      const { state } = refillBoard(createContractsState(), new Rng(seed * 104729 + 3), allSolved);
      if (state.base[0]!.defId === 'M1_CONTR_01') {
        relay++;
        expect(state.base[0]!.retune).toBe(true);
      }
    }
    expect(relay / N).toBeGreaterThan(0.17);
    expect(relay / N).toBeLessThan(0.23);
  });

  it('uses only the passed Rng (advances it, no other randomness)', () => {
    const rng = new Rng(42);
    const before = rng.state;
    refillBoard(createContractsState(), rng, CTX_ALL);
    expect(rng.state).not.toBe(before);
    const rngB = new Rng(42);
    const r1 = refillBoard(createContractsState(), rngB, CTX_ALL);
    expect(r1.state.base).toEqual(
      refillBoard(createContractsState(), new Rng(42), CTX_ALL).state.base,
    );
  });

  it('refill leaves occupied slots alone and fills only empty ones', () => {
    const s = board(clear(1), null);
    const { state, events } = refillBoard(s, new Rng(5), CTX1);
    expect(state.base[0]).toEqual(s.base[0]);
    expect(state.base[1]).toMatchObject({ defId: 'M1_CONTR_01', depth: 1, id: s.nextId });
    expect(events).toHaveLength(1);
    expect(s.base[1]).toBeNull(); // input not mutated
    const again = refillBoard(state, new Rng(5), CTX1);
    expect(again.events).toHaveLength(0);
    expect(again.state).toEqual(state);
  });

  it('contractSpawns tells the generator what to place for a depth', () => {
    const s = board(core(), clear(2));
    expect(contractSpawns(s, 2)).toEqual([
      {
        contractId: 2,
        kind: 'item',
        itemId: DATA_CORE_ITEM_ID,
        distFromShaft: [30, 45],
        guards: 3,
      },
      { contractId: 3, kind: 'enemies', count: 6, distFromShaft: [12, 20] },
    ]);
    expect(contractSpawns(s, 1)).toEqual([]);
    expect(contractSpawns(board(relay(3)), 3)).toEqual([{ contractId: 1, kind: 'terminal' }]);
  });
});

describe('contracts: progress and completion', () => {
  it('completes only after evacuation with the objective met', () => {
    let r = applyContractEvent(board(clear(1)), { type: 'contractEnemyKilled', contractId: 3 });
    expect(types(r.events)).toEqual(['contract:progress']);
    for (let i = 0; i < 5; i++)
      r = applyContractEvent(r.state, { type: 'contractEnemyKilled', contractId: 3 });
    expect(types(r.events)).toEqual(['contract:progress', 'contract:objectiveMet']);
    expect(r.state.base[0]!.progress).toMatchObject({ met: true, killed: 6 });
    const done = applyContractEvent(r.state, { type: 'evacuated' });
    expect(done.events).toEqual([
      {
        type: 'contract:completed',
        payload: {
          contractId: 3,
          defId: 'M1_CONTR_03',
          depth: 1,
          reward: { credits: 0, copper: 0, medPatches: 1 },
          gridFragmentVariant: null,
          gridFragmentPct: 0,
        },
      },
    ]);
    expect(done.state.base[0]).toBeNull();
  });

  it('evacuation without the objective keeps the contract but resets its progress', () => {
    const r = applyContractEvents(board(clear(2)), [
      { type: 'contractEnemyKilled', contractId: 3 },
      { type: 'contractEnemyKilled', contractId: 3 },
      { type: 'evacuated' },
    ]);
    expect(r.events.some((e) => e.type === 'contract:completed')).toBe(false);
    expect(r.state.base[0]).toMatchObject({ id: 3, progress: { killed: 0, met: false } });
  });

  it('kill counter counts only own contract enemies and caps at required', () => {
    const r = applyContractEvents(board(clear(1)), [
      { type: 'contractEnemyKilled', contractId: 99 },
      ...Array.from({ length: 9 }, () => ({ type: 'contractEnemyKilled' as const, contractId: 3 })),
    ]);
    const p = r.state.base[0]!.progress;
    expect(p).toMatchObject({ killed: 6, required: 6, met: true });
    expect(r.events.filter((e) => e.type === 'contract:progress')).toHaveLength(6);
    expect(r.events.filter((e) => e.type === 'contract:objectiveMet')).toHaveLength(1);
  });

  it('death = failed, progress reset, contract stays on the board (no penalty)', () => {
    const s = board(clear(1), relay(1));
    const r = applyContractEvents(s, [
      { type: 'contractEnemyKilled', contractId: 3 },
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_04', firstSolve: true },
      { type: 'died' },
    ]);
    const failed = r.events.filter((e) => e.type === 'contract:failed');
    expect(failed.map((e) => e.payload)).toEqual([
      { contractId: 3, defId: 'M1_CONTR_03', depth: 1, reason: 'died', hadProgress: true },
      { contractId: 1, defId: 'M1_CONTR_01', depth: 1, reason: 'died', hadProgress: true },
    ]);
    expect(r.state.base.map((c) => c?.id)).toEqual([3, 1]);
    expect(r.state.base[0]!.progress).toEqual(freshProgress(CONTRACT_DEFS.M1_CONTR_03));
    expect(r.state.base[1]!.progress).toEqual(freshProgress(CONTRACT_DEFS.M1_CONTR_01));
    // Death never pays out and refill has nothing to replace.
    expect(r.events.some((e) => e.type === 'contract:completed')).toBe(false);
    expect(refillBoard(r.state, new Rng(1), CTX1).events).toHaveLength(0);
  });

  it('Data Core: pick-up meets, loss undoes, death loses it, evac with it completes', () => {
    const s = board(core());
    let r = applyContractEvent(s, { type: 'itemPicked', itemId: DATA_CORE_ITEM_ID, contractId: 2 });
    expect(types(r.events)).toEqual(['contract:objectiveMet']);
    r = applyContractEvent(r.state, { type: 'itemLost', itemId: DATA_CORE_ITEM_ID, contractId: 2 });
    expect(types(r.events)).toEqual(['contract:objectiveLost']);
    const noCore = applyContractEvent(r.state, { type: 'evacuated' });
    expect(types(noCore.events)).toEqual([]);
    expect(noCore.state.base[0]!.id).toBe(2);
    // other items do nothing
    r = applyContractEvent(r.state, { type: 'itemPicked', itemId: 'M1_ITEM_SCRAP' });
    expect(r.events).toEqual([]);
    // death while carrying = failed, item gone
    r = applyContractEvents(r.state, [
      { type: 'itemPicked', itemId: DATA_CORE_ITEM_ID },
      { type: 'died' },
    ]);
    expect(types(r.events)).toEqual(['contract:objectiveMet', 'contract:failed']);
    expect(r.state.base[0]!.progress.met).toBe(false);
    // carry it out
    r = applyContractEvents(r.state, [
      { type: 'itemPicked', itemId: DATA_CORE_ITEM_ID, contractId: 2 },
      { type: 'evacuated' },
    ]);
    const done = r.events.find((e) => e.type === 'contract:completed');
    expect(done?.payload).toMatchObject({ reward: { credits: 40, copper: 3, medPatches: 0 } });
  });

  it('Restore Relay counts only the terminal of its depth', () => {
    const r = applyContractEvent(board(relay(2)), {
      type: 'terminalSolved',
      depth: 1,
      variant: 'M1_TERM_04',
      firstSolve: true,
    });
    expect(r.events).toEqual([]);
    expect(r.state.base[0]!.progress.met).toBe(false);
  });

  it('grid fragment only on the first solve of a variant, never for a retune, never twice', () => {
    // first solve → fragment
    let r = applyContractEvents(board(relay(1)), [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_04', firstSolve: true },
      { type: 'evacuated' },
    ]);
    let done = r.events.find((e) => e.type === 'contract:completed')!;
    expect(done.payload).toMatchObject({
      reward: { credits: 40 },
      gridFragmentVariant: 'M1_TERM_04',
      gridFragmentPct: 10,
    });
    expect(r.state.creditedVariants).toEqual(['M1_TERM_04']);

    // already solved earlier (outside the contract) → only credits
    r = applyContractEvents({ ...board(relay(1)), creditedVariants: r.state.creditedVariants }, [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_07', firstSolve: false },
      { type: 'evacuated' },
    ]);
    done = r.events.find((e) => e.type === 'contract:completed')!;
    expect(done.payload).toMatchObject({ gridFragmentVariant: null, gridFragmentPct: 0 });

    // firstSolve reported again for an already credited variant → no double fragment
    r = applyContractEvents({ ...board(relay(1)), creditedVariants: ['M1_TERM_04'] }, [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_04', firstSolve: true },
      { type: 'evacuated' },
    ]);
    done = r.events.find((e) => e.type === 'contract:completed')!;
    expect(done.payload.gridFragmentVariant).toBeNull();

    // retune → 40 kr, no fragment
    r = applyContractEvents(board(inst(1, 'M1_CONTR_01', 1, true)), [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_08', firstSolve: true },
      { type: 'evacuated' },
    ]);
    done = r.events.find((e) => e.type === 'contract:completed')!;
    expect(done.payload).toMatchObject({
      reward: { credits: 40, copper: 0, medPatches: 0 },
      gridFragmentVariant: null,
    });

    // first solve but died → no fragment credited by the contract
    r = applyContractEvents(board(relay(1)), [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_04', firstSolve: true },
      { type: 'died' },
    ]);
    expect(r.state.creditedVariants).toEqual([]);
  });

  it('completed slots are refilled after returning to base', () => {
    const s = board(clear(1), relay(1));
    const r = applyContractEvents(s, [
      ...Array.from({ length: 6 }, () => ({ type: 'contractEnemyKilled' as const, contractId: 3 })),
      { type: 'evacuated' },
    ]);
    expect(r.state.base[0]).toBeNull();
    expect(r.state.base[1]!.id).toBe(1);
    const ctx: BoardContext = { unlockedStops: [2], solvedVariants: [] };
    const refill = refillBoard(r.state, new Rng(77), ctx);
    expect(refill.state.base.every((c) => c !== null)).toBe(true);
    expect(refill.state.base[0]!.id).toBe(s.nextId);
    expect(types(refill.events)).toEqual(['contract:offered']);
  });

  it('does not mutate the input state', () => {
    const s = board(clear(1));
    const snap = JSON.stringify(s);
    applyContractEvents(s, [{ type: 'contractEnemyKilled', contractId: 3 }, { type: 'evacuated' }]);
    expect(JSON.stringify(s)).toBe(snap);
  });
});

describe('contracts: save section', () => {
  it('round-trips through JSON, including mid-run progress', () => {
    const rolled = refillBoard(createContractsState(), new Rng(9), CTX_ALL).state;
    expect(deserializeContracts(JSON.parse(JSON.stringify(serializeContracts(rolled))))).toEqual(
      rolled,
    );
    let state = applyContractEvents(board(clear(2), core()), [
      { type: 'contractEnemyKilled', contractId: 3 },
      { type: 'itemPicked', itemId: DATA_CORE_ITEM_ID, contractId: 2 },
    ]).state;
    state = { ...state, creditedVariants: ['M1_TERM_04'] };
    const saved = serializeContracts(state);
    expect(saved.v).toBe(1);
    const back = deserializeContracts(JSON.parse(JSON.stringify(saved)));
    expect(back).toEqual(state);
    expect(serializeContracts(back)).toEqual(saved);
  });

  it('missing section = fresh board', () => {
    expect(deserializeContracts(undefined)).toEqual(createContractsState());
    const a = loadContracts(undefined, new Rng(3), CTX1);
    expect(a.state.base.every((c) => c !== null)).toBe(true);
    expect(a.events).toHaveLength(2);
    const saved = serializeContracts(a.state);
    expect(loadContracts(saved, new Rng(3), CTX1)).toEqual({ state: a.state, events: [] });
  });

  it('rejects bad data with SaveError', () => {
    const good = serializeContracts(board(clear(2), relay(1)));
    const mut = (f: (o: Record<string, unknown>) => void): unknown => {
      const o = JSON.parse(JSON.stringify(good)) as Record<string, unknown>;
      f(o);
      return o;
    };
    const base = (o: Record<string, unknown>) => o.base as Record<string, unknown>[];
    const bad: unknown[] = [
      null,
      42,
      [],
      mut((o) => (o.v = 2)),
      mut((o) => delete o.v),
      mut((o) => (o.nextId = 0)),
      mut((o) => (o.nextId = 2)), // id 3 >= nextId
      mut((o) => (o.base = [null])),
      mut((o) => (o.exchange = [{}])),
      mut((o) => (o.creditedVariants = ['NOPE'])),
      mut((o) => (base(o)[0]!.defId = 'M1_CONTR_99')),
      mut((o) => (base(o)[0]!.depth = 3)), // Clear the Path has no depth 3
      mut((o) => (base(o)[0]!.id = 1)), // duplicate id
      mut((o) => (base(o)[0]!.retune = true)), // only Relay can be retune
      mut((o) => ((base(o)[0]!.progress as Record<string, unknown>).killed = 7)),
      mut((o) => ((base(o)[0]!.progress as Record<string, unknown>).met = true)), // 0 kills
      mut((o) => ((base(o)[0]!.progress as Record<string, unknown>).kind = 'recoverItem')),
      mut((o) => ((base(o)[1]!.progress as Record<string, unknown>).variant = 'M1_TERM_05')),
      mut((o) => (base(o)[1] = { ...base(o)[0]!, id: 1 })), // duplicate contract pair
    ];
    for (const b of bad) expect(() => deserializeContracts(b)).toThrow(SaveError);
    expect(() => deserializeContracts(good)).not.toThrow();
  });
});
