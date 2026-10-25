import { DEFAULT_SEED } from '../data/game';
import { ARENA_M0 } from '../data/maps';
import { createDummy } from '../entities/dummy';
import { setCell, tickCounters, type Entity } from '../entities/entity';
import { tryStep } from '../entities/movement';
import { createPlayer, PLAYER_STEP_COSTS, type Player } from '../entities/player';
import { toDir8, type ActionState } from '../input/actions';
import { parseMap, type TileMap } from '../world/tilemap';
import { GameRng } from './rng';

/** Whole simulation state. Pure data + logic: never touches DOM or canvas. */
export interface GameState {
  /** Number of simulation ticks executed. */
  tick: number;
  seed: number;
  /**
   * Game RNG. Use named streams: `state.rng.stream('combat' | 'world' | 'loot' | 'contracts')`.
   * Calling `state.rng.next()/int()` directly (base generator) still works for compatibility,
   * but is TO BE REPLACED by `stream('combat')` in Gameplay.
   */
  rng: GameRng;
  map: TileMap;
  player: Player;
  /** Other entities (enemies, effects...). */
  entities: Entity[];
  /** Loaded save-section values of modules without their own apply() (save/sections.ts). */
  sections: Record<string, unknown>;
}

/** A simulation system (hook for Gameplay: combat, AI...). Mutates state only. */
export type System = (state: GameState, actions: ActionState, dtMs: number) => void;

/**
 * Phases inside one tick (mechaniki 1.1):
 * 'player' – before player movement (e.g. start player attack),
 * 'world'  – after player movement (enemy AI, hit resolution, death, respawn).
 * Counters are decremented after both phases.
 */
export type SystemPhase = 'player' | 'world';

const systems: Record<SystemPhase, System[]> = { player: [], world: [] };

export function registerSystem(s: System, phase: SystemPhase = 'world'): () => void {
  systems[phase].push(s);
  return () => {
    const list = systems[phase];
    const i = list.indexOf(s);
    if (i >= 0) list.splice(i, 1);
  };
}

export interface NewGameOptions {
  seed?: number;
  player?: { x: number; y: number };
  mapRows?: readonly string[];
}

export function createGame(opts: NewGameOptions = {}): GameState {
  const { map, spawns } = parseMap(opts.mapRows ?? ARENA_M0);
  const seed = (opts.seed ?? DEFAULT_SEED) >>> 0;
  const spawn = spawns.find((s) => s.ch === '@') ?? { x: 1, y: 1 };
  const state: GameState = {
    tick: 0,
    seed,
    rng: new GameRng(seed),
    map,
    player: createPlayer(spawn.x, spawn.y),
    entities: spawns.filter((s) => s.ch === 'E').map((s) => createDummy(s.x, s.y)),
    sections: {},
  };
  if (opts.player) placePlayer(state, opts.player.x, opts.player.y);
  return state;
}

export function isOccupied(state: GameState, x: number, y: number, except?: Entity): boolean {
  const p = state.player;
  if (p !== except && p.solid && p.x === x && p.y === y) return true;
  return state.entities.some((e) => e !== except && e.solid && e.x === x && e.y === y);
}

/** Puts the player on a cell if it is free floor; returns false (and keeps spawn) otherwise. */
export function placePlayer(state: GameState, x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (state.map.isSolid(cx, cy) || isOccupied(state, cx, cy, state.player)) return false;
  setCell(state.player, cx, cy);
  return true;
}

/** One fixed simulation tick. */
export function stepGame(state: GameState, actions: ActionState, dtMs: number): void {
  for (const s of systems.player) s(state, actions, dtMs);
  const p = state.player;
  tryStep(p, toDir8(actions.move), state.map, PLAYER_STEP_COSTS, state.tick, (x, y) =>
    isOccupied(state, x, y, p),
  );
  for (const s of systems.world) s(state, actions, dtMs);
  tickCounters(p);
  for (const e of state.entities) tickCounters(e);
  state.tick++;
}
