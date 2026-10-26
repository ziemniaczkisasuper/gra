import { describe, expect, it, vi } from 'vitest';
import {
  autoAimEnabled,
  createReduceMotion,
  loadUiSettings,
  setAutoAim,
  subscribeAutoAim,
  type MediaLike,
} from '../src/ui/settings';

const memStore = (init: Record<string, string> = {}) => {
  const m = new Map(Object.entries(init));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
    map: m,
  };
};
const fakeMedia = (matches: boolean) => {
  const fns: ((e: { matches: boolean }) => void)[] = [];
  const mq: MediaLike & { fire(m: boolean): void } = {
    matches,
    addEventListener: (_t, fn) => void fns.push(fn),
    fire(m) {
      (mq as { matches: boolean }).matches = m;
      for (const f of fns) f({ matches: m });
    },
  };
  return mq;
};

describe('reduce motion setting', () => {
  it('defaults to prefers-reduced-motion and follows its changes', () => {
    const media = fakeMedia(true);
    const rm = createReduceMotion({ search: '', store: memStore(), media });
    const seen = vi.fn();
    rm.subscribe(seen);
    expect(seen).toHaveBeenLastCalledWith(true); // called at once (startup)
    media.fire(false);
    expect(rm.value).toBe(false);
    expect(seen).toHaveBeenLastCalledWith(false);
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('?reduceMotion=1|0 overrides the OS setting and is stored', () => {
    const store = memStore();
    expect(
      createReduceMotion({ search: '?reduceMotion=1', store, media: fakeMedia(false) }).value,
    ).toBe(true);
    expect(store.map.get('gra.ui.reduceMotion')).toBe('1');
    expect(
      createReduceMotion({ search: '?reduceMotion=0', store, media: fakeMedia(true) }).value,
    ).toBe(false);
    expect(store.map.get('gra.ui.reduceMotion')).toBe('0');
  });

  it('a stored choice wins over the OS setting, and OS changes are then ignored', () => {
    const media = fakeMedia(true);
    const rm = createReduceMotion({
      search: '',
      store: memStore({ 'gra.ui.reduceMotion': '0' }),
      media,
    });
    expect(rm.value).toBe(false);
    media.fire(true);
    expect(rm.value).toBe(false);
  });

  it('set(on) (future settings screen) notifies, persists and pins the choice', () => {
    const store = memStore();
    const media = fakeMedia(false);
    const rm = createReduceMotion({ search: '', store, media });
    const seen = vi.fn();
    rm.subscribe(seen);
    rm.set(true);
    expect(seen).toHaveBeenLastCalledWith(true);
    expect(store.map.get('gra.ui.reduceMotion')).toBe('1');
    media.fire(false);
    expect(rm.value).toBe(true);
    rm.set(true); // no change → no extra notification
    expect(seen).toHaveBeenCalledTimes(2);
  });

  it('works without storage or matchMedia', () => {
    expect(createReduceMotion({ search: '', store: null, media: null }).value).toBe(false);
  });

  it('left-handed flag from URL / storage (unchanged)', () => {
    const store = memStore();
    expect(loadUiSettings('?lefty=1', store).leftHanded).toBe(true);
    expect(loadUiSettings('', store).leftHanded).toBe(true);
    expect(loadUiSettings('?lefty=0', store).leftHanded).toBe(false);
  });
});

describe('auto-aim setting', () => {
  it('defaults off, setAutoAim persists, and autoAimEnabled reads it back', () => {
    const store = memStore();
    expect(autoAimEnabled(store)).toBe(false);
    const seen: boolean[] = [];
    const stop = subscribeAutoAim((on) => seen.push(on));
    setAutoAim(true, store);
    expect(store.map.get('gra.ui.autoAim')).toBe('1');
    expect(autoAimEnabled(store)).toBe(true);
    expect(seen.at(-1)).toBe(true);
    setAutoAim(false, store);
    expect(autoAimEnabled(store)).toBe(false);
    expect(store.map.get('gra.ui.autoAim')).toBe('0');
    stop();
  });

  it('?autoaim=1|0 is stored like lefty', () => {
    const store = memStore();
    loadUiSettings('?autoaim=1', store);
    expect(autoAimEnabled(store)).toBe(true);
    expect(store.map.get('gra.ui.autoAim')).toBe('1');
    loadUiSettings('?autoaim=0&lefty=1', store);
    expect(autoAimEnabled(store)).toBe(false);
    expect(loadUiSettings('', store).leftHanded).toBe(true);
  });

  it('is false when storage throws', () => {
    const store = memStore();
    store.getItem = () => {
      throw new Error('blocked');
    };
    expect(autoAimEnabled(store)).toBe(false);
  });
});
