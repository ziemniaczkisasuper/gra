// Save section 'expedition'. The live state stays in the WeakMap (`getExpedition`).
// This file hydrates that map on load. It does not call `installGeneratedFloor`
// (that would respawn the floor and fight the combat section).
// Register by importing this module once before `loadGame` (main.ts).
import type { GameState } from '../core/game';
import { placePlayer } from '../core/game';
import { setCell } from '../entities/entity';
import type { FloorOffer } from '../inventory/inventory';
import { SaveError, SAVE_LIMITS } from '../save/schema';
import { registerSaveSection } from '../save/sections';
import { parseMap } from '../world/tilemap';
import { freshExpedition, getExpedition, type ExpeditionState, type LiftPhase } from './state';
import { isZoneDepth, type ZoneDepth } from './timing';

export const EXPEDITION_SECTION = 'expedition';

interface SavedCell {
  x: number;
  y: number;
}

interface ExpeditionSave {
  v: 1;
  active: boolean;
  depth: ZoneDepth;
  expSeed: number;
  nonce: number;
  stops: ZoneDepth[];
  inArena: boolean;
  arenaShaftOpen: boolean;
  hiddenShaft: SavedCell | null;
  entry: SavedCell | null;
  rows: string[] | null;
  shafts: SavedCell[];
  lift: {
    phase: LiftPhase;
    toZone: boolean;
    focus: ZoneDepth;
    ms: number;
    destination: ZoneDepth;
  };
  player: SavedCell;
  opened: string[];
  piles: { key: string; offer: FloorOffer }[];
}

const pilesByState = new WeakMap<GameState, Map<string, FloorOffer>>();
const openedByState = new WeakMap<GameState, Set<string>>();

function pileMap(state: GameState): Map<string, FloorOffer> {
  let map = pilesByState.get(state);
  if (!map) {
    map = new Map();
    pilesByState.set(state, map);
  }
  return map;
}

function openedSet(state: GameState): Set<string> {
  let set = openedByState.get(state);
  if (!set) {
    set = new Set();
    openedByState.set(state, set);
  }
  return set;
}

export function floorKey(x: number, y: number): string {
  return `${x},${y}`;
}

export function getFloorOffer(state: GameState, x: number, y: number): FloorOffer | undefined {
  return pileMap(state).get(floorKey(x, y));
}

export function setFloorOffer(state: GameState, x: number, y: number, offer: FloorOffer): void {
  pileMap(state).set(floorKey(x, y), offer);
}

export function clearFloorOffer(state: GameState, x: number, y: number): void {
  pileMap(state).delete(floorKey(x, y));
}

export function isChestOpened(state: GameState, x: number, y: number): boolean {
  return openedSet(state).has(floorKey(x, y));
}

export function markChestOpened(state: GameState, x: number, y: number): void {
  openedSet(state).add(floorKey(x, y));
}

/** Drop remembered piles and opened chests. A new floor calls this. */
export function clearFloorMemory(state: GameState): void {
  pilesByState.delete(state);
  openedByState.delete(state);
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isCellNum = (v: unknown): v is number =>
  typeof v === 'number' && Number.isInteger(v) && v >= 0 && v <= SAVE_LIMITS.MAX_CELL;

function readCell(raw: unknown, label: string): SavedCell {
  if (!isObj(raw) || !isCellNum(raw.x) || !isCellNum(raw.y)) {
    throw new SaveError(`expedition: bad ${label}`);
  }
  return { x: raw.x, y: raw.y };
}

function readOptionalCell(raw: unknown, label: string): SavedCell | null {
  if (raw === null || raw === undefined) return null;
  return readCell(raw, label);
}

function readDepth(raw: unknown, label: string): ZoneDepth {
  if (typeof raw !== 'number' || !isZoneDepth(raw)) throw new SaveError(`expedition: bad ${label}`);
  return raw;
}

const PHASES = new Set<LiftPhase>(['idle', 'picker', 'ride']);

function readOffer(raw: unknown): FloorOffer {
  if (!isObj(raw) || typeof raw.glyph !== 'string' || [...raw.glyph].length !== 1) {
    throw new SaveError('expedition: bad pile');
  }
  const offer: FloorOffer = { glyph: raw.glyph };
  if (raw.credits !== undefined) {
    if (typeof raw.credits !== 'number' || !Number.isInteger(raw.credits) || raw.credits < 0) {
      throw new SaveError('expedition: bad pile');
    }
    offer.credits = raw.credits;
  }
  if (raw.itemId !== undefined) {
    if (typeof raw.itemId !== 'string' || raw.itemId.length === 0) {
      throw new SaveError('expedition: bad pile');
    }
    offer.itemId = raw.itemId;
  }
  if (raw.count !== undefined) {
    if (typeof raw.count !== 'number' || !Number.isInteger(raw.count) || raw.count < 1) {
      throw new SaveError('expedition: bad pile');
    }
    offer.count = raw.count;
  }
  if (raw.contractId !== undefined) {
    if (typeof raw.contractId !== 'number' || !Number.isInteger(raw.contractId)) {
      throw new SaveError('expedition: bad pile');
    }
    offer.contractId = raw.contractId;
  }
  if (raw.gear !== undefined) {
    if (!isObj(raw.gear)) throw new SaveError('expedition: bad pile');
    const gear = raw.gear;
    const slot = gear.slot;
    if (slot !== 'weapon' && slot !== 'armor' && slot !== 'module' && slot !== 'tool') {
      throw new SaveError('expedition: bad pile');
    }
    const rarity = gear.rarity;
    if (rarity !== 1 && rarity !== 2 && rarity !== 3) throw new SaveError('expedition: bad pile');
    const ilvl = gear.ilvl;
    if (typeof ilvl !== 'number' || !isZoneDepth(ilvl)) throw new SaveError('expedition: bad pile');
    offer.gear = {
      slot,
      rarity,
      ilvl,
      ...(typeof gear.nameId === 'string' ? { nameId: gear.nameId } : {}),
      ...(gear.weaponKind === 'melee' || gear.weaponKind === 'ranged'
        ? { weaponKind: gear.weaponKind }
        : {}),
    };
    if (Array.isArray(gear.affixes)) {
      offer.gear.affixes = gear.affixes.map((affix) => {
        if (!isObj(affix) || typeof affix.id !== 'string' || typeof affix.value !== 'number') {
          throw new SaveError('expedition: bad pile');
        }
        return { id: affix.id, value: affix.value };
      });
    }
    if (
      isObj(gear.base) &&
      typeof gear.base.id === 'string' &&
      typeof gear.base.value === 'number'
    ) {
      offer.gear.base = { id: gear.base.id, value: gear.base.value };
    }
  }
  return offer;
}

function serializeExpedition(state: GameState): ExpeditionSave {
  const ex = getExpedition(state);
  const stops: ZoneDepth[] = [];
  for (const stop of ex.stops) {
    if (isZoneDepth(stop) && !stops.includes(stop)) stops.push(stop);
  }
  if (!stops.includes(1)) stops.unshift(1);
  stops.sort((a, b) => a - b);
  const piles: ExpeditionSave['piles'] = [];
  for (const [key, offer] of pileMap(state)) piles.push({ key, offer });
  return {
    v: 1,
    active: ex.active,
    depth: isZoneDepth(ex.depth) ? ex.depth : 1,
    expSeed: ex.expSeed >>> 0,
    nonce: ex.nonce,
    stops,
    inArena: ex.inArena,
    arenaShaftOpen: ex.arenaShaftOpen,
    hiddenShaft: ex.hiddenShaft ? { ...ex.hiddenShaft } : null,
    entry: ex.entry ? { ...ex.entry } : null,
    rows: ex.rows ? ex.rows.map((row) => row) : null,
    shafts: ex.shafts.map((cell) => ({ ...cell })),
    lift: {
      phase: ex.lift.phase,
      toZone: ex.lift.toZone,
      focus: isZoneDepth(ex.lift.focus) ? ex.lift.focus : 1,
      ms: ex.lift.ms,
      destination: isZoneDepth(ex.lift.destination) ? ex.lift.destination : 1,
    },
    player: { x: state.player.x, y: state.player.y },
    opened: [...openedSet(state)],
    piles,
  };
}

function deserializeExpedition(raw: unknown): ExpeditionSave {
  if (!isObj(raw)) throw new SaveError('expedition: not an object');
  if (raw.v !== 1) throw new SaveError(`expedition: unsupported version ${String(raw.v)}`);
  if (typeof raw.active !== 'boolean') throw new SaveError('expedition: bad active');
  const depth = readDepth(raw.depth, 'depth');
  if (typeof raw.expSeed !== 'number' || !Number.isInteger(raw.expSeed) || raw.expSeed < 0) {
    throw new SaveError('expedition: bad expSeed');
  }
  if (typeof raw.nonce !== 'number' || !Number.isInteger(raw.nonce) || raw.nonce < 0) {
    throw new SaveError('expedition: bad nonce');
  }
  if (!Array.isArray(raw.stops)) throw new SaveError('expedition: bad stops');
  const stops: ZoneDepth[] = [];
  for (const stop of raw.stops) {
    const d = readDepth(stop, 'stop');
    if (stops.includes(d)) throw new SaveError('expedition: duplicate stop');
    stops.push(d);
  }
  stops.sort((a, b) => a - b);
  if (!stops.includes(1)) throw new SaveError('expedition: stop 1 missing');
  if (typeof raw.inArena !== 'boolean') throw new SaveError('expedition: bad inArena');
  if (typeof raw.arenaShaftOpen !== 'boolean')
    throw new SaveError('expedition: bad arenaShaftOpen');
  const hiddenShaft = readOptionalCell(raw.hiddenShaft, 'hiddenShaft');
  const entry = readOptionalCell(raw.entry, 'entry');
  let rows: string[] | null = null;
  if (raw.rows !== null && raw.rows !== undefined) {
    if (!Array.isArray(raw.rows) || raw.rows.length > 256)
      throw new SaveError('expedition: bad rows');
    rows = [];
    for (const row of raw.rows) {
      if (typeof row !== 'string' || row.length > 512) throw new SaveError('expedition: bad rows');
      rows.push(row);
    }
  }
  if (!Array.isArray(raw.shafts)) throw new SaveError('expedition: bad shafts');
  const shafts = raw.shafts.map((cell) => readCell(cell, 'shaft'));
  if (!isObj(raw.lift) || !PHASES.has(raw.lift.phase as LiftPhase)) {
    throw new SaveError('expedition: bad lift');
  }
  if (typeof raw.lift.toZone !== 'boolean') throw new SaveError('expedition: bad lift');
  if (typeof raw.lift.ms !== 'number' || raw.lift.ms < 0)
    throw new SaveError('expedition: bad lift');
  const lift = {
    phase: raw.lift.phase as LiftPhase,
    toZone: raw.lift.toZone,
    focus: readDepth(raw.lift.focus, 'lift focus'),
    ms: raw.lift.ms,
    destination: readDepth(raw.lift.destination, 'lift destination'),
  };
  const player = readCell(raw.player, 'player');
  const opened: string[] = [];
  if (raw.opened !== undefined) {
    if (!Array.isArray(raw.opened)) throw new SaveError('expedition: bad opened');
    for (const key of raw.opened) {
      if (typeof key !== 'string' || !/^\d+,\d+$/.test(key))
        throw new SaveError('expedition: bad opened');
      opened.push(key);
    }
  }
  const piles: ExpeditionSave['piles'] = [];
  if (raw.piles !== undefined) {
    if (!Array.isArray(raw.piles)) throw new SaveError('expedition: bad piles');
    for (const pile of raw.piles) {
      if (!isObj(pile) || typeof pile.key !== 'string' || !/^\d+,\d+$/.test(pile.key)) {
        throw new SaveError('expedition: bad pile');
      }
      piles.push({ key: pile.key, offer: readOffer(pile.offer) });
    }
  }
  return {
    v: 1,
    active: raw.active,
    depth,
    expSeed: raw.expSeed >>> 0,
    nonce: raw.nonce,
    stops,
    inArena: raw.inArena,
    arenaShaftOpen: raw.arenaShaftOpen,
    hiddenShaft,
    entry,
    rows,
    shafts,
    lift,
    player,
    opened,
    piles,
  };
}

function rememberShafts(state: GameState, ex: ExpeditionState): void {
  const shafts: SavedCell[] = [];
  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      if (state.map.tile(x, y) === '<') shafts.push({ x, y });
    }
  }
  ex.shafts = shafts;
}

function applyExpedition(state: GameState, saved: ExpeditionSave): void {
  const ex = getExpedition(state);
  const fresh = freshExpedition();
  ex.active = saved.active;
  ex.depth = saved.depth;
  ex.expSeed = saved.expSeed;
  ex.nonce = saved.nonce;
  ex.stops = [...saved.stops];
  ex.inArena = saved.inArena;
  ex.arenaShaftOpen = saved.arenaShaftOpen;
  ex.hiddenShaft = saved.hiddenShaft ? { ...saved.hiddenShaft } : null;
  ex.entry = saved.entry ? { ...saved.entry } : null;
  ex.rows = saved.rows ? saved.rows.map((row) => row) : null;
  ex.shafts = saved.shafts.map((cell) => ({ ...cell }));
  ex.lift = { ...saved.lift };
  ex.evac = { ...fresh.evac };
  ex.confirm = null;
  ex.worldPaused = false;
  ex.pauseRequested = false;
  ex.descentLatch = false;
  ex.hud = null;
  ex.notices = [];
  ex.pending = [];
  ex.alarmIds = [];
  if (saved.rows && saved.rows.length > 0) {
    const parsed = parseMap(saved.rows);
    state.map = parsed.map;
    const px = saved.player.x;
    const py = saved.player.y;
    if (!placePlayer(state, px, py, { ignoreEntities: true })) setCell(state.player, px, py);
    rememberShafts(state, ex);
  }
  // A restored zone must not finish a stale outbound ride and rebuild the floor.
  if (
    state.mode === 'zone' ||
    state.mode === 'base' ||
    state.mode === 'report' ||
    state.mode === 'death'
  ) {
    ex.lift.phase = 'idle';
    ex.lift.toZone = false;
    ex.lift.ms = 0;
  }
  const opened = openedSet(state);
  opened.clear();
  for (const key of saved.opened) opened.add(key);
  const piles = pileMap(state);
  piles.clear();
  for (const pile of saved.piles) piles.set(pile.key, pile.offer);
}

function freshSave(): ExpeditionSave {
  return {
    v: 1,
    active: false,
    depth: 1,
    expSeed: 0,
    nonce: 0,
    stops: [1],
    inArena: false,
    arenaShaftOpen: false,
    hiddenShaft: null,
    entry: null,
    rows: null,
    shafts: [],
    lift: { phase: 'idle', toZone: false, focus: 1, ms: 0, destination: 1 },
    player: { x: 0, y: 0 },
    opened: [],
    piles: [],
  };
}

export const unregisterExpeditionSave = registerSaveSection<ExpeditionSave>(EXPEDITION_SECTION, {
  serialize: (state) => serializeExpedition(state),
  deserialize: (raw) => deserializeExpedition(raw),
  fresh: () => freshSave(),
  apply: (state, value) => applyExpedition(state, value),
});
