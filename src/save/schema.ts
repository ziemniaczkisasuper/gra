import { freshRngStates } from '../core/rng';
import { getSaveSection, CORE_SAVE_KEYS } from './sections';

/** Current save schema version. Bump + add a migration when the shape changes. */
export const SAVE_VERSION = 3;

/** Compass facing stored in saves (entity facing {x,y} ↔ string, see save/index.ts). */
export type Facing = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';
export const FACINGS: readonly Facing[] = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

export interface SaveData {
  version: typeof SAVE_VERSION;
  /** Unix ms. */
  savedAt: number;
  /** World seed (uint32). */
  seed: number;
  /** Simulation tick (integer >= 0). */
  tick: number;
  /** Generator states: { default: base generator, <stream name>: state } (uint32 each). */
  rngState: Record<string, number>;
  player: { x: number; y: number; facing: Facing };
  /** Module sections (opaque to the engine, validated by the module's deserialize). */
  combat?: unknown;
  contracts?: unknown;
  [section: string]: unknown;
}

export class SaveError extends Error {
  override name = 'SaveError';
}

type Raw = Record<string, unknown>;
export interface SaveDefaults {
  seed: number;
}

/**
 * Migrations: key = version FROM which the function upgrades (to key + 1).
 * v1 (early M0 draft) had no seed. v2 had no tick / rngState / facing.
 */
export const MIGRATIONS: Record<number, (raw: Raw, defaults: SaveDefaults) => Raw> = {
  1: (raw, d) => ({ ...raw, version: 2, seed: d.seed }),
  2: (raw) => ({
    ...raw,
    version: 3,
    tick: 0,
    rngState: freshRngStates(typeof raw.seed === 'number' ? raw.seed : 0),
    player: { ...(isObj(raw.player) ? raw.player : {}), facing: 'E' },
  }),
};

export const isObj = (v: unknown): v is Raw =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isU32 = (v: unknown): v is number =>
  isNum(v) && Number.isInteger(v) && v >= 0 && v <= 0xffffffff;

export function migrate(input: unknown, defaults: SaveDefaults): Raw {
  if (!isObj(input)) throw new SaveError('Save is not an object');
  let raw: Raw = input;
  let v = raw.version;
  if (!Number.isInteger(v) || (v as number) < 1) throw new SaveError('Missing or bad save version');
  if ((v as number) > SAVE_VERSION)
    throw new SaveError(`Save version ${String(v)} is newer than the game`);
  while ((v as number) < SAVE_VERSION) {
    const m = MIGRATIONS[v as number];
    if (!m) throw new SaveError(`No migration from version ${String(v)}`);
    raw = m(raw, defaults);
    v = raw.version;
  }
  return raw;
}

export interface ValidateOptions {
  /** Called for unknown (unregistered) sections, which are dropped. Default: console.warn. */
  onWarn?: (msg: string) => void;
}

/**
 * Validates a current-version object and returns a clean copy.
 * Core fields are checked here; module sections only need to be objects here and are then
 * checked by the module's own deserialize() – any failure → SaveError (nothing is loaded).
 * Unknown sections (no registered module) are dropped with a warning.
 */
export function validate(raw: Raw, opts: ValidateOptions = {}): SaveData {
  const warn = opts.onWarn ?? ((m: string) => console.warn(m));
  if (raw.version !== SAVE_VERSION) throw new SaveError('Wrong save version');
  if (!isNum(raw.savedAt) || raw.savedAt < 0) throw new SaveError('Bad savedAt');
  if (!isU32(raw.seed)) throw new SaveError('Bad seed');
  if (!isNum(raw.tick) || !Number.isInteger(raw.tick) || raw.tick < 0)
    throw new SaveError('Bad tick');
  const rs = raw.rngState;
  if (!isObj(rs)) throw new SaveError('Bad rngState');
  const rngState: Record<string, number> = {};
  for (const [k, val] of Object.entries(rs)) {
    if (!isU32(val)) throw new SaveError(`Bad rngState.${k}`);
    rngState[k] = val;
  }
  const p = raw.player;
  if (!isObj(p) || !isNum(p.x) || !isNum(p.y)) throw new SaveError('Bad player position');
  if (!FACINGS.includes(p.facing as Facing)) throw new SaveError('Bad player facing');

  const out: SaveData = {
    version: SAVE_VERSION,
    savedAt: raw.savedAt,
    seed: raw.seed,
    tick: raw.tick,
    rngState,
    player: { x: p.x, y: p.y, facing: p.facing as Facing },
  };
  for (const [name, value] of Object.entries(raw)) {
    if (CORE_SAVE_KEYS.has(name)) continue;
    const section = getSaveSection(name);
    if (!section) {
      warn(`Ignoring unknown save section "${name}"`);
      continue;
    }
    if (!isObj(value)) throw new SaveError(`Save section "${name}" is not an object`);
    try {
      section.deserialize(value); // full validation by the module – fail = reject the save
    } catch (e) {
      throw new SaveError(`Save section "${name}" is invalid: ${(e as Error)?.message ?? e}`);
    }
    out[name] = value;
  }
  return out;
}

/** migrate + validate in one call. */
export function parseSave(
  input: unknown,
  defaults: SaveDefaults,
  opts: ValidateOptions = {},
): SaveData {
  return validate(migrate(input, defaults), opts);
}
