// vite.config.ts
import { sveltekit } from "file:///D:/PROJECTS/website/lifeos/node_modules/.deno/@sveltejs+kit@2.61.1/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///D:/PROJECTS/website/lifeos/node_modules/.deno/vite@5.4.21/node_modules/vite/dist/node/index.js";
import { resolve } from "node:path";
var __vite_injected_original_dirname = "D:\\PROJECTS\\website\\lifeos\\apps\\landing";
var WORKSPACE_ROOT = resolve(__vite_injected_original_dirname, "../..");
var vite_config_default = defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5177,
    fs: { allow: [WORKSPACE_ROOT] },
    // Dev-only: when both servers are running, requests to /docs/ on the
    // landing port get forwarded to the docs dev server. In production, the
    // reverse proxy (or static-file host) does the same mapping.
    proxy: {
      "/api/": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/docs": {
        target: "http://localhost:5178",
        changeOrigin: true
      }
    }
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQUk9KRUNUU1xcXFx3ZWJzaXRlXFxcXGxpZmVvc1xcXFxhcHBzXFxcXGxhbmRpbmdcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXFBST0pFQ1RTXFxcXHdlYnNpdGVcXFxcbGlmZW9zXFxcXGFwcHNcXFxcbGFuZGluZ1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovUFJPSkVDVFMvd2Vic2l0ZS9saWZlb3MvYXBwcy9sYW5kaW5nL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgc3ZlbHRla2l0IH0gZnJvbSAnQHN2ZWx0ZWpzL2tpdC92aXRlJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5cbi8vIERlbm8ncyBub2RlX21vZHVsZXMgbGF5b3V0IChub2RlX21vZHVsZXMvLmRlbm8vLi4uKSBzaXRzIGF0IHRoZSBtb25vcmVwbyByb290LFxuLy8gbm90IGluc2lkZSB0aGUgcGVyLWFwcCBkaXIuIFZpdGUncyBkZWZhdWx0IGZzLmFsbG93IG9ubHkgaW5jbHVkZXMgdGhlIHByb2plY3Rcbi8vIGRpciwgc28gbW9kdWxlIGxvYWRzIGZyb20gdGhlcmUgaGl0IHRoZSBgL0Bmcy9gIDQwMy4gQWxsb3dpbmcgdGhlIHdvcmtzcGFjZVxuLy8gcm9vdCBmaXhlcyBpdCBmb3IgZXZlcnkgZGVwZW5kZW5jeSB0aGUgYXBwIHB1bGxzIGluLlxuY29uc3QgV09SS1NQQUNFX1JPT1QgPSByZXNvbHZlKF9fZGlybmFtZSwgJy4uLy4uJyk7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtzdmVsdGVraXQoKV0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDUxNzcsXG4gICAgZnM6IHsgYWxsb3c6IFtXT1JLU1BBQ0VfUk9PVF0gfSxcbiAgICAvLyBEZXYtb25seTogd2hlbiBib3RoIHNlcnZlcnMgYXJlIHJ1bm5pbmcsIHJlcXVlc3RzIHRvIC9kb2NzLyBvbiB0aGVcbiAgICAvLyBsYW5kaW5nIHBvcnQgZ2V0IGZvcndhcmRlZCB0byB0aGUgZG9jcyBkZXYgc2VydmVyLiBJbiBwcm9kdWN0aW9uLCB0aGVcbiAgICAvLyByZXZlcnNlIHByb3h5IChvciBzdGF0aWMtZmlsZSBob3N0KSBkb2VzIHRoZSBzYW1lIG1hcHBpbmcuXG4gICAgcHJveHk6IHtcbiAgICAgICcvYXBpLyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICAgICcvZG9jcyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo1MTc4JyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHRhcmdldDogJ2VzMjAyMCcsXG4gICAgbWluaWZ5OiAnZXNidWlsZCcsXG4gICAgY3NzTWluaWZ5OiB0cnVlLFxuICAgIHNvdXJjZW1hcDogZmFsc2UsXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1ULFNBQVMsaUJBQWlCO0FBQzdVLFNBQVMsb0JBQW9CO0FBQzdCLFNBQVMsZUFBZTtBQUZ4QixJQUFNLG1DQUFtQztBQVF6QyxJQUFNLGlCQUFpQixRQUFRLGtDQUFXLE9BQU87QUFFakQsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLFVBQVUsQ0FBQztBQUFBLEVBQ3JCLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLElBQUksRUFBRSxPQUFPLENBQUMsY0FBYyxFQUFFO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFJOUIsT0FBTztBQUFBLE1BQ0wsU0FBUztBQUFBLFFBQ1AsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxTQUFTO0FBQUEsUUFDUCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsV0FBVztBQUFBLElBQ1gsc0JBQXNCO0FBQUEsRUFDeEI7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
