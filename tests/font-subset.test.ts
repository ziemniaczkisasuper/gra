// GRAF assety-m1.md v1.3 §15 pkt 3: arrows, box drawing and symbols are always in the subset
// (EXTRA_CHARS in scripts/font-subset.mjs), in BOTH weights.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FONT_FILES, woff2CodePoints } from './helpers/woff2';

const REQUIRED_V13 = [...'↘↓↙←↖↑↗─│┼├┤┬┴┌┐└┘⊥≤'];
const dir = new URL('../src/assets/fonts/', import.meta.url);

describe('font subset: GRAF v1.3 characters', () => {
  for (const f of FONT_FILES) {
    it(`${f} has every v1.3 arrow / box / symbol glyph`, () => {
      const cps = woff2CodePoints(readFileSync(new URL(f, dir)));
      const missing = REQUIRED_V13.filter((c) => !cps.has(c.codePointAt(0)!));
      expect(missing).toEqual([]);
    });
  }

  it('the characters are pinned in EXTRA_CHARS of the subset script', () => {
    const script = new TextDecoder().decode(
      readFileSync(new URL('../scripts/font-subset.mjs', import.meta.url)),
    );
    for (const c of REQUIRED_V13) {
      const hex = c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
      expect(script).toContain(`'\\u${hex}', // ${c}`);
    }
  });
});
