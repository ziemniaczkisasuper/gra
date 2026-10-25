import type { Dir8 } from '../input/actions';
import { canStep, type OccupiedFn } from '../world/collision';
import type { TileMap } from '../world/tilemap';
import type { Entity } from './entity';

export interface StepCosts {
  straightTicks: number;
  diagTicks: number;
}

export type StepResult = 'moved' | 'blocked' | 'cooldown' | 'busy' | 'none';

/**
 * Try one grid step (mechaniki 1.2): position changes immediately, then the cooldown runs.
 * Bumping a wall/entity costs no time and only changes `facing`.
 * Movement is not allowed during attack windup.
 */
export function tryStep(
  e: Entity,
  dir: Dir8 | null,
  map: TileMap,
  costs: StepCosts,
  tick: number,
  occupied?: OccupiedFn,
): StepResult {
  if (!dir) return 'none';
  if (e.attackWindup > 0) return 'busy';
  if (e.moveCooldown > 0) return 'cooldown';
  e.facing = { x: dir.x, y: dir.y };
  if (!canStep(map, e.x, e.y, dir.x, dir.y, occupied)) return 'blocked';
  const diag = dir.x !== 0 && dir.y !== 0;
  const cost = diag ? costs.diagTicks : costs.straightTicks;
  e.fromX = e.x;
  e.fromY = e.y;
  e.x += dir.x;
  e.y += dir.y;
  e.moveTick = tick;
  e.moveTicks = cost;
  e.moveCooldown = cost;
  return 'moved';
}
