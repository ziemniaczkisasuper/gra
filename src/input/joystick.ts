// Floating joystick → one of 8 directions (sterowanie.md §2, mechaniki-m1.md 1.16 pt 1).
// Pure logic (no DOM) so it is unit-tested in Node. Owner: PROG / UI i Menu.

export interface JoystickConfig {
  /** Joystick radius in CSS px (≈ dp). */
  radius: number;
  /** Below this fraction of the radius: no direction (dead zone). */
  deadZone: number;
  /** Below this fraction (but outside the dead zone) the previous direction is kept. */
  holdBelow: number;
  /** Extra angle (degrees) the thumb must cross past a sector edge before switching. */
  hysteresisDeg: number;
}

export const JOYSTICK: JoystickConfig = {
  radius: 60,
  deadZone: 0.15,
  holdBelow: 0.25,
  hysteresisDeg: 10,
};

/** Sector index → direction. Sector 0 = east, clockwise on screen (y grows down), like toDir8. */
export const SECTOR_DIRS: readonly { x: -1 | 0 | 1; y: -1 | 0 | 1 }[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];

const SECTOR_DEG = 45;

/** Nearest sector (0..7) for a vector in screen coordinates. */
export function sectorOf(dx: number, dy: number): number {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  return (((Math.round(deg / SECTOR_DEG) % 8) + 8) % 8) as number;
}

/** Smallest absolute difference between two angles in degrees (0..180). */
export function angleDiffDeg(a: number, b: number): number {
  const d = (((a - b) % 360) + 360) % 360;
  return d > 180 ? 360 - d : d;
}

/**
 * Next sector for a thumb offset (dx, dy) from the joystick base.
 * - |offset| < deadZone·R → null (no move; the remembered direction is dropped).
 * - |offset| < holdBelow·R → keep `prev` (if any), so thumb jitter near the centre
 *   never flips the direction; with no previous direction the nearest sector is used.
 * - otherwise: stay in `prev` while the angle is within 22.5° + hysteresis of its centre,
 *   else switch to the nearest sector.
 */
export function nextSector(
  prev: number | null,
  dx: number,
  dy: number,
  cfg: JoystickConfig = JOYSTICK,
): number | null {
  const dist = Math.hypot(dx, dy) / cfg.radius;
  if (dist < cfg.deadZone) return null;
  if (prev !== null && dist < cfg.holdBelow) return prev;
  const nearest = sectorOf(dx, dy);
  if (prev === null || nearest === prev) return nearest;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
  const keep = angleDiffDeg(deg, prev * SECTOR_DEG) <= SECTOR_DEG / 2 + cfg.hysteresisDeg;
  return keep ? prev : nearest;
}

/** Joystick state for one finger: base follows the thumb when it leaves the radius. */
export class Joystick {
  baseX = 0;
  baseY = 0;
  knobX = 0;
  knobY = 0;
  sector: number | null = null;

  constructor(readonly cfg: JoystickConfig = JOYSTICK) {}

  start(x: number, y: number): void {
    this.baseX = this.knobX = x;
    this.baseY = this.knobY = y;
    this.sector = null;
  }

  move(x: number, y: number): void {
    let dx = x - this.baseX;
    let dy = y - this.baseY;
    this.sector = nextSector(this.sector, dx, dy, this.cfg);
    const dist = Math.hypot(dx, dy);
    const r = this.cfg.radius;
    if (dist > r) {
      // "Follow": drag the base behind the thumb so it never gets stuck on the edge.
      const k = (dist - r) / dist;
      this.baseX += dx * k;
      this.baseY += dy * k;
      dx = x - this.baseX;
      dy = y - this.baseY;
    }
    this.knobX = this.baseX + dx;
    this.knobY = this.baseY + dy;
  }

  /** Direction vector for ActionState.move (each axis -1/0/1), zero inside the dead zone. */
  get vector(): { x: number; y: number } {
    if (this.sector === null) return { x: 0, y: 0 };
    const d = SECTOR_DIRS[this.sector]!;
    return { x: d.x, y: d.y };
  }
}
