// Twin-stick aim sources (keyboard arrows are in keyboard.ts and win over these):
// - MouseAimSource: from the player's cell to the cell under the cursor, 8 sectors of 45°;
// - AimStickSource: the second touch stick (UI calls setAimStick), dead zone = MOVE_DEADZONE.
import { M0 } from '../data/mechanics-m0';
import { toDir8, type ActionState, type Dir8, type InputSource } from './actions';

export interface Cell {
  x: number;
  y: number;
}

/** Pointer events the mouse source needs (canvas element; testable without a DOM). */
export interface PointerTarget {
  addEventListener(
    type: 'pointermove' | 'pointerleave' | 'pointerdown',
    fn: (e: { clientX: number; clientY: number; pointerType?: string }) => void,
  ): void;
}

/** 8-direction quantisation of the vector player cell → target cell (null: same cell). */
export function aimTowards(from: Cell, to: Cell): Dir8 | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (dx === 0 && dy === 0) return null;
  return toDir8({ x: dx, y: dy }, 0);
}

export class MouseAimSource implements InputSource {
  private at: { x: number; y: number } | null = null;

  constructor(
    target: PointerTarget,
    /** Viewport CSS px → map cell, null outside the canvas (render/screen.ts screenToCell). */
    private readonly toCell: (x: number, y: number) => Cell | null,
    private readonly playerCell: () => Cell,
  ) {
    const move = (e: { clientX: number; clientY: number; pointerType?: string }) => {
      if (e.pointerType && e.pointerType !== 'mouse') return; // touch aims with the stick
      this.at = { x: e.clientX, y: e.clientY };
    };
    target.addEventListener('pointermove', move);
    target.addEventListener('pointerdown', move);
    target.addEventListener('pointerleave', () => (this.at = null));
  }

  poll(): Partial<ActionState> {
    if (!this.at) return {};
    const cell = this.toCell(this.at.x, this.at.y);
    const aim = cell ? aimTowards(this.playerCell(), cell) : null;
    return aim ? { aim } : {};
  }

  /** Pause / focus loss: no aim until the mouse moves again. */
  reset(): void {
    this.at = null;
  }
}

export class AimStickSource implements InputSource {
  private vec: { x: number; y: number } | null = null;
  /** After reset() the stick still held is ignored until it is released (like TouchSource). */
  private stale = false;

  /** UI (second stick): vector with each axis in [-1, 1], null = released. */
  set(vec: { x: number; y: number } | null): void {
    if (vec === null) {
      this.stale = false;
      this.vec = null;
      return;
    }
    if (!this.stale) this.vec = { x: vec.x, y: vec.y };
  }

  poll(): Partial<ActionState> {
    const aim = this.vec ? toDir8(this.vec, M0.MOVE_DEADZONE) : null;
    return aim ? { aim } : {};
  }

  reset(): void {
    if (this.vec) this.stale = true;
    this.vec = null;
  }
}

/** The aim stick of the game (main.ts adds it to the InputManager). */
export const aimStick = new AimStickSource();

/** UI: feed the second touch stick here (null when released). */
export function setAimStick(vec: { x: number; y: number } | null): void {
  aimStick.set(vec);
}
