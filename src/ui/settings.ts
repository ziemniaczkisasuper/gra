/**
 * UI settings (M0: no settings screen yet). Left-handed mode = mirror of the touch layout
 * (sterowanie.md §2). Set by URL `?lefty=1` (also stored) or localStorage `gra.ui.leftHanded`.
 * `?touch=1` forces the touch controls visible (desktop testing / screenshots).
 * Auto-aim (wariant-twin-stick §12, M1_SET_AUTOAIM): `?autoaim=1|0` or `gra.ui.autoAim`.
 * Reduce motion: see createReduceMotion() below.
 */
export interface UiSettings {
  leftHanded: boolean;
  forceTouch: boolean;
}

const KEY = 'gra.ui.leftHanded';
const AUTO_KEY = 'gra.ui.autoAim';

export function loadUiSettings(
  search = location.search,
  store: Storage | null = safeStorage(),
): UiSettings {
  const q = new URLSearchParams(search);
  let leftHanded = false;
  try {
    leftHanded = store?.getItem(KEY) === '1';
  } catch {
    /* storage blocked */
  }
  const lefty = q.get('lefty');
  if (lefty === '1' || lefty === '0') {
    leftHanded = lefty === '1';
    try {
      store?.setItem(KEY, lefty);
    } catch {
      /* storage blocked */
    }
  }
  const auto = q.get('autoaim');
  if (auto === '1' || auto === '0') {
    const on = auto === '1';
    try {
      store?.setItem(AUTO_KEY, auto);
      autoFallback = store ? null : on;
    } catch {
      autoFallback = on;
    }
  }
  return { leftHanded, forceTouch: q.get('touch') === '1' };
}

type AutoListener = (on: boolean) => void;
const autoListeners = new Set<AutoListener>();
/** Session value used only when storage is missing or throws (private mode). */
let autoFallback: boolean | null = null;

function readAuto(store: Storage | null): boolean {
  try {
    const v = store?.getItem(AUTO_KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    return autoFallback ?? false;
  }
  if (!store) return autoFallback ?? false;
  return false;
}

/** Auto-aim (default off). Reads storage; safe if localStorage throws. No DOM. */
export function autoAimEnabled(store: Storage | null = safeStorage()): boolean {
  return readAuto(store);
}

/** Persist Auto-aim and notify listeners (touch controls show or hide ATK). */
export function setAutoAim(on: boolean, store: Storage | null = safeStorage()): void {
  try {
    store?.setItem(AUTO_KEY, on ? '1' : '0');
    autoFallback = store ? null : on;
  } catch {
    autoFallback = on;
  }
  for (const fn of [...autoListeners]) fn(on);
}

/** Called now and on every setAutoAim. Returns unsubscribe. */
export function subscribeAutoAim(fn: AutoListener): () => void {
  autoListeners.add(fn);
  fn(autoAimEnabled());
  return () => autoListeners.delete(fn);
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

// ---- "Ask before going deeper" (M1_RISK_SETTING). Default ON.
const ASK_KEY = 'gra.ui.askBeforeDeeper';
/** Used only when storage is missing (node tests, private mode). */
let askMemory: boolean | null = null;

/**
 * Whether stepping on `>` / the arena gate asks before descending.
 * A stored `'0'` or `'1'` wins. An absent key is ON. With no Storage, the
 * in-memory value (default ON) is used.
 */
export function askBeforeDeeper(store: Storage | null = safeStorage()): boolean {
  if (!store) return askMemory ?? true;
  try {
    const v = store.getItem(ASK_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    return askMemory ?? true;
  }
  return true;
}

/** Persist the descent confirm. Writes storage when it is available. */
export function setAskBeforeDeeper(on: boolean, store: Storage | null = safeStorage()): void {
  askMemory = on;
  try {
    store?.setItem(ASK_KEY, on ? '1' : '0');
  } catch {
    askMemory = on;
  }
}

// ---- Hints (M1_TUT_SETTING). Default ON. Off hides the bar and does not freeze the prologue.
const HINTS_KEY = 'gra.ui.hints';
/** Used only when storage is missing (node tests, private mode). */
let hintsMemory: boolean | null = null;

/**
 * Whether the hint bar is shown and tutorial steps may freeze the world.
 * A stored `'0'` or `'1'` wins. An absent key is ON.
 */
export function hintsEnabled(store: Storage | null = safeStorage()): boolean {
  if (!store) return hintsMemory ?? true;
  try {
    const v = store.getItem(HINTS_KEY);
    if (v === '0') return false;
    if (v === '1') return true;
  } catch {
    return hintsMemory ?? true;
  }
  return true;
}

/** Persist the hint toggle. Writes storage when it is available. */
export function setHintsEnabled(on: boolean, store: Storage | null = safeStorage()): void {
  hintsMemory = on;
  try {
    store?.setItem(HINTS_KEY, on ? '1' : '0');
  } catch {
    hintsMemory = on;
  }
}

// ---- Reduce motion (graf/styl-ascii.md §6; mechaniki 1.7): no blinking / pulsing / shake.
const RM_KEY = 'gra.ui.reduceMotion';
const RM_QUERY = '(prefers-reduced-motion: reduce)';

/** Minimal MediaQueryList (testable without a browser). */
export interface MediaLike {
  readonly matches: boolean;
  addEventListener(type: 'change', fn: (e: { matches: boolean }) => void): void;
}

export interface ReduceMotion {
  readonly value: boolean;
  /** Explicit choice (future settings screen): stored, wins over the OS setting. */
  set(on: boolean): void;
  /** Called now and on every change. Returns unsubscribe. */
  subscribe(fn: (on: boolean) => void): () => void;
}

/**
 * Priority: `?reduceMotion=1|0` (also stored) > localStorage `gra.ui.reduceMotion` >
 * `prefers-reduced-motion: reduce`. OS changes are followed only while the user has made
 * no explicit choice.
 */
export function createReduceMotion(
  opts: { search?: string; store?: Storage | null; media?: MediaLike | null } = {},
): ReduceMotion {
  const store = opts.store === undefined ? safeStorage() : opts.store;
  const media =
    opts.media === undefined
      ? typeof matchMedia === 'function'
        ? (matchMedia(RM_QUERY) as MediaLike)
        : null
      : opts.media;
  const persist = (on: boolean) => {
    try {
      store?.setItem(RM_KEY, on ? '1' : '0');
    } catch {
      /* storage blocked */
    }
  };
  const q = new URLSearchParams(
    opts.search ?? (typeof location !== 'undefined' ? location.search : ''),
  );
  const fromUrl = q.get('reduceMotion');
  let stored: string | null = null;
  try {
    stored = store?.getItem(RM_KEY) ?? null;
  } catch {
    /* storage blocked */
  }
  if (fromUrl === '1' || fromUrl === '0') {
    stored = fromUrl;
    persist(fromUrl === '1');
  }
  let explicit = stored === '1' || stored === '0';
  let value = explicit ? stored === '1' : !!media?.matches;
  const listeners = new Set<(on: boolean) => void>();
  const apply = (on: boolean) => {
    if (on === value) return;
    value = on;
    for (const fn of [...listeners]) fn(on);
  };
  media?.addEventListener('change', (e) => {
    if (!explicit) apply(e.matches);
  });
  return {
    get value() {
      return value;
    },
    set(on) {
      explicit = true;
      persist(on);
      apply(on);
    },
    subscribe(fn) {
      listeners.add(fn);
      fn(value);
      return () => listeners.delete(fn);
    },
  };
}

let shared: ReduceMotion | null = null;
/** App-wide instance (created on first use). */
export function reduceMotion(): ReduceMotion {
  return (shared ??= createReduceMotion());
}
/** For the future settings screen. */
export function setReduceMotion(on: boolean): void {
  reduceMotion().set(on);
}
