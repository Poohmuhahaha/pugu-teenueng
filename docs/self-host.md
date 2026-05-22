# LifeOS — Self-host guide

LifeOS is AGPL-3.0. You can run it on your own infrastructure — for yourself or to host for clients. This guide assumes you've completed `docs/quickstart.md`.

## Production checklist

### 1. Secrets

Generate strong values for every secret. Never commit `.env` to git.

```bash
openssl rand -hex 32   # JWT_SECRET
openssl rand -hex 32   # CSRF_SECRET
openssl rand -hex 16   # POSTGRES_PASSWORD
```

### 2. TLS

Put a reverse proxy (Caddy / Traefik / nginx) in front of `web` (port 3001) and `api` (port 3000). Examples in `helm/lifeos/values.yaml`.

If running bare Docker on a VPS, the easiest TLS terminator is Caddy:

```caddyfile
lifeos.example.com {
  reverse_proxy /api/* localhost:3000
  reverse_proxy /* localhost:3001
}
```

### 3. Backups

The single Postgres database holds everything. Schedule daily logical backups:

```bash
docker compose exec db pg_dump -U lifeos lifeos > backup-$(date +%F).sql
```

Restore:

```bash
cat backup-2026-05-21.sql | docker compose exec -T db psql -U lifeos lifeos
```

### 4. Webhook retry worker (cron)

Webhooks run inline on the request thread; failures land in `WebhookFailure` for retry. Wire a cron to fire the retry endpoint every ~30 seconds:

```cron
* * * * * curl -sX POST -H "X-Internal-Token: $INTERNAL_WORKER_TOKEN" http://api:3000/api/internal/webhook-retry > /dev/null
```

(Kubernetes: use a `CronJob` with `schedule: "* * * * *"`.)

### 5. Observability

LifeOS picks up the following env vars when present:

| Env | Purpose |
|---|---|
| `SENTRY_DSN` | Forward unhandled errors to Sentry (lazy load — zero cost when unset) |
| `FEATURES` | JSON object of feature flags read by `isEnabled(flag)` |

### 6. Stripe billing (optional)

If you want to charge users:

```env
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
STRIPE_PRICE_PERSONAL=price_…
STRIPE_PRICE_STUDIO=price_…
PUBLIC_BASE_URL=https://lifeos.example.com
```

Then point the Stripe Dashboard webhook to `https://lifeos.example.com/api/webhooks/stripe`. Without these envs the API still works but `/billing/checkout` returns 503.

### 7. Hardening

- **CSRF**: client wrappers automatically attach `X-CSRF-Token` on mutating calls — enabled by default.
- **Rate limit**: 60/min on `/api/auth/*`, 300/min on `/api/*` (in-process LRU; swap to Upstash for multi-instance).
- **Security headers**: X-Frame-Options=DENY, X-Content-Type-Options=nosniff, Referrer-Policy=strict-origin-when-cross-origin, Permissions-Policy with `geolocation, microphone, camera` denied.

### 8. Scaling beyond one node

See [docs/scaling.md](scaling.md) for full details on:
- Move rate limit to Redis-backed (e.g. `@upstash/ratelimit`)
- Move webhook delivery to a queue worker (BullMQ + Redis)
- Run multiple `api` replicas behind a load balancer (sessions are stateless JWT)
- Read replicas for `db` once read-load dominates writes

### 9. Upgrading

```bash
git pull
docker compose pull
docker compose up -d
docker compose exec api npx prisma migrate deploy
```

Schema migrations are forward-only; the test suite runs them against a clean database in CI before every release.

## Licensing

The LifeOS core is **AGPL-3.0**. If you host LifeOS publicly (including for customers), you must release source modifications under AGPL. Commercial-friendly add-ons (SSO/SAML, advanced analytics) ship under a separate license in a sibling repository.

For dual-license inquiries: kawoat1471@gmail.com.
