// ui-m1 S-T1: cellToScreen(x, y) = where the last frame drew that cell (CSS px, viewport).
import { describe, expect, it } from 'vitest';
import { createGame } from '../src/core/game';
import { resetCameraInsets } from '../src/render/camera';
import type { GlyphRenderer } from '../src/render/glyph-renderer';
import { renderScene } from '../src/render/scene';
import { cellToScreen, getViewRect, screenToCell, setCanvasOrigin } from '../src/render/screen';

function fakeRenderer(dpr: number) {
  const draws: { ch: string; x: number; y: number }[] = [];
  const r = {
    cols: 31,
    rows: 17,
    cellW: 10 * dpr,
    cellH: 20 * dpr,
    dpr,
    clear() {},
    draw(g: { ch: string }, x: number, y: number) {
      draws.push({ ch: g.ch, x, y });
    },
  };
  return { r: r as unknown as GlyphRenderer, draws };
}

describe('cellToScreen', () => {
  it('matches the drawn @ (dpr 2), incl. the step tween (render interpolation)', () => {
    resetCameraInsets();
    const s = createGame();
    const { r, draws } = fakeRenderer(2);
    // mid-step: from (x-1) to x, half way
    s.player.fromX = s.player.x - 1;
    s.player.fromY = s.player.y;
    s.player.moveTick = s.tick;
    s.player.moveTicks = 2;
    renderScene(r, s, 1);
    const at = draws.filter((d) => d.ch === '@').at(-1)!;
    const vx = s.player.x - 0.5;
    const q = cellToScreen(vx, s.player.y);
    expect(q).toEqual({ x: at.x / 2, y: at.y / 2, w: 10, h: 20 });
    // a static cell: integer position of its glyph
    const wall = cellToScreen(0, 0);
    const v = getViewRect();
    expect(wall.x).toBeCloseTo(-v.x * 10, 6);
    expect(v.w).toBe(31);
  });

  it('adds the canvas origin', () => {
    const s = createGame();
    renderScene(fakeRenderer(1).r, s, 0);
    const a = cellToScreen(3, 3);
    setCanvasOrigin(5, 7);
    const b = cellToScreen(3, 3);
    setCanvasOrigin(0, 0);
    expect({ dx: b.x - a.x, dy: b.y - a.y }).toEqual({ dx: 5, dy: 7 });
  });

  it('screenToCell is the inverse (cell centre → same cell), null outside the canvas', () => {
    const s = createGame();
    renderScene(fakeRenderer(2).r, s, 0);
    for (const [x, y] of [
      [3, 3],
      [s.player.x, s.player.y],
      [10, 7],
    ] as const) {
      const q = cellToScreen(x, y);
      expect(screenToCell(q.x + q.w / 2, q.y + q.h / 2)).toEqual({ x, y });
    }
    expect(screenToCell(-1, 5)).toBeNull();
    expect(screenToCell(5, 31 * 20 + 1)).toBeNull();
  });
});
