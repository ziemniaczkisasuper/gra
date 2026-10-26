import { beforeEach, describe, expect, it } from 'vitest';
import { isPlayerEvacuated, setCombatProfile, spawnEnemy } from '../src/combat/combat';
import { createGame, placePlayer, stepGame, type GameState } from '../src/core/game';
import { FX_PARAMS } from '../src/data/fx-params';
import { START_CREDITS } from '../src/data/inventory-m1';
import { emptyActions, type ActionState } from '../src/input/actions';
import {
  addZoneCredits,
  createInventoryState,
  medPatchCountOf,
  setInventory,
} from '../src/inventory/inventory';
import type { InventoryState } from '../src/inventory/types';
import { askBeforeDeeper, setAskBeforeDeeper } from '../src/ui/settings';
import { ARENA_M1 } from '../src/world/levelgen';
import {
  EVAC_ALERT_RADIUS,
  EVAC_CALL_HOLD_MS,
  EVAC_HOLD_MS,
  EVAC_RECALL_COOLDOWN_MS,
  LIFT_DEPART_MS,
  LIFT_RIDE_MS,
  LIFT_RIDE_SKIP_AFTER_MS,
  advanceExpedition,
  armExpedition,
  chooseLiftStop,
  confirmGoDown,
  enemiesInAlarmRadius,
  evacArriveMs,
  finishReport,
  getExpedition,
  openArenaShaft,
  setLiftStops,
  skipReturnRide,
  stayDescent,
  useBaseLift,
  type ZoneDepth,
} from '../src/expedition';
import { startNewGame } from '../src/save';

function actions(partial: Partial<ActionState> = {}): ActionState {
  const base = emptyActions();
  return { ...base, ...partial, move: partial.move ?? base.move };
}

function withRisk(state: GameState, credits = 40): void {
  setInventory(state, addZoneCredits(createInventoryState(), credits).state);
}

function stairsRows(): string[] {
  return ['#######', '#@...>#', '#######'];
}

function gateRows(): string[] {
  return ['#######', '#@...G#', '#######'];
}

function shaftRows(): string[] {
  return ['#####', '#<@.#', '#####'];
}

function alarmRows(): string[] {
  const wall = '#'.repeat(20);
  // x=1 shaft, x=2 player, x=3..18 floor. (13,1) is 12 steps; (14,1) is 13.
  const mid = '#<@' + '.'.repeat(16) + '#';
  const isolated = '###.' + '#'.repeat(16);
  return [wall, mid, wall, isolated, wall];
}

function cellOf(rows: readonly string[], ch: string): { x: number; y: number } {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y]!.indexOf(ch);
    if (x >= 0) return { x, y };
  }
  throw new Error(`missing ${ch}`);
}

function stepOnto(state: GameState): void {
  placePlayer(state, 4, 1);
  stepGame(state, actions({ move: { x: 1, y: 0 }, digitalMove: true }), 50);
}

beforeEach(() => {
  setAskBeforeDeeper(true);
});

describe('expedition timings', () => {
  it('matches FX_PARAMS', () => {
    expect(LIFT_RIDE_MS).toBe(2000);
    expect(LIFT_DEPART_MS).toBe(1000);
    expect(LIFT_RIDE_SKIP_AFTER_MS).toBe(500);
    expect(EVAC_CALL_HOLD_MS).toBe(1000);
    expect(EVAC_HOLD_MS).toBe(10_000);
    expect(EVAC_RECALL_COOLDOWN_MS).toBe(5000);
    expect(EVAC_ALERT_RADIUS).toBe(12);
    expect(FX_PARAMS.LIFT_RIDE_MS.value).toBe(LIFT_RIDE_MS);
    expect(FX_PARAMS.LIFT_DEPART_MS.value).toBe(LIFT_DEPART_MS);
    expect(FX_PARAMS.LIFT_RIDE_SKIP_AFTER_MS.value).toBe(LIFT_RIDE_SKIP_AFTER_MS);
    expect(FX_PARAMS.EVAC_CALL_HOLD_MS.value).toBe(EVAC_CALL_HOLD_MS);
    expect(FX_PARAMS.EVAC_HOLD_S.value).toBe(EVAC_HOLD_MS / 1000);
    expect(FX_PARAMS.EVAC_RECALL_COOLDOWN_S.value).toBe(EVAC_RECALL_COOLDOWN_MS / 1000);
    expect(FX_PARAMS.EVAC_ALERT_RADIUS.value).toBe(EVAC_ALERT_RADIUS);
    expect(evacArriveMs(1)).toBe(5000);
    expect(evacArriveMs(2)).toBe(7000);
    expect(evacArriveMs(3)).toBe(9000);
  });
});

describe('lift from base', () => {
  it('rides 2000 ms to depth 1 and stands on W', () => {
    const g = startNewGame({ seed: 11 });
    useBaseLift(g);
    expect(g.mode).toBe('lift');
    expect(skipReturnRide(g)).toBe(false);
    advanceExpedition(g, LIFT_RIDE_MS - 1);
    expect(g.mode).toBe('lift');
    advanceExpedition(g, 1);
    const ex = getExpedition(g);
    expect(g.mode).toBe('zone');
    expect(ex.depth).toBe(1);
    expect(ex.rows && ex.rows.length).toBeGreaterThan(0);
    expect(ex.entry).not.toBeNull();
    expect(g.player.x).toBe(ex.entry!.x);
    expect(g.player.y).toBe(ex.entry!.y);
    expect(g.map.tile(g.player.x, g.player.y)).not.toBe('#');
  });

  it('shows a stop choice and arrives at the chosen depth', () => {
    const g = startNewGame({ seed: 12 });
    setLiftStops(g, [1, 2]);
    useBaseLift(g);
    const ex = getExpedition(g);
    expect(g.mode).toBe('lift');
    expect(ex.lift.phase).toBe('picker');
    expect(ex.stops).toEqual([1, 2]);
    expect(chooseLiftStop(g, 2)).toBe(true);
    expect(ex.lift.destination).toBe(2);
    advanceExpedition(g, LIFT_RIDE_MS);
    expect(g.mode).toBe('zone');
    expect(ex.depth).toBe(2);
    expect(g.player.x).toBe(ex.entry!.x);
    expect(g.player.y).toBe(ex.entry!.y);
  });
});

describe('descent confirm', () => {
  it('asks when AT RISK > 0, STAY stays put, GO DOWN builds the next depth', () => {
    const store = {
      getItem: () => null,
      setItem: () => undefined,
      removeItem: () => undefined,
      clear: () => undefined,
      key: () => null,
      length: 0,
    } satisfies Storage;
    expect(askBeforeDeeper(store)).toBe(true);

    const g = createGame({ mapRows: stairsRows(), seed: 21 });
    const ex = armExpedition(g);
    withRisk(g, 40);
    stepOnto(g);
    expect(g.player.x).toBe(5);
    expect(g.player.y).toBe(1);
    expect(g.map.tile(5, 1)).toBe('>');
    expect(ex.confirm).toMatchObject({
      kind: 'stairs',
      textId: 'M1_RISK_01',
      yesId: 'M1_RISK_01_YES',
      noId: 'M1_RISK_01_NO',
      focus: 'stay',
    });
    expect(ex.worldPaused).toBe(true);
    expect(ex.inputsCleared).toBe(true);
    expect(ex.depth).toBe(1);
    const tick = g.tick;
    stepGame(g, actions(), 50);
    expect(g.tick).toBe(tick);
    expect(g.player.x).toBe(5);
    expect(g.player.y).toBe(1);

    stayDescent(g);
    expect(ex.confirm).toBeNull();
    expect(ex.depth).toBe(1);
    expect(g.player.x).toBe(5);
    expect(g.player.y).toBe(1);
    expect(g.mode).toBe('zone');

    stepGame(g, actions(), 50);
    expect(ex.confirm).toBeNull();
    stepGame(g, actions({ use: true }), 50);
    expect(ex.confirm?.focus).toBe('stay');

    const seedBefore = ex.expSeed;
    confirmGoDown(g);
    expect(ex.confirm).toBeNull();
    expect(ex.depth).toBe(2);
    expect(ex.expSeed).not.toBe(seedBefore);
    expect(ex.entry).not.toBeNull();
    expect(g.player.x).toBe(ex.entry!.x);
    expect(g.player.y).toBe(ex.entry!.y);
    expect(g.mode).toBe('zone');
  });

  it('skips the confirm when the setting is off', () => {
    setAskBeforeDeeper(false);
    expect(askBeforeDeeper()).toBe(false);
    const g = createGame({ mapRows: stairsRows(), seed: 22 });
    const ex = armExpedition(g);
    withRisk(g, 40);
    stepOnto(g);
    expect(ex.confirm).toBeNull();
    expect(ex.depth).toBe(2);
    expect(g.player.x).toBe(ex.entry!.x);
    expect(g.player.y).toBe(ex.entry!.y);
  });

  it('uses the arena gate copy and opens the hidden shaft after the boss', () => {
    const g = createGame({ mapRows: gateRows(), seed: 23 });
    const ex = armExpedition(g);
    ex.depth = 3;
    withRisk(g);
    expect(openArenaShaft(g)).toBe(false);
    stepOnto(g);
    expect(ex.confirm).toMatchObject({
      kind: 'gate',
      textId: 'M1_RISK_01B',
      yesId: 'M1_RISK_01B_YES',
      focus: 'stay',
    });
    stayDescent(g);
    expect(ex.inArena).toBe(false);
    expect(ex.depth).toBe(3);
    expect(g.player.x).toBe(5);
    expect(g.player.y).toBe(1);
    stepGame(g, actions({ use: true }), 50);
    confirmGoDown(g);
    expect(ex.inArena).toBe(true);
    expect(ex.depth).toBe(3);
    const entry = cellOf(ARENA_M1, '@');
    const hidden = cellOf(ARENA_M1, 'X');
    expect(g.player.x).toBe(entry.x);
    expect(g.player.y).toBe(entry.y);
    expect(g.map.tile(hidden.x, hidden.y)).toBe('#');
    expect(openArenaShaft(g)).toBe(true);
    expect(g.map.tile(hidden.x, hidden.y)).toBe('<');
    expect(openArenaShaft(g)).toBe(true);
  });
});

describe('evacuation', () => {
  it('completes a 1000 ms hold; movement cancels it and damage does not', () => {
    const held = createGame({ mapRows: shaftRows(), seed: 31 });
    armExpedition(held);
    advanceExpedition(held, EVAC_CALL_HOLD_MS - 1, actions({ use: true }));
    expect(getExpedition(held).evac.phase).toBe('calling');
    advanceExpedition(held, 1, actions({ use: true }));
    expect(getExpedition(held).evac.phase).toBe('arriving');
    expect(getExpedition(held).hud).toEqual({ textId: 'M1_UI_LIFT_COMING', seconds: 5 });

    const moved = createGame({ mapRows: shaftRows(), seed: 32 });
    armExpedition(moved);
    advanceExpedition(moved, 400, actions({ use: true }));
    advanceExpedition(moved, 50, actions({ use: true, move: { x: 0, y: 1 } }));
    expect(getExpedition(moved).evac.phase).toBe('idle');
    expect(getExpedition(moved).evac.lastInterrupt).toBe('move');
    advanceExpedition(moved, EVAC_CALL_HOLD_MS, actions({ use: true }));
    expect(getExpedition(moved).evac.phase).toBe('arriving');

    const hurt = createGame({ mapRows: shaftRows(), seed: 33 });
    armExpedition(hurt);
    advanceExpedition(hurt, 400, actions({ use: true }));
    advanceExpedition(hurt, 100, actions({ use: true }), { playerDamaged: true });
    expect(getExpedition(hurt).evac.phase).toBe('calling');
    expect(getExpedition(hurt).evac.holdMs).toBe(500);
    expect(getExpedition(hurt).evac.lastInterrupt).toBeNull();
    advanceExpedition(hurt, 500, actions({ use: true }), { playerDamaged: true });
    expect(getExpedition(hurt).evac.phase).toBe('arriving');

    const released = createGame({ mapRows: shaftRows(), seed: 34 });
    armExpedition(released);
    advanceExpedition(released, 400, actions({ use: true }));
    advanceExpedition(released, 50, actions());
    expect(getExpedition(released).evac.lastInterrupt).toBe('release');

    const attacked = createGame({ mapRows: shaftRows(), seed: 35 });
    armExpedition(attacked);
    advanceExpedition(attacked, 400, actions({ use: true }));
    advanceExpedition(attacked, 50, actions({ use: true, attack: true }));
    expect(getExpedition(attacked).evac.lastInterrupt).toBe('attack');

    const skilled = createGame({ mapRows: shaftRows(), seed: 36 });
    armExpedition(skilled);
    advanceExpedition(skilled, 400, actions({ use: true }));
    advanceExpedition(skilled, 50, actions({ use: true, skill2: true }));
    expect(getExpedition(skilled).evac.lastInterrupt).toBe('skill');
  });

  it('arrives in 5/7/9 s and alarms exactly the enemies inside 12 BFS', () => {
    const passable = (x: number, y: number) => y === 1 && x >= 2 && x <= 18;
    expect(
      enemiesInAlarmRadius(20, 5, passable, { x: 1, y: 1 }, [
        { id: 1, x: 13, y: 1 },
        { id: 2, x: 14, y: 1 },
        { id: 3, x: 3, y: 3 },
      ]),
    ).toEqual([1]);

    const seconds: Record<ZoneDepth, number> = { 1: 5, 2: 7, 3: 9 };
    for (const depth of [1, 2, 3] as const) {
      const g = createGame({ mapRows: shaftRows(), seed: 40 + depth });
      const ex = armExpedition(g);
      ex.depth = depth;
      advanceExpedition(g, EVAC_CALL_HOLD_MS, actions({ use: true }));
      expect(ex.evac.phase).toBe('arriving');
      expect(ex.evac.msLeft).toBe(evacArriveMs(depth));
      expect(ex.hud).toEqual({ textId: 'M1_UI_LIFT_COMING', seconds: seconds[depth] });
      advanceExpedition(g, evacArriveMs(depth) - 1, actions());
      expect(ex.evac.phase).toBe('arriving');
      advanceExpedition(g, 1, actions());
      expect(ex.evac.phase).toBe('open');
      expect(ex.notices).toEqual(['M1_BASE_06', 'M1_SYS_05']);
      expect(ex.hud).toEqual({ textId: 'M1_UI_LIFT_HERE', seconds: 10 });
    }

    const g = createGame({ mapRows: alarmRows(), seed: 44 });
    const ex = armExpedition(g);
    setCombatProfile(g, 'm1', 1, { playerSpawn: { x: g.player.x, y: g.player.y } });
    const near = spawnEnemy(g, 'scrapper', { x: 13, y: 1 });
    const far = spawnEnemy(g, 'scrapper', { x: 14, y: 1 });
    const blocked = spawnEnemy(g, 'scrapper', { x: 3, y: 3 });
    const expected = enemiesInAlarmRadius(
      g.map.width,
      g.map.height,
      (x, y) => g.map.tile(x, y) !== '<' && !g.map.isSolid(x, y),
      { x: 1, y: 1 },
      [
        { id: near.id, x: 13, y: 1 },
        { id: far.id, x: 14, y: 1 },
        { id: blocked.id, x: 3, y: 3 },
      ],
    );
    advanceExpedition(g, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    expect(ex.evac.phase).toBe('open');
    expect(ex.alarmIds).toEqual(expected);
    expect(ex.alarmIds).toContain(near.id);
    expect(ex.alarmIds).not.toContain(far.id);
    expect(ex.alarmIds).not.toContain(blocked.id);
  });

  it('boards, departs, rides, skips after 500 ms, and blocks recall for 5 s', () => {
    const g = createGame({ mapRows: shaftRows(), seed: 51 });
    const ex = armExpedition(g);
    advanceExpedition(g, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    expect(ex.evac.phase).toBe('open');
    const shaft = ex.shafts[0]!;
    placePlayer(g, shaft.x, shaft.y);
    advanceExpedition(g, 0, actions());
    expect(ex.evac.phase).toBe('cabin');
    expect(ex.evac.msLeft).toBe(LIFT_DEPART_MS);
    expect(isPlayerEvacuated(g)).toBe(true);
    advanceExpedition(g, LIFT_DEPART_MS, actions());
    expect(ex.evac.phase).toBe('ride');
    expect(g.mode).toBe('lift');
    expect(ex.rideTextId).toBe('M1_BASE_05');
    advanceExpedition(g, LIFT_RIDE_SKIP_AFTER_MS - 1, actions());
    expect(skipReturnRide(g)).toBe(false);
    expect(g.mode).toBe('lift');
    advanceExpedition(g, 1, actions());
    expect(skipReturnRide(g)).toBe(true);
    expect(g.mode).toBe('report');
    finishReport(g);
    expect(g.mode).toBe('base');

    const full = createGame({ mapRows: shaftRows(), seed: 52 });
    const fullEx = armExpedition(full);
    advanceExpedition(full, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    placePlayer(full, fullEx.shafts[0]!.x, fullEx.shafts[0]!.y);
    advanceExpedition(full, LIFT_DEPART_MS, actions());
    expect(fullEx.evac.phase).toBe('ride');
    advanceExpedition(full, LIFT_RIDE_MS - 1, actions());
    expect(full.mode).toBe('lift');
    advanceExpedition(full, 1, actions());
    expect(full.mode).toBe('report');

    const late = createGame({ mapRows: shaftRows(), seed: 53 });
    const lateEx = armExpedition(late);
    advanceExpedition(late, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    expect(lateEx.evac.phase).toBe('open');
    advanceExpedition(late, EVAC_HOLD_MS, actions({ use: true }));
    expect(lateEx.evac.phase).toBe('cooldown');
    expect(lateEx.notices).toEqual(['M1_BASE_07']);
    expect(lateEx.evac.msLeft).toBe(EVAC_RECALL_COOLDOWN_MS);
    advanceExpedition(late, 1000, actions({ use: true }));
    expect(lateEx.evac.phase).toBe('cooldown');
    expect(lateEx.evac.msLeft).toBe(EVAC_RECALL_COOLDOWN_MS - 1000);
    advanceExpedition(late, EVAC_RECALL_COOLDOWN_MS - 1000, actions({ use: true }));
    expect(lateEx.evac.phase).toBe('idle');
    advanceExpedition(late, 1, actions({ use: true }));
    expect(lateEx.evac.phase).toBe('calling');
  });

  it('calls onEvacuated when inventory exists and ends in report', () => {
    const g = createGame({ mapRows: shaftRows(), seed: 61 });
    const inv = addZoneCredits(createInventoryState(), 25).state;
    setInventory(g, inv);
    const ex = armExpedition(g);
    advanceExpedition(g, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    placePlayer(g, ex.shafts[0]!.x, ex.shafts[0]!.y);
    advanceExpedition(g, LIFT_DEPART_MS + LIFT_RIDE_MS, actions());
    expect(g.mode).toBe('report');
    const after = g.sections.inventory as InventoryState;
    expect(after.zoneCr).toBe(0);
    expect(after.baseCr).toBe(START_CREDITS + 25);
    expect(after.location).toBe('base');
    expect(medPatchCountOf(after)).toBe(2);

    const lit = createGame({ mapRows: shaftRows(), seed: 62 });
    setInventory(lit, createInventoryState());
    lit.sections.progress = { lights: 1 };
    const litEx = armExpedition(lit);
    advanceExpedition(lit, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    placePlayer(lit, litEx.shafts[0]!.x, litEx.shafts[0]!.y);
    advanceExpedition(lit, LIFT_DEPART_MS + LIFT_RIDE_MS, actions());
    expect(medPatchCountOf(lit.sections.inventory as InventoryState)).toBe(3);
    expect(g.mode).toBe('report');

    const bare = createGame({ mapRows: shaftRows(), seed: 63 });
    const bareEx = armExpedition(bare);
    advanceExpedition(bare, EVAC_CALL_HOLD_MS + evacArriveMs(1), actions({ use: true }));
    placePlayer(bare, bareEx.shafts[0]!.x, bareEx.shafts[0]!.y);
    advanceExpedition(bare, LIFT_DEPART_MS + LIFT_RIDE_MS, actions());
    expect(bare.mode).toBe('report');
    expect(bare.sections.inventory).toBeUndefined();
  });
});
