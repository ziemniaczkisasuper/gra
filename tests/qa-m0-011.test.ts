// QA-M0-011 regression: a game loaded from a save starts paused – no tick before RESUME.
// Scenario from the report: fight, enemy wind-up in flight (≤ 3 ticks to the blow), save,
// reload, 2 s without input → HP unchanged; RESUME runs the 1.0 s countdown first.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCombat } from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import { EventBus, type GameEvents } from '../src/core/events';
import { stepGame, type GameState } from '../src/core/game';
import { GameLoop } from '../src/core/loop';
import { M0 } from '../src/data/mechanics-m0';
import { emptyActions } from '../src/input/actions';
import { gameFromSave, memoryStore, readSave, snapshot, writeSave } from '../src/save';
import { loadGame, startGameLoop } from '../src/save/boot';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

/** Fight on the real arena until an enemy blow is 1–3 ticks away. */
function fightBeforeBlow(): GameState {
  const s = gameFromSave(readSave(memoryStore()));
  const c = getCombat(s);
  const enemy = s.entities.find((e) => c.enemies.has(e.id))!;
  s.player.x = s.player.fromX = enemy.x - 1;
  s.player.y = s.player.fromY = enemy.y;
  for (let i = 0; i < 600; i++) {
    stepGame(s, emptyActions(), M0.TICK_MS);
    if (enemy.attackWindup > 0 && enemy.attackWindup <= 3 && c.player.hp < 100) return s;
  }
  throw new Error('no wind-up reached');
}

function boot(store: ReturnType<typeof memoryStore>) {
  const loaded = loadGame(store);
  const bus = new EventBus<GameEvents>();
  let ticks = 0;
  const loop = new GameLoop({
    stepMs: M0.TICK_MS,
    countdownMs: M0.RESUME_COUNTDOWN_MS,
    events: bus,
    update: (dt) => {
      ticks++;
      stepGame(loaded.state, emptyActions(), dt);
    },
    render: () => {},
  });
  startGameLoop(loop, loaded.fromSave);
  let now = 0;
  const run = (ms: number) => {
    for (const end = now + ms; now < end; now += 16) loop.frame(now);
  };
  return { loaded, loop, run, ticks: () => ticks };
}

describe('QA-M0-011: loaded game starts paused', () => {
  it('enemy 1–3 ticks before the blow, reload, 2 s without input: HP unchanged, 0 ticks', () => {
    const s = fightBeforeBlow();
    const hp = getCombat(s).player.hp;
    const store = memoryStore();
    writeSave(store, snapshot(s, 1));

    const b = boot(store);
    expect(b.loaded.fromSave).toBe(true);
    expect(b.loop.mode).toBe('paused');
    expect(b.loop.pauseReason).toBe('auto');
    b.run(2000);
    expect(b.ticks()).toBe(0);
    expect(getCombat(b.loaded.state).player.hp).toBe(hp);

    // RESUME → 1.0 s countdown, still no tick; then the simulation runs (and the blow lands)
    b.loop.resume();
    expect(b.loop.mode).toBe('countdown');
    b.run(900);
    expect(b.ticks()).toBe(0);
    b.run(600);
    expect(b.loop.mode).toBe('running');
    expect(b.ticks()).toBeGreaterThan(0);
  });

  it('a new game (empty store) starts running', () => {
    const b = boot(memoryStore());
    expect(b.loaded.fromSave).toBe(false);
    expect(b.loop.mode).toBe('running');
    b.run(200);
    expect(b.ticks()).toBeGreaterThan(0);
  });
});
