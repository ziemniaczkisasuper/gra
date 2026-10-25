// Mechaniki v0.5.2 fixes + boss Rail Guardian (§2.11 / §2.16, GD level-m1 §10) – PROG / Gameplay.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import * as core from '../src/core/game';
import { createGame, placePlayer, stepGame, type GameState } from '../src/core/game';
import { COMBAT, COMBAT_M1, RAIL_GUARDIAN as RG, enemyDiagMs } from '../src/data/combat-m0';
import { ARENA_M1 } from '../src/data/arena-m1';
import { emptyActions, type ActionState } from '../src/input/actions';
import type { Entity } from '../src/entities/entity';
import {
  enemyMaxHp,
  enemyTicks,
  getBossChargeLane,
  getCombat,
  getCombatHud,
  setCombatProfile,
  spawnEnemy,
} from '../src/combat/combat';
import { damageBoss, spawnBoss } from '../src/combat/boss';
import { installCombat } from '../src/combat/install';
import type { CombatEvent } from '../src/combat/state';
import { gameFromSave, parseSaveText, saveToJson, snapshot } from '../src/save';

let uninstall: () => void;
beforeAll(() => {
  uninstall = installCombat();
});
afterAll(() => uninstall());

const TICK = COMBAT.TICK_MS;
type Ev = { tick: number; ev: CombatEvent };
function act(o: { move?: [number, number]; skill?: 1 | 2 | 3 } = {}): ActionState {
  const a = emptyActions();
  if (o.move) a.move = { x: o.move[0], y: o.move[1] };
  if (o.skill === 1) a.skill1 = true;
  if (o.skill === 2) a.skill2 = true;
  if (o.skill === 3) a.skill3 = true;
  return a;
}
function run(s: GameState, n: number, o: Parameters<typeof act>[0] = {}): Ev[] {
  const out: Ev[] = [];
  for (let i = 0; i < n; i++) {
    const tick = s.tick;
    stepGame(s, act(o), TICK);
    for (const ev of getCombat(s).events) out.push({ tick, ev });
  }
  return out;
}
const of = (ev: Ev[], type: CombatEvent['type']) => ev.filter((x) => x.ev.type === type);
const ec = (s: GameState, e: Entity) => getCombat(s).enemies.get(e.id)!;

function room(marks: Array<[number, number, string]> = []) {
  const rows = Array.from({ length: 9 }, (_, y) =>
    Array.from({ length: 14 }, (_, x): string =>
      y === 0 || y === 8 || x === 0 || x === 13 ? '#' : '.',
    ),
  );
  rows[4]![3] = '@';
  for (const [x, y, ch] of marks) rows[y]![x] = ch;
  const s = createGame({ mapRows: rows.map((r) => r.join('')), seed: 3 });
  getCombat(s, { cfg: COMBAT_M1, profile: 'm1' });
  return s;
}

describe('Mechaniki v0.5.2', () => {
  it('constants and diagonals from ONE function: Guard 400, Scrapper 300, Drone 300, boss 450', () => {
    expect(COMBAT_M1.SHOCK_MOVE_MULT).toBe(2);
    expect(COMBAT_M1.SKILL_COOLDOWN_FROM).toBe('press');
    expect(COMBAT_M1.SKILL_FAIL_REFUND).toBe(true);
    expect(COMBAT_M1.ENEMY_GROUP_WAKE_RADIUS).toBe(4);
    const c = getCombat(room());
    expect(enemyTicks(c, 'curfewGuard').moveDiag * TICK).toBe(400);
    expect(enemyTicks(c, 'scrapper').moveDiag * TICK).toBe(300);
    expect(enemyTicks(c, 'panelDrone').moveDiag * TICK).toBe(300);
    expect(enemyDiagMs(RG.BOSS_MOVE_MS, TICK)).toBe(450);
  });
  it('Shock: a step started under Shock takes ×2 (straight 200 → 400 ms)', () => {
    const s = room();
    const e = spawnEnemy(s, 'scrapper', { x: 9, y: 4 });
    ec(s, e).shock = 100;
    let guard = 0;
    while (e.x === 9 && e.y === 4 && guard++ < 100) run(s, 1);
    const straight = e.x !== e.fromX && e.y !== e.fromY ? 12 : 8;
    expect(e.moveTicks).toBe(straight);
  });
  it('group wake: same group with LOS within 4 wakes, other group and chain do not', () => {
    const s = room([
      [5, 2, '#'],
      [6, 2, '#'],
      [5, 3, '#'],
      [6, 3, '#'],
      [8, 2, '#'],
      [8, 3, '#'],
    ]);
    const a = spawnEnemy(s, 'scrapper', { x: 7, y: 4 }, { group: 1 });
    const b = spawnEnemy(s, 'scrapper', { x: 7, y: 2 }, { group: 1 }); // sees A, not the player
    const other = spawnEnemy(s, 'scrapper', { x: 7, y: 1 }, { group: 2 });
    let guard = 0;
    while (ec(s, a).ai === 'idle' && guard++ < 100) run(s, 1);
    expect(ec(s, b).ai).not.toBe('idle');
    expect(ec(s, other).ai).toBe('idle');
  });
  it('cooldown from the press; Dash that cannot move fails without cooldown', () => {
    const s = room([[4, 4, '#']]);
    const ev = run(s, 1, { skill: 1, move: [1, 0] });
    expect(of(ev, 'skillFailed').length).toBe(1);
    expect(getCombatHud(s).skills[0]!.ready).toBe(true);
    const w = room([[5, 4, '#']]); // 1 cell then the wall: cooldown spent + Momentum
    run(w, 1, { skill: 1, move: [1, 0] });
    expect(w.player.x).toBe(4);
    expect(getCombatHud(w).skills[0]!.ready).toBe(false);
    expect(getCombat(w).player.momentum).toBeGreaterThan(0);
    const p = room();
    run(p, 1, { skill: 2 });
    expect(getCombatHud(p).skills[1]!.cooldownLeftMs).toBe(COMBAT_M1.SK2_PULSE_COOLDOWN_MS - TICK);
  });
  it('Buddy Drone without a free cell: skillFailed, cooldown not spent', () => {
    const marks: Array<[number, number, string]> = [];
    for (const [dx, dy] of [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ])
      marks.push([3 + dx!, 4 + dy!, '#']);
    const s = room(marks);
    expect(of(run(s, 1, { skill: 3 }), 'skillFailed').length).toBe(1);
    expect(getCombatHud(s).skills[2]!.ready).toBe(true);
  });
  it("liquid '~' is passable and harmless", () => {
    const s = room([
      [4, 4, '~'],
      [5, 4, '~'],
    ]);
    run(s, 12, { move: [1, 0] });
    expect(s.player.x).toBeGreaterThanOrEqual(5);
    expect(getCombat(s).player.hp).toBe(getCombat(s).player.maxHp);
  });
});

// ---- boss ---------------------------------------------------------------------------------------

function arena(player: [number, number], seed = 5) {
  const s = createGame({ mapRows: ARENA_M1.rows, seed });
  setCombatProfile(s, 'm1', 3);
  getCombat(s);
  placePlayer(s, player[0], player[1]);
  spawnBoss(s, ARENA_M1.boss, { arena: ARENA_M1.rect });
  return s;
}
const boss = (s: GameState) => getCombat(s).boss!;

describe('boss Rail Guardian', () => {
  it('swing 3×3: 800 ms wind-up, hits 20–32 (no depth multiplier), 1200 ms recovery', () => {
    const s = arena([19, 7]);
    const ev = run(s, 60);
    const swings = of(ev, 'bossAttack');
    const hits = of(ev, 'playerHit');
    expect(swings.length).toBeGreaterThanOrEqual(2);
    expect(hits[0]!.tick - swings[0]!.tick).toBe(RG.BOSS_SWING_WINDUP_MS / TICK);
    const dmg = (hits[0]!.ev as { dmg: number }).dmg;
    expect(dmg).toBeGreaterThanOrEqual(RG.BOSS_DMG_MIN);
    expect(dmg).toBeLessThanOrEqual(RG.BOSS_DMG_MAX);
    expect(swings[1]!.tick - hits[0]!.tick).toBeGreaterThanOrEqual(
      RG.BOSS_SWING_RECOVERY_MS / TICK,
    );
  });
  it('charge: walks to the nearest track, whole track lit, hits once, wall → stun, R ×2', () => {
    const s = arena([5, 12]);
    boss(s).sinceCharge = RG.BOSS_CHARGE_EVERY - 1;
    boss(s).phase = 'chase';
    let guard = 0;
    while (boss(s).phase !== 'chargeWindup' && guard++ < 200) run(s, 1);
    expect(boss(s).y).toBe(11); // rows 11–12 = the lower track
    const lane = getBossChargeLane(s)!;
    expect(lane.phase).toBe('windup');
    expect(lane.dir).toEqual({ x: -1, y: 0 });
    expect(lane.cells.length).toBe(2 * 28 - 6);
    const ev = run(s, 18 + 2 * 30);
    expect(of(ev, 'playerHit').length).toBe(1);
    expect(of(ev, 'bossStunned').length).toBe(1);
    expect(boss(s).phase).toBe('stunned');
    expect(boss(s).x).toBe(1);
    const hp = boss(s).hp;
    damageBoss(s, getCombat(s), 10, false, 'attack', { x: 2, y: 11 });
    expect(hp - boss(s).hp).toBe(10 * RG.BOSS_WEAKPOINT_MULT);
    expect(getCombatHud(s).boss!.weakPoint).toBe(true);
  });
  it('summon at ≤ 50 % once: 2 depth-3 Panel Drones ≥ 4 from the player, activation 500 ms', () => {
    const s = arena([10, 7]);
    run(s, 2);
    boss(s).hp = RG.BOSS_HP / 2;
    let guard = 0;
    while (!boss(s).summoned && guard++ < 200) run(s, 1);
    const c = getCombat(s);
    const drones = [...c.enemies.values()].filter((e) => e.summoned);
    expect(drones.length).toBe(RG.SUMMON_COUNT);
    for (const d of drones) {
      expect(d.maxHp).toBe(enemyMaxHp(c, 'panelDrone', 3));
      expect(d.ai).toBe('alert');
      const e = s.entities.find((q) => q.id === d.id)!;
      expect(
        Math.max(Math.abs(e.x - s.player.x), Math.abs(e.y - s.player.y)),
      ).toBeGreaterThanOrEqual(4);
    }
    boss(s).hp = 100;
    run(s, 40);
    expect([...c.enemies.values()].filter((e) => e.summoned).length).toBe(RG.SUMMON_COUNT);
  });
  it('leaving the arena resets the boss; re-entry emits M1_RISK_01B', () => {
    const s = arena([10, 7]);
    run(s, 2);
    Object.assign(boss(s), { hp: 900, summoned: true, sinceCharge: 2 });
    spawnEnemy(s, 'panelDrone', { x: 10, y: 9 }, { summoned: true, depth: 3 });
    placePlayer(s, ARENA_M1.gate.x, ARENA_M1.gate.y);
    expect(of(run(s, 1), 'bossReset').length).toBe(1);
    expect(boss(s).hp).toBe(RG.BOSS_HP);
    expect([boss(s).summoned, boss(s).sinceCharge, boss(s).x]).toEqual([false, 0, ARENA_M1.boss.x]);
    expect([...getCombat(s).enemies.values()].some((e) => e.summoned)).toBe(false);
    placePlayer(s, 1, 7);
    const re = of(run(s, 1), 'bossArenaReenter');
    expect(re.length).toBe(1);
    expect((re[0]!.ev as { textId: string }).textId).toBe('M1_RISK_01B');
  });
  it('save v3 round-trip mid-charge continues identically; v2 saves migrate', () => {
    const a = arena([5, 12]);
    boss(a).sinceCharge = RG.BOSS_CHARGE_EVERY - 1;
    boss(a).phase = 'chase';
    let guard = 0;
    while (boss(a).phase !== 'charging' && guard++ < 300) run(a, 1);
    run(a, 3);
    const resetMem = (core as Record<string, unknown>).resetPlayerMoveMemory as
      ((s: GameState) => void) | undefined;
    resetMem?.(a);
    const data = snapshot(a, 1);
    const b = gameFromSave(parseSaveText(saveToJson(data)), { mapRows: ARENA_M1.rows });
    setCombatProfile(b, 'm1', 3);
    expect(getBossChargeLane(b)).toEqual(getBossChargeLane(a));
    const strip = (ev: Ev[]) =>
      ev.map((x) => JSON.stringify({ ...x, ev: { ...x.ev, enemyId: 0 } }));
    expect(strip(run(b, 80))).toEqual(strip(run(a, 80)));
    const pick = (s: GameState) => ({ ...boss(s), partIds: [] });
    expect(pick(b)).toEqual(pick(a));
    // v2 → v3: no boss, enemy fields defaulted.
    const old = JSON.parse(
      saveToJson(snapshot(createGame({ mapRows: ARENA_M1.rows, seed: 1 }), 1)),
    );
    old.combat = { v: 2, empty: true };
    expect(() =>
      gameFromSave(parseSaveText(JSON.stringify(old)), { mapRows: ARENA_M1.rows }),
    ).not.toThrow();
  });
});
