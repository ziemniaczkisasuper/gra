// Combat changes for mechaniki-m1.md v0.4: telegraph look (§1.7 / GRAF §9), config (ARENA_SIZE),
// M1 rules behind config (§2.5 accumulator, §2.6 bump, §2.11 depth + armour + Panel Drone,
// §2.13 no regen) and the single combat RNG helper.
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createGame, stepGame, type GameState } from '../src/core/game';
import {
  COMBAT,
  COMBAT_M0,
  COMBAT_M1,
  COMBAT_STRINGS,
  ENEMY_TYPES,
  type CombatConfig,
} from '../src/data/combat-m0';
import { ARENA_M0 } from '../src/data/maps';
import { COMBAT_STYLE, PALETTE } from '../src/data/style';
import { emptyActions, type ActionState } from '../src/input/actions';
import {
  applyArmor,
  combatRng,
  enemyDamage,
  enemyMaxHp,
  getCombat,
  setCombatReduceMotion,
  spawnEnemy,
  type CombatInitOptions,
} from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import { accumulateTicks, computeTicks } from '../src/combat/timing';
import type { CombatEvent } from '../src/combat/state';
import type { Entity } from '../src/entities/entity';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());
afterEach(() => setCombatReduceMotion(false));

const STEP = COMBAT.TICK_MS;
const T = computeTicks();

function act(o: { move?: [number, number]; attack?: boolean } = {}): ActionState {
  const a = emptyActions();
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  a.attack = !!o.attack;
  return a;
}

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

/** 12x7 room, player at (3,3); `marks` = extra map chars {x,y,ch} ('E' = crawler, '#' = wall). */
function room(
  marks: Array<[number, number, string]>,
  opts: CombatInitOptions = {},
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
  for (const [x, y, ch] of marks) rows[y]![x] = ch;
  const s = createGame({ mapRows: rows.map((r) => r.join('')), seed });
  getCombat(s, opts);
  return s;
}

const enemyAt = (s: GameState, x: number, y: number) => {
  const c = getCombat(s);
  const e = s.entities.find((q) => c.enemies.has(q.id) && q.x === x && q.y === y)!;
  return { e, ec: c.enemies.get(e.id)! };
};
const hits = (ev: Array<{ tick: number; ev: CombatEvent }>) =>
  ev.filter((x) => x.ev.type === 'enemyHit') as Array<{
    tick: number;
    ev: Extract<CombatEvent, { type: 'enemyHit' }>;
  }>;

describe('config (v0.4)', () => {
  it('ARENA_SIZE lives in data and matches the ARENA_M0 map (40 × 20)', () => {
    expect(COMBAT.ARENA_COLS).toBe(40);
    expect(COMBAT.ARENA_ROWS).toBe(20);
    expect(ARENA_M0.length).toBe(COMBAT.ARENA_ROWS);
    for (const row of ARENA_M0) expect(row.length).toBe(COMBAT.ARENA_COLS);
  });
  it('the character is always Hunter 47 (no hunterName(n))', () => {
    expect(COMBAT_STRINGS.hunterTitle).toBe('HUNTER 47');
    expect('hunterName' in COMBAT_STRINGS).toBe(false);
  });
  it('profiles: M0 has regen and no bump, M1 has bump and no regen', () => {
    expect(COMBAT_M0.BUMP_ATTACK_ENABLED).toBe(false);
    expect(COMBAT_M0.PLAYER_REGEN_PER_S).toBeGreaterThan(0);
    expect(COMBAT_M1.BUMP_ATTACK_ENABLED).toBe(true);
    expect(COMBAT_M1.PLAYER_REGEN_PER_S).toBe(0);
  });
});

describe('telegraph look (§1.7, GRAF §9)', () => {
  it('wind-up: one enemy glyph (no c→C), inverted cell; target cell = x on dark magenta', () => {
    const s = room([[4, 3, 'E']]);
    const { e, ec } = enemyAt(s, 4, 3);
    let guard = 0; // run until the first wind-up starts
    while (!ec.attack && guard++ < 100) run(s, 1);
    expect(ec.attack).not.toBeNull();
    expect(e.glyph.ch).toBe('c');
    if (ec.hitFlash === 0) {
      expect(e.glyph.bg).toBe(PALETTE.enemy);
      expect(e.glyph.fg).toBe(PALETTE.background);
    }
    // Player steps off the frozen cell → a standalone 'x' marker stays on it.
    run(s, 1, act({ move: [0, 1] }));
    expect(ec.attack).not.toBeNull();
    const marker = s.entities.find((q) => q.kind === 'combat-fx' && q.x === 3 && q.y === 3);
    expect(marker?.glyph.ch).toBe('x');
    expect(marker?.glyph.bg).toBe('#4A1240');
    expect(marker?.glyph.fg).toBe(PALETTE.enemy);
  });

  it('the player glyph alternates with x while standing on the target; Reduce motion = steady x', () => {
    const watch = (reduce: boolean) => {
      setCombatReduceMotion(reduce);
      const s = room([[4, 3, 'E']]);
      const { ec } = enemyAt(s, 4, 3);
      const seen = new Set<string>();
      for (let i = 0; i < 60; i++) {
        run(s, 1);
        if (ec.attack) seen.add(s.player.glyph.ch);
      }
      return seen;
    };
    expect(watch(false)).toEqual(new Set(['x', '@']));
    expect(watch(true)).toEqual(new Set(['x']));
  });

  it('no enemy glyph style uses uppercase', () => {
    for (const g of Object.values(COMBAT_STYLE.enemy)) expect(g.ch).toBe(g.ch.toLowerCase());
  });
});

describe('tick accumulator for speed affixes (§2.5)', () => {
  it('−10% of a 400 ms cycle (8 ticks) averages exactly 7.2 ticks', () => {
    let carry = 0;
    let sum = 0;
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i++) {
      const r = accumulateTicks(400 * 0.9, 50, carry);
      carry = r.carry;
      sum += r.ticks;
      seen.add(r.ticks);
      expect(Math.abs(carry)).toBeLessThanOrEqual(0.5);
    }
    expect(sum).toBe(7200);
    expect(seen).toEqual(new Set([7, 8]));
    // Without the accumulator −10% would round to 7 every time (−12.5%).
    expect(accumulateTicks(360, 50, 0, false)).toEqual({ ticks: 7, carry: 0 });
  });
  it('exact multiples keep carry 0; minimum 1 tick drops the debt', () => {
    expect(accumulateTicks(400, 50, 0)).toEqual({ ticks: 8, carry: 0 });
    expect(accumulateTicks(10, 50, 0)).toEqual({ ticks: 1, carry: -0.5 });
  });

  it('player attack with −10% attack time: average cycle 7.2 ticks in the real loop', () => {
    const s = room([[4, 3, 'E']]);
    const c = getCombat(s);
    const { ec } = enemyAt(s, 4, 3);
    ec.hp = ec.maxHp = 1e9;
    c.player.hp = c.player.maxHp = 1e9;
    c.player.attackTimeMod = -0.1;
    const h = hits(run(s, 2000, act({ attack: true })));
    const avg = (h[h.length - 1]!.tick - h[0]!.tick) / (h.length - 1);
    expect(Math.abs(avg - 7.2)).toBeLessThan(0.02);
  });

  it('player move with −10% move time: 150 ms steps average 2.7 ticks', () => {
    const rows = ['#'.repeat(62), '#@' + '.'.repeat(59) + '#', '#'.repeat(62)];
    const s = createGame({ mapRows: rows, seed: 3 });
    const c = getCombat(s);
    c.player.moveTimeMod = -0.1;
    let steps = 0;
    let last = s.player.x;
    let ticks = 0;
    while (steps < 50) {
      run(s, 1, act({ move: [1, 0] }));
      ticks++;
      if (s.player.x !== last) {
        steps++;
        last = s.player.x;
      }
    }
    // 50 steps: first step at tick 0, the rest after 49 cooldowns ≈ 49 × 2.7 = 132.3
    expect(Math.abs(ticks - 1 - 49 * 2.7)).toBeLessThanOrEqual(1);
  });
});

describe('bump attack (§2.6)', () => {
  const m1: CombatInitOptions = { cfg: COMBAT_M1 };

  it('M1: stepping into an enemy attacks it (100 ms wind-up), the player does not move', () => {
    const s = room([[4, 3, 'E']], m1);
    const { ec } = enemyAt(s, 4, 3);
    const ev = run(s, 3, (i) => (i === 0 ? act({ move: [1, 0] }) : act()));
    expect(hits(ev)[0]?.tick).toBe(2);
    expect(ec.hp).toBeLessThan(80);
    expect(s.player.x).toBe(3);
  });

  it('M1: start of a bump attack sets no moveCooldown and sets facing', () => {
    const s = room([[3, 4, 'E']], m1);
    run(s, 1, act({ move: [0, 1] }));
    expect(getCombat(s).player.attack).not.toBeNull();
    expect(s.player.facing).toEqual({ x: 0, y: 1 });
    expect(s.player.moveCooldown).toBe(0);
  });

  it('M0: a step into an enemy only turns the player (no attack)', () => {
    const s = room([[4, 3, 'E']]);
    const ev = run(s, 5, act({ move: [1, 0] }));
    expect(hits(ev)).toHaveLength(0);
  });

  it('bump overrides the auto-target (and held ATK)', () => {
    // East enemy is in `facing` (auto-target choice); bump goes south.
    const s = room(
      [
        [4, 3, 'E'],
        [3, 4, 'E'],
      ],
      m1,
    );
    const south = enemyAt(s, 3, 4);
    const ev = run(s, 3, (i) => (i === 0 ? act({ move: [0, 1], attack: true }) : act()));
    expect(hits(ev)[0]?.ev.enemyId).toBe(south.e.id);
  });

  it('holding the direction = continuous attack at weapon speed (8 ticks)', () => {
    const s = room([[4, 3, 'E']], m1);
    const { ec } = enemyAt(s, 4, 3);
    ec.hp = ec.maxHp = 1e6;
    getCombat(s).player.hp = 1e6;
    const h = hits(run(s, 60, act({ move: [1, 0] })));
    expect(h.length).toBeGreaterThanOrEqual(6);
    for (let i = 1; i < h.length; i++)
      expect(h[i]!.tick - h[i - 1]!.tick).toBe(T.playerWindup + T.playerCooldown);
    expect(s.player.x).toBe(3);
  });

  it('bump in the last 150 ms of cooldown is queued; earlier is ignored', () => {
    const s = room([[4, 3, 'E']], m1);
    run(s, 1, act({ attack: true })); // ATK tap
    run(s, T.playerWindup); // blow lands, cooldown 6 ticks starts
    const cd = s.player.attackCooldown;
    expect(cd).toBe(T.playerCooldown - 1); // step 6 already ran in the blow tick
    // early bump (cooldown > 3) → ignored, then release
    run(s, 1, act({ move: [1, 0] }));
    run(s, 1);
    expect(getCombat(s).player.atkQueued).toBe(false);
    while (s.player.attackCooldown > T.atkQueue) run(s, 1);
    run(s, 1, act({ move: [1, 0] })); // queued
    expect(getCombat(s).player.atkQueued).toBe(true);
    const ev = run(s, T.atkQueue + T.playerWindup + 1);
    expect(hits(ev)).toHaveLength(1);
  });

  it('diagonal bump across a wall corner does not attack', () => {
    const s = room(
      [
        [4, 4, 'E'],
        [4, 3, '#'],
        [3, 4, '#'],
      ],
      m1,
    );
    const ev = run(s, 5, act({ move: [1, 1] }));
    expect(hits(ev)).toHaveLength(0);
  });
});

describe('no regeneration in M1 (§2.13)', () => {
  it('HP stays put out of combat with the M1 profile', () => {
    const s = room(
      [1, 2, 3, 4, 5].map((y) => [6, y, '#'] as [number, number, string]).concat([[10, 1, 'E']]),
      { cfg: COMBAT_M1 },
    );
    const c = getCombat(s);
    c.player.hp = 50;
    run(s, T.regenDelay + 200);
    expect(c.player.hp).toBe(50);
  });
});

describe('depth multipliers (§2.11)', () => {
  it('enemy HP ×1 / ×1.5 / ×2.2 by depth (Crawler 80, Panel Drone 40)', () => {
    const hp = (depth: number) => {
      const s = room([[9, 3, 'E']], { depth });
      const c = getCombat(s);
      return [enemyAt(s, 9, 3).ec.maxHp, enemyMaxHp(c, 'panelDrone')];
    };
    expect(hp(1)).toEqual([80, 40]);
    expect(hp(2)).toEqual([120, 60]);
    expect(hp(3)).toEqual([176, 88]);
  });
  it('enemy damage ×1 / ×1.25 / ×1.5 (rounded); boss ignores depth', () => {
    const dmg = (depth: number, roll: number, ignoresDepth = false) => {
      const c = getCombat(room([], { depth }));
      return enemyDamage(c, { ...ENEMY_TYPES.crawler, ignoresDepth }, roll);
    };
    expect([dmg(1, 12), dmg(2, 12), dmg(3, 12)]).toEqual([12, 15, 18]);
    expect(dmg(2, 18)).toBe(23); // 22.5 → 23
    expect(dmg(3, 12, true)).toBe(12);
  });
  it('real enemy blows at depth 3 land in 18–27', () => {
    const s = room([[4, 3, 'E']], { depth: 3 });
    const c = getCombat(s);
    c.player.hp = c.player.maxHp = 1e6;
    const dmgs = run(s, 600)
      .filter((x) => x.ev.type === 'playerHit')
      .map((x) => (x.ev as { dmg: number }).dmg);
    expect(dmgs.length).toBeGreaterThan(10);
    for (const d of dmgs) {
      expect(d).toBeGreaterThanOrEqual(18);
      expect(d).toBeLessThanOrEqual(27);
    }
  });
});

describe('armour (§2.11): DR = A/(A+100), max 60 %, min 1', () => {
  const cfg: CombatConfig = COMBAT;
  it('formula, cap, floor and minimum', () => {
    expect(applyArmor(15, 0, cfg)).toBe(15);
    expect(applyArmor(15, 100, cfg)).toBe(7); // 50 % → 7.5 → 7
    expect(applyArmor(15, 25, cfg)).toBe(12); // 20 % → 12
    expect(applyArmor(15, 1000, cfg)).toBe(6); // 90.9 % capped to 60 % → 6
    expect(applyArmor(1, 1000, cfg)).toBe(1);
    expect(applyArmor(2, 150, cfg)).toBe(1); // 60 % of 2 → 0.8 → floor 0 → min 1
  });
  it('applies to enemy blows on the player', () => {
    const s = room([[4, 3, 'E']], { playerArmor: 100 });
    const c = getCombat(s);
    c.player.hp = c.player.maxHp = 1e6;
    const dmgs = run(s, 300)
      .filter((x) => x.ev.type === 'playerHit')
      .map((x) => (x.ev as { dmg: number }).dmg);
    expect(dmgs.length).toBeGreaterThan(3);
    for (const d of dmgs) {
      expect(d).toBeGreaterThanOrEqual(6); // floor(12 × 0.5)
      expect(d).toBeLessThanOrEqual(9); // floor(18 × 0.5)
    }
  });
});

describe('Panel Drone (§2.11 `d`)', () => {
  it('moves every 200 ms (4 ticks), wind-up 400 ms, glyph d, 40 HP', () => {
    // 1-cell corridor → straight steps only.
    const s = createGame({
      mapRows: ['#'.repeat(16), '#@' + '.'.repeat(13) + '#', '#'.repeat(16)],
      seed: 2,
    });
    getCombat(s);
    const d: Entity = spawnEnemy(s, 'panelDrone', { x: 9, y: 1 });
    const ec = getCombat(s).enemies.get(d.id)!;
    expect(d.glyph.ch).toBe('d');
    expect(ec.maxHp).toBe(40);
    const moves: number[] = [];
    let x = d.x;
    let windStart = -1;
    let blow = -1;
    for (let i = 0; i < 80; i++) {
      const ev = run(s, 1);
      if (d.x !== x) {
        moves.push(s.tick);
        x = d.x;
      }
      if (ec.attack && windStart < 0) windStart = s.tick - 1;
      if (blow < 0 && ev.some((q) => q.ev.type === 'playerHit' || q.ev.type === 'enemyMiss'))
        blow = s.tick - 1;
    }
    expect(moves.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < moves.length; i++) expect(moves[i]! - moves[i - 1]!).toBe(4);
    expect(blow - windStart).toBe(8);
  });
});

describe('combat RNG goes through combatRng(state) = stream("combat")', () => {
  it('draws from other streams / the base generator do not change combat', () => {
    const script = (i: number) => act({ attack: i % 3 === 0 });
    const a = room([[4, 3, 'E']], {}, 5);
    const b = room([[4, 3, 'E']], {}, 5);
    for (let i = 0; i < 100; i++) {
      b.rng.next();
      b.rng.stream('loot').next();
    }
    const norm = (x: { tick: number; ev: CombatEvent }) =>
      JSON.stringify({ ...x, ev: { ...x.ev, enemyId: 0 } });
    expect(run(a, 400, script).map(norm)).toEqual(run(b, 400, script).map(norm));
    expect(combatRng(a)).toBe(a.rng.stream('combat'));
  });
});
