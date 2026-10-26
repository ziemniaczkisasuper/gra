// Player shots (wariant-twin-stick §3). Not saved — a load drops anything still in the air.
// Stepped from the combat world phase, after enemies have moved.
import type { TileMap } from '../world/tilemap';
import { bresenhamCells, type Cell } from './grid';

export interface PlayerProjectile {
  id: number;
  /** Bresenham path, player cell excluded, stopped before a wall / corner-cut / range. */
  cells: Cell[];
  /** -1 = still on the firing cell; otherwise the index in `cells` currently occupied. */
  idx: number;
  /** Ticks left until the next cell. */
  timer: number;
  /** Damage already rolled (crit and momentum included). */
  dmg: number;
  crit: boolean;
  /** The roll included the Dash momentum bonus. */
  momentum: boolean;
  ownerId: number;
  dir: Cell;
  from: Cell;
  /** Cell reported when the shot ends with no victim (last open cell, or the wall if none). */
  endCell: Cell;
}

export function buildShot(
  map: TileMap,
  from: Cell,
  dir: Cell,
  range: number,
  target: Cell | null,
): { cells: Cell[]; endCell: Cell } {
  const to = target ?? { x: from.x + dir.x * range, y: from.y + dir.y * range };
  const cells = bresenhamCells(map, from, to, range);
  const endCell = cells.length > 0 ? cells[cells.length - 1]! : { x: to.x, y: to.y };
  return { cells, endCell };
}

export interface ProjectileImpact {
  proj: PlayerProjectile;
  cell: Cell;
  /** null = wall or the end of the path (max range). */
  hitId: number | null;
}

/**
 * One world-phase step. `hitAt` returns the hostile id on a cell, or null.
 * The buddy drone is transparent — the caller must not report it.
 * A hostile already standing on the projectile's cell (they stepped onto it) is a hit
 * before the projectile advances, so a swap of cells does not pass through.
 * Removes projectiles that hit or that run off the end of their path.
 */
export function stepProjectiles(
  list: PlayerProjectile[],
  ticksPerCell: number,
  hitAt: (cell: Cell) => number | null,
): ProjectileImpact[] {
  const impacts: ProjectileImpact[] = [];
  const remove = new Set<number>();
  for (const proj of list) {
    if (proj.idx >= 0) {
      const standing = proj.cells[proj.idx]!;
      const id = hitAt(standing);
      if (id !== null) {
        impacts.push({ proj, cell: standing, hitId: id });
        remove.add(proj.id);
        continue;
      }
    }
    if (proj.timer > 0) proj.timer--;
    if (proj.timer > 0) continue;
    const next = proj.idx + 1;
    if (next >= proj.cells.length) {
      impacts.push({ proj, cell: proj.endCell, hitId: null });
      remove.add(proj.id);
      continue;
    }
    proj.idx = next;
    proj.timer = Math.max(1, ticksPerCell);
    const cell = proj.cells[next]!;
    const id = hitAt(cell);
    if (id !== null) {
      impacts.push({ proj, cell, hitId: id });
      remove.add(proj.id);
    }
  }
  if (remove.size) {
    for (let i = list.length - 1; i >= 0; i--) if (remove.has(list[i]!.id)) list.splice(i, 1);
  }
  return impacts;
}
