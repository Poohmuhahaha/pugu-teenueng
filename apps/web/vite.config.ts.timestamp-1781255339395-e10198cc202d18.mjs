// vite.config.ts
import { sveltekit } from "file:///D:/PROJECTS/website/lifeos/node_modules/.deno/@sveltejs+kit@2.61.1/node_modules/@sveltejs/kit/src/exports/vite/index.js";
import { defineConfig } from "file:///D:/PROJECTS/website/lifeos/node_modules/.deno/vite@5.4.21/node_modules/vite/dist/node/index.js";
import { resolve } from "node:path";
var __vite_injected_original_dirname = "D:\\PROJECTS\\website\\lifeos\\apps\\web";
var WORKSPACE_ROOT = resolve(__vite_injected_original_dirname, "../..");
var vite_config_default = defineConfig({
  plugins: [sveltekit()],
  server: {
    port: 5176,
    fs: { allow: [WORKSPACE_ROOT] },
    proxy: {
      "/api/": {
        target: "http://localhost:3000",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxQUk9KRUNUU1xcXFx3ZWJzaXRlXFxcXGxpZmVvc1xcXFxhcHBzXFxcXHdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcUFJPSkVDVFNcXFxcd2Vic2l0ZVxcXFxsaWZlb3NcXFxcYXBwc1xcXFx3ZWJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L1BST0pFQ1RTL3dlYnNpdGUvbGlmZW9zL2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgc3ZlbHRla2l0IH0gZnJvbSAnQHN2ZWx0ZWpzL2tpdC92aXRlJztcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnO1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XG5cbi8vIERlbm8ncyBob2lzdGVkIG5vZGVfbW9kdWxlcyBzaXRzIGF0IHRoZSBtb25vcmVwbyByb290OyBhbGxvdyBWaXRlIHRvIHJlYWQgaXQuXG5jb25zdCBXT1JLU1BBQ0VfUk9PVCA9IHJlc29sdmUoX19kaXJuYW1lLCAnLi4vLi4nKTtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3N2ZWx0ZWtpdCgpXSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3NixcbiAgICBmczogeyBhbGxvdzogW1dPUktTUEFDRV9ST09UXSB9LFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaS8nOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCcsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICB0YXJnZXQ6ICdlczIwMjAnLFxuICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgIGNzc01pbmlmeTogdHJ1ZSxcbiAgICBzb3VyY2VtYXA6IGZhbHNlLFxuICAgIHJlcG9ydENvbXByZXNzZWRTaXplOiBmYWxzZSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1UyxTQUFTLGlCQUFpQjtBQUNqVSxTQUFTLG9CQUFvQjtBQUM3QixTQUFTLGVBQWU7QUFGeEIsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTSxpQkFBaUIsUUFBUSxrQ0FBVyxPQUFPO0FBRWpELElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxVQUFVLENBQUM7QUFBQSxFQUNyQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixJQUFJLEVBQUUsT0FBTyxDQUFDLGNBQWMsRUFBRTtBQUFBLElBQzlCLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUEsSUFDWCxzQkFBc0I7QUFBQSxFQUN4QjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
