// Arrival alarm (mechaniki §2.9 step 3): every enemy whose BFS distance to the shaft
// is ≤ EVAC_ALERT_RADIUS. The shaft cell itself is distance 0 even though it is not
// passable. Steps are 8-directional and do not cut corners (same rule as canStep).
//
// combat.ts does not export a "walk to this shaft" wake. Callers keep the id list
// (ExpeditionState.alarmIds) and emit `liftArrived` so the FX alert can play. This
// module does not copy enemy AI.
import { EVAC_ALERT_RADIUS } from './timing';

export interface AlarmBody {
  id: number;
  x: number;
  y: number;
}

const DIRS: readonly (readonly [number, number])[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

/**
 * Ids of `enemies` that stand on a cell within `radius` BFS steps of `shaft`.
 * Unreachable cells (and anything past the radius) are left out. Ids are sorted.
 */
export function enemiesInAlarmRadius(
  width: number,
  height: number,
  passable: (x: number, y: number) => boolean,
  shaft: { x: number; y: number },
  enemies: readonly AlarmBody[],
  radius: number = EVAC_ALERT_RADIUS,
): number[] {
  if (width <= 0 || height <= 0) return [];
  if (shaft.x < 0 || shaft.y < 0 || shaft.x >= width || shaft.y >= height) return [];
  const dist = new Int32Array(width * height);
  dist.fill(-1);
  const start = shaft.y * width + shaft.x;
  dist[start] = 0;
  const queue: number[] = [start];
  let head = 0;
  while (head < queue.length) {
    const index = queue[head++]!;
    const base = dist[index]!;
    if (base >= radius) continue;
    const x = index % width;
    const y = (index - x) / width;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const next = ny * width + nx;
      if (dist[next] !== -1) continue;
      if (!passable(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (!passable(x + dx, y) || !passable(x, y + dy))) continue;
      dist[next] = base + 1;
      queue.push(next);
    }
  }
  const ids: number[] = [];
  for (const enemy of enemies) {
    if (enemy.x < 0 || enemy.y < 0 || enemy.x >= width || enemy.y >= height) continue;
    const d = dist[enemy.y * width + enemy.x]!;
    if (d >= 0 && d <= radius) ids.push(enemy.id);
  }
  ids.sort((a, b) => a - b);
  return ids;
}
