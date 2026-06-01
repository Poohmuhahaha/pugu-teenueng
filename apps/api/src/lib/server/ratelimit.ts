import { error, type RequestEvent } from '@sveltejs/kit';
import { LRUCache } from 'lru-cache';
import { redisRateLimit } from './redis';

/**
 * Pluggable rate limiter.
 *
 * Strategy:
 *  - Try Redis first via `redisRateLimit` (returns null if REDIS_URL not set).
 *  - Fall back to per-process LRU counters keyed by route + identifier.
 *
 * Identifier policy:
 *  - Default identifier is the client IP (best-effort: X-Forwarded-For, then getClientAddress()).
 *  - Caller can pass extra qualifiers (e.g. email) to compose `route:ip:email` so the same
 *    bad actor can't burn the global IP budget by trying many addresses.
 *
 * On exceed:
 *  - Throws SvelteKit error(429) with a Retry-After hint in the message body. The actual
 *    Retry-After header would be cleaner via hooks; this is the smallest functional version.
 */

interface Bucket {
  /** Tokens spent in the current window. */
  count: number;
  /** Window expiry (ms since epoch). */
  resetAt: number;
}

const buckets = new LRUCache<string, Bucket>({
  max: 50_000,
  ttl: 60 * 60 * 1000, // 1h safety ceiling regardless of window
});

export interface RateLimitOptions {
  /** Unique key per protected route, e.g. "auth.login" */
  route: string;
  /** Max requests allowed inside the window. */
  limit: number;
  /** Window length in seconds. */
  windowSec: number;
  /** Extra identifier(s) to add into the bucket key (e.g. email). */
  qualifier?: string | null;
}

function clientIp(event: RequestEvent): string {
  // Trust X-Forwarded-For if present (caller is expected to terminate TLS at a reverse proxy in prod)
  const xff = event.request.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  try {
    return event.getClientAddress();
  } catch {
    return 'unknown';
  }
}

export async function rateLimit(event: RequestEvent, opts: RateLimitOptions): Promise<void> {
  const ip = clientIp(event);
  const key = `rl:${opts.route}:${ip}${opts.qualifier ? `:${opts.qualifier}` : ''}`;

  // Try Redis (multi-instance safe). Returns null if Redis isn't configured.
  const redisCount = await redisRateLimit(key, opts.windowSec).catch(() => null);
  if (redisCount !== null) {
    if (redisCount > opts.limit) {
      throw error(429, `Too many requests. Try again in ${opts.windowSec}s.`);
    }
    return;
  }

  // In-process fallback
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + opts.windowSec * 1000 });
    return;
  }
  bucket.count += 1;
  if (bucket.count > opts.limit) {
    const remaining = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw error(429, `Too many requests. Try again in ${remaining}s.`);
  }
}

/** Convenience wrappers for common policies. */
export const RateLimits = {
  /** 10 attempts / 15 min per (ip + email). Strong protection against credential stuffing. */
  authStrict: { limit: 10, windowSec: 15 * 60 },
  /** 30 / hour per ip. For password-reset & magic-link endpoints. */
  authLinkRequest: { limit: 30, windowSec: 60 * 60 },
  /** 60 / minute per ip. For public read-style endpoints (waitlist). */
  publicWrite: { limit: 60, windowSec: 60 },
};
