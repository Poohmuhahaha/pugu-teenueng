import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, url }) => {
  const isAuthPage = ['/login', '/signup', '/forgot', '/reset-password'].includes(url.pathname);
  if (isAuthPage) return { me: null };

  const res = await fetch('/api/v1/me');
  if (!res.ok) {
    throw redirect(307, '/login');
  }

  const me = await res.json();
  return { me };
};
