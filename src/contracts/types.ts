import type {
  ContractDefId,
  ContractReward,
  ContractTextParams,
  Depth,
} from '../data/contracts-m1';

export type {
  ContractDefId,
  ContractReward,
  ContractTextParams,
  Depth,
} from '../data/contracts-m1';

/** Board-unique contract instance id (also tags contract enemies / the Data Core in the level). */
export type ContractId = number;

/** Per-run progress of one contract. Reset on evacuation (not met) and on death. */
export type ContractProgress =
  | {
      kind: 'solveTerminal';
      met: boolean;
      /** Variant solved in this run (null until solved). */
      variant: string | null;
      /** This completion carries the grid fragment (first solve of the variant, not a retune). */
      fragment: boolean;
    }
  | { kind: 'recoverItem'; met: boolean }
  | { kind: 'killContractEnemies'; met: boolean; killed: number; required: number };

export interface ContractInstance {
  id: ContractId;
  defId: ContractDefId;
  depth: Depth;
  /** Restore Relay rolled after all variants of its depth were solved (LD §3, confirmed). */
  retune: boolean;
  progress: ContractProgress;
}

/** Exchange slot placeholder – Exchange contracts (M1_CONTR_04/05) are not implemented yet. */
export type ExchangeSlot = null;

export interface ContractsState {
  /** Next id to hand out (monotonic, saved). */
  nextId: ContractId;
  /** CONTRACT_SLOTS_BASE slots; null = empty, filled by refillBoard() back at base. */
  base: (ContractInstance | null)[];
  /** CONTRACT_SLOTS_EXCHANGE slots, always null for now. */
  exchange: ExchangeSlot[];
  /** Variants whose grid fragment was already paid out through a contract (guard against doubles). */
  creditedVariants: string[];
}

/** Read-only world facts the board needs when rolling (owned by other systems). */
export interface BoardContext {
  /** Depths with an unlocked lift stop (2.9). Depth 1 is always allowed, listed or not. */
  unlockedStops: readonly Depth[];
  /** Permanently solved Power Lines variants (by variant id, 2.15). */
  solvedVariants: readonly string[];
}

/**
 * Input events fed by gameplay systems (not on the bus yet – wired by Engine when those
 * systems exist). `contractId` refers to ContractInstance.id that the level generator used
 * to tag the spawned Data Core / contract enemies (see contractSpawns()).
 */
export type ContractInputEvent =
  /** firstSolve = the variant had never been solved before (terminal system knows). */
  | { type: 'terminalSolved'; depth: Depth; variant: string; firstSolve: boolean }
  | { type: 'itemPicked'; itemId: string; contractId?: ContractId }
  /** Item left the bag without death (dropped, sold, destroyed). */
  | { type: 'itemLost'; itemId: string; contractId?: ContractId }
  | { type: 'contractEnemyKilled'; contractId: ContractId }
  /** Player entered the lift (2.9) – BASE contracts settle here. */
  | { type: 'evacuated' }
  | { type: 'died' };

/** Events emitted by the module (added to GameEvents in core/events.ts with the 'contract:' prefix). */
export interface ContractEvents {
  /** New contract placed on the board (text M1_BASE_10). */
  'contract:offered': {
    contractId: ContractId;
    defId: ContractDefId;
    depth: Depth;
    retune: boolean;
    /** Text id + params for the `{depth}` token (texts are not this module's job). */
    textId: ContractDefId;
    textParams: ContractTextParams;
  };
  /** Kill counter changed (HUD). */
  'contract:progress': { contractId: ContractId; current: number; required: number };
  /** Objective done – contract still needs evacuation. */
  'contract:objectiveMet': { contractId: ContractId; defId: ContractDefId };
  /** Objective undone (Data Core left the bag). */
  'contract:objectiveLost': { contractId: ContractId; defId: ContractDefId };
  /** Settled on evacuation; the caller pays the reward (text M1_CONTR_DONE). */
  'contract:completed': {
    contractId: ContractId;
    defId: ContractDefId;
    depth: Depth;
    reward: ContractReward;
    /** Variant whose grid fragment this completion reports (null = none). */
    gridFragmentVariant: string | null;
    gridFragmentPct: number;
  };
  /** Death: progress lost, contract stays on the board (no penalty, 2.4). */
  'contract:failed': {
    contractId: ContractId;
    defId: ContractDefId;
    depth: Depth;
    reason: 'died';
    /** Any progress was made in this run (UI can show only these in the session summary). */
    hadProgress: boolean;
  };
}

export type ContractOutputEvent = {
  [K in keyof ContractEvents]: { type: K; payload: ContractEvents[K] };
}[keyof ContractEvents];

export interface ContractResult {
  state: ContractsState;
  events: ContractOutputEvent[];
}

/** Save section (pure JSON). Owned by this module; schema/migration of the whole save – Engine. */
export interface ContractsSave {
  v: 1;
  nextId: number;
  base: (ContractInstance | null)[];
  exchange: null[];
  creditedVariants: string[];
}
