// Twin-stick aim sources (keyboard arrows are in keyboard.ts):
// - MouseAimSource: from the player's cell to the cell under the cursor, 8 sectors of 45°.
//   A move of ≥ 1 cell or a left click is a "use". LMB (button 0) is attack; pointing is not.
// - AimStickSource: the second touch stick (UI calls setAimStick). Dead zone = AIM_DEADZONE.
//   Entering the zone or changing Dir8 is a use; holding still is not, so a newer mouse or
//   key aim survives until the stick is released.
import { M0 } from '../data/mechanics-m0';
import {
  toDir8,
  type ActionState,
  type AimSourceHints,
  type Dir8,
  type InputSource,
} from './actions';

export interface Cell {
  x: number;
  y: number;
}

export interface PointerEventLike {
  clientX: number;
  clientY: number;
  pointerType?: string;
  /** 0 = left / primary. Omitted is not a click (pointermove still aims). */
  button?: number;
}

/** Pointer events the mouse source needs (canvas element; testable without a DOM). */
export interface PointerTarget {
  addEventListener(
    type: 'pointermove' | 'pointerleave' | 'pointerdown' | 'pointerup',
    fn: (e: PointerEventLike) => void,
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
  /** Last cell that counted as a move, so travel inside one cell is not a new use. */
  private anchor: Cell | null = null;
  private moved = false;
  private clicked = false;
  private lmbHeld = false;
  private lmbLatched = false;

  constructor(
    target: PointerTarget,
    /** Viewport CSS px → map cell, null outside the canvas (render/screen.ts screenToCell). */
    private readonly toCell: (x: number, y: number) => Cell | null,
    private readonly playerCell: () => Cell,
  ) {
    target.addEventListener('pointermove', (e) => this.onMove(e));
    target.addEventListener('pointerdown', (e) => this.onDown(e));
    target.addEventListener('pointerup', (e) => this.onUp(e));
    target.addEventListener('pointerleave', () => {
      this.at = null;
      this.anchor = null;
    });
  }

  private isMouse(e: PointerEventLike): boolean {
    return !e.pointerType || e.pointerType === 'mouse';
  }

  private onMove(e: PointerEventLike): void {
    if (!this.isMouse(e)) return;
    this.at = { x: e.clientX, y: e.clientY };
    const cell = this.toCell(e.clientX, e.clientY);
    if (!cell) {
      this.anchor = null;
      return;
    }
    if (!this.anchor || this.anchor.x !== cell.x || this.anchor.y !== cell.y) {
      this.anchor = { x: cell.x, y: cell.y };
      this.moved = true;
    }
  }

  private onDown(e: PointerEventLike): void {
    if (!this.isMouse(e)) return;
    this.onMove(e);
    if (e.button !== 0) return;
    this.lmbHeld = true;
    this.lmbLatched = true;
    this.clicked = true;
  }

  private onUp(e: PointerEventLike): void {
    if (!this.isMouse(e)) return;
    if (e.button === 0) this.lmbHeld = false;
  }

  poll(): Partial<ActionState> & AimSourceHints {
    const attack = this.lmbHeld || this.lmbLatched;
    this.lmbLatched = false;
    const used = this.moved || this.clicked;
    this.moved = false;
    this.clicked = false;

    const cell = this.at ? this.toCell(this.at.x, this.at.y) : null;
    if (!cell && !attack && !used) return {};

    const out: Partial<ActionState> & AimSourceHints = { aimOrigin: 'mouse' };
    if (used) out.aimUsed = true;
    if (attack) out.attack = true;
    if (cell) {
      out.aimCell = { x: cell.x, y: cell.y };
      const aim = aimTowards(this.playerCell(), cell);
      if (aim) out.aim = aim;
    }
    return out;
  }

  /** Pause / focus loss: no aim until the mouse moves again. */
  reset(): void {
    this.at = null;
    this.anchor = null;
    this.moved = false;
    this.clicked = false;
    this.lmbHeld = false;
    this.lmbLatched = false;
  }
}

export class AimStickSource implements InputSource {
  private vec: { x: number; y: number } | null = null;
  /** After reset() the stick still held is ignored until it is released (like TouchSource). */
  private stale = false;
  /** Previous Dir8, so a steady deflection is not a use on every poll. */
  private prevAim: Dir8 | null = null;

  /** UI (second stick): vector with each axis in [-1, 1], null = released. */
  set(vec: { x: number; y: number } | null): void {
    if (vec === null) {
      this.stale = false;
      this.vec = null;
      return;
    }
    if (!this.stale) this.vec = { x: vec.x, y: vec.y };
  }

  poll(): Partial<ActionState> & AimSourceHints {
    const aim = this.vec ? toDir8(this.vec, M0.AIM_DEADZONE) : null;
    if (!aim) {
      this.prevAim = null;
      return {};
    }
    const used = !this.prevAim || this.prevAim.x !== aim.x || this.prevAim.y !== aim.y;
    this.prevAim = aim;
    return used ? { aim, aimOrigin: 'stick', aimUsed: true } : { aim, aimOrigin: 'stick' };
  }

  reset(): void {
    if (this.vec) this.stale = true;
    this.vec = null;
    this.prevAim = null;
  }
}

/** The aim stick of the game (main.ts adds it to the InputManager). */
export const aimStick = new AimStickSource();

/** UI: feed the second touch stick here (null when released). */
export function setAimStick(vec: { x: number; y: number } | null): void {
  aimStick.set(vec);
}
