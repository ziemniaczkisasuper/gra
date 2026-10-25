// Parameter names referenced by the FX data (src/data/fx-m1.ts ← graf/assety-m1.md v1.0) and their
// values per design/mechaniki-m1.md v0.5 (25.10.2026). LUZ / Pracownik 4.
// Gameplay owns the real constants (data/combat-m0.ts, data/mechanics-m0.ts) – this file only
// documents what FX names mean, so a renderer hook can resolve string durations, and lists where
// the GRAF document is behind the spec (FX_SPEC_DIFFS, to be fixed in assety-m1.md, not by hand
// in the generated fx-m1.ts).

export type FxParamStatus =
  /** same name and value in mechaniki v0.5 */
  | 'ok'
  /** value matches, spec uses a different name/unit (see specName) */
  | 'renamed'
  /** FX value differs from mechaniki v0.5 */
  | 'stale'
  /** FX-only value (visual timing), not a mechanics constant */
  | 'fxOnly'
  /** not used in M1 (kept for M0) */
  | 'unusedInM1';

export interface FxParamDef {
  /** Value per mechaniki-m1.md v0.5 (ms, cells, % …). */
  value: number | Readonly<Record<string, number>>;
  status: FxParamStatus;
  /** Name in mechaniki-m1.md when it differs from the FX name. */
  specName?: string;
  note?: string;
}

export const FX_PARAMS = {
  // Telegraph (§1.7, §1.14)
  TELEGRAPH_BLINK_MS: { value: 100, status: 'ok' },
  TELEGRAPH_FAST_LAST_MS: { value: 150, status: 'ok' },
  TELEGRAPH_FAST_BLINK_MS: { value: 50, status: 'ok' },
  STRIKE_FX_MS: { value: 100, status: 'ok' },
  HIT_FLASH_MS: { value: 100, status: 'ok' },
  FLOAT_TEXT_MS: { value: 600, status: 'ok' },
  ENEMY_ALERT_MS: { value: 300, status: 'ok' },
  windupMs: {
    value: { s: 450, d: 450, c_M0: 500, h: 600, t: 700, bossSwing: 800, bossCharge: 900 },
    status: 'stale',
    note: 'v0.5 GD rule ENEMY_WINDUP_MIN_MS = 450: Scrapper and Panel Drone 400 → 450 (also boss-summoned drones). FX has 400 and a "400" timeline.',
  },
  // Player death (§2.7 pt 3, Z6)
  PLAYER_DEATH_FREEZE_MS: { value: 500, status: 'ok' },
  PLAYER_RESPAWN_MS: {
    value: 3000,
    status: 'unusedInM1',
    note: 'M0 only. M1 death screen: DEATH_SCREEN_MIN_MS 1500 (no skip), DEATH_SCREEN_AUTO_MS 5000 (auto).',
  },
  DEATH_SCREEN_MIN_MS: { value: 1500, status: 'ok', note: 'v0.5, not referenced by FX yet' },
  DEATH_SCREEN_AUTO_MS: { value: 5000, status: 'ok', note: 'v0.5, not referenced by FX yet' },
  // Skills (§2.5, §2.16)
  SK1_DASH_RANGE: { value: 3, status: 'ok' },
  SK1_DASH_IFRAMES_MS: { value: 200, status: 'ok' },
  SK1_DASH_COOLDOWN_MS: { value: 4000, status: 'ok' },
  trailMs: { value: 150, status: 'fxOnly', note: 'Dash trail 150 ms (§2.5 text)' },
  SK2_PULSE_WINDUP_MS: { value: 150, status: 'ok' },
  SK2_PULSE_RADIUS: { value: 2, status: 'ok' },
  SK2_SHOCK_MS: { value: 2000, status: 'ok' },
  ringMs: { value: 150, status: 'fxOnly', note: 'Shock Pulse flash 150 ms (§2.5 text)' },
  SK3_DRONE_WINDUP_MS: { value: 200, status: 'ok' },
  SK3_DRONE_FIRE_MS: { value: 500, status: 'ok' },
  SK3_DRONE_LIFE_MS: { value: 8000, status: 'ok' },
  SK3_DRONE_TAUNT_RADIUS: { value: 4, status: 'ok' },
  SK3_DRONE_RANGE: { value: 5, status: 'ok' },
  SK3_DRONE_HP: { value: 40, status: 'ok' },
  // Evacuation (§2.9, §2.16) – spec stores seconds
  EVAC_CALL_HOLD_MS: { value: 1500, status: 'ok' },
  EVAC_ARRIVE_MS: {
    value: { 1: 5000, 2: 7000, 3: 9000 },
    status: 'renamed',
    specName: 'EVAC_ARRIVE_S (5 / 7 / 9 s)',
  },
  EVAC_HOLD_MS: { value: 10000, status: 'renamed', specName: 'EVAC_HOLD_S (10 s)' },
  EVAC_RECALL_COOLDOWN_MS: {
    value: 15000,
    status: 'renamed',
    specName: 'EVAC_RECALL_COOLDOWN_S (15 s)',
  },
  EVAC_ALERT_RADIUS: { value: 12, status: 'ok' },
  // Boss Rail Guardian (§2.11, §2.16, Z12, Z13)
  BOSS_MOVE_MS: {
    value: 300,
    status: 'renamed',
    specName: '§2.11 table "ruch 300 ms" (no constant)',
  },
  BOSS_SWING_WINDUP_MS: { value: 800, status: 'ok' },
  BOSS_SWING_RECOVERY_MS: {
    value: 1200,
    status: 'stale',
    note: 'v0.5 (Balance): 800 / 1200 ms. FX has 900 (param + swingRecovery state 900 ms).',
  },
  BOSS_CHARGE_EVERY: { value: 4, status: 'ok' },
  BOSS_CHARGE_WINDUP_MS: { value: 900, status: 'ok' },
  BOSS_CHARGE_TICKS_PER_CELL: {
    value: 2,
    status: 'stale',
    note: 'Z12: 2 ticks (100 ms) per cell. FX "charge" state loops one 50 ms frame (1 cell / tick).',
  },
  BOSS_STUN_MS: {
    value: 2000,
    status: 'renamed',
    specName: '§2.11 text "2 s ogłuszenia" (no constant)',
  },
  BOSS_SUMMON_AT_HP_PCT: { value: 50, status: 'renamed', specName: 'BOSS_SUMMON_HP_PCT' },
  BOSS_SUMMON_MS: {
    value: 600,
    status: 'ok',
    note: 'Z13: GRAF value accepted; no "!"; boss vulnerable',
  },
  SUMMON_ACTIVATE_MS: {
    value: 500,
    status: 'ok',
    note: 'v0.5: drones stand 500 ms with grey ALERT 300 ms',
  },
  ENEMY_RESPAWN_IN_LEVEL: {
    value: 0,
    status: 'ok',
    note: 'false in M1 (Z5) – no enemy-respawn FX exists',
  },
} as const satisfies Record<string, FxParamDef>;

export type FxParamName = keyof typeof FX_PARAMS;

/**
 * Non-numeric duration keywords used by FX (`durationMs` / frame `ms`). Resolved by the
 * renderer hook from game state, not from constants.
 */
export const FX_DURATION_KEYWORDS = {
  durationMs: 'the effect/track durationMs',
  untilNextState: 'hold until the object changes state',
  untilWallHit: 'boss charge: until chargeWallHit',
  untilOpened: 'until the shaft/gate opens (fx_evac_shaft)',
  attackWindupMs: 'wind-up of the attacker (windupMs by enemy type)',
  SK3_DRONE_LIFE_MS: 'FX_PARAMS.SK3_DRONE_LIFE_MS',
  'EVAC_ARRIVE_MS[depth]': 'FX_PARAMS.EVAC_ARRIVE_MS by depth',
} as const;

/** Where assety-m1.md v1.0 is behind mechaniki-m1.md v0.5 – for GRAF / Assety (field → is → should). */
export const FX_SPEC_DIFFS: readonly {
  field: string;
  is: string;
  should: string;
  source: string;
}[] = [
  {
    field: 'fx_telegraph.params.windupMs.s / .d (+ timeline "400")',
    is: '400 ms, timeline "400"',
    should: '450 ms, timeline "450" (9 ticks)',
    source: 'v0.5 ENEMY_WINDUP_MIN_MS 450; §2.11 Panel Drone / Scrapper 450 / 600 ms',
  },
  {
    field:
      'fx_boss_rail_guardian.params.BOSS_SWING_RECOVERY_MS + states.swingRecovery.durationMs/frames',
    is: '900 ms',
    should: '1200 ms',
    source: '§2.16 BOSS_SWING_WINDUP_MS / _RECOVERY_MS 800 / 1200 (Balance v0.5)',
  },
  {
    field: 'fx_boss_rail_guardian.states.charge.frames[0].ms (+ params)',
    is: '50 ms (1 cell per tick, §14 Z12 "1 pole na tick")',
    should: '100 ms per cell; add BOSS_CHARGE_TICKS_PER_CELL: 2 to params',
    source: 'Z12: BOSS_CHARGE_TICKS_PER_CELL = 2 (100 ms/pole)',
  },
  {
    field: 'fx_boss_rail_guardian.states.chargeTelegraph / charge – lane width',
    is: '"pas, który przejedzie bryła 3×2" (width not stated)',
    should:
      '2 cells (horizontal charge) / 3 cells (vertical), boss → end wall; marked for the whole 900 ms wind-up AND the whole ride (charge note says the x zone fades on chargeStart)',
    source: 'Z12 "Pas szarży"',
  },
  {
    field: 'fx_boss_rail_guardian.params.BOSS_SUMMON_AT_HP_PCT',
    is: 'BOSS_SUMMON_AT_HP_PCT',
    should: 'BOSS_SUMMON_HP_PCT (value 50 ok); add BOSS_SUMMON_MS 600, SUMMON_ACTIVATE_MS 500',
    source: '§2.16',
  },
  {
    field: 'fx_boss_rail_guardian.states.summon',
    is: '600 ms |R|, no "!" – OK; spawnCells "·" 600 ms then d entities',
    should:
      'OK. Add: summoned drones stand 500 ms (SUMMON_ACTIVATE_MS) with grey ALERT "!" 300 ms (fx_alert), their blows 450 ms wind-up (timeline "450")',
    source: 'Z13',
  },
  {
    field: 'fx_death_screen.durationMs / frames[0].ms / params',
    is: '3000 ms fixed (PLAYER_RESPAWN_MS), only M1_BASE_04',
    should:
      'min 1500 ms (DEATH_SCREEN_MIN_MS, no skip), then CONTINUE; auto at 5000 ms (DEATH_SCREEN_AUTO_MS); lines M1_BASE_04 + M1_DEATH_01 (killer) + M1_DEATH_02 (3 last hits)',
    source: 'Z6, §2.7 pt 3',
  },
  {
    field: 'fx_death_player (500 ms freeze)',
    is: 'player flash → corpse; killer not marked',
    should:
      'durations OK (500 ms); add killer highlight during the freeze ("Zabójca jest podświetlony (wygląd: GRAF)")',
    source: 'Z6, §2.7 pt 3.1',
  },
  {
    field: 'fx_evac_shaft.params EVAC_ARRIVE_MS / EVAC_HOLD_MS / EVAC_RECALL_COOLDOWN_MS',
    is: 'ms names',
    should: 'spec names EVAC_ARRIVE_S / EVAC_HOLD_S / EVAC_RECALL_COOLDOWN_S (values equal)',
    source: '§2.16',
  },
];
