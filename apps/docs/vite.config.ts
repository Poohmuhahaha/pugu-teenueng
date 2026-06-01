import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Deno's hoisted node_modules sits at the monorepo root; allow Vite to read it.
const WORKSPACE_ROOT = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5178,
    fs: { allow: [WORKSPACE_ROOT] },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
