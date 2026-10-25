// ?combat=&depth= test helper (src/integration/combat-url.ts).
import { describe, expect, it } from 'vitest';
import { getCombat, peekCombat, enemyMaxHp } from '../src/combat/combat';
import '../src/combat/install';
import { COMBAT_M1 } from '../src/data/combat-m0';
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
    expect(applyCombatParams(s, { profile: 'm1', depth: 2 })).toBe(true);
    const c = peekCombat(s)!;
    expect(c.cfg).toBe(COMBAT_M1);
    expect(c.profile).toBe('m1');
    expect(c.depth).toBe(2);
    expect(enemyMaxHp(c, 'crawler')).toBe(Math.round(80 * COMBAT_M1.DEPTH_HP_MULT[1]!));
    // kept through save/load
    const b = gameFromSave(parseSaveText(saveToJson(snapshot(s, 1))));
    expect(peekCombat(b)).toMatchObject({ profile: 'm1', depth: 2 });
  });

  it('loaded combat state wins (warning, nothing changed)', () => {
    const s = gameFromSave(null);
    getCombat(s);
    const w: string[] = [];
    expect(applyCombatParams(s, { profile: 'm1' }, (m) => w.push(m))).toBe(false);
    expect(peekCombat(s)!.profile).toBe('m0');
    expect(w).toHaveLength(1);
    expect(applyCombatParams(s, null)).toBe(false);
  });
});
