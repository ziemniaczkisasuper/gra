// Parameter names referenced by the FX data (src/data/fx-m1.ts ← graf/assety-m1.md v1.5) and their
// values per design/mechaniki-m1.md v0.5.2 (25.10.2026, incl. the §2.16 table fix for R6 A). LUZ / Pracownik 4.
// Gameplay owns the real constants (data/combat-m0.ts, data/mechanics-m0.ts) – this file only
// documents what FX names mean, so a renderer hook can resolve string durations, and lists where
// the GRAF document is behind the spec (FX_SPEC_DIFFS, to be fixed in assety-m1.md, not by hand
// in the generated fx-m1.ts).

import { COMBAT_EXTRAS } from './combat-m0';

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
  | 'unusedInM1'
  /** follows a Game Director decision; the spec table (§2.16) still has the old value – S16 */
  | 'gdDecisionSpecStale'
  /** value from the GRAF data for a feature that waits for Mechaniki (not in the current spec) */
  | 'pendingMechanics';

export interface FxParamDef {
  /** Value per mechaniki-m1.md v0.5.2 / GD decisions (ms, cells, % …, or a text enum). */
  value: number | string | boolean | Readonly<Record<string, number>>;
  /** Allowed values of a text enum parameter (e.g. EVAC_ALERT_MOMENT). */
  allowed?: readonly string[];
  /** Old value still in the spec table (status gdDecisionSpecStale). */
  specValue?: number | string;
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
  /** Single source: data/combat-m0.ts (Gameplay). */
  DEATH_SCREEN_MIN_MS: {
    value: COMBAT_EXTRAS.DEATH_SCREEN_MIN_MS,
    status: 'ok',
    note: 'fx_death_screen phase "locked"; NEXT = tap / Enter only, new press (edge) after MIN (v1.3 input)',
  },
  /** Single source: data/combat-m0.ts (Gameplay). */
  DEATH_SCREEN_AUTO_MS: {
    value: COMBAT_EXTRAS.DEATH_SCREEN_AUTO_MS,
    status: 'ok',
    note: 'GD decision (v0.5.2): auto transition after 5000 ms stays; auto-pause stops both clocks (MIN and AUTO). FX: durationMs 5000, phase "continue" 3500 ms.',
  },
  PRINT_ANIM_MS: { value: 600, status: 'ok', note: 'fx_base_print' },
  // Skills (§2.5, §2.16)
  // Player pole swing (assety v1.5 §3a, fx_player_pole_swing: status "zależne od Mechanik v0.6")
  POLE_ARC_RANGE: { value: 2, status: 'pendingMechanics', note: 'Mechaniki v0.6 (not in v0.5.2)' },
  POLE_ARC_DEG: { value: 90, status: 'pendingMechanics', note: 'Mechaniki v0.6 (not in v0.5.2)' },
  PLAYER_ATTACK_WINDUP_MS: { value: 100, status: 'renamed', specName: 'PLAYER_ATK_WINDUP_MS' },
  PLAYER_ATTACK_CYCLE_MS: {
    value: 400,
    status: 'renamed',
    specName: 'PLAYER_ATK_WINDUP_MS + PLAYER_ATK_COOLDOWN_MS',
    note: 'derived: 100 + 300',
  },
  SWING_FX_MS: { value: 200, status: 'fxOnly', note: 'pole swing sweep 4 × 50 ms' },
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
  EVAC_CALL_HOLD_MS: {
    value: 1000,
    status: 'ok',
    note: 'GD R6 A; §2.9 and the §2.16 table (mechaniki v0.5.2) agree since the table fix (S16 closed)',
  },
  EVAC_ARRIVE_S: { value: { 1: 5, 2: 7, 3: 9 }, status: 'ok' },
  EVAC_HOLD_S: { value: 10, status: 'ok', note: 'state "open" 10000 ms' },
  EVAC_RECALL_COOLDOWN_S: {
    value: 5,
    status: 'ok',
    note: 'GD R6 A (was 15); §2.16 table updated (S16 closed); state "departed" 5000 ms',
  },
  EVAC_ALERT_MOMENT: {
    value: 'arrival',
    allowed: ['call', 'arrival'],
    status: 'ok',
    note: 'text enum. GD R6 A: alarm on liftArrived (fx_evac_shaft.states.open.alarm); §2.16 table = arrival (S16 closed)',
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
  BOSS_CHARGE_SEEK_TRACK: {
    value: true,
    status: 'ok',
    note: 'boss walks to the nearest track first; chargeTelegraph starts when it stands on "="',
  },
  BOSS_CHARGE_AXIS: {
    value: 'horizontal',
    allowed: ['horizontal'],
    status: 'ok',
    note: 'mechaniki v0.5.2 §2.11: the charge is always horizontal (no vertical variant)',
  },
  BOSS_CHARGE_BAND_ROWS: { value: 2, status: 'ok', note: '§2.11: lane = the 2 track rows' },
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
 * Where assety-m1.md (v1.2) differs from mechaniki-m1.md v0.5.2 – for GRAF / Mechaniki
 * (field → is → should). Values that follow a GD decision missing in the spec table are status
 * 'gdDecisionSpecStale' in FX_PARAMS (S16) – that is for Mechaniki, not GRAF.
 */
export const FX_SPEC_DIFFS: readonly {
  field: string;
  is: string;
  should: string;
  source: string;
}[] = [
  {
    field:
      'fx_boss_rail_guardian.states.chargeTelegraph / states.charge.band (+ fx_telegraph.timelines["900"] note)',
    is: 'lane = 2 cells (horizontal charge) / 3 cells (vertical charge), steady "x" on telegraphBg; vertical variant described',
    should:
      'charge is horizontal ONLY: lane = the 2 track rows, the 900 ms wind-up lights the WHOLE track; "=" in enemy on telegraphBg (#4A1240), steady; drop the vertical (3-cell) variant',
    source:
      'GD (level-m1 §10 pt 2), mechaniki v0.5.2 §2.11 ("Szarża jest zawsze pozioma, więc wariant pionowy (3 pola) nie istnieje", BOSS_CHARGE_SEEK_TRACK) + styl-ascii v1.5 §12',
  },
  {
    field: 'fx-m1 palette.liquid (assety palette "liquid" → hazardLiquid #9A7BFF, animated ~/≈)',
    is: "M1 liquid '~' violet, animated",
    should:
      "M1 '~' = passable decoration in #4B5B7A (style decorLiquid / WORLD_GLYPHS.liquidM1), no animation; violet only for real hazard after M1",
    source: 'styl-ascii v1.5 §12, mechaniki v0.5.2 §2.11',
  },
  {
    field:
      'screen_base_m1 (17×9) legend "-" / "|" + cables.gridFragments / lightsAboveBase, fx_base_cable_light',
    is: 'unlit cable = wall #8B98A5; one upgrade lights the side walls (cols 0/16, rows 2–6); top wall = 10 grid fragments',
    should:
      'unlit cable #56606B (cableOff), lit #FFE14D; Lights I = row 1 + stash wall, Lights II = side walls cols 0/28 rows 1–5 (# → lit |), Lights III = bottom wall row 6 + hall floor #3B4552 → #56606B (BASE_M1 from level-m1, 29 wide)',
    source:
      'styl-ascii v1.5 §12, level-m1.md §10 pt 11 / BASE_M1. NOTE: assety v1.3 marks screen_base_m1 / fx_base_cable_light "NIEUŻYWANE W M1" (base = menu-hub, mechaniki §2.14a) – GRAF / GD to decide whether the cables are drawn at all in M1',
  },
  {
    field: 'fx_evac_shaft.states.departed (lift unavailable, recall cooldown) / closed lift',
    is: "'<' safe green bold on background for 5000 ms (+ seconds counter); no 'closed' state",
    should:
      "closed '<' = evacClosed #56606B, no bg, no pulse; open = safe bold on evacBg + pulse + seconds counter",
    source: 'styl-ascii v1.5 §12',
  },
  {
    field: 'missing FX (new in styl v1.5 §12)',
    is: 'none',
    should:
      "note read state (glyph '?' dims #E6EDF3 → #56606B); Scrapper burrow vanish: one '·' blink in #FF5FC8 next to the wall (none with Reduce motion); Vat Issue: 'Ω' pulses once per 1.5 s (Reduce motion: steady underlined cell)",
    source: 'styl-ascii v1.5 §12',
  },
];
