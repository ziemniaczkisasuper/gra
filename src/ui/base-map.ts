// Lights paint on the fixed base map (T33). Glyphs stay the BASE_M1 art.
// Lights I turns row-1 and locker-wall dashes yellow. Lights II replaces the
// hall side walls with a lit vertical cable. Lights III lights the hall floor.
import { lightsCableSegments, type LightsLevel } from '../progress/network';
import { BASE_M1 } from '../world/levelgen';
import { el } from './dom';

export interface BaseMapCell {
  ch: string;
  lit: boolean;
  floor: boolean;
}

const HALL_SIDE_ROWS = [1, 2, 3, 4, 5];

export function paintBaseCells(level: LightsLevel): BaseMapCell[][] {
  const rows = BASE_M1.map((line) => line.split(''));
  const lit: boolean[][] = rows.map((row) => row.map(() => false));
  const floor: boolean[][] = rows.map((row) => row.map(() => false));
  const segs = new Set(lightsCableSegments(level));
  if (segs.has('row1') && rows[1]) {
    rows[1].forEach((ch, x) => {
      if (ch === '-') lit[1]![x] = true;
    });
  }
  if ((segs.has('lockerWall') || segs.has('hallBottomRow6')) && rows[6]) {
    rows[6].forEach((ch, x) => {
      if (ch === '-') lit[6]![x] = true;
    });
  }
  if (segs.has('hallSideCol0') || segs.has('hallSideCol28')) {
    for (const y of HALL_SIDE_ROWS) {
      const row = rows[y];
      if (!row) continue;
      if (segs.has('hallSideCol0') && row[0] === '#') {
        row[0] = '|';
        lit[y]![0] = true;
      }
      const x = row.length - 1;
      if (segs.has('hallSideCol28') && row[x] === '#') {
        row[x] = '|';
        lit[y]![x] = true;
      }
    }
  }
  if (segs.has('hallBottomRow6')) {
    for (let y = 2; y <= 5; y++) {
      rows[y]?.forEach((ch, x) => {
        if (ch === '.') floor[y]![x] = true;
      });
    }
  }
  return rows.map((row, y) => row.map((ch, x) => ({ ch, lit: lit[y]![x]!, floor: floor[y]![x]! })));
}

/** Fill a `<pre>` with one span per cell so lit cables can take the energy colour. */
export function fillBaseMap(pre: HTMLElement, level: number): void {
  const lights = (level < 0 ? 0 : level > 3 ? 3 : level) as LightsLevel;
  pre.dataset.lights = String(lights);
  const cells = paintBaseCells(lights);
  const nodes: Node[] = [];
  cells.forEach((row, y) => {
    for (const cell of row) {
      const span = el('span', { textContent: cell.ch });
      if (cell.lit) span.className = 'm1-cable-on';
      else if (cell.floor) span.className = 'm1-floor-lit';
      nodes.push(span);
    }
    if (y < cells.length - 1) nodes.push(document.createTextNode('\n'));
  });
  pre.replaceChildren(...nodes);
}
