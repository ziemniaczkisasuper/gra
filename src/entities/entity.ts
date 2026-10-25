import type { GlyphStyle } from '../data/style';

/**
 * Base entity on the character grid (mechaniki-m1.md 1.1–1.2).
 * Logic knows only whole cells and whole ticks. fromX/fromY/moveTick/moveTicks exist only
 * so the renderer can tween the last step visually.
 * Owned by PROG / Gameplay from M0 on – extend with hp, ai state, etc.
 */
export interface Entity {
  id: number;
  kind: string;
  /** Cell column / row (integers). */
  x: number;
  y: number;
  /** Cell before the last step (render tween). */
  fromX: number;
  fromY: number;
  /** Tick at which the last step happened, and its duration in ticks. */
  moveTick: number;
  moveTicks: number;
  facing: { x: number; y: number };
  /** Tick counters (count down to 0 at the end of every tick, mechaniki 1.1 step 6). */
  moveCooldown: number;
  attackWindup: number;
  attackCooldown: number;
  /** Blocks other entities from entering its cell. */
  solid: boolean;
  glyph: GlyphStyle;
}

let nextId = 1;

export function createEntity(kind: string, x: number, y: number, glyph: GlyphStyle): Entity {
  return {
    id: nextId++,
    kind,
    x,
    y,
    fromX: x,
    fromY: y,
    moveTick: 0,
    moveTicks: 0,
    facing: { x: 1, y: 0 }, // east
    moveCooldown: 0,
    attackWindup: 0,
    attackCooldown: 0,
    solid: true,
    glyph,
  };
}

/** Teleport without a tween. */
export function setCell(e: Entity, x: number, y: number): void {
  e.x = e.fromX = x;
  e.y = e.fromY = y;
  e.moveTicks = 0;
}

/** Decrement all tick counters (end of tick). */
export function tickCounters(e: Entity): void {
  if (e.moveCooldown > 0) e.moveCooldown--;
  if (e.attackWindup > 0) e.attackWindup--;
  if (e.attackCooldown > 0) e.attackCooldown--;
}
