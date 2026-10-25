import { COMBAT, type CombatConfig } from '../data/combat-m0';

/** §1.1: ticks = round(ms / tickMs), minimum 1. 0 ms stays 0 (feature disabled). */
export function msToTicks(ms: number, tickMs: number): number {
  if (ms <= 0) return 0;
  return Math.max(1, Math.round(ms / tickMs));
}

/**
 * §2.5 / ACTION_TICK_ACCUMULATOR: whole ticks for an action of `ms` with a fractional carry.
 *   exact = ms / tickMs + carry;  ticks = max(1, round(exact));  carry' = exact − ticks
 * The rounding remainder moves to the NEXT action, so over many actions the average equals the
 * exact value (e.g. −10% of an 8-tick cycle → 7.2 ticks on average, not 7). |carry| ≤ 0.5;
 * when the 1-tick minimum wins, the debt is dropped (carry clamped at −0.5).
 * `enabled = false` → plain msToTicks, carry 0.
 */
export function accumulateTicks(
  ms: number,
  tickMs: number,
  carry: number,
  enabled = true,
): { ticks: number; carry: number } {
  if (!enabled) return { ticks: msToTicks(ms, tickMs), carry: 0 };
  if (ms <= 0) return { ticks: 0, carry };
  const exact = ms / tickMs + carry;
  const ticks = Math.max(1, Math.round(exact));
  // Snap float noise (e.g. 1.7999999) so exact multiples keep carry = 0.
  const rest = Math.round((exact - ticks) * 1e9) / 1e9;
  return { ticks, carry: Math.max(-0.5, rest) };
}

/** All fixed combat durations converted to whole ticks (logic only ever uses these). */
export interface CombatTicks {
  playerMove: number;
  playerMoveDiag: number;
  playerWindup: number;
  playerCooldown: number;
  tapBuffer: number;
  atkQueue: number;
  regenDelay: number;
  deathFreeze: number;
  respawn: number;
  /** M0 enemy (Scrap Crawler) – other types: combat.ts enemyTicks() from ENEMY_TYPES. */
  enemyMove: number;
  enemyMoveDiag: number;
  enemyWindup: number;
  enemyCooldown: number;
  enemyAlert: number;
  enemyLostLos: number;
  enemyReturnDeaf: number;
  wanderMin: number;
  wanderMax: number;
  enemyRespawn: number;
  telegraphBlink: number;
  telegraphFastLast: number;
  telegraphFastBlink: number;
  strikeFx: number;
  floatText: number;
  hitFlash: number;
  autopauseIdleHit: number;
  // M1 (§2.5, §2.10)
  tokenStagger: number;
  skillBuffer: number;
  dashIframes: number;
  momentum: number;
  dashTrail: number;
  shock: number;
  droneFire: number;
  droneLife: number;
}

export function computeTicks(c: CombatConfig = COMBAT, tickMs: number = c.TICK_MS): CombatTicks {
  const t = (ms: number) => msToTicks(ms, tickMs);
  return {
    playerMove: t(c.PLAYER_MOVE_MS),
    playerMoveDiag: t(c.PLAYER_MOVE_DIAG_MS),
    playerWindup: t(c.PLAYER_ATK_WINDUP_MS),
    playerCooldown: t(c.PLAYER_ATK_COOLDOWN_MS),
    tapBuffer: t(c.INPUT_TAP_BUFFER_MS),
    atkQueue: t(c.ATK_QUEUE_MS),
    regenDelay: t(c.PLAYER_REGEN_DELAY_MS),
    deathFreeze: t(c.PLAYER_DEATH_FREEZE_MS),
    respawn: t(c.PLAYER_RESPAWN_MS),
    enemyMove: t(c.ENEMY_MOVE_MS),
    enemyMoveDiag: t(c.ENEMY_MOVE_DIAG_MS),
    enemyWindup: t(c.ENEMY_ATK_WINDUP_MS),
    enemyCooldown: t(c.ENEMY_ATK_COOLDOWN_MS),
    enemyAlert: t(c.ENEMY_ALERT_MS),
    enemyLostLos: t(c.ENEMY_LOST_LOS_MS),
    enemyReturnDeaf: t(c.ENEMY_RETURN_DEAF_MS),
    wanderMin: t(c.ENEMY_WANDER_INTERVAL_MIN_MS),
    wanderMax: t(c.ENEMY_WANDER_INTERVAL_MAX_MS),
    enemyRespawn: t(c.ENEMY_RESPAWN_MS),
    telegraphBlink: t(c.TELEGRAPH_BLINK_MS),
    telegraphFastLast: t(c.TELEGRAPH_FAST_LAST_MS),
    telegraphFastBlink: t(c.TELEGRAPH_FAST_BLINK_MS),
    strikeFx: t(c.STRIKE_FX_MS),
    floatText: t(c.FLOAT_TEXT_MS),
    hitFlash: t(c.HIT_FLASH_MS),
    autopauseIdleHit: t(c.AUTOPAUSE_IDLE_HIT_MS),
    tokenStagger: t(c.ATTACK_TOKEN_STAGGER_MS),
    skillBuffer: t(c.SKILL_BUFFER_MS),
    dashIframes: t(c.SK1_DASH_IFRAMES_MS),
    momentum: t(c.SK1_MOMENTUM_WINDOW_MS),
    dashTrail: t(c.SK1_DASH_TRAIL_MS),
    shock: t(c.SK2_SHOCK_MS),
    droneFire: t(c.SK3_DRONE_FIRE_MS),
    droneLife: t(c.SK3_DRONE_LIFE_MS),
  };
}
