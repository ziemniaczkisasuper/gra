// BASE contracts M1 – data only (no logic). Source: design/mechaniki-m1.md v0.4, §2.4 (table
// M1_CONTR_01..03), §2.9 (lift stops), §2.15 (grid fragments, terminal variants), §2.16
// (CONTRACT_SLOTS, REWARD_*, RETUNE_*, CLEARPATH_ENEMY_DIST, DATACORE_DIST); design/level-design-m1.md
// §1 and §3; fabula/zakres-m1.md §7. Economic values are (R) – working values for Balance/Economy.

/** Zone depth in Sector 1 (1 Outskirts, 2 Solar Fields, 3 Rail Depot). */
export type Depth = 1 | 2 | 3;
export const DEPTHS: readonly Depth[] = [1, 2, 3];

/** CONTRACT_SLOTS = 2 BASE + 1 Exchange (Exchange not implemented in this module yet). */
export const CONTRACT_SLOTS_BASE = 2;
export const CONTRACT_SLOTS_EXCHANGE = 1;

/** Grid fragment for the first solve of a Power Lines variant (GRID_FRAGMENTS: 8 × 10%). */
export const GRID_FRAGMENT_PCT = 10;

/**
 * Power Lines variants per depth, in difficulty / appearance order (§2.15, LD §1).
 * A level gets the first unsolved variant of its depth; when all are solved → "retune".
 */
export const TERMINAL_VARIANTS: Readonly<Record<Depth, readonly string[]>> = {
  1: ['M1_TERM_04', 'M1_TERM_07', 'M1_TERM_08'],
  2: ['M1_TERM_05', 'M1_TERM_01', 'M1_TERM_02'],
  3: ['M1_TERM_06', 'M1_TERM_03'],
};

/** Item id of the Data Core `§` (1 bag slot, lost on death). Id to be aligned with the loot table. */
export const DATA_CORE_ITEM_ID = 'M1_ITEM_DATA_CORE';

export interface ContractReward {
  credits: number;
  copper: number;
  medPatches: number;
}

export type ContractObjective =
  /** Solve this level's Power Lines terminal (TERMINAL_DIST_FROM_SHAFT 25–40, from LD). */
  | { type: 'solveTerminal' }
  /** Pick up the contract item (placed distFromShaft away, guarded by `guards` contract enemies). */
  | { type: 'recoverItem'; itemId: string; distFromShaft: [number, number]; guards: number }
  /** Kill `count` contract enemies placed distFromShaft away from the shaft. */
  | { type: 'killContractEnemies'; count: number; distFromShaft: [number, number] };

export type ContractDefId = 'M1_CONTR_01' | 'M1_CONTR_02' | 'M1_CONTR_03';

export interface ContractDef {
  id: ContractDefId;
  /** Text id in fabula/teksty-m1-en.md (title + one-line background). */
  textId: ContractDefId;
  issuer: 'BASE';
  objective: ContractObjective;
  /** Depths the contract can be rolled for (further limited to unlocked lift stops). */
  depths: readonly Depth[];
  /** Reward by depth (only depths listed in `depths`). */
  reward: Partial<Record<Depth, ContractReward>>;
  /** Base weight in the pool (R). */
  weight: number;
  /**
   * Restore Relay only: once all variants of the depth are solved the contract becomes a
   * "retune" (LD §3): own reward, no grid fragment, weight × retuneWeightMult.
   */
  retune?: { reward: ContractReward; weightMult: number };
  /** Expected session length (median range, ms) – telemetry/QA only, there is NO time limit (§2.4). */
  expectedMs: [number, number];
}

const r = (credits: number, copper = 0, medPatches = 0): ContractReward => ({
  credits,
  copper,
  medPatches,
});

export const CONTRACTS_M1: readonly ContractDef[] = [
  {
    id: 'M1_CONTR_01',
    textId: 'M1_CONTR_01',
    issuer: 'BASE',
    objective: { type: 'solveTerminal' },
    depths: [1, 2, 3],
    // REWARD_RELAY: 40 kr (+ grid fragment on the first solve of the variant – see progress.ts)
    reward: { 1: r(40), 2: r(40), 3: r(40) },
    weight: 1,
    // RETUNE_REWARD / RETUNE_WEIGHT: 40 kr / ×0.5 (R)
    retune: { reward: r(40), weightMult: 0.5 },
    expectedMs: [75_000, 170_000],
  },
  {
    id: 'M1_CONTR_02',
    textId: 'M1_CONTR_02',
    issuer: 'BASE',
    objective: {
      type: 'recoverItem',
      itemId: DATA_CORE_ITEM_ID,
      distFromShaft: [30, 45], // DATACORE_DIST
      guards: 3,
    },
    depths: [2],
    reward: { 2: r(40, 3) }, // REWARD_DATACORE: 40 kr + 3 Copper
    weight: 1,
    expectedMs: [60_000, 110_000],
  },
  {
    id: 'M1_CONTR_03',
    textId: 'M1_CONTR_03',
    issuer: 'BASE',
    objective: { type: 'killContractEnemies', count: 6, distFromShaft: [12, 20] }, // CLEARPATH_ENEMY_DIST
    depths: [1, 2],
    reward: { 1: r(0, 0, 1), 2: r(25, 0, 1) }, // REWARD_CLEARPATH: 1 Med-Patch / 25 kr + 1 Med-Patch
    weight: 1,
    expectedMs: [45_000, 80_000],
  },
];

export const CONTRACT_DEFS: Readonly<Record<ContractDefId, ContractDef>> = Object.fromEntries(
  CONTRACTS_M1.map((d) => [d.id, d]),
) as Record<ContractDefId, ContractDef>;
