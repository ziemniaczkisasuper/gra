import { DUMMY_GLYPH } from '../data/style';
import { createEntity, type Entity } from './entity';

/** Static training dummy (blocks movement). No AI, no HP – Gameplay adds combat. */
export function createDummy(x: number, y: number): Entity {
  return createEntity('dummy', x, y, DUMMY_GLYPH);
}
