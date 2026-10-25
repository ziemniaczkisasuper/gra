#!/usr/bin/env node
// Builds the JetBrains Mono subsets used by the game (Regular + Bold, WOFF2).
//   npm run font:subset            – download sources if missing, subset, write src/assets/fonts/
//   npm run font:subset -- --check – only report which characters are missing (exit 1 if any)
//
// Character set = ASCII 0x20–0x7E
//               + every non-ASCII character in STRING LITERALS of src/data/**/*.ts and src/**/strings*.ts
//               + EXTRA_CHARS below.
// Sources: official OFL fonts from github.com/JetBrains/JetBrainsMono (tag below), downloaded to
// scripts/fonts-src/ (git-ignored). Subsetting: `subset-font` (HarfBuzz WASM, npm) – no Python needed.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_DIR = join(ROOT, 'scripts', 'fonts-src');
const OUT_DIR = join(ROOT, 'src', 'assets', 'fonts');
const TAG = 'v2.304';
const BASE = `https://raw.githubusercontent.com/JetBrains/JetBrainsMono/${TAG}`;
const FACES = [
  { src: 'JetBrainsMono-Regular.ttf', out: 'JetBrainsMono-Regular-subset.woff2' },
  { src: 'JetBrainsMono-Bold.ttf', out: 'JetBrainsMono-Bold-subset.woff2' },
];

/**
 * Always included even if no source file uses them yet: every non-ASCII character of
 * graf/styl-ascii.md (v1.2, approved) and graf/assety-m1.md (v1.3), minus Polish letters and Polish
 * quotes „ ” from the prose. × → ≠ appear in prose only – kept "when in doubt".
 * ♥ U+2665 is NOT here: it is not in JetBrains Mono (GRAF dropped it, styl-ascii.md §Med-Patch).
 */
const EXTRA_CHARS = [
  '\u00A4', // ¤
  '\u00A7', // §
  '\u00B0', // °
  '\u00B7', // ·
  '\u00D7', // ×
  '\u03A0', // Π
  '\u03A9', // Ω
  '\u2013', // –
  '\u2022', // •
  '\u2026', // …
  '\u2126', // Ω (ohm sign)
  '\u2192', // →
  '\u2248', // ≈
  '\u2260', // ≠
  '\u2261', // ≡
  '\u2593', // ▓
  '\u25A0', // ■
  '\u25C6', // ◆
  // assety-m1.md v1.3 §15 pkt 3 (GRAF): arrows, box drawing, symbols (+ − ∩ ≥ from the docs)
  '\u2190', // ←
  '\u2191', // ↑
  '\u2193', // ↓
  '\u2196', // ↖
  '\u2197', // ↗
  '\u2198', // ↘
  '\u2199', // ↙
  '\u2212', // −
  '\u2229', // ∩
  '\u2264', // ≤
  '\u2265', // ≥
  '\u22A5', // ⊥
  '\u2500', // ─
  '\u2502', // │
  '\u250C', // ┌
  '\u2510', // ┐
  '\u2514', // └
  '\u2518', // ┘
  '\u251C', // ├
  '\u2524', // ┤
  '\u252C', // ┬
  '\u2534', // ┴
  '\u253C', // ┼
];

/**
 * Polish prose in data files (designer notes such as `note:` / `interact:` in src/data/fx-m1.ts)
 * is never drawn – game text is English. Polish letters and Polish quotes „ ” are therefore not
 * collected from sources. A glyph that is really drawn must be in EXTRA_CHARS or a non-Polish char.
 */
const PROSE_ONLY = new Set([...'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ„”']);

// ---- collect characters from string literals -------------------------------------------------
function walk(dir, pred, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, pred, out);
    else if (pred(p)) out.push(p);
  }
  return out;
}

function decodeEscape(s, i) {
  // s[i] === '\\'; returns [text, nextIndex]
  const c = s[i + 1];
  const simple = { n: '\n', t: '\t', r: '\r', b: '\b', f: '\f', v: '\v', 0: '\0' };
  if (c === 'u' && s[i + 2] === '{') {
    const end = s.indexOf('}', i);
    return [String.fromCodePoint(parseInt(s.slice(i + 3, end), 16)), end + 1];
  }
  if (c === 'u') return [String.fromCharCode(parseInt(s.slice(i + 2, i + 6), 16)), i + 6];
  if (c === 'x') return [String.fromCharCode(parseInt(s.slice(i + 2, i + 4), 16)), i + 4];
  if (c in simple) return [simple[c], i + 2];
  if (c === '\r' || c === '\n') return ['', i + 2];
  return [c, i + 2];
}

/** String-literal contents of a TS file (comments skipped; template ${} parts skipped). */
export function stringLiterals(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '/' && src[i + 1] === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) break;
    } else if (ch === '/' && src[i + 1] === '*') {
      i = src.indexOf('*/', i + 2);
      if (i < 0) break;
      i += 2;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      let buf = '';
      let j = i + 1;
      let depth = 0;
      while (j < src.length) {
        const c = src[j];
        if (c === '\\') {
          const [t, n] = decodeEscape(src, j);
          if (depth === 0) buf += t;
          j = n;
          continue;
        }
        if (ch === '`' && c === '$' && src[j + 1] === '{' && depth === 0) {
          depth = 1;
          j += 2;
          continue;
        }
        if (depth > 0) {
          if (c === '{') depth++;
          else if (c === '}') depth--;
          j++;
          continue;
        }
        if (c === ch || (ch !== '`' && c === '\n')) break;
        buf += c;
        j++;
      }
      out.push(buf);
      i = j + 1;
    } else i++;
  }
  return out;
}

export function collectChars() {
  const src = join(ROOT, 'src');
  const files = [
    ...walk(join(src, 'data'), (p) => p.endsWith('.ts')),
    ...walk(src, (p) => /strings[^/\\]*\.ts$/.test(p)),
  ];
  const uniqFiles = [...new Set(files)].sort();
  const found = new Map(); // char -> first file
  for (const f of uniqFiles) {
    for (const lit of stringLiterals(readFileSync(f, 'utf8'))) {
      for (const c of lit) {
        const cp = c.codePointAt(0);
        if (cp <= 0x7e || cp < 0xa0) continue; // ASCII / controls
        if (/\p{M}|\p{C}/u.test(c)) continue;
        if (PROSE_ONLY.has(c)) continue; // Polish prose (docs), see PROSE_ONLY
        if (!found.has(c)) found.set(c, relative(ROOT, f));
      }
    }
  }
  const chars = new Set();
  for (let c = 0x20; c <= 0x7e; c++) chars.add(String.fromCharCode(c));
  for (const c of found.keys()) chars.add(c);
  for (const c of EXTRA_CHARS) chars.add(c);
  return {
    chars: [...chars].sort((a, b) => a.codePointAt(0) - b.codePointAt(0)),
    found,
    files: uniqFiles,
  };
}

const label = (c) => `${c} U+${c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

async function ensureSources() {
  mkdirSync(SRC_DIR, { recursive: true });
  for (const name of [...FACES.map((f) => f.src), 'OFL.txt']) {
    const p = join(SRC_DIR, name);
    if (existsSync(p)) continue;
    const url = `${BASE}/${name.endsWith('.ttf') ? `fonts/ttf/${name}` : name}`;
    process.stdout.write(`download ${url}\n`);
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Download failed (${res.status}): ${url}`);
    writeFileSync(p, Buffer.from(await res.arrayBuffer()));
  }
}

async function main() {
  const check = process.argv.includes('--check');
  const { chars, found, files } = collectChars();
  const nonAscii = chars.filter((c) => c.codePointAt(0) > 0x7e);
  console.log(
    `scanned ${files.length} files; ${chars.length} chars (${nonAscii.length} non-ASCII)`,
  );
  for (const c of nonAscii) console.log(`  ${label(c)}  ${found.get(c) ?? '(EXTRA_CHARS)'}`);
  if (check) return;

  await ensureSources();
  const text = chars.join('');
  for (const face of FACES) {
    const full = readFileSync(join(SRC_DIR, face.src));
    // No OpenType layout features (code ligatures etc.): the canvas draws one glyph per cell.
    const out = await subsetFont(full, text, {
      targetFormat: 'woff2',
      keepFeatures: [],
      noLayoutClosure: true,
    });
    writeFileSync(join(OUT_DIR, face.out), out);
    const sha = createHash('sha256').update(full).digest('hex').slice(0, 12);
    console.log(
      `${face.out}: ${(out.length / 1024).toFixed(1)} KB (source ${face.src} sha256 ${sha}…)`,
    );
  }
  writeFileSync(
    join(OUT_DIR, 'SUBSET.txt'),
    `# Generated by scripts/font-subset.mjs – JetBrains Mono ${TAG} (SIL OFL 1.1)\n` +
      chars.map((c) => label(c)).join('\n') +
      '\n',
  );
  const ofl = join(ROOT, 'public', 'fonts', 'OFL.txt');
  writeFileSync(ofl, readFileSync(join(SRC_DIR, 'OFL.txt')));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
