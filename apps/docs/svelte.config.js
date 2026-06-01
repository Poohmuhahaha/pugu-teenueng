import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: 'index.html' }),
    prerender: {
      entries: ['*'],
      // Don't fail the whole build for missing static assets — common in dev/preview
      // before icons/og-images are populated. Real broken internal links still fail.
      handleHttpError: ({ status, path, referrer }) => {
        if (status === 404 && /\.(svg|png|jpg|ico|webp)$/.test(path)) return;
        throw new Error(`${status} ${path}${referrer ? ` (from ${referrer})` : ''}`);
      },
    },
  },
};
