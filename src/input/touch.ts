import type { ActionState, ButtonAction, InputSource } from './actions';
import { JOYSTICK, Joystick, type JoystickConfig } from './joystick';

export type TouchButton = Exclude<ButtonAction, 'pause'>;

/** Read-only view of the touch state for drawing the controls (ui/touch-controls.ts). */
export interface TouchView {
  stickActive: boolean;
  baseX: number;
  baseY: number;
  knobX: number;
  knobY: number;
  sector: number | null;
  held: ReadonlySet<TouchButton>;
}

/**
 * Touch input (Pointer Events), owned by PROG / UI i Menu (sterowanie.md §2).
 * DOM-free: ui/touch-controls.ts forwards pointer events here, so the logic is unit-tested.
 * - Every pointerId is tracked on its own: one finger drives the joystick, others press
 *   buttons, all at once. A finger that started on the joystick stays the joystick even when
 *   it slides to the other half of the screen.
 * - Buttons are latched: a tap shorter than a tick is reported by the next poll().
 * - reset() (pause, resume, focus loss) releases everything; fingers still on the screen
 *   stay inactive until lifted and put down again.
 */
export class TouchSource implements InputSource {
  private stick: Joystick;
  private stickId: number | null = null;
  private buttons = new Map<number, TouchButton>();
  private latched = new Set<TouchButton>();
  private stale = new Set<number>();
  /** Called after every state change (redraw controls). */
  onChange: ((v: TouchView) => void) | null = null;

  constructor(cfg: JoystickConfig = JOYSTICK) {
    this.stick = new Joystick(cfg);
  }

  /** Finger down in the joystick zone. Returns false if ignored (another finger owns it). */
  stickDown(id: number, x: number, y: number): boolean {
    if (this.stickId !== null || this.stale.has(id)) return false;
    this.stickId = id;
    this.stick.start(x, y);
    this.changed();
    return true;
  }

  pointerMove(id: number, x: number, y: number): void {
    if (id !== this.stickId) return;
    this.stick.move(x, y);
    this.changed();
  }

  buttonDown(id: number, button: TouchButton): void {
    if (this.stale.has(id)) return;
    this.buttons.set(id, button);
    this.latched.add(button);
    this.changed();
  }

  /** pointerup / pointercancel / lostpointercapture. */
  pointerUp(id: number): void {
    this.stale.delete(id);
    if (id === this.stickId) this.stickId = null;
    this.buttons.delete(id);
    this.changed();
  }

  get view(): TouchView {
    const s = this.stick;
    return {
      stickActive: this.stickId !== null,
      baseX: s.baseX,
      baseY: s.baseY,
      knobX: s.knobX,
      knobY: s.knobY,
      sector: this.stickId !== null ? s.sector : null,
      held: new Set(this.buttons.values()),
    };
  }

  poll(): Partial<ActionState> {
    const out: Partial<ActionState> = {
      move: this.stickId !== null ? this.stick.vector : { x: 0, y: 0 },
    };
    const held = new Set(this.buttons.values());
    for (const b of ['attack', 'skill1', 'skill2', 'skill3'] as const)
      out[b] = held.has(b) || this.latched.has(b);
    this.latched.clear();
    return out;
  }

  reset(): void {
    if (this.stickId !== null) this.stale.add(this.stickId);
    for (const id of this.buttons.keys()) this.stale.add(id);
    this.stickId = null;
    this.buttons.clear();
    this.latched.clear();
    this.changed();
  }

  private changed(): void {
    this.onChange?.(this.view);
  }
}
