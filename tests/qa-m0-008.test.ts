// QA-M0-008 regression: MOVE_DEADZONE comes from the data file; all of table 1.14 in one file.
import { afterEach, describe, expect, it } from 'vitest';
import { createGame, stepGame } from '../src/core/game';
import { COMBAT_EXTRAS, COMBAT_M0 } from '../src/data/combat-m0';
import { M0 } from '../src/data/mechanics-m0';
import { emptyActions, toDir8 } from '../src/input/actions';

/** Names of table 1.14 in design/mechaniki-m1.md v0.5 (ARENA_SIZE = ARENA_COLS × ARENA_ROWS). */
const TABLE_1_14 =
  `TICK_MS PLAYER_HP PLAYER_MOVE_MS PLAYER_MOVE_DIAG_MS DIAG_GRACE_MS PLAYER_ATK_RANGE
PLAYER_ATK_WINDUP_MS PLAYER_ATK_COOLDOWN_MS PLAYER_DMG_MIN PLAYER_DMG_MAX PLAYER_CRIT_CHANCE
PLAYER_CRIT_MULT INPUT_TAP_BUFFER_MS ATK_QUEUE_MS PLAYER_REGEN_DELAY_MS PLAYER_REGEN_PER_S
PLAYER_RESPAWN_MS PLAYER_IFRAMES_ON_HIT_MS ENEMY_HP ENEMY_MOVE_MS ENEMY_MOVE_DIAG_MS ENEMY_ATK_RANGE
ENEMY_ATK_WINDUP_MS ENEMY_WINDUP_MIN_MS ENEMY_ATK_COOLDOWN_MS ENEMY_DMG_MIN ENEMY_DMG_MAX
TELEGRAPH_BLINK_MS TELEGRAPH_FAST_LAST_MS ENEMY_DETECT_RADIUS ENEMY_ALERT_MS ENEMY_LEASH_RADIUS
ENEMY_LOST_LOS_MS ENEMY_RETURN_DEAF_MS ENEMY_PATH_RADIUS ENEMY_WANDER_INTERVAL_MIN_MS
ENEMY_WANDER_INTERVAL_MAX_MS ENEMY_WANDER_RADIUS ENEMY_RESPAWN_MS ENEMY_RESPAWN_MIN_DIST
AUTOPAUSE_IDLE_HIT_MS AUTOPAUSE_IDLE_MS RESUME_COUNTDOWN_MS RESUME_IFRAMES_MS FLOAT_TEXT_MS
HIT_FLASH_MS PLAYER_DEATH_FREEZE_MS TELEGRAPH_FAST_BLINK_MS STRIKE_FX_MS HIT_VIBRATE_MS
MOVE_DEADZONE VIEW_MIN_LANDSCAPE VIEW_MIN_PORTRAIT ARENA_COLS ARENA_ROWS MAX_STEPS_PER_FRAME`.split(
    /\s+/,
  );

const m0 = M0 as unknown as Record<string, unknown>;
const saved = M0.MOVE_DEADZONE;
afterEach(() => {
  m0.MOVE_DEADZONE = saved;
});

describe('QA-M0-008: one data file, MOVE_DEADZONE honoured', () => {
  it('every row of table 1.14 is in data/mechanics-m0.ts and none in COMBAT_EXTRAS', () => {
    for (const k of TABLE_1_14) expect(M0, k).toHaveProperty(k);
    const extras = Object.keys(COMBAT_EXTRAS);
    expect(extras.filter((k) => TABLE_1_14.includes(k))).toEqual([]);
  });

  it('combat profile re-exports the same values', () => {
    for (const k of TABLE_1_14)
      expect((COMBAT_M0 as unknown as Record<string, unknown>)[k], k).toEqual(m0[k]);
  });

  it('toDir8 and stepGame use M0.MOVE_DEADZONE (changed in data → changed behaviour)', () => {
    const g = createGame();
    const x = g.player.x;
    const a = emptyActions();
    a.move = { x: 0.5, y: 0 };
    m0.MOVE_DEADZONE = 0.9;
    expect(toDir8(a.move)).toBeNull();
    for (let i = 0; i < 6; i++) stepGame(g, a, 50);
    expect(g.player.x).toBe(x); // below the dead zone: no step
    m0.MOVE_DEADZONE = 0.15;
    expect(toDir8(a.move)).toEqual({ x: 1, y: 0 });
    stepGame(g, a, 50);
    expect(g.player.x).toBe(x + 1);
  });
});
