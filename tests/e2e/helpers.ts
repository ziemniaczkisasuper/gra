// Shared helpers for the touch e2e tests (Playwright). Test-only code: reads the dev handle
// window.__gra (src/main.ts, dev server only) and never changes src/.
import { expect, type CDPSession, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { PALETTE } from '../../src/data/style';

export interface Pt {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One sampled ActionState per simulation step (+ player state just before the step). */
export interface Sample {
  tick: number;
  mode: string;
  mx: number;
  my: number;
  attack: boolean;
  pause: boolean;
  px: number;
  py: number;
  windup: number;
  cooldown: number;
  t: number;
}

/** Minimal shape of window.__gra used here (typed loosely on purpose: test-only). */
interface GraHandle {
  loop: { mode: string; pauseReason: string | null; paused: boolean };
  bus: { on(ev: string, fn: (p: Record<string, unknown>) => void): void };
  input: { sample: () => { move: { x: number; y: number }; attack: boolean; pause: boolean } };
  state: {
    tick: number;
    player: {
      x: number;
      y: number;
      fromX: number;
      fromY: number;
      moveTicks: number;
      attackWindup: number;
      attackCooldown: number;
      facing: { x: number; y: number };
    };
    map: { width: number; height: number; isSolid(x: number, y: number): boolean };
  };
  openText(f?: string[]): void;
}
export interface E2EWindow {
  __gra?: GraHandle;
  __e2e?: { samples: Sample[]; events: { ev: string; p: Record<string, unknown>; t: number }[] };
}

export const SHOTS_DIR = path.resolve(process.cwd(), '../zrzuty/e2e');

/** Screenshot to /workspace/GRA/prog/zrzuty/e2e/<project>__<name>.png */
export async function shot(page: Page, info: TestInfo, name: string): Promise<void> {
  fs.mkdirSync(SHOTS_DIR, { recursive: true });
  const file = path.join(SHOTS_DIR, `${info.project.name}__${name}.png`);
  await page.screenshot({ path: file });
  await info.attach(name, { path: file, contentType: 'image/png' });
}

/** Open the game, wait until the loop runs, install the action recorder. */
export async function openGame(page: Page, query = ''): Promise<void> {
  await page.goto(`/${query ? `?${query}` : ''}`);
  await page.waitForFunction(() => {
    const g = (window as unknown as E2EWindow).__gra;
    return !!g && g.loop.mode === 'running' && g.state.tick > 2;
  });
  await page.evaluate(() => {
    const w = window as unknown as E2EWindow;
    const g = w.__gra!;
    const rec: NonNullable<E2EWindow['__e2e']> = { samples: [], events: [] };
    w.__e2e = rec;
    const orig = g.input.sample.bind(g.input);
    g.input.sample = () => {
      const a = orig();
      const p = g.state.player;
      rec.samples.push({
        tick: g.state.tick,
        mode: g.loop.mode,
        mx: a.move.x,
        my: a.move.y,
        attack: a.attack,
        pause: a.pause,
        px: p.x,
        py: p.y,
        windup: p.attackWindup,
        cooldown: p.attackCooldown,
        t: performance.now(),
      });
      if (rec.samples.length > 4000) rec.samples.splice(0, 1000);
      return a;
    };
    for (const ev of ['paused', 'resumed', 'countdown', 'autoPauseSuppressed'])
      g.bus.on(ev, (p) => rec.events.push({ ev, p: { ...p }, t: performance.now() }));
  });
}

export async function mode(page: Page): Promise<{ mode: string; reason: string | null }> {
  return page.evaluate(() => {
    const g = (window as unknown as E2EWindow).__gra!;
    return { mode: g.loop.mode, reason: g.loop.pauseReason };
  });
}

export async function tick(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as E2EWindow).__gra!.state.tick);
}

export async function waitTicks(page: Page, n: number): Promise<void> {
  const t0 = await tick(page);
  await page.waitForFunction(
    (t) => (window as unknown as E2EWindow).__gra!.state.tick >= t,
    t0 + n,
  );
}

export async function player(page: Page): Promise<GraHandle['state']['player']> {
  return page.evaluate(() => ({ ...(window as unknown as E2EWindow).__gra!.state.player }));
}

/** Teleport the player (like setCell) – test setup only, on a free floor cell. */
export async function placePlayer(page: Page, x: number, y: number): Promise<void> {
  const ok = await page.evaluate(
    ({ x, y }) => {
      const s = (window as unknown as E2EWindow).__gra!.state;
      if (s.map.isSolid(x, y)) return false;
      const p = s.player;
      p.x = p.fromX = x;
      p.y = p.fromY = y;
      p.moveTicks = 0;
      return true;
    },
    { x, y },
  );
  expect(ok, `cell ${x},${y} must be floor`).toBe(true);
}

/** Samples recorded since index `from` (use samplesCount() before an action). */
export async function samplesSince(page: Page, from: number): Promise<Sample[]> {
  return page.evaluate((f) => (window as unknown as E2EWindow).__e2e!.samples.slice(f), from);
}
export async function samplesCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as unknown as E2EWindow).__e2e!.samples.length);
}
export async function events(
  page: Page,
): Promise<{ ev: string; p: Record<string, unknown>; t: number }[]> {
  return page.evaluate(() => (window as unknown as E2EWindow).__e2e!.events.slice());
}

export async function box(page: Page, selector: string): Promise<Box> {
  const b = await page.locator(selector).first().boundingBox();
  expect(b, `${selector} must be rendered`).not.toBeNull();
  return b!;
}
export const centre = (b: Box): Pt => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
export const overlaps = (a: Box, b: Box): boolean =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Player cell on screen (CSS px), found on the canvas by its halo background colour
 * (PALETTE.playerHalo – only the player cell uses it while alive).
 */
export async function playerScreenBox(page: Page): Promise<Box | null> {
  const halo = PALETTE.playerHalo;
  return page.evaluate((hex) => {
    const c = document.getElementById('game') as HTMLCanvasElement;
    const ctx = c.getContext('2d')!;
    const { width: w, height: h } = c;
    const d = ctx.getImageData(0, 0, w, h).data;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -1;
    let y1 = -1;
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (
          Math.abs(d[i]! - r) <= 2 &&
          Math.abs(d[i + 1]! - g) <= 2 &&
          Math.abs(d[i + 2]! - b) <= 2
        ) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
    if (x1 < 0) return null;
    const k = c.width / c.getBoundingClientRect().width; // device px per CSS px
    return { x: x0 / k, y: y0 / k, width: (x1 - x0 + 1) / k, height: (y1 - y0 + 1) / k };
  }, halo);
}

/** Make the page "hidden" and fire visibilitychange (Playwright cannot background a tab). */
export async function fakeVisibility(page: Page, state: 'hidden' | 'visible'): Promise<void> {
  await page.evaluate((s) => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }, state);
}

// ---------------------------------------------------------------------------------------------
// Touch drivers. Chromium: real touch through CDP (browser turns it into Pointer Events with
// separate pointerIds, honours touch-action). WebKit: no CDP → synthetic PointerEvents with
// pointerType 'touch' dispatched at the element under the finger (taps on DOM buttons use the
// real page.touchscreen.tap instead).

export interface TouchDriver {
  readonly kind: 'cdp' | 'synthetic';
  down(id: number, p: Pt): Promise<void>;
  move(id: number, p: Pt): Promise<void>;
  up(id: number): Promise<void>;
  /** Tap that also produces a click (DOM buttons). */
  tap(p: Pt): Promise<void>;
  /** Move in `steps` straight segments (thumb drag). */
  drag(id: number, from: Pt, to: Pt, steps?: number): Promise<void>;
}

class CdpTouch implements TouchDriver {
  readonly kind = 'cdp' as const;
  private pts = new Map<number, Pt>();
  private lastDragEnd = 0;
  private dragged = new Set<number>();
  constructor(private readonly s: CDPSession) {}

  private list() {
    return [...this.pts].map(([id, p]) => ({
      x: p.x,
      y: p.y,
      id,
      radiusX: 8,
      radiusY: 8,
      force: 1,
    }));
  }
  async down(id: number, p: Pt) {
    this.pts.set(id, p);
    await this.s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: this.list() });
  }
  async move(id: number, p: Pt) {
    this.pts.set(id, p);
    await this.s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: this.list() });
  }
  async up(id: number) {
    const p = this.pts.get(id);
    if (!p) return;
    this.pts.delete(id);
    if (this.dragged.delete(id)) this.lastDragEnd = Date.now();
    // CDP: touchEnd releases exactly the listed points (checked empirically, Chromium 1.64);
    // the other fingers stay down.
    await this.s.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [{ x: p.x, y: p.y, id, radiusX: 8, radiusY: 8, force: 1 }],
    });
  }
  async tap(p: Pt) {
    // Chromium's tap suppression drops a tap that comes < ~300 ms after a drag/fling ended
    // (browser behaviour, also on Android) – wait it out so button taps produce a click.
    const wait = 400 - (Date.now() - this.lastDragEnd);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    const id = 90 + this.pts.size;
    await this.down(id, p);
    await this.up(id);
  }
  async drag(id: number, from: Pt, to: Pt, steps = 6) {
    this.dragged.add(id);
    for (let i = 1; i <= steps; i++)
      await this.move(id, {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
  }
}

class SyntheticTouch implements TouchDriver {
  readonly kind = 'synthetic' as const;
  constructor(private readonly page: Page) {}
  private fire(type: string, id: number, p: Pt | null) {
    return this.page.evaluate(
      ({ type, id, p }) => {
        const w = window as unknown as {
          __e2eTargets?: Map<number, { t: Element; p: { x: number; y: number } }>;
        };
        const map = (w.__e2eTargets ??= new Map());
        let entry = map.get(id);
        if (type === 'pointerdown') {
          entry = { t: document.elementFromPoint(p!.x, p!.y) ?? document.body, p: p! };
          map.set(id, entry);
        }
        if (!entry) return;
        if (p) entry.p = p;
        entry.t.dispatchEvent(
          new PointerEvent(type, {
            pointerId: id,
            pointerType: 'touch',
            isPrimary: id === 1,
            clientX: entry.p.x,
            clientY: entry.p.y,
            width: 16,
            height: 16,
            pressure: type === 'pointerup' ? 0 : 0.5,
            buttons: type === 'pointerup' ? 0 : 1,
            bubbles: true,
            cancelable: true,
            composed: true,
          }),
        );
        if (type === 'pointerup') map.delete(id);
      },
      { type, id, p },
    );
  }
  down(id: number, p: Pt) {
    return this.fire('pointerdown', id, p);
  }
  move(id: number, p: Pt) {
    return this.fire('pointermove', id, p);
  }
  up(id: number) {
    return this.fire('pointerup', id, null);
  }
  tap(p: Pt) {
    return this.page.touchscreen.tap(p.x, p.y);
  }
  async drag(id: number, from: Pt, to: Pt, steps = 6) {
    for (let i = 1; i <= steps; i++)
      await this.move(id, {
        x: from.x + ((to.x - from.x) * i) / steps,
        y: from.y + ((to.y - from.y) * i) / steps,
      });
  }
}

export async function touchDriver(page: Page, browserName: string): Promise<TouchDriver> {
  if (browserName === 'chromium') return new CdpTouch(await page.context().newCDPSession(page));
  return new SyntheticTouch(page);
}

/** Joystick zone centre-ish start point for the thumb (lower part of the movement half). */
export async function thumbStart(page: Page, lefty = false): Promise<Pt> {
  const z = await box(page, '.stick-zone');
  return { x: z.x + z.width * (lefty ? 0.6 : 0.4), y: z.y + z.height * 0.6 };
}
