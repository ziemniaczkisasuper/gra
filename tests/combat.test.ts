import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createGame, placePlayer, stepGame, type GameState } from '../src/core/game';
import { COMBAT } from '../src/data/combat-m0';
import { emptyActions, type ActionState } from '../src/input/actions';
import { getCombat, pickTarget, takeAutoPauseRequest } from '../src/combat/combat';
import { bfsFirstStep, inMeleeReach, lineOfSight } from '../src/combat/grid';
import { installCombat } from '../src/combat/install';
import { computeTicks, msToTicks } from '../src/combat/timing';
import type { CombatEvent } from '../src/combat/state';
import { parseMap } from '../src/world/tilemap';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const STEP = COMBAT.TICK_MS;
const T = computeTicks();

function act(o: { move?: [number, number]; attack?: boolean } = {}): ActionState {
  const a = emptyActions();
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  a.attack = !!o.attack;
  return a;
}

/** Runs n ticks; returns all combat events with the tick they happened in. */
function run(
  state: GameState,
  n: number,
  input: ActionState | ((i: number) => ActionState) = act(),
) {
  const out: Array<{ tick: number; ev: CombatEvent }> = [];
  for (let i = 0; i < n; i++) {
    const tick = state.tick;
    stepGame(state, typeof input === 'function' ? input(i) : input, STEP);
    for (const ev of getCombat(state).events) out.push({ tick, ev });
  }
  return out;
}

/** Entity ids are a process-wide counter, so two runs share logic but not ids. */
function scrubEvent(x: { tick: number; ev: CombatEvent }) {
  const ev = { ...x.ev } as CombatEvent & {
    enemyId?: number;
    entityId?: number;
    projectileId?: number;
    hitIds?: number[];
    hitId?: number | null;
  };
  if ('enemyId' in ev) ev.enemyId = 0;
  if ('entityId' in ev) ev.entityId = 0;
  if ('projectileId' in ev) ev.projectileId = 0;
  if (ev.hitIds) ev.hitIds = ev.hitIds.map(() => 0);
  if (typeof ev.hitId === 'number') ev.hitId = 0;
  return { tick: x.tick, ev };
}

const enemyOf = (s: GameState) => {
  const c = getCombat(s);
  const e = s.entities.find((x) => c.enemies.has(x.id))!;
  return { e, ec: c.enemies.get(e.id)! };
};

// 12x7 open room. Player '@' at (3,3); enemy 'E' placed per test.
function room(
  enemyX: number,
  enemyY = 3,
  extraRows?: (rows: string[]) => void,
  seed = 1,
): GameState {
  const rows = [
    '############',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '#..........#',
    '############',
  ].map((r) => r.split(''));
  rows[3]![3] = '@';
  rows[enemyY]![enemyX] = 'E';
  const text = rows.map((r) => r.join(''));
  extraRows?.(text);
  const s = createGame({ mapRows: text, seed });
  getCombat(s); // init now (dummy → crawler)
  return s;
}

describe('timing (§1.1, §1.14)', () => {
  it('converts ms to ticks with min 1', () => {
    expect(msToTicks(150, 50)).toBe(3);
    expect(msToTicks(20, 50)).toBe(1);
    expect(msToTicks(0, 50)).toBe(0);
    expect(T.playerWindup).toBe(2);
    expect(T.playerCooldown).toBe(6);
    expect(T.enemyWindup).toBe(10);
    expect(T.enemyCooldown).toBe(14);
  });
});

describe('grid helpers', () => {
  const { map } = parseMap(['#####', '#...#', '#.#.#', '#...#', '#####']);
  it('line of sight is blocked by walls', () => {
    expect(lineOfSight(map, { x: 1, y: 2 }, { x: 3, y: 2 })).toBe(false);
    expect(lineOfSight(map, { x: 1, y: 1 }, { x: 3, y: 1 })).toBe(true);
  });
  it('melee does not reach across a wall corner', () => {
    // Diagonal (1,1)→(2,2) with both orthogonal neighbours being walls.
    const m = parseMap(['####', '#.##', '##.#', '####']).map;
    expect(inMeleeReach(m, { x: 1, y: 1 }, { x: 2, y: 2 }, 1)).toBe(false);
    expect(inMeleeReach(map, { x: 1, y: 1 }, { x: 2, y: 1 }, 1)).toBe(true);
  });
  it('BFS walks around a pillar', () => {
    const step = bfsFirstStep(map, { x: 1, y: 2 }, { x: 3, y: 2 }, 20);
    expect(step).not.toBeNull();
    expect(step!.x === 0 && Math.abs(step!.y) === 1).toBe(true); // up or down, never into the wall
  });
});

describe('player attack (§1.3)', () => {
  it('a tap hits an adjacent enemy after the 100 ms wind-up, damage 8–12 (crit 12–18)', () => {
    const s = room(4);
    const { ec } = enemyOf(s);
    run(s, 1, act({ attack: true }));
    run(s, 1);
    expect(ec.hp).toBe(80); // wind-up: tick 0 and 1
    const ev = run(s, 1);
    const hit = ev.find((x) => x.ev.type === 'enemyHit');
    expect(hit?.tick).toBe(2); // blow lands at 100 ms
    const dmg = 80 - ec.hp;
    expect(dmg).toBeGreaterThanOrEqual(8);
    expect(dmg).toBeLessThanOrEqual(18);
  });

  it('damage rolls stay in range and ~10% are crits', () => {
    let crits = 0;
    const N = 300;
    for (let seed = 1; seed <= N; seed++) {
      const s = room(4, 3, undefined, seed);
      const ev = run(s, 3, (i) => act({ attack: i === 0 }));
      const hit = ev.find((x) => x.ev.type === 'enemyHit')!.ev as Extract<
        CombatEvent,
        { type: 'enemyHit' }
      >;
      if (hit.crit) {
        crits++;
        expect(hit.dmg).toBeGreaterThanOrEqual(12);
        expect(hit.dmg).toBeLessThanOrEqual(18);
      } else {
        expect(hit.dmg).toBeGreaterThanOrEqual(8);
        expect(hit.dmg).toBeLessThanOrEqual(12);
      }
    }
    expect(crits / N).toBeGreaterThan(0.04);
    expect(crits / N).toBeLessThan(0.18);
  });

  it('holding ATK auto-attacks every 400 ms (8 ticks) – cooldown', () => {
    const s = room(4);
    const ev = run(s, 25, act({ attack: true }));
    const ticks = ev.filter((x) => x.ev.type === 'enemyHit').map((x) => x.tick);
    expect(ticks.slice(0, 3)).toEqual([2, 10, 18]);
  });

  it('cannot move during wind-up (incl. the tick of the blow), can move in cooldown', () => {
    const s = room(4, 2); // enemy NE-ish so moving south is free
    run(s, 1, act({ attack: true }));
    run(s, 2, act({ move: [0, 1] }));
    expect(s.player.y).toBe(3); // ticks 1–2 blocked
    run(s, 1, act({ move: [0, 1] }));
    expect(s.player.y).toBe(4); // tick 3: attack cooldown, movement allowed
  });

  it('holding ATK swings at facing on the weapon cycle even with nothing in the arc', () => {
    const s = room(10, 1, (rows) => {
      rows[1] = rows[1]!.replace('E', '.');
    });
    const ev = run(s, 25, act({ attack: true }));
    const swings = ev.filter((x) => x.ev.type === 'playerSwing');
    expect(swings.map((x) => x.tick).slice(0, 3)).toEqual([2, 10, 18]);
    expect(ev.filter((x) => x.ev.type === 'enemyHit')).toHaveLength(0);
    expect(ev.filter((x) => x.ev.type === 'playerWhiff')).toHaveLength(0);
    const swing = swings[0]!.ev as Extract<CombatEvent, { type: 'playerSwing' }>;
    expect(swing.dir).toEqual({ x: 1, y: 0 });
    expect(swing.hitIds).toEqual([]);
  });

  it('ATK pressed in the last 150 ms of cooldown is queued', () => {
    const s = room(4);
    // blow at tick 2, cooldown 6 → free again at tick 8. Press at tick 6 (cooldown 2 left).
    const ev = run(s, 12, (i) => act({ attack: i === 0 || i === 6 }));
    const ticks = ev.filter((x) => x.ev.type === 'enemyHit').map((x) => x.tick);
    expect(ticks).toEqual([2, 10]);
  });

  it('a press too early in the cooldown is dropped', () => {
    const s = room(4);
    const ev = run(s, 14, (i) => act({ attack: i === 0 || i === 3 }));
    expect(ev.filter((x) => x.ev.type === 'enemyHit').map((x) => x.tick)).toEqual([2]);
  });

  it('auto-target prefers the facing direction on a tie', () => {
    const s = createGame({
      mapRows: ['#######', '#.....#', '#.E@E.#', '#.....#', '#######'],
      seed: 3,
    });
    const c = getCombat(s);
    s.player.facing = { x: -1, y: 0 };
    expect(pickTarget(s, c)!.x).toBe(2);
    s.player.facing = { x: 1, y: 0 };
    expect(pickTarget(s, c)!.x).toBe(4);
  });
});

describe('enemy AI (§1.6)', () => {
  it('detects in LOS, waits ALERT 300 ms, chases and starts a telegraphed attack', () => {
    const s = room(9);
    const { e, ec } = enemyOf(s);
    run(s, 1);
    expect(ec.ai).toBe('alert');
    run(s, T.enemyAlert - 1);
    expect(ec.ai).toBe('alert');
    run(s, 1);
    expect(ec.ai).toBe('chase');
    const start = e.x;
    run(s, 8);
    expect(e.x).toBeLessThan(start); // approaching
    run(s, 40);
    expect(Math.abs(e.x - s.player.x)).toBeLessThanOrEqual(1);
    expect(['attack']).toContain(ec.ai);
  });

  it('does not detect through walls', () => {
    const s = room(9, 3, (rows) => {
      for (let y = 1; y <= 5; y++) rows[y] = rows[y]!.slice(0, 6) + '#' + rows[y]!.slice(7);
    });
    run(s, 20);
    expect(enemyOf(s).ec.ai).toBe('idle');
  });

  it('enemy blow hits the frozen cell after 500 ms; stepping off dodges it', () => {
    // Stay: get hit.
    const a = room(4);
    const evA = run(a, 40);
    expect(evA.some((x) => x.ev.type === 'playerHit')).toBe(true);
    expect(getCombat(a).player.hp).toBeLessThan(100);

    // Dodge: step away as soon as the wind-up starts.
    const b = room(4);
    const { ec } = enemyOf(b);
    let dodged = false;
    const evB = run(b, 40, () => {
      if (ec.attack && !dodged) {
        dodged = true;
        return act({ move: [0, 1] });
      }
      return act();
    });
    const firstBlow = evB.find((x) => x.ev.type === 'playerHit' || x.ev.type === 'enemyMiss');
    expect(firstBlow?.ev.type).toBe('enemyMiss');
  });

  it('wind-up lasts 10 ticks, then 14 ticks cooldown (cycle 1200 ms)', () => {
    const s = room(4);
    const ev = run(s, 60);
    const blows = ev
      .filter((x) => x.ev.type === 'playerHit' || x.ev.type === 'enemyMiss')
      .map((x) => x.tick);
    expect(blows[1]! - blows[0]!).toBe(T.enemyWindup + T.enemyCooldown);
  });

  it('returns to spawn and heals when the player is beyond the leash', () => {
    const rows = [
      '#'.repeat(30),
      '#' + '.'.repeat(28) + '#',
      '#..@E' + '.'.repeat(24) + '#',
      '#' + '.'.repeat(28) + '#',
      '#'.repeat(30),
    ];
    const s = createGame({ mapRows: rows, seed: 9 });
    const { e, ec } = enemyOf(s);
    run(s, 3, act({ attack: true })); // hit it once → chase
    expect(ec.hp).toBeLessThan(80);
    placePlayer(s, 1, 1); // still in leash
    ec.spawn = { x: 25, y: 2 }; // pretend spawn is far away
    run(s, 1);
    placePlayer(s, 1, 3);
    // player farther than 12 from enemy → RETURN
    e.x = e.fromX = 20;
    run(s, 1);
    expect(ec.ai).toBe('return');
    run(s, 200);
    expect(ec.ai).toBe('idle');
    expect(ec.hp).toBe(80);
  });
});

describe('death (§1.8, §1.9)', () => {
  it('enemy dies, becomes a passable wreck and respawns only when the player is ≥ 8 away', () => {
    const s = room(4);
    const { e, ec } = enemyOf(s);
    const ev = run(s, 120, act({ attack: true }));
    expect(ev.some((x) => x.ev.type === 'enemyKilled')).toBe(true);
    expect(ec.ai).toBe('dead');
    expect(e.solid).toBe(false);
    expect(e.glyph.ch).toBe('%');
    expect(getCombat(s).stats.kills).toBe(1);
    run(s, T.enemyRespawn + 5);
    expect(ec.ai).toBe('dead'); // player is next to the spawn
    // Move player far away (map is small – widen check by moving spawn reference).
    ec.spawn = { x: 10, y: 5 };
    placePlayer(s, 1, 1);
    run(s, 1);
    expect(ec.ai).toBe('idle');
    expect(ec.hp).toBe(80);
    expect(e.solid).toBe(true);
  });

  it('player dies: freeze 500 ms + 3 s, body %, respawn at start with full HP, enemy reset', () => {
    const s = room(4);
    const c = getCombat(s);
    c.player.hp = 1;
    const ev = run(s, 30);
    const died = ev.find((x) => x.ev.type === 'playerDied');
    expect(died).toBeDefined();
    expect(c.death).not.toBeNull();
    expect(s.entities.some((x) => x.kind === 'corpse' && x.x === 3 && x.y === 3)).toBe(true);
    // world frozen: movement does nothing
    run(s, 3, act({ move: [0, 1] }));
    expect(s.player.y).toBe(3);
    let respawned = false;
    for (let i = 0; i < T.deathFreeze + T.respawn && !respawned; i++) {
      respawned = run(s, 1).some((x) => x.ev.type === 'playerRespawned');
    }
    expect(respawned).toBe(true);
    expect(s.player.x).toBe(3);
    expect(c.death).toBeNull();
    expect(getCombat(s).player.hp).toBe(100);
    expect(enemyOf(s).ec.ai).toBe('idle');
    expect(enemyOf(s).ec.hp).toBe(80);
    expect(getCombat(s).stats.deaths).toBe(1);
  });

  it('tie in the same tick: the player blow resolves first and a killed enemy does not strike', () => {
    const s = room(4);
    const c = getCombat(s);
    const { e, ec } = enemyOf(s);
    ec.hp = 1;
    ec.ai = 'attack';
    ec.attack = { aim: { x: 3, y: 3 }, target: 'player' };
    e.attackWindup = 3;
    c.player.attack = { dir: { x: 1, y: 0 }, aimCell: null, target: null };
    s.player.attackWindup = 3;
    run(s, 3);
    expect(ec.ai).toBe('dead');
    expect(c.player.hp).toBe(100);
  });
});

describe('misc', () => {
  it('is deterministic for the same seed and inputs', () => {
    const script = (i: number) =>
      act({ attack: i % 3 === 0, move: i % 17 === 5 ? [0, 1] : undefined });
    const a = room(8, 4, undefined, 77);
    const b = room(8, 4, undefined, 77);
    const norm = (x: { tick: number; ev: CombatEvent }) => JSON.stringify(scrubEvent(x));
    const ea = run(a, 300, script).map(norm);
    const eb = run(b, 300, script).map(norm);
    expect(ea).toEqual(eb);
  });

  it('auto-pause trigger D: hit after ≥ 2 s without input requests a pause', () => {
    const s = room(4);
    run(s, T.autopauseIdleHit + 20);
    expect(takeAutoPauseRequest(s)).toBe(true);
    expect(takeAutoPauseRequest(s)).toBe(false);
  });

  it('regenerates 5 HP/s after 5 s out of combat', () => {
    const s = room(10, 1, (rows) => {
      for (let y = 1; y <= 5; y++) rows[y] = rows[y]!.slice(0, 6) + '#' + rows[y]!.slice(7);
    });
    const c = getCombat(s);
    c.player.hp = 50;
    c.player.lastCombatTick = s.tick;
    run(s, T.regenDelay);
    expect(c.player.hp).toBe(50);
    run(s, 20); // 1 s
    expect(c.player.hp).toBe(55);
  });
});
