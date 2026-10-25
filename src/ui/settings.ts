/**
 * UI settings (M0: no settings screen yet). Left-handed mode = mirror of the touch layout
 * (sterowanie.md §2). Set by URL `?lefty=1` (also stored) or localStorage `gra.ui.leftHanded`.
 * `?touch=1` forces the touch controls visible (desktop testing / screenshots).
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
