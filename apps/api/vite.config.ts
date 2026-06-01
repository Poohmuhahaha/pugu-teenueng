import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

// Deno's hoisted node_modules sits at the monorepo root; allow Vite to read it.
const WORKSPACE_ROOT = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 3000,
    fs: { allow: [WORKSPACE_ROOT] },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
