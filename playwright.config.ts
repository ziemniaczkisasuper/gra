import { defineConfig, devices } from '@playwright/test';

/**
 * E2E – touch controls in phone emulation (PROG / UI i Menu, sterowanie.md).
 * Run: `npm run test:e2e` (starts its own Vite dev server on port 5199; window.__gra exists only in dev).
 * Chromium (Pixel 5) gets real multi-touch through CDP Input.dispatchTouchEvent; WebKit (iPhone SE)
 * gets real taps (page.touchscreen) and synthetic Pointer Events for drags / multi-touch.
 */
const PORT = 5199;
const sizes = {
  landscape: { width: 667, height: 375 },
  portrait: { width: 375, height: 667 },
  low: { width: 568, height: 320 },
} as const;

const pixel = devices['Pixel 5'];
const iphone = devices['iPhone SE'];

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  outputDir: './tests/e2e/.results',
  timeout: 45_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  workers: 3,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: './tests/e2e/.results/results.json' }]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    hasTouch: true,
    isMobile: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    ...Object.entries(sizes).map(([name, viewport]) => ({
      name: `pixel-${name}`,
      use: { ...pixel, viewport, screen: viewport, hasTouch: true, isMobile: true },
    })),
    ...Object.entries(sizes).map(([name, viewport]) => ({
      name: `iphone-${name}`,
      use: { ...iphone, viewport, screen: viewport, hasTouch: true, isMobile: true },
    })),
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
