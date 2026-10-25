// Camera safe margins. UI reports the measured rectangles of its controls in CSS px
// (setCameraInsets in render/camera.ts). The player's cell is never drawn under them;
// rows = ceil(px / cellH), columns = ceil(px / cellW). Near a map edge the camera may scroll
// past the map (empty cells) instead of covering @.

/** Margins in cells (rows for top/bottom, columns for left/right). */
export interface CameraMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Insets in CSS px from the viewport edges. */
export type CameraInsets = CameraMargins;

/** Default touch layout (sterowanie.md §5): HUD row on top, joystick / ATK at the bottom. */
export const CAMERA_TOUCH_LAYOUT = {
  /** Screen edge padding (px). */
  edge: 16,
  /** HUD / pause button height (px). */
  hudH: 48,
  /** Joystick / ATK button height (px) + gap above them. */
  controlsH: 72,
  controlsGap: 16,
} as const;

/** Desktop (keyboard): no controls over the map. */
export const CAMERA_DESKTOP_INSETS: CameraInsets = { top: 0, bottom: 0, left: 0, right: 0 };

/**
 * Line height (cell height / font size), GRAF range 1.15–1.25: compact on very low screens so
 * 568×320 still shows ≥ 17 rows (mechaniki 1.10 VIEW_MIN_LANDSCAPE).
 */
export const LINE_HEIGHT_NORMAL = 1.2;
export const LINE_HEIGHT_COMPACT = 1.15;
/** Viewport height (CSS px) below which LINE_HEIGHT_COMPACT is used. */
export const COMPACT_VIEW_MAX_H = 360;
