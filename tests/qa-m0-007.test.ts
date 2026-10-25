// QA-M0-007 regression: upper bounds for tick and the other core numbers of a save.
import { describe, expect, it } from 'vitest';
import { stepGame } from '../src/core/game';
import { DEFAULT_SEED } from '../src/data/game';
import { emptyActions } from '../src/input/actions';
import { gameFromSave, parseSave, SAVE_LIMITS, snapshot } from '../src/save';

const D = { seed: DEFAULT_SEED };
const base = () => snapshot(gameFromSave(null), 1) as unknown as Record<string, unknown>;
const ok = (patch: Record<string, unknown>) => parseSave({ ...base(), ...patch }, D);
const bad = (patch: Record<string, unknown>) => () => ok(patch);

describe('QA-M0-007: save number limits', () => {
  it('tick: safe integer 0..2^31', () => {
    expect(ok({ tick: 2 ** 31 }).tick).toBe(2 ** 31);
    for (const tick of [2 ** 31 + 1, 2 ** 53, 9007199254740992, 1e300, -1, 1.5, Infinity, '5'])
      expect(bad({ tick })).toThrow(/tick/);
  });

  it('a game at the max tick still counts ticks', () => {
    const g = gameFromSave(ok({ tick: SAVE_LIMITS.MAX_TICK }));
    stepGame(g, emptyActions(), 50);
    expect(g.tick).toBe(SAVE_LIMITS.MAX_TICK + 1);
  });

  it('savedAt, timestamps and playtime are bounded', () => {
    expect(bad({ savedAt: 1e300 })).toThrow(/savedAt/);
    expect(bad({ lastExportAt: 9e15 })).toThrow(/lastExportAt/);
    expect(bad({ iosHintHiddenUntil: -1 })).toThrow();
    expect(bad({ playtimeMs: 1e300 })).toThrow(/playtimeMs/);
    expect(ok({ playtimeMs: SAVE_LIMITS.MAX_PLAYTIME_MS }).playtimeMs).toBe(
      SAVE_LIMITS.MAX_PLAYTIME_MS,
    );
  });

  it('player cell: integer 0..MAX_CELL', () => {
    const p = (x: unknown, y: unknown) => ({ player: { x, y, facing: 'E' } });
    expect(ok(p(3, 4)).player).toMatchObject({ x: 3, y: 4 });
    for (const [x, y] of [
      [1e300, 3],
      [3, -1],
      [3.5, 3],
      [SAVE_LIMITS.MAX_CELL + 1, 3],
    ])
      expect(bad(p(x, y))).toThrow(/player/);
  });

  it('rngState: max 64 streams, sane names', () => {
    const many: Record<string, number> = {};
    for (let i = 0; i <= SAVE_LIMITS.MAX_RNG_STREAMS; i++) many[`s${i}`] = i;
    expect(bad({ rngState: many })).toThrow(/streams/);
    expect(bad({ rngState: { ['x'.repeat(65)]: 1 } })).toThrow(/key/);
  });
});
