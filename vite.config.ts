/// <reference types="vitest/config" />
import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base: the build works from any GitHub Pages path (/<repo>/) or locally.
  base: './',
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
