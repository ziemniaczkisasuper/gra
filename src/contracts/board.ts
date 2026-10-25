// BASE contract board: creation, rolling (only via the passed core/rng.ts Rng), refill at base,
// spawn requirements for the level generator, save section. Pure logic, no DOM.
import type { Rng } from '../core/rng';
import {
  CONTRACT_DEFS,
  CONTRACT_SLOTS_BASE,
  CONTRACT_SLOTS_EXCHANGE,
  CONTRACTS_M1,
  DEPTHS,
  TERMINAL_VARIANTS,
  type ContractDef,
  type ContractDefId,
  type Depth,
} from '../data/contracts-m1';
import { SaveError } from '../save/schema';
import type {
  BoardContext,
  ContractId,
  ContractInstance,
  ContractOutputEvent,
  ContractProgress,
  ContractResult,
  ContractsSave,
  ContractsState,
} from './types';

/** Empty board (all slots empty). Use refillBoard() / loadContracts() to fill it. */
export function createContractsState(): ContractsState {
  return {
    nextId: 1,
    base: Array.from({ length: CONTRACT_SLOTS_BASE }, () => null),
    exchange: Array.from({ length: CONTRACT_SLOTS_EXCHANGE }, () => null),
    creditedVariants: [],
  };
}

export function freshProgress(def: ContractDef): ContractProgress {
  switch (def.objective.type) {
    case 'solveTerminal':
      return { kind: 'solveTerminal', met: false, variant: null, fragment: false };
    case 'recoverItem':
      return { kind: 'recoverItem', met: false };
    case 'killContractEnemies':
      return { kind: 'killContractEnemies', met: false, killed: 0, required: def.objective.count };
  }
}

/** Depths where BASE contracts may be rolled: depth 1 always + unlocked lift stops (2.4, 2.9). */
export function allowedDepths(ctx: BoardContext): Depth[] {
  return DEPTHS.filter((d) => d === 1 || ctx.unlockedStops.includes(d));
}

/** All variants of the depth solved → Restore Relay is offered as a "retune" (LD §3). */
export function variantsExhausted(depth: Depth, solvedVariants: readonly string[]): boolean {
  return TERMINAL_VARIANTS[depth].every((v) => solvedVariants.includes(v));
}

export interface PoolEntry {
  defId: ContractDefId;
  depth: Depth;
  retune: boolean;
  weight: number;
}

/**
 * Weighted pool of (contract, depth) pairs.
 * Weight of a pair = def.weight × (retune ? retune.weightMult : 1) / (number of allowed depths of
 * that def). So the weight from the table is the weight of the contract TYPE, split evenly over its
 * allowed depths (Relay with 3 unlocked depths does not get 3× the share). [ASSUMPTION A1]
 * Pairs already on the board are excluded (no two identical contracts at once). [ASSUMPTION A2]
 */
export function contractPool(state: ContractsState, ctx: BoardContext): PoolEntry[] {
  const allowed = allowedDepths(ctx);
  const taken = new Set(
    state.base.filter((c): c is ContractInstance => c !== null).map((c) => `${c.defId}@${c.depth}`),
  );
  const pool: PoolEntry[] = [];
  for (const def of CONTRACTS_M1) {
    const depths = def.depths.filter((d) => allowed.includes(d));
    for (const depth of depths) {
      if (taken.has(`${def.id}@${depth}`)) continue;
      // Retune is decided per depth: the level terminal is always a variant of its own depth. [A3]
      const retune = def.retune !== undefined && variantsExhausted(depth, ctx.solvedVariants);
      const mult = retune && def.retune ? def.retune.weightMult : 1;
      pool.push({ defId: def.id, depth, retune, weight: (def.weight * mult) / depths.length });
    }
  }
  return pool;
}

function pickWeighted(pool: readonly PoolEntry[], rng: Rng): PoolEntry | null {
  const total = pool.reduce((s, e) => s + e.weight, 0);
  if (pool.length === 0 || total <= 0) return null;
  let x = rng.next() * total;
  for (const e of pool) {
    x -= e.weight;
    if (x < 0) return e;
  }
  return pool[pool.length - 1] ?? null;
}

/**
 * Fills empty BASE slots (call when the player is back at base: after evacuation and after the
 * death reprint, and once for a new game). Randomness ONLY from the passed Rng (core/rng.ts).
 * A slot stays empty if the pool is exhausted.
 */
export function refillBoard(state: ContractsState, rng: Rng, ctx: BoardContext): ContractResult {
  let s = cloneState(state);
  const events: ContractOutputEvent[] = [];
  for (let i = 0; i < s.base.length; i++) {
    if (s.base[i] !== null) continue;
    const pick = pickWeighted(contractPool(s, ctx), rng);
    if (!pick) break;
    const def = CONTRACT_DEFS[pick.defId];
    const inst: ContractInstance = {
      id: s.nextId,
      defId: def.id,
      depth: pick.depth,
      retune: pick.retune,
      progress: freshProgress(def),
    };
    s = { ...s, nextId: s.nextId + 1, base: s.base.map((c, j) => (j === i ? inst : c)) };
    events.push({
      type: 'contract:offered',
      payload: { contractId: inst.id, defId: inst.defId, depth: inst.depth, retune: inst.retune },
    });
  }
  return { state: s, events };
}

/** Active (open) contracts on the board. */
export function activeContracts(state: ContractsState): ContractInstance[] {
  return state.base.filter((c): c is ContractInstance => c !== null);
}

/** What the level generator must place for a level of `depth` (contract-tagged spawns). */
export type ContractSpawn =
  | { contractId: ContractId; kind: 'terminal' }
  | {
      contractId: ContractId;
      kind: 'item';
      itemId: string;
      distFromShaft: [number, number];
      guards: number;
    }
  | { contractId: ContractId; kind: 'enemies'; count: number; distFromShaft: [number, number] };

export function contractSpawns(state: ContractsState, depth: Depth): ContractSpawn[] {
  const out: ContractSpawn[] = [];
  for (const c of activeContracts(state)) {
    if (c.depth !== depth || c.progress.met) continue;
    const o = CONTRACT_DEFS[c.defId].objective;
    if (o.type === 'solveTerminal') out.push({ contractId: c.id, kind: 'terminal' });
    else if (o.type === 'recoverItem')
      out.push({
        contractId: c.id,
        kind: 'item',
        itemId: o.itemId,
        distFromShaft: [...o.distFromShaft],
        guards: o.guards,
      });
    else
      out.push({
        contractId: c.id,
        kind: 'enemies',
        count: o.count,
        distFromShaft: [...o.distFromShaft],
      });
  }
  return out;
}

// ---------------------------------------------------------------------------------------------
// Copy helpers (state is treated as immutable by the public API)

export function cloneInstance(c: ContractInstance): ContractInstance {
  return { ...c, progress: { ...c.progress } };
}

export function cloneState(s: ContractsState): ContractsState {
  return {
    nextId: s.nextId,
    base: s.base.map((c) => (c ? cloneInstance(c) : null)),
    exchange: s.exchange.map(() => null),
    creditedVariants: [...s.creditedVariants],
  };
}

// ---------------------------------------------------------------------------------------------
// Save section (Engine adds `contracts?: ContractsSave` to the save schema)

export function serializeContracts(state: ContractsState): ContractsSave {
  const s = cloneState(state);
  return {
    v: 1,
    nextId: s.nextId,
    base: s.base,
    exchange: s.exchange,
    creditedVariants: s.creditedVariants,
  };
}

type Raw = Record<string, unknown>;
const isObj = (v: unknown): v is Raw => typeof v === 'object' && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const ALL_VARIANTS = new Set(DEPTHS.flatMap((d) => TERMINAL_VARIANTS[d]));

function parseProgress(raw: unknown, def: ContractDef, depth: Depth, at: string): ContractProgress {
  if (!isObj(raw) || !isBool(raw.met)) throw new SaveError(`${at}: bad progress`);
  const o = def.objective;
  if (o.type === 'solveTerminal') {
    if (raw.kind !== 'solveTerminal') throw new SaveError(`${at}: progress kind mismatch`);
    const variant = raw.variant;
    if (
      variant !== null &&
      !(typeof variant === 'string' && TERMINAL_VARIANTS[depth].includes(variant))
    )
      throw new SaveError(`${at}: bad variant`);
    if (!isBool(raw.fragment)) throw new SaveError(`${at}: bad fragment flag`);
    if (raw.met !== (variant !== null)) throw new SaveError(`${at}: met/variant mismatch`);
    return { kind: 'solveTerminal', met: raw.met, variant, fragment: raw.fragment && raw.met };
  }
  if (o.type === 'recoverItem') {
    if (raw.kind !== 'recoverItem') throw new SaveError(`${at}: progress kind mismatch`);
    return { kind: 'recoverItem', met: raw.met };
  }
  if (raw.kind !== 'killContractEnemies') throw new SaveError(`${at}: progress kind mismatch`);
  if (raw.required !== o.count) throw new SaveError(`${at}: bad required count`);
  if (!isInt(raw.killed) || raw.killed < 0 || raw.killed > o.count)
    throw new SaveError(`${at}: bad kill count`);
  if (raw.met !== raw.killed >= o.count) throw new SaveError(`${at}: met/kills mismatch`);
  return { kind: 'killContractEnemies', met: raw.met, killed: raw.killed, required: o.count };
}

function parseInstance(raw: unknown, at: string): ContractInstance {
  if (!isObj(raw)) throw new SaveError(`${at}: not an object`);
  if (!isInt(raw.id) || raw.id < 1) throw new SaveError(`${at}: bad id`);
  const defId = raw.defId;
  if (typeof defId !== 'string' || !Object.hasOwn(CONTRACT_DEFS, defId))
    throw new SaveError(`${at}: unknown contract`);
  const def = CONTRACT_DEFS[defId as ContractDefId];
  const depth = raw.depth;
  if (!isInt(depth) || !def.depths.includes(depth as Depth))
    throw new SaveError(`${at}: bad depth`);
  if (!isBool(raw.retune) || (raw.retune && !def.retune)) throw new SaveError(`${at}: bad retune`);
  const progress = parseProgress(raw.progress, def, depth as Depth, at);
  if (raw.retune && progress.kind === 'solveTerminal' && progress.fragment)
    throw new SaveError(`${at}: retune cannot carry a fragment`);
  return { id: raw.id, defId: def.id, depth: depth as Depth, retune: raw.retune, progress };
}

/** Validates a saved section; throws SaveError (save/schema.ts) on bad data. */
export function deserializeContracts(raw: unknown): ContractsState {
  if (raw === undefined) return createContractsState();
  if (!isObj(raw)) throw new SaveError('contracts: not an object');
  if (raw.v !== 1) throw new SaveError(`contracts: unsupported version ${String(raw.v)}`);
  if (!isInt(raw.nextId) || raw.nextId < 1) throw new SaveError('contracts: bad nextId');
  const nextId = raw.nextId;
  if (!Array.isArray(raw.base) || raw.base.length !== CONTRACT_SLOTS_BASE)
    throw new SaveError('contracts: bad base slots');
  if (!Array.isArray(raw.exchange) || raw.exchange.length !== CONTRACT_SLOTS_EXCHANGE)
    throw new SaveError('contracts: bad exchange slots');
  if (raw.exchange.some((x) => x !== null))
    throw new SaveError('contracts: exchange not supported');
  const base = raw.base.map((c, i) =>
    c === null ? null : parseInstance(c, `contracts.base[${i}]`),
  );
  const ids = new Set<number>();
  const pairs = new Set<string>();
  for (const c of base) {
    if (!c) continue;
    if (c.id >= nextId) throw new SaveError('contracts: id >= nextId');
    if (ids.has(c.id)) throw new SaveError('contracts: duplicate id');
    const key = `${c.defId}@${c.depth}`;
    if (pairs.has(key)) throw new SaveError('contracts: duplicate contract');
    ids.add(c.id);
    pairs.add(key);
  }
  const cv = raw.creditedVariants;
  if (!Array.isArray(cv) || cv.some((v) => typeof v !== 'string' || !ALL_VARIANTS.has(v)))
    throw new SaveError('contracts: bad creditedVariants');
  return {
    nextId,
    base,
    exchange: Array.from({ length: CONTRACT_SLOTS_EXCHANGE }, () => null),
    creditedVariants: [...new Set(cv as string[])],
  };
}

/**
 * Helper for loading: missing section (old save / new game) = fresh board filled from the passed
 * Rng; otherwise the validated saved board (SaveError on bad data – caller decides what to do).
 */
export function loadContracts(raw: unknown, rng: Rng, ctx: BoardContext): ContractResult {
  if (raw === undefined) return refillBoard(createContractsState(), rng, ctx);
  return { state: deserializeContracts(raw), events: [] };
}
