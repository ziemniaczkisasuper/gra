// Tunables from /workspace/GRA/design/mechaniki-m1.md, table 1.14 (DESIGN / Mechaniki, v0.5).
// QA-M0-008: EVERY row of table 1.14 lives here (single data file); data/combat-m0.ts spreads M0
// into the combat profiles (re-export) and holds only M1 values (table 2.16).
// Times in ms (multiples of TICK_MS), converted with msToTicks().
// Engine uses: TICK_MS, movement, INPUT_TAP_BUFFER_MS, DIAG_GRACE_MS, MOVE_DEADZONE,
// AIM_DEADZONE, AUTOPAUSE_*.
// Combat/AI values are implemented by Gameplay.

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
  /** §1.8: world freeze before the SIGNAL LOST overlay. */
  PLAYER_DEATH_FREEZE_MS: 500,

  // Input
  /** Short taps stay active for this long (2 ticks) so they are not lost between ticks. */
  INPUT_TAP_BUFFER_MS: 100,
  /** ATK pressed in the last 150 ms of cooldown is queued – COMBAT (Gameplay) implements it. */
  ATK_QUEUE_MS: 150,
  /** Move vectors shorter than this are "no direction" (toDir8). Safety net against analog
   *  noise – the joystick dead zone itself (15%) is UI's. */
  MOVE_DEADZONE: 0.15,
  /** Aim-stick vectors shorter than this are not a direction and do not fire (twin-stick). */
  AIM_DEADZONE: 0.35,

  // Enemy (Scrap Crawler)
  ENEMY_HP: 80,
  ENEMY_MOVE_MS: 200,
  ENEMY_MOVE_DIAG_MS: 300,
  ENEMY_ATK_RANGE: 1,
  ENEMY_ATK_WINDUP_MS: 500,
  /** GD rule (v0.5): every enemy wind-up − 1 tick ≥ 400 ms → min 450 ms; not shortened by depth. */
  ENEMY_WINDUP_MIN_MS: 450,
  ENEMY_ATK_COOLDOWN_MS: 700,
  ENEMY_DMG_MIN: 12,
  ENEMY_DMG_MAX: 18,
  TELEGRAPH_BLINK_MS: 100,
  TELEGRAPH_FAST_LAST_MS: 150,
  /** §1.7 pt 4: fast blink period during the last TELEGRAPH_FAST_LAST_MS. */
  TELEGRAPH_FAST_BLINK_MS: 50,
  /** §1.7 pt 5: strike marker '*' on the target cell. */
  STRIKE_FX_MS: 100,
  /** §1.7 pt 5: optional vibration on player hit (UI decides whether to use it). */
  HIT_VIBRATE_MS: 20,
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
  /** §1.10 ARENA_SIZE: test arena in cells (checked against data/maps ARENA_M0 by a test). */
  ARENA_COLS: 40,
  ARENA_ROWS: 20,
} as const;
