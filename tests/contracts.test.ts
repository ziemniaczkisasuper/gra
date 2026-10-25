import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game';
import { GameRng, Rng } from '../src/core/rng';
import {
  CONTRACT_DEFS,
  CONTRACT_ENEMY_LOOT,
  CONTRACT_KRPM_CAP,
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
  contractTextParams,
  createContractsState,
  deserializeContracts,
  freshProgress,
  loadContracts,
  pickTwoStage,
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
import {
  CONTRACTS_SECTION,
  contractsRng,
  getContracts,
  isUnrolled,
  NEW_GAME_BOARD_CONTEXT,
  refillContracts,
  setContracts,
} from '../src/contracts/save';
import { gameFromSave, getSaveSection, parseSave, saveSectionNames, snapshot } from '../src/save';
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

  it('Restore Relay: depths 1–3, 35 kr, retune 25 kr + 2 Copper ×0.5 (balans-m1 v1.1 §5)', () => {
    const d = CONTRACT_DEFS.M1_CONTR_01;
    expect(d.depths).toEqual([1, 2, 3]);
    expect(d.objective).toEqual({ type: 'solveTerminal' });
    for (const depth of [1, 2, 3] as Depth[])
      expect(d.reward[depth]).toEqual({ credits: 35, copper: 0, medPatches: 0 });
    expect(d.retune).toEqual({
      reward: { credits: 25, copper: 2, medPatches: 0 },
      weightMult: 0.5,
    });
    expect(d.weight).toEqual({ 1: 1, 2: 1, 3: 1 });
    expect(CONTRACT_DEFS.M1_CONTR_02.weight).toEqual({ 2: 2 });
    expect(CONTRACT_DEFS.M1_CONTR_03.weight).toEqual({ 1: 1, 2: 1, 3: 1 });
    expect(CONTRACT_ENEMY_LOOT).toBe(0);
    expect(CONTRACT_KRPM_CAP).toEqual({ 1: 20, 2: 48, 3: 90 });
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
      guardGroups: ['ddh'],
    });
    expect(d.reward).toEqual({ 2: { credits: 40, copper: 3, medPatches: 0 } });
  });

  it('Clear the Path: depths 1–3, 6 enemies 12–20 fields, g1/g3 sss+ddh, g2 sss+dht, rewards per depth', () => {
    const d = CONTRACT_DEFS.M1_CONTR_03;
    expect(d.depths).toEqual([1, 2, 3]);
    expect(d.objective).toEqual({
      type: 'killContractEnemies',
      count: 6,
      distFromShaft: [12, 20],
      groups: { 1: ['sss', 'ddh'], 2: ['sss', 'dht'], 3: ['sss', 'ddh'] },
    });
    expect(d.reward[1]).toEqual({ credits: 0, copper: 0, medPatches: 1 });
    expect(d.reward[2]).toEqual({ credits: 25, copper: 0, medPatches: 1 });
    expect(d.reward[3]).toEqual({ credits: 40, copper: 0, medPatches: 1 });
    // every depth composition = 6 enemies
    for (const dep of [1, 2, 3] as const)
      expect(
        (d.objective.type === 'killContractEnemies' ? d.objective.groups[dep] : [])!.join(''),
      ).toHaveLength(6);
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

  it('pool weights: per (contract, depth) from data, no division, retune ×0.5', () => {
    const pool = contractPool(createContractsState(), CTX_ALL);
    const w = (id: ContractDefId, d: Depth) => pool.find((e) => e.defId === id && e.depth === d);
    expect(pool.map((e) => `${e.defId}@${e.depth}=${e.weight}`)).toEqual([
      'M1_CONTR_01@1=1',
      'M1_CONTR_03@1=1',
      'M1_CONTR_01@2=1',
      'M1_CONTR_02@2=2',
      'M1_CONTR_03@2=1',
      'M1_CONTR_01@3=1',
      'M1_CONTR_03@3=1',
    ]);
    expect(w('M1_CONTR_03', 2)?.weight).toBe(1);
    const solved = { unlockedStops: [2, 3] as Depth[], solvedVariants: [...TERMINAL_VARIANTS[1]] };
    const pool2 = contractPool(createContractsState(), solved);
    const r1 = pool2.find((e) => e.defId === 'M1_CONTR_01' && e.depth === 1)!;
    const r2 = pool2.find((e) => e.defId === 'M1_CONTR_01' && e.depth === 2)!;
    expect(r1.retune).toBe(true);
    expect(r1.weight).toBe(0.5);
    expect(r2.retune).toBe(false);
    expect(r2.weight).toBe(1);
    // Locked depths contribute nothing.
    expect(contractPool(createContractsState(), CTX1).map((e) => e.depth)).toEqual([1, 1]);
  });

  it('two-stage draw: depth uniform among unlocked, then type by that depth weights', () => {
    const N = 9000;
    const byDepth: Record<number, number> = {};
    const byPair: Record<string, number> = {};
    for (let seed = 0; seed < N; seed++) {
      const { state } = refillBoard(createContractsState(), new Rng(seed * 7919 + 1), CTX_ALL);
      const c = state.base[0]!;
      byDepth[c.depth] = (byDepth[c.depth] ?? 0) + 1;
      byPair[`${c.defId}@${c.depth}`] = (byPair[`${c.defId}@${c.depth}`] ?? 0) + 1;
    }
    for (const d of [1, 2, 3]) expect(byDepth[d]! / N).toBeCloseTo(1 / 3, 1);
    // depth 1: Relay/Clear 1:1; depth 2: Relay/Core/Clear 1:2:1; depth 3: Relay/Clear 1:1.
    expect(byPair['M1_CONTR_01@1']! / byDepth[1]!).toBeCloseTo(1 / 2, 1);
    expect(byPair['M1_CONTR_02@2']! / byDepth[2]!).toBeCloseTo(1 / 2, 1);
    expect(byPair['M1_CONTR_03@2']! / byDepth[2]!).toBeCloseTo(1 / 4, 1);
    expect(byPair['M1_CONTR_01@3']! / byDepth[3]!).toBeCloseTo(1 / 2, 1);
    expect(byPair['M1_CONTR_03@3']! / byDepth[3]!).toBeCloseTo(1 / 2, 1);

    // Only depth 1 + 3 unlocked: never depth 2, depth split ~1/2.
    const ctx13: BoardContext = { unlockedStops: [3], solvedVariants: [] };
    let d3 = 0;
    for (let seed = 0; seed < 4000; seed++) {
      const c = refillBoard(createContractsState(), new Rng(seed + 17), ctx13).state.base[0]!;
      expect(c.depth).not.toBe(2);
      if (c.depth === 3) d3++;
    }
    expect(d3 / 4000).toBeCloseTo(1 / 2, 1);
  });

  it('retune halves Relay within its depth only', () => {
    // Depth 1 exhausted: at depth 1 Relay(retune) 0.5 vs Clear 1 → 1/3; depth 2 unaffected (1/4).
    const ctx: BoardContext = { unlockedStops: [2], solvedVariants: [...TERMINAL_VARIANTS[1]] };
    const N = 9000;
    let d1 = 0;
    let relay1 = 0;
    let d2 = 0;
    let relay2 = 0;
    for (let seed = 0; seed < N; seed++) {
      const c = refillBoard(createContractsState(), new Rng(seed * 104729 + 3), ctx).state.base[0]!;
      if (c.depth === 1) {
        d1++;
        if (c.defId === 'M1_CONTR_01') {
          relay1++;
          expect(c.retune).toBe(true);
        }
      } else {
        d2++;
        if (c.defId === 'M1_CONTR_01') {
          relay2++;
          expect(c.retune).toBe(false);
        }
      }
    }
    expect(relay1 / d1).toBeCloseTo(1 / 3, 1);
    expect(relay2 / d2).toBeCloseTo(1 / 4, 1); // depth 2: Relay 1 / Core 2 / Clear 1
  });

  it('fallback: a depth with no free type is skipped in the depth draw', () => {
    // Both depth-3 types (Relay@3, Clear@3) already taken → pool has no depth-3 entry.
    const taken = { ...createContractsState(), base: [relay(3), clear(3), null] };
    const pool = contractPool(taken, CTX_ALL);
    expect(pool.some((e) => e.depth === 3)).toBe(false);
    let d1 = 0;
    for (let seed = 0; seed < 3000; seed++) {
      const e = pickTwoStage(pool, new Rng(seed + 99))!;
      expect(e).not.toBeNull();
      expect(e.depth).not.toBe(3);
      if (e.depth === 1) d1++;
    }
    expect(d1 / 3000).toBeCloseTo(1 / 2, 1);
    // Refill with Relay@3 on the board: depth 3 still has Clear@3 → no fallback needed.
    const c = refillBoard(board(relay(3), null), new Rng(5), {
      unlockedStops: [3],
      solvedVariants: [],
    }).state.base[1]!;
    expect(`${c.defId}@${c.depth}`).not.toBe('M1_CONTR_01@3');
    // Nothing free anywhere → no pick (slot would stay empty).
    const full = { ...createContractsState(), base: [relay(1), clear(1), null] };
    expect(pickTwoStage(contractPool(full, CTX1), new Rng(1))).toBeNull();
    expect(pickTwoStage([], new Rng(1))).toBeNull();
  });

  it('offer carries text id and {depth} param', () => {
    const { events } = refillBoard(createContractsState(), new Rng(11), CTX_ALL);
    for (const e of events) {
      if (e.type !== 'contract:offered') throw new Error('unexpected');
      expect(e.payload.textId).toBe(e.payload.defId);
      expect(e.payload.textParams).toEqual({ depth: e.payload.depth });
    }
    expect(contractTextParams(relay(3))).toEqual({ depth: 3 });
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
        guardGroups: ['ddh'],
        enemyLoot: 0,
      },
      {
        contractId: 3,
        kind: 'enemies',
        count: 6,
        distFromShaft: [12, 20],
        groups: ['sss', 'dht'],
        enemyLoot: 0,
      },
    ]);
    expect(contractSpawns(s, 1)).toEqual([]);
    expect(contractSpawns(board(relay(3)), 3)).toEqual([{ contractId: 1, kind: 'terminal' }]);
    expect(contractSpawns(board(clear(3)), 3)).toEqual([
      {
        contractId: 3,
        kind: 'enemies',
        count: 6,
        distFromShaft: [12, 20],
        groups: ['sss', 'ddh'],
        enemyLoot: 0,
      },
    ]);
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
      reward: { credits: 35, copper: 0, medPatches: 0 },
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

    // retune → 25 kr + 2 Copper, no fragment
    r = applyContractEvents(board(inst(1, 'M1_CONTR_01', 1, true)), [
      { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_08', firstSolve: true },
      { type: 'evacuated' },
    ]);
    done = r.events.find((e) => e.type === 'contract:completed')!;
    expect(done.payload).toMatchObject({
      reward: { credits: 25, copper: 2, medPatches: 0 },
      gridFragmentVariant: null,
      gridFragmentPct: 0,
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
      mut((o) => (base(o)[0]!.depth = 4)), // no depth 4
      mut((o) => ((base(o)[1]!.defId = 'M1_CONTR_02'), (base(o)[1]!.id = 5))), // Data Core at depth 1
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

describe('contracts: save v3 section registry (contracts/save.ts)', () => {
  const D = { seed: 1 };
  const rt = (g: Parameters<typeof snapshot>[0]) =>
    parseSave(JSON.parse(JSON.stringify(snapshot(g, 1000))), D, { onWarn: () => {} });

  it('registers the "contracts" section on import', () => {
    expect(saveSectionNames()).toContain(CONTRACTS_SECTION);
    expect(getSaveSection(CONTRACTS_SECTION)).toBeDefined();
    expect(getSaveSection(CONTRACTS_SECTION)!.fresh()).toEqual(createContractsState());
  });

  it('stream("contracts") is an Rng usable by the board and independent of other streams', () => {
    const g = createGame({ seed: 777 });
    const rng = contractsRng(g);
    expect(rng).toBeInstanceOf(Rng);
    expect(rng).toBe(g.rng.stream('contracts'));
    const before = g.rng.getStates().default;
    refillBoard(createContractsState(), rng, CTX_ALL);
    expect(g.rng.getStates().default).toBe(before);
  });

  it('new game = fresh board rolled from stream("contracts"), deterministic per seed', () => {
    const g = gameFromSave(null, { seed: 4242 });
    const board1 = getContracts(g);
    expect(board1.base.every((c) => c !== null && c.depth === 1)).toBe(true);
    const expected = refillBoard(
      createContractsState(),
      new GameRng(4242).stream('contracts'),
      NEW_GAME_BOARD_CONTEXT,
    ).state;
    expect(board1).toEqual(expected);
    expect(getContracts(gameFromSave(null, { seed: 4242 }))).toEqual(board1);
  });

  it('save without the section = fresh board', () => {
    const g = gameFromSave(null, { seed: 9 });
    const data = rt(g);
    delete data[CONTRACTS_SECTION];
    const loaded = gameFromSave(data);
    expect(isUnrolled(getContracts(loaded))).toBe(false);
    expect(getContracts(loaded).nextId).toBe(3);
  });

  it('round-trips through snapshot → parseSave → gameFromSave, incl. progress and rng stream', () => {
    const g = gameFromSave(null, { seed: 31337 });
    setContracts(g, board(clear(2), core()));
    setContracts(
      g,
      applyContractEvents(getContracts(g), [
        { type: 'contractEnemyKilled', contractId: 3 },
        { type: 'itemPicked', itemId: DATA_CORE_ITEM_ID, contractId: 2 },
      ]).state,
    );
    const data = rt(g);
    expect((data[CONTRACTS_SECTION] as { v: number }).v).toBe(1);
    const loaded = gameFromSave(data);
    expect(getContracts(loaded)).toEqual(getContracts(g));
    // The contracts stream continues identically after load.
    const die = (s: Parameters<typeof getContracts>[0]) =>
      applyContractEvent(getContracts(s), { type: 'died' }).state;
    setContracts(g, { ...die(g), base: [null, null] });
    setContracts(loaded, { ...die(loaded), base: [null, null] });
    expect(refillContracts(loaded, CTX_ALL)).toEqual(refillContracts(g, CTX_ALL));
  });

  it('bad contracts section rejects the whole save with SaveError', () => {
    const data = rt(gameFromSave(null, { seed: 5 })) as Record<string, unknown>;
    const bad = { ...data, [CONTRACTS_SECTION]: { v: 99 } };
    expect(() => parseSave(bad, D)).toThrow(SaveError);
    expect(() => parseSave({ ...data, [CONTRACTS_SECTION]: 'x' }, D)).toThrow(SaveError);
  });
});
