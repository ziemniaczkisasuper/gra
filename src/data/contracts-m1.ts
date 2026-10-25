// BASE contracts M1 – data only (no logic). Source: design/mechaniki-m1.md v0.4, §2.4 (table
// M1_CONTR_01..03), §2.9 (lift stops), §2.15 (grid fragments, terminal variants), §2.16
// (CONTRACT_SLOTS, REWARD_*, RETUNE_*, CLEARPATH_ENEMY_DIST, DATACORE_DIST); design/level-design-m1.md
// §1 and §3; fabula/zakres-m1.md §7. Rewards, weights, CONTRACT_ENEMY_LOOT and Clear the Path at
// depth 3: design/balans-m1.md v1.1 §5 (Balance; CtP depth 3 approved by GD). The kr/min rule is
// measured base → base: CONTRACT_KRPM_CAP = 20 / 48 / 90 kr/min (depth 1/2/3).

/** Zone depth in Sector 1 (1 Outskirts, 2 Solar Fields, 3 Rail Depot). */
export type Depth = 1 | 2 | 3;
export const DEPTHS: readonly Depth[] = [1, 2, 3];

/** CONTRACT_KRPM_CAP measured base → base (balans-m1.md v1.1 §5) – reference for tests/QA. */
export const CONTRACT_KRPM_CAP: Readonly<Record<Depth, number>> = { 1: 20, 2: 48, 3: 90 };

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

/**
 * CONTRACT_ENEMY_LOOT = 0 (design/balans-m1.md §5, final): contract enemies – Clear the Path
 * targets AND Data Core guards (mechaniki §2.4: both are "wrogowie kontraktu") – drop no Scrap and
 * no items. Multiplier for the loot system (0 = nothing). Exposed per spawn in contractSpawns().
 */
export const CONTRACT_ENEMY_LOOT = 0;

/** Item id of the Data Core `§` (1 bag slot, lost on death). Id to be aligned with the loot table. */
export const DATA_CORE_ITEM_ID = 'M1_ITEM_DATA_CORE';

/** Parameters for the contract texts (token `{depth}` in M1_CONTR_01/02/03). */
export interface ContractTextParams {
  depth: Depth;
}

export interface ContractReward {
  credits: number;
  copper: number;
  medPatches: number;
}

export type ContractObjective =
  /** Solve this level's Power Lines terminal (TERMINAL_DIST_FROM_SHAFT 25–40, from LD). */
  | { type: 'solveTerminal' }
  /** Pick up the contract item (placed distFromShaft away, guarded by `guards` contract enemies). */
  | {
      type: 'recoverItem';
      itemId: string;
      distFromShaft: [number, number];
      guards: number;
      /** Guard composition as glyph strings (LD §10 / balans v1.2), e.g. ['ddh']. */
      guardGroups: readonly string[];
    }
  /** Kill `count` contract enemies placed distFromShaft away from the shaft. */
  | {
      type: 'killContractEnemies';
      count: number;
      distFromShaft: [number, number];
      /**
       * CONTRACT_CLEARPATH_GROUPS: enemy groups by depth as glyph strings (s Scrapper, d Panel
       * Drone, h Curfew Guard, t Line Sentry), depth multipliers apply. Missing depth = the
       * generator picks the composition (not specified by Balance).
       */
      groups: Partial<Record<Depth, readonly string[]>>;
    };

export type ContractDefId = 'M1_CONTR_01' | 'M1_CONTR_02' | 'M1_CONTR_03';

export interface ContractDef {
  id: ContractDefId;
  /**
   * Text id in fabula/teksty-m1-en.md (title + one-line background). The only token is `{depth}`
   * (1–3), filled from ContractTextParams – texts themselves live with Dialogue/UI code.
   */
  textId: ContractDefId;
  issuer: 'BASE';
  objective: ContractObjective;
  /** Depths the contract can be rolled for (further limited to unlocked lift stops). */
  depths: readonly Depth[];
  /** Reward by depth (only depths listed in `depths`). */
  reward: Partial<Record<Depth, ContractReward>>;
  /**
   * Pool weight per (contract, depth) (R, Balance decision): each entry of the pool uses its own
   * depth's weight, NOT divided among depths. Final values: design/balans-m1.md.
   */
  weight: Partial<Record<Depth, number>>;
  /**
   * Restore Relay only: once all variants of THAT depth are solved the contract becomes a
   * "retune" (LD §3; confirmed by Mechanics): own reward, no grid fragment, weight × weightMult.
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
    // REWARD_RELAY: 35 kr (balans v1.1; was 40) + grid fragment on the first solve of the variant
    // (see progress.ts). 40 kr gave 21 kr/min > 20 at depth 1.
    reward: { 1: r(35), 2: r(35), 3: r(35) },
    weight: { 1: 1, 2: 1, 3: 1 },
    // RETUNE_REWARD = 25 kr + 2 Copper (balans v1.1; was 30), no fragment;
    // RETUNE_WEIGHT = 0.5 × Relay weight of the depth.
    retune: { reward: r(25, 2), weightMult: 0.5 },
    expectedMs: [118_000, 209_000], // session base → base, median (depth 1) .. p80 (depth 3)
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
      guardGroups: ['ddh'], // balans v1.2 / LD §10
    },
    depths: [2],
    reward: { 2: r(40, 3) }, // REWARD_DATACORE: 40 kr + 3 Copper
    // Depth-2 weight 2 (balans-m1.md §5.1, question 5 – approved by GD): more reliable Copper.
    weight: { 2: 2 },
    expectedMs: [128_000, 180_000], // session base → base, median .. p80
  },
  {
    id: 'M1_CONTR_03',
    textId: 'M1_CONTR_03',
    issuer: 'BASE',
    objective: {
      type: 'killContractEnemies',
      count: 6,
      distFromShaft: [12, 20], // CLEARPATH_ENEMY_DIST
      // balans v1.2 / LD §10: g1 and g3 = sss + ddh, g2 = sss + dht
      groups: { 1: ['sss', 'ddh'], 2: ['sss', 'dht'], 3: ['sss', 'ddh'] },
    },
    depths: [1, 2, 3],
    // REWARD_CLEARPATH: 1 Med-Patch / 25 kr + 1 Med-Patch / 40 kr + 1 Med-Patch (depth 1/2/3)
    reward: { 1: r(0, 0, 1), 2: r(25, 0, 1), 3: r(40, 0, 1) },
    weight: { 1: 1, 2: 1, 3: 1 },
    expectedMs: [108_000, 180_000], // session base → base, median (depth 1) .. p80 (depth 3)
  },
];

export const CONTRACT_DEFS: Readonly<Record<ContractDefId, ContractDef>> = Object.fromEntries(
  CONTRACTS_M1.map((d) => [d.id, d]),
) as Record<ContractDefId, ContractDef>;
