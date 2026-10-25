// GRAF style v1.1 data (src/data/style.ts): palette references, glyph width, font subset coverage.
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { ENEMY_TYPES, type EnemyTypeId } from '../src/data/combat-m0';
import * as S from '../src/data/style';
import {
  ALLY_GLYPHS,
  BOSS_GLYPHS,
  ENEMY_GLYPHS,
  ENEMY_SIGNALS,
  ITEM_GLYPHS,
  LOOT_RARITY,
  PALETTE,
  PICKUP_GLYPHS,
  RARITIES,
  WORLD_GLYPHS,
  lootGlyph,
  type EnemyGlyphKey,
  type GlyphStyle,
  type ItemSlot,
} from '../src/data/style';

// ---- WOFF2 → set of mapped code points (cmap is never transformed in WOFF2) -----------------------
const FONT_DIR = new URL('../src/assets/fonts/', import.meta.url);
const FONT_FILES = ['JetBrainsMono-Regular-subset.woff2', 'JetBrainsMono-Bold-subset.woff2'];

function woff2CodePoints(file: Uint8Array): Set<number> {
  const u8 = (b: Uint8Array, o: number): number => b[o];
  const u16 = (b: Uint8Array, o: number): number => (b[o] << 8) | b[o + 1];
  const u32 = (b: Uint8Array, o: number): number => u16(b, o) * 65536 + u16(b, o + 2);
  if (String.fromCharCode(...file.subarray(0, 4)) !== 'wOF2') throw new Error('not a WOFF2 file');
  const numTables = u16(file, 12);
  const compressedSize = u32(file, 20);
  let p = 48;
  const base128 = (): number => {
    let v = 0;
    for (let i = 0; i < 5; i++) {
      const b = u8(file, p++);
      v = v * 128 + (b & 0x7f);
      if (!(b & 0x80)) return v;
    }
    throw new Error('bad UIntBase128');
  };
  let offset = 0;
  let cmap: { offset: number; length: number } | null = null;
  for (let i = 0; i < numTables; i++) {
    const flags = u8(file, p++);
    const tagIdx = flags & 0x3f;
    if (tagIdx === 63) p += 4;
    const version = flags >> 6;
    const origLength = base128();
    // glyf/loca: version 0 = transformed; other tables: version 0 = untransformed.
    const isGlyfLoca = tagIdx === 10 || tagIdx === 11;
    const transformed = isGlyfLoca ? version !== 3 : version !== 0;
    const length = transformed ? base128() : origLength;
    if (tagIdx === 0) cmap = { offset, length };
    offset += length;
  }
  if (!cmap) throw new Error('no cmap');
  const data = brotliDecompressSync(file.subarray(p, p + compressedSize));
  const t = data.subarray(cmap.offset, cmap.offset + cmap.length);
  const cps = new Set<number>();
  const n = u16(t, 2);
  for (let i = 0; i < n; i++) {
    const platform = u16(t, 4 + i * 8);
    const sub = u32(t, 8 + i * 8);
    if (platform !== 0 && platform !== 3) continue;
    const format = u16(t, sub);
    if (format === 4) {
      const segX2 = u16(t, sub + 6);
      const ends = sub + 14;
      const starts = ends + segX2 + 2;
      const deltas = starts + segX2;
      const ranges = deltas + segX2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = u16(t, ends + s * 2);
        const start = u16(t, starts + s * 2);
        const delta = u16(t, deltas + s * 2);
        const ro = u16(t, ranges + s * 2);
        for (let c = start; c <= end && c !== 0xffff; c++) {
          let gid: number;
          if (ro === 0) gid = (c + delta) & 0xffff;
          else {
            const g = u16(t, ranges + s * 2 + ro + (c - start) * 2);
            gid = g === 0 ? 0 : (g + delta) & 0xffff;
          }
          if (gid !== 0) cps.add(c);
        }
      }
    } else if (format === 12) {
      const groups = u32(t, sub + 12);
      for (let g = 0; g < groups; g++) {
        const o = sub + 16 + g * 12;
        for (let c = u32(t, o); c <= u32(t, o + 4); c++) cps.add(c);
      }
    }
  }
  return cps;
}

const FONT_SUBSETS = FONT_FILES.map((f) => ({
  file: f,
  cps: woff2CodePoints(readFileSync(new URL(f, FONT_DIR))),
}));

/**
 * New GRAF v1.1 characters NOT yet in the font subset (pyftsubset rebuild requested from PROG /
 * Silnik). Until then the renderer falls back to system monospace for these cells. Keep this list
 * EMPTY in a release build.
 */
const PENDING_SUBSET: readonly string[] = [];
const cpLabel = (c: string): string =>
  `${c} U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`;

// ---- Helpers -----------------------------------------------------------------------------------
const PALETTE_KEYS = new Set(Object.keys(PALETTE));
const PALETTE_HEX = new Set<string>(Object.values(PALETTE));

/** One code point, printable, not combining, not emoji, not East Asian Wide/Fullwidth. */
function isSingleCell(ch: string): boolean {
  const cps = [...ch];
  if (cps.length !== 1) return false;
  const cp = ch.codePointAt(0)!;
  if (/[\p{C}\p{M}\p{Extended_Pictographic}]/u.test(ch) && cp > 0x7e) return false;
  if (cp < 0x20 || (cp >= 0x7f && cp < 0xa0)) return false;
  const wide: [number, number][] = [
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
  return !wide.some(([a, b]) => cp >= a && cp <= b);
}

/** Every string leaf (glyph text) and every GlyphStyle in style.ts exports, with a path. */
function collect(): { glyphs: [string, string][]; styles: [string, GlyphStyle][] } {
  const glyphs: [string, string][] = [];
  const styles: [string, GlyphStyle][] = [];
  const GLYPH_FIELDS = new Set([
    'ch',
    'glyph',
    'elite',
    'marker',
    'markerAscii',
    'carrierUnderline',
  ]);
  const walk = (v: unknown, path: string, key: string): void => {
    if (typeof v === 'string') {
      if (GLYPH_FIELDS.has(key) || /\.(rows|noiseGlitch|stickMarks)\.\d+$/.test(path))
        for (const c of v) glyphs.push([path, c]);
      return;
    }
    if (!v || typeof v !== 'object') return;
    if ('ch' in v && 'fg' in v) styles.push([path, v as GlyphStyle]);
    for (const [k, x] of Object.entries(v)) walk(x, `${path}.${k}`, k);
  };
  for (const [name, v] of Object.entries(S))
    if (name !== 'PALETTE' && name !== 'FONT') walk(v, name, name);
  // DOM UI glyph strings (rendered with the same font).
  for (const [k, v] of Object.entries(S.UI_GLYPHS))
    if (typeof v === 'string' && k !== 'stickMarks')
      for (const c of v) glyphs.push([`UI_GLYPHS.${k}`, c]);
  return { glyphs, styles };
}

// ---- Tests -------------------------------------------------------------------------------------
describe('style v1.1 – palette references', () => {
  it('every rarity has a palette colour and renders every slot as one glyph', () => {
    expect(RARITIES).toEqual([1, 2, 3]);
    for (const r of RARITIES) {
      const def = LOOT_RARITY[r];
      expect(PALETTE_KEYS.has(def.color), `rarity ${r} color`).toBe(true);
      expect(PALETTE_KEYS.has(def.carrierBg)).toBe(true);
      if ('groundBg' in def) expect(PALETTE_KEYS.has(def.groundBg)).toBe(true);
      for (const slot of Object.keys(ITEM_GLYPHS) as ItemSlot[]) {
        const g = lootGlyph(slot, r);
        expect(isSingleCell(g.ch)).toBe(true);
        expect(g.fg).toBe(PALETTE[def.color]);
      }
    }
    // Colour is never the only signal: r2/r3 have a background and a text marker.
    expect(LOOT_RARITY[2].marker).not.toBe('');
    expect(LOOT_RARITY[3].groundBg).not.toBe(LOOT_RARITY[2].groundBg);
  });

  it('every enemy type has a glyph and a palette colour; Gameplay enemy types are covered', () => {
    for (const [k, e] of Object.entries(ENEMY_GLYPHS)) {
      expect(isSingleCell(e.glyph), k).toBe(true);
      expect(PALETTE_KEYS.has(e.color), k).toBe(true);
      // GRAF: lowercase letter = enemy, uppercase = elite.
      expect(e.glyph).toMatch(/^[a-z]$/);
      expect(e.elite).toBe(e.glyph.toUpperCase());
    }
    const letters = Object.values(ENEMY_GLYPHS).map((e) => e.glyph);
    expect(new Set(letters).size).toBe(letters.length);
    for (const id of Object.keys(ENEMY_TYPES) as EnemyTypeId[])
      expect(ENEMY_GLYPHS).toHaveProperty(id);
    const covered: EnemyTypeId extends EnemyGlyphKey ? true : false = true;
    expect(covered).toBe(true);
    const boss = BOSS_GLYPHS.railGuardian;
    expect(boss.rows.map((r) => [...r].length)).toEqual([3, 3]);
    expect(PALETTE_KEYS.has(boss.color) && PALETTE_KEYS.has(boss.bg)).toBe(true);
    expect([...boss.rows[boss.weakPoint.row]][boss.weakPoint.col]).toBe(boss.weakPoint.glyph);
  });

  it('every palette-key field in the GRAF tables points at PALETTE', () => {
    const tables = { PICKUP_GLYPHS, ALLY_GLYPHS, WORLD_GLYPHS, ENEMY_SIGNALS };
    const walk = (v: unknown, path: string): void => {
      if (!v || typeof v !== 'object') return;
      for (const [k, x] of Object.entries(v)) {
        if (['color', 'bg', 'telegraphFg', 'telegraphBg', 'exposedColor'].includes(k))
          expect(PALETTE_KEYS.has(x as string), `${path}.${k}`).toBe(true);
        else walk(x, `${path}.${k}`);
      }
    };
    walk(tables, 'tables');
  });

  it('every GlyphStyle colour in style.ts is a PALETTE value (no stray hex)', () => {
    const { styles } = collect();
    expect(styles.length).toBeGreaterThan(10);
    for (const [path, g] of styles) {
      expect(PALETTE_HEX.has(g.fg), `${path}.fg ${g.fg}`).toBe(true);
      if (g.bg !== undefined) expect(PALETTE_HEX.has(g.bg), `${path}.bg ${g.bg}`).toBe(true);
    }
  });
});

describe('style v1.1 – glyphs', () => {
  it('every glyph is exactly one 1-cell character (no emoji / double width)', () => {
    const { glyphs } = collect();
    expect(glyphs.length).toBeGreaterThan(50);
    const bad = glyphs.filter(([, c]) => !isSingleCell(c));
    expect(bad).toEqual([]);
    for (const [path, g] of collect().styles) expect([...g.ch].length, path).toBe(1);
  });

  it.each(FONT_SUBSETS)('every glyph is in the font subset ($file)', ({ cps }) => {
    // Sanity: the parser sees the whole subset (ASCII 0x20–0x7E + GRAF symbols, 104 at v1.0).
    for (let c = 0x20; c <= 0x7e; c++) expect(cps.has(c)).toBe(true);
    expect(cps.size).toBeGreaterThanOrEqual(104);
    const missing = [
      ...new Set(
        collect()
          .glyphs.map(([, c]) => c)
          .filter((c) => !cps.has(c.codePointAt(0)!)),
      ),
    ];
    // Only characters explicitly waiting for a subset rebuild may be missing.
    expect(missing.filter((c) => !PENDING_SUBSET.includes(c)).map(cpLabel)).toEqual([]);
  });

  it.each(FONT_SUBSETS)('PENDING_SUBSET is up to date ($file)', ({ cps }) => {
    // When the subset is regenerated, remove the characters from PENDING_SUBSET.
    expect(PENDING_SUBSET.filter((c) => cps.has(c.codePointAt(0)!)).map(cpLabel)).toEqual([]);
  });
});
