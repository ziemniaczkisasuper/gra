// Pure prologue hint machine (mechaniki §2.19, steps T01–T10). No DOM.
// Hints off: the bar stays empty and T04 does not freeze. Passes still record.
import type { GameState } from '../core/game';
import { hintsEnabled } from '../ui/settings';
import { TUT_COPY } from './copy';

export type HintStep =
  'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08' | 'T09' | 'T10';

export interface HintState {
  hintsOn: boolean;
  /** New game wants the prologue floor. The integrator reads this once. */
  prologue: boolean;
  /** `requestPrologue` already asked the generator flag. */
  prologueAsked: boolean;
  passed: HintStep[];
  inBase: boolean;
  inZone: boolean;
  walkSteps: number;
  idleMs: number;
  adjacentMs: number;
  killedScrapper: boolean;
  telegraph: boolean;
  dodges: number;
  lowHp: boolean;
  usedPatch: boolean;
  crowded: boolean;
  dashed: boolean;
  pickedUp: boolean;
  bagAlmostFull: boolean;
  nearTerminal: boolean;
  terminalSolved: boolean;
  nearShaft: boolean;
  evacInterrupted: boolean;
  bar: string | null;
  /** T04 is the only step that freezes the world, and only while hints are on. */
  freeze: boolean;
}

export type HintEvent =
  | { type: 'setHints'; on: boolean }
  | { type: 'baseTick' }
  | { type: 'choseLift' }
  | { type: 'enterZone' }
  | { type: 'walk' }
  | { type: 'idle'; ms: number }
  | { type: 'enemyAdjacent'; ms: number }
  | { type: 'killed'; kind: string }
  | { type: 'telegraph' }
  | { type: 'dodged' }
  | { type: 'lowHp' }
  | { type: 'usedPatch' }
  | { type: 'crowded' }
  | { type: 'dashed' }
  | { type: 'pickedUp' }
  | { type: 'bagAlmostFull' }
  | { type: 'nearTerminal' }
  | { type: 'terminalSolved' }
  | { type: 'nearShaft' }
  | { type: 'evacInterrupted' }
  | { type: 'evacuated' };

const STEPS: readonly HintStep[] = [
  'T01',
  'T02',
  'T03',
  'T04',
  'T05',
  'T06',
  'T07',
  'T08',
  'T09',
  'T10',
];

function isStep(id: string): id is HintStep {
  return (STEPS as readonly string[]).includes(id);
}

export function createHintState(opts: { hintsOn?: boolean; prologue?: boolean } = {}): HintState {
  return {
    hintsOn: opts.hintsOn ?? true,
    prologue: opts.prologue ?? true,
    prologueAsked: false,
    passed: [],
    inBase: false,
    inZone: false,
    walkSteps: 0,
    idleMs: 0,
    adjacentMs: 0,
    killedScrapper: false,
    telegraph: false,
    dodges: 0,
    lowHp: false,
    usedPatch: false,
    crowded: false,
    dashed: false,
    pickedUp: false,
    bagAlmostFull: false,
    nearTerminal: false,
    terminalSolved: false,
    nearShaft: false,
    evacInterrupted: false,
    bar: null,
    freeze: false,
  };
}

/** The first zone of a new game asks `generateLevel({ prologue: true })` once. */
export function requestPrologue(state: HintState): HintState {
  if (state.prologueAsked || !state.prologue) return state;
  return { ...state, prologueAsked: true };
}

function pass(state: HintState, step: HintStep): HintState {
  if (state.passed.includes(step)) return state;
  return { ...state, passed: [...state.passed, step] };
}

function paint(state: HintState): HintState {
  if (!state.hintsOn) return { ...state, bar: null, freeze: false };
  const done = (step: HintStep) => state.passed.includes(step);
  if (state.inBase && !done('T02')) return { ...state, bar: TUT_COPY.M1_TUT_02K, freeze: false };
  if (state.inZone && !done('T01') && state.idleMs >= 4000 && state.walkSteps < 3) {
    return { ...state, bar: TUT_COPY.M1_TUT_01K, freeze: false };
  }
  if (done('T01') && !done('T03') && state.adjacentMs >= 6000 && !state.killedScrapper) {
    return { ...state, bar: TUT_COPY.M1_TUT_03K, freeze: false };
  }
  if (done('T03') && !done('T04') && state.telegraph && state.dodges < 2) {
    return { ...state, bar: TUT_COPY.M1_TUT_04, freeze: true };
  }
  if (done('T04') && !done('T05') && state.lowHp && !state.usedPatch) {
    return { ...state, bar: TUT_COPY.M1_TUT_05K, freeze: false };
  }
  if (done('T05') && !done('T06') && state.crowded && !state.dashed) {
    return { ...state, bar: TUT_COPY.M1_TUT_06K, freeze: false };
  }
  if (done('T06') && !done('T07') && state.pickedUp) {
    return { ...state, bar: TUT_COPY.M1_TUT_07, freeze: false };
  }
  if (done('T07') && !done('T08') && state.bagAlmostFull) {
    return { ...state, bar: TUT_COPY.M1_TUT_08, freeze: false };
  }
  if ((done('T07') || done('T08')) && !done('T09') && state.nearTerminal && !state.terminalSolved) {
    return { ...state, bar: TUT_COPY.M1_TUT_09K, freeze: false };
  }
  if (done('T09') && !done('T10') && state.terminalSolved) {
    return { ...state, bar: TUT_COPY.M1_TUT_11, freeze: false };
  }
  if (done('T10') && state.nearShaft && state.evacInterrupted) {
    return { ...state, bar: TUT_COPY.M1_TUT_13, freeze: false };
  }
  if (done('T10') && state.nearShaft) {
    return { ...state, bar: TUT_COPY.M1_TUT_12K, freeze: false };
  }
  return { ...state, bar: null, freeze: false };
}

/** One hint event. Counters update, then the earliest armed line is chosen. */
export function reduceHint(state: HintState, event: HintEvent): HintState {
  let next: HintState = { ...state, passed: state.passed };
  switch (event.type) {
    case 'setHints':
      next = { ...next, hintsOn: event.on };
      break;
    case 'baseTick':
      next = { ...next, inBase: true };
      break;
    case 'choseLift':
      next = pass({ ...next, inBase: false }, 'T02');
      break;
    case 'enterZone':
      next = pass({ ...next, inBase: false, inZone: true }, 'T02');
      break;
    case 'walk':
      next = { ...next, walkSteps: next.walkSteps + 1, idleMs: 0 };
      if (next.walkSteps >= 3) next = pass(next, 'T01');
      break;
    case 'idle':
      next = { ...next, idleMs: next.idleMs + Math.max(0, event.ms) };
      break;
    case 'enemyAdjacent':
      next = { ...next, adjacentMs: next.adjacentMs + Math.max(0, event.ms) };
      break;
    case 'killed':
      if (event.kind === 'scrapper') next = pass({ ...next, killedScrapper: true }, 'T03');
      break;
    case 'telegraph':
      next = { ...next, telegraph: true };
      break;
    case 'dodged':
      next = { ...next, dodges: next.dodges + 1 };
      if (next.dodges >= 2) next = pass(next, 'T04');
      break;
    case 'lowHp':
      next = { ...next, lowHp: true };
      break;
    case 'usedPatch':
      next = pass({ ...next, usedPatch: true }, 'T05');
      break;
    case 'crowded':
      next = { ...next, crowded: true };
      break;
    case 'dashed':
      next = pass({ ...next, dashed: true }, 'T06');
      break;
    case 'pickedUp':
      next = { ...next, pickedUp: true };
      break;
    case 'bagAlmostFull':
      next = { ...next, bagAlmostFull: true };
      break;
    case 'nearTerminal':
      next = pass({ ...next, nearTerminal: true }, 'T07');
      if (next.bagAlmostFull) next = pass(next, 'T08');
      break;
    case 'terminalSolved':
      next = pass({ ...next, terminalSolved: true }, 'T09');
      break;
    case 'nearShaft':
      next = { ...next, nearShaft: true };
      break;
    case 'evacInterrupted':
      next = { ...next, evacInterrupted: true };
      break;
    case 'evacuated':
      next = pass(next, 'T10');
      break;
    default:
      break;
  }
  return paint(next);
}

const byState = new WeakMap<GameState, HintState>();

function storedSteps(state: GameState): HintStep[] {
  const raw = state.sections.progress;
  if (!raw || typeof raw !== 'object') return [];
  const tutSeen = (raw as { tutSeen?: unknown }).tutSeen;
  if (!Array.isArray(tutSeen)) return [];
  const out: HintStep[] = [];
  for (const id of tutSeen)
    if (typeof id === 'string' && isStep(id) && !out.includes(id)) out.push(id);
  return out;
}

export function hintStateOf(state: GameState): HintState {
  let hint = byState.get(state);
  if (!hint) {
    hint = createHintState({ hintsOn: hintsEnabled(), prologue: false });
    hint.passed = storedSteps(state);
    hint = paint(hint);
    byState.set(state, hint);
  }
  return hint;
}

export function pushHint(state: GameState, event: HintEvent): HintState {
  const next = reduceHint(hintStateOf(state), event);
  byState.set(state, next);
  const raw = state.sections.progress;
  if (raw && typeof raw === 'object' && 'tutSeen' in raw) {
    const progress = raw as { tutSeen: string[] };
    if (Array.isArray(progress.tutSeen)) progress.tutSeen = [...next.passed];
  }
  return next;
}

export function hintBarText(state: GameState): string | null {
  return hintStateOf(state).bar;
}

export function hintFreezes(state: GameState): boolean {
  return hintStateOf(state).freeze;
}
