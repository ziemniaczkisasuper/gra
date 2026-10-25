/**
 * UI settings (M0: no settings screen yet). Left-handed mode = mirror of the touch layout
 * (sterowanie.md §2). Set by URL `?lefty=1` (also stored) or localStorage `gra.ui.leftHanded`.
 * `?touch=1` forces the touch controls visible (desktop testing / screenshots).
 * Reduce motion: see createReduceMotion() below.
 */
export interface UiSettings {
  leftHanded: boolean;
  forceTouch: boolean;
}

const KEY = 'gra.ui.leftHanded';

export function loadUiSettings(
  search = location.search,
  store: Storage | null = safeStorage(),
): UiSettings {
  const q = new URLSearchParams(search);
  let leftHanded = store?.getItem(KEY) === '1';
  const lefty = q.get('lefty');
  if (lefty === '1' || lefty === '0') {
    leftHanded = lefty === '1';
    try {
      store?.setItem(KEY, lefty);
    } catch {
      /* storage blocked */
    }
  }
  return { leftHanded, forceTouch: q.get('touch') === '1' };
}

function safeStorage(): Storage | null {
  try {
    return localStorage;
  } catch {
    return null;
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
