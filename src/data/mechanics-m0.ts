// Tunables from /workspace/GRA/design/mechaniki-m1.md, table 1.14 (DESIGN / Mechaniki,
// draft v0.1). Times in ms (multiples of TICK_MS), converted with msToTicks().
// Engine uses: TICK_MS, movement, INPUT_TAP_BUFFER_MS, DIAG_GRACE_MS, AUTOPAUSE_IDLE_MS.
// Combat/AI values are here so the whole table lives in one data file – implemented by Gameplay.

export const TICK_MS = 50;

/** ms → whole ticks (min 1), as specified in mechaniki 1.1. */
export const msToTicks = (ms: number, tickMs: number = TICK_MS): number =>
  Math.max(1, Math.round(ms / tickMs));

export const M0 = {
  TICK_MS,
  /** Max sim steps per rendered frame (engine; backlog beyond this is dropped). */
  MAX_STEPS_PER_FRAME: 5,

  // Player
  PLAYER_HP: 100,
  PLAYER_MOVE_MS: 150,
  PLAYER_MOVE_DIAG_MS: 200,
  DIAG_GRACE_MS: 50,
  PLAYER_ATK_RANGE: 1,
  PLAYER_ATK_WINDUP_MS: 100,
  PLAYER_ATK_COOLDOWN_MS: 300,
  PLAYER_DMG_MIN: 8,
  PLAYER_DMG_MAX: 12,
  PLAYER_CRIT_CHANCE: 0.1,
  PLAYER_CRIT_MULT: 1.5,
  PLAYER_REGEN_DELAY_MS: 5000,
  PLAYER_REGEN_PER_S: 5,
  PLAYER_RESPAWN_MS: 3000,
  PLAYER_IFRAMES_ON_HIT_MS: 0,

  // Input
  /** Short taps stay active for this long (2 ticks) so they are not lost between ticks. */
  INPUT_TAP_BUFFER_MS: 100,
  /** ATK pressed in the last 150 ms of cooldown is queued – COMBAT (Gameplay) implements it. */
  ATK_QUEUE_MS: 150,

  // Enemy (Scrap Crawler)
  ENEMY_HP: 80,
  ENEMY_MOVE_MS: 200,
  ENEMY_MOVE_DIAG_MS: 300,
  ENEMY_ATK_RANGE: 1,
  ENEMY_ATK_WINDUP_MS: 500,
  ENEMY_ATK_COOLDOWN_MS: 700,
  ENEMY_DMG_MIN: 12,
  ENEMY_DMG_MAX: 18,
  TELEGRAPH_BLINK_MS: 100,
  TELEGRAPH_FAST_LAST_MS: 150,
  ENEMY_DETECT_RADIUS: 7,
  ENEMY_ALERT_MS: 300,
  ENEMY_LEASH_RADIUS: 12,
  ENEMY_LOST_LOS_MS: 3000,
  ENEMY_RETURN_DEAF_MS: 1000,
  ENEMY_PATH_RADIUS: 20,
  ENEMY_WANDER_INTERVAL_MIN_MS: 2000,
  ENEMY_WANDER_INTERVAL_MAX_MS: 4000,
  ENEMY_WANDER_RADIUS: 3,
  ENEMY_RESPAWN_MS: 5000,
  ENEMY_RESPAWN_MIN_DIST: 8,

  // Pause
  AUTOPAUSE_IDLE_HIT_MS: 2000,
  AUTOPAUSE_IDLE_MS: 60000,
  RESUME_COUNTDOWN_MS: 1000,
  RESUME_IFRAMES_MS: 0,

  // Feedback
  FLOAT_TEXT_MS: 600,
  HIT_FLASH_MS: 100,

  // View (minimum visible cells around the player)
  VIEW_MIN_LANDSCAPE: { cols: 31, rows: 17 },
  VIEW_MIN_PORTRAIT: { cols: 17, rows: 21 },
} as const;
