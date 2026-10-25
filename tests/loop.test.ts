import { describe, expect, it } from 'vitest';
import { EventBus, type GameEvents } from '../src/core/events';
import { GameLoop } from '../src/core/loop';

function setup(stepMs = 50, maxSteps = 5) {
  const bus = new EventBus<GameEvents>();
  const log: string[] = [];
  bus.on('paused', (p) => log.push(`paused:${p.reason}`));
  bus.on('resumed', (p) => log.push(`resumed:${p.from}`));
  const alphas: number[] = [];
  let updates = 0;
  let idles = 0;
  const loop = new GameLoop({
    stepMs,
    maxStepsPerFrame: maxSteps,
    events: bus,
    update: () => void updates++,
    render: (a) => void alphas.push(a),
    idle: () => void idles++,
  });
  return {
    loop,
    log,
    alphas,
    get updates() {
      return updates;
    },
    get idles() {
      return idles;
    },
  };
}

describe('GameLoop fixed step', () => {
  it('runs exactly one step per 50 ms regardless of frame rate', () => {
    const t = setup();
    t.loop.frame(0); // first frame sets the time base
    for (let i = 1; i <= 60; i++) t.loop.frame(i * (1000 / 60)); // 1 s @ 60 FPS
    expect(t.updates).toBe(20);
    const t2 = setup();
    t2.loop.frame(0);
    for (let i = 1; i <= 30; i++) t2.loop.frame(i * (1000 / 30)); // 1 s @ 30 FPS
    expect(t2.updates).toBe(20);
  });

  it('interpolation alpha is the fraction of a step left in the accumulator', () => {
    const t = setup();
    t.loop.frame(0);
    t.loop.frame(75);
    expect(t.updates).toBe(1);
    expect(t.alphas.at(-1)).toBeCloseTo(0.5);
  });

  it('caps steps per frame at 5 and drops the backlog', () => {
    const t = setup();
    t.loop.frame(0);
    t.loop.frame(2000); // 40 steps worth of time
    expect(t.updates).toBe(5);
    expect(t.loop.alpha).toBeLessThan(1);
    t.loop.frame(2050);
    expect(t.updates).toBe(6); // no hidden catch-up
  });
});

describe('GameLoop pause', () => {
  it('does not step or accumulate while paused and has no time jump after resume', () => {
    const t = setup();
    t.loop.frame(0);
    t.loop.frame(120); // 2 steps, 20 ms left
    expect(t.updates).toBe(2);
    t.loop.pause('menu');
    t.loop.frame(200);
    t.loop.frame(60_000);
    expect(t.updates).toBe(2);
    expect(t.idles).toBe(2);
    expect(t.loop.alpha).toBeCloseTo(0.4); // accumulator frozen
    t.loop.resume();
    t.loop.frame(120_000); // first frame after resume only re-bases time
    expect(t.updates).toBe(2);
    t.loop.frame(120_030); // 20 + 30 = 50 → one step
    expect(t.updates).toBe(3);
  });

  it('pause from inside a step stops remaining steps of that frame', () => {
    let n = 0;
    const loop: GameLoop = new GameLoop({
      update: () => {
        n++;
        if (n === 2) loop.pause('menu');
      },
      render: () => {},
    });
    loop.frame(0);
    loop.frame(250);
    expect(n).toBe(2);
  });

  it('emits paused with reason and resumed with origin', () => {
    const t = setup();
    expect(t.loop.pause('menu')).toBe(true);
    expect(t.loop.pause('menu')).toBe(false);
    expect(t.loop.resume()).toBe(true);
    expect(t.loop.resume()).toBe(false);
    expect(t.log).toEqual(['paused:menu', 'resumed:menu']);
  });

  it("auto-pause never overrides 'text' (or 'menu')", () => {
    const t = setup();
    t.loop.pause('text');
    expect(t.loop.pause('auto')).toBe(false);
    expect(t.loop.pauseReason).toBe('text');
    t.loop.resume();
    t.loop.pause('menu');
    t.loop.pause('auto');
    expect(t.loop.pauseReason).toBe('menu');
    expect(t.log).toEqual(['paused:text', 'resumed:text', 'paused:menu']);
  });

  it("auto-pause while running uses reason 'auto'; menu may replace text", () => {
    const t = setup();
    t.loop.pause('auto');
    expect(t.loop.pauseReason).toBe('auto');
    t.loop.resume();
    t.loop.pause('text');
    expect(t.loop.pause('menu')).toBe(true);
    expect(t.loop.pauseReason).toBe('menu');
  });
});

describe('GameLoop resume countdown (mechaniki 1.11)', () => {
  function cd() {
    const bus = new EventBus<GameEvents>();
    const log: string[] = [];
    bus.on('paused', (p) => log.push(`paused:${p.reason}`));
    bus.on('countdown', (p) => log.push(`cd:${p.digit}`));
    bus.on('resumed', (p) => log.push(`resumed:${p.from}`));
    let updates = 0;
    let resets = 0;
    let ticks = 0;
    let pauseInTick = false;
    const loop: GameLoop = new GameLoop({
      events: bus,
      countdownMs: 1000,
      update: () => void updates++,
      render: () => {},
      onResumeStart: () => void resets++,
      countdownTick: () => {
        ticks++;
        if (pauseInTick) loop.pause('menu');
      },
    });
    return {
      loop,
      log,
      get updates() {
        return updates;
      },
      get resets() {
        return resets;
      },
      get ticks() {
        return ticks;
      },
      pauseNext() {
        pauseInTick = true;
      },
    };
  }

  it('resets input, counts 3·2·1 without simulating, then emits resumed', () => {
    const t = cd();
    t.loop.pause('menu');
    t.loop.resume();
    expect(t.resets).toBe(1);
    expect(t.loop.mode).toBe('countdown');
    expect(t.loop.paused).toBe(false);
    for (let now = 0; t.loop.countingDown; now += 50) t.loop.frame(now);
    expect(t.log).toEqual(['paused:menu', 'cd:3', 'cd:2', 'cd:1', 'resumed:menu']);
    expect(t.updates).toBe(0);
    expect(t.ticks).toBeGreaterThan(0);
    expect(t.loop.mode).toBe('running');
  });

  it('first simulation step comes one step after the countdown ends (no time jump)', () => {
    const t = cd();
    t.loop.pause('auto');
    t.loop.resume();
    let now = 0;
    while (t.loop.countingDown) t.loop.frame((now += 16));
    const end = now;
    t.loop.frame(end + 40);
    expect(t.updates).toBe(0);
    t.loop.frame(end + 50);
    expect(t.updates).toBe(1);
  });

  it('pausing during the countdown cancels it', () => {
    const t = cd();
    t.loop.pause('menu');
    t.loop.resume();
    for (let now = 0; now <= 400; now += 50) t.loop.frame(now);
    t.loop.pause('auto');
    expect(t.loop.pauseReason).toBe('auto');
    for (let now = 400; now < 3000; now += 50) t.loop.frame(now);
    expect(t.log).toEqual(['paused:menu', 'cd:3', 'cd:2', 'paused:auto']);
    expect(t.updates).toBe(0);
  });

  it('countdownTick may pause (Esc during countdown)', () => {
    const t = cd();
    t.loop.pause('menu');
    t.loop.resume();
    t.pauseNext();
    t.loop.frame(0);
    expect(t.loop.pauseReason).toBe('menu');
    expect(t.log.at(-1)).toBe('paused:menu');
  });

  it('resume during countdown is a no-op; a long hitch does not skip the countdown', () => {
    const t = cd();
    t.loop.pause('menu');
    t.loop.resume();
    expect(t.loop.resume()).toBe(false);
    t.loop.frame(0);
    t.loop.frame(10_000); // clamped to 250 ms
    expect(t.loop.countingDown).toBe(true);
  });
});

describe('GameLoop resume({ countdown: false }) and suppressed auto-pause', () => {
  function mk() {
    const bus = new EventBus<GameEvents>();
    const log: string[] = [];
    bus.on('paused', (p) => log.push(`paused:${p.reason}`));
    bus.on('countdown', (p) => log.push(`cd:${p.digit}`));
    bus.on('resumed', (p) => log.push(`resumed:${p.from}`));
    bus.on('autoPauseSuppressed', (p) => log.push(`suppressed:${p.current}`));
    let resets = 0;
    let updates = 0;
    const loop = new GameLoop({
      events: bus,
      countdownMs: 1000,
      update: () => void updates++,
      render: () => {},
      onResumeStart: () => void resets++,
    });
    return {
      loop,
      log,
      get resets() {
        return resets;
      },
      get updates() {
        return updates;
      },
    };
  }

  it('without countdown: still resets input and emits resumed at once', () => {
    const t = mk();
    t.loop.pause('text');
    expect(t.loop.resume({ countdown: false })).toBe(true);
    expect(t.resets).toBe(1);
    expect(t.loop.mode).toBe('running');
    expect(t.log).toEqual(['paused:text', 'resumed:text']);
    t.loop.frame(0); // re-base time only
    t.loop.frame(49);
    expect(t.updates).toBe(0);
    t.loop.frame(50);
    expect(t.updates).toBe(1);
  });

  it('countdown: true / default runs the countdown', () => {
    const t = mk();
    t.loop.pause('text');
    t.loop.resume({ countdown: true });
    expect(t.loop.mode).toBe('countdown');
    expect(t.log).toEqual(['paused:text', 'cd:3']);
  });

  it("auto over 'text' emits autoPauseSuppressed, keeps reason, sets autoPausedDuring until resume", () => {
    const t = mk();
    t.loop.pause('text');
    expect(t.loop.autoPausedDuring).toBe(false);
    expect(t.loop.pause('auto')).toBe(false);
    expect(t.loop.pauseReason).toBe('text');
    expect(t.loop.autoPausedDuring).toBe(true);
    expect(t.log).toEqual(['paused:text', 'suppressed:text']);
    t.loop.resume({ countdown: false });
    expect(t.loop.autoPausedDuring).toBe(false);
  });

  it("auto over 'menu' is also reported; a fresh auto-pause sets the flag; repeated auto is silent", () => {
    const t = mk();
    t.loop.pause('menu');
    t.loop.pause('auto');
    expect(t.log.at(-1)).toBe('suppressed:menu');
    t.loop.resume();
    t.loop.pause('auto');
    expect(t.loop.autoPausedDuring).toBe(true);
    t.loop.pause('auto'); // blur + visibilitychange
    expect(t.log.filter((l) => l.startsWith('suppressed'))).toHaveLength(1);
  });
});
