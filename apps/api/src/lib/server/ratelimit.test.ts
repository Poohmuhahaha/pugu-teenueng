import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit } from './ratelimit';

/**
 * Synthetic RequestEvent — only includes the methods rateLimit actually touches.
 * Cast is intentional; we don't want to pull a full RequestEvent factory into a unit test.
 */
function fakeEvent(ip: string) {
  return {
    request: { headers: { get: (k: string) => (k === 'x-forwarded-for' ? null : null) } },
    getClientAddress: () => ip,
  } as unknown as Parameters<typeof rateLimit>[0];
}

describe('rateLimit (in-process LRU fallback)', () => {
  beforeEach(() => {
    // Each test uses a unique route key to avoid bucket bleed across tests
  });

  it('allows requests under the limit', async () => {
    const route = `test.under.${Date.now()}`;
    const event = fakeEvent('10.0.0.1');
    for (let i = 0; i < 3; i++) {
      await rateLimit(event, { route, limit: 5, windowSec: 60 });
    }
    // No throw == pass
    expect(true).toBe(true);
  });

  it('blocks the (limit+1)-th request inside the window', async () => {
    const route = `test.over.${Date.now()}`;
    const event = fakeEvent('10.0.0.2');
    for (let i = 0; i < 3; i++) {
      await rateLimit(event, { route, limit: 3, windowSec: 60 });
    }
    await expect(
      rateLimit(event, { route, limit: 3, windowSec: 60 })
    ).rejects.toMatchObject({ status: 429 });
  });

  it('tracks different IPs independently', async () => {
    const route = `test.ips.${Date.now()}`;
    const eventA = fakeEvent('10.0.0.3');
    const eventB = fakeEvent('10.0.0.4');
    for (let i = 0; i < 2; i++) {
      await rateLimit(eventA, { route, limit: 2, windowSec: 60 });
      await rateLimit(eventB, { route, limit: 2, windowSec: 60 });
    }
    // Both are at their limit but neither has crossed it
    await expect(
      rateLimit(eventA, { route, limit: 2, windowSec: 60 })
    ).rejects.toMatchObject({ status: 429 });
    await expect(
      rateLimit(eventB, { route, limit: 2, windowSec: 60 })
    ).rejects.toMatchObject({ status: 429 });
  });

  it('treats different qualifiers as separate buckets', async () => {
    const route = `test.qualifier.${Date.now()}`;
    const event = fakeEvent('10.0.0.5');
    for (let i = 0; i < 2; i++) {
      await rateLimit(event, { route, limit: 2, windowSec: 60, qualifier: 'alice@x' });
      await rateLimit(event, { route, limit: 2, windowSec: 60, qualifier: 'bob@x' });
    }
    await expect(
      rateLimit(event, { route, limit: 2, windowSec: 60, qualifier: 'alice@x' })
    ).rejects.toMatchObject({ status: 429 });
    // bob still in its own bucket but also at the limit
    await expect(
      rateLimit(event, { route, limit: 2, windowSec: 60, qualifier: 'bob@x' })
    ).rejects.toMatchObject({ status: 429 });
  });
});
