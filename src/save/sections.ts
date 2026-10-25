import type { GameState } from '../core/game';

/**
 * Save section of a module (combat, contracts, ...). The engine stores the section's JSON
 * under its name at the top level of the save, without looking inside (opaque).
 * - serialize(state): JSON-safe data for the save.
 * - deserialize(raw): validate + convert saved data; THROW on bad data (the whole save is
 *   then rejected – no partial loads).
 * - fresh(): value for a new game / a save without this section.
 * - apply(state, value) (optional): put the value into the new GameState. Without it the
 *   value is stored in `state.sections[name]` for the module to pick up.
 */
export interface SaveSection<T = unknown> {
  serialize(state: GameState): unknown;
  deserialize(raw: unknown): T;
  fresh(): T;
  apply?(state: GameState, value: T): void;
}

/** Top-level keys owned by the engine – not available as section names. */
export const CORE_SAVE_KEYS: ReadonlySet<string> = new Set([
  'version',
  'savedAt',
  'seed',
  'tick',
  'rngState',
  'player',
]);

const sections = new Map<string, SaveSection<unknown>>();

/** Register a module's save section. Returns an unregister function (tests). */
export function registerSaveSection<T>(name: string, section: SaveSection<T>): () => void {
  if (!/^[a-z][a-zA-Z0-9_-]*$/.test(name)) throw new Error(`Bad save section name: ${name}`);
  if (CORE_SAVE_KEYS.has(name)) throw new Error(`Save section name is reserved: ${name}`);
  if (sections.has(name)) throw new Error(`Save section already registered: ${name}`);
  sections.set(name, section as SaveSection<unknown>);
  return () => {
    if (sections.get(name) === section) sections.delete(name);
  };
}

export function getSaveSection(name: string): SaveSection<unknown> | undefined {
  return sections.get(name);
}

export function saveSectionNames(): string[] {
  return [...sections.keys()];
}
