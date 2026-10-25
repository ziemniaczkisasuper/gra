import type { CameraMargins } from '../data/camera';

const NO_MARGINS: CameraMargins = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * One camera axis. `t` = target cell centre, `view` = visible cells, `size` = map cells,
 * `m0`/`m1` = safe margins at the start/end of the axis (top/left, bottom/right).
 * 1. Centre the target in the usable band [m0, view - m1].
 * 2. Clamp to the map (or centre a map smaller than the view).
 * 3. Safety wins over the clamp: the target cell [t-0.5, t+0.5] must lie inside the usable band,
 *    even if that scrolls past the map edge. If the band is < 1 cell, the start margin wins.
 */
export function cameraAxis(t: number, view: number, size: number, m0 = 0, m1 = 0): number {
  const usable = view - m0 - m1;
  let cam = t - (m0 + usable / 2);
  cam = size <= view ? (size - view) / 2 : Math.min(Math.max(cam, 0), size - view);
  const minCam = t + 0.5 - (view - m1); // target bottom/right edge inside the band
  const maxCam = t - 0.5 - m0; // target top/left edge inside the band
  if (cam < minCam) cam = minCam;
  if (cam > maxCam) cam = maxCam;
  return cam;
}

/**
 * Camera top-left (in cells) for a target cell centre: centred in the area left free by the
 * safe margins, clamped to map edges, but never with the target inside a margin.
 */
export function computeCamera(
  target: { x: number; y: number },
  viewCols: number,
  viewRows: number,
  mapW: number,
  mapH: number,
  margins: CameraMargins = NO_MARGINS,
): { x: number; y: number } {
  return {
    x: cameraAxis(target.x, viewCols, mapW, margins.left, margins.right),
    y: cameraAxis(target.y, viewRows, mapH, margins.top, margins.bottom),
  };
}

export interface FontFit {
  preferredPx: number;
  minPx: number;
  lineHeight: number;
  /** Glyph advance / font size (≈0.6 for JetBrains Mono). */
  charAspect?: number;
  minLandscape: { cols: number; rows: number };
  minPortrait: { cols: number; rows: number };
}

/**
 * Font size (CSS px) so the minimum view (mechaniki 1.10: 31×17 landscape, 17×21 portrait)
 * fits, capped at the preferred size and never below the minimum (GRAF: 16 px).
 * Extra screen space = wider field of view, not bigger glyphs.
 */
export function pickFontPx(cssW: number, cssH: number, f: FontFit): number {
  const aspect = f.charAspect ?? 0.6;
  const min = cssW >= cssH ? f.minLandscape : f.minPortrait;
  const fit = Math.floor(Math.min(cssW / (min.cols * aspect), cssH / (min.rows * f.lineHeight)));
  return Math.max(f.minPx, Math.min(f.preferredPx, fit));
}
