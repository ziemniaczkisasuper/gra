import { SOLID_TILES } from '../data/tiles';

export interface SpawnPoint {
  ch: string;
  x: number; // cell column
  y: number; // cell row
}

/** Grid of tile characters. Cell (x, y) covers [x, x+1) × [y, y+1) in world units. */
export class TileMap {
  readonly width: number;
  readonly height: number;
  private readonly tiles: string[];

  constructor(
    rows: readonly string[],
    private readonly solid: ReadonlySet<string> = SOLID_TILES,
  ) {
    this.height = rows.length;
    this.width = rows.reduce((m, r) => Math.max(m, r.length), 0);
    this.tiles = rows.map((r) => r.padEnd(this.width, '#'));
  }

  /** Character at a cell; outside the map counts as wall. */
  tile(x: number, y: number): string {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return '#';
    return this.tiles[y]![x]!;
  }

  /** Replace one cell. `ch` must be a single code point. Outside the map is a no-op. */
  setTile(x: number, y: number, ch: string): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    if ([...ch].length !== 1) return false;
    const row = this.tiles[y]!;
    this.tiles[y] = row.slice(0, x) + ch + row.slice(x + 1);
    return true;
  }

  isSolid(x: number, y: number): boolean {
    return this.solid.has(this.tile(x, y));
  }
}

const SPAWN_MARKERS = new Set(['@', 'E']);

/** Parses map text: spawn markers (@, E) become floor and are returned separately. */
export function parseMap(rows: readonly string[]): { map: TileMap; spawns: SpawnPoint[] } {
  const spawns: SpawnPoint[] = [];
  const clean = rows.map((row, y) =>
    [...row]
      .map((ch, x) => {
        if (SPAWN_MARKERS.has(ch)) {
          spawns.push({ ch, x, y });
          return '.';
        }
        return ch;
      })
      .join(''),
  );
  return { map: new TileMap(clean), spawns };
}
