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
  /** §2.11 armour (player only): DR = A / (A + ARMOR_DR_K), cap ARMOR_DR_CAP, floor, min ARMOR_MIN_DMG. */
  ARMOR_DR_K: 100,
  ARMOR_DR_CAP: 0.6,
  ARMOR_MIN_DMG: 1,
  /** Mechanika 25.10 (6): in M1 enemies do not respawn during a level. M0: true. */
  ENEMY_RESPAWN_ENABLED: true,
  /** §2.5 skills on the sk1..3 slots. M0: false (slots hidden), M1: true. */
  SKILLS_ENABLED: false,
  /** §2.10 attack tokens. M0: false (one enemy), M1: true. */
  ATTACK_TOKENS_ENABLED: false,
  ATTACK_TOKENS_MELEE: 2,
  ATTACK_TOKENS_RANGED: 1,
  ATTACK_TOKEN_STAGGER_MS: 150,
  DRONE_ATTACK_TOKENS: 2,
  /** §2.10: an enemy without a token approaches to at most this distance and waits. */
  TOKEN_WAIT_DIST: 2,
  /** §2.5 skill buffer (like ATK). */
  SKILL_BUFFER_MS: 150,

  // §2.5 sk1 Dash
  SK1_DASH_RANGE: 3,
  SK1_DASH_IFRAMES_MS: 200,
  SK1_DASH_COOLDOWN_MS: 4000,
  SK1_MOMENTUM_WINDOW_MS: 1500,
  SK1_MOMENTUM_BONUS: 0.5,
  /** Dash trail '·' on the passed cells. */
  SK1_DASH_TRAIL_MS: 150,
  // §2.5 sk2 Shock Pulse
  SK2_PULSE_RADIUS: 2,
  SK2_PULSE_DMG_MIN: 15,
  SK2_PULSE_DMG_MAX: 20,
  SK2_PULSE_WINDUP_MS: 150,
  SK2_PULSE_COOLDOWN_MS: 8000,
  SK2_SHOCK_MS: 2000,
  /** ROBOCZE: "ruch −50%" read as step time ×2 (speed halved) – question to Mechanics. */
  SK2_SHOCK_MOVE_TIME_MULT: 2,
  // §2.5 sk3 Buddy Drone
  SK3_DRONE_HP: 40,
  SK3_DRONE_DMG_MIN: 5,
  SK3_DRONE_DMG_MAX: 7,
  /** Drone shots ×2 on targets with the Shock tag. */
  SK3_DRONE_SHOCK_MULT: 2,
  SK3_DRONE_FIRE_MS: 500,
  SK3_DRONE_RANGE: 5,
  SK3_DRONE_TAUNT_RADIUS: 4,
  SK3_DRONE_LIFE_MS: 8000,
  SK3_DRONE_WINDUP_MS: 200,
  SK3_DRONE_COOLDOWN_MS: 18000,
  /** §2.10 DRONE_FIELD_RADIUS: distance map around the drone, computed once at placement. */
  DRONE_FIELD_RADIUS: 6,
  /** ROBOCZE (not in spec): an idle enemy that detects the player wakes idle enemies of the same
   *  type within this radius that see it (Scrapper groups 2–4, Panel Drone pairs). 0 = off. */
  ENEMY_GROUP_ALERT_RADIUS: 4,
  /** §2.4 v0.5: contract enemies drop no loot (0 Scrap, 0 items, 0 kr). Combat only flags them
   *  ('contract' on EnemyCombat / enemyKilled); loot is rolled by LUZ. */
  CONTRACT_ENEMY_LOOT: 0,
  /** §2.7 / §2.16 v0.5 M1 death screen (drawn by UI / LUZ): no skip before MIN, auto-continue
   *  at AUTO. Kept here with the death timers; M0 keeps SIGNAL LOST + PLAYER_RESPAWN_MS. */
  DEATH_SCREEN_MIN_MS: 1500,
  DEATH_SCREEN_AUTO_MS: 5000,
};

/** §2.9 lift shaft tile: impassable for enemies and the drone; a player standing on it is in
 *  the cabin (invulnerable, out of the combat simulation). Opening / level exit = Silnik / LUZ. */
export const EVAC_TILE = '<';

export const COMBAT_M0 = { ...M0, ...COMBAT_EXTRAS };

/** §2.16 overrides for M1: no regeneration (§2.13), bump attack on (§2.6). */
export const COMBAT_M1: CombatConfig = {
  ...COMBAT_M0,
  PLAYER_REGEN_PER_S: 0,
  BUMP_ATTACK_ENABLED: true,
  SKILLS_ENABLED: true,
  ATTACK_TOKENS_ENABLED: true,
  /** §2.11 v0.5 (GD, Z5): no enemy respawn during an M1 level (ENEMY_RESPAWN_IN_LEVEL false). */
  ENEMY_RESPAWN_ENABLED: false,
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

// ---- Enemy types (§1.4 Scrap Crawler; §2.11 M1 enemies, depth-1 values; balans-m1.md §2) ------
// [P] = value from mechaniki-m1.md v0.4 / balans-m1.md v1.0, [GD] = GD/Mechanika decision 25.10,
// [R] = ROBOCZE (working value, not in any document).
export interface EnemyTypeDef {
  hp: number;
  dmgMin: number;
  dmgMax: number;
  windupMs: number;
  cooldownMs: number;
  /** 0 = static (turret). */
  moveMs: number;
  moveDiagMs: number;
  detectRadius: number;
  atkRange: number;
  /** 'ranged': hitscan at the frozen cell, needs line of sight, uses the ranged token. */
  attack: 'melee' | 'ranged';
  /** Boss: depth multipliers do not apply (§2.11). */
  ignoresDepth: boolean;
  /** ENEMY_GROUP_ALERT_RADIUS applies (groups / pairs). */
  groupAlert: boolean;
}

export const ENEMY_TYPES = {
  /** M0 enemy (§1.4, §1.6) [P]. In M1 replaced by Curfew Guard (GRAF: 'c' is M0-only). */
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
    attack: 'melee',
    ignoresDepth: false,
    groupAlert: false,
  },
  /** `d` M1_ENEMY_01 Panel Drone – fast melee, pairs. HP/dmg/cd/move [P]; wind-up 450 [GD
   *  "wind-up − 1 tick ≥ 400 ms", was 400]; diagonal 300 [GD]. */
  panelDrone: {
    hp: 40,
    dmgMin: 8,
    dmgMax: 12,
    windupMs: 450,
    cooldownMs: 600,
    moveMs: 200,
    moveDiagMs: 300,
    detectRadius: 8,
    atkRange: 1,
    attack: 'melee',
    ignoresDepth: false,
    groupAlert: true,
  },
  /** `h` M1_ENEMY_02 Curfew Guard – heavy melee [P]; diagonal 400 [R] (×1.6, tick grid). */
  curfewGuard: {
    hp: 120,
    dmgMin: 14,
    dmgMax: 20,
    windupMs: 600,
    cooldownMs: 900,
    moveMs: 250,
    moveDiagMs: 400,
    detectRadius: 7,
    atkRange: 1,
    attack: 'melee',
    ignoresDepth: false,
    groupAlert: false,
  },
  /** `s` M1_ENEMY_03 Scrapper – weak, groups 2–4, takes NO loot in M1 (§2.8) [P]; wind-up 450
   *  [GD, was 400]; diagonal 300 [R]. */
  scrapper: {
    hp: 30,
    dmgMin: 4,
    dmgMax: 6,
    windupMs: 450,
    cooldownMs: 600,
    moveMs: 200,
    moveDiagMs: 300,
    detectRadius: 7,
    atkRange: 1,
    attack: 'melee',
    ignoresDepth: false,
    groupAlert: true,
  },
  /** `t` M1_ENEMY_04 Line Sentry – static turret, range 6 + LOS, shoots the frozen cell [P]. */
  lineSentry: {
    hp: 70,
    dmgMin: 10,
    dmgMax: 15,
    windupMs: 700,
    cooldownMs: 1500,
    moveMs: 0,
    moveDiagMs: 0,
    detectRadius: 7,
    atkRange: 6,
    attack: 'ranged',
    ignoresDepth: false,
    groupAlert: false,
  },
} satisfies Record<string, EnemyTypeDef>;
export type EnemyTypeId = keyof typeof ENEMY_TYPES;

// ---- Skills (§2.5). Slots point at skill ids; definitions here (swappable, tags not names). --
export type SkillId = 'dash' | 'shockPulse' | 'buddyDrone';
export interface SkillDef {
  /** Text id for UI (fabula/teksty-m1-en.md) and the working EN name (single source in code). */
  nameId: string;
  name: string;
  windupMs: number;
  cooldownMs: number;
}
/** Mechanika 25.10 (1): final name Buddy Drone (M1_SKILL_03_NAME); the id stays 'buddyDrone'. */
export const BUDDY_DRONE_NAME = 'Buddy Drone';
export const SKILLS: Record<SkillId, SkillDef> = {
  dash: {
    nameId: 'M1_SKILL_01_NAME',
    name: 'Dash',
    windupMs: 0,
    cooldownMs: COMBAT_EXTRAS.SK1_DASH_COOLDOWN_MS,
  },
  shockPulse: {
    nameId: 'M1_SKILL_02_NAME',
    name: 'Shock Pulse',
    windupMs: COMBAT_EXTRAS.SK2_PULSE_WINDUP_MS,
    cooldownMs: COMBAT_EXTRAS.SK2_PULSE_COOLDOWN_MS,
  },
  buddyDrone: {
    nameId: 'M1_SKILL_03_NAME',
    name: BUDDY_DRONE_NAME,
    windupMs: COMBAT_EXTRAS.SK3_DRONE_WINDUP_MS,
    cooldownMs: COMBAT_EXTRAS.SK3_DRONE_COOLDOWN_MS,
  },
};
export const SKILL_IDS: readonly SkillId[] = ['dash', 'shockPulse', 'buddyDrone'];
/** Default loadout of sk1..sk3 (§2.5: fixed slots in M1). */
export const DEFAULT_SKILL_SLOTS: readonly (SkillId | null)[] = [
  'dash',
  'shockPulse',
  'buddyDrone',
];

// Working EN names (accepted by GD, §1.17). The character is always "Hunter 47" (GD decision).
export const COMBAT_STRINGS = {
  enemyName: 'Scrap Crawler',
  weaponName: 'Shock Baton',
  hunterTitle: 'HUNTER 47',
  signalLost: 'SIGNAL LOST',
  reprinting: 'Reprinting…',
  miss: 'miss',
  kill: '+1 kill',
} as const;

// ---- Boss Rail Guardian (§2.11 v0.5, §2.16; balans-m1.md). DATA ONLY – not implemented yet. ---
/** Values kept in data for Balans steering; the boss AI is the next PROG / Gameplay round. */
export const RAIL_GUARDIAN = {
  /** 3×2 body; M1_BOSS_01. */
  BOSS_W: 3,
  BOSS_H: 2,
  BOSS_HP: 2400,
  BOSS_DMG_MIN: 20,
  BOSS_DMG_MAX: 32,
  /** No depth multiplier (§2.11). */
  BOSS_IGNORES_DEPTH: true,
  BOSS_MOVE_MS: 300,
  BOSS_SWING_WINDUP_MS: 800,
  BOSS_SWING_RECOVERY_MS: 1200,
  BOSS_CHARGE_EVERY: 4,
  BOSS_CHARGE_WINDUP_MS: 900,
  BOSS_CHARGE_TICKS_PER_CELL: 2,
  /** Charge lane width: 2 cells (horizontal charge), 3 (vertical); player hit once. */
  BOSS_CHARGE_LANE_H: 2,
  BOSS_CHARGE_LANE_V: 3,
  BOSS_STUN_MS: 2000,
  BOSS_WEAKPOINT_MULT: 2,
  BOSS_SUMMON_HP_PCT: 50,
  /** Boss stands, takes normal damage, cannot be interrupted, no '!'. */
  BOSS_SUMMON_MS: 600,
  SUMMON_COUNT: 2,
  SUMMON_TYPE: 'panelDrone' as EnemyTypeId,
  /** Summons use depth-3 multipliers, no loot, no respawn. */
  SUMMON_DEPTH: 3,
  SUMMON_RADIUS: 3,
  SUMMON_MIN_DIST_PLAYER: 4,
  SUMMON_ACTIVATE_MS: 500,
  SUMMON_ALERT_MS: 300,
  BOSS_MELEE_TOKENS: 1,
} as const;
