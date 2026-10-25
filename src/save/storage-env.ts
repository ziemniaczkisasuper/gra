// Browser storage environment: iOS / standalone detection and persistent-storage request.
// All functions take an injectable environment so they are unit-testable without a browser.

export interface NavigatorLike {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
  /** iOS Safari: true when started from the home screen. */
  standalone?: boolean;
  storage?: { persist?: () => Promise<boolean>; persisted?: () => Promise<boolean> };
}

export interface StorageEnv {
  navigator?: NavigatorLike;
  matchMedia?: (query: string) => { matches: boolean };
}

const defaultEnv = (): StorageEnv => ({
  navigator: typeof navigator !== 'undefined' ? (navigator as NavigatorLike) : undefined,
  matchMedia:
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? (q) => window.matchMedia(q)
      : undefined,
});

/** iPhone / iPad / iPod, including iPadOS that reports itself as "MacIntel" with touch. */
export function isIos(env: StorageEnv = defaultEnv()): boolean {
  const n = env.navigator;
  if (!n) return false;
  if (/iPhone|iPad|iPod/.test(n.userAgent ?? '')) return true;
  return n.platform === 'MacIntel' && (n.maxTouchPoints ?? 0) > 1;
}

/** Installed web app: iOS `navigator.standalone` or CSS display-mode standalone. */
export function isStandalone(env: StorageEnv = defaultEnv()): boolean {
  if (env.navigator?.standalone === true) return true;
  try {
    return env.matchMedia?.('(display-mode: standalone)').matches === true;
  } catch {
    return false;
  }
}

/** iOS browser tab (not a home-screen app): storage may be evicted after ~7 days without a visit. */
export function isIosNotStandalone(env: StorageEnv = defaultEnv()): boolean {
  return isIos(env) && !isStandalone(env);
}

export type PersistState = 'granted' | 'denied' | 'unsupported' | 'unknown';

/** Result of the last requestPersistentStorage() ('unknown' before it finished). */
export let persistState: PersistState = 'unknown';

/** Calls navigator.storage.persist() if available (once at start). */
export async function requestPersistentStorage(
  env: StorageEnv = defaultEnv(),
): Promise<PersistState> {
  const persist = env.navigator?.storage?.persist;
  if (typeof persist !== 'function') {
    persistState = 'unsupported';
    return persistState;
  }
  try {
    persistState = (await persist.call(env.navigator!.storage)) ? 'granted' : 'denied';
  } catch {
    persistState = 'denied';
  }
  return persistState;
}
