// Cell → screen mapping for DOM UI over the canvas (ui-m1 S-T1: hints, joystick ghost, key
// frames next to `@`). Updated by renderScene every frame with the camera it actually drew
// (incl. the step tween / render interpolation), so a DOM element follows the glyphs exactly.

export interface ScreenRect {
  /** CSS px, relative to the viewport (top-left of the cell). */
  x: number;
  y: number;
  w: number;
  h: number;
}

const frame = {
  camPxX: 0,
  camPxY: 0,
  cellW: 10,
  cellH: 20,
  dpr: 1,
  /** Canvas top-left in the viewport (CSS px). The game canvas is fullscreen → 0, 0. */
  originX: 0,
  originY: 0,
  cols: 0,
  rows: 0,
};

/** render/scene.ts: camera of the frame just drawn (device px) and the renderer geometry. */
export function setFrameCamera(
  camPxX: number,
  camPxY: number,
  r: { cellW: number; cellH: number; dpr: number; cols: number; rows: number },
): void {
  frame.camPxX = camPxX;
  frame.camPxY = camPxY;
  frame.cellW = r.cellW;
  frame.cellH = r.cellH;
  frame.dpr = r.dpr;
  frame.cols = r.cols;
  frame.rows = r.rows;
}

/** main.ts / tests: canvas position in the viewport (default 0, 0). */
export function setCanvasOrigin(x: number, y: number): void {
  frame.originX = x;
  frame.originY = y;
}

/**
 * Screen rectangle of map cell (x, y) in CSS px relative to the viewport, as drawn in the last
 * frame (camera + interpolation). Fractional x / y (e.g. a tweened entity) are allowed.
 */
export function cellToScreen(x: number, y: number): ScreenRect {
  const d = frame.dpr;
  return {
    x: frame.originX + (x * frame.cellW - frame.camPxX) / d,
    y: frame.originY + (y * frame.cellH - frame.camPxY) / d,
    w: frame.cellW / d,
    h: frame.cellH / d,
  };
}

/**
 * Inverse of cellToScreen: viewport CSS px → map cell under that point in the last frame, or
 * null outside the canvas. (Cells outside the map are returned as they are – callers check.)
 */
export function screenToCell(px: number, py: number): { x: number; y: number } | null {
  const d = frame.dpr;
  const lx = px - frame.originX;
  const ly = py - frame.originY;
  const wCss = (frame.cols * frame.cellW) / d;
  const hCss = (frame.rows * frame.cellH) / d;
  if (lx < 0 || ly < 0 || lx >= wCss || ly >= hCss) return null;
  return {
    x: Math.floor((lx * d + frame.camPxX) / frame.cellW),
    y: Math.floor((ly * d + frame.camPxY) / frame.cellH),
  };
}

/** Visible map area of the last frame in cells (ui-m1 §11.6 arrow to the shaft). */
export function getViewRect(): { x: number; y: number; w: number; h: number } {
  return {
    x: frame.camPxX / frame.cellW,
    y: frame.camPxY / frame.cellH,
    w: frame.cols,
    h: frame.rows,
  };
}
