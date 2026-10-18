import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

const src = fileURLToPath(new URL('./src', import.meta.url))
const huuk = fileURLToPath(new URL('../../../components/huuk', import.meta.url))
const hfEntry = fileURLToPath(new URL('./node_modules/hyperformula/es/index.mjs', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: [
      { find: /^hyperformula$/, replacement: hfEntry },
      { find: /^@huuk\//, replacement: `${huuk}/` },
      { find: /^@\/components\//, replacement: `${huuk}/` },
      { find: /^@\/composables\//, replacement: `${huuk}/composables/` },
      { find: /^@\/core\//, replacement: `${huuk}/core/` },
      { find: /^@\/mock\//, replacement: `${huuk}/mock/` },
      { find: /^@\//, replacement: `${src}/` },
    ],
  },
  server: {
    port: 5173,
    fs: { allow: [src, huuk] },
    proxy: {
      '/api/': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('hyperformula')) return 'vendor-hyperformula'
          if (id.includes('@tanstack/vue-query') || id.includes('@tanstack/query-core')) {
            return 'vendor-query'
          }
          if (id.includes('node_modules/zod')) return 'vendor-zod'
          if (id.includes('node_modules/vue') || id.includes('node_modules/@vue') || id.includes('vue-router')) {
            return 'vendor-vue'
          }
        },
      },
    },
  },
})
