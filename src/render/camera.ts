import {
  CAMERA_DESKTOP_INSETS,
  CAMERA_MIN_BOTTOM_ROWS,
  CAMERA_TOUCH_LAYOUT,
  COMPACT_VIEW_MAX_H,
  LINE_HEIGHT_COMPACT,
  LINE_HEIGHT_NORMAL,
  type CameraInsets,
  type CameraMargins,
} from '../data/camera';

const NO_MARGINS: CameraMargins = { top: 0, bottom: 0, left: 0, right: 0 };

/** How a map smaller than the usable band is placed on an axis. */
export type SmallMapAlign = 'start' | 'center';

/**
 * One camera axis. `t` = target cell centre, `view` = visible cells, `size` = map cells,
 * `m0`/`m1` = safe margins at the start/end of the axis (top/left, bottom/right).
 * 1. Centre the target in the usable band [m0, view - m1].
 * 2. Clamp to the map. A map smaller than the view: placed in the usable band – at its start
 *    (`align` 'start', vertical: map in the top part of the screen, sterowanie.md §5) or
 *    centred ('center', horizontal).
 * 3. Safety wins over the clamp: the target cell [t-0.5, t+0.5] must lie inside the usable band,
 *    even if that scrolls past the map edge. If the band is < 1 cell, the start margin wins.
 */
export function cameraAxis(
  t: number,
  view: number,
  size: number,
  m0 = 0,
  m1 = 0,
  align: SmallMapAlign = 'center',
  endClear = 0,
): number {
  const usable = view - m0 - m1;
  let cam = t - (m0 + usable / 2);
  if (size <= view) {
    if (size <= usable) cam = align === 'start' ? -m0 : -(m0 + (usable - size) / 2);
    else cam = align === 'start' ? Math.max(-m0, size - view) : (size - view) / 2;
  } else cam = Math.min(Math.max(cam, 0), size - view);
  // `endClear` extra cells before the band end (as far as the band allows: start margin wins)
  const clear = Math.max(0, Math.min(endClear, usable - 1));
  const minCam = t + 0.5 - (view - m1 - clear); // target bottom/right edge inside the band
  const maxCam = t - 0.5 - m0; // target top/left edge inside the band
  if (cam < minCam) cam = minCam;
  if (cam > maxCam) cam = maxCam;
  return cam;
}

/**
 * Camera top-left (in cells) for a target cell centre: centred in the area left free by the
 * safe margins, clamped to map edges, but never with the target inside a margin.
 * Default margins = the current insets (setCameraInsets) converted to cells, so every caller
 * (scene, combat overlay) uses the same camera.
 */
export function computeCamera(
  target: { x: number; y: number },
  viewCols: number,
  viewRows: number,
  mapW: number,
  mapH: number,
  margins: CameraMargins = cameraMargins(),
): { x: number; y: number } {
  return {
    x: cameraAxis(target.x, viewCols, mapW, margins.left, margins.right, 'center'),
    y: cameraAxis(
      target.y,
      viewRows,
      mapH,
      margins.top,
      margins.bottom,
      'start',
      CAMERA_MIN_BOTTOM_ROWS,
    ),
  };
}

// ---- insets in px (UI) → margins in cells ----------------------------------------------------

/** A rectangle in CSS px, viewport coordinates. */
export interface PxRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Safe-area insets of the device (CSS env(safe-area-inset-*)), px. */
export type SafeArea = CameraInsets;

/** Default insets: touch layout (+ safe area) or none on desktop. */
export function defaultCameraInsets(touch: boolean, safe: SafeArea = NO_MARGINS): CameraInsets {
  if (!touch) return { ...CAMERA_DESKTOP_INSETS };
  const L = CAMERA_TOUCH_LAYOUT;
  return {
    top: L.edge + L.hudH + safe.top,
    bottom: L.edge + L.controlsH + L.controlsGap + safe.bottom,
    left: 0,
    right: 0,
  };
}

/**
 * Pure conversion: px insets (+ extra rectangles, e.g. the M1 hint bar, QA R28) → cells.
 * An extra rectangle in the lower half of the viewport extends the bottom inset to its top
 * edge, one in the upper half extends the top inset to its bottom edge.
 */
export function insetsToMargins(
  insets: CameraInsets,
  cellW: number,
  cellH: number,
  viewH: number,
  extra: readonly PxRect[] = [],
): CameraMargins {
  let { top, bottom } = insets;
  for (const r of extra) {
    if (r.width <= 0 || r.height <= 0) continue;
    if (r.y + r.height / 2 >= viewH / 2) bottom = Math.max(bottom, viewH - r.y);
    else top = Math.max(top, r.y + r.height);
  }
  const rows = (px: number) => (px > 0 ? Math.ceil(px / cellH - 1e-9) : 0);
  const cols = (px: number) => (px > 0 ? Math.ceil(px / cellW - 1e-9) : 0);
  return {
    top: rows(top),
    bottom: rows(bottom),
    left: cols(insets.left),
    right: cols(insets.right),
  };
}

const cam = {
  insets: { ...CAMERA_DESKTOP_INSETS } as CameraInsets,
  /** true once UI reported measured insets – defaults no longer apply. */
  fromUi: false,
  extra: new Map<string, PxRect>(),
  cellW: 10,
  cellH: 20,
  viewH: 0,
};

/** UI: measured insets of its controls (px from each viewport edge). */
export function setCameraInsets(insets: CameraInsets): void {
  cam.insets = { ...insets };
  cam.fromUi = true;
}

/** main.ts: default insets (defaultCameraInsets) – ignored after UI reported its own. */
export function setDefaultCameraInsets(insets: CameraInsets): void {
  if (!cam.fromUi) cam.insets = { ...insets };
}

/** Tests: back to desktop defaults, no UI report, no extra rectangles. */
export function resetCameraInsets(): void {
  cam.insets = { ...CAMERA_DESKTOP_INSETS };
  cam.fromUi = false;
  cam.extra.clear();
}

export function getCameraInsets(): CameraInsets {
  return { ...cam.insets };
}

/**
 * UI: an extra rectangle the player must not be drawn under (px, viewport coords), e.g.
 * id 'hintBar' – the M1 hint bar at the bottom centre (QA R28). null removes it.
 */
export function setCameraRect(id: string, rect: PxRect | null): void {
  if (rect) cam.extra.set(id, { ...rect });
  else cam.extra.delete(id);
}

/** Renderer / main.ts after a resize: CSS size of one cell and the viewport height. */
export function setCameraViewport(cellW: number, cellH: number, viewH: number): void {
  cam.cellW = cellW;
  cam.cellH = cellH;
  cam.viewH = viewH;
}

/** Current margins in cells. */
export function cameraMargins(): CameraMargins {
  return insetsToMargins(cam.insets, cam.cellW, cam.cellH, cam.viewH, [...cam.extra.values()]);
}

/** Line height for a viewport height (GRAF 1.15–1.25; compact below COMPACT_VIEW_MAX_H). */
export function lineHeightFor(cssH: number): number {
  return cssH < COMPACT_VIEW_MAX_H ? LINE_HEIGHT_COMPACT : LINE_HEIGHT_NORMAL;
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
