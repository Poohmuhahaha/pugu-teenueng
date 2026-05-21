import type { Handle } from '@sveltejs/kit';
import { LRUCache } from 'lru-cache';
import { COOKIE_NAME } from '$lib/server/auth';
import { isSessionRevoked, touchSession } from '$lib/server/sessions';

/**
 * Per-request revocation enforcement.
 *
 * JWT verification alone can't detect a server-side revoke. We check the DB on
 * each request that carries a session cookie, but cache the negative result
 * (60s) so the hot path is essentially free.
 *
 * Revoked → clear cookie + return 401 for API, redirect to /login for pages.
 */
const REVOCATION_TTL_MS = 60_000;
const revocationCache = new LRUCache<string, boolean>({ max: 5_000, ttl: REVOCATION_TTL_MS });

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(COOKIE_NAME);
  if (token) {
    let revoked = revocationCache.get(token);
    if (revoked === undefined) {
      revoked = await isSessionRevoked(token).catch(() => false);
      revocationCache.set(token, revoked);
    }
    if (revoked) {
      event.cookies.delete(COOKIE_NAME, { path: '/' });
      const isApi = event.url.pathname.startsWith('/api/');
      if (isApi) return new Response('Session revoked', { status: 401 });
      return new Response(null, { status: 303, headers: { Location: '/login?reason=revoked' } });
    }
    // Touch lastSeenAt asynchronously; don't block request
    touchSession(token);
  }
  return resolve(event);
};
