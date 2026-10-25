// Parameter names referenced by the FX data (src/data/fx-m1.ts ← graf/assety-m1.md v1.1) and their
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
  ENEMY_WINDUP_MIN_MS: { value: 450, status: 'ok', note: 'GD rule: wind-up − 1 tick ≥ 400 ms' },
  windupMs: {
    value: {
      s: 450,
      d: 450,
      bossSummonedD: 450,
      c_M0: 500,
      h: 600,
      t: 700,
      bossSwing: 800,
      bossCharge: 900,
    },
    status: 'ok',
    specName: '§2.11 enemy table + §2.16 BOSS_*_WINDUP_MS (per enemy type)',
  },
  // Player death (§2.7 pt 3, Z6)
  PLAYER_DEATH_FREEZE_MS: { value: 500, status: 'ok' },
  PLAYER_RESPAWN_MS: {
    value: 3000,
    status: 'unusedInM1',
    note: 'M0 only; no longer referenced by FX (v1.1). M1: DEATH_SCREEN_MIN_MS / DEATH_SCREEN_AUTO_MS.',
  },
  DEATH_SCREEN_MIN_MS: { value: 1500, status: 'ok', note: 'fx_death_screen phase "locked"' },
  DEATH_SCREEN_AUTO_MS: {
    value: 5000,
    status: 'ok',
    note: 'fx_death_screen total (locked 1500 + continue 3500)',
  },
  PRINT_ANIM_MS: { value: 600, status: 'ok', note: 'fx_base_print' },
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
  // Evacuation and lift (§2.9, §2.16) – EVAC_*_S are seconds like the spec; frame ms = S × 1000
  EVAC_CALL_HOLD_MS: { value: 1500, status: 'ok', note: 'R6 proposal (1.0 s) waits for GD – S15' },
  EVAC_ARRIVE_S: { value: { 1: 5, 2: 7, 3: 9 }, status: 'ok' },
  EVAC_HOLD_S: { value: 10, status: 'ok', note: 'state "open" 10000 ms' },
  EVAC_RECALL_COOLDOWN_S: {
    value: 15,
    status: 'ok',
    note: 'state "departed" 15000 ms; R6: 5 s – S15',
  },
  EVAC_ALERT_RADIUS: { value: 12, status: 'ok' },
  LIFT_DEPART_MS: {
    value: 1000,
    status: 'ok',
    note: 'fx_evac_shaft.states.evacuated 1000 ms (was 400)',
  },
  LIFT_RIDE_MS: { value: 2000, status: 'ok', note: 'fx_screen_to_base 2000 ms, M1_BASE_05' },
  LIFT_RIDE_SKIP_AFTER_MS: {
    value: 500,
    status: 'ok',
    note: 'tap skips the ride (down to base only)',
  },
  // Boss Rail Guardian (§2.11, §2.16, Z12, Z13)
  BOSS_MOVE_MS: {
    value: 300,
    status: 'renamed',
    specName: '§2.11 table "ruch 300 ms" (no constant)',
  },
  BOSS_SWING_WINDUP_MS: { value: 800, status: 'ok' },
  BOSS_SWING_RECOVERY_MS: {
    value: 1200,
    status: 'renamed',
    specName: 'BOSS_SWING_WINDUP_MS / _RECOVERY_MS 800 / 1200',
  },
  BOSS_CHARGE_EVERY: { value: 4, status: 'ok' },
  BOSS_CHARGE_WINDUP_MS: { value: 900, status: 'ok' },
  BOSS_CHARGE_TICKS_PER_CELL: { value: 2, status: 'ok', note: 'Z12; charge frame 100 ms per cell' },
  BOSS_CHARGE_MS_PER_CELL: {
    value: 100,
    status: 'fxOnly',
    note: 'derived: BOSS_CHARGE_TICKS_PER_CELL × TICK_MS',
  },
  BOSS_CHARGE_MAX_MS_28_CELLS: {
    value: 2800,
    status: 'fxOnly',
    note: 'derived: 28-cell rail × 100 ms (§2.11 "maks. 2,8 s")',
  },
  BOSS_STUN_MS: {
    value: 2000,
    status: 'renamed',
    specName: '§2.11 text "2 s ogłuszenia" (no constant)',
  },
  BOSS_SUMMON_HP_PCT: { value: 50, status: 'ok' },
  BOSS_SUMMON_MS: {
    value: 600,
    status: 'ok',
    note: 'Z13: no "!", boss vulnerable, not interruptible',
  },
  SUMMON_COUNT: { value: 2, status: 'ok' },
  SUMMON_MIN_DIST_PLAYER: { value: 4, status: 'ok' },
  SUMMON_ACTIVATE_MS: {
    value: 500,
    status: 'ok',
    note: 'part "activation": drones stand 500 ms + grey ALERT 300 ms',
  },
  SUMMONED_D_WINDUP_MS: {
    value: 450,
    status: 'renamed',
    specName: '§2.11 text (= ENEMY_WINDUP_MIN_MS 450)',
  },
  ENEMY_RESPAWN_IN_LEVEL: {
    value: 0,
    status: 'ok',
    note: 'false in M1 (Z5) – no enemy-respawn FX exists',
  },
  // Not a parameter: prose note the document keeps inside `params` (fx_evac_shaft).
  unitNote: { value: 0, status: 'fxOnly', note: 'text "EVAC_*_S w sekundach…", not a number' },
} as const satisfies Record<string, FxParamDef>;

export type FxParamName = keyof typeof FX_PARAMS;

/**
 * Non-numeric duration keywords used by FX (`durationMs` / frame `ms`). Resolved by the
 * renderer hook from game state or FX_PARAMS, not stored as numbers.
 */
export const FX_DURATION_KEYWORDS = {
  durationMs: 'the effect/track durationMs',
  untilNextState: 'hold until the object changes state',
  untilWallHit: 'boss charge: until chargeWallHit',
  'untilWallHit (maks. ok. 2800 ms przy torze 28 pól)':
    'same as untilWallHit (document keeps prose in the field; max BOSS_CHARGE_MAX_MS_28_CELLS)',
  untilOpened: 'until the shaft/gate opens (fx_evac_shaft)',
  attackWindupMs: 'wind-up of the attacker (windupMs by enemy type)',
  SK3_DRONE_LIFE_MS: 'FX_PARAMS.SK3_DRONE_LIFE_MS',
  'EVAC_ARRIVE_S[depth] × 1000':
    'FX_PARAMS.EVAC_ARRIVE_S[depth] seconds × 1000 → ms (state "arriving")',
} as const;

/** Resolves a numeric duration keyword (ms) where possible; null = runtime-driven (state change, wall hit …). */
export function resolveFxDurationMs(key: string, ctx: { depth?: 1 | 2 | 3 } = {}): number | null {
  if (key === 'SK3_DRONE_LIFE_MS') return FX_PARAMS.SK3_DRONE_LIFE_MS.value;
  if (key === 'EVAC_ARRIVE_S[depth] × 1000')
    return FX_PARAMS.EVAC_ARRIVE_S.value[ctx.depth ?? 1] * 1000;
  return null;
}

/**
 * Where assety-m1.md (v1.1) is still behind mechaniki-m1.md v0.5 – for GRAF / Assety
 * (field → is → should). v1.1: all value differences resolved; only format nits remain.
 */
export const FX_SPEC_DIFFS: readonly {
  field: string;
  is: string;
  should: string;
  source: string;
}[] = [
  {
    field: 'fx_boss_rail_guardian.states.charge.durationMs',
    is: '"untilWallHit (maks. ok. 2800 ms przy torze 28 pól)" (prose inside a duration field)',
    should:
      '"untilWallHit" + the comment in `note` (value correct; format only, for a machine-readable keyword)',
    source: 'graf-fx/1 format (assety-m1.md §0)',
  },
  {
    field: 'fx_evac_shaft.params.unitNote',
    is: 'text inside `params`',
    should: 'move to `note` (params = numbers from mechanics)',
    source: 'assety-m1.md §0 ("params – liczby z mechaniki")',
  },
];
