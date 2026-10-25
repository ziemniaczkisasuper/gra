// Test helper (QA / balance): choose the combat profile and depth from the URL,
// e.g. `?combat=m1&depth=2`. Works in dev and in the build. Only a game without combat state
// (new game / save from before combat) is affected – a loaded combat state wins (warning).
import { getCombat, peekCombat } from '../combat/combat';
import type { GameState } from '../core/game';
import { COMBAT_PROFILES, type CombatProfileId } from '../data/combat-m0';

export interface CombatUrlParams {
  profile?: CombatProfileId;
  /** 1..DEPTH_HP_MULT.length of the chosen profile. */
  depth?: number;
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
    const cfg = COMBAT_PROFILES[out.profile ?? 'm0'];
    const n = Number(d);
    if (Number.isInteger(n) && n >= 1 && n <= cfg.DEPTH_HP_MULT.length) out.depth = n;
    else warn(`?depth=${d}: expected 1..${cfg.DEPTH_HP_MULT.length}`);
  }
  return out.profile === undefined && out.depth === undefined ? null : out;
}

/**
 * Initialises combat of `state` with the URL profile / depth. Returns true when applied.
 * Not applied (false + warning) when the state already has combat data (loaded save).
 */
export function applyCombatParams(
  state: GameState,
  params: CombatUrlParams | null,
  warn: (m: string) => void = (m) => console.warn(m),
): boolean {
  if (!params) return false;
  const cur = peekCombat(state);
  if (cur) {
    const same =
      (params.profile ?? cur.profile) === cur.profile && (params.depth ?? cur.depth) === cur.depth;
    if (!same)
      warn(
        `?combat/?depth ignored: the loaded save has combat ${cur.profile}/depth ${cur.depth}` +
          ' (start a new game or clear the save to use the URL values)',
      );
    return false;
  }
  const profile = params.profile ?? 'm0';
  getCombat(state, { cfg: COMBAT_PROFILES[profile], profile, depth: params.depth ?? 1 });
  return true;
}
