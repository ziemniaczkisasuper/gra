// Camera safe margins, in cells (rows for top/bottom, columns for left/right).
// The player's cell is never drawn inside these bands (e.g. under the DOM HUD / pause button).
// Near a map edge the camera may scroll past the map (empty cells) instead of covering @.

/** Top band covered by the HUD (HP line + pause button). */
export const CAMERA_SAFE_TOP_ROWS = 3;

export interface CameraMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const CAMERA_SAFE_MARGINS: CameraMargins = {
  top: CAMERA_SAFE_TOP_ROWS,
  bottom: 0,
  left: 0,
  right: 0,
};
