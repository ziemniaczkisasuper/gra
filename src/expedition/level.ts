// Install a generated floor or the fixed boss arena onto a GameState.
// The generator's entry `@` is the design's W. Depth 3's descent target is the arena
// (level-m1.md: gate `G`, fixed map ARENA_M1), not another generated floor.
import { peekCombat, setCombatProfile, spawnEnemy } from '../combat/combat';
import { spawnBoss } from '../combat/boss';
import { placePlayer, resetPlayerMoveMemory, type GameState } from '../core/game';
import { setCell } from '../entities/entity';
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

/** Generated floor. Enemy glyphs become floor; combat spawns the actors. */
export function installGeneratedFloor(
  state: GameState,
  ex: ExpeditionState,
  depth: ZoneDepth,
  expSeed: number,
): void {
  const level = generateLevel({ expSeed, depth });
  const rows = level.rows.map((row) =>
    [...row].map((ch) => (isEnemyGlyph(ch) ? '.' : ch)).join(''),
  );
  ex.expSeed = expSeed;
  ex.inArena = false;
  ex.hiddenShaft = null;
  ex.arenaShaftOpen = false;
  ex.notices = [];
  adoptMap(state, ex, rows, level.entry, depth);
  for (const enemy of level.enemies) {
    if (!isZoneDepth(enemy.depth)) continue;
    spawnEnemy(
      state,
      enemy.type,
      { x: enemy.x, y: enemy.y },
      {
        contract: enemy.contract,
        group: enemy.group,
        depth: enemy.depth,
      },
    );
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
