// Combat M0 (+ M1 rules behind config flags) – PROG / Gameplay.
// Spec: design/mechaniki-m1.md v0.4 – part 1 (§1.1–§1.11), part 2 (§2.5, §2.6, §2.11, §2.13).
// Deterministic and render-independent: runs only inside the engine's fixed tick as two
// systems (core/game.ts registerSystem):
//   'player' phase (before the engine moves the player): §1.1 step 2 – start of player attack
//   'world'  phase (after player movement):              §1.1 steps 3–5 – enemy AI, blows, death
// The engine then decrements moveCooldown / attackWindup / attackCooldown (§1.1 step 6);
// combat's own timers are decremented at the very end of the 'world' phase (same step 6).
import type { GameState } from '../core/game';
import { isOccupied } from '../core/game';
import type { Rng } from '../core/rng';
import {
  COMBAT,
  COMBAT_STRINGS,
  ENEMY_TYPES,
  type CombatConfig,
  type EnemyTypeDef,
  type EnemyTypeId,
} from '../data/combat-m0';
import { COMBAT_STYLE, PLAYER_GLYPH, type GlyphStyle } from '../data/style';
import { createEntity, setCell, type Entity } from '../entities/entity';
import { tryStep, type StepCosts } from '../entities/movement';
import { toDir8, type ActionState, type Dir8 } from '../input/actions';
import { canStep } from '../world/collision';
import {
  bfsFirstStep,
  chebyshev,
  clockAngle,
  DIRS8,
  inMeleeReach,
  lineOfSight,
  sameCell,
  type Cell,
} from './grid';
import type { CombatData, CombatEvent, EnemyCombat, FloatStyle, PlayerCombat } from './state';
import { accumulateTicks, computeTicks, msToTicks } from './timing';

/** Entity kinds created / used by combat. Enemy entity kind = its EnemyTypeId. */
export const ENEMY_KIND: EnemyTypeId = 'crawler';
const FX_KIND = 'combat-fx';
const CORPSE_KIND = 'corpse';

/**
 * THE single place combat draws random numbers from (agreed with PROG / Silnik): the named
 * stream 'combat' of the game RNG. Its state is saved by the engine in the top-level rngState,
 * so CombatSave holds no RNG state. Never call state.rng directly from combat code.
 */
export const combatRng = (state: GameState): Rng => state.rng.stream('combat');

const store = new WeakMap<GameState, CombatData>();

export interface CombatInitOptions {
  cfg?: CombatConfig;
  /** Player respawn cell. Default: player's cell at first access (see defaultSpawn). */
  playerSpawn?: Cell;
  /** §2.11 depth 1..3 (DEPTH_HP_MULT / DEPTH_DMG_MULT index + 1). Default 1 (= M0, ×1). */
  depth?: number;
  /** Player armour A (§2.11, DR = A/(A+100)). Default 0 (M0). */
  playerArmor?: number;
}

/** Combat data of a game state (created lazily on first access / first tick). */
export function getCombat(state: GameState, opts: CombatInitOptions = {}): CombatData {
  let c = store.get(state);
  if (!c) {
    c = initCombat(state, opts);
    store.set(state, c);
  }
  return c;
}

/** Already-initialised combat data, or undefined (render / UI read-only access). */
export const peekCombat = (state: GameState): CombatData | undefined => store.get(state);

/**
 * Respawn cell when none is given: the player's cell when combat starts (= the '@' spawn for a
 * new game). NOTE: after loading a save this is the saved position – GameState does not keep
 * map spawns yet (open question to PROG / Silnik).
 */
function defaultSpawn(state: GameState): Cell {
  return { x: state.player.x, y: state.player.y };
}

function initCombat(state: GameState, opts: CombatInitOptions): CombatData {
  const cfg = opts.cfg ?? COMBAT;
  const t = computeTicks(cfg, cfg.TICK_MS);
  const rng = combatRng(state);
  const c: CombatData = {
    cfg,
    t,
    depth: clampDepth(opts.depth ?? 1, cfg),
    player: newPlayerCombat(opts.playerSpawn ?? defaultSpawn(state), cfg, opts.playerArmor ?? 0),
    enemies: new Map(),
    floats: [],
    events: [],
    death: null,
    lastInputTick: state.tick,
    pauseRequested: false,
    stats: { kills: 0, deaths: 0 },
    fxIds: new Set(),
    strikes: new Map(),
  };
  // The engine spawns 'E' map markers as training dummies → they become Scrap Crawlers.
  for (const e of state.entities) {
    if (e.kind !== 'dummy') continue;
    e.kind = ENEMY_KIND;
    e.glyph = COMBAT_STYLE.enemy[ENEMY_KIND]!;
    c.enemies.set(
      e.id,
      newEnemyCombat(e.id, ENEMY_KIND, { x: e.x, y: e.y }, c, rng.int(t.wanderMin, t.wanderMax)),
    );
  }
  return c;
}

const clampDepth = (d: number, cfg: CombatConfig) =>
  Math.min(cfg.DEPTH_HP_MULT.length, Math.max(1, Math.round(d)));

/** §2.11 depth multiplier (index depth − 1); the boss (ignoresDepth) always ×1. */
function depthMult(table: readonly number[], c: CombatData, type: EnemyTypeDef): number {
  return type.ignoresDepth ? 1 : (table[c.depth - 1] ?? 1);
}

/**
 * Stats of an enemy type. The M0 Scrap Crawler reads the active profile (table 1.14 values,
 * so tuning / test configs apply); other types come from ENEMY_TYPES.
 */
export function enemyDef(c: CombatData, type: EnemyTypeId): EnemyTypeDef {
  if (type !== 'crawler') return ENEMY_TYPES[type];
  const g = c.cfg;
  return {
    hp: g.ENEMY_HP,
    dmgMin: g.ENEMY_DMG_MIN,
    dmgMax: g.ENEMY_DMG_MAX,
    windupMs: g.ENEMY_ATK_WINDUP_MS,
    cooldownMs: g.ENEMY_ATK_COOLDOWN_MS,
    moveMs: g.ENEMY_MOVE_MS,
    moveDiagMs: g.ENEMY_MOVE_DIAG_MS,
    detectRadius: g.ENEMY_DETECT_RADIUS,
    atkRange: g.ENEMY_ATK_RANGE,
    ignoresDepth: false,
  };
}
const typeOf = (c: CombatData, ec: EnemyCombat): EnemyTypeDef => enemyDef(c, ec.type);

/** Enemy max HP for its type at the current depth: round(base × DEPTH_HP_MULT). */
export function enemyMaxHp(c: CombatData, type: EnemyTypeId): number {
  const def = enemyDef(c, type);
  return Math.round(def.hp * depthMult(c.cfg.DEPTH_HP_MULT, c, def));
}

/**
 * §2.11 armour: DR = A / (A + ARMOR_DR_K), at most ARMOR_DR_CAP; damage after DR is floored,
 * never below ARMOR_MIN_DMG. Order: roll → depth multiplier (round) → armour.
 */
export function applyArmor(dmg: number, armor: number, cfg: CombatConfig): number {
  if (armor <= 0) return dmg;
  const dr = Math.min(cfg.ARMOR_DR_CAP, armor / (armor + cfg.ARMOR_DR_K));
  return Math.max(cfg.ARMOR_MIN_DMG, Math.floor(dmg * (1 - dr)));
}

/** Enemy ticks of its type (per-type durations, §1.4 / §2.11). Cached per data object. */
const typeTicksCache = new WeakMap<CombatData, Map<EnemyTypeId, EnemyTicks>>();
interface EnemyTicks {
  move: number;
  moveDiag: number;
  windup: number;
  cooldown: number;
}
function enemyTicks(c: CombatData, type: EnemyTypeId): EnemyTicks {
  let m = typeTicksCache.get(c);
  if (!m) typeTicksCache.set(c, (m = new Map()));
  let t = m.get(type);
  if (!t) {
    const d = enemyDef(c, type);
    const k = (ms: number) => msToTicks(ms, c.cfg.TICK_MS);
    t = {
      move: k(d.moveMs),
      moveDiag: k(d.moveDiagMs),
      windup: k(d.windupMs),
      cooldown: k(d.cooldownMs),
    };
    m.set(type, t);
  }
  return t;
}

/**
 * Spawn an extra enemy of a given type (M1 enemy roster, tests, debug). M0 enemies come from
 * the map's 'E' markers instead. Returns the new entity.
 */
export function spawnEnemy(state: GameState, type: EnemyTypeId, cell: Cell): Entity {
  const c = getCombat(state);
  const e = createEntity(type, cell.x, cell.y, COMBAT_STYLE.enemy[type]!);
  state.entities.push(e);
  c.enemies.set(
    e.id,
    newEnemyCombat(e.id, type, cell, c, combatRng(state).int(c.t.wanderMin, c.t.wanderMax)),
  );
  return e;
}

function newPlayerCombat(spawn: Cell, cfg: CombatConfig, armor: number): PlayerCombat {
  return {
    hp: cfg.PLAYER_HP,
    maxHp: cfg.PLAYER_HP,
    armor,
    attackTimeMod: 0,
    moveTimeMod: 0,
    atkCarry: 0,
    moveCarry: 0,
    queuedTargetId: null,
    spawn: { ...spawn },
    attack: null,
    atkQueued: false,
    prevAttack: false,
    lastCombatTick: -1e9,
    regenAcc: 0,
    hitFlash: 0,
  };
}

function newEnemyCombat(
  id: number,
  type: EnemyTypeId,
  spawn: Cell,
  c: CombatData,
  wander: number,
): EnemyCombat {
  const hp = enemyMaxHp(c, type);
  return {
    id,
    type,
    hp,
    maxHp: hp,
    ai: 'idle',
    spawn: { ...spawn },
    stateTimer: 0,
    attack: null,
    lastSeen: null,
    lostLosTicks: 0,
    wanderTimer: wander,
    deafTimer: 0,
    respawnTimer: 0,
    hitFlash: 0,
  };
}

/**
 * Wind-up encoding on the engine counter: attackWindup = windupTicks + 1 at start, the blow
 * resolves in the 'world' phase of the tick where attackWindup === 1 (then set to 0).
 * Effect: start at tick T → blow at T + windupTicks (player 100 ms, enemy 500 ms, §1.3/§1.4),
 * and the engine's tryStep() sees attackWindup > 0 for the whole wind-up INCLUDING the tick of
 * the blow, so the player cannot step away before his own blow lands (§1.2 "zobowiązanie").
 */
const RESOLVES_NOW = 1;

const entityById = (state: GameState, id: number): Entity | undefined =>
  state.entities.find((e) => e.id === id);

function enemyEntities(state: GameState, c: CombatData): Array<{ e: Entity; ec: EnemyCombat }> {
  const out: Array<{ e: Entity; ec: EnemyCombat }> = [];
  for (const e of state.entities) {
    const ec = c.enemies.get(e.id);
    if (ec) out.push({ e, ec });
  }
  return out;
}

const cellOf = (e: Entity): Cell => ({ x: e.x, y: e.y });

function emit(c: CombatData, ev: CombatEvent): void {
  c.events.push(ev);
}

function floatText(c: CombatData, style: FloatStyle, text: string, cell: Cell): void {
  c.floats.push({ style, text, cell: { ...cell }, ttl: c.t.floatText, maxTtl: c.t.floatText });
}

// =============================================================================================
// 'player' phase – §1.1 step 1 (input) + step 2 (start of player attack)
// =============================================================================================

export function combatPlayerPhase(state: GameState, actions: ActionState): void {
  const c = getCombat(state);
  c.events = [];
  const p = state.player;
  const pc = c.player;
  const any =
    actions.attack ||
    actions.skill1 ||
    actions.skill2 ||
    actions.skill3 ||
    actions.move.x !== 0 ||
    actions.move.y !== 0;
  if (any) c.lastInputTick = state.tick;

  const pressed = actions.attack && !pc.prevAttack; // rising edge = tap (InputManager buffers taps 2 ticks)
  pc.prevAttack = actions.attack;

  if (c.death) {
    // §1.8: the world is frozen – keep the engine from moving the (dead) player this tick.
    p.moveCooldown = Math.max(p.moveCooldown, 1);
    return;
  }

  // §2.6 bump attack (M1 flag): a step into a living enemy = basic attack on THAT enemy.
  if (c.cfg.BUMP_ATTACK_ENABLED && bumpAttack(state, c, toDir8(actions.move))) return;

  // §1.3 ATK queue: a press in the last ATK_QUEUE_MS of cooldown fires when it ends.
  if (pressed && !pc.attack && p.attackCooldown > 0 && p.attackCooldown <= c.t.atkQueue) {
    pc.atkQueued = true;
    pc.queuedTargetId = null;
  }
  if (pc.attack || p.attackCooldown > 0) return;

  // A bump queued in cooldown keeps its own target while still in reach (§2.6).
  const queued =
    pc.queuedTargetId !== null ? livingEnemyInReach(state, c, pc.queuedTargetId) : null;
  const target = queued ?? pickTarget(state, c);
  const tap = pressed || pc.atkQueued;
  // §1.3: hold = auto-attack only with a target; a tap without target swings at `facing`.
  if (!tap && !(actions.attack && target)) return;
  startPlayerAttack(
    state,
    c,
    target,
    target ? cellOf(target) : { x: p.x + p.facing.x, y: p.y + p.facing.y },
  );
}

function startPlayerAttack(
  state: GameState,
  c: CombatData,
  target: Entity | null,
  aim: Cell,
): void {
  const pc = c.player;
  pc.attack = { targetId: target ? target.id : null, aim };
  pc.atkQueued = false;
  pc.queuedTargetId = null;
  // §2.5 speed affixes: wind-up and cooldown share one fractional carry (ACTION_TICK_ACCUMULATOR).
  state.player.attackWindup = playerAttackTicks(c, c.cfg.PLAYER_ATK_WINDUP_MS) + RESOLVES_NOW;
}

/** Whole ticks of a player attack phase with the attack-time modifier and carry (§2.5). */
function playerAttackTicks(c: CombatData, baseMs: number): number {
  const pc = c.player;
  const r = accumulateTicks(
    baseMs * (1 + pc.attackTimeMod),
    c.cfg.TICK_MS,
    pc.atkCarry,
    c.cfg.ACTION_TICK_ACCUMULATOR,
  );
  pc.atkCarry = r.carry;
  return r.ticks;
}

/**
 * §2.6: move direction points at a living enemy cell that the step geometry allows (no corner
 * cutting) → attack it instead of moving. Cooldown running → the bump is queued like ATK in the
 * last ATK_QUEUE_MS, otherwise it only turns the player (the engine's tryStep is blocked by the
 * enemy anyway). Returns true when the direction was consumed as a bump.
 */
function bumpAttack(state: GameState, c: CombatData, dir: Dir8 | null): boolean {
  if (!dir) return false;
  const p = state.player;
  const pc = c.player;
  const cell = { x: p.x + dir.x, y: p.y + dir.y };
  const hit = enemyEntities(state, c).find(({ e, ec }) => ec.ai !== 'dead' && sameCell(e, cell));
  if (!hit || !canStep(state.map, p.x, p.y, dir.x, dir.y)) return false;
  if (pc.attack || p.attackWindup > 0) return true;
  p.facing = { x: dir.x, y: dir.y };
  if (p.attackCooldown > 0) {
    if (p.attackCooldown <= c.t.atkQueue) {
      pc.atkQueued = true;
      pc.queuedTargetId = hit.e.id;
    }
    return true;
  }
  startPlayerAttack(state, c, hit.e, cellOf(hit.e));
  return true;
}

function livingEnemyInReach(state: GameState, c: CombatData, id: number): Entity | null {
  const ec = c.enemies.get(id);
  const e = entityById(state, id);
  if (!e || !ec || ec.ai === 'dead') return null;
  return inMeleeReach(state.map, cellOf(state.player), cellOf(e), c.cfg.PLAYER_ATK_RANGE)
    ? e
    : null;
}

/**
 * §1.3 auto-target: nearest living enemy in reach; tie → the one in the `facing` direction,
 * then the first clockwise from north. Frozen at attack start.
 */
export function pickTarget(state: GameState, c: CombatData = getCombat(state)): Entity | null {
  const p = state.player;
  let best: Entity | null = null;
  let bestKey: [number, number, number] = [Infinity, Infinity, Infinity];
  for (const { e, ec } of enemyEntities(state, c)) {
    if (ec.ai === 'dead' || !inMeleeReach(state.map, cellOf(p), cellOf(e), c.cfg.PLAYER_ATK_RANGE))
      continue;
    const d = { x: e.x - p.x, y: e.y - p.y };
    const facing = Math.sign(d.x) === p.facing.x && Math.sign(d.y) === p.facing.y ? 0 : 1;
    const key: [number, number, number] = [chebyshev(p, e), facing, clockAngle(d)];
    if (
      key[0] < bestKey[0] ||
      (key[0] === bestKey[0] &&
        (key[1] < bestKey[1] || (key[1] === bestKey[1] && key[2] < bestKey[2])))
    ) {
      best = e;
      bestKey = key;
    }
  }
  return best;
}

// =============================================================================================
// 'world' phase – §1.1 steps 3–5 (+ combat timers of step 6)
// =============================================================================================

export function combatWorldPhase(state: GameState, actions: ActionState): void {
  void actions;
  const c = getCombat(state);
  if (c.death) {
    stepDeath(state, c);
  } else {
    applyPlayerMoveAffix(state, c); // engine just moved the player (step 2) – §2.5 speed affix
    const enemies = enemyEntities(state, c);
    for (const { e, ec } of enemies) enemyAi(state, c, e, ec); // 3
    resolvePlayerBlow(state, c); // 4a – player first
    for (const { e, ec } of enemies) resolveEnemyBlow(state, c, e, ec); // 4b
    for (const { e, ec } of enemies) enemyLifecycle(state, c, e, ec); // 5
    if (c.player.hp <= 0) killPlayer(state, c);
    else regen(state, c); // M0 test aid only; M1 profile has PLAYER_REGEN_PER_S = 0 (§2.13)
  }
  updateVisuals(state, c);
  countDown(c);
}

/**
 * §2.5: the engine charged a plain step cost (PLAYER_STEP_COSTS); with a move-time modifier
 * the cooldown is recomputed here through the tick accumulator. Runs in the same tick, before
 * the step-6 decrement, so the effect is identical to the engine charging it.
 */
function applyPlayerMoveAffix(state: GameState, c: CombatData): void {
  const p = state.player;
  const pc = c.player;
  if (pc.moveTimeMod === 0 || p.moveTick !== state.tick || p.moveTicks <= 0) return;
  const diag = p.x !== p.fromX && p.y !== p.fromY;
  const base = diag ? c.cfg.PLAYER_MOVE_DIAG_MS : c.cfg.PLAYER_MOVE_MS;
  const r = accumulateTicks(
    base * (1 + pc.moveTimeMod),
    c.cfg.TICK_MS,
    pc.moveCarry,
    c.cfg.ACTION_TICK_ACCUMULATOR,
  );
  pc.moveCarry = r.carry;
  p.moveTicks = r.ticks;
  p.moveCooldown = r.ticks;
}

// ---- 3. enemy AI (§1.6) ----------------------------------------------------------------------

function enemyCosts(c: CombatData, ec: EnemyCombat): StepCosts {
  const t = enemyTicks(c, ec.type);
  return { straightTicks: t.move, diagTicks: t.moveDiag };
}

function enemyAi(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.ai === 'dead') return;
  const p = state.player;
  const dist = chebyshev(e, p);
  const los = lineOfSight(state.map, e, p);
  const detects = dist <= typeOf(c, ec).detectRadius && los;
  switch (ec.ai) {
    case 'idle':
      if (detects) {
        ec.ai = 'alert';
        ec.stateTimer = c.t.enemyAlert;
      } else wander(state, c, e, ec);
      return;
    case 'alert':
      if (ec.stateTimer > 0) return;
      startChase(ec, p);
      chase(state, c, e, ec, dist, los);
      return;
    case 'chase':
      chase(state, c, e, ec, dist, los);
      return;
    case 'attack':
      if (ec.attack || e.attackCooldown > 0) return; // telegraph / standing in cooldown
      if (inMeleeReach(state.map, e, p, typeOf(c, ec).atkRange)) startEnemyAttack(state, c, e, ec);
      else {
        ec.ai = 'chase';
        chase(state, c, e, ec, dist, los);
      }
      return;
    case 'return':
      if (ec.deafTimer === 0 && detects) {
        startChase(ec, p);
        chase(state, c, e, ec, dist, los);
      } else if (sameCell(e, ec.spawn)) {
        ec.hp = ec.maxHp; // §1.6: back on spawn → full HP
        ec.ai = 'idle';
        ec.wanderTimer = combatRng(state).int(c.t.wanderMin, c.t.wanderMax);
      } else stepToward(state, c, e, ec, ec.spawn);
      return;
  }
}

function startChase(ec: EnemyCombat, playerCell: Cell): void {
  ec.ai = 'chase';
  ec.lostLosTicks = 0;
  ec.lastSeen = { x: playerCell.x, y: playerCell.y };
}

function startEnemyAttack(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  ec.ai = 'attack';
  ec.attack = { aim: cellOf(state.player) }; // §1.6: frozen target cell
  e.attackWindup = enemyTicks(c, ec.type).windup + RESOLVES_NOW;
  e.facing = { x: Math.sign(state.player.x - e.x), y: Math.sign(state.player.y - e.y) };
}

function chase(
  state: GameState,
  c: CombatData,
  e: Entity,
  ec: EnemyCombat,
  dist: number,
  los: boolean,
): void {
  const p = state.player;
  if (los) {
    ec.lastSeen = cellOf(p);
    ec.lostLosTicks = 0;
  } else ec.lostLosTicks++;
  if (dist > c.cfg.ENEMY_LEASH_RADIUS || ec.lostLosTicks >= c.t.enemyLostLos) {
    ec.ai = 'return';
    ec.deafTimer = c.t.enemyReturnDeaf;
    ec.lastSeen = null;
    stepToward(state, c, e, ec, ec.spawn);
    return;
  }
  if (e.attackCooldown === 0 && inMeleeReach(state.map, e, p, typeOf(c, ec).atkRange)) {
    startEnemyAttack(state, c, e, ec);
    return;
  }
  const goal = los ? cellOf(p) : ec.lastSeen;
  if (goal && !sameCell(goal, e)) stepToward(state, c, e, ec, goal);
}

/** One BFS step (recomputed every step, §1.6). Blocked → wait and retry next tick. */
function stepToward(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat, goal: Cell): void {
  if (e.moveCooldown > 0 || e.attackWindup > 0) return;
  const occ = (x: number, y: number) => isOccupied(state, x, y, e);
  const step = bfsFirstStep(state.map, e, goal, c.cfg.ENEMY_PATH_RADIUS, occ);
  if (!step) return;
  tryStep(
    e,
    { x: step.x as -1 | 0 | 1, y: step.y as -1 | 0 | 1 },
    state.map,
    enemyCosts(c, ec),
    state.tick,
    occ,
  );
}

function wander(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.wanderTimer > 0 || e.moveCooldown > 0) return;
  const rng = combatRng(state);
  ec.wanderTimer = rng.int(c.t.wanderMin, c.t.wanderMax);
  const d = DIRS8[rng.int(0, 7)]!;
  if (chebyshev({ x: e.x + d.x, y: e.y + d.y }, ec.spawn) > c.cfg.ENEMY_WANDER_RADIUS) return;
  tryStep(
    e,
    { x: d.x as -1 | 0 | 1, y: d.y as -1 | 0 | 1 },
    state.map,
    enemyCosts(c, ec),
    state.tick,
    (x, y) => isOccupied(state, x, y, e),
  );
}

// ---- 4. blows ----------------------------------------------------------------------------------

function resolvePlayerBlow(state: GameState, c: CombatData): void {
  const p = state.player;
  const a = c.player.attack;
  if (!a || p.attackWindup > RESOLVES_NOW) return;
  c.player.attack = null;
  p.attackWindup = 0;
  p.attackCooldown = playerAttackTicks(c, c.cfg.PLAYER_ATK_COOLDOWN_MS);
  const reach = (e: Entity) => inMeleeReach(state.map, p, e, c.cfg.PLAYER_ATK_RANGE);
  let victim: { e: Entity; ec: EnemyCombat } | undefined;
  for (const it of enemyEntities(state, c)) {
    if (it.ec.ai === 'dead' || !reach(it.e)) continue;
    if (a.targetId !== null ? it.e.id === a.targetId : sameCell(it.e, a.aim)) victim = it;
  }
  addStrike(state, c, victim ? cellOf(victim.e) : a.aim);
  if (!victim) {
    emit(c, { type: 'playerWhiff' });
    if (a.targetId !== null) {
      const t = entityById(state, a.targetId);
      floatText(c, 'miss', COMBAT_STRINGS.miss, t ? cellOf(t) : a.aim);
    }
    return;
  }
  const { cfg } = c;
  const rng = combatRng(state);
  const base = rng.int(cfg.PLAYER_DMG_MIN, cfg.PLAYER_DMG_MAX);
  const crit = rng.next() < cfg.PLAYER_CRIT_CHANCE;
  const dmg = crit ? Math.floor(base * cfg.PLAYER_CRIT_MULT) : base;
  const { e, ec } = victim;
  ec.hp -= dmg;
  ec.hitFlash = c.t.hitFlash;
  c.player.lastCombatTick = state.tick;
  floatText(c, crit ? 'critToEnemy' : 'dmgToEnemy', crit ? `-${dmg}!` : `-${dmg}`, cellOf(e));
  emit(c, { type: 'enemyHit', enemyId: e.id, dmg, crit });
  // §1.6: damage wakes the enemy from IDLE / ALERT / RETURN (even inside the deaf window).
  if (ec.hp > 0 && (ec.ai === 'idle' || ec.ai === 'alert' || ec.ai === 'return')) startChase(ec, p);
}

function resolveEnemyBlow(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  const a = ec.attack;
  if (!a || e.attackWindup > RESOLVES_NOW) return;
  ec.attack = null;
  e.attackWindup = 0;
  if (ec.hp <= 0) return; // killed by the player earlier in step 4 → no blow (§1.1)
  e.attackCooldown = enemyTicks(c, ec.type).cooldown;
  addStrike(state, c, a.aim);
  const p = state.player;
  const pc = c.player;
  if (pc.hp > 0 && sameCell(p, a.aim)) {
    const dmg = enemyDamage(
      c,
      typeOf(c, ec),
      combatRng(state).int(typeOf(c, ec).dmgMin, typeOf(c, ec).dmgMax),
    );
    pc.hp -= dmg;
    pc.hitFlash = c.t.hitFlash;
    pc.lastCombatTick = state.tick;
    floatText(c, 'dmgToPlayer', `-${dmg}`, a.aim);
    emit(c, { type: 'playerHit', dmg });
    // §1.11 trigger D: hit while no input for AUTOPAUSE_IDLE_HIT_MS.
    if (state.tick - c.lastInputTick >= c.t.autopauseIdleHit) {
      c.pauseRequested = true;
      emit(c, { type: 'autoPauseRequest', reason: 'hitWhileAway' });
    }
  } else {
    floatText(c, 'miss', COMBAT_STRINGS.miss, cellOf(e));
    emit(c, { type: 'enemyMiss', enemyId: e.id });
  }
}

/** Roll → ×DEPTH_DMG_MULT (rounded) → player armour (§2.11). */
export function enemyDamage(c: CombatData, type: EnemyTypeDef, roll: number): number {
  const scaled = Math.round(roll * depthMult(c.cfg.DEPTH_DMG_MULT, c, type));
  return applyArmor(scaled, c.player.armor, c.cfg);
}

// ---- 5. death / respawn / regen ----------------------------------------------------------------

function enemyLifecycle(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.ai !== 'dead' && ec.hp <= 0) {
    // §1.9: the enemy entity itself becomes the passable wreck '%' until respawn.
    ec.ai = 'dead';
    ec.hp = 0;
    ec.attack = null;
    ec.respawnTimer = c.t.enemyRespawn;
    e.solid = false;
    e.attackWindup = 0;
    c.stats.kills++;
    floatText(c, 'kill', COMBAT_STRINGS.kill, cellOf(e));
    emit(c, { type: 'enemyKilled', enemyId: e.id });
    return;
  }
  if (
    ec.ai === 'dead' &&
    ec.respawnTimer === 0 &&
    chebyshev(state.player, ec.spawn) >= c.cfg.ENEMY_RESPAWN_MIN_DIST
  ) {
    resetEnemy(state, c, e, ec);
    emit(c, { type: 'enemyRespawned', enemyId: e.id });
  }
}

function resetEnemy(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  Object.assign(
    ec,
    newEnemyCombat(ec.id, ec.type, ec.spawn, c, combatRng(state).int(c.t.wanderMin, c.t.wanderMax)),
  );
  setCell(e, ec.spawn.x, ec.spawn.y);
  e.solid = true;
  e.moveCooldown = 0;
  e.attackWindup = 0;
  e.attackCooldown = 0;
}

function killPlayer(state: GameState, c: CombatData): void {
  const p = state.player;
  c.player.hp = 0;
  c.player.attack = null;
  p.attackWindup = 0;
  // §1.8: body '%' at the death cell. M0 keeps only the latest one.
  for (const e of state.entities) if (e.kind === CORPSE_KIND) c.fxIds.delete(e.id);
  state.entities = state.entities.filter((e) => e.kind !== CORPSE_KIND);
  const body = createEntity(CORPSE_KIND, p.x, p.y, COMBAT_STYLE.playerCorpse);
  body.solid = false;
  state.entities.unshift(body); // drawn under everything else
  c.stats.deaths++;
  c.death = { freezeLeft: c.t.deathFreeze, respawnLeft: c.t.respawn };
  emit(c, { type: 'playerDied' });
}

function stepDeath(state: GameState, c: CombatData): void {
  const d = c.death!;
  if (d.freezeLeft > 0) d.freezeLeft--;
  else if (d.respawnLeft > 0) d.respawnLeft--;
  if (d.freezeLeft > 0 || d.respawnLeft > 0) return;
  // §1.8 respawn: start cell, full HP; enemies reset on spawn (full HP, IDLE).
  const p = state.player;
  const spawn = c.player.spawn;
  const old = c.player;
  c.player = newPlayerCombat(spawn, c.cfg, old.armor);
  c.player.attackTimeMod = old.attackTimeMod; // equipment survives death
  c.player.moveTimeMod = old.moveTimeMod;
  c.player.prevAttack = true; // a still-held ATK must be pressed again
  c.death = null;
  for (const { e, ec } of enemyEntities(state, c)) resetEnemy(state, c, e, ec);
  setCell(p, spawn.x, spawn.y);
  p.facing = { x: 1, y: 0 };
  p.moveCooldown = 0;
  p.attackWindup = 0;
  p.attackCooldown = 0;
  emit(c, { type: 'playerRespawned' });
}

function regen(state: GameState, c: CombatData): void {
  const pc = c.player;
  const engaged = [...c.enemies.values()].some((ec) => ec.ai === 'chase' || ec.ai === 'attack');
  if (
    pc.hp >= pc.maxHp ||
    engaged ||
    state.tick - pc.lastCombatTick < c.t.regenDelay ||
    c.cfg.PLAYER_REGEN_PER_S <= 0
  ) {
    pc.regenAcc = 0;
    return;
  }
  // Integer HP from a milli-HP accumulator: 5 HP/s at 50 ms ticks = +1 HP every 4 ticks.
  pc.regenAcc += c.cfg.PLAYER_REGEN_PER_S * c.cfg.TICK_MS;
  while (pc.regenAcc >= 1000 && pc.hp < pc.maxHp) {
    pc.hp++;
    pc.regenAcc -= 1000;
  }
}

// ---- visuals (data only: glyphs of entities + fx entities; the renderer just draws) -----------

function addStrike(state: GameState, c: CombatData, cell: Cell): void {
  const fx = createEntity(FX_KIND, cell.x, cell.y, COMBAT_STYLE.strike);
  fx.solid = false;
  state.entities.push(fx);
  c.fxIds.add(fx.id);
  c.strikes.set(fx.id, c.t.strikeFx);
}

/**
 * §1.7 / GRAF §9: ONE glyph per type. Wind-up → inverted cell (magenta bg, dark glyph); the
 * yellow '!' above it is drawn by combat/overlay.ts. Hit flash (100 ms) → white cell, wins.
 */
export function enemyGlyph(ec: EnemyCombat): GlyphStyle {
  const base = COMBAT_STYLE.enemy[ec.type]!;
  if (ec.hitFlash > 0)
    return { ...base, fg: COMBAT_STYLE.enemyFlashFg, bg: COMBAT_STYLE.enemyFlashBg };
  if (ec.attack)
    return { ...base, fg: COMBAT_STYLE.enemyTelegraphFg, bg: COMBAT_STYLE.enemyTelegraphBg };
  return base;
}

/**
 * "Reduce motion" (§1.7 pt 3–4): telegraph 'x' steady, no blinking. Visual only – never
 * affects logic. Set by PROG / UI from its settings (no global setting exists yet).
 */
let reduceMotion = false;
export function setCombatReduceMotion(on: boolean): void {
  reduceMotion = on;
}

/** §1.7 blink: on/off every TELEGRAPH_BLINK_MS, every TELEGRAPH_FAST_BLINK_MS in the last 150 ms. */
export function telegraphBlinkOn(ticksToBlow: number, c: CombatData): boolean {
  if (reduceMotion) return true;
  const period = ticksToBlow <= c.t.telegraphFastLast ? c.t.telegraphFastBlink : c.t.telegraphBlink;
  return Math.floor(ticksToBlow / Math.max(1, period)) % 2 === 0;
}

function updateVisuals(state: GameState, c: CombatData): void {
  const p = state.player;
  // Remove last tick's telegraph markers; expire strikes.
  const keep = new Set<number>();
  for (const [id, left] of c.strikes) if (left > 0) keep.add(id);
  state.entities = state.entities.filter((e) => {
    if (e.kind !== FX_KIND) return true;
    if (keep.has(e.id)) return true;
    c.fxIds.delete(e.id);
    c.strikes.delete(e.id);
    return false;
  });

  let playerGlyph: GlyphStyle = PLAYER_GLYPH;
  if (c.player.hitFlash > 0) playerGlyph = COMBAT_STYLE.playerHit;
  const markers: Entity[] = [];
  for (const { e, ec } of enemyEntities(state, c)) {
    if (ec.ai === 'dead') {
      e.glyph = COMBAT_STYLE.wreck;
      continue;
    }
    e.glyph = enemyGlyph(ec);
    if (!ec.attack) continue;
    const ticksToBlow = Math.max(0, e.attackWindup - RESOLVES_NOW);
    const on = telegraphBlinkOn(ticksToBlow, c);
    if (sameCell(p, ec.attack.aim) && !c.death) {
      // Player on the frozen cell: player glyph alternates with 'x' (dark magenta background).
      playerGlyph = on ? COMBAT_STYLE.telegraphCell : COMBAT_STYLE.playerOnTelegraph;
    } else {
      const m = createEntity(FX_KIND, ec.attack.aim.x, ec.attack.aim.y, COMBAT_STYLE.telegraphCell);
      m.solid = false;
      markers.push(m);
    }
  }
  for (const m of markers) c.fxIds.add(m.id);
  // Markers under actors (start of the list, after corpses).
  const firstNonCorpse = state.entities.findIndex((e) => e.kind !== CORPSE_KIND);
  state.entities.splice(firstNonCorpse < 0 ? state.entities.length : firstNonCorpse, 0, ...markers);
  p.glyph = c.death ? COMBAT_STYLE.playerCorpse : playerGlyph;
}

// ---- 6. combat timers --------------------------------------------------------------------------

const dec = (v: number) => (v > 0 ? v - 1 : 0);

function countDown(c: CombatData): void {
  c.player.hitFlash = dec(c.player.hitFlash);
  for (const ec of c.enemies.values()) {
    ec.stateTimer = dec(ec.stateTimer);
    ec.wanderTimer = dec(ec.wanderTimer);
    ec.deafTimer = dec(ec.deafTimer);
    ec.respawnTimer = dec(ec.respawnTimer);
    ec.hitFlash = dec(ec.hitFlash);
  }
  for (const [id, left] of c.strikes) c.strikes.set(id, dec(left));
  for (const f of c.floats) f.ttl--;
  c.floats = c.floats.filter((f) => f.ttl > 0);
}

// ---- public helpers for main.ts / UI ---------------------------------------------------------

/** §1.11 trigger D: returns true once after a "hit while away"; main.ts then auto-pauses. */
export function takeAutoPauseRequest(state: GameState): boolean {
  const c = store.get(state);
  if (!c?.pauseRequested) return false;
  c.pauseRequested = false;
  return true;
}

/** Read-only numbers for the HUD (PROG / UI): HP bar `HP [########--] 80/100`. */
export function getCombatHud(state: GameState): {
  hp: number;
  maxHp: number;
  dead: boolean;
  kills: number;
  deaths: number;
} {
  const c = getCombat(state);
  return {
    hp: Math.max(0, c.player.hp),
    maxHp: c.player.maxHp,
    dead: c.death !== null,
    kills: c.stats.kills,
    deaths: c.stats.deaths,
  };
}

/** Helper: quantised move direction as the engine sees it (debug / tests). */
export const engineDir = (a: ActionState) => toDir8(a.move);
