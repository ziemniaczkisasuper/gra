// Enemy descriptors for a generated level. Combat spawns them later; this module does not
// import the combat simulator. Numbers are the §2.11 depth multipliers on `ENEMY_TYPES`.

import { COMBAT_EXTRAS, ENEMY_TYPES, type EnemyTypeId } from '../../data/combat-m0';
import { M0 } from '../../data/mechanics-m0';
import type { Depth } from '../../data/contracts-m1';
import type { EnemyGlyph, EnemySpawn } from './types';

export const GLYPH_TO_TYPE: Record<EnemyGlyph, EnemyTypeId> = {
  s: 'scrapper',
  d: 'panelDrone',
  h: 'curfewGuard',
  t: 'lineSentry',
};

export function isEnemyGlyph(ch: string): ch is EnemyGlyph {
  return ch === 's' || ch === 'd' || ch === 'h' || ch === 't';
}

export function describeEnemy(
  glyph: EnemyGlyph,
  x: number,
  y: number,
  group: number,
  depth: Depth,
  tag: string | null,
  contract: boolean,
  contractId: number | null,
): EnemySpawn {
  const type = GLYPH_TO_TYPE[glyph];
  const def = ENEMY_TYPES[type];
  const hpMult = COMBAT_EXTRAS.DEPTH_HP_MULT[depth - 1] ?? 1;
  const dmgMult = COMBAT_EXTRAS.DEPTH_DMG_MULT[depth - 1] ?? 1;
  return {
    glyph,
    type,
    x,
    y,
    group,
    contract,
    tag,
    contractId,
    depth,
    hp: Math.round(def.hp * hpMult),
    hpMult,
    dmgMult,
    dmgMin: def.dmgMin,
    dmgMax: def.dmgMax,
    wanderRadius: M0.ENEMY_WANDER_RADIUS,
  };
}
