import { describe, expect, it } from 'vitest';
import {
  cameraAxis,
  cameraMargins,
  computeCamera,
  defaultCameraInsets,
  insetsToMargins,
  lineHeightFor,
  pickFontPx,
  resetCameraInsets,
  setCameraInsets,
  setCameraRect,
  setCameraViewport,
  setDefaultCameraInsets,
} from '../src/render/camera';
import { visualPos } from '../src/render/scene';
import { createEntity } from '../src/entities/entity';

const fit = {
  preferredPx: 18,
  minPx: 16,
  lineHeight: 1.2,
  minLandscape: { cols: 31, rows: 17 },
  minPortrait: { cols: 17, rows: 21 },
};

const M0 = { top: 0, bottom: 0, left: 0, right: 0 };

describe('camera', () => {
  it('centres on the target and clamps to map edges', () => {
    expect(computeCamera({ x: 30, y: 15 }, 20, 10, 60, 30)).toEqual({ x: 20, y: 10 });
    expect(computeCamera({ x: 1, y: 1 }, 20, 10, 60, 30)).toEqual({ x: 0, y: 0 });
    // bottom: CAMERA_MIN_BOTTOM_ROWS (4) below @ win over the map clamp (scrolls past the map)
    expect(computeCamera({ x: 59, y: 29 }, 20, 10, 60, 30)).toEqual({ x: 40, y: 23.5 });
    expect(computeCamera({ x: 59, y: 25 }, 20, 10, 60, 30)).toEqual({ x: 40, y: 20 });
  });
  it('a map smaller than the view: centred horizontally, top-aligned vertically', () => {
    expect(computeCamera({ x: 5, y: 5 }, 100, 50, 60, 30, M0)).toEqual({ x: -20, y: -0 });
    // with margins: below the top margin, centred between left/right margins
    const M = { top: 4, bottom: 6, left: 2, right: 0 };
    expect(computeCamera({ x: 5, y: 5 }, 100, 50, 60, 30, M)).toEqual({ x: -21, y: -4 });
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

describe('camera insets in px (setCameraInsets)', () => {
  it('defaults: touch = 16+48+safe top, 16+72+16+safe bottom; desktop = 0', () => {
    expect(defaultCameraInsets(false)).toEqual({ top: 0, bottom: 0, left: 0, right: 0 });
    expect(defaultCameraInsets(true, { top: 20, bottom: 34, left: 0, right: 0 })).toEqual({
      top: 84,
      bottom: 138,
      left: 0,
      right: 0,
    });
  });

  it('rows = ceil(px / cellH), columns = ceil(px / cellW)', () => {
    expect(insetsToMargins({ top: 64, bottom: 104, left: 10, right: 0 }, 11, 22, 667)).toEqual({
      top: 3,
      bottom: 5,
      left: 1,
      right: 0,
    });
    expect(insetsToMargins({ top: 44, bottom: 0, left: 0, right: 0 }, 11, 22, 667).top).toBe(2);
  });

  it('extra rectangle (M1 hint bar, bottom centre) extends the bottom margin', () => {
    const m = insetsToMargins({ top: 0, bottom: 40, left: 0, right: 0 }, 10, 20, 400, [
      { x: 100, y: 300, width: 200, height: 30 },
    ]);
    expect(m.bottom).toBe(5); // 400 - 300 = 100 px → 5 rows
  });

  it('module state: UI report wins over defaults; computeCamera uses it by default', () => {
    resetCameraInsets();
    setCameraViewport(10, 20, 400);
    setDefaultCameraInsets({ top: 40, bottom: 0, left: 0, right: 0 });
    expect(cameraMargins().top).toBe(2);
    setCameraInsets({ top: 61, bottom: 0, left: 0, right: 0 });
    setDefaultCameraInsets({ top: 0, bottom: 0, left: 0, right: 0 }); // ignored now
    expect(cameraMargins().top).toBe(4);
    setCameraRect('hintBar', { x: 0, y: 360, width: 50, height: 20 });
    expect(cameraMargins().bottom).toBe(2);
    // player on row 1 of a 40×20 map, view 20 rows: drawn below the 4-row band
    const c = computeCamera({ x: 3.5, y: 1.5 }, 31, 20, 40, 20);
    expect(1 - c.y).toBeGreaterThanOrEqual(4);
    setCameraRect('hintBar', null);
    resetCameraInsets();
  });
});

describe('font fit: ≥ 17 rows at 568×320, minimum views elsewhere', () => {
  const view = (w: number, h: number) => {
    const lh = lineHeightFor(h);
    const px = pickFontPx(w, h, { ...fit, lineHeight: lh });
    const cellH = Math.round(px * lh);
    const cellW = Math.round(px * 0.6);
    return { lh, px, rows: h / cellH, cols: w / cellW };
  };
  it('568×320: line height 1.15, ≥ 17 rows, ≥ 31 cols', () => {
    const v = view(568, 320);
    expect(v.lh).toBe(1.15);
    expect(v.rows).toBeGreaterThanOrEqual(17);
    expect(v.cols).toBeGreaterThanOrEqual(31);
  });
  it('667×375: line height 1.2, ≥ 17 rows, ≥ 31 cols', () => {
    const v = view(667, 375);
    expect(v.lh).toBe(1.2);
    expect(v.rows).toBeGreaterThanOrEqual(17);
    expect(v.cols).toBeGreaterThanOrEqual(31);
  });
  it('375×667 (portrait): line height 1.2, ≥ 21 rows, ≥ 17 cols', () => {
    const v = view(375, 667);
    expect(v.lh).toBe(1.2);
    expect(v.rows).toBeGreaterThanOrEqual(21);
    expect(v.cols).toBeGreaterThanOrEqual(17);
  });
});

describe('568×320: @ ≥ 4 rows above the bottom of the usable area (dynamic insets)', () => {
  const W = 568;
  const H = 320;
  const lh = lineHeightFor(H);
  const px = pickFontPx(W, H, { ...fit, lineHeight: lh });
  const cellH = Math.round(px * lh);
  const cellW = Math.round(px * 0.6);
  const rows = H / cellH;
  const cols = W / cellW;
  const check = () => {
    const m = cameraMargins();
    for (let y = 0; y < 40; y++) {
      const t = y + 0.5;
      const c = computeCamera({ x: 20.5, y: t }, cols, rows, 64, 40);
      const bottomOfAt = t + 0.5 - c.y;
      expect(rows - m.bottom - bottomOfAt).toBeGreaterThanOrEqual(4 - 1e-9);
      expect(t - 0.5 - c.y).toBeGreaterThanOrEqual(m.top - 1e-9); // still below the top band
    }
  };
  it('default touch insets, then a growing hint bar (setCameraInsets / setCameraRect live)', () => {
    resetCameraInsets();
    setCameraViewport(cellW, cellH, H);
    setDefaultCameraInsets(defaultCameraInsets(true));
    check();
    setCameraRect('hintBar', { x: 150, y: H - 104 - 24, width: 268, height: 24 });
    check();
    setCameraInsets({ top: 64, bottom: 104 + 36, left: 0, right: 0 }); // bar grew
    check();
    resetCameraInsets();
  });
});
