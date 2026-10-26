// FX data (src/data/fx-m1.ts, generated from graf/assety-m1.md) – shape, palette, glyphs, timing.
import { describe, expect, it } from 'vitest';
import {
  FX,
  FX_COMMON,
  FX_GLYPHS_M1,
  SCREEN_BASE_M1,
  fxTracks,
  type FxFrame,
} from '../src/data/fx';
import { FX_DURATION_KEYWORDS } from '../src/data/fx-params';
import { PALETTE } from '../src/data/style';
import { subsetCodePoints } from './helpers/woff2';

const PALETTE_KEYS = new Set(Object.keys(PALETTE));
const COLOR_FIELDS = new Set(['fg', 'bg', 'litFg', 'outline', 'color']);
const SUBSET = subsetCodePoints();
const cp = (c: string): string =>
  `${c} U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;
const ALL = { FX, FX_COMMON, FX_GLYPHS_M1, SCREEN_BASE_M1 };

/** Visit every object in a tree. */
function visit(
  v: unknown,
  path: string,
  fn: (o: Record<string, unknown>, path: string) => void,
): void {
  if (Array.isArray(v)) v.forEach((x, i) => visit(x, `${path}[${i}]`, fn));
  else if (v && typeof v === 'object') {
    fn(v as Record<string, unknown>, path);
    for (const [k, x] of Object.entries(v)) visit(x, `${path}.${k}`, fn);
  }
}
/** Placeholders like {glyph}, {dmg}, {secondsLeft}, {random:%&#?} → their literal chars only. */
const literalChars = (s: string): string[] => [
  ...s.replace(/\{random:([^}]*)\}/g, '$1').replace(/\{[A-Za-z_.[\]]+\}/g, ''),
];
const WIDE: [number, number][] = [
  [0x1100, 0x115f],
  [0x2e80, 0xa4cf],
  [0xac00, 0xd7a3],
  [0xf900, 0xfaff],
  [0xfe10, 0xfe19],
  [0xfe30, 0xfe6f],
  [0xff00, 0xff60],
  [0xffe0, 0xffe6],
  [0x1f000, 0x1faff],
  [0x20000, 0x3fffd],
];
/** One printable code point, not combining / emoji / East Asian wide. */
const isSingleCell = (c: string): boolean => {
  if ([...c].length !== 1 || /[\p{C}\p{M}]/u.test(c)) return false;
  const n = c.codePointAt(0)!;
  if (n > 0x7e && /\p{Extended_Pictographic}/u.test(c)) return false;
  return !WIDE.some(([lo, hi]) => n >= lo && n <= hi);
};

describe('FX data (assety-m1.md v1.3)', () => {
  it('has the 25 blocks of the document (24 effects + 1 UI block) + common blocks', () => {
    expect(Object.keys(FX)).toHaveLength(25);
    expect(Object.keys(FX).filter((k) => k.startsWith('ui_'))).toEqual(['ui_power_lines_receiver_label']);
    for (const [id, def] of Object.entries(FX)) expect(def.id).toBe(id);
    expect(FX_COMMON.tickMs).toBe(50);
    for (const k of Object.values(FX_COMMON.palette)) expect(PALETTE_KEYS.has(k)).toBe(true);
  });

  const PROSE_HEX = new Set([
    'ALL.FX.fx_base_print.background',
    'ALL.FX.ui_power_lines_receiver_label.states.beforeSend.frame',
  ]);
  it('every colour is a PALETTE key, no hex anywhere', () => {
    const bad: string[] = [];
    visit(ALL, 'ALL', (o, path) => {
      for (const [k, x] of Object.entries(o)) {
        if (typeof x !== 'string') continue;
        if (COLOR_FIELDS.has(k) && !PALETTE_KEYS.has(x)) bad.push(`${path}.${k}=${x}`);
        // Prose with a hex in a non-colour field (reported to GRAF Assety, v1.3) is tolerated.
        if (PROSE_HEX.has(`${path}.${k}`)) continue;
        if (k !== 'note' && /#[0-9a-f]{6}\b/i.test(x)) bad.push(`${path}.${k}=${x}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('every effect track has frames; times are positive multiples of 50 ms', () => {
    const bad: string[] = [];
    for (const def of Object.values(FX)) {
      if (def.id.startsWith('ui_')) continue; // UI data block (window of the Power Lines terminal), no frames
      const tracks = fxTracks(def);
      expect(tracks.length, def.id).toBeGreaterThan(0);
      for (const { path, track } of tracks) {
        const frames = track.frames ?? [];
        // A part may point at `timelines` instead of own frames (fx_telegraph.targetCell).
        if (frames.length === 0 && !(track.timelineKey && def.timelines))
          bad.push(`${path}: no frames`);
        for (const f of frames as FxFrame[]) {
          if (
            typeof f.ms === 'number'
              ? !(f.ms > 0 && f.ms % 50 === 0)
              : !(f.ms in FX_DURATION_KEYWORDS)
          )
            bad.push(`${path}: ms=${String(f.ms)}`);
        }
        if (
          typeof track.durationMs === 'number' &&
          !(track.durationMs > 0 && track.durationMs % 50 === 0)
        )
          bad.push(`${path}: durationMs=${track.durationMs}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('one-shot tracks: frame times add up to durationMs', () => {
    const bad: string[] = [];
    for (const def of Object.values(FX)) {
      for (const { path, track } of fxTracks(def)) {
        if (track.loop || track.hold || typeof track.durationMs !== 'number') continue;
        const frames = (track.frames ?? []) as FxFrame[];
        if (!frames.every((f) => typeof f.ms === 'number')) continue;
        const sum = frames.reduce((a, f) => a + (f.ms as number), 0);
        const own = Object.prototype.hasOwnProperty.call(track, 'durationMs') && track !== def;
        // Parts / tracer without their own duration live inside the effect's duration.
        if (own || path === def.id || path.includes('.timelines.') || path.includes('.variants.')) {
          if (sum !== track.durationMs) bad.push(`${path}: ${sum} ≠ ${track.durationMs}`);
        } else if ((track.startMs ?? 0) + sum > track.durationMs)
          bad.push(`${path}: ${sum} > ${track.durationMs}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('every cell glyph is one 1-cell char (or a placeholder) and every char is in the font subset', () => {
    const notSingle: string[] = [];
    const chars = new Set<string>();
    visit(ALL, 'ALL', (o, path) => {
      if (typeof o.ch === 'string') {
        if (!/^\{(glyph|random:[^}]+)\}$/.test(o.ch) && !isSingleCell(o.ch))
          notSingle.push(`${path}.ch=${o.ch}`);
        literalChars(o.ch).forEach((c) => chars.add(c));
      }
      for (const k of ['text', 'asciiFallback'] as const)
        if (typeof o[k] === 'string') literalChars(o[k] as string).forEach((c) => chars.add(c));
      if (Array.isArray(o.rows))
        for (const r of o.rows as string[]) [...r].forEach((c) => chars.add(c));
    });
    expect(notSingle).toEqual([]);
    expect(chars.size).toBeGreaterThan(20);
    expect([...chars].filter((c) => !SUBSET.has(c.codePointAt(0)!)).map(cp)).toEqual([]);
  });
});

describe('FX parameter names (mechaniki-m1.md v0.5)', () => {
  it('every string duration and every params key used by FX is documented', async () => {
    const { FX_PARAMS, FX_DURATION_KEYWORDS } = await import('../src/data/fx-params');
    const unknown = new Set<string>();
    visit(ALL, 'ALL', (o) => {
      for (const k of ['durationMs', 'ms'] as const)
        if (typeof o[k] === 'string' && !((o[k] as string) in FX_DURATION_KEYWORDS))
          unknown.add(o[k] as string);
      if (o.params && typeof o.params === 'object')
        for (const p of Object.keys(o.params)) if (!(p in FX_PARAMS)) unknown.add(p);
    });
    expect([...unknown]).toEqual([]);
  });

  it("FX params marked 'ok' / 'renamed' / 'fxOnly' / 'gdDecisionSpecStale' have the documented value", async () => {
    const { FX_PARAMS } = await import('../src/data/fx-params');
    const bad: string[] = [];
    visit(FX, 'FX', (o, path) => {
      if (!o.params || typeof o.params !== 'object') return;
      for (const [p, v] of Object.entries(o.params as Record<string, unknown>)) {
        const def = (FX_PARAMS as Record<string, { value: unknown; status: string }>)[p];
        if (typeof v === 'string' && def && 'allowed' in def) {
          const allowed = (def as { allowed?: readonly string[] }).allowed ?? [];
          if (!allowed.includes(v))
            bad.push(`${path}.params.${p}: "${v}" not in ${allowed.join('|')}`);
          continue;
        }
        if (
          typeof v !== 'string' &&
          def &&
          ['ok', 'renamed', 'fxOnly', 'gdDecisionSpecStale'].includes(def.status) &&
          JSON.stringify(v) !== JSON.stringify(def.value)
        )
          bad.push(`${path}.params.${p}: ${JSON.stringify(v)} ≠ ${JSON.stringify(def.value)}`);
      }
    });
    expect(bad).toEqual([]);
  });

  it('S16 closed: no gdDecisionSpecStale params; no death screen diffs (v1.3)', async () => {
    const { FX_PARAMS, FX_SPEC_DIFFS } = await import('../src/data/fx-params');
    const stale = Object.entries(FX_PARAMS)
      .filter(([, d]) => (d.status as string) === 'gdDecisionSpecStale')
      .map(([k]) => k);
    expect(stale).toEqual([]);
    expect(FX_PARAMS.DEATH_SCREEN_AUTO_MS.status).toBe('ok');
    const death = FX_SPEC_DIFFS.filter((d) => d.field.startsWith('fx_death_screen'));
    expect(death).toEqual([]); // v1.3: NEXT = tap / Enter only – button diff closed
    expect(FX_SPEC_DIFFS.some((d) => d.field.includes('chargeTelegraph'))).toBe(true);
  });

  it('styl v1.5 §12 glyphs (Level Design)', async () => {
    const { WORLD_GLYPHS, ENEMY_SIGNALS, PALETTE } = await import('../src/data/style');
    expect(WORLD_GLYPHS.arenaGate).toMatchObject({
      glyph: '\u2229',
      color: 'descent',
      bg: 'descentBg',
    });
    expect(PALETTE[WORLD_GLYPHS.note.color]).toBe('#E6EDF3');
    expect(PALETTE[WORLD_GLYPHS.noteRead.color]).toBe('#56606B');
    expect(WORLD_GLYPHS.terminalBase).toMatchObject({ color: 'safe', bg: 'evacBg', bold: true });
    expect(PALETTE[WORLD_GLYPHS.evacClosed.color]).toBe('#56606B');
    expect('bg' in WORLD_GLYPHS.evacClosed).toBe(false);
    expect(PALETTE[WORLD_GLYPHS.liquidM1.color]).toBe('#4B5B7A');
    expect(PALETTE[WORLD_GLYPHS.cableOffH.color]).toBe('#56606B');
    expect(ENEMY_SIGNALS.chargeLane).toEqual({ glyph: '=', color: 'enemy', bg: 'telegraphBg' });
  });

  it('assety v1.3: entityId payloads, death screen input, cosmetic glitch RNG, unused base FX', async () => {
    const { fxUsedInM1 } = await import('../src/data/fx');
    expect(JSON.stringify(FX).includes('"attackerId"')).toBe(false);
    expect(Object.keys(FX.fx_telegraph.triggerPayload as object)).toEqual([
      'entityId',
      'kind',
      'cells',
      'windupMs',
    ]);
    expect(FX_COMMON.payloadConvention?.entityId).toBeTruthy();
    expect(FX.fx_death_screen.input).toMatchObject({ accept: ['tap', 'Enter'], edgeOnly: true });
    expect(FX.fx_death_screen.input?.accept).not.toContain('ATK');
    expect(FX.fx_szum_glitch.rng?.startsWith('cosmetic')).toBe(true);
    const unused = Object.entries(FX)
      .filter(([, d]) => !fxUsedInM1(d))
      .map(([k]) => k)
      .sort();
    expect(unused).toEqual(['fx_base_cable_light', 'fx_base_lift_arrive', 'fx_base_terminal_new']);
  });
});
