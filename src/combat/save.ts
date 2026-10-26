// Combat save section 'combat' (save v4, save/sections.ts) – PROG / Gameplay.
// Registered at module top level; imported by combat/install.ts so it exists before main.ts loads.
//
// What is saved (CombatSave v4, JSON; v1 → v2 → v3 → v4 are migrated on load): everything the combat simulation needs to continue
// tick-exact after an auto-pause save – HP, AI states, timers, frozen target cells, carries,
// and the engine counters of combat actors (moveCooldown / attackWindup / attackCooldown – the
// engine saves only the player's cell and facing). NOT saved:
//   - RNG state: the engine saves stream 'combat' in the top-level rngState (combatRng()).
//   - profile and depth: PROG / Silnik calls setCombatProfile() right after gameFromSave.
//   - the drone's distance map: recomputed from the map (pure) on load.
//   - cosmetics: floating numbers, strike '*', telegraph 'x' markers (rebuilt every tick).
//   - player projectiles (v0.6): in-flight shots are dropped on load.
//   - entity ids: they are not stable between runs → enemies are an ordered list (= AI order),
//     references to enemies are list indexes.
import type { GameState } from '../core/game';
import {
  ENEMY_TYPES,
  RAIL_GUARDIAN,
  SKILL_IDS,
  type EnemyTypeId,
  type SkillId,
} from '../data/combat-m0';
import { COMBAT_STYLE } from '../data/style';
import { createEntity, setCell, type Entity } from '../entities/entity';
import type { Dir8 } from '../input/actions';
import { SaveError } from '../save/schema';
import { registerSaveSection } from '../save/sections';
import {
  CORPSE_KIND,
  createCombatData,
  DRONE_KIND,
  droneEntity,
  droneField,
  enemyGlyph,
  peekCombat,
  setCombat,
} from './combat';
import { createBossParts } from './boss';
import type { Cell } from './grid';
import { BOSS_TYPE } from './state';
import type {
  AttackTarget,
  BossPhase,
  BossState,
  CombatData,
  DeathCause,
  EnemyAi,
  EnemyCombat,
  PlayerHitInfo,
} from './state';

export const COMBAT_SAVE_VERSION = 4;

/** Engine counters of an actor (whole ticks). */
export interface CountersSave {
  moveCooldown: number;
  attackWindup: number;
  attackCooldown: number;
}

export interface PlayerCombatSave extends CountersSave {
  hp: number;
  maxHp: number;
  armor: number;
  attackTimeMod: number;
  moveTimeMod: number;
  atkCarry: number;
  moveCarry: number;
  spawn: Cell;
  /** v4 pending swing or shot. `aim` exists only on a v3 migration (dir is derived in
   *  applyCombat from the restored player cell). Projectiles are not saved. */
  attack: { dir: Cell; aim?: Cell } | null;
  atkQueued: boolean;
  /** §2.6 queued bump target (index into `enemies`). */
  queuedTarget: number | null;
  prevAttack: boolean;
  lastCombatTick: number;
  regenAcc: number;
  hitFlash: number;
  // v2 – §2.5 skills
  slots: (SkillId | null)[];
  skillCd: Record<SkillId, number>;
  cast: { skill: SkillId } | null;
  skillQueue: { slot: number; ttl: number } | null;
  prevSkill: boolean[];
  iframes: number;
  momentum: number;
}

export interface EnemySave extends CountersSave {
  type: EnemyTypeId;
  x: number;
  y: number;
  facing: Cell;
  hp: number;
  maxHp: number;
  ai: EnemyAi;
  spawn: Cell;
  stateTimer: number;
  /** v2: + target ('player' | 'drone'). */
  attack: { aim: Cell; target: AttackTarget } | null;
  lastSeen: Cell | null;
  lostLosTicks: number;
  wanderTimer: number;
  deafTimer: number;
  respawnTimer: number;
  hitFlash: number;
  /** v2: Shock tag ticks. */
  shock: number;
  /** v2: §2.4 contract enemy. */
  contract: boolean;
  /** v3: §2.10 spawn group, Shock step carry, fixed stat depth, boss summon. */
  group: number | null;
  moveCarry: number;
  depth: number | null;
  summoned: boolean;
}

/** v3: §2.11 boss Rail Guardian (parts are recreated from x / y). */
export type BossSave = Omit<BossState, 'partIds'>;

/** v2: sk3 Buddy Drone. */
export interface DroneSave {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  life: number;
  fireTimer: number;
  hitFlash: number;
}

export interface CombatSave {
  v: typeof COMBAT_SAVE_VERSION;
  player: PlayerCombatSave;
  /** In AI update order. */
  enemies: EnemySave[];
  death: { freezeLeft: number; respawnLeft: number } | null;
  lastInputTick: number;
  stats: { kills: number; deaths: number };
  /** §1.8 the player's body '%' (only the latest one). */
  corpse: Cell | null;
  /** v2 */
  drone: DroneSave | null;
  tokenTick: Record<AttackTarget, number>;
  /** v2 – S12: last ≤ 3 hits on the player and the death cause (until respawn). */
  recentHits: PlayerHitInfo[];
  deathCause: DeathCause | null;
  /** v3 */
  boss: BossSave | null;
}

/** null = no combat state yet (new game / save from before combat started) → lazy init. */
export type CombatSaveValue = CombatSave | null;
/** Stored form of "no combat state yet" (the engine requires a section to be an object). */
export const EMPTY_COMBAT_SAVE = { v: COMBAT_SAVE_VERSION, empty: true } as const;

// ---- serialize ---------------------------------------------------------------------------------

const counters = (e: Entity): CountersSave => ({
  moveCooldown: e.moveCooldown,
  attackWindup: e.attackWindup,
  attackCooldown: e.attackCooldown,
});
const cell = (c: Cell): Cell => ({ x: c.x, y: c.y });

export function serializeCombat(state: GameState): CombatSave | typeof EMPTY_COMBAT_SAVE {
  const c = peekCombat(state);
  if (!c) return EMPTY_COMBAT_SAVE;
  const list = state.entities.filter((e) => c.enemies.has(e.id));
  const index = (id: number | null) => {
    if (id === null) return null;
    const i = list.findIndex((e) => e.id === id);
    if (i >= 0) return i;
    const part = c.boss ? c.boss.partIds.indexOf(id) : -1;
    return part < 0 ? null : list.length + part;
  };
  const p = c.player;
  const corpse = state.entities.find((e) => e.kind === CORPSE_KIND);
  return {
    v: COMBAT_SAVE_VERSION,
    player: {
      ...counters(state.player),
      hp: p.hp,
      maxHp: p.maxHp,
      armor: p.armor,
      attackTimeMod: p.attackTimeMod,
      moveTimeMod: p.moveTimeMod,
      atkCarry: p.atkCarry,
      moveCarry: p.moveCarry,
      spawn: cell(p.spawn),
      attack: p.attack ? { dir: cell(p.attack.dir) } : null,
      atkQueued: p.atkQueued,
      queuedTarget: index(p.queuedTargetId),
      prevAttack: p.prevAttack,
      lastCombatTick: p.lastCombatTick,
      regenAcc: p.regenAcc,
      hitFlash: p.hitFlash,
      slots: [...p.slots],
      skillCd: { ...p.skillCd },
      cast: p.cast ? { ...p.cast } : null,
      skillQueue: p.skillQueue ? { ...p.skillQueue } : null,
      prevSkill: [...p.prevSkill],
      iframes: p.iframes,
      momentum: p.momentum,
    },
    enemies: list.map((e) => {
      const ec = c.enemies.get(e.id)!;
      return {
        ...counters(e),
        type: ec.type,
        x: e.x,
        y: e.y,
        facing: cell(e.facing),
        hp: ec.hp,
        maxHp: ec.maxHp,
        ai: ec.ai,
        spawn: cell(ec.spawn),
        stateTimer: ec.stateTimer,
        attack: ec.attack ? { aim: cell(ec.attack.aim), target: ec.attack.target } : null,
        lastSeen: ec.lastSeen ? cell(ec.lastSeen) : null,
        lostLosTicks: ec.lostLosTicks,
        wanderTimer: ec.wanderTimer,
        deafTimer: ec.deafTimer,
        respawnTimer: ec.respawnTimer,
        hitFlash: ec.hitFlash,
        shock: ec.shock,
        contract: ec.contract,
        group: ec.group,
        moveCarry: ec.moveCarry,
        depth: ec.depth,
        summoned: ec.summoned,
      };
    }),
    death: c.death ? { ...c.death } : null,
    lastInputTick: c.lastInputTick,
    stats: { ...c.stats },
    corpse: corpse ? { x: corpse.x, y: corpse.y } : null,
    drone: droneSave(state, c),
    tokenTick: { ...c.tokenTick },
    recentHits: c.recentHits.map(hitCopy),
    deathCause: c.deathCause
      ? {
          killer: c.deathCause.killer && hitCopy(c.deathCause.killer),
          lastHits: c.deathCause.lastHits.map(hitCopy),
        }
      : null,
    boss: c.boss ? bossCopy(c.boss) : null,
  };
}

function bossCopy(b: BossState | BossSave): BossSave {
  return {
    x: b.x,
    y: b.y,
    spawn: cell(b.spawn),
    hp: b.hp,
    maxHp: b.maxHp,
    phase: b.phase,
    timer: b.timer,
    moveCooldown: b.moveCooldown,
    facing: cell(b.facing),
    sinceCharge: b.sinceCharge,
    trackY: b.trackY,
    arena: { ...b.arena },
    playerLeft: b.playerLeft,
    introDone: b.introDone,
    swing: b.swing ? b.swing.map(cell) : null,
    charge: b.charge
      ? {
          dir: cell(b.charge.dir),
          lane: b.charge.lane.map(cell),
          hit: b.charge.hit,
          stepTimer: b.charge.stepTimer,
        }
      : null,
    summoned: b.summoned,
    hitFlash: b.hitFlash,
  };
}

const hitCopy = (h: PlayerHitInfo): PlayerHitInfo => ({
  ...h,
  from: cell(h.from),
  aim: cell(h.aim),
});

function droneSave(state: GameState, c: CombatData): DroneSave | null {
  const d = c.drone;
  const e = droneEntity(state, c);
  if (!d || !e) return null;
  return {
    x: e.x,
    y: e.y,
    hp: d.hp,
    maxHp: d.maxHp,
    life: d.life,
    fireTimer: d.fireTimer,
    hitFlash: d.hitFlash,
  };
}

// ---- deserialize (pure validation; throws SaveError) -------------------------------------------

type Obj = Record<string, unknown>;
const AI_STATES: readonly EnemyAi[] = ['idle', 'alert', 'chase', 'attack', 'return', 'dead'];

function fail(path: string): never {
  throw new SaveError(`Bad combat save: ${path}`);
}
function obj(v: unknown, path: string): Obj {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) fail(path);
  return v as Obj;
}
function num(o: Obj, k: string, path: string): number {
  const v = o[k];
  if (typeof v !== 'number' || !Number.isFinite(v)) fail(`${path}.${k}`);
  return v;
}
function int(o: Obj, k: string, path: string, min = 0): number {
  const v = num(o, k, path);
  if (!Number.isInteger(v) || v < min) fail(`${path}.${k}`);
  return v;
}
function bool(o: Obj, k: string, path: string): boolean {
  const v = o[k];
  if (typeof v !== 'boolean') fail(`${path}.${k}`);
  return v;
}
function cellOf(v: unknown, path: string): Cell {
  const o = obj(v, path);
  return { x: int(o, 'x', path, -1e6), y: int(o, 'y', path, -1e6) };
}
function dirOf(v: unknown, path: string): Cell {
  const d = cellOf(v, path);
  if (Math.abs(d.x) > 1 || Math.abs(d.y) > 1) fail(path);
  return d;
}

/** v4 attack, or a v3 migration that still carries `aim` and no `dir`. */
function playerAttackOf(pa: Obj | null): { dir: Cell; aim?: Cell } | null {
  if (!pa) return null;
  const aim = pa.aim === undefined ? undefined : cellOf(pa.aim, 'player.attack.aim');
  if (pa.dir === undefined) {
    if (!aim) fail('player.attack.dir');
    return { dir: { x: 0, y: 0 }, aim };
  }
  const dir = dirOf(pa.dir, 'player.attack.dir');
  if (dir.x === 0 && dir.y === 0 && !aim) fail('player.attack.dir');
  return aim ? { dir, aim } : { dir };
}

/** Dir8 from a saved attack. `aim` (v3) is relative to the player cell already restored. */
function savedAttackDir(
  a: { dir: Cell; aim?: Cell },
  player: { x: number; y: number },
): Dir8 {
  let x = a.dir.x;
  let y = a.dir.y;
  if (a.aim) {
    x = Math.sign(a.aim.x - player.x);
    y = Math.sign(a.aim.y - player.y);
  }
  if (x === 0 && y === 0) return { x: 1, y: 0 };
  return { x: Math.sign(x) as Dir8['x'], y: Math.sign(y) as Dir8['y'] };
}
const orNull = <T>(v: unknown, f: (v: unknown) => T): T | null => (v === null ? null : f(v));
function countersOf(o: Obj, path: string): CountersSave {
  return {
    moveCooldown: int(o, 'moveCooldown', path),
    attackWindup: int(o, 'attackWindup', path),
    attackCooldown: int(o, 'attackCooldown', path),
  };
}

/**
 * v1 → v2 (pure, on a copy): drop profile / depth (now from setCombatProfile), add the M1
 * fields with "nothing happening" defaults (no skills on cooldown, no drone, no Shock, all
 * wind-ups aimed at the player).
 */
export function migrateCombatV1(o: Obj): Obj {
  const out: Obj = { ...o, v: 2 };
  delete out.profile;
  delete out.depth;
  if (o.empty === true) return out;
  const p = obj(o.player, 'player');
  out.player = {
    ...p,
    slots: ['dash', 'shockPulse', 'buddyDrone'],
    skillCd: { dash: 0, shockPulse: 0, buddyDrone: 0 },
    cast: null,
    skillQueue: null,
    prevSkill: [false, false, false],
    iframes: 0,
    momentum: 0,
  };
  if (!Array.isArray(o.enemies)) fail('enemies');
  out.enemies = o.enemies.map((v, i) => {
    const e = obj(v, `enemies[${i}]`);
    const at =
      e.attack === null || e.attack === undefined ? null : obj(e.attack, `enemies[${i}].attack`);
    return { ...e, shock: 0, contract: false, attack: at ? { ...at, target: 'player' } : null };
  });
  out.drone = null;
  out.tokenTick = { player: -1e9, drone: -1e9 };
  out.recentHits = [];
  out.deathCause = null;
  return out;
}

/**
 * v2 → v3 (pure, on a copy): no boss yet; enemies get the v0.5.2 fields with neutral defaults
 * (no spawn group, no Shock carry, zone depth, not a summon).
 */
export function migrateCombatV2(o: Obj): Obj {
  const out: Obj = { ...o, v: 3 };
  if (o.empty === true) return out;
  if (!Array.isArray(o.enemies)) fail('enemies');
  out.enemies = o.enemies.map((v, i) => ({
    ...obj(v, `enemies[${i}]`),
    group: null,
    moveCarry: 0,
    depth: null,
    summoned: false,
  }));
  out.boss = null;
  return out;
}

/**
 * v3 → v4 (pure, on a copy): the player blow no longer stores a target index. `target` is
 * dropped. `aim` is kept so applyCombat can turn it into a Dir8 once the player cell exists.
 * In-flight projectiles were never part of v3.
 */
export function migrateCombatV3(o: Obj): Obj {
  const out: Obj = { ...o, v: 4 };
  if (o.empty === true) return out;
  const p = obj(o.player, 'player');
  let attack: unknown = null;
  if (p.attack != null) {
    const pa = obj(p.attack, 'player.attack');
    const next: Obj = {};
    if (pa.dir !== undefined) next.dir = pa.dir;
    if (pa.aim !== undefined) next.aim = pa.aim;
    attack = next;
  }
  out.player = { ...p, attack };
  return out;
}

const SAVE_MIGRATIONS: Record<number, (o: Obj) => Obj> = {
  1: migrateCombatV1,
  2: migrateCombatV2,
  3: migrateCombatV3,
};

export function deserializeCombat(raw: unknown): CombatSaveValue {
  if (raw === null || raw === undefined) return null;
  let o = obj(raw, 'combat');
  while (typeof o.v === 'number' && o.v < COMBAT_SAVE_VERSION) {
    const m = SAVE_MIGRATIONS[o.v];
    if (!m) fail(`v ${o.v} (no migration)`);
    o = m(o);
  }
  if (o.v !== COMBAT_SAVE_VERSION) fail(`v (expected ${COMBAT_SAVE_VERSION})`);
  if (o.empty === true) return null;
  const ea = o.enemies;
  if (!Array.isArray(ea)) fail('enemies');
  const n = ea.length;
  const boss = o.boss === null || o.boss === undefined ? null : bossOf(obj(o.boss, 'boss'));
  const targets = n + (boss ? RAIL_GUARDIAN.BOSS_W * RAIL_GUARDIAN.BOSS_H : 0);
  const idx = (v: unknown, path: string): number | null => {
    if (v === null) return null;
    if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v >= targets) fail(path);
    return v;
  };

  const po = obj(o.player, 'player');
  const pa = po.attack === null ? null : obj(po.attack, 'player.attack');
  const player: PlayerCombatSave = {
    ...countersOf(po, 'player'),
    hp: int(po, 'hp', 'player', -1e9),
    maxHp: int(po, 'maxHp', 'player', 1),
    armor: num(po, 'armor', 'player'),
    attackTimeMod: num(po, 'attackTimeMod', 'player'),
    moveTimeMod: num(po, 'moveTimeMod', 'player'),
    atkCarry: num(po, 'atkCarry', 'player'),
    moveCarry: num(po, 'moveCarry', 'player'),
    spawn: cellOf(po.spawn, 'player.spawn'),
    attack: playerAttackOf(pa),
    atkQueued: bool(po, 'atkQueued', 'player'),
    queuedTarget: idx(po.queuedTarget, 'player.queuedTarget'),
    prevAttack: bool(po, 'prevAttack', 'player'),
    lastCombatTick: int(po, 'lastCombatTick', 'player', -1e12),
    regenAcc: num(po, 'regenAcc', 'player'),
    hitFlash: int(po, 'hitFlash', 'player'),
    slots: slotsOf(po.slots),
    skillCd: skillCdOf(po.skillCd),
    cast:
      po.cast === null
        ? null
        : { skill: skillOf(obj(po.cast, 'player.cast').skill, 'player.cast.skill') },
    skillQueue: po.skillQueue === null ? null : queueOf(obj(po.skillQueue, 'player.skillQueue')),
    prevSkill: boolsOf(po.prevSkill, 'player.prevSkill', 3),
    iframes: int(po, 'iframes', 'player'),
    momentum: int(po, 'momentum', 'player'),
  };

  const enemies: EnemySave[] = ea.map((v, i) => {
    const path = `enemies[${i}]`;
    const e = obj(v, path);
    if (typeof e.type !== 'string' || !(e.type in ENEMY_TYPES)) fail(`${path}.type`);
    if (!AI_STATES.includes(e.ai as EnemyAi)) fail(`${path}.ai`);
    const at = e.attack === null ? null : obj(e.attack, `${path}.attack`);
    return {
      ...countersOf(e, path),
      type: e.type as EnemyTypeId,
      x: int(e, 'x', path),
      y: int(e, 'y', path),
      facing: dirOf(e.facing, `${path}.facing`),
      hp: int(e, 'hp', path, -1e9),
      maxHp: int(e, 'maxHp', path, 1),
      ai: e.ai as EnemyAi,
      spawn: cellOf(e.spawn, `${path}.spawn`),
      stateTimer: int(e, 'stateTimer', path),
      attack: at
        ? {
            aim: cellOf(at.aim, `${path}.attack.aim`),
            target: targetOf(at.target, `${path}.attack.target`),
          }
        : null,
      lastSeen: orNull(e.lastSeen, (c) => cellOf(c, `${path}.lastSeen`)),
      lostLosTicks: int(e, 'lostLosTicks', path),
      wanderTimer: int(e, 'wanderTimer', path),
      deafTimer: int(e, 'deafTimer', path),
      respawnTimer: int(e, 'respawnTimer', path),
      hitFlash: int(e, 'hitFlash', path),
      shock: int(e, 'shock', path),
      contract: bool(e, 'contract', path),
      group: e.group === null ? null : int(e, 'group', path, -1e9),
      moveCarry: num(e, 'moveCarry', path),
      depth: e.depth === null ? null : int(e, 'depth', path, 1),
      summoned: bool(e, 'summoned', path),
    };
  });

  const d = o.death === null ? null : obj(o.death, 'death');
  const st = obj(o.stats, 'stats');
  const dr = o.drone === null ? null : obj(o.drone, 'drone');
  const tt = obj(o.tokenTick, 'tokenTick');
  return {
    v: COMBAT_SAVE_VERSION,
    player,
    enemies,
    death: d
      ? { freezeLeft: int(d, 'freezeLeft', 'death'), respawnLeft: int(d, 'respawnLeft', 'death') }
      : null,
    lastInputTick: int(o, 'lastInputTick', 'combat', -1e12),
    stats: { kills: int(st, 'kills', 'stats'), deaths: int(st, 'deaths', 'stats') },
    corpse: orNull(o.corpse, (c) => cellOf(c, 'corpse')),
    drone: dr
      ? {
          x: int(dr, 'x', 'drone'),
          y: int(dr, 'y', 'drone'),
          hp: int(dr, 'hp', 'drone', -1e9),
          maxHp: int(dr, 'maxHp', 'drone', 1),
          life: int(dr, 'life', 'drone'),
          fireTimer: int(dr, 'fireTimer', 'drone'),
          hitFlash: int(dr, 'hitFlash', 'drone'),
        }
      : null,
    tokenTick: {
      player: int(tt, 'player', 'tokenTick', -1e12),
      drone: int(tt, 'drone', 'tokenTick', -1e12),
    },
    recentHits: hitsOf(o.recentHits, 'recentHits', n),
    deathCause: o.deathCause === null ? null : deathCauseOf(obj(o.deathCause, 'deathCause'), n),
    boss,
  };
}

const BOSS_PHASES: readonly BossPhase[] = [
  'idle',
  'chase',
  'swing',
  'recover',
  'toTrack',
  'chargeWindup',
  'charging',
  'stunned',
  'summon',
  'dead',
];

function bossOf(b: Obj): BossSave {
  if (!BOSS_PHASES.includes(b.phase as BossPhase)) fail('boss.phase');
  const ar = obj(b.arena, 'boss.arena');
  const cells = (v: unknown, path: string): Cell[] => {
    if (!Array.isArray(v)) fail(path);
    return v.map((q, i) => cellOf(q, `${path}[${i}]`));
  };
  const ch = b.charge === null ? null : obj(b.charge, 'boss.charge');
  return {
    x: int(b, 'x', 'boss', -1e6),
    y: int(b, 'y', 'boss', -1e6),
    spawn: cellOf(b.spawn, 'boss.spawn'),
    hp: int(b, 'hp', 'boss', 0),
    maxHp: int(b, 'maxHp', 'boss', 1),
    phase: b.phase as BossPhase,
    timer: int(b, 'timer', 'boss'),
    moveCooldown: int(b, 'moveCooldown', 'boss'),
    facing: dirOf(b.facing, 'boss.facing'),
    sinceCharge: int(b, 'sinceCharge', 'boss'),
    trackY: b.trackY === null ? null : int(b, 'trackY', 'boss', -1e6),
    arena: {
      x0: int(ar, 'x0', 'boss.arena', -1e6),
      y0: int(ar, 'y0', 'boss.arena', -1e6),
      x1: int(ar, 'x1', 'boss.arena', -1e6),
      y1: int(ar, 'y1', 'boss.arena', -1e6),
    },
    playerLeft: bool(b, 'playerLeft', 'boss'),
    introDone: bool(b, 'introDone', 'boss'),
    swing: b.swing === null ? null : cells(b.swing, 'boss.swing'),
    charge: ch
      ? {
          dir: dirOf(ch.dir, 'boss.charge.dir'),
          lane: cells(ch.lane, 'boss.charge.lane'),
          hit: bool(ch, 'hit', 'boss.charge'),
          stepTimer: int(ch, 'stepTimer', 'boss.charge'),
        }
      : null,
    summoned: bool(b, 'summoned', 'boss'),
    hitFlash: int(b, 'hitFlash', 'boss'),
  };
}

function hitOf(v: unknown, path: string, n: number): PlayerHitInfo {
  const h = obj(v, path);
  const isBoss = h.enemyType === BOSS_TYPE;
  if (typeof h.enemyType !== 'string' || !(isBoss || h.enemyType in ENEMY_TYPES))
    fail(`${path}.enemyType`);
  const enemyIndex = int(h, 'enemyIndex', path, -1);
  if (enemyIndex >= n || (isBoss && enemyIndex !== -1)) fail(`${path}.enemyIndex`);
  return {
    enemyType: h.enemyType as EnemyTypeId | typeof BOSS_TYPE,
    enemyIndex,
    from: cellOf(h.from, `${path}.from`),
    aim: cellOf(h.aim, `${path}.aim`),
    dmg: int(h, 'dmg', path),
    tick: int(h, 'tick', path),
  };
}
function hitsOf(v: unknown, path: string, n: number): PlayerHitInfo[] {
  if (!Array.isArray(v) || v.length > 3) fail(path);
  return v.map((h, i) => hitOf(h, `${path}[${i}]`, n));
}
function deathCauseOf(o: Obj, n: number): DeathCause {
  return {
    killer: o.killer === null ? null : hitOf(o.killer, 'deathCause.killer', n),
    lastHits: hitsOf(o.lastHits, 'deathCause.lastHits', n),
  };
}

function skillOf(v: unknown, path: string): SkillId {
  if (typeof v !== 'string' || !SKILL_IDS.includes(v as SkillId)) fail(path);
  return v as SkillId;
}
function targetOf(v: unknown, path: string): AttackTarget {
  if (v !== 'player' && v !== 'drone') fail(path);
  return v;
}
function slotsOf(v: unknown): (SkillId | null)[] {
  if (!Array.isArray(v) || v.length !== 3) fail('player.slots');
  return v.map((s: unknown, i) => (s === null ? null : skillOf(s, `player.slots[${i}]`)));
}
function skillCdOf(v: unknown): Record<SkillId, number> {
  const o = obj(v, 'player.skillCd');
  const out = {} as Record<SkillId, number>;
  for (const id of SKILL_IDS) out[id] = int(o, id, 'player.skillCd');
  return out;
}
function queueOf(o: Obj): { slot: number; ttl: number } {
  const slot = int(o, 'slot', 'player.skillQueue');
  if (slot > 2) fail('player.skillQueue.slot');
  return { slot, ttl: int(o, 'ttl', 'player.skillQueue') };
}
function boolsOf(v: unknown, path: string, n: number): boolean[] {
  if (!Array.isArray(v) || v.length !== n || v.some((b) => typeof b !== 'boolean')) fail(path);
  return v as boolean[];
}

// ---- apply -------------------------------------------------------------------------------------

/**
 * Puts a CombatSave into a fresh GameState from gameFromSave(): the map's 'E' dummies are
 * replaced by the saved enemies, the player's combat counters are restored. Draws no random
 * numbers (the 'combat' stream was already restored from rngState).
 */
export function applyCombat(state: GameState, s: CombatSaveValue): void {
  if (!s) return; // lazy init on the first tick, as in a new game
  // Profile / depth: defaults here; PROG / Silnik calls setCombatProfile() right after loading.
  const c: CombatData = createCombatData(state, {
    playerSpawn: s.player.spawn,
    playerArmor: s.player.armor,
  });
  state.entities = state.entities.filter((e) => e.kind !== 'dummy' && e.kind !== CORPSE_KIND);
  const ids: number[] = [];
  for (const es of s.enemies) {
    const e = createEntity(es.type, es.x, es.y, COMBAT_STYLE.wreck);
    e.facing = cell(es.facing);
    e.moveCooldown = es.moveCooldown;
    e.attackWindup = es.attackWindup;
    e.attackCooldown = es.attackCooldown;
    e.solid = es.ai !== 'dead';
    const ec: EnemyCombat = {
      id: e.id,
      type: es.type,
      hp: es.hp,
      maxHp: es.maxHp,
      ai: es.ai,
      spawn: cell(es.spawn),
      stateTimer: es.stateTimer,
      attack: es.attack ? { aim: cell(es.attack.aim), target: es.attack.target } : null,
      lastSeen: es.lastSeen ? cell(es.lastSeen) : null,
      lostLosTicks: es.lostLosTicks,
      wanderTimer: es.wanderTimer,
      deafTimer: es.deafTimer,
      respawnTimer: es.respawnTimer,
      hitFlash: es.hitFlash,
      shock: es.shock,
      contract: es.contract,
      group: es.group,
      moveCarry: es.moveCarry,
      depth: es.depth,
      summoned: es.summoned,
    };
    e.glyph = ec.ai === 'dead' ? COMBAT_STYLE.wreck : enemyGlyph(ec);
    c.enemies.set(e.id, ec);
    state.entities.push(e);
    ids.push(e.id);
  }
  if (s.boss) {
    c.boss = { ...bossCopy(s.boss), partIds: [] };
    createBossParts(state, c);
  }
  const ps = s.player;
  const id = (i: number | null) =>
    i === null ? null : i < ids.length ? ids[i]! : (c.boss?.partIds[i - ids.length] ?? null);
  Object.assign(c.player, {
    hp: ps.hp,
    maxHp: ps.maxHp,
    attackTimeMod: ps.attackTimeMod,
    moveTimeMod: ps.moveTimeMod,
    atkCarry: ps.atkCarry,
    moveCarry: ps.moveCarry,
    attack: ps.attack
      ? { dir: savedAttackDir(ps.attack, state.player), aimCell: null, target: null }
      : null,
    atkQueued: ps.atkQueued,
    queuedTargetId: id(ps.queuedTarget),
    prevAttack: ps.prevAttack,
    lastCombatTick: ps.lastCombatTick,
    regenAcc: ps.regenAcc,
    hitFlash: ps.hitFlash,
    slots: [...ps.slots],
    skillCd: { ...ps.skillCd },
    cast: ps.cast ? { ...ps.cast } : null,
    skillQueue: ps.skillQueue ? { ...ps.skillQueue } : null,
    prevSkill: [...ps.prevSkill],
    iframes: ps.iframes,
    momentum: ps.momentum,
  });
  const p = state.player;
  p.moveCooldown = ps.moveCooldown;
  p.attackWindup = ps.attackWindup;
  p.attackCooldown = ps.attackCooldown;
  c.death = s.death ? { ...s.death } : null;
  c.lastInputTick = s.lastInputTick;
  c.stats = { ...s.stats };
  if (s.corpse) {
    const body = createEntity(CORPSE_KIND, s.corpse.x, s.corpse.y, COMBAT_STYLE.playerCorpse);
    body.solid = false;
    setCell(body, s.corpse.x, s.corpse.y);
    state.entities.unshift(body);
  }
  c.tokenTick = { ...s.tokenTick };
  c.recentHits = s.recentHits.map(hitCopy);
  c.deathCause = s.deathCause
    ? {
        killer: s.deathCause.killer && hitCopy(s.deathCause.killer),
        lastHits: s.deathCause.lastHits.map(hitCopy),
      }
    : null;
  if (s.drone) {
    const d = s.drone;
    const de = createEntity(DRONE_KIND, d.x, d.y, COMBAT_STYLE.drone);
    state.entities.push(de);
    c.drone = {
      entityId: de.id,
      hp: d.hp,
      maxHp: d.maxHp,
      life: d.life,
      fireTimer: d.fireTimer,
      hitFlash: d.hitFlash,
      field: droneField(state.map, { x: d.x, y: d.y }, c.cfg.DRONE_FIELD_RADIUS),
    };
  }
  setCombat(state, c);
}

registerSaveSection<CombatSaveValue>('combat', {
  serialize: serializeCombat,
  deserialize: deserializeCombat,
  fresh: () => null,
  apply: applyCombat,
});
