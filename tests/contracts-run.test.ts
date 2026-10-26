// T29: contract board at base, level-gen spawns, evacuation payout, death reset.
import { describe, expect, it } from 'vitest';
import { createGame, enterMode } from '../src/core/game';
import { GameRng, streamSeed } from '../src/core/rng';
import {
  createContractsState,
  freshProgress,
  refillBoard,
  serializeContracts,
} from '../src/contracts/board';
import { applyContractEvent, applyContractEvents } from '../src/contracts/progress';
import {
  boardAtBase,
  contractsForLevel,
  playerAtBase,
  settleContractsOnDeath,
  settleContractsOnEvac,
} from '../src/contracts/run';
import {
  contractsRng,
  getContracts,
  NEW_GAME_BOARD_CONTEXT,
  setContracts,
} from '../src/contracts/save';
import type { ContractInputEvent, ContractInstance, ContractsState } from '../src/contracts/types';
import {
  CONTRACT_DEFS,
  CONTRACT_SLOTS_BASE,
  DATA_CORE_ITEM_ID,
  TERMINAL_VARIANTS,
  type ContractDefId,
  type Depth,
} from '../src/data/contracts-m1';
import { COPPER_ITEM_ID, MEDPATCH_ITEM_ID } from '../src/data/inventory-m1';
import {
  createInventoryState,
  getInventory,
  onDeath,
  pickupItem,
  setInventory,
} from '../src/inventory/inventory';
import type { InventoryState } from '../src/inventory/types';
import { generateLevel } from '../src/world/levelgen';

function inst(id: number, defId: ContractDefId, depth: Depth, retune = false): ContractInstance {
  return { id, defId, depth, retune, progress: freshProgress(CONTRACT_DEFS[defId]) };
}

function board(...cs: (ContractInstance | null)[]): ContractsState {
  const s = {
    nextId: 1,
    base: Array.from({ length: CONTRACT_SLOTS_BASE }, () => null) as (ContractInstance | null)[],
    exchange: [null] as [null],
    creditedVariants: [] as string[],
  };
  cs.forEach((c, i) => {
    s.base[i] = c;
  });
  s.nextId = Math.max(0, ...cs.map((c) => c?.id ?? 0)) + 1;
  return s;
}

const relay = (d: Depth) => inst(1, 'M1_CONTR_01', d);
const core = () => inst(2, 'M1_CONTR_02', 2);
const clear = (d: Depth) => inst(3, 'M1_CONTR_03', d);

function countItem(inv: InventoryState, itemId: string): number {
  let n = 0;
  for (const it of [...inv.bag, ...inv.locker]) if (it?.itemId === itemId) n += it.count;
  return n;
}

function putZoneInventory(game: ReturnType<typeof createGame>, baseCr = 50): InventoryState {
  const inv = createInventoryState();
  inv.location = 'zone';
  inv.baseCr = baseCr;
  setInventory(game, inv);
  return inv;
}

/** Mark the objective met, then evacuate. Deltas are measured on the stored inventory. */
function finish(
  contract: ContractInstance,
  steps: readonly ContractInputEvent[],
  baseCr = 50,
): { credits: number; copper: number; medPatches: number } {
  const game = createGame({ seed: 1, mode: 'zone' });
  setContracts(game, applyContractEvents(board(contract), steps).state);
  putZoneInventory(game, baseCr);
  const before = getInventory(game);
  const start = {
    credits: before.baseCr,
    copper: countItem(before, COPPER_ITEM_ID),
    medPatches: countItem(before, MEDPATCH_ITEM_ID),
  };
  const res = settleContractsOnEvac(game);
  const done = res.events.find((e) => e.type === 'contract:completed');
  expect(done).toBeDefined();
  expect(res.overflow).toEqual({ copper: 0, medPatches: 0 });
  const after = getInventory(game);
  return {
    credits: after.baseCr - start.credits,
    copper: countItem(after, COPPER_ITEM_ID) - start.copper,
    medPatches: countItem(after, MEDPATCH_ITEM_ID) - start.medPatches,
  };
}

const kills = (contractId: number, n: number): ContractInputEvent[] =>
  Array.from({ length: n }, () => ({ type: 'contractEnemyKilled', contractId }));

describe('boardAtBase', () => {
  it('rolls empty slots from the contracts stream when the player is in the base', () => {
    const seed = 99;
    const game = createGame({ seed, mode: 'base' });
    expect(playerAtBase(game)).toBe(true);
    const rng = contractsRng(game);
    expect(rng.getState()).toBe(streamSeed(seed, 'contracts'));
    const baseBefore = game.rng.getState();
    const mirror = new GameRng(seed).stream('contracts');
    const expected = refillBoard(createContractsState(), mirror, NEW_GAME_BOARD_CONTEXT);

    const first = boardAtBase(game, rng);
    expect(first.events.map((e) => e.type)).toEqual(['contract:offered', 'contract:offered']);
    expect(serializeContracts(getContracts(game))).toEqual(serializeContracts(expected.state));
    expect(game.rng.getState()).toBe(baseBefore);
    expect(rng.getState()).toBe(mirror.getState());

    const ids = getContracts(game).base.map((c) => c?.id);
    expect(ids).toEqual([1, 2]);
    const second = boardAtBase(game, rng);
    expect(second.events).toEqual([]);
    expect(getContracts(game).base.map((c) => c?.id)).toEqual(ids);
    expect(rng.getState()).toBe(mirror.getState());
  });

  it('does not refill or draw outside the base', () => {
    const game = createGame({ seed: 3 });
    const rng = contractsRng(game);
    const state = rng.getState();
    expect(playerAtBase(game)).toBe(false);
    expect(boardAtBase(game, rng).events).toEqual([]);
    expect(game.sections.contracts).toBeUndefined();
    expect(rng.getState()).toBe(state);

    const inv = createInventoryState();
    inv.location = 'zone';
    setInventory(game, inv);
    expect(boardAtBase(game, rng).events).toEqual([]);
    expect(rng.getState()).toBe(state);
  });

  it('refills when inventory location is already base (return from the zone)', () => {
    const game = createGame({ seed: 11 });
    const inv = createInventoryState();
    inv.location = 'base';
    setInventory(game, inv);
    expect(playerAtBase(game)).toBe(true);
    boardAtBase(game, contractsRng(game));
    expect(getContracts(game).base.every((c) => c !== null)).toBe(true);
  });
});

describe('contractsForLevel', () => {
  it('turns a Data Core and a Clear the Path into objects levelgen already places', () => {
    const game = createGame({ seed: 47, mode: 'zone' });
    setContracts(game, board(core(), clear(2)));
    const spawns = contractsForLevel(game, 2);
    expect(spawns).toEqual([
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

    const fromRun = generateLevel({ expSeed: 47, depth: 2, contracts: spawns });
    const fromShorthand = generateLevel({
      expSeed: 47,
      depth: 2,
      contracts: [{ kind: 'datacore' }, { kind: 'clearpath' }],
    });
    expect(fromRun.rows).toEqual(fromShorthand.rows);
    expect(fromRun.contractObjects).toEqual([
      expect.objectContaining({
        glyph: '§',
        kind: 'datacore',
        contractId: 2,
        itemId: DATA_CORE_ITEM_ID,
      }),
    ]);
    expect(
      fromRun.enemies.some((e) => e.tag === 'datacore' && e.contract && e.contractId === 2),
    ).toBe(true);
    expect(
      fromRun.enemies.some((e) => e.tag === 'clearpath' && e.contract && e.contractId === 3),
    ).toBe(true);
    expect(contractsForLevel(game, 1)).toEqual([]);
  });

  it('passes a depth-1 Clear the Path through, and a terminal spawn adds no cells', () => {
    const game = createGame({ seed: 47, mode: 'zone' });
    setContracts(game, board(relay(1), clear(1)));
    const spawns = contractsForLevel(game, 1);
    expect(spawns.map((s) => s.kind)).toEqual(['terminal', 'enemies']);
    expect(spawns[1]).toMatchObject({ groups: ['sss', 'ddh'], enemyLoot: 0, count: 6 });
    const withTerminal = generateLevel({ expSeed: 47, depth: 1, contracts: spawns });
    const enemiesOnly = generateLevel({
      expSeed: 47,
      depth: 1,
      contracts: spawns.filter((s) => s.kind !== 'terminal'),
    });
    expect(withTerminal.rows).toEqual(enemiesOnly.rows);
    expect(withTerminal.enemies.some((e) => e.tag === 'clearpath' && e.contract)).toBe(true);
  });

  it('omits an objective that is already met', () => {
    const game = createGame({ seed: 1, mode: 'zone' });
    const met = applyContractEvent(board(core()), {
      type: 'itemPicked',
      itemId: DATA_CORE_ITEM_ID,
      contractId: 2,
    }).state;
    setContracts(game, met);
    expect(contractsForLevel(game, 2)).toEqual([]);
  });
});

describe('settleContractsOnEvac pays balans-m1 §5', () => {
  it('finishes Restore Relay, Data Core, and Clear the Path', () => {
    // REWARD_RELAY = 35 kr, no Copper (every depth).
    for (const depth of [1, 2, 3] as const) {
      const variant = TERMINAL_VARIANTS[depth][0];
      expect(variant).toBeDefined();
      const delta = finish(relay(depth), [
        { type: 'terminalSolved', depth, variant: variant!, firstSolve: true },
      ]);
      expect(delta).toEqual({ credits: 35, copper: 0, medPatches: 0 });
    }

    // REWARD_DATACORE = 40 kr + 3 Copper. The core leaves the bag (handed to BASE).
    const game = createGame({ seed: 2, mode: 'zone' });
    setContracts(game, board(core()));
    putZoneInventory(game, 50);
    const picked = pickupItem(getInventory(game), {
      itemId: DATA_CORE_ITEM_ID,
      contractId: 2,
    });
    expect(picked.ok).toBe(true);
    setInventory(game, picked.state);
    setContracts(game, applyContractEvents(getContracts(game), picked.contractEvents ?? []).state);
    const before = getInventory(game);
    const res = settleContractsOnEvac(game);
    const done = res.events.find((e) => e.type === 'contract:completed');
    expect(done?.type === 'contract:completed' && done.payload.reward).toEqual({
      credits: 40,
      copper: 3,
      medPatches: 0,
    });
    const after = getInventory(game);
    expect(after.baseCr - before.baseCr).toBe(40);
    expect(countItem(after, COPPER_ITEM_ID) - countItem(before, COPPER_ITEM_ID)).toBe(3);
    expect(countItem(after, MEDPATCH_ITEM_ID)).toBe(0);
    expect(after.bag.some((it) => it?.itemId === DATA_CORE_ITEM_ID)).toBe(false);
    expect(getContracts(game).base[0]).toBeNull();

    // REWARD_CLEARPATH depth 1 = 1 Med-Patch, 0 kr, 0 Copper.
    expect(finish(clear(1), kills(3, 6))).toEqual({ credits: 0, copper: 0, medPatches: 1 });
  });

  it('pays the other Clear the Path rows and a retune (balans-m1 §5)', () => {
    // Depth 2: 25 kr + 1 Med-Patch. Depth 3: 40 kr + 1 Med-Patch.
    expect(finish(clear(2), kills(3, 6))).toEqual({ credits: 25, copper: 0, medPatches: 1 });
    expect(finish(clear(3), kills(3, 6))).toEqual({ credits: 40, copper: 0, medPatches: 1 });
    // RETUNE_REWARD = 25 kr + 2 Copper, no grid fragment.
    const game = createGame({ seed: 4, mode: 'zone' });
    setContracts(
      game,
      applyContractEvents(board(inst(1, 'M1_CONTR_01', 1, true)), [
        { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_08', firstSolve: true },
      ]).state,
    );
    putZoneInventory(game, 10);
    const before = getInventory(game).baseCr;
    const res = settleContractsOnEvac(game);
    const done = res.events.find((e) => e.type === 'contract:completed');
    expect(done?.type === 'contract:completed' && done.payload).toMatchObject({
      reward: { credits: 25, copper: 2, medPatches: 0 },
      gridFragmentVariant: null,
      gridFragmentPct: 0,
    });
    expect(getInventory(game).baseCr - before).toBe(25);
    expect(countItem(getInventory(game), COPPER_ITEM_ID)).toBe(2);
  });

  it('an unmet contract stays with progress 0 and pays nothing', () => {
    const game = createGame({ seed: 5, mode: 'zone' });
    setContracts(
      game,
      applyContractEvents(board(clear(2)), [{ type: 'contractEnemyKilled', contractId: 3 }]).state,
    );
    putZoneInventory(game, 80);
    const res = settleContractsOnEvac(game);
    expect(res.events.some((e) => e.type === 'contract:completed')).toBe(false);
    expect(res.inventoryEvents).toEqual([]);
    expect(getInventory(game).baseCr).toBe(80);
    expect(countItem(getInventory(game), COPPER_ITEM_ID)).toBe(0);
    expect(getContracts(game).base[0]).toMatchObject({
      id: 3,
      progress: freshProgress(CONTRACT_DEFS.M1_CONTR_03),
    });
  });
});

describe('settleContractsOnDeath', () => {
  it('returns the active contract to the board at progress 0 with no payout', () => {
    const game = createGame({ seed: 6, mode: 'zone' });
    setContracts(
      game,
      applyContractEvents(board(clear(1), relay(1)), [
        ...kills(3, 4),
        { type: 'terminalSolved', depth: 1, variant: 'M1_TERM_04', firstSolve: true },
      ]).state,
    );
    putZoneInventory(game, 120);
    const res = settleContractsOnDeath(game);
    expect(res.events.map((e) => e.type)).toEqual(['contract:failed', 'contract:failed']);
    expect(res.events.some((e) => e.type === 'contract:completed')).toBe(false);
    expect(res.inventoryEvents).toEqual([]);
    expect(getInventory(game).baseCr).toBe(120);
    expect(countItem(getInventory(game), COPPER_ITEM_ID)).toBe(0);
    expect(getContracts(game).base.map((c) => c?.id)).toEqual([3, 1]);
    expect(getContracts(game).base[0]!.progress).toEqual(freshProgress(CONTRACT_DEFS.M1_CONTR_03));
    expect(getContracts(game).base[1]!.progress).toEqual(freshProgress(CONTRACT_DEFS.M1_CONTR_01));

    // Entering the base afterwards does not roll a replacement (the slot is still taken).
    enterMode(game, 'base');
    const rng = contractsRng(game);
    const drawn = rng.getState();
    expect(boardAtBase(game, rng).events).toEqual([]);
    expect(rng.getState()).toBe(drawn);
    expect(getContracts(game).base.map((c) => c?.id)).toEqual([3, 1]);
    expect(getInventory(game).baseCr).toBe(120);
  });

  it('applies died once and does not call inventory onDeath', () => {
    const game = createGame({ seed: 7, mode: 'zone' });
    setContracts(game, board(core()));
    putZoneInventory(game, 15);
    const picked = pickupItem(getInventory(game), {
      itemId: DATA_CORE_ITEM_ID,
      contractId: 2,
    });
    setInventory(game, picked.state);
    setContracts(game, applyContractEvents(getContracts(game), picked.contractEvents ?? []).state);
    expect(getContracts(game).base[0]!.progress.met).toBe(true);

    // onDeath clears the bag and reports itemLost. It does not touch the board.
    const death = onDeath(getInventory(game));
    setInventory(game, death.state);
    expect(death.contractEvents).toEqual([
      { type: 'itemLost', itemId: DATA_CORE_ITEM_ID, contractId: 2 },
    ]);
    expect(getContracts(game).base[0]!.progress.met).toBe(true);

    const settled = settleContractsOnDeath(game);
    expect(settled.events).toEqual([
      {
        type: 'contract:failed',
        payload: {
          contractId: 2,
          defId: 'M1_CONTR_02',
          depth: 2,
          reason: 'died',
          hadProgress: true,
        },
      },
    ]);
    expect(getContracts(game).base[0]).toMatchObject({
      id: 2,
      progress: { kind: 'recoverItem', met: false },
    });
    expect(getInventory(game).baseCr).toBe(15);
    expect(countItem(getInventory(game), COPPER_ITEM_ID)).toBe(0);
    expect(getInventory(game).bag.every((it) => !it || it.itemId !== DATA_CORE_ITEM_ID)).toBe(true);

    // The itemLost from onDeath, applied after died, does not pay and does not drop the slot.
    const extra = applyContractEvents(getContracts(game), death.contractEvents);
    expect(extra.events).toEqual([]);
    expect(extra.state.base[0]!.id).toBe(2);
  });

  it('leaves a carried Data Core in the bag when only the contract side runs', () => {
    const game = createGame({ seed: 8, mode: 'zone' });
    setContracts(game, board(core()));
    putZoneInventory(game, 15);
    const picked = pickupItem(getInventory(game), {
      itemId: DATA_CORE_ITEM_ID,
      contractId: 2,
    });
    setInventory(game, picked.state);
    setContracts(game, applyContractEvents(getContracts(game), picked.contractEvents ?? []).state);
    settleContractsOnDeath(game);
    expect(getInventory(game).bag.some((it) => it?.itemId === DATA_CORE_ITEM_ID)).toBe(true);
    expect(getContracts(game).base[0]!.progress.met).toBe(false);
    expect(getInventory(game).baseCr).toBe(15);
  });
});
