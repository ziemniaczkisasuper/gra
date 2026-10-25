// E2E: touch controls M0 in phone emulation (sterowanie.md §2, §4, §6, "Pauza przy czytaniu tekstów").
// Projects: pixel-* (Chromium, real CDP multi-touch) and iphone-* (WebKit, synthetic pointers).
import { expect, test, type Page } from '@playwright/test';
import { JOYSTICK, SECTOR_DIRS } from '../../src/input/joystick';
import {
  box,
  centre,
  events,
  fakeVisibility,
  mode,
  openGame,
  overlaps,
  placePlayer,
  player,
  playerScreenBox,
  samplesCount,
  samplesSince,
  shot,
  thumbStart,
  tick,
  touchDriver,
  waitTicks,
  type Pt,
} from './helpers';

const R = JOYSTICK.radius;
const at = (p: Pt, deg: number, dist: number): Pt => ({
  x: p.x + Math.cos((deg * Math.PI) / 180) * dist,
  y: p.y + Math.sin((deg * Math.PI) / 180) * dist,
});
const sleep = (page: Page, ms: number) => page.waitForTimeout(ms);
/** Open floor in the start room of ARENA_M0, away from walls and the enemy. */
const OPEN = { x: 6, y: 5 };

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`));
});

test.describe('1. joystick', () => {
  test('pojawia się pod kciukiem w lewej połowie i znika po puszczeniu', async ({ page, browserName }, info) => {
    await openGame(page);
    const t = await touchDriver(page, browserName);
    const vw = page.viewportSize()!;
    const p = await thumbStart(page);
    expect(p.x).toBeLessThan(vw.width / 2);
    await expect(page.locator('.stick-base')).toBeHidden();
    await t.down(1, p);
    await expect(page.locator('.stick-base')).toBeVisible();
    const b = centre(await box(page, '.stick-base'));
    const k = centre(await box(page, '.stick-knob'));
    expect(Math.abs(b.x - p.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(b.y - p.y)).toBeLessThanOrEqual(2);
    expect(Math.abs(k.x - p.x)).toBeLessThanOrEqual(2);
    expect(Math.abs(k.y - p.y)).toBeLessThanOrEqual(2);
    await t.drag(1, p, at(p, 0, R * 0.8));
    await shot(page, info, '01-joystick-aktywny');
    await t.up(1);
    await expect(page.locator('.stick-base')).toBeHidden();
  });

  test('rusza gracza w 8 kierunkach (sektory 45°)', async ({ page, browserName }) => {
    await openGame(page);
    const t = await touchDriver(page, browserName);
    const p = await thumbStart(page);
    const bad: string[] = [];
    for (let s = 0; s < 8; s++) {
      await placePlayer(page, OPEN.x, OPEN.y);
      await waitTicks(page, 1);
      const from = await player(page);
      const n0 = await samplesCount(page);
      await t.down(1, p);
      await t.drag(1, p, at(p, s * 45, R * 0.9), 4);
      await sleep(page, 420);
      const got = (await samplesSince(page, n0)).filter((x) => x.mx !== 0 || x.my !== 0);
      await t.up(1);
      await waitTicks(page, 2);
      const to = await player(page);
      const want = SECTOR_DIRS[s]!;
      const last = got.at(-1);
      const dx = Math.sign(to.x - from.x);
      const dy = Math.sign(to.y - from.y);
      if (!last || last.mx !== want.x || last.my !== want.y || dx !== want.x || dy !== want.y)
        bad.push(
          `sektor ${s} (${s * 45}°): akcja=${last ? `${last.mx},${last.my}` : 'brak'} ruch=${dx},${dy} oczekiwane=${want.x},${want.y}`,
        );
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });

  test('2. martwa strefa: mały ruch kciuka = brak ruchu', async ({ page, browserName }) => {
    await openGame(page);
    const t = await touchDriver(page, browserName);
    const p = await thumbStart(page);
    await placePlayer(page, OPEN.x, OPEN.y);
    const from = await player(page);
    const n0 = await samplesCount(page);
    await t.down(1, p);
    // 0.12·R < 15 % dead zone, in several directions (thumb jitter).
    for (const deg of [0, 90, 200, 315]) await t.move(1, at(p, deg, R * 0.12));
    await sleep(page, 400);
    const s = await samplesSince(page, n0);
    expect(s.length).toBeGreaterThan(4);
    expect(s.every((x) => x.mx === 0 && x.my === 0)).toBe(true);
    expect(await player(page)).toMatchObject({ x: from.x, y: from.y });
    // Just outside the dead zone (0.2·R) the player moves.
    const n1 = await samplesCount(page);
    await t.move(1, at(p, 0, R * 0.2));
    await sleep(page, 300);
    const s1 = await samplesSince(page, n1);
    await t.up(1);
    expect(s1.some((x) => x.mx === 1 && x.my === 0)).toBe(true);
  });
});

test.describe('wielodotyk', () => {
  test('3. joystick + ATK jednocześnie (dwa pointery)', async ({ page, browserName }, info) => {
    await openGame(page, 'autoaim=1');
    const t = await touchDriver(page, browserName);
    await placePlayer(page, OPEN.x, OPEN.y);
    const p = await thumbStart(page);
    const atk = centre(await box(page, '.atk-btn'));
    const n0 = await samplesCount(page);
    await t.down(1, p);
    await t.drag(1, p, at(p, 90, R * 0.9), 4); // down (south)
    await t.down(2, atk);
    await sleep(page, 150);
    await expect(page.locator('.atk-btn')).toHaveClass(/held/);
    await expect(page.locator('.stick-base')).toBeVisible();
    await shot(page, info, '03-joystick-plus-atk');
    await t.up(2); // lift ATK finger only
    await sleep(page, 250);
    await expect(page.locator('.atk-btn')).not.toHaveClass(/held/);
    await expect(page.locator('.stick-base')).toBeVisible();
    const n1 = await samplesCount(page);
    await sleep(page, 200);
    const after = await samplesSince(page, n1);
    await t.up(1);
    const s = await samplesSince(page, n0);
    expect(s.some((x) => x.attack && x.mx === 0 && x.my === 1), 'move+attack in the same tick').toBe(true);
    expect(s.some((x) => x.windup > 0 || x.cooldown > 0), 'player swung (attackWindup/Cooldown)').toBe(true);
    expect(after.length).toBeGreaterThan(1);
    expect(after.every((x) => x.my === 1 && !x.attack), 'joystick keeps working after ATK lifted').toBe(true);
  });

  test('4. palec joysticka przeciągnięty na prawą połowę zostaje joystickiem', async ({ page, browserName }, info) => {
    await openGame(page, 'autoaim=1');
    const t = await touchDriver(page, browserName);
    const vw = page.viewportSize()!;
    await placePlayer(page, OPEN.x, OPEN.y);
    const p = await thumbStart(page);
    const atk = centre(await box(page, '.atk-btn'));
    const n0 = await samplesCount(page);
    await t.down(1, p);
    await t.drag(1, p, { x: vw.width * 0.75, y: p.y }, 10);
    await t.drag(1, { x: vw.width * 0.75, y: p.y }, atk, 4); // even over the ATK button
    await sleep(page, 300);
    await expect(page.locator('.stick-base')).toBeVisible();
    await expect(page.locator('.atk-btn')).not.toHaveClass(/held/);
    const base = centre(await box(page, '.stick-base'));
    expect(base.x, 'base follows the thumb').toBeGreaterThan(vw.width / 2);
    await shot(page, info, '04-joystick-na-prawej-polowie');
    await t.up(1);
    const s = await samplesSince(page, n0);
    expect(s.some((x) => x.mx === 1)).toBe(true);
    expect(s.every((x) => !x.attack), 'ATK must not fire').toBe(true);
  });
});

test('5. tap ATK atakuje', async ({ page, browserName }) => {
  await openGame(page, 'autoaim=1');
  const t = await touchDriver(page, browserName);
  await placePlayer(page, OPEN.x, OPEN.y);
  await waitTicks(page, 1);
  const n0 = await samplesCount(page);
  const atk = centre(await box(page, '.atk-btn'));
  await t.down(3, atk);
  await t.up(3); // tap shorter than one tick – latched
  await sleep(page, 400);
  const s = await samplesSince(page, n0);
  expect(s.some((x) => x.attack), 'ActionState.attack after tap').toBe(true);
  expect(s.some((x) => x.windup > 0 || x.cooldown > 0), 'player swung').toBe(true);
  // Real tap (touchscreen API) as well.
  await sleep(page, 900); // past attack cooldown
  const n1 = await samplesCount(page);
  await page.touchscreen.tap(atk.x, atk.y);
  await sleep(page, 400);
  expect((await samplesSince(page, n1)).some((x) => x.windup > 0 || x.cooldown > 0)).toBe(true);
});

test('6. [||] pauzuje, RESUME daje odliczanie 3-2-1', async ({ page, browserName }, info) => {
  await openGame(page);
  const t = await touchDriver(page, browserName);
  await t.tap(centre(await box(page, '.pause-btn')));
  await expect.poll(() => mode(page)).toEqual({ mode: 'paused', reason: 'menu' });
  await expect(page.locator('.overlay')).toBeVisible();
  const t0 = await tick(page);
  await sleep(page, 300);
  expect(await tick(page), 'simulation stopped').toBe(t0);
  await shot(page, info, '06-pauza-menu');
  // A joystick touch on the dimmed map must not move anything while paused.
  await t.tap(centre(await box(page, '.panel .resume')));
  await expect(page.locator('.countdown')).toBeVisible();
  await shot(page, info, '06-odliczanie');
  await expect.poll(() => mode(page), { timeout: 3000 }).toEqual({ mode: 'running', reason: null });
  const ev = await events(page);
  const digits = ev.filter((e) => e.ev === 'countdown').map((e) => e.p.digit);
  expect(digits).toEqual([3, 2, 1]);
  const cd = ev.find((e) => e.ev === 'countdown')!;
  const res = ev.find((e) => e.ev === 'resumed')!;
  const ms = res.t - cd.t;
  expect(ms).toBeGreaterThan(850);
  expect(ms).toBeLessThan(1400);
  await expect(page.locator('.countdown')).toBeHidden();
  info.annotations.push({ type: 'odliczanie', description: `${Math.round(ms)} ms` });
});

test('6b. palec trzymany na joysticku w chwili pauzy jest zerowany', async ({ page, browserName }) => {
  await openGame(page);
  const t = await touchDriver(page, browserName);
  await placePlayer(page, OPEN.x, OPEN.y);
  const p = await thumbStart(page);
  await t.down(1, p);
  await t.drag(1, p, at(p, 90, R * 0.9), 3);
  await sleep(page, 120);
  await fakeVisibility(page, 'hidden'); // pause while the thumb is held
  await fakeVisibility(page, 'visible');
  await expect.poll(() => mode(page)).toMatchObject({ mode: 'paused' });
  await page.evaluate(() => (window as unknown as { __gra: { loop: { resume(): void } } }).__gra.loop.resume());
  await expect.poll(() => mode(page), { timeout: 3000 }).toEqual({ mode: 'running', reason: null });
  const n0 = await samplesCount(page);
  await t.move(1, at(p, 90, R)); // still the same, stale finger
  await sleep(page, 300);
  const s = await samplesSince(page, n0);
  await t.up(1);
  expect(s.every((x) => x.mx === 0 && x.my === 0), 'stale finger ignored after pause').toBe(true);
  await expect(page.locator('.stick-base')).toBeHidden();
});

test('7. auto-pauza przy visibilitychange (bez auto-wznowienia)', async ({ page }, info) => {
  await openGame(page);
  await fakeVisibility(page, 'hidden');
  await expect.poll(() => mode(page)).toEqual({ mode: 'paused', reason: 'auto' });
  await fakeVisibility(page, 'visible');
  await sleep(page, 400);
  expect(await mode(page), 'never resumes by itself').toEqual({ mode: 'paused', reason: 'auto' });
  await expect(page.locator('.overlay')).toBeVisible();
  await expect(page.locator('.overlay .sub').first()).toContainText(/automatically/i);
  await shot(page, info, '07-auto-pauza');
});

test('7b. auto-pauza przy prawdziwym przełączeniu karty (Chromium)', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'WebKit: no real tab switching in headless mode');
  await openGame(page);
  const other = await page.context().newPage();
  await other.bringToFront();
  await sleep(other, 300);
  const vis = await page.evaluate(() => document.visibilityState);
  test.skip(vis !== 'hidden', `headless Chromium keeps the background tab "${vis}"`);
  await expect.poll(() => mode(page)).toEqual({ mode: 'paused', reason: 'auto' });
  await page.bringToFront();
  await sleep(page, 300);
  expect((await mode(page)).mode).toBe('paused');
});

test('8. ?lefty=1 – lustrzane odbicie kontrolek', async ({ page, browserName }, info) => {
  await openGame(page, 'lefty=1&autoaim=1');
  const t = await touchDriver(page, browserName);
  const vw = page.viewportSize()!;
  await expect(page.locator('.touch-controls')).toHaveClass(/left-handed/);
  const atk = await box(page, '.atk-btn');
  const zone = await box(page, '.stick-zone');
  expect(atk.x + atk.width, 'ATK on the left').toBeLessThan(vw.width / 2);
  expect(zone.x, 'joystick zone = right half').toBeGreaterThanOrEqual(vw.width / 2 - 1);
  expect(zone.x + zone.width).toBeGreaterThan(vw.width - 2);
  // HUD stays: HP top-left, [||] top-right (only the lower part is mirrored).
  const hp = await box(page, '.hud-row.hp');
  const pause = await box(page, '.pause-btn');
  expect(hp.x).toBeLessThan(vw.width / 2);
  expect(pause.x).toBeGreaterThan(vw.width / 2);
  // Touch in the left half (not on ATK) → no joystick; right half → joystick.
  const leftP = { x: vw.width * 0.3, y: zone.y + zone.height * 0.4 };
  await t.down(1, leftP);
  await sleep(page, 100);
  await expect(page.locator('.stick-base')).toBeHidden();
  await t.up(1);
  await placePlayer(page, OPEN.x, OPEN.y);
  const p = await thumbStart(page, true);
  const n0 = await samplesCount(page);
  await t.down(1, p);
  await t.drag(1, p, at(p, 180, R * 0.9), 4);
  await sleep(page, 300);
  await expect(page.locator('.stick-base')).toBeVisible();
  await shot(page, info, '08-lefty');
  await t.up(1);
  expect((await samplesSince(page, n0)).some((x) => x.mx === -1 && x.my === 0)).toBe(true);
  // ATK on the left works.
  const n1 = await samplesCount(page);
  await t.tap(centre(atk));
  await sleep(page, 300);
  expect((await samplesSince(page, n1)).some((x) => x.attack)).toBe(true);
});

test('9. ?touch=1 wymusza sterowanie dotykowe (kontekst bez dotyku)', async ({ browser }, info) => {
  const vw = info.project.use.viewport!;
  const ctx = await browser.newContext({ viewport: vw, hasTouch: false, isMobile: false });
  const page = await ctx.newPage();
  try {
    await openGame(page);
    await expect(page.locator('.touch-controls'), 'desktop: hidden by default').toBeHidden();
    await openGame(page, 'touch=1');
    await expect(page.locator('.touch-controls')).toBeVisible();
    await expect(page.locator('.aim-zone')).toBeVisible();
    await expect(page.locator('.atk-btn'), 'ATK hidden until Auto-aim').toBeHidden();
    await page.keyboard.press('KeyD');
    await sleep(page, 100);
    await expect(page.locator('.touch-controls'), '?touch=1: keyboard does not hide').toBeVisible();
    await shot(page, info, '09-touch1-desktop');
    // Without ?touch=1 the keyboard hides controls that a touch showed (coarse → visible).
  } finally {
    await ctx.close();
  }
});

test('9b. telefon: kontrolki widoczne bez ?touch=1 (pointer: coarse)', async ({ page }) => {
  await openGame(page);
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(true);
  await expect(page.locator('.touch-controls')).toBeVisible();
});

test.describe('10. brak przewijania / zoomu strony', () => {
  test('meta viewport i touch-action', async ({ page }) => {
    await openGame(page);
    const meta = await page.getAttribute('meta[name=viewport]', 'content');
    expect(meta).toMatch(/user-scalable=no/);
    expect(meta).toMatch(/viewport-fit=cover/);
    const ta = await page.evaluate(() =>
      ['#game', '.stick-zone', '.atk-btn', '.text-backdrop'].map(
        (s) => [s, getComputedStyle(document.querySelector(s)!).touchAction] as const,
      ),
    );
    for (const [s, v] of ta) expect(v, s).toBe('none');
    const ov = await page.evaluate(() => getComputedStyle(document.body).overflow);
    expect(ov).toBe('hidden');
  });

  test('gesty: przesunięcie, pinch, podwójny tap (Chromium, CDP)', async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium', 'WebKit: no CDP – real gestures cannot be generated');
    await openGame(page);
    const t = await touchDriver(page, browserName);
    const vw = page.viewportSize()!;
    const read = () =>
      page.evaluate(() => ({
        sx: window.scrollX,
        sy: window.scrollY,
        top: document.scrollingElement?.scrollTop ?? 0,
        scale: window.visualViewport?.scale ?? 1,
        vx: window.visualViewport?.offsetLeft ?? 0,
        vy: window.visualViewport?.offsetTop ?? 0,
      }));
    const ok = { sx: 0, sy: 0, top: 0, scale: 1, vx: 0, vy: 0 };
    // swipes: map centre (canvas), HUD band (canvas under HUD), joystick zone, right half
    const swipes: [Pt, Pt][] = [
      [{ x: vw.width / 2, y: vw.height / 2 }, { x: vw.width / 2, y: 10 }],
      [{ x: vw.width * 0.4, y: 30 }, { x: vw.width * 0.4, y: vw.height - 10 }],
      [{ x: vw.width * 0.2, y: vw.height * 0.7 }, { x: vw.width * 0.2, y: 5 }],
      [{ x: vw.width * 0.7, y: vw.height * 0.4 }, { x: 5, y: vw.height * 0.4 }],
    ];
    for (const [a, b] of swipes) {
      await t.down(5, a);
      await t.drag(5, a, b, 8);
      await t.up(5);
    }
    expect(await read(), 'after swipes').toEqual(ok);
    // pinch on the map (two fingers apart)
    const c = { x: vw.width * 0.6, y: vw.height * 0.45 };
    await t.down(6, { x: c.x - 20, y: c.y });
    await t.down(7, { x: c.x + 20, y: c.y });
    for (let i = 1; i <= 8; i++) {
      await t.move(6, { x: c.x - 20 - i * 12, y: c.y - i * 4 });
      await t.move(7, { x: c.x + 20 + i * 12, y: c.y + i * 4 });
    }
    await t.up(7);
    await t.up(6);
    expect(await read(), 'after pinch').toEqual(ok);
    // browser-level pinch gesture (synthesised by Chromium's gesture pipeline)
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.synthesizePinchGesture', { x: c.x, y: c.y, scaleFactor: 2, relativeSpeed: 800, gestureSourceType: 'touch' });
    expect(await read(), 'after synthesizePinchGesture').toEqual(ok);
    // double tap on the map
    await t.tap(c);
    await sleep(page, 60);
    await t.tap(c);
    await sleep(page, 400);
    expect(await read(), 'after double tap').toEqual(ok);
    await shot(page, info, '10-po-gestach');
  });
});

test.describe('11. okno tekstu', () => {
  test('NEXT / CLOSE działają, tap poza oknem nic nie robi, wznowienie bez odliczania', async ({ page, browserName }, info) => {
    await openGame(page);
    const t = await touchDriver(page, browserName);
    const vw = page.viewportSize()!;
    await page.evaluate(() =>
      (window as unknown as { __gra: { openText(f: string[]): void } }).__gra.openText([
        'Page one. Two sentences here.',
        'Page two.',
        'Page three, the last one.',
      ]),
    );
    await expect(page.locator('.text-window')).toBeVisible();
    expect(await mode(page)).toEqual({ mode: 'paused', reason: 'text' });
    await expect(page.locator('.overlay')).toBeHidden();
    await expect(page.locator('.text-page')).toHaveText(/1\/3/);
    await shot(page, info, '11-okno-tekstu-1z3');
    // taps outside the window: joystick zone, ATK spot, top corner
    const win = await box(page, '.text-window');
    const atk = centre(await box(page, '.atk-btn').catch(() => ({ x: vw.width - 60, y: vw.height - 60, width: 0, height: 0 })));
    const outside: Pt[] = [
      { x: 8, y: vw.height - 8 },
      { x: vw.width - 8, y: 8 },
      atk,
      { x: win.x + win.width / 2, y: Math.min(vw.height - 3, win.y + win.height + 6) },
    ].filter((p) => !(p.x >= win.x && p.x <= win.x + win.width && p.y >= win.y && p.y <= win.y + win.height));
    const n0 = await samplesCount(page);
    for (const p of outside) {
      await t.tap(p);
      await t.down(8, p);
      await t.drag(8, p, { x: p.x + 40, y: p.y - 30 }, 3);
      await t.up(8);
    }
    await sleep(page, 200);
    await expect(page.locator('.text-window')).toBeVisible();
    await expect(page.locator('.text-page')).toHaveText(/1\/3/);
    await expect(page.locator('.stick-base')).toBeHidden();
    expect(await mode(page)).toEqual({ mode: 'paused', reason: 'text' });
    const sOut = await samplesSince(page, n0);
    expect(sOut.every((x) => !x.attack && x.mx === 0 && x.my === 0), 'no input leaks under the window').toBe(true);
    // NEXT → page 2 → page 3 (NEXT hidden on the last page)
    await t.tap(centre(await box(page, '.text-next')));
    await expect(page.locator('.text-body')).toHaveText('Page two.');
    await t.tap(centre(await box(page, '.text-next')));
    await expect(page.locator('.text-body')).toHaveText(/Page three/);
    await expect(page.locator('.text-next')).toBeHidden();
    await shot(page, info, '11-okno-tekstu-3z3');
    await t.tap(centre(await box(page, '.text-close')));
    await expect(page.locator('.text-backdrop')).toBeHidden();
    await expect.poll(() => mode(page), { timeout: 500 }).toEqual({ mode: 'running', reason: null });
    expect((await events(page)).filter((e) => e.ev === 'countdown')).toEqual([]);
    // CLOSE in the middle of a multi-page text
    await page.evaluate(() =>
      (window as unknown as { __gra: { openText(f: string[]): void } }).__gra.openText(['A.', 'B.']),
    );
    await t.tap(centre(await box(page, '.text-close')));
    await expect(page.locator('.text-backdrop')).toBeHidden();
    expect((await mode(page)).mode).toBe('running');
  });

  test('auto-pauza w trakcie czytania → po CLOSE odliczanie', async ({ page, browserName }) => {
    await openGame(page);
    const t = await touchDriver(page, browserName);
    await page.evaluate(() => (window as unknown as { __gra: { openText(): void } }).__gra.openText());
    await fakeVisibility(page, 'hidden');
    await fakeVisibility(page, 'visible');
    await expect(page.locator('.text-window')).toBeVisible();
    expect(await mode(page)).toEqual({ mode: 'paused', reason: 'text' });
    await t.tap(centre(await box(page, '.text-close')));
    await expect.poll(async () => (await mode(page)).mode).toBe('countdown');
    await expect.poll(() => mode(page), { timeout: 3000 }).toEqual({ mode: 'running', reason: null });
  });
});

test.describe('12. gracz i HUD nie nachodzą na siebie', () => {
  test('pozycje gracza przy krawędziach mapy vs HP i [||]', async ({ page }, info) => {
    await openGame(page, 'autoaim=1');
    const hp = await box(page, '.hud-row.hp');
    const pause = await box(page, '.pause-btn');
    const atk = await box(page, '.atk-btn');
    expect(overlaps(hp, pause), 'HP vs [||]').toBe(false);
    expect(overlaps(hp, atk), 'HP vs ATK').toBe(false);
    expect(overlaps(pause, atk), '[||] vs ATK').toBe(false);
    const W = await page.evaluate(() => (window as unknown as { __gra: { state: { map: { width: number; height: number } } } }).__gra.state.map);
    const cells: [number, number][] = [
      [3, 3], // spawn
      [1, 1],
      [12, 1],
      [17, 1],
      [W.width - 2, 1],
      [W.width - 2, W.height - 2],
      [1, W.height - 2],
      [20, 10],
    ];
    const hudHits: string[] = [];
    const ctlHits: string[] = [];
    for (const [x, y] of cells) {
      await placePlayer(page, x, y);
      await waitTicks(page, 2);
      await sleep(page, 50);
      const pb = await playerScreenBox(page);
      expect(pb, `player @ ${x},${y} visible on canvas`).not.toBeNull();
      const vw = page.viewportSize()!;
      expect(pb!.x >= -0.5 && pb!.y >= -0.5 && pb!.x + pb!.width <= vw.width + 0.5 && pb!.y + pb!.height <= vw.height + 0.5, `player ${x},${y} on screen`).toBe(true);
      const r = (b: { x: number; y: number; width: number; height: number }) =>
        `[${Math.round(b.x)},${Math.round(b.y)} ${Math.round(b.width)}×${Math.round(b.height)}]`;
      if (overlaps(pb!, hp)) hudHits.push(`@${x},${y} ${r(pb!)} vs HP ${r(hp)}`);
      if (overlaps(pb!, pause)) hudHits.push(`@${x},${y} ${r(pb!)} vs [||] ${r(pause)}`);
      if (overlaps(pb!, atk)) ctlHits.push(`@${x},${y} ${r(pb!)} vs ATK ${r(atk)}`);
      if (x === 1 && y === 1) await shot(page, info, '12-gracz-lewy-gorny-rog');
      if (x === W.width - 2 && y === 1) await shot(page, info, '12-gracz-prawy-gorny-rog');
      if (x === W.width - 2 && y === W.height - 2) await shot(page, info, '12-gracz-prawy-dolny-rog');
    }
    if (ctlHits.length)
      info.annotations.push({ type: 'info: gracz pod ATK', description: ctlHits.join('; ') });
    expect(hudHits, hudHits.join('\n')).toEqual([]);
  });

  test('zrzut stanu startowego', async ({ page }, info) => {
    await openGame(page);
    await shot(page, info, '00-start');
  });
});
