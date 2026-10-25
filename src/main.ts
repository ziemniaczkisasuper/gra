import './style.css';
import { EventBus, type GameEvents, type SaveTrigger } from './core/events';
import { stepGame, type GameState } from './core/game';
import { GameLoop } from './core/loop';
import { DEFAULT_MAP, MAPS, type MapId } from './data/maps';
import { M0 } from './data/mechanics-m0';
import { STRINGS } from './data/strings';
import { FONT, PALETTE } from './data/style';
import { InputManager } from './input/actions';
import { KeyboardSource } from './input/keyboard';
import { TouchSource } from './input/touch';
import { pickFontPx } from './render/camera';
import { GlyphRenderer } from './render/glyph-renderer';
import { renderScene } from './render/scene';
import { getCombatHud, setCombatReduceMotion, takeAutoPauseRequest } from './combat/combat';
import { installCombat } from './combat/install';
import './contracts/save'; // registers the 'contracts' save section BEFORE readSave()/gameFromSave()
import { installContracts } from './integration/contracts';
import { renderCombatOverlay } from './combat/overlay';
import {
  decodeSaveCode,
  gameFromSave,
  readSave,
  snapshot,
  writeSave,
  type KeyValueStore,
  type SaveData,
} from './save';
import { downloadSaveFile, pickSaveFile } from './save/files';
import { memoryStore } from './save/storage';
import { initSaveApi } from './save/api';
import { isIosNotStandalone, requestPersistentStorage } from './save/storage-env';
import { applyCssVars } from './ui/css-vars';
import { createUi } from './ui/overlay';
import { loadUiSettings, reduceMotion } from './ui/settings';

// ---- wiring (DOM lives here and in render/ui; game logic in core/world/entities is DOM-free)
const canvas = document.getElementById('game') as HTMLCanvasElement;
const uiRoot = document.getElementById('ui') as HTMLElement;
applyCssVars(); // UI colours/font from data/style.ts → CSS custom properties
const uiSettings = loadUiSettings(); // ?lefty=1 (left-handed mirror), ?touch=1 (force touch UI)
// Reduce motion: OS setting / ?reduceMotion=1|0 / localStorage; drives combat fx and UI anims.
reduceMotion().subscribe((on) => {
  setCombatReduceMotion(on); // telegraph 'x' steady instead of blinking
  uiRoot.classList.toggle('reduce-motion', on); // HP blink / hit shake off (style.css)
});

function getStore(): KeyValueStore {
  try {
    const t = '__gra_test__';
    localStorage.setItem(t, '1');
    localStorage.removeItem(t);
    return localStorage;
  } catch {
    return memoryStore(); // storage blocked (private mode) – session only
  }
}

const store = getStore();
const bus = new EventBus<GameEvents>();
// Test map: arena 40x20 by default, ?map=large for the 60x30 map.
const mapParam = new URLSearchParams(location.search).get('map');
const mapRows = MAPS[(mapParam && mapParam in MAPS ? mapParam : DEFAULT_MAP) as MapId];
// Save v3: seed, tick, rng streams, player + module sections (save/sections.ts registry).
const fromSave = (s: SaveData | null): GameState => {
  try {
    return gameFromSave(s, { mapRows });
  } catch (e) {
    console.warn('Save could not be applied – new game', e);
    return gameFromSave(null, { mapRows });
  }
};
let state: GameState = fromSave(readSave(store));
// Save protection (README „Przypomnienie o eksporcie”): UI imports `saveApi` from save/api.ts.
const saveApi = initSaveApi({
  getState: () => state,
  store,
  bus,
  iosNotStandalone: () => isIosNotStandalone(),
  download: downloadSaveFile,
});

installCombat(); // PROG / Gameplay: combat systems (combat/README.md)
// LUZ contracts (prog/kontrakty-m1.md): after combat, so this tick's combat events are visible.
installContracts((e) => (bus.emit as (t: string, p: unknown) => void)(e.type, e.payload));
// TODO(base, M1): after evacuation / death reprint call refillContractsAtBase(state, ctx, emit)
// from integration/contracts.ts (ctx = lift stops + solved variants). M0 has no base yet.

const input = new InputManager();
const keyboard = new KeyboardSource(window, undefined, undefined, window); // blur → release keys
input.add(keyboard);
const touch = new TouchSource();
input.add(touch);

const renderer = new GlyphRenderer(canvas, PALETTE.background, FONT.family, FONT.lineHeight);

const loop = new GameLoop({
  stepMs: M0.TICK_MS,
  maxStepsPerFrame: M0.MAX_STEPS_PER_FRAME,
  events: bus,
  update(dt) {
    const actions = input.sample();
    if (actions.pause) {
      loop.pause('menu');
      return;
    }
    stepGame(state, actions, dt);
    if (takeAutoPauseRequest(state)) autoPause(); // trigger D (hit while away) – combat
    if (input.idleMs >= M0.AUTOPAUSE_IDLE_MS) autoPause(); // trigger E
  },
  countdownMs: M0.RESUME_COUNTDOWN_MS,
  onResumeStart: () => input.reset(), // keys held before RESUME do nothing
  countdownTick() {
    // Input is read during the countdown; new presses act in the first tick after it.
    if (input.collect()) loop.pause('menu'); // Esc/P cancels the countdown
  },
  idle() {
    // While paused only Esc/P (here) and RESUME / Enter (ui) resume. In 'text' the text
    // window owns the keyboard (Esc closes it) – the pause edge must not resume there.
    if (input.sample().pause && loop.pauseReason !== 'text') loop.resume();
  },
  render: (alpha) => {
    renderScene(renderer, state, alpha);
    renderCombatOverlay(renderer, state, alpha, { fallbackHud: false }); // HP is in the DOM HUD
    const hp = getCombatHud(state);
    ui.hud.setHp(hp.hp, hp.maxHp);
  },
  requestFrame: (cb) => requestAnimationFrame(cb),
  cancelFrame: (id) => cancelAnimationFrame(id),
});

function save(trigger: SaveTrigger): void {
  const data = snapshot(state, Date.now());
  try {
    writeSave(store, data);
    bus.emit('saved', { savedAt: data.savedAt, trigger });
  } catch (e) {
    console.warn('Save failed', e);
  }
}

/** Focus loss etc.: pause (keeps an existing 'text'/'menu' reason), reset input, save now. */
function autoPause(): void {
  loop.pause('auto');
  input.reset();
  save('auto');
}

function applySave(data: SaveData): void {
  try {
    state = gameFromSave(data, { mapRows }); // all-or-nothing: on error keep the current game
  } catch {
    ui.toast(STRINGS.importFailed);
    return;
  }
  writeSave(store, data);
  bus.emit('saved', { savedAt: data.savedAt, trigger: 'import' });
  ui.toast(STRINGS.imported);
}

const ui = createUi(
  uiRoot,
  {
    onPause: () => {
      input.markActivity();
      loop.pause('menu');
    },
    onResume: () => loop.resume(),
    onExportFile: () => void saveApi.exportFile(),
    onImportFile: () => {
      pickSaveFile().then(
        (d) => d && applySave(d),
        () => ui.toast(STRINGS.importFailed),
      );
    },
    onCopyCode: async () => {
      const code = await saveApi.exportCode();
      try {
        await navigator.clipboard.writeText(code);
        ui.toast(STRINGS.codeCopied);
      } catch {
        ui.toast(STRINGS.codeShown);
      }
      return code;
    },
    onImportCode: (code) => {
      decodeSaveCode(code).then(applySave, () => ui.toast(STRINGS.importFailed));
    },
    onActivity: () => input.markActivity(),
    onOpenText: () => loop.pause('text'),
    // Closing a note resumes at once; after an auto-pause while reading – with the countdown.
    onCloseText: () => loop.resume({ countdown: loop.autoPausedDuring }),
    // The key that closed the text / resumed the menu acts only after release + press.
    onKeyConsumed: (code) => keyboard.block(code),
  },
  { touch, settings: uiSettings },
);

bus.on('paused', ({ reason }) => {
  input.reset();
  if (reason !== 'auto') save(reason); // auto-pause saves in autoPause()
  ui.hideCountdown();
  ui.showPaused(reason);
});
bus.on('countdown', ({ digit }) => {
  ui.hidePaused();
  ui.showCountdown(digit);
});
bus.on('resumed', () => {
  ui.hidePaused();
  ui.hideCountdown();
});

// ---- auto-pause triggers (mechaniki 1.11 A, B; E is in update; D needs combat – Gameplay)
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') autoPause();
});
window.addEventListener('blur', autoPause);
window.addEventListener('pagehide', autoPause);
document.addEventListener('freeze', autoPause);

function fit(): void {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const px = pickFontPx(w, h, {
    preferredPx: FONT.preferredPx,
    minPx: FONT.minPx,
    lineHeight: FONT.lineHeight,
    minLandscape: M0.VIEW_MIN_LANDSCAPE,
    minPortrait: M0.VIEW_MIN_PORTRAIT,
  });
  renderer.resize(w, h, window.devicePixelRatio, px);
}
let lastSize = `${window.innerWidth}x${window.innerHeight}`;
window.addEventListener('resize', () => {
  const size = `${window.innerWidth}x${window.innerHeight}`;
  if (size === lastSize) return;
  lastSize = size;
  fit();
  autoPause(); // trigger B: layout changed (also while paused: suppressed, but noted + saved)
});

async function boot(): Promise<void> {
  // Wait (max 1.5 s) for the bundled font so the glyph cache uses it; fallback = system mono.
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`${FONT.preferredPx}px "${FONT.faceName}"`),
        document.fonts.load(`bold ${FONT.preferredPx}px "${FONT.faceName}"`),
      ]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* fallback font */
  }
  fit();
  loop.start();
  void requestPersistentStorage().then((p) => console.info(`storage.persist: ${p}`));
  saveApi.checkExportReminder(); // after load; UI may also call saveApi.checkExportReminder()
}
void boot();

if (import.meta.env.DEV) {
  // Debug handle for other departments (dev server only).
  Object.assign(window, {
    __gra: {
      loop,
      bus,
      input,
      get state() {
        return state;
      },
      /** Open the text window, e.g. __gra.openText(['First page.', 'Second page.']). */
      openText: (fragments?: string[]) =>
        ui.showText(
          fragments ?? [
            'Day 41. The rail line is dead, but the relays still hum at night.',
            'If you are reading this, the printer brought you back. Do not trust the quiet.',
          ],
        ),
    },
  });
}
