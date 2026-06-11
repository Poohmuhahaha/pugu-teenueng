/**
 * Optional Redis adapter — lazy-loaded.
 *
 * Wires:
 *  1. Cross-process pub-sub for SSE sync (so `publish()` reaches subscribers on other Node instances)
 *  2. Cross-process rate-limit fallback (so single-instance LRU doesn't undercount across pods)
 *
 * Activate by setting REDIS_URL. Without it, sync.ts and ratelimit.ts use the
 * default in-process maps — fine for single-node deployments.
 */

let cached: typeof import('ioredis') | null | undefined;
let pubClient: import('ioredis').Redis | null = null;
let subClient: import('ioredis').Redis | null = null;

const CHANNEL_PREFIX = 'questpage:sync:';

async function loadIoredis(): Promise<typeof import('ioredis') | null> {
  if (cached !== undefined) return cached;
  if (!process.env.REDIS_URL) {
    cached = null;
    return null;
  }
  try {
    const mod = await import(/* @vite-ignore */ 'ioredis');
    cached = mod;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export async function getRedis(): Promise<{ pub: import('ioredis').Redis; sub: import('ioredis').Redis } | null> {
  const mod = await loadIoredis();
  if (!mod) return null;
  if (!pubClient || !subClient) {
    const Ctor = mod.default ?? mod.Redis;
    pubClient = new Ctor(process.env.REDIS_URL!);
    subClient = new Ctor(process.env.REDIS_URL!);
  }
  return { pub: pubClient, sub: subClient };
}

export async function publishToRedis(workspaceId: number, payload: unknown): Promise<void> {
  const r = await getRedis();
  if (!r) return;
  await r.pub.publish(`${CHANNEL_PREFIX}${workspaceId}`, JSON.stringify(payload));
}

const localSubscribers = new Map<number, Set<(p: unknown) => void>>();
let bootstrapped = false;

export async function subscribeFromRedis(workspaceId: number, listener: (p: unknown) => void): Promise<() => void> {
  const r = await getRedis();
  if (!r) {
    // No-op — caller's in-process subscribe path still works
    return () => {};
  }
  await bootstrap(r.sub);

  let set = localSubscribers.get(workspaceId);
  if (!set) {
    set = new Set();
    localSubscribers.set(workspaceId, set);
    await r.sub.subscribe(`${CHANNEL_PREFIX}${workspaceId}`);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) {
      localSubscribers.delete(workspaceId);
      r.sub.unsubscribe(`${CHANNEL_PREFIX}${workspaceId}`).catch(() => {});
    }
  };
}

async function bootstrap(sub: import('ioredis').Redis): Promise<void> {
  if (bootstrapped) return;
  bootstrapped = true;
  sub.on('message', (channel, message) => {
    if (!channel.startsWith(CHANNEL_PREFIX)) return;
    const workspaceId = parseInt(channel.slice(CHANNEL_PREFIX.length));
    const set = localSubscribers.get(workspaceId);
    if (!set) return;
    let payload: unknown;
    try { payload = JSON.parse(message); } catch { return; }
    for (const fn of set) {
      try { fn(payload); } catch { /* swallow */ }
    }
  });
}

/**
 * Atomic INCR-with-TTL rate-limit. Returns count for the window.
 * Caller decides whether count exceeds its limit.
 */
export async function redisRateLimit(key: string, windowSec: number): Promise<number | null> {
  const r = await getRedis();
  if (!r) return null;
  const tx = r.pub.multi();
  tx.incr(key);
  tx.expire(key, windowSec);
  const res = await tx.exec();
  if (!res) return null;
  return Number(res[0]?.[1] ?? 0);
}
