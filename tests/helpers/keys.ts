// Test helper: fake keyboard target + a per-tick driver (keys → InputManager → stepGame).
import { createGame, stepGame, type GameState } from '../../src/core/game';
import { InputManager } from '../../src/input/actions';
import { KeyboardSource, type KeyEventLike, type KeyTarget } from '../../src/input/keyboard';

export class FakeKeys implements KeyTarget {
  private fns: Record<string, ((e: KeyEventLike) => void)[]> = { keydown: [], keyup: [] };
  addEventListener(t: 'keydown' | 'keyup', fn: (e: KeyEventLike) => void) {
    this.fns[t]!.push(fn);
  }
  removeEventListener() {}
  down(code: string) {
    for (const f of this.fns.keydown!) f({ code });
  }
  up(code: string) {
    for (const f of this.fns.keyup!) f({ code });
  }
}

export const OPEN_ROWS = [
  '############',
  '#..........#',
  '#..........#',
  '#.....@....#',
  '#..........#',
  '#..........#',
  '############',
];

/** Game + keyboard; `tick(fn)` runs fn (key events) then one simulation step. */
export function keyGame(rows: readonly string[] = OPEN_ROWS, diagGraceMs?: number) {
  const keys = new FakeKeys();
  const input = new InputManager();
  input.add(new KeyboardSource(keys, undefined, diagGraceMs));
  const g: GameState = createGame({ mapRows: rows });
  const log: { x: number; y: number }[] = [];
  const tick = (fn?: (k: FakeKeys) => void) => {
    fn?.(keys);
    stepGame(g, input.sample(), 50);
    log.push({ x: g.player.x, y: g.player.y });
  };
  const run = (n: number) => {
    for (let i = 0; i < n; i++) tick();
  };
  return { g, keys, tick, run, log };
}
