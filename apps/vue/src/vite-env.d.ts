/// <reference types="vite/client" />

// Vite 8's client types no longer declare `*.vue`; provide the classic SFC shim
// so `vue-tsc` resolves .vue imports in a standalone (non-monorepo) build.
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
