// M1 combat round (mechaniki-m1.md v0.5, balans-m1.md v1.1): 4 enemies, attack tokens, skills
// Dash / Shock Pulse / Buddy Drone, damage order, no respawn in M1, setCombatProfile, evacuation
// tile `<`, DIAG_GRACE vs bump, S12 death cause, QA-M0-003 / QA-M0-004, CombatSave v2.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as core from '../src/core/game';
import { createGame, placePlayer, stepGame, type GameState } from '../src/core/game';
import {
  COMBAT,
  COMBAT_M0,
  COMBAT_M1,
  ENEMY_TYPES,
  RAIL_GUARDIAN,
  type CombatConfig,
  type EnemyTypeId,
} from '../src/data/combat-m0';
import { DEFAULT_MAP, MAPS } from '../src/data/maps';
import { COMBAT_STYLE } from '../src/data/style';
import { emptyActions, type ActionState } from '../src/input/actions';
import { setCell, type Entity } from '../src/entities/entity';
import {
  computeDamage,
  DRONE_KIND,
  droneEntity,
  droneField,
  enemyTicks,
  fieldAt,
  getBossChargeLane,
  getCombat,
  getCombatDeath,
  getCombatHud,
  inDiagGrace,
  isPlayerEvacuated,
  mapSpawn,
  peekCombat,
  setCombatProfile,
  spawnEnemy,
} from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import type { CombatEvent } from '../src/combat/state';
import { parseMap } from '../src/world/tilemap';
import {
  gameFromSave,
  memoryStore,
  parseSaveText,
  readSave,
  saveToJson,
  snapshot,
  writeSave,
} from '../src/save';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const TICK = COMBAT.TICK_MS;
type Ev = { tick: number; ev: CombatEvent };

interface In {
  move?: [number, number];
  attack?: boolean;
  skill?: 1 | 2 | 3;
}
function act(o: In = {}): ActionState {
  const a = emptyActions();
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  a.attack = !!o.attack;
  if (o.skill === 1) a.skill1 = true;
  if (o.skill === 2) a.skill2 = true;
  if (o.skill === 3) a.skill3 = true;
  return a;
}
function run(s: GameState, n: number, input: In | ((i: number) => In) = {}): Ev[] {
  const out: Ev[] = [];
  for (let i = 0; i < n; i++) {
    const tick = s.tick;
    stepGame(s, act(typeof input === 'function' ? input(i) : input), TICK);
    for (const ev of getCombat(s).events) out.push({ tick, ev });
  }
  return out;
}
const of = <T extends CombatEvent['type']>(ev: Ev[], type: T) =>
  ev.filter((x) => x.ev.type === type) as Array<{
    tick: number;
    ev: Extract<CombatEvent, { type: T }>;
  }>;

/** 14×9 room, player at (3,4); marks = extra map chars. */
function room(
  marks: Array<[number, number, string]> = [],
  cfg: CombatConfig = COMBAT_M1,
  seed = 1,
) {
  const rows = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 14 }, (_, x): string =>
      y === 0 || y === 8 || x === 0 || x === 13 ? '#' : '.',
    ),
  );
  rows[4]![3] = '@';
  for (const [x, y, ch] of marks) rows[y]![x] = ch;
  const s = createGame({ mapRows: rows.map((r) => r.join('')), seed });
  getCombat(s, { cfg, profile: cfg === COMBAT_M1 ? 'm1' : undefined });
  return s;
}
const ec = (s: GameState, e: Entity) => getCombat(s).enemies.get(e.id)!;
const resetMoveMemory = (core as Record<string, unknown>).resetPlayerMoveMemory as
  ((s: GameState) => void) | undefined;
function saveLoad(s: GameState, rows?: readonly string[]) {
  resetMoveMemory?.(s); // the pause before every save resets the engine's step memory
  return gameFromSave(parseSaveText(saveToJson(snapshot(s, 1))), rows ? { mapRows: rows } : {});
}

// ---- data rules ----------------------------------------------------------------------------

describe('data (v0.5 §1.14, §2.11, §2.16)', () => {
  it('every enemy type: wind-up − 1 tick ≥ 400 ms, at every depth', () => {
    expect(COMBAT_M1.ENEMY_WINDUP_MIN_MS).toBe(450);
    for (const depth of [1, 2, 3] as const) {
      const s = room();
      setCombatProfile(s, 'm1', depth);
      const c = getCombat(s);
      for (const id of Object.keys(ENEMY_TYPES) as EnemyTypeId[]) {
        expect(ENEMY_TYPES[id].windupMs - TICK, id).toBeGreaterThanOrEqual(400);
        expect(enemyTicks(c, id).windup * TICK - TICK, id).toBeGreaterThanOrEqual(400);
      }
    }
  });
  it('a wind-up tuned below the minimum is raised to ENEMY_WINDUP_MIN_MS (9 ticks)', () => {
    const s = room([], { ...COMBAT_M0, ENEMY_ATK_WINDUP_MS: 300 });
    expect(enemyTicks(getCombat(s), 'crawler').windup).toBe(9);
  });
  it('v0.5 wind-ups: Drone 450, Scrapper 450, Guard 600, Sentry 700; Drone diagonal 300', () => {
    expect(ENEMY_TYPES.panelDrone.windupMs).toBe(450);
    expect(ENEMY_TYPES.scrapper.windupMs).toBe(450);
    expect(ENEMY_TYPES.curfewGuard.windupMs).toBe(600);
    expect(ENEMY_TYPES.lineSentry.windupMs).toBe(700);
    expect(enemyTicks(getCombat(room()), 'panelDrone').moveDiag).toBe(6);
  });
  it('boss values live in data (not implemented yet); boss wind-ups obey the rule', () => {
    expect(RAIL_GUARDIAN.BOSS_HP).toBe(2400);
    expect([RAIL_GUARDIAN.BOSS_DMG_MIN, RAIL_GUARDIAN.BOSS_DMG_MAX]).toEqual([20, 32]);
    expect(RAIL_GUARDIAN.BOSS_SWING_WINDUP_MS).toBe(800);
    expect(RAIL_GUARDIAN.BOSS_SWING_RECOVERY_MS).toBe(1200);
    expect(RAIL_GUARDIAN.BOSS_CHARGE_TICKS_PER_CELL).toBe(2);
    expect(RAIL_GUARDIAN.BOSS_SUMMON_MS).toBe(600);
    expect(RAIL_GUARDIAN.SUMMON_ACTIVATE_MS).toBe(500);
    for (const ms of [RAIL_GUARDIAN.BOSS_SWING_WINDUP_MS, RAIL_GUARDIAN.BOSS_CHARGE_WINDUP_MS])
      expect(ms - TICK).toBeGreaterThanOrEqual(400);
    expect(getBossChargeLane(room())).toBeNull();
  });
  it('M1 profile: no respawn, skills and tokens on; death screen timings in data', () => {
    expect(COMBAT_M1.ENEMY_RESPAWN_ENABLED).toBe(false);
    expect(COMBAT_M0.ENEMY_RESPAWN_ENABLED).toBe(true);
    expect(COMBAT_M1.SKILLS_ENABLED && COMBAT_M1.ATTACK_TOKENS_ENABLED).toBe(true);
    expect([COMBAT_M1.DEATH_SCREEN_MIN_MS, COMBAT_M1.DEATH_SCREEN_AUTO_MS]).toEqual([1500, 5000]);
  });
});

// ---- damage order (§2.11, Mechanika) -------------------------------------------------------

describe('damage order: roll → crit ×1.5 (floor) → ×depth (round) → armour (floor, min 1)', () => {
  it('crit before depth before armour', () => {
    // 10 → 15 → round(22.5) = 23 → floor(23 × 100/121) = 19 (depth-first would give 18)
    expect(computeDamage(10, { crit: true, depthMult: 1.5, armor: 21 }, COMBAT_M1)).toBe(19);
    expect(computeDamage(10, { crit: true, depthMult: 1.5 }, COMBAT_M1)).toBe(23);
    expect(computeDamage(10, { crit: true, depthMult: 1.5, armor: 1e6 }, COMBAT_M1)).toBe(9); // cap 60 %
    expect(computeDamage(1, { armor: 100 }, COMBAT_M1)).toBe(1); // min 1
  });
});

// ---- enemies -------------------------------------------------------------------------------

/** Ticks from wind-up start to the blow (enemy standing next to a still player). */
function windupTicks(type: EnemyTypeId, at: [number, number]) {
  const s = room();
  const e = spawnEnemy(s, type, { x: at[0], y: at[1] });
  let start = -1;
  for (let i = 0; i < 300; i++) {
    const ev = run(s, 1);
    if (start < 0 && ec(s, e).attack) start = s.tick - 1;
    const b = ev.find((x) => x.ev.type === 'playerHit' || x.ev.type === 'enemyMiss');
    if (start >= 0 && b) return { ticks: b.tick - start, ev: b.ev, e, s };
  }
  throw new Error('no blow');
}

describe('M1 enemies (§2.11)', () => {
  it('Curfew Guard h: 120 HP, wind-up 600 ms (12 ticks), 14–20 damage', () => {
    const r = windupTicks('curfewGuard', [4, 4]);
    expect(r.e.glyph.ch).toBe('h');
    expect(ec(r.s, r.e).maxHp).toBe(120);
    expect(r.ticks).toBe(12);
    expect(r.ev.type).toBe('playerHit');
    const dmg = (r.ev as { dmg: number }).dmg;
    expect(dmg).toBeGreaterThanOrEqual(14);
    expect(dmg).toBeLessThanOrEqual(20);
  });
  it('Scrapper s: 30 HP, wind-up 450 ms (9 ticks), 4–6 damage', () => {
    const r = windupTicks('scrapper', [4, 4]);
    expect(r.e.glyph.ch).toBe('s');
    expect(ec(r.s, r.e).maxHp).toBe(30);
    expect(r.ticks).toBe(9);
  });
  it('Line Sentry t: never moves, shoots the FROZEN cell (ranged marker), 700 ms wind-up', () => {
    const s = room();
    const t = spawnEnemy(s, 'lineSentry', { x: 8, y: 4 });
    expect(t.glyph.ch).toBe('t');
    let guard = 0;
    while (!ec(s, t).attack && guard++ < 200) run(s, 1);
    const a = ec(s, t).attack!;
    expect(a.target).toBe('player');
    expect(a.aim).toEqual({ x: 3, y: 4 });
    run(s, 1, { move: [0, -1] }); // step off the frozen cell
    const marker = s.entities.find(
      (e) => e.x === 3 && e.y === 4 && e.glyph.bg === COMBAT_STYLE.rangedTargetCell.bg,
    );
    expect(marker).toBeDefined();
    const ev = run(s, 20);
    expect(of(ev, 'enemyMiss').length).toBe(1);
    expect(of(ev, 'playerHit').length).toBe(0);
    expect(getCombat(s).player.hp).toBe(100);
    expect([t.x, t.y]).toEqual([8, 4]);
  });
  it('Line Sentry 700 ms: 14 ticks from wind-up to the shot', () => {
    expect(windupTicks('lineSentry', [8, 4]).ticks).toBe(14);
  });
  it('Line Sentry needs line of sight (wall between → no shot)', () => {
    const s = room([
      [6, 3, '#'],
      [6, 4, '#'],
      [6, 5, '#'],
    ]);
    const t = spawnEnemy(s, 'lineSentry', { x: 9, y: 4 });
    for (let i = 0; i < 120; i++) {
      run(s, 1);
      expect(ec(s, t).attack).toBeNull();
    }
  });
  it('Scrapper group: an idle Scrapper that only sees its mate wakes with it', () => {
    // B at (7,2) has no LOS to the player (wall (5,3)) but sees A at (7,4).
    const s = room([
      [5, 2, '#'],
      [5, 3, '#'],
      [6, 2, '#'],
      [6, 3, '#'],
    ]);
    const a = spawnEnemy(s, 'scrapper', { x: 7, y: 4 });
    const b = spawnEnemy(s, 'scrapper', { x: 7, y: 2 });
    let guard = 0;
    while (ec(s, a).ai === 'idle' && guard++ < 100) run(s, 1);
    expect(ec(s, a).ai).not.toBe('idle');
    expect(ec(s, b).ai).not.toBe('idle');
  });
  it('M1: killed enemies do not respawn (wreck stays), also after the player respawns', () => {
    const s = room();
    const e = spawnEnemy(s, 'scrapper', { x: 4, y: 4 });
    ec(s, e).hp = 1;
    const ev = run(s, 40, { attack: true });
    expect(of(ev, 'enemyKilled').length).toBe(1);
    run(s, Math.ceil(COMBAT_M1.ENEMY_RESPAWN_MS / TICK) + 40);
    expect(ec(s, e).ai).toBe('dead');
    getCombat(s).player.hp = 0;
    run(s, 200);
    expect(ec(s, e).ai).toBe('dead');
    expect(of(run(s, 1), 'enemyRespawned').length).toBe(0);
  });
});

// ---- tokens (§2.10) ------------------------------------------------------------------------

describe('attack tokens: 2 melee + 1 ranged per player, 150 ms stagger', () => {
  it('4 Scrappers around the player: ≤ 2 wind-ups at once, starts ≥ 3 ticks apart, waiters stay', () => {
    const s = room();
    const cells: Array<[number, number]> = [
      [4, 4],
      [2, 4],
      [3, 3],
      [3, 5],
    ];
    const es = cells.map(([x, y]) => spawnEnemy(s, 'scrapper', { x, y }));
    getCombat(s).player.hp = 1e6;
    getCombat(s).player.maxHp = 1e6;
    const starts: number[] = [];
    const was = new Set<number>();
    for (let i = 0; i < 160; i++) {
      run(s, 1);
      const winding = es.filter((e) => ec(s, e).attack);
      expect(winding.length).toBeLessThanOrEqual(2);
      for (const e of winding) if (!was.has(e.id)) starts.push(s.tick - 1);
      was.clear();
      for (const e of winding) was.add(e.id);
      es.forEach((e, k) => expect([e.x, e.y]).toEqual(cells[k])); // nobody retreats
    }
    expect(starts.length).toBeGreaterThan(4);
    for (let k = 1; k < starts.length; k++)
      expect(starts[k]! - starts[k - 1]!).toBeGreaterThanOrEqual(3);
  });
  it('2 Line Sentries: only one ranged wind-up at a time', () => {
    const s = room();
    const a = spawnEnemy(s, 'lineSentry', { x: 8, y: 2 });
    const b = spawnEnemy(s, 'lineSentry', { x: 8, y: 6 });
    getCombat(s).player.hp = 1e6;
    let both = 0;
    let any = 0;
    for (let i = 0; i < 300; i++) {
      run(s, 1);
      if (ec(s, a).attack && ec(s, b).attack) both++;
      if (ec(s, a).attack || ec(s, b).attack) any++;
    }
    expect(any).toBeGreaterThan(0);
    expect(both).toBe(0);
  });
});

// ---- skills (§2.5) -------------------------------------------------------------------------

describe('sk1 Dash', () => {
  it('3 cells in one tick, cooldown 4 s, stops before a wall', () => {
    const s = room();
    const ev = run(s, 1, { skill: 1, move: [1, 0] });
    expect(of(ev, 'dash').length).toBe(1);
    expect([s.player.x, s.player.y]).toEqual([6, 4]);
    expect(getCombatHud(s).skills[0]!.ready).toBe(false);
    const w = room([[5, 4, '#']]);
    run(w, 1, { skill: 1, move: [1, 0] });
    expect([w.player.x, w.player.y]).toEqual([4, 4]);
  });
  it('i-frames 200 ms: a blow landing right after the dash misses (playerDodged)', () => {
    const s = room([[4, 4, '#']]); // dash east goes nowhere – only the i-frames matter
    const e = spawnEnemy(s, 'scrapper', { x: 2, y: 4 });
    let guard = 0;
    while (!(ec(s, e).attack && e.attackWindup <= 3) && guard++ < 200) run(s, 1);
    const ev = run(s, 1, { skill: 1, move: [1, 0] }).concat(run(s, 5));
    expect(of(ev, 'playerDodged').length).toBe(1);
    expect(of(ev, 'playerHit').length).toBe(0);
  });
});

describe('sk2 Shock Pulse', () => {
  it('hits enemies in radius 2 with LOS for 15–20, interrupts the wind-up, applies Shock', () => {
    const s = room([[2, 4, '#']]);
    const g = spawnEnemy(s, 'curfewGuard', { x: 4, y: 4 });
    const hidden = spawnEnemy(s, 'curfewGuard', { x: 1, y: 4 }); // behind the wall, dist 2
    let guard = 0;
    while (!ec(s, g).attack && guard++ < 200) run(s, 1);
    expect(ec(s, g).attack).not.toBeNull();
    const ev = run(s, 4, (i) => (i === 0 ? { skill: 2 } : {}));
    expect(of(ev, 'shockPulse').length).toBe(1);
    const hit = of(ev, 'enemyHit').filter((x) => x.ev.source === 'pulse');
    expect(hit.map((x) => x.ev.enemyId)).toEqual([g.id]);
    expect(hit[0]!.ev.dmg).toBeGreaterThanOrEqual(15);
    expect(hit[0]!.ev.dmg).toBeLessThanOrEqual(20);
    expect(of(ev, 'telegraphInterrupted').map((x) => x.ev.enemyId)).toEqual([g.id]);
    expect(ec(s, g).attack).toBeNull();
    expect(ec(s, g).shock).toBeGreaterThan(0);
    expect(ec(s, hidden).hp).toBe(ec(s, hidden).maxHp);
  });
});

describe('sk3 Buddy Drone', () => {
  it('placed next to the player, distance map r 6 (walls −1), expires after 8 s', () => {
    const s = room([[5, 2, '#']]);
    const ev = run(s, 6, (i) => (i === 0 ? { skill: 3 } : {}));
    expect(of(ev, 'droneDeployed').length).toBe(1);
    const c = getCombat(s);
    const d = droneEntity(s, c)!;
    expect(d.kind).toBe(DRONE_KIND);
    expect([d.x, d.y]).toEqual([4, 4]); // facing east
    const f = c.drone!.field;
    expect(f.r).toBe(6);
    expect(fieldAt(f, 4, 4)).toBe(0);
    expect(fieldAt(f, 5, 4)).toBe(3);
    expect(fieldAt(f, 5, 3)).toBe(4);
    expect(fieldAt(f, 5, 2)).toBe(-1);
    expect(getCombatHud(s).drone).not.toBeNull();
    const gone = run(s, 170);
    expect(of(gone, 'droneGone').map((x) => x.ev.reason)).toEqual(['expired']);
    expect(getCombat(s).drone).toBeNull();
  });
  it('an enemy within 4 with LOS targets the drone (frozen drone cell); its blows never hurt the player', () => {
    const s = room();
    run(s, 6, (i) => (i === 0 ? { skill: 3 } : {}));
    const e = spawnEnemy(s, 'scrapper', { x: 8, y: 4 });
    let target: string | null = null;
    const ev: Ev[] = [];
    for (let i = 0; i < 120 && !target; i++) {
      ev.push(...run(s, 1));
      if (ec(s, e).attack) target = ec(s, e).attack!.target;
    }
    expect(target).toBe('drone');
    const d = droneEntity(s, getCombat(s))!;
    expect(ec(s, e).attack!.aim).toEqual({ x: d.x, y: d.y });
    ev.push(...run(s, 20));
    expect(of(ev, 'droneHit').length).toBeGreaterThan(0);
    expect(of(ev, 'playerHit').length).toBe(0);
  });
  it('drone shots: 5–7, ×2 on a Shocked enemy', () => {
    const s = room();
    run(s, 6, (i) => (i === 0 ? { skill: 3 } : {}));
    const e = spawnEnemy(s, 'curfewGuard', { x: 8, y: 2 });
    ec(s, e).shock = 1000;
    const ev = run(s, 30);
    const shots = of(ev, 'droneShot');
    expect(shots.length).toBeGreaterThan(0);
    for (const x of shots) {
      expect(x.ev.dmg).toBeGreaterThanOrEqual(10);
      expect(x.ev.dmg).toBeLessThanOrEqual(14);
    }
  });
  it('droneField: the `<` cell is a wall', () => {
    const { map } = parseMap(['#######', '#..<..#', '#######']);
    const f = droneField(map, { x: 2, y: 1 }, 6);
    expect(fieldAt(f, 3, 1)).toBe(-1);
  });
});

// ---- evacuation `<` (§2.9) -----------------------------------------------------------------

describe('evacuation tile `<` (§2.9)', () => {
  it('enemies never path through `<`', () => {
    const rows = ['########', '#@.<..s#', '########'];
    const s = createGame({ mapRows: rows, seed: 1 });
    getCombat(s, { cfg: COMBAT_M1, profile: 'm1' });
    const e = spawnEnemy(s, 'scrapper', { x: 5, y: 1 });
    for (let i = 0; i < 100; i++) {
      run(s, 1);
      expect(e.x).toBeGreaterThanOrEqual(4);
    }
  });
  it('player on `<`: invulnerable, enemies lose the target, no skills', () => {
    const s = room([[2, 4, '<']]);
    const e = spawnEnemy(s, 'scrapper', { x: 1, y: 4 });
    let guard = 0;
    while (!ec(s, e).attack && guard++ < 200) run(s, 1);
    setCell(s.player, 2, 4); // stepped into the cabin
    ec(s, e).attack!.aim = { x: 2, y: 4 }; // even a blow on the cabin cell misses
    expect(isPlayerEvacuated(s)).toBe(true);
    const ev = run(s, 30, (i) => (i === 3 ? { skill: 2 } : {}));
    expect(of(ev, 'playerHit').length).toBe(0);
    expect(of(ev, 'skillUsed').length).toBe(0);
    expect(['return', 'idle']).toContain(ec(s, e).ai);
    expect(getCombat(s).player.hp).toBe(100);
  });
});

// ---- DIAG_GRACE (§1.2 v0.5) vs bump / AI ---------------------------------------------------

describe('DIAG_GRACE (Silnik) does not confuse bump or AI', () => {
  it('a diagonal added 1 tick after a straight step is not a bump from the straight cell', () => {
    const s = room();
    spawnEnemy(s, 'curfewGuard', { x: 5, y: 3 }); // NE of (4,4)
    run(s, 1, { move: [1, 0] });
    expect([s.player.x, s.player.y]).toEqual([4, 4]);
    const c = getCombat(s);
    expect(inDiagGrace(s, c, { x: 1, y: -1 })).toBe(true);
    run(s, 1, { move: [1, -1] });
    expect(c.player.attack).toBeNull();
    run(s, 3);
    expect(inDiagGrace(s, c, { x: 1, y: -1 })).toBe(false);
  });
  it('an enemy wind-up keeps the cell frozen before a re-target to the diagonal → miss', () => {
    const s = room();
    const e = spawnEnemy(s, 'scrapper', { x: 5, y: 4 });
    let guard = 0;
    while (!ec(s, e).attack && guard++ < 200) run(s, 1);
    expect(ec(s, e).attack!.aim).toEqual({ x: 3, y: 4 });
    setCell(s.player, 4, 3); // engine re-targets the step to the diagonal cell
    const ev = run(s, 12);
    expect(of(ev, 'enemyMiss').length).toBeGreaterThanOrEqual(1);
    expect(of(ev, 'playerHit').filter((x) => x.tick < s.tick - 3).length).toBe(0);
  });
});

// ---- setCombatProfile (Silnik API) ---------------------------------------------------------

describe('setCombatProfile(state, profile, depth)', () => {
  it('idempotent, draws no random numbers, keeps enemy stats', () => {
    const s = room([], COMBAT_M0);
    const e = spawnEnemy(s, 'panelDrone', { x: 9, y: 4 });
    const rng = JSON.stringify(s.rng.getStates());
    setCombatProfile(s, 'm1', 2);
    setCombatProfile(s, 'm1', 2);
    expect(JSON.stringify(s.rng.getStates())).toBe(rng);
    const c = getCombat(s);
    expect(c.cfg).toBe(COMBAT_M1);
    expect(c.depth).toBe(2);
    expect(ec(s, e).maxHp).toBe(40);
  });
  it('before combat exists: recorded for the lazy init', () => {
    const s = createGame({ mapRows: ['#####', '#@..#', '#####'], seed: 3 });
    setCombatProfile(s, 'm1', 3);
    expect(peekCombat(s)).toBeUndefined();
    expect(getCombat(s)).toMatchObject({ profile: 'm1', depth: 3 });
  });
});

// ---- QA-M0-003 / QA-M0-004 / S12 -----------------------------------------------------------

const defaultSpawn = () => {
  const sp = parseMap(MAPS[DEFAULT_MAP]).spawns.find((q) => q.ch === '@')!;
  return { x: sp.x, y: sp.y };
};

function freeCellNear(s: GameState, from: { x: number; y: number }) {
  for (let r = 2; r < 10; r++)
    for (const [dx, dy] of [
      [r, 0],
      [-r, 0],
      [0, r],
      [0, -r],
    ] as const)
      if (placePlayer(s, from.x + dx, from.y + dy)) return;
  throw new Error('no free cell');
}

describe('QA-M0-004: respawn at the map start after loading', () => {
  it('mapSpawn() finds the "@" of the map definition', () => {
    const s = gameFromSave(null);
    expect(mapSpawn(s.map)).toEqual(defaultSpawn());
  });
  it('save at another cell → load → death → respawn at "@" (both with and without combat state)', () => {
    for (const withCombat of [true, false]) {
      const a = gameFromSave(null);
      if (withCombat) getCombat(a);
      freeCellNear(a, defaultSpawn());
      const b = saveLoad(a);
      expect([b.player.x, b.player.y]).not.toEqual([defaultSpawn().x, defaultSpawn().y]);
      getCombat(b).player.hp = 0;
      const ev = run(b, 200);
      expect(of(ev, 'playerRespawned').length).toBe(1);
      expect({ x: b.player.x, y: b.player.y }).toEqual(defaultSpawn());
    }
  });
});

describe('QA-M0-003: combat state survives the auto-pause save (storage round-trip)', () => {
  it('HP and the SIGNAL LOST state survive writeSave → readSave → gameFromSave', () => {
    const store = memoryStore();
    const a = gameFromSave(null);
    getCombat(a).player.hp = 57;
    writeSave(store, snapshot(a, 1));
    expect(getCombat(gameFromSave(readSave(store))).player.hp).toBe(57);

    // death, then save during SIGNAL LOST (blur → auto-pause → save)
    getCombat(a).player.hp = 0;
    let guard = 0;
    while (!(getCombat(a).death && getCombat(a).death!.freezeLeft === 0) && guard++ < 50) run(a, 1);
    run(a, 3);
    resetMoveMemory?.(a);
    writeSave(store, snapshot(a, 2));
    const b = gameFromSave(readSave(store));
    const cb = getCombat(b);
    expect(cb.death).toEqual(getCombat(a).death);
    expect(cb.player.hp).toBe(0);
    expect(getCombatHud(b).dead).toBe(true);
    const ev = run(b, 200);
    expect(of(ev, 'playerRespawned').length).toBe(1);
    expect(cb.player.hp).toBe(cb.player.maxHp);
    expect({ x: b.player.x, y: b.player.y }).toEqual(defaultSpawn());
  });
});

const ROWS = [
  '##############',
  '#............#',
  '#..@.........#',
  '#............#',
  '#............#',
  '##############',
];

describe('S12: death cause for FX / death screen', () => {
  it('killer type, cell of the blow and last ≤ 3 hits; kept through save/load until respawn', () => {
    const s = createGame({ mapRows: ROWS, seed: 4 });
    getCombat(s, { cfg: COMBAT_M1, profile: 'm1' });
    spawnEnemy(s, 'curfewGuard', { x: 4, y: 2 });
    getCombat(s).player.hp = 50;
    let guard = 0;
    let died: Ev[] = [];
    while (!getCombat(s).death && guard++ < 600) died = run(s, 1);
    const cause = getCombatDeath(s)!;
    expect(cause.killer).toMatchObject({ enemyType: 'curfewGuard', from: { x: 4, y: 2 } });
    expect(cause.killer!.aim).toEqual({ x: 3, y: 2 });
    expect(cause.lastHits.length).toBeGreaterThanOrEqual(1);
    expect(cause.lastHits.length).toBeLessThanOrEqual(3);
    expect(of(died, 'playerDied')[0]!.ev.cause).toEqual(cause);
    const b = saveLoad(s, ROWS);
    expect(getCombatDeath(b)).toEqual(cause);
    run(b, 200);
    expect(getCombatDeath(b)).toBeNull();
  });
});

// ---- CombatSave v2 -------------------------------------------------------------------------

describe('CombatSave v2', () => {
  it('round-trip with skills on cooldown, drone, Shock, contract flag, death cause', () => {
    const a = createGame({ mapRows: ROWS, seed: 9 });
    getCombat(a, { cfg: COMBAT_M1, profile: 'm1' });
    run(a, 6, (i) => (i === 0 ? { skill: 3 } : {}));
    const g = spawnEnemy(a, 'curfewGuard', { x: 9, y: 2 }, { contract: true });
    run(a, 2, (i) => (i === 0 ? { skill: 1, move: [1, 0] } : {}));
    ec(a, g).shock = 30;
    run(a, 7);
    const b = saveLoad(a, ROWS);
    setCombatProfile(b, 'm1', 1);
    const ca = getCombat(a);
    const cb = getCombat(b);
    expect(cb.player.skillCd).toEqual(ca.player.skillCd);
    expect(cb.player.iframes).toBe(ca.player.iframes);
    expect(cb.drone && { ...cb.drone, entityId: 0 }).toEqual(
      ca.drone && { ...ca.drone, entityId: 0 },
    );
    const gb = [...cb.enemies.values()].find((q) => q.type === 'curfewGuard')!;
    expect(gb.contract).toBe(true);
    expect(gb.shock).toBe(ec(a, g).shock);
    expect(cb.tokenTick).toEqual(ca.tokenTick);
    expect(cb.recentHits).toEqual(ca.recentHits);
    const strip = (ev: Ev[]) =>
      ev.map((x) => JSON.stringify({ ...x, ev: { ...x.ev, enemyId: 0 } }));
    expect(strip(run(b, 200))).toEqual(strip(run(a, 200)));
  });
  it('a v1 combat section migrates to v2 (profile / depth dropped, M1 fields fresh)', () => {
    const a = createGame({ mapRows: ROWS, seed: 9 });
    getCombat(a);
    run(a, 20);
    const data = JSON.parse(saveToJson(snapshot(a, 1)));
    const c = data.combat;
    c.v = 1;
    c.profile = 'm0';
    c.depth = 1;
    for (const k of ['drone', 'tokenTick', 'recentHits', 'deathCause']) delete c[k];
    for (const k of ['slots', 'skillCd', 'cast', 'skillQueue', 'prevSkill', 'iframes', 'momentum'])
      delete c.player[k];
    for (const e of c.enemies) {
      delete e.shock;
      delete e.contract;
      if (e.attack) delete e.attack.target;
    }
    const b = gameFromSave(parseSaveText(JSON.stringify(data)), { mapRows: ROWS });
    const cb = getCombat(b);
    expect(cb.player.hp).toBe(getCombat(a).player.hp);
    expect(cb.drone).toBeNull();
    expect(cb.player.skillCd).toEqual({ dash: 0, shockPulse: 0, buddyDrone: 0 });
    expect((snapshot(b, 1).combat as { v: number }).v).toBe(2);
  });
  it('contract enemies are flagged in enemyKilled', () => {
    const s = room();
    const e = spawnEnemy(s, 'scrapper', { x: 4, y: 4 }, { contract: true });
    ec(s, e).hp = 1;
    const k = of(run(s, 30, { attack: true }), 'enemyKilled');
    expect(k[0]!.ev.contract).toBe(true);
  });
});
