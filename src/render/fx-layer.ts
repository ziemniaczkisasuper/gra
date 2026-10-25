// FX layer – draws the effects from data/fx.ts (graf/assety-m1.md) over the world. LUZ / Pracownik 4.
// Rules (agreed with PROG / Silnik):
// (a) purely visual: reads GameState, never writes it; subscribes to bus events, never emits;
// (b) '{random:…}' uses its own non-saved RNG (never state.rng);
// (c) FX time = render time, frozen while loop.mode is 'paused'; in 'countdown' the last frame
//     stays on screen (clock still frozen);
// (d) honours the Reduce motion setting (ui/settings) – per-effect `reduceMotion` variant;
// (e) parameter durations ('EVAC_ARRIVE_S[depth] × 1000', 'SK3_DRONE_LIFE_MS', …) come from
//     data/fx-params.ts (resolveFxDurationMs), never duplicated here;
// (f) FX state is never saved.
// Sources (walka-m1.md §8): combat triggers come from getCombat(state).events of the last tick and
// from diffs of the combat state (wind-up start / strike, ALERT, Shock, drone life), plus
// getCombatDeath / getBossChargeLane; everything else from the bus (core/events FxTriggerEvents).
// Not drawn here: layer 'screen' (death / lift screens – UI) and fx_float_text (already drawn by
// combat/overlay.ts). Logic-owned results (wrecks '%', `after`, `sideEffects`, `with`) are not FX.
import { enemyDef, getBossChargeLane, peekCombat } from '../combat/combat';
import type { CombatData } from '../combat/state';
import type { EventBus, FxCell, FxTriggerEvents, GameEvents } from '../core/events';
import type { GameState } from '../core/game';
import { Rng } from '../core/rng';
import {
  FX,
  SCREEN_BASE_M1,
  type FxDef,
  type FxFrame,
  type FxReduceMotion,
  type FxTrack,
} from '../data/fx';
import { resolveFxDurationMs } from '../data/fx-params';
import { PALETTE, TILE_GLYPHS, UNKNOWN_GLYPH, type GlyphStyle } from '../data/style';
import type { GlyphRenderer } from './glyph-renderer';

const LAYER_ORDER: Record<string, number> = {
  terrain: 0,
  ground: 10,
  entity: 20,
  cell: 30,
  overlay: 40,
  screen: 50,
};
const SKIP_EFFECTS = new Set(['fx_float_text']);
/** Max FX time step per rendered frame (tab switches, hitches). */
const MAX_DT_MS = 250;

// ---- Pure timing ---------------------------------------------------------------------------------

/** Frame duration in ms; keyword 'durationMs' / runtime keywords → the instance duration. */
export function frameMs(f: FxFrame, durationMs: number): number {
  return typeof f.ms === 'number' ? f.ms : durationMs;
}

/**
 * Frame shown at time t (ms since start). Returns -1 when the track has ended.
 * durationMs = Infinity for runtime-ended tracks (untilNextState, untilWallHit …).
 */
export function frameIndexAt(
  frames: readonly FxFrame[],
  t: number,
  loop: boolean,
  durationMs: number,
): number {
  if (frames.length === 0 || t < 0) return -1;
  if (t >= durationMs) return -1;
  const total = frames.reduce((a, f) => a + frameMs(f, durationMs), 0);
  if (!Number.isFinite(total)) {
    // A frame lasts "the whole duration": walk until the infinite one.
    let acc = 0;
    for (let i = 0; i < frames.length; i++) {
      const d = frameMs(frames[i], durationMs);
      if (t < acc + d) return i;
      acc += d;
    }
    return frames.length - 1;
  }
  let tt = t;
  if (tt >= total) {
    if (!loop) return Number.isFinite(durationMs) && durationMs > total ? frames.length - 1 : -1;
    tt %= total;
  }
  let acc = 0;
  for (let i = 0; i < frames.length; i++) {
    acc += frameMs(frames[i], durationMs);
    if (tt < acc) return i;
  }
  return frames.length - 1;
}

/** Render-time clock: advances only while the loop runs (paused / countdown = frozen). */
export class FxClock {
  now = 0;
  private last: number | null = null;
  tick(realMs: number, mode: 'running' | 'paused' | 'countdown'): number {
    const dt = this.last === null ? 0 : Math.min(MAX_DT_MS, Math.max(0, realMs - this.last));
    this.last = realMs;
    if (mode === 'running') this.now += dt;
    return this.now;
  }
}

/** Frames of a track under the Reduce motion setting; null = skip the track. */
export function framesFor(
  track: FxTrack,
  reduceMotion: boolean,
  defRm?: FxDef['reduceMotion'],
  partName?: string,
): readonly FxFrame[] | null {
  const own = track.frames ?? null;
  if (!reduceMotion) return own;
  const pick = (v: FxDef['reduceMotion']): FxReduceMotion | undefined => {
    if (v === undefined) return undefined;
    if (typeof v === 'string' || Array.isArray(v)) return v as FxReduceMotion;
    return partName ? (v as Record<string, FxReduceMotion>)[partName] : undefined;
  };
  const rm = pick(track.reduceMotion) ?? pick(defRm);
  if (rm === undefined || rm === 'same') return own;
  if (rm === 'skip') return null;
  return rm;
}

// ---- Triggers --------------------------------------------------------------------------------------

export interface TriggerSpec {
  event: string;
  status?: string;
  kind?: string;
  boss?: boolean;
  /** 'po X' – starts when state X of the same effect ends. */
  after?: string;
}

/** Parses document trigger prose, e.g. 'telegraphStart kind=bossSwing', 'enemyHit (boss)', 'a | b (…)'. */
export function parseTrigger(text: string | readonly string[] | undefined): TriggerSpec[] {
  if (!text) return [];
  const list = typeof text === 'string' ? [text] : text;
  const out: TriggerSpec[] = [];
  for (const whole of list)
    for (const raw of whole.split('|')) {
      const s = raw.trim();
      const po = /^po (\w+)/.exec(s);
      if (po) {
        out.push({ event: '', after: po[1] });
        continue;
      }
      const m = /^([A-Za-z]+)(?::([A-Za-z]+))?/.exec(s);
      if (!m || m[1] === 'default') continue; // 'timer …' → event 'timer' (CombatFxSource)
      const spec: TriggerSpec = { event: m[1] };
      if (m[2]) spec.status = m[2];
      const kind = /kind=(\w+)/.exec(s)?.[1] ?? /^\w+ \((boss\w+)\)/.exec(s)?.[1];
      if (kind) spec.kind = kind;
      if (/^\w+ \(boss\)/.test(s)) spec.boss = true;
      out.push(spec);
    }
  return out;
}

interface Spawnable {
  fxId: string;
  /** Unique within the effect (state / part name). */
  key: string;
  track: FxTrack;
  partName?: string;
  /** State machine group: a new state replaces an open-ended state (untilNextState) of the same object. */
  stateGroup?: string;
  triggers: TriggerSpec[];
  endsOn: TriggerSpec[];
  startMs: number;
}

/** All playable tracks of the registry with their triggers (built once). */
export function buildSpawnables(fx: Readonly<Record<string, FxDef>> = FX): Spawnable[] {
  const out: Spawnable[] = [];
  for (const [fxId, def] of Object.entries(fx)) {
    if (SKIP_EFFECTS.has(fxId) || def.layer === 'screen') continue;
    const base = { fxId, startMs: 0 };
    const defEnds = parseTrigger(def.endsOn);
    if (def.frames)
      out.push({
        ...base,
        key: fxId,
        track: def,
        triggers: parseTrigger(def.trigger),
        endsOn: defEnds,
      });
    for (const p of def.parts ?? []) {
      if (p.layer === 'screen') continue;
      out.push({
        ...base,
        key: p.name,
        partName: p.name,
        track: p,
        triggers: parseTrigger(p.trigger ?? def.trigger),
        endsOn: [...defEnds, ...parseTrigger(p.endsOn)],
        startMs: p.startMs ?? 0,
      });
    }
    // fx_buddy_drone: trigger map by state name ('spawn' starts 'idle').
    const named = { ...((def as { triggers?: Record<string, string> }).triggers ?? {}) };
    if (named.spawn && !named.idle) named.idle = named.spawn;
    for (const [name, st] of Object.entries(def.states ?? {})) {
      const trig = parseTrigger(st.trigger ?? named[name]);
      const ends = parseTrigger(st.endsOn);
      if (st.frames && st.layer !== 'screen')
        out.push({
          ...base,
          key: name,
          partName: name,
          track: st,
          stateGroup: fxId,
          triggers: trig,
          endsOn: ends,
        });
      // Nested sub-tracks (band, trail, tracer, overlay, spawnCells, activation …).
      for (const [sub, v] of Object.entries(st))
        if (v && typeof v === 'object' && !Array.isArray(v) && 'frames' in v) {
          const t = v as FxTrack;
          out.push({
            ...base,
            key: `${name}.${sub}`,
            partName: sub,
            track: {
              layer: st.layer,
              priority: st.priority,
              anchor: st.anchor,
              loop: st.loop,
              durationMs: st.durationMs,
              ...t,
            },
            triggers: t.trigger ? parseTrigger(t.trigger) : trig,
            endsOn: [...ends, ...parseTrigger(t.endsOn)],
          });
        }
    }
  }
  return out;
}

// ---- Engine (no DOM) ---------------------------------------------------------------------------------

export type FxPayload = Record<string, unknown> & {
  entityId?: number;
  cells?: readonly FxCell[];
  cell?: FxCell;
};

export interface FxInstance {
  sp: Spawnable;
  start: number;
  durationMs: number;
  payload: FxPayload;
  /** Chosen frames for timelines / variants (null = the track's own). */
  frames: readonly FxFrame[] | null;
  rngSeed: number;
  order: number;
}

/** Cell to draw: world grid position + partial style (omitted fields inherit) + draw order. */
export interface FxDrawCell {
  x: number;
  y: number;
  ch?: string;
  fg?: string;
  bg?: string;
  bold?: boolean;
  layer: number;
  priority: number;
  order: number;
}

export interface FxEngineOptions {
  /** Reduce motion setting, read on every spawn / frame. */
  reduceMotion: () => boolean;
  /** Seed of the FX-only RNG (default Date.now()). Never state.rng. */
  seed?: number;
}

/** Effects started by a state's side alarm (R6 A: fx_alert on every alarmed enemy). */
function alarmEffects(): Map<string, string> {
  const m = new Map<string, string>();
  for (const def of Object.values(FX))
    for (const st of Object.values(def.states ?? {}))
      if (st.alarm) m.set(st.alarm.effect, parseTrigger(st.alarm.trigger)[0]?.event ?? '');
  return m;
}

export class FxEngine {
  readonly instances: FxInstance[] = [];
  private readonly spawnables = buildSpawnables();
  private readonly alarms = alarmEffects();
  /** FX-only RNG ({random}, glitch timers). Not saved, independent of state.rng. */
  readonly rng: Rng;
  private orderSeq = 0;
  constructor(private readonly opts: FxEngineOptions) {
    this.rng = new Rng(opts.seed ?? Date.now());
  }

  /** Feed one trigger at FX time `now`. */
  onEvent(name: string, payload: FxPayload, now: number): void {
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      const ends = inst.sp.endsOn.some((t) => {
        const ev = t.event === 'attackerDied' ? 'enemyKilled' : t.event;
        return (
          ev === name &&
          (!t.status || t.status === payload.status) &&
          sameObject(inst.payload, payload)
        );
      });
      if (ends) this.instances.splice(i, 1);
    }
    for (const sp of this.spawnables) {
      if (!sp.triggers.some((tr) => this.matches(tr, sp, name, payload))) continue;
      const alarmTrigger = this.alarms.get(sp.fxId);
      if (alarmTrigger === name && Array.isArray(payload.alertedIds)) {
        for (const id of payload.alertedIds as number[]) this.spawn(sp, { entityId: id }, now);
        continue;
      }
      this.spawn(sp, payload, now);
    }
  }

  private matches(t: TriggerSpec, sp: Spawnable, name: string, p: FxPayload): boolean {
    if (t.event !== name) return false;
    if (t.status && t.status !== p.status) return false;
    if (t.kind && t.kind !== p.kind) return false;
    if (t.boss) return p.boss === true;
    // Unqualified triggers with a '(boss)' twin are for normal enemies only.
    if (p.boss === true)
      return !this.spawnables.some(
        (o) => o !== sp && o.triggers.some((x) => x.event === name && x.boss),
      );
    return true;
  }

  private spawn(sp: Spawnable, payload: FxPayload, now: number): void {
    const rm = this.opts.reduceMotion();
    const def = FX[sp.fxId];
    let frames: readonly FxFrame[] | null = null;
    if (sp.track.timelineKey !== undefined && def.timelines) {
      // fx_telegraph.targetCell: timeline by wind-up ('450' … / 'ranged.700').
      const w = typeof payload.windupMs === 'number' ? payload.windupMs : 0;
      const ranged = payload.kind === 'ranged';
      frames = def.timelines[ranged ? `ranged.${w}` : String(w)] ?? null;
      if (!frames) return;
      if (rm) {
        const map = def.reduceMotion;
        const v =
          map && typeof map === 'object' && !Array.isArray(map)
            ? (map as Record<string, FxReduceMotion>)[ranged ? 'targetCellRanged' : 'targetCell']
            : undefined;
        if (v === 'skip') return;
        if (Array.isArray(v)) frames = v as readonly FxFrame[];
      }
    } else if (
      typeof payload.kind === 'string' &&
      sp.key === sp.fxId &&
      def.variants?.[payload.kind]
    ) {
      frames = def.variants[payload.kind];
    }
    if (!frames && framesFor(sp.track, rm, def.reduceMotion, sp.partName) === null) return;
    if (sp.stateGroup)
      for (let i = this.instances.length - 1; i >= 0; i--) {
        const o = this.instances[i];
        if (
          o.sp.stateGroup === sp.stateGroup &&
          o.durationMs === Infinity &&
          sameObject(o.payload, payload)
        )
          this.instances.splice(i, 1);
      }
    this.instances.push({
      sp,
      start: now + sp.startMs,
      durationMs: resolveDuration(sp.track, def, payload),
      payload,
      frames,
      rngSeed: Math.floor(this.rng.next() * 0x7fffffff),
      order: this.orderSeq++,
    });
  }

  /** Drops finished instances and starts 'po X' follow-up states. */
  update(now: number): void {
    for (let i = this.instances.length - 1; i >= 0; i--) {
      const inst = this.instances[i];
      if (now - inst.start < inst.durationMs) continue;
      this.instances.splice(i, 1);
      for (const sp of this.spawnables)
        if (sp.fxId === inst.sp.fxId && sp.triggers.some((t) => t.after === inst.sp.key))
          this.spawn(sp, inst.payload, inst.start + inst.durationMs);
    }
  }

  /** Cells to draw at FX time `now` (world grid). `entityPos` resolves entity anchors (read-only). */
  cells(now: number, entityPos: (id: number | undefined) => FxCell | null): FxDrawCell[] {
    this.update(now);
    const rm = this.opts.reduceMotion();
    const out: FxDrawCell[] = [];
    for (const inst of this.instances) {
      const t = now - inst.start;
      if (t < 0) continue;
      const def = FX[inst.sp.fxId];
      const frames =
        inst.frames ?? framesFor(inst.sp.track, rm, def.reduceMotion, inst.sp.partName);
      if (!frames) continue;
      const idx = frameIndexAt(frames, t, inst.sp.track.loop === true, inst.durationMs);
      if (idx < 0) continue;
      const f = frames[idx];
      const layer = LAYER_ORDER[String(inst.sp.track.layer ?? def.layer ?? 'cell')] ?? 30;
      if (layer === LAYER_ORDER.screen) continue;
      const priority = Number(inst.sp.track.priority ?? def.priority ?? 0);
      const anchors = resolveAnchors(
        String(inst.sp.track.anchor ?? def.anchor ?? 'entity'),
        inst.payload,
        entityPos,
      );
      const fg = f.fg ? PALETTE[f.fg] : undefined;
      if (typeof f.text === 'string') {
        const chars = [...fillTokens(f.text, inst.payload)];
        for (const a of anchors)
          chars.forEach((ch, i) =>
            out.push({
              x: a.x - Math.floor((chars.length - 1) / 2) + i,
              y: a.y,
              ch,
              fg,
              bold: f.bold,
              layer,
              priority,
              order: inst.order,
            }),
          );
        continue;
      }
      for (const c of f.cells ?? [])
        for (const a of anchors) {
          const cell: FxDrawCell = {
            x: a.x + c.dx,
            y: a.y + c.dy,
            layer,
            priority,
            order: inst.order,
          };
          if (c.ch !== undefined) {
            const ch = this.resolveCh(c.ch, inst, idx);
            if (ch !== undefined) cell.ch = ch;
          }
          if (c.fg) cell.fg = PALETTE[c.fg];
          if (c.bg) cell.bg = PALETTE[c.bg];
          if (c.bold !== undefined) cell.bold = c.bold;
          out.push(cell);
        }
    }
    return out.sort((a, b) => a.layer - b.layer || a.priority - b.priority || a.order - b.order);
  }

  /** '{glyph}' → payload.glyph; '{random:abc}' → FX-only RNG, stable per instance + frame. */
  private resolveCh(ch: string, inst: FxInstance, frameIdx: number): string | undefined {
    if (ch === '{glyph}')
      return typeof inst.payload.glyph === 'string' ? inst.payload.glyph : undefined;
    const m = /^\{random:([^}]+)\}$/.exec(ch);
    if (!m) return ch;
    const pool = [...m[1]];
    const r = new Rng((inst.rngSeed ^ Math.imul(frameIdx + 1, 0x9e3779b1)) >>> 0);
    return pool[Math.floor(r.next() * pool.length)];
  }
}

function sameObject(a: FxPayload, b: FxPayload): boolean {
  if (a.entityId !== undefined || b.entityId !== undefined) return a.entityId === b.entityId;
  if (a.cell && b.cell) return a.cell.x === b.cell.x && a.cell.y === b.cell.y;
  return true;
}

function resolveDuration(track: FxTrack, def: FxDef, p: FxPayload): number {
  const d = track.durationMs ?? def.durationMs;
  if (typeof d === 'number') return d;
  if (d === undefined) {
    if (track.loop || track.hold) return Infinity;
    return (track.frames ?? []).reduce(
      (a, f) => a + (typeof f.ms === 'number' ? f.ms : Infinity),
      0,
    );
  }
  if (d === 'attackWindupMs') return typeof p.windupMs === 'number' ? p.windupMs : Infinity;
  const depth = p.depth === 1 || p.depth === 2 || p.depth === 3 ? p.depth : undefined;
  // untilNextState / untilWallHit / untilOpened → open-ended (ended by endsOn / next state).
  return resolveFxDurationMs(d, { depth }) ?? Infinity;
}

function fillTokens(text: string, p: FxPayload): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (p[k] !== undefined ? String(p[k]) : ''));
}

/** Anchor prose → world cells. */
export function resolveAnchors(
  anchor: string,
  p: FxPayload,
  entityPos: (id: number | undefined) => FxCell | null,
): FxCell[] {
  const coords = /\((\d+),\s*(\d+)\)/.exec(anchor);
  if (coords) return [{ x: Number(coords[1]), y: Number(coords[2]) }];
  if (anchor.startsWith('spawns.')) {
    const v = (SCREEN_BASE_M1.spawns as Record<string, unknown> | undefined)?.[anchor.slice(7)];
    return Array.isArray(v) ? [{ x: Number(v[0]), y: Number(v[1]) }] : [];
  }
  if (anchor === 'none' || anchor === 'screen') return [];
  if (anchor.startsWith('killer')) {
    // anchorRules: killerAlive → entity, killerDiedSameTick → strike origin, killerUnknown → skip.
    const k = p.killer as { entityId?: number; strikeOrigin?: readonly FxCell[] } | undefined;
    if (!k) return [];
    const e = k.entityId !== undefined ? entityPos(k.entityId) : null;
    return e ? [e] : [...(k.strikeOrigin ?? [])];
  }
  if (/^(targetCell|zone|path)/.test(anchor)) {
    if (p.cells && p.cells.length) return [...p.cells];
    return p.cell ? [p.cell] : [];
  }
  // entity / aboveEntity / 'każdy przywołany dron'
  const e = p.entityId === undefined && p.cell ? p.cell : entityPos(p.entityId);
  if (!e) return [];
  if (!anchor.startsWith('above')) return [e];
  // Boss (3×2): above the middle top cell.
  return [{ x: e.x + (p.boss === true ? 1 : 0), y: e.y - 1 }];
}

// ---- Combat source (walka-m1.md §8; read-only) -----------------------------------------------------

export type FxTrigger = [name: string, payload: FxPayload];

interface EnemySnap {
  aim: FxCell | null;
  ai: string;
  shock: number;
  boss: boolean;
}

const BOSS_WINDUP =
  (FX.fx_telegraph?.params as { windupMs?: Record<string, number> } | undefined)?.windupMs ?? {};

/** Cells on the line a→b without the ends (drone tracer). */
export function lineBetween(a: FxCell, b: FxCell): FxCell[] {
  const out: FxCell[] = [];
  const n = Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y));
  for (let i = 1; i < n; i++)
    out.push({
      x: Math.round(a.x + ((b.x - a.x) * i) / n),
      y: Math.round(a.y + ((b.y - a.y) * i) / n),
    });
  return out;
}

/**
 * Turns combat data into FX triggers: last tick's events + state diffs. Read-only; never calls
 * getCombat() (which would create combat data) – the caller passes peekCombat(state).
 */
export class CombatFxSource {
  private lastTick: number | null = null;
  private snaps = new Map<number, EnemySnap>();
  private interrupted = new Set<number>();
  private seen = new Map<number, { x: number; y: number; ch: string }>();
  private droneWarned = false;
  private laneKey = '';
  private bossKind = new Map<number, string>();
  private glitchAt = new Map<number, number>();

  /** Bus events → FX triggers (boss telegraph kinds are remembered for the strike). */
  fromBus<K extends keyof FxTriggerEvents>(name: K, payload: FxTriggerEvents[K]): FxTrigger[] {
    if (name === 'bossTelegraph') {
      const p = payload as FxTriggerEvents['bossTelegraph'];
      this.bossKind.set(p.entityId, p.kind);
      return [['telegraphStart', { ...p, boss: true, windupMs: BOSS_WINDUP[p.kind] }]];
    }
    const p = { ...(payload as FxPayload) };
    if (name === 'bossDefeated' || name === 'bossIntro' || name === 'chargeWallHit') p.boss = true;
    return [[name, p]];
  }

  poll(state: GameState, c: CombatData | undefined, fxNow: number, rng: Rng): FxTrigger[] {
    const out: FxTrigger[] = [];
    if (!c) return out;
    const pos = (id: number): FxCell | null => {
      const e = id === state.player.id ? state.player : state.entities.find((en) => en.id === id);
      return e ? { x: e.x, y: e.y } : null;
    };
    if (state.tick !== this.lastTick) {
      const first = this.lastTick === null;
      this.lastTick = state.tick;
      if (!first) this.events(state, c, pos, out);
      this.diff(state, c, first, out);
      for (const e of state.entities) this.seen.set(e.id, { x: e.x, y: e.y, ch: e.glyph.ch });
    }
    this.glitch(c, fxNow, rng, out);
    return out;
  }

  private events(
    state: GameState,
    c: CombatData,
    pos: (id: number) => FxCell | null,
    out: FxTrigger[],
  ): void {
    const droneId = c.drone?.entityId;
    const isBoss = (id: number) => this.snaps.get(id)?.boss === true;
    for (const ev of c.events)
      switch (ev.type) {
        case 'enemyHit':
          out.push([
            'enemyHit',
            { entityId: ev.enemyId, dmg: ev.dmg, crit: ev.crit, boss: isBoss(ev.enemyId) },
          ]);
          break;
        case 'enemyMiss':
          out.push(['enemyMiss', { entityId: ev.enemyId }]);
          break;
        case 'playerHit':
          out.push(['playerHit', { dmg: ev.dmg }]);
          break;
        case 'enemyKilled': {
          const s = this.seen.get(ev.enemyId);
          out.push([
            'enemyKilled',
            {
              entityId: ev.enemyId,
              cell: s ? { x: s.x, y: s.y } : undefined,
              glyph: s?.ch,
              boss: isBoss(ev.enemyId),
            },
          ]);
          break;
        }
        case 'playerDied': {
          const k = ev.cause?.killer;
          let killer: { entityId?: number; strikeOrigin: FxCell[] } | undefined;
          if (k) {
            const alive = state.entities.find(
              (e) => c.enemies.has(e.id) && e.x === k.from.x && e.y === k.from.y,
            );
            killer = { entityId: alive?.id, strikeOrigin: [k.from] };
          }
          out.push(['playerDied', { killer }]);
          break;
        }
        case 'telegraphInterrupted': {
          const aim = this.snaps.get(ev.enemyId)?.aim;
          this.interrupted.add(ev.enemyId);
          out.push(['telegraphInterrupted', { entityId: ev.enemyId, cells: aim ? [aim] : [] }]);
          break;
        }
        case 'dash':
          out.push([
            'dashStart',
            { cells: [ev.from, ...ev.path].filter((p) => p.x !== ev.to.x || p.y !== ev.to.y) },
          ]);
          break;
        case 'skillUsed':
          if (ev.skill === 'shockPulse') out.push(['pulseCast', {}]);
          break;
        case 'shockPulse': {
          const cells: FxCell[] = [];
          for (let dy = -ev.radius; dy <= ev.radius; dy++)
            for (let dx = -ev.radius; dx <= ev.radius; dx++) {
              const x = ev.center.x + dx;
              const y = ev.center.y + dy;
              if ((dx || dy) && !state.map.isSolid(x, y)) cells.push({ x, y });
            }
          out.push(['pulseFire', { cells }]);
          break;
        }
        case 'droneDeployed':
          this.droneWarned = false;
          out.push(['droneCast', { cell: ev.cell }]);
          if (droneId !== undefined) out.push(['droneSpawn', { entityId: droneId }]);
          break;
        case 'droneShot': {
          const a = droneId !== undefined ? pos(droneId) : null;
          const b = pos(ev.enemyId);
          out.push(['droneFire', { entityId: droneId, cells: a && b ? lineBetween(a, b) : [] }]);
          break;
        }
        case 'droneHit':
          if (droneId !== undefined) out.push(['droneHit', { entityId: droneId, dmg: ev.dmg }]);
          break;
        case 'droneGone':
          out.push([
            ev.reason === 'expired' ? 'droneExpired' : 'droneDestroyed',
            { entityId: this.lastDrone },
          ]);
          break;
        default:
          break;
      }
  }

  private lastDrone: number | undefined;

  private diff(state: GameState, c: CombatData, first: boolean, out: FxTrigger[]): void {
    const next = new Map<number, EnemySnap>();
    for (const [id, ec] of c.enemies) {
      const def = enemyDef(c, ec.type);
      const snap: EnemySnap = {
        aim: ec.attack ? { ...ec.attack.aim } : null,
        ai: ec.ai,
        shock: ec.shock,
        boss: def.ignoresDepth,
      };
      next.set(id, snap);
      const prev = this.snaps.get(id);
      if (first || !prev) continue;
      if (!prev.aim && snap.aim && !snap.boss)
        out.push([
          'telegraphStart',
          { entityId: id, kind: def.attack, cells: [snap.aim], windupMs: def.windupMs },
        ]);
      if (prev.aim && !snap.aim && !this.interrupted.has(id) && ec.ai !== 'dead')
        out.push([
          'strikeResolved',
          {
            entityId: id,
            kind: snap.boss ? this.bossKind.get(id) : def.attack,
            cells: [prev.aim],
            boss: snap.boss,
          },
        ]);
      if (prev.ai !== 'alert' && ec.ai === 'alert') out.push(['enemyAlert', { entityId: id }]);
      if (prev.shock <= 0 && ec.shock > 0)
        out.push(['statusApplied', { entityId: id, status: 'Shock' }]);
      if (prev.shock > 0 && ec.shock <= 0 && ec.ai !== 'dead')
        out.push(['statusExpired', { entityId: id, status: 'Shock' }]);
    }
    this.snaps = next;
    this.interrupted.clear();
    if (c.drone) {
      this.lastDrone = c.drone.entityId;
      const msLeft = c.drone.life * c.cfg.TICK_MS;
      if (!this.droneWarned && msLeft <= 2000 && !first) {
        this.droneWarned = true;
        out.push(['droneLifeLeft', { entityId: c.drone.entityId, msLeft }]);
      }
    }
    const lane = getBossChargeLane(state);
    const key = lane && lane.phase === 'charging' ? JSON.stringify(lane.cells) : '';
    if (key && key !== this.laneKey) {
      const boss = [...next].find(([, s]) => s.boss)?.[0];
      out.push(['chargeStart', { entityId: boss, cells: lane ? lane.cells : [], boss: true }]);
    }
    this.laneKey = key;
  }

  /** fx_szum_glitch: per enemy every 4000–8000 ms (FX-only RNG), blocked by telegraph / hit flash / death. */
  private glitch(c: CombatData, now: number, rng: Rng, out: FxTrigger[]): void {
    for (const [id, ec] of c.enemies) {
      const at = this.glitchAt.get(id);
      const nextAt = () => now + 4000 + Math.floor(rng.next() * 4001);
      if (at === undefined) this.glitchAt.set(id, nextAt());
      else if (now >= at) {
        this.glitchAt.set(id, nextAt());
        if (!ec.attack && ec.hitFlash <= 0 && ec.ai !== 'dead')
          out.push(['timer', { entityId: id }]);
      }
    }
    for (const id of this.glitchAt.keys()) if (!c.enemies.has(id)) this.glitchAt.delete(id);
  }
}

// ---- Installation + drawing (DOM side) -------------------------------------------------------------

interface LoopLike {
  readonly mode: 'running' | 'paused' | 'countdown';
}

/** Bus events the layer listens to (FxTriggerEvents keys). */
export const FX_BUS_EVENTS = [
  'levelStart',
  'cooldownEnd',
  'evacCallStart',
  'evacCallInterrupted',
  'evacCallDone',
  'liftArrived',
  'playerEvacuated',
  'liftDeparted',
  'bossIntro',
  'bossTelegraph',
  'chargeWallHit',
  'bossStunned',
  'bossStunEnd',
  'bossSummon',
  'summonedSpawn',
  'bossDefeated',
  'basePrint',
  'baseArriveByLift',
  'newContractAvailable',
  'terminalOpened',
  'gridFragmentLit',
  'baseUpgradeBuilt',
] as const satisfies readonly (keyof FxTriggerEvents)[];

interface Installed {
  engine: FxEngine;
  clock: FxClock;
  source: CombatFxSource;
  loop: LoopLike;
}
let installed: Installed | null = null;

/** The one call in main.ts. Subscribes to the bus (never emits); returns uninstall. */
export function installFxLayer(
  bus: EventBus<GameEvents>,
  loop: LoopLike,
  /** Reduce motion setting (main.ts passes ui/settings reduceMotion()); read live. */
  motion: { readonly value: boolean },
  seed?: number,
): () => void {
  const engine = new FxEngine({ reduceMotion: () => motion.value, seed });
  const clock = new FxClock();
  const source = new CombatFxSource();
  const offs = FX_BUS_EVENTS.map((name) =>
    bus.on(name, (p) => {
      for (const [n, pl] of source.fromBus(name, p)) engine.onEvent(n, pl, clock.now);
    }),
  );
  installed = { engine, clock, source, loop };
  return () => {
    offs.forEach((off) => off());
    installed = null;
  };
}

/** Underlying style of a world cell: topmost entity (player last) or the tile. */
function baseAt(state: GameState, x: number, y: number): { g: GlyphStyle; entity: boolean } {
  if (state.player.x === x && state.player.y === y) return { g: state.player.glyph, entity: true };
  for (let i = state.entities.length - 1; i >= 0; i--) {
    const e = state.entities[i];
    if (e.x === x && e.y === y) return { g: e.glyph, entity: true };
  }
  return { g: TILE_GLYPHS[state.map.tile(x, y)] ?? UNKNOWN_GLYPH, entity: false };
}

/** Merges an FX cell over what lies underneath (omitted fields inherit). Ground FX stay under entities. */
export function mergeCell(base: GlyphStyle, isEntity: boolean, c: FxDrawCell): GlyphStyle {
  if (c.layer === LAYER_ORDER.ground && isEntity) {
    const bg = base.bg ?? c.bg;
    return bg ? { ...base, bg } : { ...base };
  }
  const g: GlyphStyle = { ch: c.ch ?? base.ch, fg: c.fg ?? base.fg };
  const bold = c.bold ?? base.bold;
  if (bold !== undefined) g.bold = bold;
  const bg = c.bg ?? base.bg;
  if (bg) g.bg = bg;
  return g;
}

/** Steps the layer for one rendered frame: clock, combat source, engine → cells (no DOM). */
export function fxFrame(fx: Installed, state: GameState, realMs: number): FxDrawCell[] {
  const now = fx.clock.tick(realMs, fx.loop.mode);
  for (const [n, p] of fx.source.poll(state, peekCombat(state), now, fx.engine.rng))
    fx.engine.onEvent(n, p, now);
  const pos = (id: number | undefined): FxCell | null => {
    if (id === undefined || id === state.player.id) return { x: state.player.x, y: state.player.y };
    const e = state.entities.find((en) => en.id === id);
    return e ? { x: e.x, y: e.y } : null;
  };
  return fx.engine.cells(now, pos);
}

/** Called once from render/scene.ts after the world is drawn (camera offset in device px). */
export function drawFx(r: GlyphRenderer, state: GameState, camPxX: number, camPxY: number): void {
  if (!installed) return;
  const drawn = new Map<string, GlyphStyle>();
  for (const c of fxFrame(installed, state, performance.now())) {
    const k = `${c.x},${c.y}`;
    const prev = drawn.get(k);
    const base = prev ? { g: prev, entity: false } : baseAt(state, c.x, c.y);
    drawn.set(k, mergeCell(base.g, base.entity, c));
  }
  for (const [k, g] of drawn) {
    const [x, y] = k.split(',').map(Number);
    r.draw(g, x * r.cellW - camPxX, y * r.cellH - camPxY);
  }
}
