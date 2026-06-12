import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Deno's node_modules layout (node_modules/.deno/...) sits at the monorepo root,
// not inside the per-app dir. Vite's default fs.allow only includes the project
// dir, so module loads from there hit the `/@fs/` 403. Allowing the workspace
// root fixes it for every dependency the app pulls in.
const WORKSPACE_ROOT = resolve(__dirname, '../..');

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5177,
    fs: { allow: [WORKSPACE_ROOT] },
    // Dev-only: when both servers are running, requests to /docs/ on the
    // landing port get forwarded to the docs dev server. In production, the
    // reverse proxy (or static-file host) does the same mapping.
    proxy: {
      '/api/': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/docs': {
        target: 'http://localhost:5178',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false,
  },
});
