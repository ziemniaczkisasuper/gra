/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Cloudflare Pages serves the game from the domain root.
  base: '/',
  build: {
    target: 'es2020',
    outDir: 'dist',
    sourcemap: false,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
