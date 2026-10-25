import { describe, expect, it } from 'vitest';
import { cameraAxis, computeCamera, pickFontPx } from '../src/render/camera';
import { CAMERA_SAFE_MARGINS, CAMERA_SAFE_TOP_ROWS } from '../src/data/camera';
import { visualPos } from '../src/render/scene';
import { createEntity } from '../src/entities/entity';

const fit = {
  preferredPx: 18,
  minPx: 16,
  lineHeight: 1.2,
  minLandscape: { cols: 31, rows: 17 },
  minPortrait: { cols: 17, rows: 21 },
};

describe('camera', () => {
  it('centres on the target and clamps to map edges', () => {
    expect(computeCamera({ x: 30, y: 15 }, 20, 10, 60, 30)).toEqual({ x: 20, y: 10 });
    expect(computeCamera({ x: 1, y: 1 }, 20, 10, 60, 30)).toEqual({ x: 0, y: 0 });
    expect(computeCamera({ x: 59, y: 29 }, 20, 10, 60, 30)).toEqual({ x: 40, y: 20 });
  });
  it('centres a map smaller than the view', () => {
    expect(computeCamera({ x: 5, y: 5 }, 100, 50, 60, 30)).toEqual({ x: -20, y: -10 });
  });
  it('font: preferred on PC, min 16 px on a small phone', () => {
    expect(pickFontPx(1920, 1080, fit)).toBe(18);
    expect(pickFontPx(360, 640, fit)).toBe(18); // portrait 17 cols fits easily
    expect(pickFontPx(568, 320, fit)).toBe(16); // tiny landscape: clamp to min
  });
  it('visual tween over the step duration', () => {
    const e = createEntity('t', 5, 5, { ch: 'x', fg: '#fff' });
    e.fromX = 4;
    e.moveTick = 10;
    e.moveTicks = 3;
    expect(visualPos(e, 11, 0).x).toBeCloseTo(4 + 1 / 3);
    expect(visualPos(e, 13, 0.5).x).toBe(5);
  });
});

describe('camera safe margins (HUD band)', () => {
  const M = { top: 2, bottom: 0, left: 0, right: 0 };
  // Player cell row r occupies [r, r+1); on screen: [r - cam, r + 1 - cam).
  const screenTop = (row: number, cam: number) => row - cam;

  it('default config keeps 3 rows free at the top (pause button height)', () => {
    expect(CAMERA_SAFE_TOP_ROWS).toBe(3);
    expect(CAMERA_SAFE_MARGINS.top).toBe(3);
  });

  it('player next to the top wall is pushed below the HUD band (scrolls past the map)', () => {
    // 40x20 arena, view 17 rows: player on row 1 (just under the outer wall).
    const cam = computeCamera({ x: 3.5, y: 1.5 }, 31, 17, 40, 20, M);
    expect(screenTop(1, cam.y)).toBeGreaterThanOrEqual(2);
    expect(cam.y).toBeLessThan(0); // shows empty rows above the map instead of hiding @
    // without margins it would clamp to 0 and @ would sit under the HUD
    expect(computeCamera({ x: 3.5, y: 1.5 }, 31, 17, 40, 20).y).toBe(0);
  });

  it('player on row 0 or 2 in any view size is never inside the band', () => {
    for (const rows of [10, 17, 17.6, 21, 40]) {
      for (const r of [0, 1, 2, 3, 10, 19]) {
        const cy = cameraAxis(r + 0.5, rows, 20, 2, 0);
        expect(screenTop(r, cy)).toBeGreaterThanOrEqual(2 - 1e-9);
        expect(r + 1 - cy).toBeLessThanOrEqual(rows + 1e-9);
      }
    }
  });

  it('in the middle of the map the player is centred in the usable band', () => {
    const cy = cameraAxis(10.5, 17, 40, 2, 0);
    // usable band = rows [2, 17) → centre 9.5 → player centre on screen at 9.5
    expect(10.5 - cy).toBeCloseTo(9.5);
  });

  it('bottom/left/right margins work the same way; tiny view → top margin wins', () => {
    const cx = cameraAxis(38.5, 31, 40, 0, 3); // right margin 3, player at the right wall
    expect(39 - cx).toBeLessThanOrEqual(31 - 3 + 1e-9);
    const tiny = cameraAxis(0.5, 2.5, 20, 2, 2);
    expect(0 - tiny).toBeCloseTo(2);
  });
});
