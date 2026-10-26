// Save section 'progress' (save v3 section registry, save/sections.ts). Registered as a SIDE
// EFFECT at module top level – import this file once before the save is loaded/parsed
// (host: `import './progress/save';` next to the other module installs), otherwise parseSave()
// drops the section as unknown. No apply(): the value lands in state.sections.progress.
//
// `riskExplainerSeen`, `prologue`, `prologueBuilt`, and `tutSeen` live in this section.
// Missing keys on an older blob default so a v3 progress section still loads.
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
  riskExplainerSeen: boolean;
  prologue: boolean;
  prologueBuilt: boolean;
  tutSeen: string[];
}

/** Pure JSON copy (v: 1), including the explainer and prologue flags. */
export function serializeNetworkProgress(progress: NetworkProgress): NetworkProgressSave {
  return {
    v: 1,
    solved: [...progress.solved],
    stops: [...progress.stops],
    lights: progress.lights,
    bossFragment: progress.bossFragment,
    mk2Announced: progress.mk2Announced,
    riskExplainerSeen: progress.riskExplainerSeen,
    prologue: progress.prologue,
    prologueBuilt: progress.prologueBuilt,
    tutSeen: [...progress.tutSeen],
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
  const riskExplainerSeen = raw.riskExplainerSeen === undefined ? false : raw.riskExplainerSeen;
  const prologue = raw.prologue === undefined ? false : raw.prologue;
  const prologueBuilt = raw.prologueBuilt === undefined ? false : raw.prologueBuilt;
  if (typeof riskExplainerSeen !== 'boolean')
    throw new SaveError('progress: bad riskExplainerSeen');
  if (typeof prologue !== 'boolean') throw new SaveError('progress: bad prologue');
  if (typeof prologueBuilt !== 'boolean') throw new SaveError('progress: bad prologueBuilt');
  const tutSeen: string[] = [];
  if (raw.tutSeen !== undefined) {
    if (!Array.isArray(raw.tutSeen)) throw new SaveError('progress: bad tutSeen');
    for (const id of raw.tutSeen) {
      if (typeof id !== 'string' || id.length === 0 || id.length > 32) {
        throw new SaveError('progress: bad tutSeen');
      }
      if (!tutSeen.includes(id)) tutSeen.push(id);
    }
  }
  return {
    solved,
    stops,
    lights: raw.lights as LightsLevel,
    bossFragment: raw.bossFragment,
    mk2Announced: raw.mk2Announced,
    riskExplainerSeen,
    prologue,
    prologueBuilt,
    tutSeen,
  };
}

export const unregisterProgressSave = registerSaveSection<NetworkProgress>(PROGRESS_SECTION, {
  serialize: (state) => serializeNetworkProgress(getNetworkProgress(state)),
  deserialize: (raw) => deserializeNetworkProgress(raw),
  fresh: () => createNetworkProgress(),
});
