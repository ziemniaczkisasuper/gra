import { M0, msToTicks } from '../data/mechanics-m0';

/** Abstract player actions. Game logic reads only these – never raw input events. */
export interface ActionState {
  /** Movement vector, each axis in [-1, 1], length <= 1. Logic quantises it to 8 directions. */
  move: { x: number; y: number };
  attack: boolean;
  skill1: boolean;
  skill2: boolean;
  skill3: boolean;
  /** M1 USE (E / touch USE): interact with the faced / adjacent cell; held = hold interactions. */
  use: boolean;
  /** M1 heal (Q / touch [+]): Med-Patch. */
  heal: boolean;
  /**
   * Aim direction, independent of movement (twin-stick): arrows > mouse / aim stick.
   * null = not aiming. What it does in combat is Gameplay's.
   */
  aim: Dir8 | null;
  /** Edge only: true in the one step after Esc/P/|| was pressed. */
  pause: boolean;
  /**
   * The move comes from digital keys (keyboard) – enables the DIAG_GRACE upgrade of a straight
   * step to a diagonal (mechaniki §1.2 v0.5, QA-M0-002). Joystick / touch: false.
   */
  digitalMove?: boolean;
  /** The aim comes from digital keys (arrows) – wins over mouse / stick aim. */
  digitalAim?: boolean;
}

export type ButtonAction = 'attack' | 'skill1' | 'skill2' | 'skill3' | 'use' | 'heal' | 'pause';
export const BUTTON_ACTIONS: readonly ButtonAction[] = [
  'attack',
  'skill1',
  'skill2',
  'skill3',
  'use',
  'heal',
  'pause',
];
/** Buttons that get the short-tap buffer (pause does not – it would toggle twice). */
const BUFFERED: readonly ButtonAction[] = ['attack', 'skill1', 'skill2', 'skill3', 'use', 'heal'];

/**
 * An input device adapter (keyboard, touch, gamepad...). Called once per simulation step.
 * poll(): state since the previous poll. A button must be true if it is held OR was pressed
 *   at any time since the last poll (latched), so taps shorter than a tick are never lost.
 *   `pause` is an edge (pressed since last poll), never "held".
 * reset(): release everything (pause, resume, focus loss). Keys still physically held must
 *   stay inactive until released and pressed again.
 */
export interface InputSource {
  poll(): Partial<ActionState>;
  reset(): void;
}

export interface Dir8 {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
}

// Sector 0 = east, counter-clockwise in screen coords (y down) → index by atan2.
const DIRS: readonly Dir8[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

/** Quantise a move vector to one of 8 directions (or null inside the dead zone). */
export function toDir8(
  move: { x: number; y: number },
  deadZone: number = M0.MOVE_DEADZONE,
): Dir8 | null {
  if (Math.hypot(move.x, move.y) < deadZone) return null;
  const sector = Math.round(Math.atan2(move.y, move.x) / (Math.PI / 4));
  return DIRS[((sector % 8) + 8) % 8]!;
}

export function emptyActions(): ActionState {
  return {
    move: { x: 0, y: 0 },
    attack: false,
    skill1: false,
    skill2: false,
    skill3: false,
    use: false,
    heal: false,
    aim: null,
    pause: false,
  };
}

const clamp1 = (v: number) => (v > 1 ? 1 : v < -1 ? -1 : v);

/**
 * Merges all sources into one snapshot per simulation step (call sample() at the start of
 * each step). Adds the short-tap buffer (INPUT_TAP_BUFFER_MS = 2 ticks): a fresh press stays
 * true for at least 2 steps. Tracks fresh presses (`pressed`) and inactivity (`idleMs`).
 */
export class InputManager {
  private sources: InputSource[] = [];
  private prevRaw = new Set<ButtonAction>();
  private buffer = new Map<ButtonAction, number>();
  private idleSteps = 0;
  /** Buttons whose press started in the last sample (for tap vs hold in Gameplay). */
  pressed: ReadonlySet<ButtonAction> = new Set();

  constructor(
    readonly tapBufferSteps: number = msToTicks(M0.INPUT_TAP_BUFFER_MS),
    readonly stepMs: number = M0.TICK_MS,
    readonly diagGraceSteps: number = msToTicks(M0.DIAG_GRACE_MS),
  ) {}

  add(source: InputSource): () => void {
    this.sources.push(source);
    return () => this.remove(source);
  }

  remove(source: InputSource): void {
    this.sources = this.sources.filter((s) => s !== source);
  }

  /** Time since the last input of any kind (held key, touch, press). */
  get idleMs(): number {
    return this.idleSteps * this.stepMs;
  }

  /** Let UI report activity that does not go through sources (e.g. tapping DOM buttons). */
  markActivity(): void {
    this.idleSteps = 0;
  }

  private pendingButtons = new Set<ButtonAction>();
  private pendingMove: { x: number; y: number } | null = null;

  private aimHold: { dir: Dir8; left: number } | null = null;
  private lastAim: Dir8 | null = null;

  private pollAll(): { move: { x: number; y: number }; raw: Set<ButtonAction>; digital: boolean } {
    const move = { x: 0, y: 0 };
    const raw = new Set<ButtonAction>();
    let digital = false;
    let keyAim: Dir8 | null = null;
    let otherAim: Dir8 | null = null;
    for (const src of this.sources) {
      const p = src.poll();
      if (p.aim) {
        if (p.digitalAim) keyAim ??= p.aim;
        else otherAim ??= p.aim;
      }
      if (p.move) {
        move.x += p.move.x;
        move.y += p.move.y;
        if (p.digitalMove && (p.move.x !== 0 || p.move.y !== 0)) digital = true;
      }
      for (const a of BUTTON_ACTIONS) if (p[a]) raw.add(a);
    }
    this.polledAim = keyAim
      ? { dir: keyAim, digital: true }
      : otherAim
        ? { dir: otherAim, digital: false }
        : null;
    return { move, raw, digital };
  }

  private polledAim: { dir: Dir8; digital: boolean } | null = null;

  /**
   * DIAG_GRACE for arrow aim (mechaniki §1.2 v0.5 analogue): the aim starts at once and turns
   * diagonal as soon as the second key is down; when one key of a diagonal is released, the
   * diagonal is kept for DIAG_GRACE ticks, so letting go of both keys never flips to straight.
   */
  private aimOf(p: { dir: Dir8; digital: boolean } | null): Dir8 | null {
    const prev = this.lastAim;
    const out: Dir8 | null = p?.dir ?? null;
    if (
      p?.digital &&
      prev &&
      prev.x !== 0 &&
      prev.y !== 0 &&
      out &&
      (out.x === 0) !== (out.y === 0)
    ) {
      const sub = (out.x === prev.x && out.y === 0) || (out.y === prev.y && out.x === 0);
      if (sub) {
        if (!this.aimHold) this.aimHold = { dir: prev, left: this.diagGraceSteps };
        if (this.aimHold.left > 0) {
          this.aimHold.left--;
          return prev; // lastAim stays the diagonal
        }
      }
    }
    this.aimHold = null;
    this.lastAim = out;
    return out;
  }

  /**
   * Read input during the resume countdown without feeding the simulation: presses and
   * directions seen now are kept and applied in the first sample() after the countdown
   * (mechaniki 1.11). Returns true if pause was pressed (caller pauses = cancels countdown).
   */
  collect(): boolean {
    const { move, raw } = this.pollAll();
    for (const a of raw) if (a !== 'pause') this.pendingButtons.add(a);
    if (move.x !== 0 || move.y !== 0) this.pendingMove = move;
    if (raw.size > 0 || move.x !== 0 || move.y !== 0) this.idleSteps = 0;
    return raw.has('pause');
  }

  sample(): ActionState {
    const out = emptyActions();
    const polled = this.pollAll();
    const raw = polled.raw;
    out.move = polled.move;
    if (polled.digital) out.digitalMove = true;
    if (out.move.x === 0 && out.move.y === 0 && this.pendingMove) out.move = this.pendingMove;
    for (const a of this.pendingButtons) raw.add(a);
    this.pendingButtons.clear();
    this.pendingMove = null;
    let { x, y } = out.move;
    x = clamp1(x);
    y = clamp1(y);
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    out.move = { x, y };

    const pressed = new Set<ButtonAction>();
    for (const a of raw) if (!this.prevRaw.has(a) || a === 'pause') pressed.add(a);
    for (const a of BUFFERED) {
      if (pressed.has(a)) this.buffer.set(a, this.tapBufferSteps);
      const left = this.buffer.get(a) ?? 0;
      out[a] = raw.has(a) || left > 0;
      if (left > 0) this.buffer.set(a, left - 1);
    }
    out.pause = raw.has('pause');
    out.aim = this.aimOf(this.polledAim);
    if (out.aim && this.polledAim?.digital) out.digitalAim = true;
    this.prevRaw = raw;
    this.pressed = pressed;

    if (raw.size > 0 || x !== 0 || y !== 0 || out.aim) this.idleSteps = 0;
    else this.idleSteps++;
    return out;
  }

  reset(): void {
    for (const s of this.sources) s.reset();
    this.prevRaw.clear();
    this.buffer.clear();
    this.pendingButtons.clear();
    this.pendingMove = null;
    this.pressed = new Set();
    this.idleSteps = 0;
    this.polledAim = null;
    this.lastAim = null;
    this.aimHold = null;
  }
}
