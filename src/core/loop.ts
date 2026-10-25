import type { EventBus, GameEvents, PauseDetail, PauseReason } from './events';

export interface LoopOptions {
  /** Fixed simulation step in ms (default 50 = 20 Hz). */
  stepMs?: number;
  /** Max simulation steps per frame (default 5); excess backlog is dropped. */
  maxStepsPerFrame?: number;
  /** One fixed simulation step. Must not touch DOM/canvas. */
  update: (dtMs: number) => void;
  /** Draw; alpha in [0,1) = fraction between previous and current sim state. */
  render: (alpha: number) => void;
  /** Called once per frame while paused (e.g. to poll the resume key). */
  idle?: () => void;
  /** Resume countdown length in ms (mechaniki 1.11: 1000). 0 = resume immediately. */
  countdownMs?: number;
  /** Number of digits shown during the countdown (3 → 3·2·1). */
  countdownDigits?: number;
  /** Called by resume() before the countdown starts (reset input). `from` = reason left. */
  onResumeStart?: (from: PauseReason) => void;
  /** Page visible? (activeMs stops while hidden). Default: always visible. */
  isVisible?: () => boolean;
  /** Called once per frame during the countdown (read input; may call pause()). */
  countdownTick?: () => void;
  events?: EventBus<GameEvents>;
  requestFrame?: (cb: (now: number) => void) => number;
  cancelFrame?: (id: number) => void;
}

/**
 * Fixed-timestep loop with accumulator and rAF rendering with interpolation.
 * Pause: the accumulator does not grow; on resume the time base is reset, so
 * there is no time jump however long the game was paused.
 */
export class GameLoop {
  readonly stepMs: number;
  readonly maxStepsPerFrame: number;
  private acc = 0;
  private last: number | null = null;
  private reason: PauseReason | null = null;
  private frameId: number | null = null;
  private running = false;
  private countdownLeft: number | null = null;
  private countdownFrom: PauseReason = 'menu';
  private lastDigit = 0;
  readonly countdownMs: number;
  readonly countdownDigits: number;
  /**
   * True if an auto-pause (focus loss etc.) happened during the current pause – either it
   * started the pause or it was suppressed by an existing 'text'/'menu' pause. Cleared by resume().
   */
  autoPausedDuring = false;
  /** Total simulation steps executed (useful for tests / debugging). */
  steps = 0;
  /** 'tutorial' interrupted by another pause: the countdown of that pause ends back in it. */
  private resumeTo: PauseReason | null = null;
  private active = 0;
  private lastFrameAt: number | null = null;

  constructor(private readonly opts: LoopOptions) {
    this.stepMs = opts.stepMs ?? 50;
    this.maxStepsPerFrame = opts.maxStepsPerFrame ?? 5;
    this.countdownMs = Math.max(0, opts.countdownMs ?? 0);
    this.countdownDigits = Math.max(1, opts.countdownDigits ?? 3);
  }

  /** 'running' | 'paused' | 'countdown' (simulation runs only in 'running'). */
  get mode(): 'running' | 'paused' | 'countdown' {
    if (this.reason !== null) return 'paused';
    return this.countdownLeft !== null ? 'countdown' : 'running';
  }

  get countingDown(): boolean {
    return this.countdownLeft !== null;
  }

  get paused(): boolean {
    return this.reason !== null;
  }

  get pauseReason(): PauseReason | null {
    return this.reason;
  }

  get alpha(): number {
    return this.acc / this.stepMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = null;
    this.schedule();
  }

  stop(): void {
    this.running = false;
    if (this.frameId !== null) this.opts.cancelFrame?.(this.frameId);
    this.frameId = null;
  }

  /**
   * Pause the simulation. Returns true if the pause state/reason changed.
   * - 'auto' never overrides an existing pause (keeps 'text' or 'menu'); it emits
   *   'autoPauseSuppressed { current }' and sets `autoPausedDuring` instead.
   * - 'menu' / 'text' replace a different existing reason.
   */
  pause(reason: PauseReason, detail?: PauseDetail): boolean {
    if (reason === 'auto') this.autoPausedDuring = true;
    if (this.reason === reason) return false;
    // A countdown that would end in 'tutorial' is interrupted: keep returning there.
    if (this.reason === 'tutorial' && reason !== 'tutorial') this.resumeTo = 'tutorial';
    else if (this.reason === null && this.countdownLeft === null) this.resumeTo = null;
    if (this.reason !== null && reason === 'auto' && this.reason !== 'tutorial') {
      this.opts.events?.emit('autoPauseSuppressed', { current: this.reason });
      return false;
    }
    this.countdownLeft = null; // pausing during the countdown cancels it
    this.reason = reason;
    this.opts.events?.emit('paused', detail ? { reason, detail } : { reason });
    return true;
  }

  /**
   * Resume (only called explicitly: RESUME, Esc, P, Enter). Resets input, then runs the
   * countdown (simulation still stopped, render running) and finally emits 'resumed'.
   * Returns false if not paused. Pass `{ countdown: false }` to skip the countdown (UI: text
   * window closed without an auto-pause while reading).
   */
  resume(opts: { countdown?: boolean } = {}): boolean {
    if (this.reason === null) return false;
    const from = this.reason;
    this.reason = null;
    this.autoPausedDuring = false;
    this.last = null; // reset time base – no catch-up after the pause
    if (from === 'tutorial') this.resumeTo = null;
    this.opts.onResumeStart?.(from);
    // 'tutorial' resumes at once (any direction, ui-m1 §11.4); a pause over 'tutorial' always
    // counts down (1.0 s) and then returns to 'tutorial'.
    const back = this.resumeTo === 'tutorial';
    const countdown = back ? true : from === 'tutorial' ? opts.countdown === true : opts.countdown;
    // { countdown: false }: closing the text window resumes at once (GD / mechaniki 1.16).
    if (this.countdownMs <= 0 || countdown === false) {
      if (back) this.backToTutorial();
      else this.opts.events?.emit('resumed', { from });
      return true;
    }
    this.countdownFrom = from;
    this.countdownLeft = this.countdownMs;
    this.lastDigit = this.countdownDigits;
    this.opts.events?.emit('countdown', {
      msLeft: this.countdownMs,
      digit: this.countdownDigits,
      from,
    });
    return true;
  }

  private countdownFrame(now: number): void {
    if (this.last === null) this.last = now;
    // Clamp a single hitch so a frozen tab does not skip the countdown.
    const delta = Math.min(250, Math.max(0, now - this.last));
    this.last = now;
    this.countdownLeft = (this.countdownLeft ?? 0) - delta;
    this.opts.countdownTick?.();
    if (this.reason !== null) return; // paused from countdownTick
    if (this.countdownLeft <= 0) {
      this.countdownLeft = null;
      this.last = now; // first tick happens one step after the countdown ends
      if (this.resumeTo === 'tutorial') this.backToTutorial();
      else this.opts.events?.emit('resumed', { from: this.countdownFrom });
      return;
    }
    const digit = Math.ceil(this.countdownLeft / (this.countdownMs / this.countdownDigits));
    if (digit !== this.lastDigit) {
      this.lastDigit = digit;
      this.opts.events?.emit('countdown', {
        msLeft: this.countdownLeft,
        digit,
        from: this.countdownFrom,
      });
    }
  }

  private backToTutorial(): void {
    this.resumeTo = null;
    this.reason = 'tutorial';
    this.opts.events?.emit('paused', { reason: 'tutorial' });
  }

  /**
   * Pause-aware clock for UI timers (death screen 1500 / 5000 ms, ui-m1 §4): ms of frames
   * while the page is visible and the game is NOT in an 'auto' or 'menu' pause. Runs while
   * playing, in the countdown, in 'text' and 'tutorial'. One frame counts at most 250 ms.
   */
  activeMs(): number {
    return this.active;
  }

  private countActive(now: number): void {
    const prev = this.lastFrameAt;
    this.lastFrameAt = now;
    if (prev === null) return;
    const visible = this.opts.isVisible?.() ?? true;
    if (!visible || this.reason === 'auto' || this.reason === 'menu') return;
    this.active += Math.min(250, Math.max(0, now - prev));
  }

  /** Advance one frame at timestamp `now` (ms). Public for tests. */
  frame(now: number): void {
    this.countActive(now);
    if (this.reason !== null) {
      this.last = null;
      this.opts.idle?.();
      this.opts.render(this.alpha);
      return;
    }
    if (this.countdownLeft !== null) {
      this.countdownFrame(now);
      this.opts.render(this.alpha);
      return;
    }
    if (this.last === null) {
      this.last = now;
      this.opts.render(this.alpha);
      return;
    }
    const delta = Math.max(0, now - this.last);
    this.last = now;
    this.acc += delta;

    let n = 0;
    while (this.acc >= this.stepMs && n < this.maxStepsPerFrame) {
      this.opts.update(this.stepMs);
      this.acc -= this.stepMs;
      n++;
      this.steps++;
      if (this.reason !== null) break; // paused from inside a step
    }
    // Drop backlog we could not simulate (slow device / long hitch).
    if (this.acc >= this.stepMs) this.acc %= this.stepMs;
    this.opts.render(this.alpha);
  }

  private schedule(): void {
    if (!this.running || !this.opts.requestFrame) return;
    this.frameId = this.opts.requestFrame((now) => {
      this.frame(now);
      this.schedule();
    });
  }
}
