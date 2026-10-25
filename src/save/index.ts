import { createGame, placePlayer, type GameState, type NewGameOptions } from '../core/game';
import { FACINGS, SAVE_VERSION, SaveError, type Facing, type SaveData } from './schema';
import { getSaveSection, saveSectionNames } from './sections';

export * from './schema';
export * from './storage';
export * from './codec';
export * from './sections';
export * from './reminder';

const FACING_VEC: Record<Facing, { x: number; y: number }> = {
  N: { x: 0, y: -1 },
  NE: { x: 1, y: -1 },
  E: { x: 1, y: 0 },
  SE: { x: 1, y: 1 },
  S: { x: 0, y: 1 },
  SW: { x: -1, y: 1 },
  W: { x: -1, y: 0 },
  NW: { x: -1, y: -1 },
};

export function facingToVec(f: Facing): { x: number; y: number } {
  return { ...FACING_VEC[f] };
}

export function vecToFacing(v: { x: number; y: number }): Facing {
  const sx = Math.sign(v.x);
  const sy = Math.sign(v.y);
  return FACINGS.find((f) => FACING_VEC[f].x === sx && FACING_VEC[f].y === sy) ?? 'E';
}

/** Snapshot of the game state for saving (pure). Includes every registered module section. */
export function snapshot(state: GameState, now: number): SaveData {
  const data: SaveData = {
    version: SAVE_VERSION,
    savedAt: now,
    seed: state.seed,
    tick: state.tick,
    rngState: state.rng.getStates(),
    player: { x: state.player.x, y: state.player.y, facing: vecToFacing(state.player.facing) },
  };
  const m = state.meta;
  data.playtimeMs = m.playtimeMs;
  data.playtimeSinceExportMs = m.playtimeSinceExportMs;
  if (m.lastExportAt !== null) data.lastExportAt = m.lastExportAt;
  if (m.exportReminderSnoozedUntil !== null)
    data.exportReminderSnoozedUntil = m.exportReminderSnoozedUntil;
  if (m.iosHintHiddenUntil !== null) data.iosHintHiddenUntil = m.iosHintHiddenUntil;
  for (const name of saveSectionNames()) data[name] = getSaveSection(name)!.serialize(state);
  return data;
}

function applySections(state: GameState, data: SaveData | null): void {
  for (const name of saveSectionNames()) {
    const section = getSaveSection(name)!;
    const value = data && name in data ? section.deserialize(data[name]) : section.fresh();
    if (section.apply) section.apply(state, value);
    else state.sections[name] = value;
  }
}

/**
 * New GameState from a validated save (or a new game for null): seed, tick, rng streams,
 * player cell + facing, then every registered section (deserialize or fresh → apply).
 * Throws SaveError if a section fails – callers must then keep the old state.
 */
export function gameFromSave(data: SaveData | null, opts: NewGameOptions = {}): GameState {
  if (!data) {
    const g = createGame(opts);
    applySections(g, null);
    return g;
  }
  const g = createGame({ ...opts, seed: data.seed });
  // QA-M0-012: exact saved cell; fallback (map '@') only if that cell is a wall. Static enemy
  // spawns of the map are replaced by the combat section below and must not block it.
  placePlayer(g, data.player.x, data.player.y, { ignoreEntities: true });
  g.player.facing = facingToVec(data.player.facing);
  g.tick = data.tick;
  g.rng.setStates(data.rngState);
  g.meta = {
    playtimeMs: data.playtimeMs ?? 0,
    // older saves: no counter yet → everything played so far counts as "since export"
    playtimeSinceExportMs: data.playtimeSinceExportMs ?? data.playtimeMs ?? 0,
    lastExportAt: data.lastExportAt ?? null,
    exportReminderSnoozedUntil: data.exportReminderSnoozedUntil ?? null,
    iosHintHiddenUntil: data.iosHintHiddenUntil ?? null,
  };
  try {
    applySections(g, data);
  } catch (e) {
    if (e instanceof SaveError) throw e;
    throw new SaveError(`Save section failed to load: ${(e as Error)?.message ?? e}`);
  }
  return g;
}
