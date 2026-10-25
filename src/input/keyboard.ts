import { M0 } from '../data/mechanics-m0';
import type { ActionState, ButtonAction, InputSource } from './actions';

type DirKey = 'up' | 'down' | 'left' | 'right';
type AimKey = 'aimUp' | 'aimDown' | 'aimLeft' | 'aimRight';
export type KeyBinding = ButtonAction | DirKey | AimKey;

/** Default bindings by KeyboardEvent.code (physical key – works with any layout). */
export const DEFAULT_BINDINGS: Readonly<Record<string, KeyBinding>> = {
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  // Twin-stick aim (arrows were movement until M1: movement stays on WASD only).
  ArrowUp: 'aimUp',
  ArrowDown: 'aimDown',
  ArrowLeft: 'aimLeft',
  ArrowRight: 'aimRight',
  Space: 'attack',
  KeyJ: 'attack',
  Digit1: 'skill1',
  Digit2: 'skill2',
  Digit3: 'skill3',
  // M1 (sterowanie.md §3, ui-m1 S-T4): E = USE, Q = Med-Patch. Alternative skill keys below.
  KeyE: 'use',
  KeyQ: 'heal',
  KeyK: 'skill1',
  KeyL: 'skill2',
  Semicolon: 'skill3',
  Escape: 'pause',
  KeyP: 'pause',
};

export interface KeyEventLike {
  code: string;
  repeat?: boolean;
  target?: unknown;
  preventDefault?: () => void;
}

/** Minimal event target so the source is testable without a DOM. */
export interface KeyTarget {
  addEventListener(type: 'keydown' | 'keyup', fn: (e: KeyEventLike) => void): void;
  removeEventListener(type: 'keydown' | 'keyup', fn: (e: KeyEventLike) => void): void;
}

/** Something that fires 'blur' (window): focus loss releases every key (sterowanie.md §3). */
export interface BlurTarget {
  addEventListener(type: 'blur', fn: () => void): void;
  removeEventListener(type: 'blur', fn: () => void): void;
}

/** Keys that open the pause menu / resume from it (through `pause`). Space never pauses. */
export const PAUSE_CODES: readonly string[] = Object.keys(DEFAULT_BINDINGS).filter(
  (c) => DEFAULT_BINDINGS[c] === 'pause',
);

function isEditable(t: unknown): boolean {
  const tag = (t as { tagName?: string } | null)?.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
}

/**
 * Keyboard source (PROG / UI i Menu; started as the engine placeholder).
 * - Bindings by KeyboardEvent.code (physical position: QWERTY/AZERTY/QWERTZ/Polish alike).
 * - Window blur (optional `blurTarget`) releases everything, like reset().
 * - Held state from keydown/keyup, presses latched until the next poll (taps never lost).
 * - Auto-repeat keydowns are ignored, so a key still held after reset() stays inactive
 *   until released and pressed again (no instant move/attack after RESUME).
 * - DIAG_GRACE (mechaniki 1.2 v0.5, QA-M0-002): NO waiting here any more – a straight step
 *   starts at once; the engine (entities/player-move.ts) turns it into a diagonal if the
 *   perpendicular key comes within DIAG_GRACE. The source only flags `digitalMove`.
 */
export class KeyboardSource implements InputSource {
  private held = new Set<string>();
  private latched = new Set<string>();
  /** Keys consumed by the UI (closed a text window / resumed the menu): dead until keyup. */
  private blocked = new Set<string>();
  /** Press order (QA-M0-009): per axis the most recently pressed key wins. */
  private pressSeq = new Map<string, number>();
  private seq = 0;

  constructor(
    private readonly target: KeyTarget,
    private readonly bindings: Readonly<Record<string, KeyBinding>> = DEFAULT_BINDINGS,
    /** Unused since v0.5 (grace moved to the engine); kept for the constructor signature. */
    _diagGraceMs: number = M0.DIAG_GRACE_MS,
    private readonly blurTarget?: BlurTarget,
  ) {
    target.addEventListener('keydown', this.onDown);
    target.addEventListener('keyup', this.onUp);
    blurTarget?.addEventListener('blur', this.onBlur);
  }

  dispose(): void {
    this.target.removeEventListener('keydown', this.onDown);
    this.target.removeEventListener('keyup', this.onUp);
    this.blurTarget?.removeEventListener('blur', this.onBlur);
  }

  private onBlur = (): void => {
    this.blocked.clear(); // keyups may never arrive after focus loss
    this.reset();
  };

  /**
   * Ignore `code` until it is released (mechaniki v0.4): the key that closed the text window
   * or resumed from the pause menu must not act in the game; Space/J attack only after
   * release + press again. Call AFTER the resume (resume resets the source).
   */
  block(code: string): void {
    this.blocked.add(code);
    this.held.delete(code);
    this.latched.delete(code);
  }

  private onDown = (e: KeyEventLike): void => {
    if (isEditable(e.target)) return;
    if (!this.bindings[e.code]) return;
    e.preventDefault?.();
    if (e.repeat || this.blocked.has(e.code)) return;
    this.held.add(e.code);
    this.latched.add(e.code);
    this.pressSeq.set(e.code, ++this.seq);
  };

  private onUp = (e: KeyEventLike): void => {
    this.blocked.delete(e.code);
    this.held.delete(e.code);
  };

  private active(binding: KeyBinding): boolean {
    for (const code of this.held) if (this.bindings[code] === binding) return true;
    for (const code of this.latched) if (this.bindings[code] === binding) return true;
    return false;
  }

  poll(): Partial<ActionState> {
    const x = this.axis('left', 'right');
    const y = this.axis('up', 'down');
    const out: Partial<ActionState> = {};
    for (const a of ['attack', 'skill1', 'skill2', 'skill3', 'use', 'heal', 'pause'] as const) {
      out[a] = a === 'pause' ? this.latchedButton(a) : this.active(a);
    }

    out.move = { x, y };
    if (x !== 0 || y !== 0) out.digitalMove = true;
    const ax = this.axis('aimLeft', 'aimRight');
    const ay = this.axis('aimUp', 'aimDown');
    if (ax !== 0 || ay !== 0) {
      out.aim = { x: ax, y: ay };
      out.digitalAim = true;
    }
    this.latched.clear();
    return out;
  }

  /**
   * mechaniki §1.2 v0.5 (QA-M0-009): opposite keys on one axis never cancel – the most recently
   * pressed one wins; when it is released the still-held one applies again.
   */
  private axis(neg: DirKey | AimKey, pos: DirKey | AimKey): -1 | 0 | 1 {
    let best: -1 | 0 | 1 = 0;
    let bestSeq = -1;
    for (const code of [...this.held, ...this.latched]) {
      const b = this.bindings[code];
      if (b !== neg && b !== pos) continue;
      const q = this.pressSeq.get(code) ?? 0;
      if (q > bestSeq) {
        bestSeq = q;
        best = b === pos ? 1 : -1;
      }
    }
    return best;
  }

  private latchedButton(a: ButtonAction): boolean {
    for (const code of this.latched) if (this.bindings[code] === a) return true;
    return false;
  }

  reset(): void {
    this.held.clear();
    this.latched.clear();
  }
}
