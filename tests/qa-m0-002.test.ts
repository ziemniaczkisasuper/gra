// QA-M0-002 regression (mechaniki §1.2 v0.5): a straight step from standstill starts at once;
// within DIAG_GRACE a perpendicular key turns it into a diagonal (4 ticks from the start).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { getCombat } from '../src/combat/combat';
import { installCombat } from '../src/combat/install';
import { placePlayer } from '../src/core/game';
import { ARENA_M0 } from '../src/data/maps';
import { keyGame } from './helpers/keys';

const WALLS = ['########', '#......#', '#..#...#', '#......#', '#......#', '########'];

describe('QA-M0-002: DIAG_GRACE in the engine', () => {
  it('straight key moves in the first tick (no waiting)', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => t.down('KeyA'));
    expect(k.g.player).toMatchObject({ x: x - 1, y });
  });

  it('perpendicular key within 1 tick → diagonal from the start cell, 4 ticks from the start', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => t.down('KeyW')); // tick 0: straight step up
    expect(k.g.player).toMatchObject({ x, y: y - 1 });
    k.tick((t) => t.down('KeyD')); // tick 1: upgrade
    expect(k.g.player).toMatchObject({ x: x + 1, y: y - 1, moveTick: 0, moveTicks: 4 });
    expect(k.g.player.facing).toEqual({ x: 1, y: -1 });
    k.tick((t) => (t.up('KeyW'), t.up('KeyD'))); // tick 2
    expect(k.g.player.moveCooldown).toBe(1);
    k.tick((t) => t.down('KeyD')); // tick 3: still in the 200 ms step
    expect(k.g.player).toMatchObject({ x: x + 1, y: y - 1 });
    k.tick(); // tick 4: next step (200 ms after the start)
    expect(k.g.player).toMatchObject({ x: x + 2, y: y - 1 });
  });

  it('too late (tick 2) → the straight step stays, the second key acts from the next step', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => t.down('KeyW'));
    k.tick();
    k.tick((t) => t.down('KeyD'));
    expect(k.g.player).toMatchObject({ x, y: y - 1 });
    k.tick(); // tick 3: W+D held → diagonal step
    expect(k.g.player).toMatchObject({ x: x + 1, y: y - 2 });
  });

  it('no upgrade when the diagonal would cut a corner or the cell is a wall', () => {
    const k = keyGame(WALLS);
    placePlayer(k.g, 2, 3); // wall at (3,2)
    k.tick((t) => t.down('KeyD')); // → (3,3)
    k.tick((t) => t.down('KeyW')); // diagonal (3,2) is a wall
    expect(k.g.player).toMatchObject({ x: 3, y: 3 });
    const c = keyGame(WALLS);
    placePlayer(c.g, 2, 2); // up from (2,2) to (2,1), then D: (3,1) free but (3,2) wall = corner
    c.tick((t) => t.down('KeyW'));
    c.tick((t) => t.down('KeyD'));
    expect(c.g.player).toMatchObject({ x: 2, y: 1 });
  });

  it('marching (not from standstill) gets no window', () => {
    const k = keyGame();
    const { x, y } = k.g.player;
    k.tick((t) => t.down('KeyA'));
    k.run(2);
    k.tick(); // tick 3: second step of the march
    expect(k.g.player).toMatchObject({ x: x - 2, y });
    k.tick((t) => t.down('KeyW')); // 1 tick after a march step → no upgrade
    expect(k.g.player).toMatchObject({ x: x - 2, y });
  });
});

describe('QA-M0-002: dodge with a straight step in the last telegraph tick = miss', () => {
  let off: () => void;
  beforeAll(() => {
    off = installCombat();
  });
  afterAll(() => off());

  function untilLastTelegraphTick(stay: boolean) {
    const k = keyGame(ARENA_M0); // real keyboard source (default DIAG_GRACE_MS)
    const c = getCombat(k.g);
    const enemy = k.g.entities.find((e) => c.enemies.has(e.id))!;
    placePlayer(k.g, enemy.x - 1, enemy.y);
    for (let i = 0; i < 200; i++) {
      // strike resolves in the tick that starts with attackWindup === 1 (mechaniki §1.1)
      if (enemy.attackWindup === 1) break;
      k.tick();
    }
    expect(enemy.attackWindup).toBe(1);
    const hp = c.player.hp;
    if (stay) k.tick();
    else k.tick((t) => t.down('KeyA')); // straight step left, from standstill
    return { hp, after: c.player.hp, events: c.events.map((e) => e.type) };
  }

  it('step in the last tick → miss', () => {
    const r = untilLastTelegraphTick(false);
    expect(r.after).toBe(r.hp);
    expect(r.events).not.toContain('playerHit');
  });

  it('control: staying → hit', () => {
    const r = untilLastTelegraphTick(true);
    expect(r.after).toBeLessThan(r.hp);
  });
});
