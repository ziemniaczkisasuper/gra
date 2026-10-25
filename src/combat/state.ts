// Combat state – plain data (JSON-friendly), no DOM / canvas.
// Positions, facing and the tick counters moveCooldown / attackWindup / attackCooldown live
// on the engine's Entity (entities/entity.ts); everything else combat needs lives here.
import type { CombatConfig, EnemyTypeId, SkillId } from '../data/combat-m0';
import type { Cell } from './grid';
import type { CombatTicks } from './timing';

export type EnemyAi = 'idle' | 'alert' | 'chase' | 'attack' | 'return' | 'dead';
/** Who a wind-up is aimed at (§2.10: the drone has its own token pool and never hurts the player). */
export type AttackTarget = 'player' | 'drone';

export interface PlayerCombat {
  hp: number;
  maxHp: number;
  /** §2.11 armour A (0 in M0). Damage taken: DR = A/(A+100), max 60 %, min 1. */
  armor: number;
  /** §2.5 speed affixes as time modifiers: −0.10 = actions 10 % shorter. 0 in M0. */
  attackTimeMod: number;
  moveTimeMod: number;
  /** Fractional tick carry of the accumulator (ACTION_TICK_ACCUMULATOR), |carry| ≤ 0.5. */
  atkCarry: number;
  moveCarry: number;
  /** §2.6: target of a bump queued during cooldown (null = normal ATK queue / auto-target). */
  queuedTargetId: number | null;
  /** Respawn point (§1.8) – the map's '@' (see mapSpawn), not the saved position. */
  spawn: Cell;
  /** Pending blow: auto-target frozen at start (§1.3); null target = tap → hits `aim`. */
  attack: { targetId: number | null; aim: Cell } | null;
  /** §1.3: ATK pressed in the last ATK_QUEUE_MS of cooldown. */
  atkQueued: boolean;
  prevAttack: boolean;
  /** Tick of last damage dealt or taken (regen §1.4). */
  lastCombatTick: number;
  /** Milli-HP accumulator (integer regen). */
  regenAcc: number;
  hitFlash: number;

  // ---- §2.5 skills (M1) ----
  /** sk1..sk3 → skill id (slots point at skills, not the other way round). */
  slots: (SkillId | null)[];
  /** Cooldown ticks left per skill (bound to the skill, not the slot). */
  skillCd: Record<SkillId, number>;
  /** Skill in its wind-up (encoded on attackWindup like an attack). */
  cast: { skill: SkillId } | null;
  /** SKILL_BUFFER_MS buffer: slot pressed while busy / at the end of the cooldown. */
  skillQueue: { slot: number; ttl: number } | null;
  /** Previous held state of skill1..3 (edge detection). */
  prevSkill: boolean[];
  /** Dash invulnerability ticks left. */
  iframes: number;
  /** Momentum tag ticks left: the next basic blow deals +SK1_MOMENTUM_BONUS. */
  momentum: number;
}

export interface EnemyCombat {
  id: number;
  /** Enemy type (data/combat-m0 ENEMY_TYPES) – also the entity kind. */
  type: EnemyTypeId;
  hp: number;
  /** Type HP × DEPTH_HP_MULT at spawn (§2.11). */
  maxHp: number;
  ai: EnemyAi;
  spawn: Cell;
  /** ALERT countdown (§1.6). */
  stateTimer: number;
  /** Frozen target cell of the current wind-up; holding a wind-up = holding an attack token. */
  attack: { aim: Cell; target: AttackTarget } | null;
  lastSeen: Cell | null;
  lostLosTicks: number;
  wanderTimer: number;
  deafTimer: number;
  respawnTimer: number;
  hitFlash: number;
  /** §2.5 Shock tag ticks left (interrupts the wind-up, slower steps, drone ×2). */
  shock: number;
  /** §2.4 contract enemy (spawned for a contract): no loot (CONTRACT_ENEMY_LOOT), LUZ reads it. */
  contract: boolean;
}

/** §2.5 sk3 Buddy Drone (one at a time). */
export interface DroneState {
  entityId: number;
  hp: number;
  maxHp: number;
  life: number;
  fireTimer: number;
  hitFlash: number;
  /** §2.10 distance map from the drone cell (weights 3/4, radius DRONE_FIELD_RADIUS), -1 = unreachable. */
  field: { cx: number; cy: number; r: number; dist: number[] };
}

export type FloatStyle = 'dmgToEnemy' | 'critToEnemy' | 'dmgToPlayer' | 'miss' | 'kill';

export interface FloatText {
  style: FloatStyle;
  text: string;
  cell: Cell;
  ttl: number;
  maxTtl: number;
}

/** S12 (FX / death screen M1_DEATH_01/02): one enemy blow that hurt the player. */
export interface PlayerHitInfo {
  enemyType: EnemyTypeId;
  /** Index of the attacker in AI order (= CombatSave enemies index; ids are not stable). */
  enemyIndex: number;
  /** Cell the blow came FROM (attacker's cell at resolution). */
  from: Cell;
  /** Frozen target cell (= player's cell). */
  aim: Cell;
  dmg: number;
  tick: number;
}

/** S12: who killed the player; kept from death until respawn (saved). */
export interface DeathCause {
  killer: PlayerHitInfo | null;
  /** Last ≤ 3 hits, oldest first (M1_DEATH_02). */
  lastHits: PlayerHitInfo[];
}

export type CombatEvent =
  | {
      type: 'enemyHit';
      enemyId: number;
      dmg: number;
      crit: boolean;
      source?: 'attack' | 'pulse' | 'drone';
    }
  | { type: 'playerWhiff' }
  | { type: 'playerHit'; dmg: number; enemyId?: number }
  | { type: 'playerDodged'; enemyId: number }
  | { type: 'enemyMiss'; enemyId: number }
  | { type: 'enemyKilled'; enemyId: number; enemyType?: EnemyTypeId; contract?: boolean }
  | { type: 'enemyRespawned'; enemyId: number }
  | { type: 'playerDied'; cause?: DeathCause }
  | { type: 'playerRespawned' }
  | { type: 'skillUsed'; skill: SkillId; slot: number }
  | { type: 'skillFailed'; skill: SkillId; reason: 'noCell' }
  | { type: 'dash'; from: Cell; to: Cell; path: Cell[] }
  | { type: 'shockPulse'; center: Cell; radius: number }
  | { type: 'telegraphInterrupted'; enemyId: number }
  | { type: 'droneDeployed'; cell: Cell }
  | { type: 'droneShot'; enemyId: number; dmg: number }
  | { type: 'droneHit'; dmg: number; enemyId: number }
  | { type: 'droneGone'; reason: 'expired' | 'destroyed' | 'playerDied' }
  /** §1.11 trigger D. The loop owner (main.ts) performs the pause. */
  | { type: 'autoPauseRequest'; reason: 'hitWhileAway' };

export interface CombatData {
  cfg: CombatConfig;
  t: CombatTicks;
  /** §2.11 current depth 1..3 (set by setCombatProfile; not saved). */
  depth: number;
  /** Combat profile id ('m0' | 'm1' | 'custom') – set by setCombatProfile; not saved. */
  profile: string;
  player: PlayerCombat;
  enemies: Map<number, EnemyCombat>;
  drone: DroneState | null;
  /** S12: last ≤ 3 hits on the player (saved). */
  recentHits: PlayerHitInfo[];
  /** S12: set at death, cleared at respawn (saved). */
  deathCause: DeathCause | null;
  /** §2.10 ATTACK_TOKEN_STAGGER_MS: tick of the last token taken per target. */
  tokenTick: Record<AttackTarget, number>;
  floats: FloatText[];
  /** Events of the last tick only. */
  events: CombatEvent[];
  /** §1.8 death sequence: freeze, then SIGNAL LOST overlay, then respawn. */
  death: { freezeLeft: number; respawnLeft: number } | null;
  /** Tick of the last input of any kind (trigger D). */
  lastInputTick: number;
  /** Set by trigger D, cleared by takeAutoPauseRequest(). */
  pauseRequested: boolean;
  /** Debug counters (§1.8: deaths and kills go to the debug panel). */
  stats: { kills: number; deaths: number };
  /** Ids of fx entities (telegraph 'x', strike '*', corpse '%', dash trail) owned by combat. */
  fxIds: Set<number>;
  /** Timed fx entities (strike, dash trail): entity id → ticks left. */
  strikes: Map<number, number>;
}
