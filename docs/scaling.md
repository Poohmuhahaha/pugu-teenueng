# QuestPage — Scaling beyond one node

Default QuestPage is happy on a single Node process with shared Postgres. Once you grow past one instance (multiple replicas, blue-green deploys, k8s pods), two pieces need a shared backbone: **rate limiting** and the **SSE sync bus**. QuestPage ships a Redis adapter that lights up both with a single env var.

## Set REDIS_URL

```env
REDIS_URL=redis://redis.questpage.svc.cluster.local:6379
```

Now:
- `publish()` (called on every entry mutation) forwards each event through Redis Pub/Sub channel `questpage:sync:<workspaceId>`. Subscribers on any node receive the event and re-fan-out locally to their SSE clients.
- `redisRateLimit(key, windowSec)` is available for endpoints that opt-in. Anonymous endpoints (e.g. `/api/v1/waitlist/join`) are good candidates.

## Verifying multi-instance live sync

1. Run two `apps/api` instances on different ports (`PORT=3000` and `PORT=3001`) pointing at the same Postgres + Redis.
2. Open `apps/web` and connect through instance A (`PUBLIC_API_URL=http://localhost:3000`).
3. Edit an entry via the REST API on instance B (`curl -X PATCH http://localhost:3001/api/v1/personal-crm/1 …`).
4. The quest board page on the instance-A client should debounce-reload within 300ms — proves the event crossed processes.

## Postgres at scale

Stateless API + JWT means horizontal scaling on the app tier is trivial. The next bottleneck is usually Postgres connections:

- Set `prisma:client.connectionLimit` (or use **PgBouncer** in transaction mode) when you exceed ~50 concurrent backend processes.
- The query that benefits most from a read-replica is the `/api/v1/:quest board` list endpoint — wire Prisma's read replicas extension if listed-quest board latency matters more than entry create latency.

## Messenger Bird delivery at scale

The default in-process messenger bird fire is fine up to ~10 events/sec/node. Past that:
1. Run a dedicated worker process that polls `WebhookFailure` (cron already handles retries, but you can also flag fresh events for delivery from there).
2. Or swap `fireWebhooks()` for a `BullMQ` enqueue + worker; the existing `messenger bird-retry` endpoint can be reused as the worker loop.

## Files relevant to scaling

- `apps/api/src/lib/server/redis.ts` — lazy adapter, opt-in by env
- `apps/api/src/lib/server/sync.ts` — picks up Redis automatically when present
- `apps/api/src/lib/server/ratelimit.ts` — extend to call `redisRateLimit()` when env set (today still LRU-only)
- `docs/messenger birds.md` — retry behaviour + scheduled worker
