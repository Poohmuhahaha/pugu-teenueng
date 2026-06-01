import { redirect } from '@sveltejs/kit';
// deno-lint-ignore no-sloppy-imports
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, url }) => {
  const isAuthPage = ['/login', '/signup', '/forgot', '/reset-password'].includes(url.pathname);
  // /auth/device manages its own signed-in state — it renders a "Sign in to continue"
  // CTA when the visitor isn't authenticated.
  const isSelfAuthPage = url.pathname.startsWith('/auth/');
  if (isAuthPage || isSelfAuthPage) return;

  const res = await fetch('/api/v1/me');
  if (!res.ok) {
    const target = url.pathname + url.search;
    throw redirect(307, `/login?return=${encodeURIComponent(target)}`);
  }
};
