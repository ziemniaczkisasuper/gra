// Expedition loop state. Lives beside GameState (WeakMap) so the engine save snapshot
// stays untouched. Unlocked lift stops default to [1] (mechaniki §2.9).
import type { GameState } from '../core/game';
import type { InventoryChanged } from '../inventory/types';
import type { ZoneDepth } from './timing';

export interface Cell {
  x: number;
  y: number;
}

export type DescentKind = 'stairs' | 'gate';

export interface DescentConfirm {
  kind: DescentKind;
  textId: 'M1_RISK_01' | 'M1_RISK_01B';
  yesId: 'M1_RISK_01_YES' | 'M1_RISK_01B_YES';
  noId: 'M1_RISK_01_NO';
  /** Keyboard focus. Opens on STAY (QA: no shortcut that confirms GO). */
  focus: 'stay' | 'go';
  atRisk: number;
  hp: number;
  maxHp: number;
  patches: number;
}

export type LiftPhase = 'idle' | 'picker' | 'ride';
export type EvacPhase = 'idle' | 'calling' | 'arriving' | 'open' | 'cabin' | 'ride' | 'cooldown';

export type CallInterrupt = 'move' | 'attack' | 'skill' | 'release';

export interface ExpeditionHud {
  textId: 'M1_UI_LIFT_COMING' | 'M1_UI_LIFT_HERE';
  /** Whole seconds, rounded up (ui-m1 §11.7). */
  seconds: number;
}

/** Bus events the main loop forwards. Shapes match core/events.ts. */
export type ExpeditionEvent =
  | { type: 'levelStart'; cell: Cell }
  | { type: 'cooldownEnd'; cell: Cell }
  | { type: 'evacCallStart'; cell: Cell }
  | { type: 'evacCallInterrupted'; cell: Cell }
  | { type: 'evacCallDone'; cell: Cell; depth: ZoneDepth }
  | { type: 'liftArrived'; cell: Cell; alertedIds: readonly number[] }
  | { type: 'playerEvacuated'; cell: Cell }
  | { type: 'liftDeparted'; cell: Cell }
  | { type: 'inventory:changed'; payload: InventoryChanged };

export interface ExpeditionState {
  /** False until a lift ride or `armExpedition`. M0 maps stay inert. */
  active: boolean;
  /** Unlocked service-lift stops. A new game has only depth 1. */
  stops: ZoneDepth[];
  depth: ZoneDepth;
  expSeed: number;
  nonce: number;
  inArena: boolean;
  /** LD `X` on the arena, remembered after it is drawn as a wall. */
  hiddenShaft: Cell | null;
  arenaShaftOpen: boolean;
  shafts: Cell[];
  /** Player entry of the installed floor (generator W, rendered `@`). */
  entry: Cell | null;
  /** Rows last parsed into `state.map` (so the arena shaft can be opened). */
  rows: string[] | null;
  /** Confirm window: zone tick is frozen and inputs were cleared. */
  worldPaused: boolean;
  pauseRequested: boolean;
  inputsCleared: boolean;
  confirm: DescentConfirm | null;
  /** After STAY, the window stays shut until the player leaves the tile or presses USE. */
  descentLatch: boolean;
  latchX: number;
  latchY: number;
  /**
   * Enemies inside the arrival alarm (BFS radius 12). combat.ts has no exported
   * "wake and walk to the shaft", so this list is the alarm result the test asserts.
   * The same ids go out on `liftArrived` for the FX alert. AI is not forked.
   */
  alarmIds: number[];
  /** Text ids currently up, in show order (M1_BASE_06 before M1_SYS_05). */
  notices: string[];
  hud: ExpeditionHud | null;
  /** M1_BASE_05 while the cabin rides back to base. */
  rideTextId: 'M1_BASE_05' | null;
  lift: {
    phase: LiftPhase;
    toZone: boolean;
    focus: ZoneDepth;
    ms: number;
    destination: ZoneDepth;
  };
  evac: {
    phase: EvacPhase;
    msLeft: number;
    holdMs: number;
    rideMs: number;
    shaft: Cell | null;
    lastInterrupt: CallInterrupt | null;
  };
  prevUse: boolean;
  pending: ExpeditionEvent[];
}

export function freshExpedition(): ExpeditionState {
  return {
    active: false,
    stops: [1],
    depth: 1,
    expSeed: 0,
    nonce: 0,
    inArena: false,
    hiddenShaft: null,
    arenaShaftOpen: false,
    shafts: [],
    entry: null,
    rows: null,
    worldPaused: false,
    pauseRequested: false,
    inputsCleared: false,
    confirm: null,
    descentLatch: false,
    latchX: -1,
    latchY: -1,
    alarmIds: [],
    notices: [],
    hud: null,
    rideTextId: null,
    lift: { phase: 'idle', toZone: false, focus: 1, ms: 0, destination: 1 },
    evac: {
      phase: 'idle',
      msLeft: 0,
      holdMs: 0,
      rideMs: 0,
      shaft: null,
      lastInterrupt: null,
    },
    prevUse: false,
    pending: [],
  };
}

const byState = new WeakMap<GameState, ExpeditionState>();

export function peekExpedition(state: GameState): ExpeditionState | undefined {
  return byState.get(state);
}

export function getExpedition(state: GameState): ExpeditionState {
  let ex = byState.get(state);
  if (!ex) {
    ex = freshExpedition();
    byState.set(state, ex);
  }
  return ex;
}
