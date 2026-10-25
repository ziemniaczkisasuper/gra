import type { TileMap } from './tilemap';

export type OccupiedFn = (x: number, y: number) => boolean;

/**
 * Grid step check (mechaniki-m1.md 1.2):
 * - target cell must not be solid,
 * - no corner cutting: a diagonal step is blocked if EITHER orthogonal neighbour is solid,
 * - target must not be occupied by a blocking entity.
 */
export function canStep(
  map: TileMap,
  x: number,
  y: number,
  dx: number,
  dy: number,
  occupied?: OccupiedFn,
): boolean {
  if (dx === 0 && dy === 0) return false;
  const nx = x + dx;
  const ny = y + dy;
  if (map.isSolid(nx, ny)) return false;
  if (dx !== 0 && dy !== 0 && (map.isSolid(x + dx, y) || map.isSolid(x, y + dy))) return false;
  if (occupied?.(nx, ny)) return false;
  return true;
}
