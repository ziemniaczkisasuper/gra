// Combat state – plain data (JSON-friendly), no DOM / canvas.
// Positions, facing and the tick counters moveCooldown / attackWindup / attackCooldown live
// on the engine's Entity (entities/entity.ts); everything else combat needs lives here.
import type { CombatConfig, EnemyTypeId } from '../data/combat-m0';
import type { Cell } from './grid';
import type { CombatTicks } from './timing';

export type EnemyAi = 'idle' | 'alert' | 'chase' | 'attack' | 'return' | 'dead';

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
  /** Respawn point (§1.8). */
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
}

export interface EnemyCombat {
  id: number;
  /** Enemy type (data/combat-m0 ENEMY_TYPES) – also the entity kind. */
  type: EnemyTypeId;
  hp: number;
  /** Type HP × DEPTH_HP_MULT (§2.11). */
  maxHp: number;
  ai: EnemyAi;
  spawn: Cell;
  /** ALERT countdown (§1.6). */
  stateTimer: number;
  /** §1.6: frozen target cell of the current wind-up. */
  attack: { aim: Cell } | null;
  lastSeen: Cell | null;
  lostLosTicks: number;
  wanderTimer: number;
  deafTimer: number;
  respawnTimer: number;
  hitFlash: number;
}

export type FloatStyle = 'dmgToEnemy' | 'critToEnemy' | 'dmgToPlayer' | 'miss' | 'kill';

export interface FloatText {
  style: FloatStyle;
  text: string;
  cell: Cell;
  ttl: number;
  maxTtl: number;
}

export type CombatEvent =
  | { type: 'enemyHit'; enemyId: number; dmg: number; crit: boolean }
  | { type: 'playerWhiff' }
  | { type: 'playerHit'; dmg: number }
  | { type: 'enemyMiss'; enemyId: number }
  | { type: 'enemyKilled'; enemyId: number }
  | { type: 'enemyRespawned'; enemyId: number }
  | { type: 'playerDied' }
  | { type: 'playerRespawned' }
  /** §1.11 trigger D. The loop owner (main.ts) performs the pause. */
  | { type: 'autoPauseRequest'; reason: 'hitWhileAway' };

export interface CombatData {
  cfg: CombatConfig;
  t: CombatTicks;
  /** §2.11 current depth 1..3. Random numbers: combatRng(state) only (no RNG state here). */
  depth: number;
  player: PlayerCombat;
  enemies: Map<number, EnemyCombat>;
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
  /** Ids of fx entities (telegraph 'x', strike '*', corpse '%') owned by combat. */
  fxIds: Set<number>;
  /** Strike markers: entity id → ticks left. */
  strikes: Map<number, number>;
}
