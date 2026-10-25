// ui-m1 §11.4 / S-T2: pause reason 'tutorial' and the pause-aware UI clock loop.activeMs().
import { describe, expect, it } from 'vitest';
import { EventBus, type GameEvents } from '../src/core/events';
import { GameLoop } from '../src/core/loop';

function make(visible = { v: true }) {
  const bus = new EventBus<GameEvents>();
  const log: string[] = [];
  bus.on('paused', ({ reason }) => log.push(`paused:${reason}`));
  bus.on('resumed', ({ from }) => log.push(`resumed:${from}`));
  const froms: string[] = [];
  let ticks = 0;
  const loop = new GameLoop({
    stepMs: 50,
    countdownMs: 1000,
    events: bus,
    update: () => ticks++,
    render: () => {},
    onResumeStart: (from) => froms.push(from),
    isVisible: () => visible.v,
  });
  let now = 0;
  const run = (ms: number) => {
    for (const end = now + ms; now < end; now += 10) loop.frame(now);
  };
  return { loop, log, froms, run, ticks: () => ticks };
}

describe("pause 'tutorial'", () => {
  it('resumes at once (no countdown) and tells onResumeStart where it came from', () => {
    const t = make();
    t.run(100);
    t.loop.pause('tutorial');
    expect(t.loop.pauseReason).toBe('tutorial');
    t.loop.resume();
    expect(t.loop.mode).toBe('running');
    expect(t.froms).toEqual(['tutorial']);
    expect(t.log).toEqual(['paused:tutorial', 'resumed:tutorial']);
  });

  it('auto-pause over tutorial: RESUME → 1.0 s countdown → back to tutorial (no tick)', () => {
    const t = make();
    t.run(100);
    t.loop.pause('tutorial');
    expect(t.loop.pause('auto')).toBe(true); // 'auto' replaces 'tutorial' (overlay)
    expect(t.loop.pauseReason).toBe('auto');
    const before = t.ticks();
    t.loop.resume({ countdown: false }); // a pause over tutorial always counts down
    expect(t.loop.mode).toBe('countdown');
    t.run(1100);
    expect(t.loop.pauseReason).toBe('tutorial');
    expect(t.ticks()).toBe(before);
    expect(t.log).toEqual(['paused:tutorial', 'paused:auto', 'paused:tutorial']);
    t.loop.resume();
    t.run(100);
    expect(t.ticks()).toBeGreaterThan(before);
  });

  it('auto-pause during that countdown still returns to tutorial', () => {
    const t = make();
    t.loop.pause('tutorial');
    t.loop.pause('auto');
    t.loop.resume();
    t.run(300);
    t.loop.pause('auto');
    t.loop.resume();
    t.run(1100);
    expect(t.loop.pauseReason).toBe('tutorial');
  });

  it('a normal pause (no tutorial) still resumes to running', () => {
    const t = make();
    t.loop.pause('menu');
    t.loop.resume();
    t.run(1100);
    expect(t.loop.mode).toBe('running');
  });
});

describe('loop.activeMs()', () => {
  it("runs while playing, in 'text' / 'tutorial' and the countdown; stops in 'auto', 'menu' and when hidden", () => {
    const vis = { v: true };
    const t = make(vis);
    t.run(1000);
    expect(t.loop.activeMs()).toBeCloseTo(990, -1);
    let a = t.loop.activeMs();
    t.loop.pause('auto');
    t.run(1000);
    expect(t.loop.activeMs()).toBe(a);
    t.loop.pause('menu'); // suppressed: still 'auto'
    t.loop.resume(); // countdown runs the clock
    t.run(500);
    expect(t.loop.activeMs()).toBeCloseTo(a + 500, -1);
    a = t.loop.activeMs();
    t.loop.pause('menu');
    t.run(500);
    expect(t.loop.activeMs()).toBe(a);
    t.loop.resume({ countdown: false });
    t.loop.pause('text');
    t.run(500);
    expect(t.loop.activeMs()).toBeCloseTo(a + 500, -1);
    a = t.loop.activeMs();
    vis.v = false;
    t.run(500);
    expect(t.loop.activeMs()).toBe(a);
  });

  it('a long hitch counts at most 250 ms', () => {
    const t = make();
    t.loop.frame(0);
    t.loop.frame(5000);
    expect(t.loop.activeMs()).toBe(250);
  });
});
