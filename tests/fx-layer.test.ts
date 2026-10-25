// FX layer logic (render/fx-layer.ts) in Node, no DOM. LUZ / Pracownik 4.
import { describe, expect, it } from 'vitest';
import type { CombatData } from '../src/combat/state';
import { EventBus, type GameEvents } from '../src/core/events';
import { createGame } from '../src/core/game';
import { FX } from '../src/data/fx';
import { FX_PARAMS } from '../src/data/fx-params';
import {
  CombatFxSource,
  FxClock,
  FxEngine,
  frameIndexAt,
  fxFrame,
  installFxLayer,
  lineBetween,
  parseTrigger,
  type FxPayload,
} from '../src/render/fx-layer';
import type { FxFrame } from '../src/data/fx';
import { Rng } from '../src/core/rng';

const F = (ms: number): FxFrame => ({ ms, cells: [] });
const at = () => ({ x: 5, y: 5 });
const engine = (rm = false, seed = 1) => new FxEngine({ reduceMotion: () => rm, seed });
const keys = (e: FxEngine) => e.instances.map((i) => `${i.sp.fxId}.${i.sp.key}`);

describe('frameIndexAt (frame for time t)', () => {
  it('walks frames, ends, loops and holds', () => {
    const fr = [F(100), F(100)];
    expect([0, 99, 100, 199].map((t) => frameIndexAt(fr, t, false, 200))).toEqual([0, 0, 1, 1]);
    expect(frameIndexAt(fr, 200, false, 200)).toBe(-1);
    expect(frameIndexAt(fr, 250, true, Infinity)).toBe(0);
    expect(frameIndexAt(fr, 450, false, 500)).toBe(1); // hold: last frame until durationMs
    expect(frameIndexAt([{ ms: 'durationMs', cells: [] }], 9999, false, Infinity)).toBe(0);
  });
});

describe('FxClock (render time, pause / countdown)', () => {
  it('runs only in running; paused and countdown freeze the last frame', () => {
    const c = new FxClock();
    c.tick(0, 'running');
    expect(c.tick(100, 'running')).toBe(100);
    expect(c.tick(5000, 'paused')).toBe(100);
    expect(c.tick(6000, 'countdown')).toBe(100);
    expect(c.tick(6050, 'running')).toBe(150);
    expect(c.tick(99999, 'running')).toBe(400); // long gaps clamped
  });

  it('an effect does not expire while the loop is paused / in countdown', () => {
    const e = engine();
    const c = new FxClock();
    c.tick(0, 'running');
    e.onEvent('playerHit', { dmg: 5 }, c.now);
    c.tick(100, 'running');
    for (const [t, m] of [
      [2000, 'paused'],
      [4000, 'countdown'],
    ] as const) {
      c.tick(t, m);
      expect(e.cells(c.now, at).length).toBeGreaterThan(0);
    }
    c.tick(4300, 'running');
    expect(e.cells(c.now, at)).toEqual([]);
  });
});

describe('triggers', () => {
  it('parses kinds, statuses, boss qualifier, alternatives and chains', () => {
    expect(parseTrigger('telegraphStart kind=bossSwing')).toEqual([
      { event: 'telegraphStart', kind: 'bossSwing' },
    ]);
    expect(parseTrigger('strikeResolved (bossSwing)')[0].kind).toBe('bossSwing');
    expect(parseTrigger('enemyHit (boss)')[0].boss).toBe(true);
    expect(parseTrigger('statusApplied:Shock')[0]).toEqual({
      event: 'statusApplied',
      status: 'Shock',
    });
    expect(parseTrigger('levelStart | cooldownEnd').map((t) => t.event)).toEqual([
      'levelStart',
      'cooldownEnd',
    ]);
    expect(parseTrigger('po swingStrike')[0].after).toBe('swingStrike');
  });

  it('telegraph picks the timeline by wind-up and ends on strikeResolved', () => {
    const e = engine();
    e.onEvent(
      'telegraphStart',
      { entityId: 7, kind: 'ranged', cells: [{ x: 1, y: 1 }], windupMs: 700 },
      0,
    );
    const tc = e.instances.find((i) => i.sp.key === 'targetCell');
    expect(tc?.frames).toBe(FX.fx_telegraph.timelines?.['ranged.700']);
    expect(tc?.durationMs).toBe(700);
    e.onEvent('strikeResolved', { entityId: 7, kind: 'ranged', cells: [{ x: 1, y: 1 }] }, 300);
    expect(keys(e).some((k) => k.startsWith('fx_telegraph'))).toBe(false);
    expect(e.instances.find((i) => i.sp.fxId === 'fx_strike')?.frames).toBe(
      FX.fx_strike.variants?.ranged,
    );
  });

  it('boss hits use fx_hit_boss, normal hits fx_hit_enemy', () => {
    const e = engine();
    e.onEvent('enemyHit', { entityId: 1, dmg: 3, crit: false, boss: true }, 0);
    e.onEvent('enemyHit', { entityId: 2, dmg: 3, crit: false }, 0);
    expect(keys(e)).toEqual(['fx_hit_boss.fx_hit_boss', 'fx_hit_enemy.fx_hit_enemy']);
  });

  it('EVAC_ARRIVE_S[depth] × 1000 comes from data/fx-params', () => {
    const e = engine();
    e.onEvent('evacCallDone', { cell: { x: 3, y: 3 }, depth: 2 }, 0);
    const arriving = e.instances.find((i) => i.sp.key === 'arriving');
    expect(arriving?.durationMs).toBe(FX_PARAMS.EVAC_ARRIVE_S.value[2] * 1000);
  });

  it('R6 A: liftArrived starts fx_alert on every alarmed enemy', () => {
    const e = engine();
    e.onEvent('liftArrived', { cell: { x: 3, y: 3 }, alertedIds: [4, 9] }, 0);
    const alerts = e.instances
      .filter((i) => i.sp.fxId === 'fx_alert')
      .map((i) => i.payload.entityId);
    expect(alerts).toEqual([4, 9]);
  });
});

describe('Reduce motion', () => {
  it('skip removes the effect, frame lists replace frames', () => {
    for (const rm of [false, true]) {
      const e = engine(rm);
      e.onEvent('timer', { entityId: 1 }, 0); // fx_szum_glitch: reduceMotion 'skip'
      expect(e.instances.length).toBe(rm ? 0 : 1);
    }
    const on = engine(true);
    on.onEvent('playerHit', { dmg: 1 }, 0);
    const rmFrames = FX.fx_hit_player.reduceMotion as readonly FxFrame[];
    expect(on.cells(0, at).length).toBe(rmFrames[0].cells?.length);
  });
});

describe('RNG and state', () => {
  it('{random} uses the FX-only RNG: deterministic per seed, never state.rng', () => {
    const state = createGame({ seed: 42 } as never);
    const before = JSON.stringify(state.rng);
    const draw = (seed: number) => {
      const e = engine(false, seed);
      e.onEvent('timer', { entityId: undefined } as FxPayload, 0);
      return e
        .cells(0, at)
        .map((c) => c.ch)
        .join('');
    };
    expect(draw(5)).toBe(draw(5));
    expect(JSON.stringify(state.rng)).toBe(before);
  });

  it('fxFrame never changes the game state (also with combat data)', () => {
    const state = createGame();
    const bus = new EventBus<GameEvents>();
    const loop = { mode: 'running' as const };
    const off = installFxLayer(bus, loop, { value: false }, 3);
    const fx = {
      engine: engine(false, 3),
      clock: new FxClock(),
      source: new CombatFxSource(),
      loop,
    };
    const snap = JSON.stringify(state);
    for (let t = 0; t < 2000; t += 16) fxFrame(fx, state, t);
    expect(JSON.stringify(state)).toBe(snap);
    off();
  });
});

describe('CombatFxSource (walka-m1 §8)', () => {
  const fake = () => {
    const ec = {
      id: 9,
      type: 'lineSentry',
      ai: 'chase',
      attack: null as null | { aim: { x: number; y: number }; target: string },
      shock: 0,
      hitFlash: 0,
    };
    const c = {
      enemies: new Map([[9, ec]]),
      events: [] as unknown[],
      drone: null,
      cfg: { TICK_MS: 50 },
    } as unknown as CombatData;
    const state = {
      tick: 0,
      player: { id: 1, x: 0, y: 0, glyph: { ch: '@', fg: '#fff' } },
      entities: [{ id: 9, x: 4, y: 0, glyph: { ch: 't', fg: '#f00' } }],
      map: { isSolid: () => false, tile: () => '.' },
    } as never as Parameters<CombatFxSource['poll']>[0];
    return { ec, c, state };
  };

  it('derives telegraphStart / strikeResolved / alert / Shock from state diffs', () => {
    const { ec, c, state } = fake();
    const s = new CombatFxSource();
    const rng = new Rng(1);
    expect(s.poll(state, c, 0, rng)).toEqual([]); // first poll = snapshot only
    ec.attack = { aim: { x: 0, y: 0 }, target: 'player' };
    ec.ai = 'alert';
    ec.shock = 10;
    (state as { tick: number }).tick = 1;
    const names = s.poll(state, c, 0, rng).map(([n]) => n);
    expect(names).toEqual(['telegraphStart', 'enemyAlert', 'statusApplied']);
    ec.attack = null;
    (state as { tick: number }).tick = 2;
    const strike = s.poll(state, c, 0, rng).find(([n]) => n === 'strikeResolved');
    expect(strike?.[1]).toMatchObject({ entityId: 9, kind: 'ranged', cells: [{ x: 0, y: 0 }] });
  });

  it('maps tick events and ignores the same tick twice', () => {
    const { c, state } = fake();
    const s = new CombatFxSource();
    const rng = new Rng(1);
    s.poll(state, c, 0, rng);
    (c as { events: unknown[] }).events = [
      { type: 'enemyKilled', enemyId: 9 },
      {
        type: 'dash',
        from: { x: 0, y: 0 },
        to: { x: 3, y: 0 },
        path: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
        ],
      },
    ];
    (state as { tick: number }).tick = 1;
    const out = s.poll(state, c, 0, rng);
    expect(out[0]).toEqual([
      'enemyKilled',
      { entityId: 9, cell: { x: 4, y: 0 }, glyph: 't', boss: false },
    ]);
    expect(out[1][1].cells).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
    expect(s.poll(state, c, 0, rng).filter(([n]) => n !== 'timer')).toEqual([]);
  });

  it('lineBetween excludes the ends', () => {
    expect(lineBetween({ x: 0, y: 0 }, { x: 3, y: 0 })).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ]);
  });
});
