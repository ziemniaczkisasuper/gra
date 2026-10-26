// Combat (M0 + M1 rules behind profile flags) – PROG / Gameplay.
// Spec: design/mechaniki-m1.md v0.4 – part 1 (§1.1–§1.11), part 2 (§2.5 skills, §2.6 bump,
// §2.8 Scrapper, §2.10 multi-enemy AI, tokens, drone provocation, §2.11 enemies / depth / armour,
// §2.13 no regen); numbers: data/combat-m0.ts (balans-m1.md v1.0 for the enemies).
// Deterministic and render-independent: runs only inside the engine's fixed tick as two
// systems (core/game.ts registerSystem):
//   'player' phase (before the engine moves the player): §1.1 step 2 – skills, bump, attack start
//   'world'  phase (after player movement):              §1.1 steps 3–5 – AI, blows, death
// The engine then decrements moveCooldown / attackWindup / attackCooldown (§1.1 step 6);
// combat's own timers are decremented at the very end of the 'world' phase (same step 6).
// Randomness: ONLY combatRng(state) (= state.rng.stream('combat'), saved by the engine).
import type { GameState } from '../core/game';
import { isOccupied } from '../core/game';
import type { Rng } from '../core/rng';
import {
  COMBAT,
  COMBAT_PROFILES,
  COMBAT_STRINGS,
  DEFAULT_SKILL_SLOTS,
  ENEMY_TYPES,
  RAIL_GUARDIAN,
  SKILLS,
  SKILL_IDS,
  type CombatConfig,
  type CombatProfileId,
  type EnemyTypeDef,
  type EnemyTypeId,
  type SkillId,
  EVAC_TILE,
  enemyDiagMs,
} from '../data/combat-m0';
import { ITEM_DEFS } from '../data/inventory-m1';
import { MAPS } from '../data/maps';
import {
  COMBAT_STYLE,
  combatEnemyFlashGlyph,
  combatEnemyGlyph,
  combatEnemyTelegraphGlyph,
  PLAYER_GLYPH,
  type GlyphStyle,
} from '../data/style';
import { createEntity, setCell, type Entity } from '../entities/entity';
import { tryStep, type StepCosts } from '../entities/movement';
import { toDir8, type ActionState, type Dir8 } from '../input/actions';
import { autoAimEnabled } from '../ui/settings';
import { canStep } from '../world/collision';
import { parseMap, type TileMap } from '../world/tilemap';
import {
  arcCells,
  bfsFirstStep,
  chebyshev,
  clockAngle,
  DIRS8,
  inMeleeReach,
  isDiagonal,
  lineOfSight,
  sameCell,
  type Cell,
} from './grid';
import { buildShot, stepProjectiles, type PlayerProjectile } from './projectiles';
import type {
  AttackTarget,
  CombatData,
  CombatEvent,
  DeathCause,
  DroneState,
  EnemyCombat,
  FloatStyle,
  PlayerCombat,
  PlayerHitInfo,
} from './state';
import { accumulateTicks, computeTicks, msToTicks } from './timing';
import {
  bossAi,
  bossAlive,
  bossArenaCheck,
  bossCountDown,
  bossHoldsToken,
  bossMarkers,
  bossResolve,
  bossVisuals,
  damageBoss,
  isBossPart,
  laneStyle,
  resetBossArena,
} from './boss';

/** Entity kinds created / used by combat. Enemy entity kind = its EnemyTypeId. */
export const ENEMY_KIND: EnemyTypeId = 'crawler';
export const FX_KIND = 'combat-fx';
export const CORPSE_KIND = 'corpse';
export const DRONE_KIND = 'buddyDrone';

/**
 * THE single place combat draws random numbers from (agreed with PROG / Silnik): the named
 * stream 'combat' of the game RNG. Its state is saved by the engine in the top-level rngState,
 * so CombatSave holds no RNG state. Never call state.rng directly from combat code.
 */
export function combatRng(state: GameState): Rng {
  return state.rng.stream('combat');
}

const store = new WeakMap<GameState, CombatData>();

export interface CombatInitOptions {
  cfg?: CombatConfig;
  /** Player respawn cell. Default: the map's '@' (mapSpawn), else the player's cell. */
  playerSpawn?: Cell;
  /** §2.11 depth 1..3 (DEPTH_HP_MULT / DEPTH_DMG_MULT index + 1). Default 1 (= M0, ×1). */
  depth?: number;
  /** Player armour A (§2.11, DR = A/(A+100)). Default 0 (M0). */
  playerArmor?: number;
  /** Profile id (cfg is code, not data). Default: id of `cfg` in COMBAT_PROFILES. */
  profile?: string;
}

/** S12: hits kept for the death screen (M1_DEATH_02 "3 last hits"). */
const DEATH_HITS_KEPT = 3;

/** Options set by setCombatProfile() before combat data exists (used by the lazy init). */
const pending = new WeakMap<GameState, CombatInitOptions>();

/** Combat data of a game state (created lazily on first access / first tick). */
export function getCombat(state: GameState, opts: CombatInitOptions = {}): CombatData {
  let c = store.get(state);
  if (!c) {
    c = initCombat(state, { ...pending.get(state), ...opts });
    store.set(state, c);
  }
  return c;
}

/** Already-initialised combat data, or undefined (render / UI read-only access). */
export const peekCombat = (state: GameState): CombatData | undefined => store.get(state);

/**
 * PROG / Silnik API: combat profile + depth of the current zone. Called on zone entry and right
 * after gameFromSave (so neither is stored in CombatSave). Idempotent, draws NO random numbers.
 * Enemies keep the stats they were spawned with; the depth damage multiplier applies to every
 * blow from the call on. Before the first tick it only records the options for the lazy init.
 */
export function setCombatProfile(
  state: GameState,
  profile: CombatProfileId,
  depth: 1 | 2 | 3,
  opts: { playerSpawn?: Cell } = {},
): void {
  const cfg = COMBAT_PROFILES[profile];
  const c = store.get(state);
  if (!c) {
    pending.set(state, { ...pending.get(state), cfg, profile, depth, ...opts });
    return;
  }
  if (opts.playerSpawn) c.player.spawn = { ...opts.playerSpawn };
  if (c.profile === profile && c.depth === depth && c.cfg === cfg) return;
  c.cfg = cfg;
  c.t = computeTicks(cfg, cfg.TICK_MS);
  c.profile = profile;
  c.depth = clampDepth(depth, cfg);
  typeTicksCache.delete(c);
}

/**
 * Player respawn point (§1.8, QA-M0-004): the '@' of the map definition this TileMap was built
 * from (data/maps MAPS, matched tile by tile). GameState does not keep map spawns yet (asked
 * PROG / Silnik); unknown maps fall back to the player's current cell.
 */
const spawnCache = new WeakMap<TileMap, Cell | null>();
let parsedMaps: Array<{ map: TileMap; spawn: Cell | null }> | null = null;
export function mapSpawn(map: TileMap): Cell | null {
  if (spawnCache.has(map)) return spawnCache.get(map)!;
  parsedMaps ??= Object.values(MAPS).map((rows) => {
    const { map: m, spawns } = parseMap(rows);
    const s = spawns.find((q) => q.ch === '@');
    return { map: m, spawn: s ? { x: s.x, y: s.y } : null };
  });
  let found: Cell | null = null;
  for (const cand of parsedMaps) {
    if (cand.map.width !== map.width || cand.map.height !== map.height) continue;
    let same = true;
    for (let y = 0; y < map.height && same; y++)
      for (let x = 0; x < map.width; x++)
        if (cand.map.tile(x, y) !== map.tile(x, y)) {
          same = false;
          break;
        }
    if (same) {
      found = cand.spawn;
      break;
    }
  }
  spawnCache.set(map, found);
  return found;
}

function defaultSpawn(state: GameState): Cell {
  return mapSpawn(state.map) ?? { x: state.player.x, y: state.player.y };
}

/**
 * Empty combat data (no enemies) – draws NO random numbers, so a save restore (combat/save.ts)
 * keeps the restored 'combat' stream untouched.
 */
export function createCombatData(state: GameState, opts: CombatInitOptions = {}): CombatData {
  const o = { ...pending.get(state), ...opts };
  const cfg = o.cfg ?? COMBAT;
  const t = computeTicks(cfg, cfg.TICK_MS);
  return {
    cfg,
    t,
    depth: clampDepth(o.depth ?? 1, cfg),
    profile: o.profile ?? profileIdOf(cfg),
    player: newPlayerCombat(o.playerSpawn ?? defaultSpawn(state), cfg, o.playerArmor ?? 0),
    enemies: new Map(),
    drone: null,
    recentHits: [],
    deathCause: null,
    tokenTick: { player: -1e9, drone: -1e9 },
    floats: [],
    events: [],
    death: null,
    lastInputTick: state.tick,
    pauseRequested: false,
    stats: { kills: 0, deaths: 0 },
    fxIds: new Set(),
    strikes: new Map(),
    boss: null,
    projectiles: [],
    nextProjectileId: 1,
    tokenPriority: [],
    tick: state.tick,
  };
}

/** Id of a known profile object, else 'custom' (restored as the default profile). */
export function profileIdOf(cfg: CombatConfig): string {
  for (const [id, p] of Object.entries(COMBAT_PROFILES)) if (p === cfg) return id;
  return 'custom';
}

/** Replace the combat data of a state (save restore). */
export function setCombat(state: GameState, c: CombatData): void {
  store.set(state, c);
}

function initCombat(state: GameState, opts: CombatInitOptions): CombatData {
  const c = createCombatData(state, opts);
  const { t } = c;
  const rng = combatRng(state);
  // The engine spawns 'E' map markers as training dummies → they become Scrap Crawlers.
  for (const e of state.entities) {
    if (e.kind !== 'dummy') continue;
    e.kind = ENEMY_KIND;
    e.glyph = combatEnemyGlyph(ENEMY_KIND);
    c.enemies.set(
      e.id,
      newEnemyCombat(e.id, ENEMY_KIND, { x: e.x, y: e.y }, c, rng.int(t.wanderMin, t.wanderMax)),
    );
  }
  return c;
}

const clampDepth = (d: number, cfg: CombatConfig) =>
  Math.min(cfg.DEPTH_HP_MULT.length, Math.max(1, Math.round(d)));

/** §2.11 depth multiplier (index depth − 1); the boss (ignoresDepth) always ×1; `depth`
 *  overrides the zone depth (boss summons = depth 3). */
function depthMult(
  table: readonly number[],
  c: CombatData,
  type: EnemyTypeDef,
  depth: number | null = null,
): number {
  return type.ignoresDepth ? 1 : (table[(depth ?? c.depth) - 1] ?? 1);
}

/**
 * Stats of an enemy type. The M0 Scrap Crawler reads the active profile (table 1.14 values,
 * so tuning / test configs apply); other types come from ENEMY_TYPES.
 */
export function enemyDef(c: CombatData, type: EnemyTypeId): EnemyTypeDef {
  if (type !== 'crawler') return ENEMY_TYPES[type];
  const g = c.cfg;
  return {
    ...ENEMY_TYPES.crawler,
    hp: g.ENEMY_HP,
    dmgMin: g.ENEMY_DMG_MIN,
    dmgMax: g.ENEMY_DMG_MAX,
    windupMs: g.ENEMY_ATK_WINDUP_MS,
    cooldownMs: g.ENEMY_ATK_COOLDOWN_MS,
    moveMs: g.ENEMY_MOVE_MS,
    detectRadius: g.ENEMY_DETECT_RADIUS,
    atkRange: g.ENEMY_ATK_RANGE,
  };
}
const typeOf = (c: CombatData, ec: EnemyCombat): EnemyTypeDef => enemyDef(c, ec.type);
const isMobile = (d: EnemyTypeDef) => d.moveMs > 0;

/** Enemy max HP for its type at the current depth: round(base × DEPTH_HP_MULT). */
export function enemyMaxHp(c: CombatData, type: EnemyTypeId, depth: number | null = null): number {
  const def = enemyDef(c, type);
  return Math.round(def.hp * depthMult(c.cfg.DEPTH_HP_MULT, c, def, depth));
}

/** §2.11 armour (player only): DR = A/(A+K) capped, floor, min ARMOR_MIN_DMG. */
export function applyArmor(dmg: number, armor: number, cfg: CombatConfig): number {
  if (armor <= 0) return dmg;
  const dr = Math.min(cfg.ARMOR_DR_CAP, armor / (armor + cfg.ARMOR_DR_K));
  return Math.max(cfg.ARMOR_MIN_DMG, Math.floor(dmg * (1 - dr)));
}

/**
 * THE damage formula (mechaniki v0.5.2): roll → crit ×CRIT_MULT → Momentum ×(1+bonus) →
 * ×depth multiplier → ONE round → armour floor(dmg × (1 − DR)), DR ≤ 60 %, min 1.
 * The depth multiplier is for enemy blows only (player blows ×1.0). Unused steps are neutral.
 */
export function computeDamage(
  roll: number,
  o: { crit?: boolean; momentum?: boolean; depthMult?: number; armor?: number },
  cfg: CombatConfig,
): number {
  let d = roll;
  if (o.crit) d *= cfg.PLAYER_CRIT_MULT;
  if (o.momentum) d *= 1 + cfg.SK1_MOMENTUM_BONUS;
  if (o.depthMult !== undefined) d *= o.depthMult;
  d = Math.round(d);
  if (o.armor) d = applyArmor(d, o.armor, cfg);
  return d;
}

/** Enemy blow on the player: roll → ×depth → round → player armour (§2.11). */
export function enemyDamage(
  c: CombatData,
  type: EnemyTypeDef,
  roll: number,
  depth: number | null = null,
): number {
  return computeDamage(
    roll,
    { depthMult: depthMult(c.cfg.DEPTH_DMG_MULT, c, type, depth), armor: c.player.armor },
    c.cfg,
  );
}

/** Enemy ticks of its type (per-type durations). Cached per data object. */
const typeTicksCache = new WeakMap<CombatData, Map<EnemyTypeId, EnemyTicks>>();
interface EnemyTicks {
  move: number;
  moveDiag: number;
  windup: number;
  cooldown: number;
}
export function enemyTicks(c: CombatData, type: EnemyTypeId): EnemyTicks {
  let m = typeTicksCache.get(c);
  if (!m) typeTicksCache.set(c, (m = new Map()));
  let t = m.get(type);
  if (!t) {
    const d = enemyDef(c, type);
    const k = (ms: number) => msToTicks(ms, c.cfg.TICK_MS);
    t = {
      move: k(d.moveMs),
      moveDiag: k(enemyDiagMs(d.moveMs, c.cfg.TICK_MS)), // v0.5.2: 1.5 × straight, ceil
      // §1.14 v0.5 GD rule: never below ENEMY_WINDUP_MIN_MS (not shortened by depth).
      windup: k(Math.max(d.windupMs, c.cfg.ENEMY_WINDUP_MIN_MS)),
      cooldown: k(d.cooldownMs),
    };
    m.set(type, t);
  }
  return t;
}

/**
 * Spawn an enemy of a given type (M1 roster from Level Design, tests, debug). M0 enemies come
 * from the map's 'E' markers instead. HP uses the depth at spawn time. Returns the entity.
 */
export interface SpawnEnemyOptions {
  /** §2.4: enemy of a contract group (no loot; flag on EnemyCombat and in 'enemyKilled'). */
  contract?: boolean;
  /** §2.10 spawn group id (SCRAPPER_GROUP, drone pair) for the group wake-up. */
  group?: number;
  /** Fixed stat depth (boss summons: 3). */
  depth?: number;
  /** Boss summon (no loot). */
  summoned?: boolean;
}

export function spawnEnemy(
  state: GameState,
  type: EnemyTypeId,
  cell: Cell,
  opts: SpawnEnemyOptions = {},
): Entity {
  const c = getCombat(state);
  const e = createEntity(type, cell.x, cell.y, combatEnemyGlyph(type));
  state.entities.push(e);
  c.enemies.set(
    e.id,
    newEnemyCombat(e.id, type, cell, c, combatRng(state).int(c.t.wanderMin, c.t.wanderMax)),
  );
  const ec = c.enemies.get(e.id)!;
  if (opts.contract) ec.contract = true;
  if (opts.group !== undefined) ec.group = opts.group;
  if (opts.summoned) ec.summoned = true;
  if (opts.depth !== undefined) {
    ec.depth = opts.depth;
    ec.hp = ec.maxHp = enemyMaxHp(c, type, opts.depth);
  }
  return e;
}

const freshSkillCd = (): Record<SkillId, number> => ({ dash: 0, shockPulse: 0, buddyDrone: 0 });

export function newPlayerCombat(spawn: Cell, cfg: CombatConfig, armor: number): PlayerCombat {
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
    slots: [...DEFAULT_SKILL_SLOTS],
    skillCd: freshSkillCd(),
    cast: null,
    skillQueue: null,
    prevSkill: [false, false, false],
    iframes: 0,
    momentum: 0,
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
    shock: 0,
    contract: false,
    group: null,
    moveCarry: 0,
    depth: null,
    summoned: false,
  };
}

/**
 * Wind-up encoding on the engine counter: attackWindup = windupTicks + 1 at start, the blow
 * resolves in the 'world' phase of the tick where attackWindup === 1 (then set to 0).
 * Effect: start at tick T → blow at T + windupTicks (player 100 ms, enemy 500 ms, §1.3/§1.4),
 * and the engine's tryStep() sees attackWindup > 0 for the whole wind-up INCLUDING the tick of
 * the blow, so the player cannot step away before his own blow lands (§1.2 "zobowiązanie").
 * Skill wind-ups (Shock Pulse, Buddy Drone) use the same encoding.
 */
const RESOLVES_NOW = 1;

const entityById = (state: GameState, id: number): Entity | undefined =>
  state.entities.find((e) => e.id === id);

export function enemyEntities(
  state: GameState,
  c: CombatData,
): Array<{ e: Entity; ec: EnemyCombat }> {
  const out: Array<{ e: Entity; ec: EnemyCombat }> = [];
  for (const e of state.entities) {
    const ec = c.enemies.get(e.id);
    if (ec) out.push({ e, ec });
  }
  return out;
}

const cellOf = (e: Cell): Cell => ({ x: e.x, y: e.y });

/**
 * Event bus hook (LUZ 4 / FX, walka-m1.md §8): every combat event is also emitted on the game
 * bus in the tick it happened – `'combat:event'` { tick, event } – plus the boss FX triggers
 * (core/events FxTriggerEvents). `getCombat(state).events` (last tick only) stays as before.
 * Output only: never read back by the simulation (determinism unaffected).
 */
export type CombatBusEmit = (type: string, payload: unknown) => void;
let busEmit: CombatBusEmit | null = null;
export function setCombatBus(fn: CombatBusEmit | null): void {
  busEmit = fn;
}
/** @internal boss.ts: FX trigger on the bus. */
export function emitBus(type: string, payload: unknown): void {
  busEmit?.(type, payload);
}

/**
 * setCombatFxActive (LUZ 4): true = the FX layer draws telegraph 'x' (enemy cells, boss swing
 * zone / charge lane), strike '*' and the Dash trail, so combat does not create those fx
 * entities. Default false = everything as before. Visual only; module-wide like reduce-motion
 * (survives save / load); `state` is part of the agreed signature.
 */
let fxActive = false;
export function setCombatFxActive(state: GameState, on: boolean): void {
  void state;
  fxActive = on;
}
export const isCombatFxActive = (): boolean => fxActive;

function emit(c: CombatData, ev: CombatEvent): void {
  c.events.push(ev);
  busEmit?.('combat:event', { tick: c.tick, event: ev });
}
/** @internal boss.ts */
export const emitCombat = emit;

/** @internal boss.ts */
export function floatText(c: CombatData, style: FloatStyle, text: string, cell: Cell): void {
  c.floats.push({ style, text, cell: { ...cell }, ttl: c.t.floatText, maxTtl: c.t.floatText });
}

export function droneEntity(state: GameState, c: CombatData): Entity | null {
  if (!c.drone) return null;
  return entityById(state, c.drone.entityId) ?? null;
}

/** §2.9 lift shaft `<` (EVAC_TILE): a wall for enemies, their pathfinding and the drone. */
export function isEvacTile(map: TileMap, x: number, y: number): boolean {
  return map.tile(x, y) === EVAC_TILE;
}

/**
 * §2.9 step 4: the player stands on `<` = in the cabin – invulnerable and out of the combat
 * simulation (enemies lose the target, frozen wind-ups miss, no attacks / skills). Opening the
 * shaft and leaving the level are Silnik / LUZ (a closed `<` blocks the player like a wall).
 */
export function isPlayerEvacuated(state: GameState): boolean {
  return isEvacTile(state.map, state.player.x, state.player.y);
}

/** Occupancy for enemy steps: actors + the `<` cell (§2.9). */
function enemyOccupied(state: GameState, e: Entity) {
  return (x: number, y: number) => isOccupied(state, x, y, e) || isEvacTile(state.map, x, y);
}

// =============================================================================================
// 'player' phase – §1.1 step 1 (input) + step 2 (skills, bump, start of player attack)
// =============================================================================================

const SKILL_KEYS = ['skill1', 'skill2', 'skill3'] as const;

/** Aim-stick fire. Missing on an older ActionState → not firing. */
function readAimFire(actions: ActionState): boolean {
  if (!('aimFire' in actions)) return false;
  return Boolean((actions as { aimFire?: boolean }).aimFire);
}

/** Mouse cell under the cursor. Missing on an older ActionState → null. */
function readAimCell(actions: ActionState): Cell | null {
  if (!('aimCell' in actions)) return null;
  const cell = (actions as { aimCell?: { x: number; y: number } | null }).aimCell;
  if (!cell || typeof cell.x !== 'number' || typeof cell.y !== 'number') return null;
  return { x: cell.x, y: cell.y };
}

/** A facing / offset as one of DIRS8. (0, 0) falls back to east. */
function asDir8(d: Cell): Dir8 {
  const x = Math.sign(d.x) as Dir8['x'];
  const y = Math.sign(d.y) as Dir8['y'];
  if (x === 0 && y === 0) return { x: 1, y: 0 };
  return { x, y };
}

/**
 * Equipped weapon. No inventory section, or anything that is not `weaponType: 'ranged'`,
 * is melee (a fresh game wears the Issue Pole).
 */
export function equippedWeaponType(state: GameState): 'melee' | 'ranged' {
  const inv = state.sections.inventory as
    | { gear?: { weapon?: { itemId?: string } | null } }
    | undefined;
  const id = inv?.gear?.weapon?.itemId;
  return id && ITEM_DEFS[id]?.weaponType === 'ranged' ? 'ranged' : 'melee';
}

export function combatPlayerPhase(state: GameState, actions: ActionState): void {
  const c = getCombat(state);
  c.events = [];
  c.tick = state.tick;
  const p = state.player;
  const pc = c.player;
  const aimFire = readAimFire(actions);
  const firing = actions.attack || aimFire;
  const any =
    firing ||
    actions.aim !== null ||
    actions.skill1 ||
    actions.skill2 ||
    actions.skill3 ||
    actions.move.x !== 0 ||
    actions.move.y !== 0;
  if (any) c.lastInputTick = state.tick;

  const pressed = actions.attack && !pc.prevAttack; // rising edge = tap (InputManager buffers taps 2 ticks)
  pc.prevAttack = actions.attack;
  const skillPressed = SKILL_KEYS.map((k, i) => {
    const down = actions[k];
    const edge = down && !pc.prevSkill[i];
    pc.prevSkill[i] = down;
    return edge;
  });

  if (c.death) {
    // §1.8: the world is frozen – keep the engine from moving the (dead) player this tick.
    p.moveCooldown = Math.max(p.moveCooldown, 1);
    return;
  }
  // §2.9: in the cabin – no attacks, no skills (controls are Silnik's).
  if (isPlayerEvacuated(state)) {
    pc.atkQueued = false;
    pc.skillQueue = null;
    return;
  }

  // §2.5 skills (M1 flag). A started skill consumes the tick (no attack start, Dash = the move).
  if (c.cfg.SKILLS_ENABLED && skillPhase(state, c, actions, skillPressed)) return;
  if (pc.cast) return; // skill wind-up: like an attack wind-up

  // §2.6 bump attack (M1 flag): a step into a living enemy = basic attack on THAT enemy.
  if (c.cfg.BUMP_ATTACK_ENABLED && bumpAttack(state, c, toDir8(actions.move))) return;

  // §1.3 ATK queue: a press in the last ATK_QUEUE_MS of cooldown fires when it ends.
  // The edge is the attack button; a held aim stick repeats without using the queue.
  if (pressed && !pc.attack && p.attackCooldown > 0 && p.attackCooldown <= c.t.atkQueue) {
    pc.atkQueued = true;
    pc.queuedTargetId = null;
  }
  if (pc.attack || p.attackCooldown > 0) return;

  const tap = pressed || pc.atkQueued;
  // Hold (attack or aimFire) repeats on the weapon cycle, even with nothing in reach.
  if (!tap && !firing) return;

  const kind = equippedWeaponType(state);
  const range = kind === 'ranged' ? c.cfg.RANGED_RANGE : c.cfg.SWING_RANGE;
  const manual = actions.aim;
  let dir: Dir8;
  let shot: Cell | null = null;
  if (manual) {
    // Manual aim wins over auto-aim. Melee does not cone-correct: the arc already covers it.
    dir = manual;
    if (kind === 'ranged') shot = rangedAim(state, c, actions, dir);
  } else if (pc.queuedTargetId !== null) {
    // A queued bump already turned `facing` toward that enemy.
    dir = asDir8(p.facing);
  } else if (autoAimEnabled()) {
    const t = pickTarget(state, c, range);
    if (t) {
      dir = asDir8({ x: t.x - p.x, y: t.y - p.y });
      if (kind === 'ranged') shot = cellOf(t);
    } else dir = asDir8(p.facing);
  } else {
    dir = asDir8(p.facing);
    if (kind === 'ranged') shot = rangedAim(state, c, actions, dir);
  }
  startPlayerAttack(state, c, dir, readAimCell(actions), shot);
}

function startPlayerAttack(
  state: GameState,
  c: CombatData,
  dir: Dir8,
  aimCell: Cell | null,
  target: Cell | null,
): void {
  const pc = c.player;
  const ranged = equippedWeaponType(state) === 'ranged';
  pc.attack = { dir, aimCell, target };
  pc.atkQueued = false;
  pc.queuedTargetId = null;
  // §2.5 speed affixes: wind-up and cooldown share one fractional carry (ACTION_TICK_ACCUMULATOR).
  const windup = ranged ? c.cfg.RANGED_WINDUP_MS : c.cfg.SWING_WINDUP_MS;
  state.player.attackWindup = playerAttackTicks(c, windup) + RESOLVES_NOW;
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
 * enemy anyway). The own drone is not an enemy: it blocks like a wall. Returns true when the
 * direction was consumed as a bump.
 */
function bumpAttack(state: GameState, c: CombatData, dir: Dir8 | null): boolean {
  if (!dir || inDiagGrace(state, c, dir)) return false;
  const p = state.player;
  const pc = c.player;
  const cell = { x: p.x + dir.x, y: p.y + dir.y };
  const hit = hostiles(state, c).find((e) => sameCell(e, cell));
  if (!hit || !canStep(state.map, p.x, p.y, dir.x, dir.y)) return false;
  if (pc.attack || p.attackWindup > 0) return true;
  p.facing = { x: dir.x, y: dir.y };
  if (p.attackCooldown > 0) {
    if (p.attackCooldown <= c.t.atkQueue) {
      pc.atkQueued = true;
      pc.queuedTargetId = hit.id;
    }
    return true;
  }
  startPlayerAttack(state, c, dir, null, null);
  return true;
}

/**
 * §1.2 v0.5 DIAG_GRACE (Silnik, QA-M0-002/009): a straight step starts at once; a perpendicular
 * key added within DIAG_GRACE_MS turns it into a diagonal from the START cell. In that window the
 * diagonal direction belongs to the engine's re-target, not to a bump from the straight cell
 * (it would aim at the wrong cell). Returns true while such a re-target is possible.
 */
export function inDiagGrace(state: GameState, c: CombatData, dir: Cell): boolean {
  const p = state.player;
  if (p.moveCooldown <= 0 || !isDiagonal(dir)) return false;
  const last = { x: p.x - p.fromX, y: p.y - p.fromY };
  if (isDiagonal(last) || (last.x === 0 && last.y === 0)) return false;
  if (state.tick - p.moveTick > msToTicks(c.cfg.DIAG_GRACE_MS, c.cfg.TICK_MS)) return false;
  return last.x !== 0 ? dir.x === last.x : dir.y === last.y;
}

/** Living enemies + living boss parts (everything the player side can hit). */
function hostiles(state: GameState, c: CombatData): Entity[] {
  const out: Entity[] = [];
  for (const e of state.entities) {
    const ec = c.enemies.get(e.id);
    if (ec ? ec.ai !== 'dead' : isBossPart(c, e)) out.push(e);
  }
  return out;
}

function damageHostile(
  state: GameState,
  c: CombatData,
  e: Entity,
  dmg: number,
  crit: boolean,
  source: 'attack' | 'pulse' | 'drone',
): void {
  const ec = c.enemies.get(e.id);
  if (ec) damageEnemy(state, c, e, ec, dmg, crit, source);
  else damageBoss(state, c, dmg, crit, source, cellOf(e));
}

/** Angle in degrees between two vectors. A zero vector is "not in the cone". */
function angleBetween(a: Cell, b: Cell): number {
  const am = Math.hypot(a.x, a.y);
  const bm = Math.hypot(b.x, b.y);
  if (am === 0 || bm === 0) return 180;
  const cos = Math.min(1, Math.max(-1, (a.x * b.x + a.y * b.y) / (am * bm)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/**
 * §1.3 auto-target: nearest living hostile in `range` (default PLAYER_ATK_RANGE, so older
 * callers stay on reach 1). Tie → the one in the `facing` direction, then clockwise from north.
 */
export function pickTarget(
  state: GameState,
  c: CombatData = getCombat(state),
  range = c.cfg.PLAYER_ATK_RANGE,
): Entity | null {
  const p = state.player;
  let best: Entity | null = null;
  let bestKey: [number, number, number] = [Infinity, Infinity, Infinity];
  for (const e of hostiles(state, c)) {
    if (!inMeleeReach(state.map, cellOf(p), cellOf(e), range)) continue;
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

/**
 * Ranged aim assist (wariant-twin-stick §4): hostiles inside ±AIM_ASSIST_CONE_DEG of `dir`,
 * within `range`, with line of sight. Nearest Chebyshev, then smaller angle to the axis,
 * then clockwise DIRS8 order. Melee does not call this.
 */
export function pickAimTarget(
  state: GameState,
  c: CombatData,
  dir: Dir8,
  range: number,
): Entity | null {
  const p = state.player;
  const cone = c.cfg.AIM_ASSIST_CONE_DEG;
  let best: Entity | null = null;
  let bestKey: [number, number, number] = [Infinity, Infinity, Infinity];
  for (const e of hostiles(state, c)) {
    if (chebyshev(p, e) > range || !lineOfSight(state.map, p, e)) continue;
    const d = { x: e.x - p.x, y: e.y - p.y };
    const ang = angleBetween(dir, d);
    if (ang > cone + 1e-9) continue;
    const key: [number, number, number] = [chebyshev(p, e), ang, clockAngle(d)];
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

/**
 * Ranged target cell locked at the press. A mouse cell that is a hostile in range with LOS
 * wins and skips the cone. Otherwise the cone, or null (fly along `dir` for RANGED_RANGE).
 */
function rangedAim(state: GameState, c: CombatData, actions: ActionState, dir: Dir8): Cell | null {
  const p = state.player;
  const range = c.cfg.RANGED_RANGE;
  const mouse = readAimCell(actions);
  if (mouse && chebyshev(p, mouse) <= range && lineOfSight(state.map, p, mouse)) {
    const on = hostiles(state, c).find((e) => sameCell(e, mouse));
    if (on) return cellOf(on);
  }
  if (!c.cfg.AIM_ASSIST_ENABLED) return null;
  const t = pickAimTarget(state, c, dir, range);
  return t ? cellOf(t) : null;
}

// ---- §2.5 skills -------------------------------------------------------------------------------

/** Player busy: own attack / skill wind-up (skills wait in the buffer). */
const playerBusy = (state: GameState, c: CombatData) =>
  c.player.attack !== null || c.player.cast !== null || state.player.attackWindup > 0;

/**
 * Input of sk1..sk3 (slots, not skills – §2.5 swappable). A press casts at once when possible;
 * pressed while busy or in the last SKILL_BUFFER_MS of the cooldown it waits in the buffer.
 * Returns true when a skill started this tick.
 */
function skillPhase(
  state: GameState,
  c: CombatData,
  actions: ActionState,
  pressed: boolean[],
): boolean {
  const pc = c.player;
  for (let i = 0; i < pressed.length; i++) {
    if (!pressed[i]) continue;
    const id = pc.slots[i];
    if (!id) continue;
    const cd = pc.skillCd[id];
    const busy = Math.max(0, state.player.attackWindup);
    if (cd === 0 && busy === 0) pc.skillQueue = { slot: i, ttl: 1 };
    else if (cd <= c.t.skillBuffer || busy > 0)
      pc.skillQueue = { slot: i, ttl: Math.max(cd, busy) + c.t.skillBuffer };
  }
  const q = pc.skillQueue;
  if (!q) return false;
  const id = pc.slots[q.slot];
  if (!id) {
    pc.skillQueue = null;
    return false;
  }
  // Dash cancels an in-progress swing. It does not cancel another skill's wind-up.
  const cancellingDash =
    id === 'dash' && pc.cast === null && (pc.attack !== null || state.player.attackWindup > 0);
  if (pc.skillCd[id] === 0 && (!playerBusy(state, c) || cancellingDash)) {
    pc.skillQueue = null;
    return castSkill(state, c, id, q.slot, actions);
  }
  q.ttl--;
  if (q.ttl <= 0) pc.skillQueue = null;
  return false;
}

function castSkill(
  state: GameState,
  c: CombatData,
  id: SkillId,
  slot: number,
  actions: ActionState,
): boolean {
  const pc = c.player;
  const p = state.player;
  const cd = msToTicks(SKILLS[id].cooldownMs, c.cfg.TICK_MS);
  // v0.5.2: cooldown counts from the press (SKILL_COOLDOWN_FROM 'press'); a failed skill keeps
  // its cooldown unspent (SKILL_FAIL_REFUND).
  const fail = (reason: 'noCell' | 'blocked'): false => {
    if (!c.cfg.SKILL_FAIL_REFUND) pc.skillCd[id] = cd;
    emit(c, { type: 'skillFailed', skill: id, reason });
    return false;
  };
  if (id === 'buddyDrone' && !freeDroneCell(state)) return fail('noCell');
  const dashDir: Dir8 = toDir8(actions.move) ?? actions.aim ?? asDir8(p.facing);
  if (id === 'dash' && dashPath(state, c, dashDir).length === 0) {
    // v0.5.2: a Dash that cannot move ≥ 1 cell fails – no cooldown, no Momentum.
    p.facing = { x: dashDir.x, y: dashDir.y };
    return fail('blocked');
  }
  pc.skillCd[id] = cd;
  pc.atkQueued = false;
  pc.queuedTargetId = null;
  emit(c, { type: 'skillUsed', skill: id, slot });
  if (id === 'dash') {
    dash(state, c, dashDir);
    return true;
  }
  // Shock Pulse / Buddy Drone: wind-up blocks movement like an attack (§2.5 table).
  pc.cast = { skill: id };
  p.attackWindup = msToTicks(SKILLS[id].windupMs, c.cfg.TICK_MS) + RESOLVES_NOW;
  return true;
}

/**
 * sk1 Dash: up to SK1_DASH_RANGE cells in one tick, cell by cell, stops before a wall / actor,
 * no corner cutting. Invulnerable for SK1_DASH_IFRAMES_MS from the start, grants Momentum.
 * Happens in the player phase before AI (§2.10), so it fits the full wind-up window.
 */
/** Cells the Dash leaves (start cell first); empty = cannot move (wall / actor next to it). */
function dashPath(state: GameState, c: CombatData, dir: Dir8): Cell[] {
  const p = state.player;
  const path: Cell[] = [];
  let x = p.x;
  let y = p.y;
  for (let k = 0; k < c.cfg.SK1_DASH_RANGE; k++) {
    if (!canStep(state.map, x, y, dir.x, dir.y, (cx, cy) => isOccupied(state, cx, cy, p))) break;
    path.push({ x, y });
    x += dir.x;
    y += dir.y;
  }
  return path;
}

function dash(state: GameState, c: CombatData, dir: Dir8): void {
  const p = state.player;
  const pc = c.player;
  const from = cellOf(p);
  const path = dashPath(state, c, dir);
  // A swing in progress is lost: no attack cooldown. Dash's own cooldown was already spent.
  if (path.length > 0) {
    pc.attack = null;
    p.attackWindup = 0;
  }
  const x = p.x + dir.x * path.length;
  const y = p.y + dir.y * path.length;
  p.facing = { x: dir.x, y: dir.y };
  if (x !== p.x || y !== p.y) setCell(p, x, y);
  p.moveCooldown = Math.max(p.moveCooldown, 1); // the dash is this tick's move
  pc.iframes = c.t.dashIframes;
  pc.momentum = c.t.momentum;
  for (const cell of path) addFx(state, c, cell, COMBAT_STYLE.dashTrail, c.t.dashTrail, true);
  emit(c, { type: 'dash', from, to: { x, y }, path });
}

/** Free cell next to the player for the drone: `facing` first, then clockwise (§2.5). */
function freeDroneCell(state: GameState): Cell | null {
  const p = state.player;
  const start = DIRS8.findIndex((d) => d.x === p.facing.x && d.y === p.facing.y);
  for (let k = 0; k < 8; k++) {
    const d = DIRS8[(Math.max(0, start) + k) % 8]!;
    const occ = (x: number, y: number) => isOccupied(state, x, y, p) || isEvacTile(state.map, x, y);
    if (canStep(state.map, p.x, p.y, d.x, d.y, occ)) return { x: p.x + d.x, y: p.y + d.y };
  }
  return null;
}

/** Step 4a: a skill wind-up that ends this tick takes effect (player side resolves first). */
function resolveCast(state: GameState, c: CombatData): void {
  const p = state.player;
  const cast = c.player.cast;
  if (!cast || p.attackWindup > RESOLVES_NOW) return;
  c.player.cast = null;
  p.attackWindup = 0;
  if (cast.skill === 'shockPulse') shockPulse(state, c);
  else if (cast.skill === 'buddyDrone') deployDrone(state, c);
}

/**
 * sk2 Shock Pulse: every enemy within Chebyshev SK2_PULSE_RADIUS with line of sight takes
 * SK2_PULSE_DMG and the Shock tag: the current wind-up is interrupted (token back, full attack
 * cooldown, back to CHASE), steps slower, drone shots ×2.
 */
function shockPulse(state: GameState, c: CombatData): void {
  const p = state.player;
  const rng = combatRng(state);
  emit(c, { type: 'shockPulse', center: cellOf(p), radius: c.cfg.SK2_PULSE_RADIUS });
  let bossDone = false;
  for (const e of hostiles(state, c)) {
    if (chebyshev(p, e) > c.cfg.SK2_PULSE_RADIUS || !lineOfSight(state.map, p, e)) continue;
    const ec = c.enemies.get(e.id);
    if (!ec && bossDone) continue; // the boss is hit once, not per part
    const dmg = rng.int(c.cfg.SK2_PULSE_DMG_MIN, c.cfg.SK2_PULSE_DMG_MAX);
    damageHostile(state, c, e, dmg, false, 'pulse');
    if (ec) applyShock(c, e, ec);
    else bossDone = true; // boss: damage only, no Shock (no interrupt) [R]
  }
}

function applyShock(c: CombatData, e: Entity, ec: EnemyCombat): void {
  ec.shock = c.t.shock;
  if (ec.attack) {
    ec.attack = null; // token returned (tokens = wind-ups in progress)
    e.attackWindup = 0;
    e.attackCooldown = enemyTicks(c, ec.type).cooldown;
    emit(c, { type: 'telegraphInterrupted', enemyId: e.id });
  }
  if (ec.ai === 'attack' || ec.ai === 'alert' || ec.ai === 'idle') ec.ai = 'chase';
}

/** sk3 Buddy Drone: placed on a free neighbour cell, distance map computed once here. */
function deployDrone(state: GameState, c: CombatData): void {
  const cell = freeDroneCell(state);
  if (!cell) {
    // Cell taken during the wind-up: also a skillFailed → cooldown refunded (SKILL_FAIL_REFUND).
    if (c.cfg.SKILL_FAIL_REFUND) c.player.skillCd.buddyDrone = 0;
    emit(c, { type: 'skillFailed', skill: 'buddyDrone', reason: 'noCell' });
    return;
  }
  removeDrone(state, c, null);
  const e = createEntity(DRONE_KIND, cell.x, cell.y, COMBAT_STYLE.drone);
  state.entities.push(e);
  c.drone = {
    entityId: e.id,
    hp: c.cfg.SK3_DRONE_HP,
    maxHp: c.cfg.SK3_DRONE_HP,
    life: c.t.droneLife,
    fireTimer: c.t.droneFire,
    hitFlash: 0,
    field: droneField(state.map, cell, c.cfg.DRONE_FIELD_RADIUS),
  };
  emit(c, { type: 'droneDeployed', cell });
}

/**
 * §2.10 distance map from the drone: Dijkstra, 8 directions, weights 3 straight / 4 diagonal,
 * no corner cutting, walls only (actors are checked at step time), radius r → (2r+1)² cells.
 * Pure (map + cell) – recomputed on save restore instead of being saved.
 */
export function droneField(map: TileMap, at: Cell, r: number): DroneState['field'] {
  const side = 2 * r + 1;
  const dist = new Array<number>(side * side).fill(-1);
  const idx = (x: number, y: number) => (y - at.y + r) * side + (x - at.x + r);
  dist[idx(at.x, at.y)] = 0;
  const open: Array<[number, number, number]> = [[0, at.x, at.y]];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i]![0] < open[bi]![0]) bi = i;
    const [d, x, y] = open.splice(bi, 1)[0]!;
    if (d > dist[idx(x, y)]!) continue;
    for (const dir of DIRS8) {
      const nx = x + dir.x;
      const ny = y + dir.y;
      if (Math.abs(nx - at.x) > r || Math.abs(ny - at.y) > r) continue;
      if (!canStep(map, x, y, dir.x, dir.y) || isEvacTile(map, nx, ny)) continue;
      const nd = d + (dir.x !== 0 && dir.y !== 0 ? 4 : 3);
      const k = idx(nx, ny);
      if (dist[k] === -1 || nd < dist[k]!) {
        dist[k] = nd;
        open.push([nd, nx, ny]);
      }
    }
  }
  return { cx: at.x, cy: at.y, r, dist };
}

export function fieldAt(f: DroneState['field'], x: number, y: number): number {
  if (Math.abs(x - f.cx) > f.r || Math.abs(y - f.cy) > f.r) return -1;
  return f.dist[(y - f.cy + f.r) * (2 * f.r + 1) + (x - f.cx + f.r)]!;
}

function removeDrone(
  state: GameState,
  c: CombatData,
  reason: 'expired' | 'destroyed' | 'playerDied' | null,
): void {
  if (!c.drone) return;
  const id = c.drone.entityId;
  state.entities = state.entities.filter((e) => e.id !== id);
  c.drone = null;
  // Wind-ups aimed at the drone lose their target (and their drone token).
  for (const { e, ec } of enemyEntities(state, c)) {
    if (ec.attack?.target !== 'drone') continue;
    ec.attack = null;
    e.attackWindup = 0;
    if (ec.ai === 'attack') ec.ai = 'chase';
  }
  if (reason) emit(c, { type: 'droneGone', reason });
}

/** Step 4a (after the player's own blow): the drone shoots the nearest enemy in range + LOS. */
function droneFire(state: GameState, c: CombatData): void {
  const d = c.drone;
  const de = droneEntity(state, c);
  if (!d || !de || d.fireTimer > 0) return;
  let best: Entity | null = null;
  let bestDist = Infinity;
  for (const e of hostiles(state, c)) {
    const dist = chebyshev(de, e);
    if (dist > c.cfg.SK3_DRONE_RANGE || dist >= bestDist) continue;
    if (!lineOfSight(state.map, de, e)) continue;
    best = e;
    bestDist = dist;
  }
  if (!best) return; // keeps the shot ready
  d.fireTimer = c.t.droneFire;
  let dmg = combatRng(state).int(c.cfg.SK3_DRONE_DMG_MIN, c.cfg.SK3_DRONE_DMG_MAX);
  if ((c.enemies.get(best.id)?.shock ?? 0) > 0) dmg *= c.cfg.SK3_DRONE_SHOCK_MULT;
  addFx(state, c, cellOf(best), COMBAT_STYLE.droneShot, c.t.strikeFx);
  emit(c, { type: 'droneShot', enemyId: best.id, dmg });
  damageHostile(state, c, best, dmg, false, 'drone');
}

// =============================================================================================
// 'world' phase – §1.1 steps 3–5 (+ combat timers of step 6)
// =============================================================================================

export function combatWorldPhase(state: GameState, actions: ActionState): void {
  void actions;
  const c = getCombat(state);
  c.tick = state.tick;
  if (c.death) {
    stepDeath(state, c);
  } else {
    applyPlayerMoveAffix(state, c); // engine just moved the player (step 2) – §2.5 speed affix
    bossArenaCheck(state, c); // §2.11 leaving the arena resets the boss (temporary trigger)
    bossAi(state, c); // 3 – the boss first (takes its melee token before the enemies)
    const enemies = enemyEntities(state, c);
    const requests: AttackRequest[] = [];
    for (const { e, ec } of enemies) enemyAi(state, c, e, ec, requests); // 3
    grantAttackTokens(state, c, requests); // 3 – §2.10 tokens, deterministic order
    resolveCast(state, c); // 4a – player side first: skill wind-up,
    stepPlayerProjectiles(state, c); // shots already in the air (after enemies moved)
    resolvePlayerAttack(state, c); //      swing or a new shot,
    droneFire(state, c); //               drone shot
    bossResolve(state, c); // 4b – boss swing / charge step
    for (const { e, ec } of enemies) resolveEnemyBlow(state, c, e, ec); // 4b
    for (const { e, ec } of enemies) enemyLifecycle(state, c, e, ec); // 5
    droneLifecycle(state, c);
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
  // Dash uses setCell (moveTicks 0) and never reaches this. A step already in progress
  // has moveTick from an earlier tick, so it is not recomputed.
  if (p.moveTick !== state.tick || p.moveTicks <= 0) return;
  const cycling = p.attackWindup > 0 || p.attackCooldown > 0 || pc.attack !== null;
  const kite = !cycling
    ? 1
    : equippedWeaponType(state) === 'ranged'
      ? c.cfg.RANGED_KITE_MOVE_MULT
      : c.cfg.KITE_MOVE_MULT;
  if (pc.moveTimeMod === 0 && kite === 1) return;
  const diag = p.x !== p.fromX && p.y !== p.fromY;
  const base = diag ? c.cfg.PLAYER_MOVE_DIAG_MS : c.cfg.PLAYER_MOVE_MS;
  const r = accumulateTicks(
    base * (1 + pc.moveTimeMod) * kite,
    c.cfg.TICK_MS,
    pc.moveCarry,
    c.cfg.ACTION_TICK_ACCUMULATOR,
  );
  pc.moveCarry = r.carry;
  p.moveTicks = r.ticks;
  p.moveCooldown = r.ticks;
}

// ---- 3. enemy AI (§1.6, §2.10) ---------------------------------------------------------------

interface AttackRequest {
  e: Entity;
  ec: EnemyCombat;
  target: AttackTarget;
  aim: Cell;
  dist: number;
  order: number;
}

function enemyCosts(c: CombatData, ec: EnemyCombat): StepCosts {
  const t = enemyTicks(c, ec.type);
  return { straightTicks: t.move, diagTicks: t.moveDiag };
}

/** Attack reach of a type: melee = neighbours without corner cutting; ranged = range + LOS. */
function inReach(state: GameState, def: EnemyTypeDef, from: Cell, to: Cell): boolean {
  if (def.attack === 'ranged')
    return chebyshev(from, to) <= def.atkRange && lineOfSight(state.map, from, to);
  return inMeleeReach(state.map, from, to, def.atkRange);
}

/** §2.10 provocation: drone within SK3_DRONE_TAUNT_RADIUS (Chebyshev) and in line of sight. */
function tauntedBy(state: GameState, c: CombatData, e: Entity): Entity | null {
  const d = droneEntity(state, c);
  if (!d || chebyshev(e, d) > c.cfg.SK3_DRONE_TAUNT_RADIUS) return null;
  return lineOfSight(state.map, e, d) ? d : null;
}

function enemyAi(
  state: GameState,
  c: CombatData,
  e: Entity,
  ec: EnemyCombat,
  requests: AttackRequest[],
): void {
  if (ec.ai === 'dead') return;
  const p = state.player;
  const def = typeOf(c, ec);
  const dist = chebyshev(e, p);
  const gone = isPlayerEvacuated(state); // §2.9: the player in the cabin is not a target
  const los = !gone && lineOfSight(state.map, e, p);
  const detects = dist <= def.detectRadius && los;
  const drone = tauntedBy(state, c, e);
  switch (ec.ai) {
    case 'idle':
      if (detects || drone) {
        ec.ai = 'alert';
        ec.stateTimer = c.t.enemyAlert;
        groupAlert(state, c, e, ec);
      } else if (isMobile(def)) wander(state, c, e, ec);
      return;
    case 'alert':
      if (ec.stateTimer > 0) return;
      startChase(ec, p);
      act(state, c, e, ec, def, dist, los, drone, requests);
      return;
    case 'chase':
      act(state, c, e, ec, def, dist, los, drone, requests);
      return;
    case 'attack':
      if (ec.attack || e.attackCooldown > 0) return; // telegraph / standing in cooldown
      ec.ai = 'chase';
      act(state, c, e, ec, def, dist, los, drone, requests);
      return;
    case 'return':
      if (ec.deafTimer === 0 && (detects || drone)) {
        startChase(ec, p);
        act(state, c, e, ec, def, dist, los, drone, requests);
      } else if (sameCell(e, ec.spawn)) {
        ec.hp = ec.maxHp; // §1.6: back on spawn → full HP
        ec.ai = 'idle';
        ec.wanderTimer = combatRng(state).int(c.t.wanderMin, c.t.wanderMax);
      } else stepToward(state, c, e, ec, ec.spawn);
      return;
  }
}

/**
 * ROBOCZE: groups / pairs (Scrapper, Panel Drone) – an enemy that leaves IDLE wakes idle
 * enemies of the same spawn group within ENEMY_GROUP_WAKE_RADIUS that see it (no chain).
 */
function groupAlert(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  const r = c.cfg.ENEMY_GROUP_WAKE_RADIUS;
  if (r <= 0 || ec.group === null) return;
  // No chain: woken enemies go straight to ALERT and never call groupAlert themselves.
  for (const o of enemyEntities(state, c)) {
    if (o.ec === ec || o.ec.group !== ec.group || o.ec.ai !== 'idle') continue;
    if (chebyshev(o.e, e) > r || !lineOfSight(state.map, o.e, e)) continue;
    o.ec.ai = 'alert';
    o.ec.stateTimer = c.t.enemyAlert;
  }
}

function startChase(ec: EnemyCombat, playerCell: Cell): void {
  ec.ai = 'chase';
  ec.lostLosTicks = 0;
  ec.lastSeen = { x: playerCell.x, y: playerCell.y };
}

/** CHASE step: leash / lost sight, attack request when in reach, else approach (or wait). */
function act(
  state: GameState,
  c: CombatData,
  e: Entity,
  ec: EnemyCombat,
  def: EnemyTypeDef,
  dist: number,
  los: boolean,
  drone: Entity | null,
  requests: AttackRequest[],
): void {
  const p = state.player;
  const mobile = isMobile(def);
  if (!drone && isPlayerEvacuated(state)) {
    // §2.9: target lost at once – mobile enemies return to spawn, turrets go idle.
    ec.lastSeen = null;
    if (mobile) {
      ec.ai = 'return';
      ec.deafTimer = c.t.enemyReturnDeaf;
      stepToward(state, c, e, ec, ec.spawn);
    } else ec.ai = 'idle';
    return;
  }
  if (!drone) {
    if (!mobile) {
      // Line Sentry: no chase, no leash – stays "on guard" only while it sees the player.
      if (!(los && dist <= def.detectRadius)) ec.ai = 'idle';
    } else {
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
    }
    if (ec.ai === 'idle') return;
  }
  const target: AttackTarget = drone ? 'drone' : 'player';
  const tgt: Cell = drone ?? p;
  if (e.attackCooldown === 0 && e.attackWindup === 0 && inReach(state, def, e, tgt)) {
    requests.push({
      e,
      ec,
      target,
      aim: cellOf(tgt),
      dist: chebyshev(e, tgt),
      order: requests.length,
    });
    return;
  }
  if (!mobile) return;
  // §2.10: no free token for this target → approach at most to TOKEN_WAIT_DIST and wait there.
  // A hit that did not find this enemy holding a token puts them first: they keep closing
  // so they can enter reach and take the next token.
  const prioritized = c.cfg.TOKEN_PRIORITY_ON_HIT && c.tokenPriority.includes(e.id);
  if (
    c.cfg.ATTACK_TOKENS_ENABLED &&
    !prioritized &&
    !tokenRoom(c, target, def) &&
    chebyshev(e, tgt) <= c.cfg.TOKEN_WAIT_DIST
  )
    return;
  if (drone) {
    if (!stepByField(state, c, e, ec)) stepToward(state, c, e, ec, tgt);
    return;
  }
  const goal = los ? cellOf(p) : ec.lastSeen;
  if (goal && !sameCell(goal, e)) stepToward(state, c, e, ec, goal);
}

/** Held tokens = wind-ups in progress. Player: 2 melee + 1 ranged; drone: 2 of any kind. */
function heldTokens(c: CombatData, target: AttackTarget, kind?: EnemyTypeDef['attack']): number {
  // §2.11: an attacking boss holds BOSS_MELEE_TOKENS of the player's melee tokens.
  let n =
    target === 'player' && kind !== 'ranged' && bossHoldsToken(c)
      ? RAIL_GUARDIAN.BOSS_MELEE_TOKENS
      : 0;
  for (const ec of c.enemies.values()) {
    if (ec.attack?.target !== target) continue;
    if (kind && typeOf(c, ec).attack !== kind) continue;
    n++;
  }
  return n;
}

/** @internal boss.ts: the boss may start an attack (melee token room + stagger). */
export function meleeTokenFree(state: GameState, c: CombatData): boolean {
  if (!c.cfg.ATTACK_TOKENS_ENABLED) return true;
  if (
    heldTokens(c, 'player', 'melee') + RAIL_GUARDIAN.BOSS_MELEE_TOKENS >
    c.cfg.ATTACK_TOKENS_MELEE
  )
    return false;
  return state.tick - c.tokenTick.player >= c.t.tokenStagger;
}

/** @internal boss.ts: the boss took its token this tick (stagger for the next one). */
export function takeMeleeToken(state: GameState, c: CombatData): void {
  if (c.cfg.ATTACK_TOKENS_ENABLED) c.tokenTick.player = state.tick;
}

function tokenRoom(c: CombatData, target: AttackTarget, def: EnemyTypeDef): boolean {
  if (target === 'drone') return heldTokens(c, 'drone') < c.cfg.DRONE_ATTACK_TOKENS;
  const limit = def.attack === 'ranged' ? c.cfg.ATTACK_TOKENS_RANGED : c.cfg.ATTACK_TOKENS_MELEE;
  return heldTokens(c, 'player', def.attack) < limit;
}

/**
 * §2.10 token grant: requests of this tick sorted by distance to the target, then AI order.
 * A token needs room in the target's pool and ATTACK_TOKEN_STAGGER_MS since the target's last
 * token. Without a token the enemy waits in place (it is already in reach – no retreat).
 */
function grantAttackTokens(state: GameState, c: CombatData, requests: AttackRequest[]): void {
  const rank = (id: number) => {
    const i = c.tokenPriority.indexOf(id);
    return i < 0 ? 1e9 : i;
  };
  requests.sort(
    (a, b) => rank(a.e.id) - rank(b.e.id) || a.dist - b.dist || a.order - b.order,
  );
  for (const r of requests) {
    if (c.cfg.ATTACK_TOKENS_ENABLED) {
      const def = typeOf(c, r.ec);
      if (!tokenRoom(c, r.target, def)) continue;
      if (state.tick - c.tokenTick[r.target] < c.t.tokenStagger) continue;
      c.tokenTick[r.target] = state.tick;
    }
    startEnemyAttack(c, r.e, r.ec, r.aim, r.target);
    const i = c.tokenPriority.indexOf(r.e.id);
    if (i >= 0) c.tokenPriority.splice(i, 1);
  }
}

/** Hit enemies with no token become the next recipients, in the order they were struck. */
function rememberTokenPriority(c: CombatData, ids: number[]): void {
  if (!c.cfg.TOKEN_PRIORITY_ON_HIT || ids.length === 0) return;
  const fresh = ids.filter((id) => {
    const ec = c.enemies.get(id);
    return !!ec && ec.hp > 0 && !ec.attack;
  });
  if (fresh.length === 0) return;
  const set = new Set(fresh);
  c.tokenPriority = [...fresh, ...c.tokenPriority.filter((id) => !set.has(id))];
}

function startEnemyAttack(
  c: CombatData,
  e: Entity,
  ec: EnemyCombat,
  aim: Cell,
  target: AttackTarget,
): void {
  ec.ai = 'attack';
  ec.attack = { aim: { ...aim }, target }; // §1.6: frozen target cell
  e.attackWindup = enemyTicks(c, ec.type).windup + RESOLVES_NOW;
  e.facing = { x: Math.sign(aim.x - e.x), y: Math.sign(aim.y - e.y) };
}

/**
 * A step STARTED this tick under Shock: its time × SHOCK_MOVE_MULT through the tick
 * accumulator (straight and diagonal). Steps already running are never recomputed.
 */
function shockStep(c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.shock <= 0) return;
  const def = typeOf(c, ec);
  const diag = e.x !== e.fromX && e.y !== e.fromY;
  const base = diag ? enemyDiagMs(def.moveMs, c.cfg.TICK_MS) : def.moveMs;
  const r = accumulateTicks(
    base * c.cfg.SHOCK_MOVE_MULT,
    c.cfg.TICK_MS,
    ec.moveCarry,
    c.cfg.ACTION_TICK_ACCUMULATOR,
  );
  ec.moveCarry = r.carry;
  e.moveTicks = r.ticks;
  e.moveCooldown = r.ticks;
}

/** One BFS step (recomputed every step, §1.6). Blocked → wait and retry next tick. */
function stepToward(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat, goal: Cell): void {
  if (e.moveCooldown > 0 || e.attackWindup > 0 || !isMobile(typeOf(c, ec))) return;
  const occ = enemyOccupied(state, e);
  const step = bfsFirstStep(state.map, e, goal, c.cfg.ENEMY_PATH_RADIUS, occ);
  if (!step) return;
  const r = tryStep(
    e,
    { x: step.x as Dir8['x'], y: step.y as Dir8['y'] },
    state.map,
    enemyCosts(c, ec),
    state.tick,
    occ,
  );
  if (r === 'moved') shockStep(c, e, ec);
}

/** §2.10: step to the free neighbour with the lowest drone-field value (tie: straight first). */
function stepByField(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): boolean {
  const f = c.drone?.field;
  if (!f) return false;
  const here = fieldAt(f, e.x, e.y);
  if (here < 0) return false; // outside the map → BFS fallback
  if (e.moveCooldown > 0 || e.attackWindup > 0) return true;
  const occ = enemyOccupied(state, e);
  let best: Cell | null = null;
  let bestVal = here;
  for (const diagPass of [false, true])
    for (const d of DIRS8) {
      if ((d.x !== 0 && d.y !== 0) !== diagPass) continue;
      const v = fieldAt(f, e.x + d.x, e.y + d.y);
      if (v < 0 || v >= bestVal) continue;
      if (!canStep(state.map, e.x, e.y, d.x, d.y, occ)) continue;
      best = d;
      bestVal = v;
    }
  if (!best) return true; // all better cells taken → wait 1 tick
  const r = tryStep(
    e,
    { x: best.x as Dir8['x'], y: best.y as Dir8['y'] },
    state.map,
    enemyCosts(c, ec),
    state.tick,
    occ,
  );
  if (r === 'moved') shockStep(c, e, ec);
  return true;
}

function wander(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.wanderTimer > 0 || e.moveCooldown > 0) return;
  const rng = combatRng(state);
  ec.wanderTimer = rng.int(c.t.wanderMin, c.t.wanderMax);
  const d = DIRS8[rng.int(0, 7)]!;
  if (chebyshev({ x: e.x + d.x, y: e.y + d.y }, ec.spawn) > c.cfg.ENEMY_WANDER_RADIUS) return;
  const r = tryStep(
    e,
    { x: d.x as Dir8['x'], y: d.y as Dir8['y'] },
    state.map,
    enemyCosts(c, ec),
    state.tick,
    enemyOccupied(state, e),
  );
  if (r === 'moved') shockStep(c, e, ec);
}

// ---- 4. blows ----------------------------------------------------------------------------------

function damageEnemy(
  state: GameState,
  c: CombatData,
  e: Entity,
  ec: EnemyCombat,
  dmg: number,
  crit: boolean,
  source: 'attack' | 'pulse' | 'drone',
): void {
  ec.hp -= dmg;
  ec.hitFlash = c.t.hitFlash;
  c.player.lastCombatTick = state.tick;
  floatText(c, crit ? 'critToEnemy' : 'dmgToEnemy', crit ? `-${dmg}!` : `-${dmg}`, cellOf(e));
  emit(c, { type: 'enemyHit', enemyId: e.id, dmg, crit, source });
  // §1.6: damage wakes the enemy from IDLE / ALERT / RETURN (even inside the deaf window).
  if (ec.hp > 0 && (ec.ai === 'idle' || ec.ai === 'alert' || ec.ai === 'return'))
    startChase(ec, state.player);
}

function resolvePlayerAttack(state: GameState, c: CombatData): void {
  const p = state.player;
  const pc = c.player;
  const a = pc.attack;
  if (!a || p.attackWindup > RESOLVES_NOW) return;
  pc.attack = null;
  p.attackWindup = 0;
  // Live weapon: inventory may have been restored after this wind-up was saved.
  const ranged = equippedWeaponType(state) === 'ranged';
  const cycle = ranged ? c.cfg.RANGED_CYCLE_MS : c.cfg.SWING_CYCLE_MS;
  const windup = ranged ? c.cfg.RANGED_WINDUP_MS : c.cfg.SWING_WINDUP_MS;
  p.attackCooldown = playerAttackTicks(c, cycle - windup);
  if (ranged) tryFire(state, c, a);
  else resolveSwing(state, c, a.dir);
}

/** Melee arc. Momentum is spent once and multiplies every target's roll. */
function resolveSwing(state: GameState, c: CombatData, dir: Dir8): void {
  const p = state.player;
  const pc = c.player;
  const momentum = pc.momentum > 0;
  pc.momentum = 0;
  const cells = arcCells(state.map, p, dir);
  const fxTicks = msToTicks(c.cfg.SWING_FX_MS, c.cfg.TICK_MS);
  for (const cell of cells) addFx(state, c, cell, COMBAT_STYLE.strike, fxTicks, true);
  const victims: Entity[] = [];
  let bossHit = false;
  for (const e of hostiles(state, c)) {
    if (!cells.some((q) => sameCell(q, e))) continue;
    if (isBossPart(c, e)) {
      if (bossHit) continue;
      bossHit = true;
    }
    victims.push(e);
  }
  emit(c, {
    type: 'playerSwing',
    entityId: p.id,
    dir,
    cells,
    hitIds: victims.map((e) => e.id),
  });
  const { cfg } = c;
  const rng = combatRng(state);
  const priority: number[] = [];
  for (const e of victims) {
    const base = rng.int(cfg.PLAYER_DMG_MIN, cfg.PLAYER_DMG_MAX);
    const crit = rng.next() < cfg.PLAYER_CRIT_CHANCE;
    const dmg = computeDamage(base, { crit, momentum }, cfg);
    const ec = c.enemies.get(e.id);
    const held = !!ec?.attack;
    damageHostile(state, c, e, dmg, crit, 'attack');
    if (ec && !held) priority.push(e.id);
  }
  rememberTokenPriority(c, priority);
}

/**
 * Ranged fire. At the projectile cap the shot is skipped (momentum kept) but the cooldown
 * already started, so holding fire does not spin. Damage is rolled now.
 */
function tryFire(
  state: GameState,
  c: CombatData,
  a: { dir: Dir8; target: Cell | null },
): void {
  if (c.projectiles.length >= c.cfg.RANGED_MAX_PROJECTILES) return;
  const p = state.player;
  const pc = c.player;
  const momentum = pc.momentum > 0;
  const rng = combatRng(state);
  const base = rng.int(c.cfg.RANGED_DMG_MIN, c.cfg.RANGED_DMG_MAX);
  const crit = rng.next() < c.cfg.PLAYER_CRIT_CHANCE;
  const dmg = computeDamage(base, { crit, momentum }, c.cfg);
  const shot = buildShot(state.map, cellOf(p), a.dir, c.cfg.RANGED_RANGE, a.target);
  const ticks = Math.max(1, msToTicks(c.cfg.RANGED_PROJ_MS_PER_CELL, c.cfg.TICK_MS));
  const proj: PlayerProjectile = {
    id: c.nextProjectileId++,
    cells: shot.cells,
    idx: -1,
    timer: ticks,
    dmg,
    crit,
    momentum,
    ownerId: p.id,
    dir: { x: a.dir.x, y: a.dir.y },
    from: cellOf(p),
    endCell: shot.endCell,
  };
  c.projectiles.push(proj);
  if (momentum) pc.momentum = 0;
  emit(c, {
    type: 'projectileFired',
    entityId: p.id,
    projectileId: proj.id,
    dir: a.dir,
    from: proj.from,
    cells: shot.cells,
  });
}

function hostileAt(state: GameState, c: CombatData, cell: Cell): number | null {
  for (const e of hostiles(state, c)) if (sameCell(e, cell)) return e.id;
  return null;
}

/** Advance shots. An enemy that stepped onto the standing cell is hit before the advance. */
function stepPlayerProjectiles(state: GameState, c: CombatData): void {
  if (c.projectiles.length === 0) return;
  const ticks = Math.max(1, msToTicks(c.cfg.RANGED_PROJ_MS_PER_CELL, c.cfg.TICK_MS));
  const impacts = stepProjectiles(c.projectiles, ticks, (cell) => hostileAt(state, c, cell));
  for (const hit of impacts) {
    emit(c, {
      type: 'projectileHit',
      entityId: hit.proj.ownerId,
      projectileId: hit.proj.id,
      cell: hit.cell,
      hitId: hit.hitId,
    });
    if (hit.hitId === null) continue;
    const e = entityById(state, hit.hitId);
    if (!e) continue;
    const ec = c.enemies.get(e.id);
    const held = !!ec?.attack;
    damageHostile(state, c, e, hit.proj.dmg, hit.proj.crit, 'attack');
    if (ec && !held) rememberTokenPriority(c, [e.id]);
  }
}

function resolveEnemyBlow(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  const a = ec.attack;
  if (!a || e.attackWindup > RESOLVES_NOW) return;
  ec.attack = null; // token returned
  e.attackWindup = 0;
  if (ec.hp <= 0) return; // killed by the player earlier in step 4 → no blow (§1.1)
  const def = typeOf(c, ec);
  e.attackCooldown = enemyTicks(c, ec.type).cooldown;
  const ranged = def.attack === 'ranged';
  addFx(
    state,
    c,
    a.aim,
    ranged ? COMBAT_STYLE.rangedStrike : COMBAT_STYLE.strike,
    c.t.strikeFx,
    true,
  );
  const roll = combatRng(state).int(def.dmgMin, def.dmgMax);
  if (a.target === 'drone') {
    // §2.10: blows on the drone never hurt the player.
    const d = c.drone;
    const de = droneEntity(state, c);
    if (d && de && sameCell(de, a.aim)) {
      const dmg = computeDamage(
        roll,
        { depthMult: depthMult(c.cfg.DEPTH_DMG_MULT, c, def, ec.depth) },
        c.cfg,
      );
      d.hp -= dmg;
      d.hitFlash = c.t.hitFlash;
      emit(c, { type: 'droneHit', dmg, enemyId: e.id });
    } else emit(c, { type: 'enemyMiss', enemyId: e.id });
    return;
  }
  const p = state.player;
  if (sameCell(p, a.aim)) {
    const r = hitPlayer(
      state,
      c,
      enemyDamage(c, def, roll, ec.depth),
      {
        enemyType: ec.type,
        enemyIndex: enemyEntities(state, c).findIndex((q) => q.e === e),
        from: cellOf(e),
        aim: { ...a.aim },
      },
      e.id,
    );
    if (r !== 'missed') return;
  }
  floatText(c, 'miss', COMBAT_STRINGS.miss, cellOf(e));
  emit(c, { type: 'enemyMiss', enemyId: e.id });
}

/**
 * @internal A blow lands on the player's cell (enemy or boss): i-frames → dodge, evacuated /
 * dead → miss, else damage + S12 hit record + trigger D. `dmg` is final (after armour).
 */
export function hitPlayer(
  state: GameState,
  c: CombatData,
  dmg: number,
  info: Omit<PlayerHitInfo, 'dmg' | 'tick'>,
  enemyId = -1,
): 'hit' | 'dodged' | 'missed' {
  const pc = c.player;
  if (pc.hp <= 0 || isPlayerEvacuated(state)) return 'missed';
  if (pc.iframes > 0) {
    floatText(c, 'miss', COMBAT_STRINGS.miss, info.aim);
    emit(c, { type: 'playerDodged', enemyId });
    return 'dodged';
  }
  pc.hp -= dmg;
  pc.hitFlash = c.t.hitFlash;
  pc.lastCombatTick = state.tick;
  floatText(c, 'dmgToPlayer', `-${dmg}`, info.aim);
  emit(c, { type: 'playerHit', dmg, enemyId });
  c.recentHits.push({
    ...info,
    from: { ...info.from },
    aim: { ...info.aim },
    dmg,
    tick: state.tick,
  });
  if (c.recentHits.length > DEATH_HITS_KEPT) c.recentHits.shift();
  // §1.11 trigger D: hit while no input for AUTOPAUSE_IDLE_HIT_MS.
  if (state.tick - c.lastInputTick >= c.t.autopauseIdleHit) {
    c.pauseRequested = true;
    emit(c, { type: 'autoPauseRequest', reason: 'hitWhileAway' });
  }
  return 'hit';
}

/** @internal boss reset: removes a (summoned) enemy entirely (entity + combat data). */
export function removeEnemyEntity(state: GameState, c: CombatData, e: Entity): void {
  c.enemies.delete(e.id);
  state.entities = state.entities.filter((q) => q !== e);
}

// ---- 5. death / respawn / regen ----------------------------------------------------------------

function enemyLifecycle(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  if (ec.ai !== 'dead' && ec.hp <= 0) {
    // §1.9: the enemy entity itself becomes the passable wreck '%' (M1: stays for the level).
    ec.ai = 'dead';
    ec.hp = 0;
    ec.attack = null;
    ec.shock = 0;
    ec.respawnTimer = c.t.enemyRespawn;
    const pri = c.tokenPriority.indexOf(e.id);
    if (pri >= 0) c.tokenPriority.splice(pri, 1);
    e.solid = false;
    e.attackWindup = 0;
    c.stats.kills++;
    floatText(c, 'kill', COMBAT_STRINGS.kill, cellOf(e));
    emit(c, { type: 'enemyKilled', enemyId: e.id, enemyType: ec.type, contract: ec.contract });
    return;
  }
  if (
    c.cfg.ENEMY_RESPAWN_ENABLED &&
    ec.ai === 'dead' &&
    ec.respawnTimer === 0 &&
    chebyshev(state.player, ec.spawn) >= c.cfg.ENEMY_RESPAWN_MIN_DIST
  ) {
    resetEnemy(state, c, e, ec);
    emit(c, { type: 'enemyRespawned', enemyId: e.id });
  }
}

function droneLifecycle(state: GameState, c: CombatData): void {
  const d = c.drone;
  if (!d) return;
  if (d.hp <= 0) removeDrone(state, c, 'destroyed');
  else if (d.life <= 0) removeDrone(state, c, 'expired');
}

function resetEnemy(state: GameState, c: CombatData, e: Entity, ec: EnemyCombat): void {
  const keep = { contract: ec.contract, group: ec.group, depth: ec.depth, summoned: ec.summoned };
  Object.assign(
    ec,
    newEnemyCombat(ec.id, ec.type, ec.spawn, c, combatRng(state).int(c.t.wanderMin, c.t.wanderMax)),
    keep,
  );
  ec.hp = ec.maxHp = enemyMaxHp(c, ec.type, ec.depth);
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
  c.player.cast = null;
  p.attackWindup = 0;
  c.projectiles = [];
  c.tokenPriority = [];
  removeDrone(state, c, 'playerDied');
  // §1.8: body '%' at the death cell. Only the latest one.
  for (const e of state.entities) if (e.kind === CORPSE_KIND) c.fxIds.delete(e.id);
  state.entities = state.entities.filter((e) => e.kind !== CORPSE_KIND);
  const body = createEntity(CORPSE_KIND, p.x, p.y, COMBAT_STYLE.playerCorpse);
  body.solid = false;
  state.entities.unshift(body); // drawn under everything else
  c.stats.deaths++;
  c.death = { freezeLeft: c.t.deathFreeze, respawnLeft: c.t.respawn };
  const hits = c.recentHits.map((h) => ({ ...h, from: { ...h.from }, aim: { ...h.aim } }));
  const last = hits[hits.length - 1];
  c.deathCause = { killer: last && last.tick === state.tick ? last : null, lastHits: hits };
  emit(c, { type: 'playerDied', cause: c.deathCause });
}

function stepDeath(state: GameState, c: CombatData): void {
  const d = c.death!;
  if (d.freezeLeft > 0) d.freezeLeft--;
  else if (d.respawnLeft > 0) d.respawnLeft--;
  if (d.freezeLeft > 0 || d.respawnLeft > 0) return;
  // §1.8 respawn: start cell (map '@'), full HP; enemies reset on spawn (full HP, IDLE).
  // With ENEMY_RESPAWN_ENABLED = false (M1) killed enemies stay wrecks.
  const p = state.player;
  const old = c.player;
  c.player = newPlayerCombat(old.spawn, c.cfg, old.armor);
  c.player.attackTimeMod = old.attackTimeMod; // equipment and loadout survive death
  c.player.moveTimeMod = old.moveTimeMod;
  c.player.slots = [...old.slots];
  c.player.prevAttack = true; // a still-held ATK must be pressed again
  c.player.prevSkill = [true, true, true];
  c.death = null;
  c.deathCause = null;
  c.recentHits = [];
  resetBossArena(state, c); // [R] the boss fight restarts too (summons removed first)
  for (const { e, ec } of enemyEntities(state, c))
    if (ec.ai !== 'dead' || c.cfg.ENEMY_RESPAWN_ENABLED) resetEnemy(state, c, e, ec);
  setCell(p, old.spawn.x, old.spawn.y);
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

/** @internal Timed fx entity. `fxLayerOwned` (strike, Dash trail): skipped when the FX layer
 *  is active (setCombatFxActive). */
export function addFx(
  state: GameState,
  c: CombatData,
  cell: Cell,
  style: GlyphStyle,
  ticks: number,
  fxLayerOwned = false,
): void {
  if (fxLayerOwned && fxActive) return;
  const fx = createEntity(FX_KIND, cell.x, cell.y, style);
  fx.solid = false;
  state.entities.push(fx);
  c.fxIds.add(fx.id);
  c.strikes.set(fx.id, ticks);
}

/**
 * §1.7 / GRAF §9: ONE glyph per type. Wind-up → inverted cell (magenta bg, dark glyph); the
 * yellow '!' above it is drawn by combat/overlay.ts. Hit flash (100 ms) → white cell, wins.
 */
export function enemyGlyph(ec: EnemyCombat): GlyphStyle {
  if (ec.hitFlash > 0) return combatEnemyFlashGlyph(ec.type);
  if (ec.attack) return combatEnemyTelegraphGlyph(ec.type);
  return combatEnemyGlyph(ec.type);
}

/**
 * "Reduce motion" (§1.7 pt 3–4): telegraph 'x' steady, no blinking. Visual only – never
 * affects logic. Set by PROG / UI from its settings.
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
  // Remove last tick's telegraph markers; expire timed fx.
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
    if (!ec.attack || fxActive) continue; // FX layer draws the telegraph cells
    const ranged = typeOf(c, ec).attack === 'ranged';
    const cellStyle = ranged ? COMBAT_STYLE.rangedTargetCell : COMBAT_STYLE.telegraphCell;
    const ticksToBlow = Math.max(0, e.attackWindup - RESOLVES_NOW);
    const on = telegraphBlinkOn(ticksToBlow, c);
    if (ec.attack.target === 'player' && sameCell(p, ec.attack.aim) && !c.death) {
      // Player on the frozen cell: player glyph alternates with the marker.
      playerGlyph = on
        ? cellStyle
        : {
            ...COMBAT_STYLE.playerOnTelegraph,
            bg: cellStyle.bg ?? COMBAT_STYLE.playerOnTelegraph.bg,
          };
    } else {
      const m = createEntity(FX_KIND, ec.attack.aim.x, ec.attack.aim.y, cellStyle);
      m.solid = false;
      markers.push(m);
    }
  }
  bossVisuals(state, c);
  for (const proj of c.projectiles) {
    if (proj.idx < 0) continue;
    const cell = proj.cells[proj.idx];
    if (!cell) continue;
    const m = createEntity(FX_KIND, cell.x, cell.y, COMBAT_STYLE.playerProjectile);
    m.solid = false;
    markers.push(m);
  }
  const bm = fxActive ? null : bossMarkers(c);
  if (bm) {
    const swing = bm.style === 'swing';
    const on = swing ? telegraphBlinkOn(bm.ticksToBlow, c) : true; // lane: steady (S14)
    const cellStyle = swing ? COMBAT_STYLE.telegraphCell : laneStyle(c);
    for (const cell of bm.cells) {
      if (sameCell(p, cell) && !c.death) {
        playerGlyph = on
          ? cellStyle
          : {
              ...COMBAT_STYLE.playerOnTelegraph,
              bg: cellStyle.bg ?? COMBAT_STYLE.playerOnTelegraph.bg,
            };
        continue;
      }
      const m = createEntity(FX_KIND, cell.x, cell.y, cellStyle);
      m.solid = false;
      markers.push(m);
    }
  }
  for (const m of markers) c.fxIds.add(m.id);
  // Markers under actors (start of the list, after corpses).
  const firstNonCorpse = state.entities.findIndex((e) => e.kind !== CORPSE_KIND);
  state.entities.splice(firstNonCorpse < 0 ? state.entities.length : firstNonCorpse, 0, ...markers);
  const de = droneEntity(state, c);
  if (de && c.drone) de.glyph = c.drone.hitFlash > 0 ? COMBAT_STYLE.droneHit : COMBAT_STYLE.drone;
  p.glyph = c.death ? COMBAT_STYLE.playerCorpse : playerGlyph;
}

// ---- 6. combat timers --------------------------------------------------------------------------

const dec = (v: number) => (v > 0 ? v - 1 : 0);

function countDown(c: CombatData): void {
  const pc = c.player;
  pc.hitFlash = dec(pc.hitFlash);
  pc.iframes = dec(pc.iframes);
  pc.momentum = dec(pc.momentum);
  for (const id of SKILL_IDS) pc.skillCd[id] = dec(pc.skillCd[id]);
  for (const ec of c.enemies.values()) {
    ec.stateTimer = dec(ec.stateTimer);
    ec.wanderTimer = dec(ec.wanderTimer);
    ec.deafTimer = dec(ec.deafTimer);
    ec.respawnTimer = dec(ec.respawnTimer);
    ec.hitFlash = dec(ec.hitFlash);
    ec.shock = dec(ec.shock);
  }
  if (c.drone) {
    c.drone.life = dec(c.drone.life);
    c.drone.fireTimer = dec(c.drone.fireTimer);
    c.drone.hitFlash = dec(c.drone.hitFlash);
  }
  bossCountDown(c);
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

export interface CombatHudSkill {
  slot: number;
  id: SkillId;
  nameId: string;
  name: string;
  cooldownLeftMs: number;
  cooldownMs: number;
  ready: boolean;
}

/** Read-only numbers for the HUD (PROG / UI): HP bar, debug counters, skill slots (M1). */
/**
 * S12 (FX / death screen): who killed the player and from which cell, plus the last ≤ 3 hits.
 * Non-null from the death tick until respawn; survives save / load. Read-only.
 */
export function getCombatDeath(state: GameState): DeathCause | null {
  return peekCombat(state)?.deathCause ?? null;
}

/** S14: boss charge lane (§2.11 Rail Guardian). Cells still ahead of the boss, updated every
 *  charge step (passed cells drop out); `phase` = wind-up (900 ms line) or the ride. */
export interface BossChargeLane {
  dir: Cell;
  cells: Cell[];
  phase: 'windup' | 'charging';
  ticksLeft: number;
}

/**
 * S14: current charge lane or null. Wind-up: the WHOLE 2-row track (wall to wall, body
 * excluded), ticksLeft = ticks to the ride; ride: cells still ahead (passed cells drop out),
 * ticksLeft = ticks to the next cell. Copies – safe to keep.
 */
export function getBossChargeLane(state: GameState): BossChargeLane | null {
  const b = peekCombat(state)?.boss;
  if (!b?.charge || (b.phase !== 'chargeWindup' && b.phase !== 'charging')) return null;
  return {
    dir: { ...b.charge.dir },
    cells: b.charge.lane.map(cellOf),
    phase: b.phase === 'chargeWindup' ? 'windup' : 'charging',
    ticksLeft: b.phase === 'chargeWindup' ? b.timer : b.charge.stepTimer,
  };
}

export function getCombatHud(state: GameState): {
  hp: number;
  maxHp: number;
  dead: boolean;
  kills: number;
  deaths: number;
  skillsEnabled: boolean;
  skills: CombatHudSkill[];
  drone: { hp: number; maxHp: number; lifeLeftMs: number } | null;
  /** §2.11 boss HP bar (null = no living boss engaged / on the level). */
  boss: { hp: number; maxHp: number; phase: string; weakPoint: boolean } | null;
} {
  const c = getCombat(state);
  const pc = c.player;
  const skills: CombatHudSkill[] = [];
  pc.slots.forEach((id, slot) => {
    if (!id) return;
    skills.push({
      slot,
      id,
      nameId: SKILLS[id].nameId,
      name: SKILLS[id].name,
      cooldownLeftMs: pc.skillCd[id] * c.cfg.TICK_MS,
      cooldownMs: SKILLS[id].cooldownMs,
      ready: pc.skillCd[id] === 0,
    });
  });
  return {
    hp: Math.max(0, pc.hp),
    maxHp: pc.maxHp,
    dead: c.death !== null,
    kills: c.stats.kills,
    deaths: c.stats.deaths,
    skillsEnabled: c.cfg.SKILLS_ENABLED,
    skills,
    drone: c.drone
      ? {
          hp: Math.max(0, c.drone.hp),
          maxHp: c.drone.maxHp,
          lifeLeftMs: c.drone.life * c.cfg.TICK_MS,
        }
      : null,
    boss:
      c.boss && bossAlive(c)
        ? {
            hp: c.boss.hp,
            maxHp: c.boss.maxHp,
            phase: c.boss.phase,
            weakPoint: c.boss.phase === 'stunned',
          }
        : null,
  };
}

/** Helper: quantised move direction as the engine sees it (debug / tests). */
export const engineDir = (a: ActionState) => toDir8(a.move);
