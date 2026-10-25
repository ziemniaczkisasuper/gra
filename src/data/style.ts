// ALL visual style in one place: colours, glyphs, font.
// Source: /workspace/GRA/graf/styl-ascii.md v1.3 (25.10.2026, GRAF / Concept i Styl; v1.2 = §10:
// rarity names from Lore, enemy 'c' is M0-only; v1.3 = player drone named Buddy Drone).
// Status: ZATWIERDZONY – approved by the Game Director (v1.2; v1.3 = drone name only). Swap values here only;
// no other file hard-codes colours or glyphs.
//
// Rules (agreed with PROG / Silnik):
// - Every hex colour lives ONLY in PALETTE. Everything else references PALETTE (GlyphStyle.fg/bg)
//   or a PaletteKey (new data tables: LOOT_RARITY, ITEM_GLYPHS, PICKUP_GLYPHS, ENEMY_GLYPHS, ...).
// - Every glyph is exactly one code point, 1 cell wide, and MUST be in the bundled font subset
//   (src/assets/fonts/*-subset.woff2) – enforced by tests/style.test.ts.

export interface GlyphStyle {
  ch: string;
  fg: string;
  bg?: string;
  bold?: boolean;
}

export const PALETTE = {
  // §3 – v1.0 roles (already used by the M0 code)
  background: '#0B0F14',
  floor: '#3B4552',
  wall: '#8B98A5',
  rubble: '#6B7280',
  player: '#FFFFFF',
  playerHalo: '#1F3B57',
  enemy: '#FF5FC8',
  playerShot: '#BDEBFF',
  warning: '#FFE14D',
  safe: '#3DDC97',
  text: '#C9D1D9',
  // §3 – roles added for M1 (v1.1). Same hex under a different role is intentional (role = meaning).
  vegetation: '#7D7A4F',
  rails: '#56606B',
  hazardLiquid: '#9A7BFF',
  energy: '#FFE14D',
  descent: '#C9D1D9',
  chest: '#B08850',
  /** §9: materials (Scrap, Copper) – warm "metal" like chests. */
  material: '#B08850',
  rarity1: '#C9D1D9',
  rarity2: '#56B4E9',
  rarity3: '#FFB000',
  // §4 / §9 – cell backgrounds
  /** Rarity-1 cell bg: only for the Scrapper carrying loot (§9); r1 loot on the ground has no bg. */
  rarity1Bg: '#2A2F36',
  rarity2Bg: '#0E2A3F',
  rarity3Bg: '#3A2A00',
  bossBg: '#3D0F2E',
  evacBg: '#0F3326',
  descentBg: '#2A2F36',
  dataCoreBg: '#3A3410',
  /** §9: frozen target cell of an enemy blow (replaces the M0 red-ish bg). */
  telegraphBg: '#4A1240',
  /** §4 sector map: unlit sector. */
  sectorOff: '#2A323C',
  /** §6: high-contrast mode floor. */
  floorHighContrast: '#5A6573',
  // Not from GRAF – existing technical / UI values, kept here so no hex lives outside PALETTE.
  /** DOM panel background (UI i Menu) – do akceptacji GRAF. */
  uiPanel: '#121821',
  /** Debug colour for unknown tiles (never in a finished map). */
  debugMissing: '#FF00FF',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** Builds a renderer GlyphStyle from palette keys. */
export function glyph(
  ch: string,
  fg: PaletteKey,
  opts: { bg?: PaletteKey; bold?: boolean } = {},
): GlyphStyle {
  const g: GlyphStyle = { ch, fg: PALETTE[fg] };
  if (opts.bg) g.bg = PALETTE[opts.bg];
  if (opts.bold) g.bold = true;
  return g;
}

export const FONT = {
  /** Bundled OFL font (public/fonts, subset), system monospace as fallback. No CDN. */
  family: '"JetBrains Mono", ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace',
  /** Name used in @font-face (index.css) and for document.fonts.load(). */
  faceName: 'JetBrains Mono',
  /** Glyph size in CSS px: preferred and minimum (GRAF: phone min 16, 18–20 recommended). */
  preferredPx: 18,
  minPx: 16,
  /** Line height (cell height / font size). GRAF: 1.15–1.25. */
  lineHeight: 1.2,
} as const;

/** Terrain glyphs, keyed by the tile character used in map text. */
export const TILE_GLYPHS: Readonly<Record<string, GlyphStyle>> = {
  '#': { ch: '#', fg: PALETTE.wall },
  '.': { ch: '.', fg: PALETTE.floor },
  ',': { ch: ',', fg: PALETTE.rubble },
};

export const UNKNOWN_GLYPH: GlyphStyle = { ch: '?', fg: PALETTE.debugMissing };

export const PLAYER_GLYPH: GlyphStyle = {
  ch: '@',
  fg: PALETTE.player,
  bg: PALETTE.playerHalo,
  bold: true,
};

/**
 * M0 training dummy. Map text uses the marker 'E'; on screen it is the Scrap Crawler
 * glyph 'c' (mechaniki-m1.md 1.13; GRAF: lowercase letters = enemies).
 * GRAF v1.2 §10: 'c' exists ONLY in the M0 prototype; in M1 → `h` Curfew Guard.
 */
export const DUMMY_GLYPH: GlyphStyle = { ch: 'c', fg: PALETTE.enemy, bold: true };
/**
 * Telegraphing attack. v1.1 §9 / v1.2 §10: NO uppercase letter (uppercase = elite/boss) – the enemy glyph is
 * drawn in an inverted cell: bg enemy magenta, glyph background colour (the '!' overlay is the 2nd signal).
 */
export const DUMMY_TELEGRAPH_GLYPH: GlyphStyle = {
  ch: 'c',
  fg: PALETTE.background,
  bg: PALETTE.enemy,
  bold: true,
};

/** CSS colours used by the DOM UI layer. */
export const UI_COLORS = {
  overlayBg: 'rgba(11, 15, 20, 0.78)',
  panelBg: PALETTE.uiPanel,
  border: PALETTE.floor,
  text: PALETTE.text,
  accent: PALETTE.safe,
} as const;

// ---- Combat (added by PROG / Gameplay; mechaniki-m1.md v0.4 §1.7 + §1.13, GRAF styl-ascii.md §9).
// Enemy glyphs and telegraph colours come from ENEMY_GLYPHS / ENEMY_SIGNALS below (LUZ / Pracownik 4).
// They are declared later in this file, so they are read lazily (getters / functions) – no TDZ.

/** Enemy glyph of a type (ENEMY_GLYPHS, lowercase; no uppercase in the telegraph – GRAF §9). */
export function combatEnemyGlyph(type: EnemyGlyphKey): GlyphStyle {
  return toGlyphStyle(ENEMY_GLYPHS[type]);
}

/** §1.7 pt 2: wind-up = same glyph in an inverted cell (ENEMY_SIGNALS.telegraphFg/Bg). */
export function combatEnemyTelegraphGlyph(type: EnemyGlyphKey): GlyphStyle {
  const d = ENEMY_GLYPHS[type];
  return glyph(d.glyph, ENEMY_SIGNALS.telegraphFg, { bg: ENEMY_SIGNALS.telegraphBg, bold: true });
}

/** §1.7: hit enemy drawn white for 100 ms (white cell, dark glyph) – differs from the telegraph. */
export function combatEnemyFlashGlyph(type: EnemyGlyphKey): GlyphStyle {
  return glyph(ENEMY_GLYPHS[type].glyph, 'background', { bg: 'player', bold: true });
}

export const COMBAT_STYLE = {
  /** §1.7 pt 3: frozen target cell (ENEMY_SIGNALS.targetCell), blinking. */
  get telegraphCell(): GlyphStyle {
    return toGlyphStyle(ENEMY_SIGNALS.targetCell);
  },
  /** Player standing on the target cell, "off" phase of the blink (bg = target cell bg). */
  get playerOnTelegraph(): GlyphStyle {
    return glyph('@', 'player', { bg: ENEMY_SIGNALS.targetCell.bg, bold: true });
  },
  /** §1.7 pt 5: player hit – halo blinks in the enemy colour. */
  playerHit: { ch: '@', fg: PALETTE.player, bg: PALETTE.enemy, bold: true } as GlyphStyle,
  /** §1.7 pt 5: moment of the blow, 100 ms (ENEMY_SIGNALS.strike: magenta '*' on telegraphBg). */
  get strike(): GlyphStyle {
    return toGlyphStyle(ENEMY_SIGNALS.strike);
  },
  /** Line Sentry (ranged): frozen target cell and blow (ENEMY_SIGNALS.ranged*). */
  get rangedTargetCell(): GlyphStyle {
    return toGlyphStyle(ENEMY_SIGNALS.rangedTargetCell);
  },
  get rangedStrike(): GlyphStyle {
    return toGlyphStyle(ENEMY_SIGNALS.rangedStrike);
  },
  /** §2.5 sk3 Buddy Drone (ALLY_GLYPHS.buddyDrone); on damage the bg blinks 'enemy'. */
  get drone(): GlyphStyle {
    return toGlyphStyle(ALLY_GLYPHS.buddyDrone);
  },
  get droneHit(): GlyphStyle {
    const d = ALLY_GLYPHS.buddyDrone;
    return glyph(d.glyph, d.color, { bg: 'enemy', bold: true });
  },
  /** Drone shot hitting an enemy (ALLY_GLYPHS.playerShot), 100 ms. */
  get droneShot(): GlyphStyle {
    return toGlyphStyle(ALLY_GLYPHS.playerShot);
  },
  /** §2.5 sk1 Dash trail '·' on the passed cells, 150 ms. */
  get dashTrail(): GlyphStyle {
    return glyph('·', 'player');
  },
  /** §1.9: enemy wreck (passable). */
  wreck: { ch: '%', fg: PALETTE.text } as GlyphStyle,
  /** §1.8 / GRAF: player's body = white bold on the halo. */
  playerCorpse: { ch: '%', fg: PALETTE.player, bg: PALETTE.playerHalo, bold: true } as GlyphStyle,
  /** Overlay text colours (floating numbers, '!' overlays, death screen, fallback HUD). */
  text: {
    dmgToEnemy: PALETTE.player,
    critToEnemy: PALETTE.warning,
    dmgToPlayer: PALETTE.enemy,
    miss: PALETTE.text,
    kill: PALETTE.safe,
    /** §1.6: ALERT '!' (ENEMY_SIGNALS.alertMark). */
    get alert(): string {
      return PALETTE[ENEMY_SIGNALS.alertMark.color];
    },
    /** §1.7 pt 1: wind-up '!' (ENEMY_SIGNALS.telegraphMark). */
    get telegraph(): string {
      return PALETTE[ENEMY_SIGNALS.telegraphMark.color];
    },
    outline: PALETTE.background,
    hpHigh: PALETTE.safe,
    hpMid: PALETTE.warning,
    hpLow: PALETTE.enemy,
    deathTitle: PALETTE.enemy,
    deathSub: PALETTE.text,
    dim: 'rgba(11, 15, 20, 0.72)',
  },
};

// ---- DOM UI: HUD, touch controls, pause menu, text window (added by PROG / UI i Menu).
// Colours reuse the GRAF palette (graf/styl-ascii.md §3). New named values are marked
// "do akceptacji GRAF". Exposed to CSS as custom properties by ui/css-vars.ts.
export const UI_STYLE = {
  /** Page / canvas background. */
  bg: PALETTE.background,
  text: PALETTE.text,
  /** Bright text (titles, pressed controls). */
  textStrong: PALETTE.player,
  /** Frames and the empty part of bars: wall grey (6.5:1 on bg – readable, quieter than text). */
  frame: PALETTE.wall,
  accent: PALETTE.safe,
  warning: PALETTE.warning,
  danger: PALETTE.enemy,
  panelBg: UI_COLORS.panelBg,
  overlayBg: UI_COLORS.overlayBg,
  /** HUD plate under HP (dark, semi-transparent over the map) – do akceptacji GRAF. */
  hudBg: 'rgba(11, 15, 20, 0.9)',
  /** Touch control fill (semi-transparent so the ASCII map stays visible) – do akceptacji GRAF. */
  controlBg: 'rgba(18, 24, 33, 0.55)',
  /** Pressed control fill – do akceptacji GRAF. */
  controlActiveBg: 'rgba(61, 220, 151, 0.18)',
  /** Text window backdrop (dims the frozen world) – do akceptacji GRAF. */
  textBackdrop: 'rgba(11, 15, 20, 0.86)',
} as const;

/** ASCII glyphs of the DOM UI (no graphic icons – Game Director, sterowanie.md). */
export const UI_GLYPHS = {
  barFull: '#',
  barEmpty: '-',
  barOpen: '[',
  barClose: ']',
  /** Width of the HP bar in characters. */
  barCells: 10,
  pause: '[||]',
  attack: 'ATK',
  /** Joystick knob and the 8 direction marks around the base (E, SE, S, ... clockwise). */
  stickKnob: '::',
  stickMarks: ['>', '\\', 'v', '/', '<', '\\', '^', '/'],
  /** Countdown separator (mechaniki 1.16 pt 7: "3 · 2 · 1"). */
  countdownSep: ' · ',
  textNext: '>',
} as const;

// =================================================================================================
// ---- GRAF v1.1–v1.3 data tables (LUZ / Pracownik 4). Colours as PaletteKey – resolve with glyph() /
// PALETTE[key]. Keys follow Gameplay code (src/data/combat-m0.ts ENEMY_TYPES) and, where the code
// has nothing yet, design/mechaniki-m1.md v0.4 (§2.10–2.11) + fabula/teksty-m1-en.md.
// =================================================================================================

/** One glyph definition with palette colours (new tables use this instead of raw hex). */
export interface GlyphDef {
  glyph: string;
  color: PaletteKey;
  bg?: PaletteKey;
  bold?: boolean;
}

export const toGlyphStyle = (d: GlyphDef): GlyphStyle =>
  glyph(d.glyph, d.color, { bg: d.bg, bold: d.bold });

// ---- Loot rarity (§4 "Łup na ziemi"): shape = slot, colour = rarity --------------------------------
/** Rarity 1–3 (design: M1_RARITY_1–3, DEPTH_RARITY_ODDS; same numeric style as `Depth`). */
export type Rarity = 1 | 2 | 3;
export const RARITIES: readonly Rarity[] = [1, 2, 3];

export interface RarityStyle {
  /** Text id of the name (fabula/teksty-m1-en.md M1_RARITY_*). */
  nameId: string;
  /** EN name (GRAF v1.2 §10 = Lore): Salvaged / Tuned / Grid-Grade (final). UI text should use nameId. */
  name: string;
  /** Glyph colour of loot on the ground. */
  color: PaletteKey;
  /** Cell background on the ground (2nd, colour-independent signal); none for rarity 1. */
  groundBg?: PaletteKey;
  /** Cell background of a Scrapper carrying this rarity (§9) – here r1 also has one. */
  carrierBg: PaletteKey;
  /** Inventory / shop marker, independent of colour: '' / '◆' / '◆◆' (ASCII fallback in markerAscii). */
  marker: string;
  markerAscii: string;
  /** Inventory frame: none / single / double. */
  frame: 'none' | 'single' | 'double';
  /** Rarity 3: glyph briefly becomes `glyph` every `periodMs` (off with Reduce motion). */
  flash?: { glyph: string; periodMs: number };
}

export const LOOT_RARITY = {
  /** M1_RARITY_1 Salvaged – grey, no background, no marker. */
  1: {
    nameId: 'M1_RARITY_1',
    name: 'Salvaged',
    color: 'rarity1',
    carrierBg: 'rarity1Bg',
    marker: '',
    markerAscii: '',
    frame: 'none',
  },
  /** M1_RARITY_2 Tuned – blue + background + '◆'. */
  2: {
    nameId: 'M1_RARITY_2',
    name: 'Tuned',
    color: 'rarity2',
    groundBg: 'rarity2Bg',
    carrierBg: 'rarity2Bg',
    marker: '◆',
    markerAscii: '+',
    frame: 'single',
  },
  /** M1_RARITY_3 Grid-Grade – amber + background + flash every ~1.5 s + '◆◆'. */
  3: {
    nameId: 'M1_RARITY_3',
    name: 'Grid-Grade',
    color: 'rarity3',
    groundBg: 'rarity3Bg',
    carrierBg: 'rarity3Bg',
    marker: '◆◆',
    markerAscii: '++',
    frame: 'double',
    flash: { glyph: '*', periodMs: 1500 },
  },
} as const satisfies Record<Rarity, RarityStyle>;

// ---- Items (§4 loot slots, §9 pickups) ----------------------------------------------------------
/** Equipment slot (mechaniki-m1.md §2.10: broń / pancerz / moduł / narzędzie). Colour = rarity. */
export type ItemSlot = 'weapon' | 'armor' | 'module' | 'tool';

export const ITEM_GLYPHS = {
  weapon: { glyph: '/' },
  armor: { glyph: '[' },
  module: { glyph: '"' },
  tool: { glyph: '(' },
} as const satisfies Record<ItemSlot, { glyph: string }>;

/** Loot lying on the ground: slot glyph, rarity colour + background, bold (§2 "łup: bold"). */
export function lootGlyph(slot: ItemSlot, rarity: Rarity): GlyphStyle {
  const r: RarityStyle = LOOT_RARITY[rarity];
  return glyph(ITEM_GLYPHS[slot].glyph, r.color, { bg: r.groundBg, bold: true });
}

/** Fixed-colour pickups (§4 objects, §9 answers to Mechanics). */
export type PickupKind = 'material' | 'medPatch' | 'dataCore' | 'credits';

export const PICKUP_GLYPHS = {
  /** Scrap and Copper share ':' (kind shown in the pickup message / bag). */
  material: { glyph: ':', color: 'material', bold: true },
  medPatch: { glyph: '+', color: 'safe', bold: true },
  /** Contract items: always '§' + yellow. */
  dataCore: { glyph: '§', color: 'energy', bg: 'dataCoreBg', bold: true },
  /** Network Credits on the ground. */
  credits: { glyph: '$', color: 'safe' },
} as const satisfies Record<PickupKind, GlyphDef>;

// ---- Enemies (§4 "Aktorzy", §9) -----------------------------------------------------------------
/** Keys of Gameplay's ENEMY_TYPES + M1 enemies from mechaniki-m1.md §2.11 not yet in code. */
export type EnemyGlyphKey = 'crawler' | 'panelDrone' | 'curfewGuard' | 'scrapper' | 'lineSentry';

export interface EnemyGlyphDef extends GlyphDef {
  /** Elite variant (after M1): uppercase of the type letter. */
  elite: string;
}

export const ENEMY_GLYPHS = {
  /**
   * Scrap Crawler – M0 prototype ONLY (GRAF v1.2 §10). In M1 it is replaced by `h` Curfew Guard
   * (M0 template, mechaniki-m1.md §2.11); the letter 'c' stays reserved for no other enemy.
   * Magenta bold; wind-up as §9 (yellow '!', inverted cell, blinking 'x' target) – never 'C'.
   * `elite: 'C'` only satisfies the shape: M0 has no elites, 'C' is never drawn.
   */
  crawler: { glyph: 'c', color: 'enemy', bold: true, elite: 'C' },
  /** M1_ENEMY_01 Panel Drone – fast melee. */
  panelDrone: { glyph: 'd', color: 'enemy', bold: true, elite: 'D' },
  /** M1_ENEMY_02 Curfew Guard – heavy melee (GRAF role 4). Not in code yet. */
  curfewGuard: { glyph: 'h', color: 'enemy', bold: true, elite: 'H' },
  /** M1_ENEMY_03 Scrapper – weak, in groups. Not in code yet. */
  scrapper: { glyph: 's', color: 'enemy', bold: true, elite: 'S' },
  /** M1_ENEMY_04 Line Sentry – static turret. Not in code yet. */
  lineSentry: { glyph: 't', color: 'enemy', bold: true, elite: 'T' },
} as const satisfies Record<EnemyGlyphKey, EnemyGlyphDef>;

/** M1_BOSS_01 Rail Guardian: 3×2 block, weak point 'R' blinks white when exposed. */
export const BOSS_GLYPHS = {
  railGuardian: {
    rows: ['/R\\', '[=]'],
    color: 'enemy',
    bg: 'bossBg',
    bold: true,
    weakPoint: { glyph: 'R', col: 1, row: 0, exposedColor: 'player' },
  },
} as const satisfies Record<
  string,
  {
    rows: readonly string[];
    color: PaletteKey;
    bg: PaletteKey;
    bold: boolean;
    weakPoint: { glyph: string; col: number; row: number; exposedColor: PaletteKey };
  }
>;

/** Enemy telegraph & overlays (§9). Hit flash stays white (COMBAT_STYLE). */
export const ENEMY_SIGNALS = {
  /** Wind-up: inverted cell – type glyph in background colour on magenta. */
  telegraphFg: 'background',
  telegraphBg: 'enemy',
  /** '!' over the enemy during the whole wind-up. */
  telegraphMark: { glyph: '!', color: 'warning', bold: true },
  /** ALERT (detected you): grey '!' for 300 ms. */
  alertMark: { glyph: '!', color: 'text' },
  /** Frozen target cell: magenta 'x' on dark magenta, blinking every 100 ms. */
  targetCell: { glyph: 'x', color: 'enemy', bg: 'telegraphBg', bold: true },
  /** Moment of the blow on the target cell, 100 ms (assety-m1 fx_strike, Z2): magenta '*'. */
  strike: { glyph: '*', color: 'enemy', bg: 'telegraphBg', bold: true },
  /** Line Sentry (ranged) target cell (assety-m1 fx_telegraph ranged, Z1): '•' on neutral bg. */
  rangedTargetCell: { glyph: '•', color: 'enemy', bg: 'descentBg', bold: true },
  /** Ranged blow marker (fx_strike variant "ranged"). */
  rangedStrike: { glyph: '*', color: 'enemy', bg: 'descentBg', bold: true },
  /** Enemy projectile (fallback '°'; never 'o'). */
  projectile: { glyph: '•', color: 'enemy' },
  /** §5 Noise glitch: 1-frame random glyph, same colour; never during '!'. */
  noiseGlitch: ['%', '&', '#', '?'],
  /** §9 Scrapper with loot (M2): every 600 ms glyph → slot glyph for 200 ms; Reduce motion: '_'. */
  carrierUnderline: '_',
} as const satisfies {
  telegraphFg: PaletteKey;
  telegraphBg: PaletteKey;
  telegraphMark: GlyphDef;
  alertMark: GlyphDef;
  targetCell: GlyphDef;
  strike: GlyphDef;
  rangedTargetCell: GlyphDef;
  rangedStrike: GlyphDef;
  projectile: GlyphDef;
  noiseGlitch: readonly string[];
  carrierUnderline: string;
};

// ---- Player-side actors (§4, §9) ----------------------------------------------------------------
export const ALLY_GLYPHS = {
  /** Buddy Drone (final name, GRAF v1.3; glyph '¤') – same halo as the player; bg blinks 'enemy' on damage. */
  buddyDrone: { glyph: '¤', color: 'safe', bg: 'playerHalo', bold: true },
  /** Player shot. */
  playerShot: { glyph: '*', color: 'playerShot' },
} as const satisfies Record<string, GlyphDef>;

// ---- World: terrain, objects, base, sector map (§4). Semantic keys; map-text chars stay in
// TILE_GLYPHS (Level Design decides which of these get a map character). -------------------------
export const WORLD_GLYPHS = {
  floor: { glyph: '.', color: 'floor' },
  wall: { glyph: '#', color: 'wall' },
  rubble: { glyph: ',', color: 'rubble' },
  vegetation: { glyph: ';', color: 'vegetation' },
  hazardLiquid: { glyph: '~', color: 'hazardLiquid' },
  /** 2nd frame of the slow liquid animation. */
  hazardLiquidAlt: { glyph: '≈', color: 'hazardLiquid' },
  rails: { glyph: '=', color: 'rails' },
  /** v1.1: closed door changed from '+' to 'Π' (Med-Patch took '+'). */
  doorClosed: { glyph: 'Π', color: 'wall' },
  doorOpen: { glyph: "'", color: 'wall' },
  /** Puzzle terminal: inverted cell; solved → plain '&' in safe green. */
  terminal: { glyph: '&', color: 'background', bg: 'energy' },
  terminalSolved: { glyph: '&', color: 'safe' },
  evac: { glyph: '<', color: 'safe', bg: 'evacBg', bold: true },
  descent: { glyph: '>', color: 'descent', bg: 'descentBg', bold: true },
  /** Chest (ASCII fallback '0'). */
  chest: { glyph: '■', color: 'chest' },
  oldCorpse: { glyph: '%', color: 'text' },
  playerCorpse: { glyph: '%', color: 'player', bg: 'playerHalo', bold: true },
  // Base
  reprintVat: { glyph: 'Ω', color: 'safe', bold: true },
  exchange: { glyph: '$', color: 'safe', bg: 'evacBg', bold: true },
  stash: { glyph: '≡', color: 'text' },
  expeditionExit: { glyph: '>', color: 'descent', bg: 'descentBg', bold: true },
  upgradeLitH: { glyph: '-', color: 'energy' },
  upgradeLitV: { glyph: '|', color: 'energy' },
  // Sector map
  sectorOff: { glyph: '·', color: 'sectorOff' },
  sectorOn: { glyph: '▓', color: 'energy' },
} as const satisfies Record<string, GlyphDef>;

/** Memory (seen, out of sight): same glyph, colour dimmed by this factor. */
export const REMEMBERED_DIM = 0.5;
