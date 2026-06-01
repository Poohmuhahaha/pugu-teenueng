# Migration & follow-up notes

Status of the maintainability roadmap from the codebase audit.
Updated 2026-06-01.

---

## ✅ Done — on `main`

| Item | Commit | Notes |
|------|--------|-------|
| Workspace switch endpoint | `530078d` | `POST /api/v1/workspaces/[id]/switch`. Persists active workspace via a separate `lifeos_workspace` cookie. |
| Rate limiting | `530078d` | `lib/server/ratelimit.ts`. Wired into login, signup, forgot, reset, magic, waitlist/join. LRU fallback + Redis adapter ready. 4 vitest cases. |
| Design system consolidated | `530078d` | One canonical `packages/ui/src/design.css`. Three duplicated `app.css` files deleted. |
| Legacy CSS variables removed | this commit | 20 page-level stylesheets rewritten to use `--c-*` token names. Alias block stripped from `design.css`. |
| Playwright happy-path extended | this commit | Existing `e2e/happy-path.spec.ts` now covers workspace switch + rate-limit thresholds. |
| BullMQ adapter (feature-flagged) | this commit | `lib/server/queue.ts`. Activates when `REDIS_URL` is set AND `bullmq` is installed. Default Postgres-backed queue remains the production-safe baseline. |

---

## 🟡 Deferred — these need their own focused session

### Svelte 4 → Svelte 5 (with runes)

**Why deferred.** Cross-cutting migration that touches every `.svelte` file. Mixing pre-5 and post-5 syntax in the same app is supported but creates cognitive load and obscure runtime issues; clean migrations happen per-app, with the dev server running and a full smoke test after every chunk.

**Path forward**:

1. Verify Tiptap-svelte's Svelte 5 status (`apps/web/src/lib/components/Editor.svelte` is the choke point).
2. Update each app's `svelte` peer dep `^4.2.19 → ^5.0.0`, run `npx svelte-migrate svelte-5` per app.
3. Convert script-block state to `$state()`, derived to `$derived()`, lifecycle to `$effect()`. Skip components that aren't doing reactive work.
4. Update layout `<slot />` usages to `{@render children()}` — this is the only universal breaking change.
5. Validate each app independently before merging.

Budget: ~1 dev-day per app, 4 apps. Start with `landing` (smallest, lowest risk).

### Turborepo

**Why we're not adding it.** Deno workspaces already give us dependency-aware task execution via `deno task --filter @lifeos/<name> <task>`. Turbo on top of `deno task` would duplicate caching logic and not meaningfully improve build times. The genuine wins Turbo offers — remote caching, distributed CI — are not on the critical path while the team is small.

**When to revisit**: if monorepo build time crosses ~3 min on cold cache, or when a second engineer joins and CI parallelism starts mattering. At that point, the migration is straightforward: `pnpm add -Dw turbo`, define a `turbo.json` with the same task graph, switch `deno.json` scripts to call `turbo run`.

### BullMQ workers (process)

**Adapter is shipped**, but no out-of-process worker yet. Today the only consumer is the API host itself — which means BullMQ enqueues but the same Node process pulls jobs back off. That works for testing the adapter, but doesn't deliver the scalability win.

**Path forward**:

1. Create `apps/worker/` — a small Node entrypoint that boots BullMQ Workers for `lifeos:email` and `lifeos:webhook` queues.
2. Worker pulls `EmailJob` rows by `jobId`, calls `sendEmail()`, updates row.
3. For webhooks: re-derives HMAC signature from `secret + body`, POSTs, writes failure rows.
4. Dockerfile + helm chart entry. Set `REDIS_URL` + `bullmq` install in worker container.

The adapter is structured so adding the worker is purely additive — no changes needed to the API surface.

---

## ⚠️ Still ugly — known debt not yet addressed

| Issue | Impact | Effort |
|-------|--------|--------|
| `packages/ui` only ships CSS, no Svelte components | Auth cards, workspace switcher, badge layouts still duplicated across apps | 1 dev-day to extract 5–6 shared components |
| `apps/web/src/lib/components/Editor.svelte` couples Tiptap directly to the page | Hard to swap editor (e.g. Lexical, Prosemirror direct) | Refactor before the Svelte 5 migration so it only happens once |
| No structured logging / observability | Hard to debug production. Sentry adapter peer-optional but never instantiated | Wire `@sentry/node` in `hooks.server.ts` behind `SENTRY_DSN` env var |
| `docs/scaling.md` describes Redis pub-sub but `apps/web` SSE client doesn't reconnect with exponential backoff | Long-lived `/api/v1/sync/stream` clients silently drop | ~2 hours; add jitter + visibility-change reconnect |

---

## Quick reference — running the new things

```bash
# Unit tests
deno task test

# E2E happy-path (requires Postgres up + DB migrations applied)
deno task test:e2e

# Activate BullMQ queues (when you have a Redis available)
export REDIS_URL=redis://localhost:6379
# install the optional peer:
deno install -A npm:bullmq npm:ioredis
# now restart the api — adapter logs `[queue] BullMQ backend enabled`
```
