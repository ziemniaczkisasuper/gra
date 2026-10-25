import { M0, msToTicks } from '../data/mechanics-m0';
import { PLAYER_GLYPH } from '../data/style';
import { createEntity, type Entity } from './entity';
import type { StepCosts } from './movement';

export interface Player extends Entity {
  kind: 'player';
}

export const PLAYER_STEP_COSTS: StepCosts = {
  straightTicks: msToTicks(M0.PLAYER_MOVE_MS),
  diagTicks: msToTicks(M0.PLAYER_MOVE_DIAG_MS),
};

export function createPlayer(x: number, y: number): Player {
  return createEntity('player', x, y, PLAYER_GLYPH) as Player;
}
