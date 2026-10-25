// §2.11 / §2.16 boss Rail Guardian – PROG / Gameplay. Numbers: RAIL_GUARDIAN (data/combat-m0.ts),
// arena: data/arena-m1.ts (Level Design ARENA_M1). Runs inside the combat 'world' phase:
//   bossArenaCheck → bossAi (step 3, before the enemies) → [player blows] → bossResolve (4b).
// Body: BOSS_W × BOSS_H solid part entities (kind BOSS_TYPE), anchor = top-left; the player
// targets parts like enemies, damage goes to the shared boss HP (damageBoss).
// Attacks: swing 3×3 in front (800 / 1200 ms); every BOSS_CHARGE_EVERY-th attack a charge:
// the boss walks to the nearest 2-row track `=`, then 900 ms wind-up (whole track lit), then
// rides horizontally toward the player's column (tie → farther wall) at 2 ticks per cell, hits
// the player once, a wall at the end → 2 s stun with the weak point `R` (damage ×2).
// At ≤ 50 % HP (after the current attack) a one-time summon of 2 Panel Drones (depth 3).
// Leaving the arena rectangle → resetBossArena (full HP, drones gone, summon + charge counter
// reset); re-entering → 'bossArenaReenter' { textId: 'M1_RISK_01B' }.
// Randomness: only combatRng(state) (summon cells).
import type { GameState } from '../core/game';
import { isOccupied } from '../core/game';
import { COMBAT_STRINGS, enemyDiagMs, RAIL_GUARDIAN as RG } from '../data/combat-m0';
import { COMBAT_STYLE, type GlyphStyle } from '../data/style';
import { createEntity, type Entity } from '../entities/entity';
import {
  addFx,
  combatRng,
  computeDamage,
  emitBus,
  emitCombat,
  enemyEntities,
  floatText,
  getCombat,
  hitPlayer,
  isEvacTile,
  isPlayerEvacuated,
  meleeTokenFree,
  removeEnemyEntity,
  spawnEnemy,
  takeMeleeToken,
} from './combat';
import { chebyshev, DIRS8, lineOfSight, sameCell, type Cell } from './grid';
import { BOSS_TYPE, type BossState, type CombatData } from './state';
import { msToTicks } from './timing';

export { BOSS_TYPE };

const ms = (c: CombatData, v: number) => msToTicks(v, c.cfg.TICK_MS);

export interface BossSpawnOptions {
  /** Arena interior rectangle; default = whole map minus the border. */
  arena?: BossState['arena'];
}

/** Creates the boss (3×2 parts) with its top-left at `anchor`. One boss per level. */
export function spawnBoss(state: GameState, anchor: Cell, opts: BossSpawnOptions = {}): BossState {
  const c = getCombat(state);
  if (c.boss) removeBossParts(state, c);
  const arena = opts.arena ?? {
    x0: 1,
    y0: 1,
    x1: state.map.width - 2,
    y1: state.map.height - 2,
  };
  c.boss = {
    partIds: [],
    x: anchor.x,
    y: anchor.y,
    spawn: { ...anchor },
    hp: RG.BOSS_HP,
    maxHp: RG.BOSS_HP,
    phase: 'idle',
    timer: 0,
    moveCooldown: 0,
    facing: { x: -1, y: 0 },
    sinceCharge: 0,
    trackY: null,
    arena: { ...arena },
    playerLeft: false,
    introDone: false,
    swing: null,
    charge: null,
    summoned: false,
    hitFlash: 0,
  };
  createBossParts(state, c);
  return c.boss;
}

/** (Re)creates the part entities from the boss state (spawn / save restore). */
export function createBossParts(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b) return;
  removeBossParts(state, c);
  for (let row = 0; row < RG.BOSS_H; row++)
    for (let col = 0; col < RG.BOSS_W; col++) {
      const e = createEntity(
        BOSS_TYPE,
        b.x + col,
        b.y + row,
        COMBAT_STYLE.bossPart(col, row, 'normal'),
      );
      e.solid = b.phase !== 'dead';
      state.entities.push(e);
      b.partIds.push(e.id);
    }
  bossVisuals(state, c);
}

function removeBossParts(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b) return;
  const ids = new Set(b.partIds);
  state.entities = state.entities.filter((e) => !ids.has(e.id));
  b.partIds = [];
}

export const bossAlive = (c: CombatData): boolean => !!c.boss && c.boss.phase !== 'dead';

export function isBossPart(c: CombatData, e: Entity): boolean {
  return bossAlive(c) && c.boss!.partIds.includes(e.id);
}

function parts(state: GameState, c: CombatData): Entity[] {
  const ids = c.boss?.partIds ?? [];
  return ids.map((id) => state.entities.find((e) => e.id === id)!).filter(Boolean);
}

/** Body cells of an anchor (row-major). */
export function bodyCells(x: number, y: number): Cell[] {
  const out: Cell[] = [];
  for (let row = 0; row < RG.BOSS_H; row++)
    for (let col = 0; col < RG.BOSS_W; col++) out.push({ x: x + col, y: y + row });
  return out;
}

const inBody = (b: BossState, p: Cell) =>
  p.x >= b.x && p.x < b.x + RG.BOSS_W && p.y >= b.y && p.y < b.y + RG.BOSS_H;

/** The boss is holding one of the player's melee tokens (attacking, §2.11). */
export function bossHoldsToken(c: CombatData): boolean {
  const ph = c.boss?.phase;
  return ph === 'swing' || ph === 'chargeWindup' || ph === 'charging';
}

/** Entity id the FX layer anchors boss events to (top-left part). */
const fxId = (c: CombatData) => c.boss?.partIds[0] ?? -1;

// ---- geometry ------------------------------------------------------------------------------

/** Signed gap from the body to the player per axis (0 = overlapping that axis). */
function gap(b: BossState, p: Cell): Cell {
  const gx = p.x < b.x ? p.x - b.x : p.x > b.x + RG.BOSS_W - 1 ? p.x - (b.x + RG.BOSS_W - 1) : 0;
  const gy = p.y < b.y ? p.y - b.y : p.y > b.y + RG.BOSS_H - 1 ? p.y - (b.y + RG.BOSS_H - 1) : 0;
  return { x: gx, y: gy };
}

/** Cardinal facing toward the player: dominant gap axis, tie → horizontal. */
function facingTo(b: BossState, p: Cell): Cell {
  const g = gap(b, p);
  if (g.x === 0 && g.y === 0) return b.facing;
  if (Math.abs(g.x) >= Math.abs(g.y) && g.x !== 0) return { x: Math.sign(g.x), y: 0 };
  return { x: 0, y: Math.sign(g.y) };
}

/** 3×3 zone adjacent to the body on the `f` side (horizontal: rows chosen toward the player). */
export function swingZone(state: GameState, b: BossState, f: Cell, p: Cell): Cell[] {
  let xs: number[];
  let ys: number[];
  const range = (a: number, n: number) => Array.from({ length: n }, (_, i) => a + i);
  if (f.x !== 0) {
    xs = range(f.x > 0 ? b.x + RG.BOSS_W : b.x - 3, 3);
    ys = range(p.y <= b.y ? b.y - 1 : b.y + RG.BOSS_H - 2, 3);
  } else {
    xs = range(b.x, 3);
    ys = range(f.y > 0 ? b.y + RG.BOSS_H : b.y - 3, 3);
  }
  const out: Cell[] = [];
  for (const y of ys) for (const x of xs) if (!state.map.isSolid(x, y)) out.push({ x, y });
  return out;
}

const isTrack = (state: GameState, x: number, y: number) =>
  state.map.tile(x, y) === RG.BOSS_TRACK_TILE;

/** The body stands on a 2-row track (every body cell is a track tile). */
export function onTrack(state: GameState, x: number, y: number): boolean {
  return bodyCells(x, y).every((q) => isTrack(state, q.x, q.y));
}

/** Nearest anchor row (same columns) where the body fits a track; tie → toward the player. */
function nearestTrackY(state: GameState, b: BossState, p: Cell): number | null {
  let best: number | null = null;
  for (let y = 0; y < state.map.height; y++) {
    if (!onTrack(state, b.x, y)) continue;
    const d = Math.abs(y - b.y);
    const bd = best === null ? Infinity : Math.abs(best - b.y);
    if (d < bd || (d === bd && Math.abs(y - p.y) < Math.abs(best! - p.y))) best = y;
  }
  return best;
}

/** Free for the body at anchor (x, y): no wall, no `<`, no solid entity except own parts. */
function bodyFree(
  state: GameState,
  c: CombatData,
  x: number,
  y: number,
  ignorePlayer = false,
): boolean {
  const own = new Set(c.boss?.partIds ?? []);
  for (const q of bodyCells(x, y)) {
    if (state.map.isSolid(q.x, q.y) || isEvacTile(state.map, q.x, q.y)) return false;
    if (!ignorePlayer && state.player.solid && sameCell(state.player, q)) return false;
    if (state.entities.some((e) => e.solid && !own.has(e.id) && sameCell(e, q))) return false;
  }
  return true;
}

function moveBody(state: GameState, c: CombatData, dx: number, dy: number, ticks: number): void {
  const b = c.boss!;
  b.x += dx;
  b.y += dy;
  for (const e of parts(state, c)) {
    e.fromX = e.x;
    e.fromY = e.y;
    e.x += dx;
    e.y += dy;
    e.moveTick = state.tick;
    e.moveTicks = ticks;
  }
}

/** One greedy step toward `goal` (anchor) – diagonal first, no corner cutting. */
function stepToward(state: GameState, c: CombatData, d: Cell): boolean {
  const b = c.boss!;
  const straight = ms(c, RG.BOSS_MOVE_MS);
  const diag = ms(c, enemyDiagMs(RG.BOSS_MOVE_MS, c.cfg.TICK_MS));
  const tries: Cell[] = [];
  if (d.x !== 0 && d.y !== 0) tries.push(d);
  if (d.x !== 0) tries.push({ x: d.x, y: 0 });
  if (d.y !== 0) tries.push({ x: 0, y: d.y });
  for (const t of tries) {
    if (!bodyFree(state, c, b.x + t.x, b.y + t.y)) continue;
    if (t.x !== 0 && t.y !== 0) {
      if (!bodyFree(state, c, b.x + t.x, b.y) || !bodyFree(state, c, b.x, b.y + t.y)) continue;
    }
    const ticks = t.x !== 0 && t.y !== 0 ? diag : straight;
    moveBody(state, c, t.x, t.y, ticks);
    b.moveCooldown = ticks;
    return true;
  }
  return false;
}

// ---- arena (enter / leave) -----------------------------------------------------------------

const inArena = (b: BossState, p: Cell) =>
  p.x >= b.arena.x0 && p.x <= b.arena.x1 && p.y >= b.arena.y0 && p.y <= b.arena.y1;

/**
 * §2.11 retreat (gate stays open): the boss goes back to its start with full HP, summoned
 * drones vanish, the 50 % summon and the charge counter reset. Temporarily triggered by the
 * player leaving the arena rectangle; Silnik can call it from the gate event. Dead boss: no-op.
 */
export function resetBossArena(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b || b.phase === 'dead') return;
  for (const { e, ec } of enemyEntities(state, c)) if (ec.summoned) removeEnemyEntity(state, c, e);
  const dx = b.spawn.x - b.x;
  const dy = b.spawn.y - b.y;
  b.x = b.spawn.x;
  b.y = b.spawn.y;
  for (const e of parts(state, c)) {
    e.x = e.fromX = e.x + dx;
    e.y = e.fromY = e.y + dy;
    e.moveTicks = 0;
  }
  Object.assign(b, {
    hp: b.maxHp,
    phase: 'idle',
    timer: 0,
    moveCooldown: 0,
    sinceCharge: 0,
    trackY: null,
    swing: null,
    charge: null,
    summoned: false,
    hitFlash: 0,
    introDone: false,
  } satisfies Partial<BossState>);
  emitCombat(c, { type: 'bossReset' });
}

/** Arena rectangle check, run first in the world phase. */
export function bossArenaCheck(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b || b.phase === 'dead') return;
  const inside = inArena(b, state.player);
  if (!inside && !b.playerLeft) {
    b.playerLeft = true;
    resetBossArena(state, c);
  } else if (inside && b.playerLeft) {
    b.playerLeft = false;
    emitCombat(c, { type: 'bossArenaReenter', textId: 'M1_RISK_01B' });
  }
}

// ---- damage ----------------------------------------------------------------------------------

/** Damage to the boss (any part). Stunned → weak point ×BOSS_WEAKPOINT_MULT (§2.11). */
export function damageBoss(
  state: GameState,
  c: CombatData,
  dmg: number,
  crit: boolean,
  source: 'attack' | 'pulse' | 'drone',
  at: Cell,
): void {
  const b = c.boss;
  if (!b || b.phase === 'dead') return;
  const weakPoint = b.phase === 'stunned';
  if (weakPoint) dmg *= RG.BOSS_WEAKPOINT_MULT;
  b.hp -= dmg;
  b.hitFlash = c.t.hitFlash;
  c.player.lastCombatTick = state.tick;
  floatText(
    c,
    crit || weakPoint ? 'critToEnemy' : 'dmgToEnemy',
    crit || weakPoint ? `-${dmg}!` : `-${dmg}`,
    at,
  );
  emitCombat(c, { type: 'bossHit', dmg, crit, weakPoint, source });
  if (b.hp <= 0) {
    b.hp = 0;
    b.phase = 'dead';
    b.swing = null;
    b.charge = null;
    b.timer = 0;
    for (const e of parts(state, c)) e.solid = false;
    c.stats.kills++;
    emitCombat(c, { type: 'bossKilled' });
    emitBus('bossDefeated', { entityId: fxId(c), cell: { x: b.x, y: b.y } });
    return;
  }
  if (b.phase === 'idle') wake(c);
}

function wake(c: CombatData): void {
  const b = c.boss!;
  b.phase = 'chase';
  if (!b.introDone) {
    b.introDone = true;
    emitBus('bossIntro', { entityId: fxId(c) });
  }
}

// ---- AI (step 3) -------------------------------------------------------------------------------

const summonDue = (b: BossState) => !b.summoned && b.hp * 100 <= b.maxHp * RG.BOSS_SUMMON_HP_PCT;

export function bossAi(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b || b.phase === 'dead') return;
  const p = state.player;
  const away = isPlayerEvacuated(state) || c.player.hp <= 0;
  if (b.moveCooldown > 0) b.moveCooldown--;
  if (b.timer > 0) b.timer--;

  if (b.phase === 'idle') {
    if (away) return;
    const near = bodyCells(b.x, b.y).some(
      (q) => chebyshev(q, p) <= RG.BOSS_DETECT_RADIUS && lineOfSight(state.map, q, p),
    );
    if (!near) return;
    wake(c);
  }
  // Summon: first tick at ≤ 50 % after the current attack resolved (not during the stun).
  if ((b.phase === 'chase' || b.phase === 'recover' || b.phase === 'toTrack') && summonDue(b)) {
    b.phase = 'summon';
    b.timer = ms(c, RG.BOSS_SUMMON_MS);
    b.trackY = null;
    emitCombat(c, { type: 'bossSummon', cells: [] });
    emitBus('bossSummon', { entityId: fxId(c), cells: bodyCells(b.x, b.y) });
    return;
  }
  switch (b.phase) {
    case 'summon':
      if (b.timer === 0) finishSummon(state, c);
      return;
    case 'swing':
      return; // resolved in bossResolve (step 4b)
    case 'recover':
    case 'stunned':
      if (b.timer > 0) return;
      if (b.phase === 'stunned') emitBus('bossStunEnd', { entityId: fxId(c) });
      b.phase = 'chase';
      break;
    case 'chargeWindup':
      if (b.timer === 0) startRide(c);
      return; // the ride itself moves in bossResolve (after the player's blows)
    case 'charging':
      return;
    default:
      break;
  }
  if (away) return; // evacuated / dead player: no new attacks, boss stays
  const chargeDue = b.sinceCharge >= RG.BOSS_CHARGE_EVERY - 1;
  if (b.phase === 'chase' && chargeDue) {
    b.phase = 'toTrack';
    b.trackY = nearestTrackY(state, b, p);
  }
  if (b.phase === 'toTrack') {
    if (b.trackY === null) b.trackY = nearestTrackY(state, b, p);
    if (b.trackY === null) {
      // No track in reach of these columns (not in ARENA_M1): fall back to swings [R].
      b.sinceCharge = 0;
      b.phase = 'chase';
    } else if (b.y === b.trackY && onTrack(state, b.x, b.y)) {
      if (meleeTokenFree(state, c)) startChargeWindup(state, c);
      return;
    } else {
      if (b.moveCooldown === 0) stepToward(state, c, { x: 0, y: Math.sign(b.trackY - b.y) });
      return;
    }
  }
  // chase: swing when the player is in the 3×3 zone, else walk toward the player.
  const f = facingTo(b, p);
  const zone = swingZone(state, b, f, p);
  if (zone.some((q) => sameCell(q, p))) {
    if (meleeTokenFree(state, c)) startSwing(state, c, f, zone);
    return;
  }
  if (b.moveCooldown > 0) return;
  const g = gap(b, p);
  stepToward(state, c, { x: Math.sign(g.x), y: Math.sign(g.y) });
}

function startSwing(state: GameState, c: CombatData, f: Cell, zone: Cell[]): void {
  const b = c.boss!;
  takeMeleeToken(state, c);
  b.phase = 'swing';
  b.facing = f;
  b.swing = zone.map((q) => ({ ...q }));
  b.timer = ms(c, RG.BOSS_SWING_WINDUP_MS);
  b.sinceCharge++;
  emitCombat(c, { type: 'bossAttack', attack: 'swing' });
  emitBus('bossTelegraph', { entityId: fxId(c), kind: 'bossSwing', cells: b.swing });
}

/** Whole track of the boss rows (2 rows, wall to wall), body cells excluded. */
function trackCells(state: GameState, b: BossState): Cell[] {
  const out: Cell[] = [];
  for (let row = 0; row < RG.BOSS_H; row++) {
    const y = b.y + row;
    let x0 = b.x;
    while (!state.map.isSolid(x0 - 1, y)) x0--;
    let x1 = b.x + RG.BOSS_W - 1;
    while (!state.map.isSolid(x1 + 1, y)) x1++;
    for (let x = x0; x <= x1; x++) if (!inBody(b, { x, y })) out.push({ x, y });
  }
  return out;
}

/** Cells still ahead in direction dx (nearest first), from the body to the wall. */
function laneAhead(state: GameState, b: BossState, dx: number): Cell[] {
  const out: Cell[] = [];
  let x = dx > 0 ? b.x + RG.BOSS_W : b.x - 1;
  while (bodyRowsOpen(state, b, x)) {
    for (let row = 0; row < RG.BOSS_H; row++) out.push({ x, y: b.y + row });
    x += dx;
  }
  return out;
}

const bodyRowsOpen = (state: GameState, b: BossState, x: number) => {
  for (let row = 0; row < RG.BOSS_H; row++) if (state.map.isSolid(x, b.y + row)) return false;
  return true;
};

function startChargeWindup(state: GameState, c: CombatData): void {
  const b = c.boss!;
  const p = state.player;
  takeMeleeToken(state, c);
  // GD: horizontal toward the player's column; tie (player within the body columns) → farther wall.
  let dx = p.x < b.x ? -1 : p.x > b.x + RG.BOSS_W - 1 ? 1 : 0;
  if (dx === 0) dx = laneAhead(state, b, -1).length > laneAhead(state, b, 1).length ? -1 : 1;
  b.phase = 'chargeWindup';
  b.facing = { x: dx, y: 0 };
  b.timer = ms(c, RG.BOSS_CHARGE_WINDUP_MS);
  b.sinceCharge = 0;
  b.trackY = null;
  b.charge = { dir: { x: dx, y: 0 }, lane: trackCells(state, b), hit: false, stepTimer: 0 };
  emitCombat(c, { type: 'bossAttack', attack: 'charge' });
  emitBus('bossTelegraph', { entityId: fxId(c), kind: 'bossCharge', cells: b.charge.lane });
}

function startRide(c: CombatData): void {
  const b = c.boss!;
  b.phase = 'charging';
  b.charge!.stepTimer = 0; // first cell this tick (bossResolve)
}

// ---- resolution (step 4b) ----------------------------------------------------------------------

export function bossResolve(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b || b.phase === 'dead') return;
  if (b.phase === 'swing' && b.timer === 0) {
    const zone = b.swing ?? [];
    for (const q of zone) addFx(state, c, q, COMBAT_STYLE.strike, c.t.strikeFx, true);
    if (zone.some((q) => sameCell(q, state.player))) bossHitPlayer(state, c);
    else floatText(c, 'miss', COMBAT_STRINGS.miss, { x: b.x + 1, y: b.y });
    b.swing = null;
    b.phase = 'recover';
    b.timer = ms(c, RG.BOSS_SWING_RECOVERY_MS);
    return;
  }
  if (b.phase !== 'charging' || !b.charge) return;
  const ch = b.charge;
  if (ch.stepTimer > 0) {
    ch.stepTimer--;
    if (ch.stepTimer > 0) return;
  }
  ch.lane = laneAhead(state, b, ch.dir.x); // the ride shows only what is still ahead
  if (!bodyRowsOpen(state, b, ch.dir.x > 0 ? b.x + RG.BOSS_W : b.x - 1)) {
    // Wall at the end of the track → stun, weak point exposed.
    const wx = ch.dir.x > 0 ? b.x + RG.BOSS_W : b.x - 1;
    const wall = Array.from({ length: RG.BOSS_H }, (_, row) => ({ x: wx, y: b.y + row }));
    b.charge = null;
    b.phase = 'stunned';
    b.timer = ms(c, RG.BOSS_STUN_MS);
    emitCombat(c, { type: 'bossStunned' });
    emitBus('chargeWallHit', { entityId: fxId(c), cells: wall });
    emitBus('bossStunned', { entityId: fxId(c) });
    return;
  }
  if (!bodyFree(state, c, b.x + ch.dir.x, b.y, true)) {
    // Another actor (enemy, drone) in the way: the ride stops without a stun [R].
    b.charge = null;
    b.phase = 'recover';
    b.timer = ms(c, RG.BOSS_SWING_RECOVERY_MS);
    return;
  }
  const ticks = RG.BOSS_CHARGE_TICKS_PER_CELL;
  moveBody(state, c, ch.dir.x, 0, ticks);
  ch.stepTimer = ticks;
  ch.lane = laneAhead(state, b, ch.dir.x);
  if (!ch.hit && inBody(b, state.player)) {
    ch.hit = true; // hit once per charge
    bossHitPlayer(state, c);
  }
}

function bossHitPlayer(state: GameState, c: CombatData): void {
  const b = c.boss!;
  const roll = combatRng(state).int(RG.BOSS_DMG_MIN, RG.BOSS_DMG_MAX);
  // No depth multiplier for the boss (§2.11): roll → round → player armour.
  const dmg = computeDamage(roll, { armor: c.player.armor }, c.cfg);
  hitPlayer(state, c, dmg, {
    enemyType: BOSS_TYPE,
    enemyIndex: -1,
    from: { x: b.x + 1, y: b.y },
    aim: { x: state.player.x, y: state.player.y },
  });
}

// ---- summon --------------------------------------------------------------------------------------

/** BFS distance (8 dirs, no corner cutting, walls only) from `from`, limited radius. */
function bfsDist(state: GameState, from: Cell, r: number): Map<string, number> {
  const dist = new Map<string, number>([[`${from.x},${from.y}`, 0]]);
  const q: Cell[] = [from];
  for (let i = 0; i < q.length; i++) {
    const cur = q[i]!;
    const d = dist.get(`${cur.x},${cur.y}`)!;
    if (d >= r) continue;
    for (const dir of DIRS8) {
      const nx = cur.x + dir.x;
      const ny = cur.y + dir.y;
      const k = `${nx},${ny}`;
      if (dist.has(k)) continue;
      if (state.map.isSolid(nx, ny)) continue;
      if (
        dir.x !== 0 &&
        dir.y !== 0 &&
        (state.map.isSolid(cur.x + dir.x, cur.y) || state.map.isSolid(cur.x, cur.y + dir.y))
      )
        continue;
      dist.set(k, d + 1);
      q.push({ x: nx, y: ny });
    }
  }
  return dist;
}

/** Summon cells: free, within SUMMON_RADIUS of the body, ≥ SUMMON_MIN_DIST_PLAYER BFS from the
 *  player, not on a track lane (level-m1 §5). Deterministic order (row-major). */
export function summonCandidates(state: GameState, c: CombatData): Cell[] {
  const b = c.boss!;
  const r = RG.SUMMON_RADIUS;
  const dist = bfsDist(state, state.player, RG.SUMMON_MIN_DIST_PLAYER);
  const out: Cell[] = [];
  for (let y = b.y - r; y <= b.y + RG.BOSS_H - 1 + r; y++)
    for (let x = b.x - r; x <= b.x + RG.BOSS_W - 1 + r; x++) {
      const q = { x, y };
      if (inBody(b, q) || state.map.isSolid(x, y) || isEvacTile(state.map, x, y)) continue;
      if (isTrack(state, x, y) || isOccupied(state, x, y)) continue;
      const d = dist.get(`${x},${y}`);
      if (d !== undefined && d < RG.SUMMON_MIN_DIST_PLAYER) continue;
      out.push(q);
    }
  return out;
}

function finishSummon(state: GameState, c: CombatData): void {
  const b = c.boss!;
  b.summoned = true;
  b.phase = 'chase';
  const cand = summonCandidates(state, c);
  const rng = combatRng(state);
  const cells: Cell[] = [];
  for (let i = 0; i < RG.SUMMON_COUNT && cand.length; i++) {
    const cell = cand.splice(rng.int(0, cand.length - 1), 1)[0]!;
    const e = spawnEnemy(state, RG.SUMMON_TYPE, cell, { depth: RG.SUMMON_DEPTH, summoned: true });
    const ec = c.enemies.get(e.id)!;
    ec.ai = 'alert'; // stands for SUMMON_ACTIVATE_MS (grey '!'), then CHASE
    ec.stateTimer = ms(c, RG.SUMMON_ACTIVATE_MS);
    cells.push(cell);
    emitBus('summonedSpawn', { entityId: e.id });
  }
  emitCombat(c, { type: 'bossSummon', cells });
}

// ---- visuals / API -----------------------------------------------------------------------------

/** Part glyphs (data only). Telegraph = swing / charge wind-up; flash wins; stun → `R` exposed. */
export function bossVisuals(state: GameState, c: CombatData): void {
  const b = c.boss;
  if (!b) return;
  const mode: Parameters<typeof COMBAT_STYLE.bossPart>[2] =
    b.hitFlash > 0
      ? 'flash'
      : b.phase === 'swing' || b.phase === 'chargeWindup'
        ? 'telegraph'
        : b.phase === 'stunned'
          ? 'exposed'
          : 'normal';
  parts(state, c).forEach((e, i) => {
    e.glyph =
      b.phase === 'dead'
        ? COMBAT_STYLE.wreck
        : COMBAT_STYLE.bossPart(i % RG.BOSS_W, Math.floor(i / RG.BOSS_W), mode);
  });
}

/** Marker cells for the overlay-less renderer: swing zone (blinking 'x') or lane (steady). */
export function bossMarkers(
  c: CombatData,
): { cells: Cell[]; style: 'swing' | 'lane'; ticksToBlow: number } | null {
  const b = c.boss;
  if (!b) return null;
  if (b.phase === 'swing' && b.swing)
    return { cells: b.swing, style: 'swing', ticksToBlow: b.timer };
  if ((b.phase === 'chargeWindup' || b.phase === 'charging') && b.charge)
    return { cells: b.charge.lane, style: 'lane', ticksToBlow: b.timer };
  return null;
}

export function laneStyle(c: CombatData): GlyphStyle {
  void c;
  return COMBAT_STYLE.bossLane;
}

export function bossCountDown(c: CombatData): void {
  if (c.boss && c.boss.hitFlash > 0) c.boss.hitFlash--;
}
