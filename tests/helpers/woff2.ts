// WOFF2 → set of mapped code points (cmap is never transformed in WOFF2). Shared by font tests.
import { readFileSync } from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';

export function woff2CodePoints(file: Uint8Array): Set<number> {
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

const FONT_DIR = new URL('../../src/assets/fonts/', import.meta.url);
export const FONT_FILES = ['JetBrainsMono-Regular-subset.woff2', 'JetBrainsMono-Bold-subset.woff2'];

/** Code points present in EVERY bundled font face. */
export function subsetCodePoints(): Set<number> {
  const sets = FONT_FILES.map((f) => woff2CodePoints(readFileSync(new URL(f, FONT_DIR))));
  return new Set([...sets[0]].filter((c) => sets.every((s) => s.has(c))));
}
