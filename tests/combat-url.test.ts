// ?combat=&depth= helper (src/integration/combat-url.ts) on top of Gameplay's setCombatProfile.
import { describe, expect, it } from 'vitest';
import { enemyMaxHp, getCombat, peekCombat } from '../src/combat/combat';
import '../src/combat/install';
import { COMBAT_M0, COMBAT_M1 } from '../src/data/combat-m0';
import { applyCombatParams, parseCombatParams } from '../src/integration/combat-url';
import { gameFromSave, parseSaveText, saveToJson, snapshot } from '../src/save';

describe('?combat=&depth=', () => {
  it('parses valid values, drops invalid ones with a warning', () => {
    const w: string[] = [];
    const warn = (m: string) => w.push(m);
    expect(parseCombatParams('', warn)).toBeNull();
    expect(parseCombatParams('?combat=m1&depth=3', warn)).toEqual({ profile: 'm1', depth: 3 });
    expect(parseCombatParams('?depth=2', warn)).toEqual({ depth: 2 });
    expect(parseCombatParams('?combat=xx&depth=9', warn)).toBeNull();
    expect(parseCombatParams('?combat=__proto__', warn)).toBeNull();
    expect(parseCombatParams('?depth=1.5', warn)).toBeNull();
    expect(w).toHaveLength(4);
  });

  it('new game: combat starts with the profile and depth (enemy HP scaled)', () => {
    const s = gameFromSave(null);
    applyCombatParams(s, { profile: 'm1', depth: 2 });
    const c = getCombat(s); // lazy init uses the recorded options
    expect(c.cfg).toBe(COMBAT_M1);
    expect(c).toMatchObject({ profile: 'm1', depth: 2 });
    expect(enemyMaxHp(c, 'crawler')).toBe(Math.round(80 * COMBAT_M1.DEPTH_HP_MULT[1]!));
  });

  it('after a load (save holds no profile) it is applied again – as main.ts does', () => {
    const s = gameFromSave(null);
    applyCombatParams(s, { profile: 'm1', depth: 2 });
    getCombat(s);
    const b = gameFromSave(parseSaveText(saveToJson(snapshot(s, 1))));
    applyCombatParams(b, { profile: 'm1', depth: 2 });
    expect(peekCombat(b) ?? getCombat(b)).toMatchObject({ profile: 'm1', depth: 2 });
  });

  it('no parameters = m0 / depth 1', () => {
    const s = gameFromSave(null);
    applyCombatParams(s, null);
    expect(getCombat(s)).toMatchObject({ cfg: COMBAT_M0, profile: 'm0', depth: 1 });
  });
});
