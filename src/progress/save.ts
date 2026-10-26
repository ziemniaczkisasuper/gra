// Save section 'progress' (save v3 section registry, save/sections.ts). Registered as a SIDE
// EFFECT at module top level – import this file once before the save is loaded/parsed
// (host: `import './progress/save';` next to the other module installs), otherwise parseSave()
// drops the section as unknown. No apply(): the value lands in state.sections.progress.
//
// Does not store `riskExplainerSeen`. That flag belongs to another module.
import type { Depth } from '../data/contracts-m1';
import type { LightsLevel } from '../data/inventory-m1';
import { SaveError } from '../save/schema';
import { registerSaveSection } from '../save/sections';
import {
  createNetworkProgress,
  getNetworkProgress,
  isKnownVariant,
  PROGRESS_SECTION,
  type NetworkProgress,
} from './network';

export {
  PROGRESS_SECTION,
  createNetworkProgress,
  getNetworkProgress,
  setNetworkProgress,
} from './network';

export interface NetworkProgressSave {
  v: 1;
  solved: string[];
  stops: Depth[];
  lights: LightsLevel;
  bossFragment: boolean;
  mk2Announced: boolean;
}

/** Pure JSON copy (v: 1). `riskExplainerSeen` is intentionally absent. */
export function serializeNetworkProgress(progress: NetworkProgress): NetworkProgressSave {
  return {
    v: 1,
    solved: [...progress.solved],
    stops: [...progress.stops],
    lights: progress.lights,
    bossFragment: progress.bossFragment,
    mk2Announced: progress.mk2Announced,
  };
}

const isObj = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);

const DEPTHS = new Set([1, 2, 3]);
const LIGHTS = new Set([0, 1, 2, 3]);

/** Validate a saved section. Bad data → SaveError (the whole save is rejected). Pure. */
export function deserializeNetworkProgress(raw: unknown): NetworkProgress {
  if (!isObj(raw)) throw new SaveError('progress: not an object');
  if (raw.v !== 1) throw new SaveError(`progress: unsupported version ${String(raw.v)}`);
  if (!Array.isArray(raw.solved)) throw new SaveError('progress: bad solved');
  const solved: string[] = [];
  for (const id of raw.solved) {
    if (typeof id !== 'string' || !isKnownVariant(id)) throw new SaveError('progress: bad variant');
    if (solved.includes(id)) throw new SaveError('progress: duplicate variant');
    solved.push(id);
  }
  if (!Array.isArray(raw.stops)) throw new SaveError('progress: bad stops');
  const stops: Depth[] = [];
  for (const stop of raw.stops) {
    if (!DEPTHS.has(stop as number)) throw new SaveError('progress: bad stop');
    const depth = stop as Depth;
    if (stops.includes(depth)) throw new SaveError('progress: duplicate stop');
    stops.push(depth);
  }
  stops.sort((a, b) => a - b);
  if (!stops.includes(1)) throw new SaveError('progress: stop 1 missing');
  if (!LIGHTS.has(raw.lights as number)) throw new SaveError('progress: bad lights');
  if (typeof raw.bossFragment !== 'boolean') throw new SaveError('progress: bad bossFragment');
  if (typeof raw.mk2Announced !== 'boolean') throw new SaveError('progress: bad mk2Announced');
  return {
    solved,
    stops,
    lights: raw.lights as LightsLevel,
    bossFragment: raw.bossFragment,
    mk2Announced: raw.mk2Announced,
  };
}

export const unregisterProgressSave = registerSaveSection<NetworkProgress>(PROGRESS_SECTION, {
  serialize: (state) => serializeNetworkProgress(getNetworkProgress(state)),
  deserialize: (raw) => deserializeNetworkProgress(raw),
  fresh: () => createNetworkProgress(),
});
