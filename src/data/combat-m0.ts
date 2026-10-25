// Combat config – PROG / Gameplay. THE single import point for every combat number.
// Spec: /workspace/GRA/design/mechaniki-m1.md v0.4 (part 1 = M0, part 2 = M1).
//
// - Table 1.14 values are defined ONCE in data/mechanics-m0.ts (M0, shared with the engine)
//   and spread in here – change them there.
// - COMBAT_EXTRAS: only the M1 combat values from table 2.16 implemented so far (all of table
//   1.14 is in data/mechanics-m0.ts, QA-M0-008). Each line names its §.
// - Profiles: COMBAT_M0 (prototype rules, default) and COMBAT_M1 (= M0 + overrides from 2.16).
// Times are ms (multiples of TICK_MS) → ticks via combat/timing.ts (§1.1).
import { M0 } from './mechanics-m0';

export const COMBAT_EXTRAS = {
  // QA-M0-008: every §1.14 row (PLAYER_DEATH_FREEZE_MS, TELEGRAPH_FAST_BLINK_MS, STRIKE_FX_MS,
  // HIT_VIBRATE_MS, MOVE_DEADZONE, ARENA_COLS/ROWS, ENEMY_WINDUP_MIN_MS…) is in
  // data/mechanics-m0.ts and comes in through `...M0` in COMBAT_M0.

  // ---- M1 (§2.16) – off / neutral in the M0 profile -----------------------------------------
  /** §2.6: a step into an enemy becomes a basic attack on it. M0: false, M1: true. */
  BUMP_ATTACK_ENABLED: false,
  /** §2.5 / §2.16 ACTION_TICK_ACCUMULATOR: fractional ticks of speed affixes carry over. */
  ACTION_TICK_ACCUMULATOR: true,
  /** §2.11 / §2.16 DEPTH_HP_MULT, DEPTH_DMG_MULT: index = depth − 1 (not for the boss). */
  DEPTH_HP_MULT: [1.0, 1.5, 2.2] as readonly number[],
  DEPTH_DMG_MULT: [1.0, 1.25, 1.5] as readonly number[],
  /** §2.11 armour: DR = A / (A + ARMOR_DR_K), capped at ARMOR_DR_CAP, result floored, min ARMOR_MIN_DMG. */
  ARMOR_DR_K: 100,
  ARMOR_DR_CAP: 0.6,
  ARMOR_MIN_DMG: 1,
};

export const COMBAT_M0 = { ...M0, ...COMBAT_EXTRAS };

/** §2.16 overrides for M1: no regeneration (§2.13), bump attack on (§2.6). */
export const COMBAT_M1: CombatConfig = {
  ...COMBAT_M0,
  PLAYER_REGEN_PER_S: 0,
  BUMP_ATTACK_ENABLED: true,
};

/** Default profile (the M0 prototype). */
export const COMBAT = COMBAT_M0;

type Widen<T> = {
  readonly [K in keyof T]: T[K] extends number
    ? number
    : T[K] extends boolean
      ? boolean
      : T[K] extends readonly number[]
        ? readonly number[]
        : T[K] extends object
          ? Widen<T[K]>
          : T[K];
};
/** Shape of a combat profile (tests and profiles pass modified copies). */
export type CombatConfig = Widen<typeof COMBAT_M0>;

export const COMBAT_PROFILES = { m0: COMBAT_M0 as CombatConfig, m1: COMBAT_M1 } as const;
export type CombatProfileId = keyof typeof COMBAT_PROFILES;

// ---- Enemy types (§1.4 Scrap Crawler; §2.11 M1 enemies – depth-1 values) --------------------
export interface EnemyTypeDef {
  hp: number;
  dmgMin: number;
  dmgMax: number;
  windupMs: number;
  cooldownMs: number;
  moveMs: number;
  moveDiagMs: number;
  detectRadius: number;
  atkRange: number;
  /** Boss: depth multipliers do not apply (§2.11). */
  ignoresDepth: boolean;
}

export const ENEMY_TYPES = {
  /** M0 enemy (§1.4, §1.6). */
  crawler: {
    hp: M0.ENEMY_HP,
    dmgMin: M0.ENEMY_DMG_MIN,
    dmgMax: M0.ENEMY_DMG_MAX,
    windupMs: M0.ENEMY_ATK_WINDUP_MS,
    cooldownMs: M0.ENEMY_ATK_COOLDOWN_MS,
    moveMs: M0.ENEMY_MOVE_MS,
    moveDiagMs: M0.ENEMY_MOVE_DIAG_MS,
    detectRadius: M0.ENEMY_DETECT_RADIUS,
    atkRange: M0.ENEMY_ATK_RANGE,
    ignoresDepth: false,
  },
  /**
   * §2.11 `d` Panel Drone: fast melee in pairs. PANEL_DRONE_STEP_MS 200 / _WINDUP_MS 400 (§2.16).
   * moveDiagMs 300 is NOT in the spec – assumed ×1.5 like the M0 enemy (question to Mechanics).
   */
  panelDrone: {
    hp: 40,
    dmgMin: 8,
    dmgMax: 12,
    windupMs: 400,
    cooldownMs: 600,
    moveMs: 200,
    moveDiagMs: 300,
    detectRadius: 8,
    atkRange: 1,
    ignoresDepth: false,
  },
} satisfies Record<string, EnemyTypeDef>;
export type EnemyTypeId = keyof typeof ENEMY_TYPES;

// Working EN names (accepted by GD, §1.17). The character is always "Hunter 47" (GD decision).
export const COMBAT_STRINGS = {
  enemyName: 'Scrap Crawler',
  weaponName: 'Shock Baton',
  hunterTitle: 'HUNTER 47',
  signalLost: 'SIGNAL LOST',
  reprinting: 'Reprinting…',
  miss: 'miss',
  kill: '+1 kill',
  alert: '!',
} as const;
