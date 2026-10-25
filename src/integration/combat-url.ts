// Combat profile + depth of the current game (PROG / Gameplay API setCombatProfile), with a
// test helper (QA / balance) to choose them from the URL, e.g. `?combat=m1&depth=2`.
// Works in dev and in the build. CombatSave holds no profile / depth, so main.ts calls
// applyCombatParams() after every load (boot and import). M1 zones will call setCombatProfile
// on zone entry instead.
import { setCombatProfile } from '../combat/combat';
import type { GameState } from '../core/game';
import { COMBAT_PROFILES, type CombatProfileId } from '../data/combat-m0';

export interface CombatUrlParams {
  profile?: CombatProfileId;
  /** 1..DEPTH_HP_MULT.length of the chosen profile. */
  depth?: 1 | 2 | 3;
}

/** Parses `combat` / `depth`; invalid values are dropped with a warning. null = nothing set. */
export function parseCombatParams(
  search: string,
  warn: (m: string) => void = (m) => console.warn(m),
): CombatUrlParams | null {
  const q = new URLSearchParams(search);
  const out: CombatUrlParams = {};
  const p = q.get('combat');
  if (p !== null) {
    if (Object.prototype.hasOwnProperty.call(COMBAT_PROFILES, p))
      out.profile = p as CombatProfileId;
    else warn(`?combat=${p}: unknown profile (${Object.keys(COMBAT_PROFILES).join(', ')})`);
  }
  const d = q.get('depth');
  if (d !== null) {
    const max = Math.min(3, COMBAT_PROFILES[out.profile ?? 'm0'].DEPTH_HP_MULT.length);
    const n = Number(d);
    if (Number.isInteger(n) && n >= 1 && n <= max) out.depth = n as 1 | 2 | 3;
    else warn(`?depth=${d}: expected 1..${max}`);
  }
  return out.profile === undefined && out.depth === undefined ? null : out;
}

/** Sets the combat profile / depth of `state` (default m0 / depth 1). Draws no random numbers. */
export function applyCombatParams(state: GameState, params: CombatUrlParams | null): void {
  setCombatProfile(state, params?.profile ?? 'm0', params?.depth ?? 1);
}
