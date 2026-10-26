// Install a generated floor or the fixed boss arena onto a GameState.
// The generator's entry `@` is the design's W. Depth 3's descent target is the arena
// (level-m1.md: gate `G`, fixed map ARENA_M1), not another generated floor.
import { peekCombat, setCombatProfile, spawnEnemy } from '../combat/combat';
import { spawnBoss } from '../combat/boss';
import { contractsForLevel } from '../contracts/run';
import { placePlayer, resetPlayerMoveMemory, type GameState } from '../core/game';
import { setCell } from '../entities/entity';
import { PROGRESS_SECTION, type NetworkProgress } from '../progress/network';
import { ARENA_M1 } from '../world/levelgen/fixed-maps';
import { generateLevel } from '../world/levelgen/generate';
import { isEnemyGlyph } from '../world/levelgen/enemy-spawn';
import { parseMap } from '../world/tilemap';
import type { ExpeditionState } from './state';
import { isZoneDepth, type ZoneDepth } from './timing';

export interface Cell {
  x: number;
  y: number;
}

export function findChar(rows: readonly string[], ch: string): Cell | null {
  for (let y = 0; y < rows.length; y++) {
    const x = rows[y]!.indexOf(ch);
    if (x >= 0) return { x, y };
  }
  return null;
}

function wipeActors(state: GameState): void {
  const combat = peekCombat(state);
  if (combat) {
    combat.enemies.clear();
    combat.boss = null;
    combat.drone = null;
    combat.projectiles = [];
    combat.death = null;
    combat.floats = [];
    combat.events = [];
    combat.fxIds.clear();
    combat.strikes.clear();
  }
  state.entities.length = 0;
}

function rememberShafts(state: GameState, ex: ExpeditionState): void {
  const shafts: Cell[] = [];
  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      if (state.map.tile(x, y) === '<') shafts.push({ x, y });
    }
  }
  ex.shafts = shafts;
}

function adoptMap(
  state: GameState,
  ex: ExpeditionState,
  rows: readonly string[],
  entry: Cell,
  depth: ZoneDepth,
): void {
  wipeActors(state);
  ex.rows = rows.map((row) => row);
  const parsed = parseMap(ex.rows);
  state.map = parsed.map;
  if (!placePlayer(state, entry.x, entry.y, { ignoreEntities: true })) {
    setCell(state.player, entry.x, entry.y);
  }
  state.player.moveCooldown = 0;
  state.player.attackWindup = 0;
  state.player.attackCooldown = 0;
  resetPlayerMoveMemory(state);
  ex.entry = { x: entry.x, y: entry.y };
  ex.depth = depth;
  ex.descentLatch = false;
  ex.confirm = null;
  ex.worldPaused = false;
  ex.hud = null;
  ex.alarmIds = [];
  setCombatProfile(state, 'm1', depth, { playerSpawn: { ...ex.entry } });
  rememberShafts(state, ex);
}

const contractEnemies = new WeakMap<GameState, Map<number, number>>();
const floorContracts = new WeakMap<GameState, Map<string, number>>();

/** Contract id tagged on a spawned enemy, or null for pool enemies and boss drones. */
export function contractEnemyId(state: GameState, enemyId: number): number | null {
  return contractEnemies.get(state)?.get(enemyId) ?? null;
}

/** Data Core `§` placed for a contract. Null when the cell is an ordinary pickup. */
export function floorContractId(state: GameState, x: number, y: number): number | null {
  return floorContracts.get(state)?.get(`${x},${y}`) ?? null;
}

function clearContractTags(state: GameState): void {
  contractEnemies.delete(state);
  floorContracts.delete(state);
}

function rememberContractEnemy(state: GameState, enemyId: number, contractId: number): void {
  let map = contractEnemies.get(state);
  if (!map) {
    map = new Map();
    contractEnemies.set(state, map);
  }
  map.set(enemyId, contractId);
}

function storedProgress(state: GameState): NetworkProgress | null {
  const raw = state.sections[PROGRESS_SECTION];
  if (!raw || typeof raw !== 'object') return null;
  const progress = raw as NetworkProgress;
  if (!Array.isArray(progress.stops) || typeof progress.prologue !== 'boolean') return null;
  return progress;
}

/** Generated floor. Enemy glyphs become floor; combat spawns the actors. */
export function installGeneratedFloor(
  state: GameState,
  ex: ExpeditionState,
  depth: ZoneDepth,
  expSeed: number,
): void {
  const progress = storedProgress(state);
  const prologue = depth === 1 && progress?.prologue === true && progress.prologueBuilt !== true;
  const contracts = state.sections.contracts ? contractsForLevel(state, depth) : [];
  const level = generateLevel({
    expSeed,
    depth,
    prologue,
    contracts,
    solvedVariants: progress?.solved ?? [],
  });
  if (progress && prologue) {
    progress.prologue = false;
    progress.prologueBuilt = true;
  }
  const rows = level.rows.map((row) =>
    [...row].map((ch) => (isEnemyGlyph(ch) ? '.' : ch)).join(''),
  );
  ex.expSeed = expSeed;
  ex.inArena = false;
  ex.hiddenShaft = null;
  ex.arenaShaftOpen = false;
  ex.notices = [];
  clearContractTags(state);
  adoptMap(state, ex, rows, level.entry, depth);
  const cores = new Map<string, number>();
  for (const obj of level.contractObjects) {
    if (obj.contractId !== null) cores.set(`${obj.x},${obj.y}`, obj.contractId);
  }
  if (cores.size > 0) floorContracts.set(state, cores);
  for (const enemy of level.enemies) {
    if (!isZoneDepth(enemy.depth)) continue;
    const spawned = spawnEnemy(
      state,
      enemy.type,
      { x: enemy.x, y: enemy.y },
      {
        contract: enemy.contract,
        group: enemy.group,
        depth: enemy.depth,
      },
    );
    if (enemy.contractId !== null) rememberContractEnemy(state, spawned.id, enemy.contractId);
  }
  // Spawning does not add `<`. Rescan in case a shaft glyph survived.
  rememberShafts(state, ex);
}

/**
 * Fixed boss arena. LD letters: `G` gate → floor, `B` boss anchor → floor, `X` hidden
 * shaft → wall until `openArenaShaft`. `@` is the player entry (parseMap).
 */
export function installArena(state: GameState, ex: ExpeditionState): void {
  const boss = findChar(ARENA_M1, 'B');
  const hidden = findChar(ARENA_M1, 'X');
  const entry = findChar(ARENA_M1, '@');
  if (!entry) throw new Error('ARENA_M1 has no player entry');
  const rows = ARENA_M1.map((row) =>
    row.replaceAll('G', '.').replaceAll('B', '.').replaceAll('X', '#'),
  );
  ex.inArena = true;
  ex.hiddenShaft = hidden;
  ex.arenaShaftOpen = false;
  ex.notices = [];
  clearContractTags(state);
  adoptMap(state, ex, rows, entry, 3);
  if (boss) spawnBoss(state, boss);
}

/** Turn the hidden arena shaft (`X`) into `<`. No-op until the arena is installed. */
export function openInstalledShaft(state: GameState, ex: ExpeditionState): boolean {
  if (!ex.hiddenShaft || !ex.rows) return false;
  if (ex.arenaShaftOpen) return true;
  const { x, y } = ex.hiddenShaft;
  const row = ex.rows[y];
  if (!row || x < 0 || x >= row.length) return false;
  ex.rows[y] = row.slice(0, x) + '<' + row.slice(x + 1);
  const parsed = parseMap(ex.rows);
  state.map = parsed.map;
  const px = state.player.x;
  const py = state.player.y;
  if (!placePlayer(state, px, py, { ignoreEntities: true })) setCell(state.player, px, py);
  ex.arenaShaftOpen = true;
  rememberShafts(state, ex);
  return true;
}
