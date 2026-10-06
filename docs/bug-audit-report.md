# Bug Audit Cycle — 2026-06-01

Three-agent run: Agent 1 found 12 bugs, Agent 2 fixed 11, deferred 1.
This report is Agent 3's independent verification.

**Commit**: [52ff597](https://github.com/Poohmuhahaha/questpage/commit/52ff597)
**Tests**: pass (25/25 in apps/api)
**Build**: pass (apps/api vite build clean; apps/cli `tsc --noEmit` clean)

## Summary

| Severity | Found | Fixed | Verified | Partial | Wrong | Deferred |
|----------|-------|-------|----------|---------|-------|----------|
| P0       | 1     | 1     | 1        | 0       | 0     | 0        |
| P1       | 4     | 3     | 3        | 0       | 0     | 1        |
| P2       | 5     | 5     | 4        | 1       | 0     | 0        |
| P3       | 1     | 1     | 1        | 0       | 0     | 0        |
| **All**  | **11**| **10**| **9**    | **1**   | **0** | **1**    |

(Note: B-IDs run 001..012 but B-004 was the only deferral, so 11 fixes were claimed; 1 was deferred. The grid above tallies status only.)

## Verification details

### B-001 — Device-code verification_uri hardcoded to port 5176
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/routes/api/auth/device/start/+server.ts` now prefers `process.env.PUBLIC_WEB_URL` and only falls back to the `:3000 → :5176` swap, which is the dev shape.
- **Why this resolves the bug**: In production the previous `.replace(/:3000$/, ':5176')` was a no-op (prod origins end with `:443`/no port), so `verification_uri` pointed at the API host instead of the web app. Setting `PUBLIC_WEB_URL=https://app.questpage.com` now puts the CLI user on the right host.
- **Residual concern**: Operators must set `PUBLIC_WEB_URL` or the device flow still issues an API-host URL in production. Worth documenting in `docs/quickstart.md`.

### B-002 — `touchSession` not awaited in hooks
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/hooks.server.ts` now `await`s `touchSession(token)`.
- **Why this resolves the bug**: Previously the floating promise could be cut off by request termination and the `lastSeenAt` update could be lost. Awaiting guarantees the write lands before the response flushes.
- **Residual concern**: `touchSession` still internally swallows DB errors via `.catch(() => {})`, so Agent 2's commit message claim that "errors surface" is not literally true — only the *ordering/durability* benefit lands. Also, every authenticated request now waits on a DB UPDATE; if the DB is slow this adds latency. Consider keeping a fire-and-forget path but flushing in a `Promise.allSettled` next-tick batcher if the latency hit shows up.

### B-003 — Email-queue backoff off-by-one
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/lib/server/email-queue.ts:76` now indexes `BACKOFFS_SEC[nextAttempt - 1]`.
- **Why this resolves the bug**: `nextAttempt` is the attempt-count *after* the failure (starts at 1). The previous `BACKOFFS_SEC[nextAttempt]` skipped the 30 s entry on the first retry and would have returned `undefined` for `nextAttempt === 5` (caught by the `??` fallback). Now retry 1 → 30 s, retry 4 → 1 h, as the comment claims.
- **Residual concern**: None.

### B-004 — Email "delivered: false" handling
- **Status**: Deferred (see Deferred items below).

### B-005 — Stripe webhook can persist `stripePriceId: undefined`
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/routes/api/webhooks/stripe/+server.ts` extracts `firstItem = sub.items.data[0]` and throws `error(400, 'subscription event has no items')` when missing; both upsert branches now read `firstItem.price.id` directly.
- **Why this resolves the bug**: Previously `sub.items.data[0]?.price.id` would evaluate to `undefined`, which Prisma writes as `null` on `update` and would either fail or silently null-out the column on `create`. Now an items-less event 400s and Stripe will retry; the row is never half-written.
- **Residual concern**: None. (Stripe in practice always sends at least one item for `customer.subscription.{created,updated}`, but defensive rejection is the right call.)

### B-006 — `ensurePersonalWorkspace` race on duplicate slug
- **Status**: Partial
- **What Agent 2 changed**: `apps/api/src/lib/server/workspace.ts` wraps the `upsert` in try/catch; on Prisma `P2002` it falls back to `db.workspace.create({ slug: baseSlug-<random> })`.
- **Why this resolves the bug**: The plain upsert was vulnerable to a SELECT-then-INSERT race because Prisma upsert is not a single ON-CONFLICT statement; catching P2002 prevents a 500 to the caller.
- **Residual concern**: The slug is `${userName.toLowerCase()...}-${userId}`, which already embeds `userId`. The only realistic source of P2002 is two concurrent signup-completion requests for the *same* userId (e.g. double-click). With the current retry, the second request creates a *second* workspace for the same user with a `-{suffix}` slug — they end up owning two workspaces. The early `findFirst({ userId, role: 'owner' })` guard catches subsequent calls but not the racing pair. A better fix on P2002 would be to re-run the early `findFirst` and return if a workspace now exists, only falling through to suffix-create when the slug collision is genuinely from a different user (which under the current naming scheme shouldn't be possible at all).

### B-007 — Dead `targets` variable in `rebuildBackrefs`
- **Status**: Verified
- **What Agent 2 changed**: Dropped both the `const targets = ...` build and the `void targets;` suppression from `apps/api/src/lib/server/backref.ts`.
- **Why this resolves the bug**: Pure dead-code removal — no behavior change, slightly less noise for the next reader. Diff is minimal and safe.
- **Residual concern**: None.

### B-008 — Device-code approve TOCTOU
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/routes/api/auth/device/approve/+server.ts` swaps `db.deviceCode.update({ where: { id }})` for `updateMany({ where: { id, status: 'pending' }, ... })` and returns 409 when `result.count === 0`.
- **Why this resolves the bug**: Two concurrent approve calls would previously both pass the `row.status !== 'pending'` precheck and both write `userId`, last-write-wins. The conditional updateMany makes the status check and the write a single atomic statement, and the count check catches the loser.
- **Residual concern**: None — Prisma compiles this to an `UPDATE ... WHERE status='pending'`, which is the right primitive.

### B-009 — `generateApiKey` uses `Math.random()`
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/lib/server/auth.ts` now imports `randomBytes` from `node:crypto` and emits `lk_` + 6 random bytes (12 hex chars) prefix and 24 random bytes (48 hex chars) secret.
- **Why this resolves the bug**: `Math.random()` is not cryptographic and was producing predictable API key material. `crypto.randomBytes` is CSPRNG-backed. Storage format unchanged (prefix indexed, secret bcrypt-hashed elsewhere), so no migration needed.
- **Residual concern**: The on-the-wire key shape changed (was `[a-z0-9]{8}` prefix + `~24 [a-z0-9]` secret; now `[0-9a-f]{12}` prefix + `[0-9a-f]{48}` secret). Existing issued keys keep working because lookup is by prefix string match and verification is bcrypt — only *new* keys look different. Operator-facing change worth noting in changelog.

### B-010 — `/api/v1/:collection` loads entire collection into memory
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/routes/api/v1/[collection]/+server.ts` replaces the fetch-all-then-`slice()` pattern with `Promise.all([count, findMany({ take, skip })])`.
- **Why this resolves the bug**: A workspace with 100k entries previously pulled all 100k rows over the wire and sliced page N in JS. Now Prisma pushes `LIMIT/OFFSET` to Postgres and reports `total` via a separate `COUNT`. Memory and latency drop to O(pageSize).
- **Residual concern**: The leftover comment ("we evaluate filters in-memory after fetching by content-type") is stale — there is no in-memory filtering happening here (and there wasn't before either; only pagination was in-memory). Worth a follow-up comment cleanup. Also, `q.where` parsed from filters is *not* threaded into the Prisma query — JSONB filters silently no-op. That predates this fix but is worth flagging.

### B-011 — `?fields=` not whitelisted before object-key use
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/lib/server/query.ts` now applies `/^[a-zA-Z_][a-zA-Z0-9_]*$/` against each `fields=` entry and drops anything that fails.
- **Why this resolves the bug**: `projectFields` does `picked[f] = data[f]` and `f in data`. Without the whitelist, a value like `__proto__` or `constructor` was syntactically permitted, and although the assignment target was a fresh object, the `in` check still touches the prototype chain. The whitelist also blocks dotted paths and bracket notation that would have been ineffective-but-confusing.
- **Residual concern**: None.

### B-012 — Device-code start hangs on user_code collision
- **Status**: Verified
- **What Agent 2 changed**: `apps/api/src/routes/api/auth/device/start/+server.ts` tracks a `resolved` flag and throws `error(500, 'unable to allocate unique user code; please retry')` if all 5 attempts collide.
- **Why this resolves the bug**: Previously the loop would exit silently after 5 iterations and the code would attempt `db.deviceCode.create({ userCode })` with a known-colliding userCode, which would throw a P2002 and return an opaque 500 with no actionable message. Now the failure is explicit and rate-limit-respecting (only 5 SELECTs cost, no INSERT attempt).
- **Residual concern**: With a 30-char alphabet and 8-char codes, the probability of 5 consecutive collisions is astronomically low at any realistic scale; this branch is effectively unreachable. Fix is still good defensive code.

## Deferred items

### B-004 — Email "delivered: false" handling
- **Agent 2's reasoning**: "email auto-mark-sent vs. retry semantics need product judgment; current prod path already retries up to MAX_ATTEMPTS then abandons — no silent data loss in the loaded sense Agent 1 implied. Leaving for a human decision on logging + intent."
- **Agent 3's assessment**: Sound deferral. Reading `apps/api/src/lib/server/email-queue.ts:49-58`, the dev branch marks the row as `sentAt = new Date()` with `lastError: 'resend disabled'` — that is intentional dev ergonomics to avoid filling the queue when `RESEND_API_KEY` isn't set. The prod branch correctly funnels into `scheduleRetry` up to `MAX_ATTEMPTS` and then sets `abandonedAt`. There is no silent loss in prod. The only product question is whether the dev-only "mark as sent with lastError" semantic is confusing to ops dashboards (because `sentAt != null` reads as success). A follow-up commit could either (a) add a dedicated `skippedAt` column / status, or (b) leave a `lastError: 'resend disabled'` row with `sentAt: null, abandonedAt: now` so it's filtered out of "sent" counts. Either is a 5-minute change once product decides.

## Recommendations for the next cycle

- **B-006 follow-up**: The current P2002 fix can produce two workspaces for one user under a concurrent-signup race. Re-run `findFirst({ userId, role: 'owner' })` inside the catch before falling through to the suffixed `create`.
- **`/api/v1/:collection` filters silently ignored**: `parseQuery` builds a `where` from `?filters[...]` but the route never passes it to Prisma. Either wire it in (Prisma supports `path` filters on JSONB) or strip the parsing.
- **Stale comment in `[collection]/+server.ts`**: The "filters in-memory after fetching" comment is no longer true (and wasn't true before either). Remove or rewrite.
- **`touchSession` swallows errors**: While B-002's await is correct, the inner `.catch(() => {})` means session-write failures are still invisible. Consider logging via the structured logger.
- **`PUBLIC_WEB_URL` is required in production** for the device flow but isn't called out in `docs/quickstart.md`. Worth adding to the env-var checklist.
- **Webhook secret rotation**: Not in scope here, but while reading the Stripe handler I noticed `STRIPE_WEBHOOK_SECRET` has no rotation/multi-secret support. Low priority but worth a tracker note.

## Process notes for Agent 1

- Bugs Agent 1 framed accurately: B-001, B-002, B-003, B-005, B-007, B-008, B-009, B-010, B-011, B-012. Symptoms and locations matched the code.
- Bugs where Agent 1's framing was misleading or off:
  - **B-006**: framed as a generic "race on duplicate slug" but the slug includes `userId`, so the only realistic source of duplication is a same-user signup retry — a different problem than a cross-user slug collision. Agent 2 fixed the surface symptom but the deeper "two workspaces for one user" risk wasn't called out.
  - **B-004**: deferral was reasonable, but Agent 1's framing as "silent data loss" oversold a dev-only ergonomic decision. Worth tightening the wording so future reviewers don't burn time on it.
- Files Agent 1 should look at more carefully next pass:
  - `apps/api/src/routes/api/v1/[collection]/+server.ts` — JSONB filter wiring is missing and the stale "in-memory filter" comment hides it.
  - `apps/api/src/lib/server/sessions.ts` — error swallowing in `touchSession` undercuts B-002's stated benefit.
  - `apps/api/src/lib/server/workspace.ts` — re-examine the race model (same-user vs cross-user) before patching.

---

# Bug Audit Cycle 2 — 2026-06-01

Agent 1.2 found 2 bugs, Agent 2.2 fixed 2, deferred 0.

**Commit**: [9d24652](https://github.com/Poohmuhahaha/questpage/commit/9d24652)
**Tests**: pass (25/25 in apps/api)
**Build**: pass (apps/api vite build clean; apps/web vite build clean)

## Summary

| Severity | Found | Fixed | Verified | Partial | Wrong | Deferred |
|----------|-------|-------|----------|---------|-------|----------|
| P0       | 0     | 0     | 0        | 0       | 0     | 0        |
| P1       | 1     | 1     | 0        | 1       | 0     | 0        |
| P2       | 1     | 1     | 1        | 0       | 0     | 0        |
| P3       | 0     | 0     | 0        | 0       | 0     | 0        |
| **All**  | **2** | **2** | **1**    | **1**   | **0** | **0**    |

(B-013 is graded Partial because the `$in` operator is wired to Prisma's `array_contains`, which has different semantics than Strapi `$in`. Other operators in the same fix verify cleanly.)

## Verification details

### B-013 — Query where-clause silently ignored (P1)
- **Status**: Partial
- **What Agent 2.2 changed**: `apps/api/src/lib/server/query.ts` rebuilds the filter-to-where converter to emit Prisma JSON-path clauses (`{ data: { path: [field], <op>: value } }`) accumulated under `AND`, hoists the `FIELD_NAME` whitelist so filter keys are now subject to the same regex as `?fields=`, and deduplicates `$in` keys; `apps/api/src/routes/api/v1/[collection]/+server.ts` spreads `q.where` into the base `where` so the clauses actually reach Prisma.
- **Why this resolves the bug**: `?filters[...]` parameters are no longer parsed-then-discarded — they reach Postgres via Prisma's JSON-path filters and constrain the result set. Field-name whitelist closes the same prototype-pollution / dotted-path foot-gun B-011 closed for `?fields=`. The JSON-path shape matches the project's existing usage (see `apps/api/prisma/seed.ts:116`) and the `ContentEntry.data Json` schema column.
- **Residual concern**: The `$in` operator maps to Prisma's `array_contains`, which has different semantics from Strapi-style `$in`. `array_contains: ['high', 'med']` asks Postgres "is `data.priority` a JSON array containing both 'high' AND 'med'" — but Strapi `$in` means "is `data.priority` one of these scalars (OR)." For scalar JSON fields (the common case), this returns zero rows instead of the union. The correct shape is `{ OR: values.map(v => ({ data: { path: [field], equals: v } })) }`. All other operators (`$eq`, `$ne`, `$gt/gte/lt/lte`, `$contains`, `$null`) verify cleanly. No crafted payload appears to produce an opaque Prisma throw: numeric ops on string JSON fields return zero rows rather than 500, and `String(castValue(v))` always coerces `$contains` to a string. The stale "we evaluate filters in-memory after fetching" comment from cycle 1's residual list is now replaced with an accurate comment — good.

### B-014 — Math.random for block IDs (P2)
- **Status**: Verified
- **What Agent 2.2 changed**: `apps/web/src/lib/components/Editor.svelte:54` swaps `Math.random().toString(36).slice(2)` for `crypto.randomUUID()` inside `docToBlocks`.
- **Why this resolves the bug**: `docToBlocks` is invoked only from TipTap's `onUpdate` and from a function reading `editor.getJSON()` — both code paths run after `onMount`, so they execute in the browser, where `window.crypto.randomUUID()` is available on all evergreen targets (Chrome 92+, FF 95+, Safari 15.4+). UUIDs are 122 bits of entropy vs. ~32 bits from the previous `Math.random` slice, eliminating realistic collision risk inside one document's block set.
- **Residual concern**: None. SvelteKit SSR doesn't invoke this path (TipTap mounts client-side), so the lack of a `node:crypto` import is fine. If someone ever refactors `docToBlocks` to run server-side, the same identifier resolves to Node's global `crypto.randomUUID()` on Node 19+ — current project Node is 22.x — so it would still work; worth a comment if the refactor lands but not blocking.

## New bugs surfaced during verification

- **B-015 (P2) — `$in` filter has wrong semantics**: As described in B-013's residual concern. `filters[priority][$in]=high&filters[priority][$in]=med` returns zero matches against a scalar JSON field because `array_contains: ['high','med']` requires the stored value to itself be a `["high","med",...]` array containing both. Fix shape: replace the `$in` branch with `andClauses.push({ OR: all.map((v) => ({ data: { path: [field], equals: v } })) })`. Low blast radius (no callers in tree yet wire `$in`), but contracts say it's supported.

## Carry-over status from cycle 1

- **C-B (touchSession swallows DB errors)**: Still applicable. `apps/api/src/lib/server/sessions.ts:24` still ends with `.catch(() => {})`. No code change since cycle 1. The cycle-1 await fix landed, but the inner error swallow remains — session-write failures are still invisible to logs.
- **C-C (B-006 partial — duplicate workspace on same-user race)**: Still applicable. `apps/api/src/lib/server/workspace.ts:40-56` is unchanged from cycle 1. On a P2002 from concurrent same-user signup, the catch branch still falls through to `db.workspace.create({ slug: baseSlug-<random> })` without re-checking `findFirst({ userId, role: 'owner' })`, so the user can end up owning two workspaces.
- **C-D (PUBLIC_WEB_URL not documented)**: Still applicable. `grep -r PUBLIC_WEB_URL docs/` returns only this audit report — `docs/quickstart.md` still lacks the env-var entry.

## Recommendations for cycle 3

- **Fix B-015 ($in → OR-of-equals)**: 4-line change in `query.ts`. Cleanest follow-up. Worth pairing with a unit test that hits each operator branch of `parseQuery` so this class of regression is caught earlier.
- **Address C-B/C-C/C-D**: Three small, well-understood follow-ups from cycle 1. Each is <10 lines plus tests/docs. Bundling them into a single "tech-debt: cycle 1 carry-overs" commit would clear the backlog cleanly.
- **Add a `parseQuery` test file**: This module is now the second-most-foot-gun-prone file in the API (after the webhook handler) and has zero direct unit coverage. A 5-case test (one per operator family + the field-name whitelist) would be cheap and load-bearing.
- **Verdict**: Cycle 3 is **worthwhile** but small — one real bug (B-015) plus three known carry-overs. After that, signal is likely thin enough to stop and shift to test coverage.

---

# Bug Audit Cycle 3 — 2026-06-01

Agent 1.3 found 4 confirmed bugs (B-015 + carry-overs C-B, C-C, C-D), no new bugs.
Agent 2.3 fixed all four (plus a stale comment in `[collection]/+server.ts`).

**Commit**: [63335df](https://github.com/Poohmuhahaha/questpage/commit/63335df)
**Tests**: 25/25 passing (`apps/api` vitest)
**Build**: clean (`apps/api` vite build, `apps/web` vite build)

## Summary

| Severity | Found | Fixed | Verified | Partial | Wrong | Deferred |
|----------|-------|-------|----------|---------|-------|----------|
| P1       | 0     | 0     | 0        | 0       | 0     | 0        |
| P2       | 2     | 2     | 2        | 0       | 0     | 0        |
| P3       | 2     | 2     | 2        | 0       | 0     | 0        |
| **Total**| **4** | **4** | **4**    | **0**   | **0** | **0**    |

(B-015 = P2, C-C = P2, C-B = P3, C-D = P3.)

## Verification details

**B-015 — `$in` filter semantics** ✅
`apps/api/src/lib/server/query.ts:66` now reads `andClauses.push({ OR: all.map((v) => ({ data: { path: [field], equals: v } })) })`. `array_contains` is gone from the codebase (the only remaining reference is the explanatory comment above the new line). `parseQuery` only enters this branch when at least one `filters[…][$in]=…` is present, so `all` is always non-empty and the empty-OR pitfall doesn't apply. API build clean; the upstream callsite in `[collection]/+server.ts` simply spreads `q.where.AND` into the Prisma where clause unchanged.

**C-B — touchSession error visibility** ✅
`apps/api/src/lib/server/sessions.ts:27` now logs to stderr: `.catch((err) => { console.error('[sessions.touch] update failed:', err); })`. Request flow is still non-blocking — the await + catch is preserved exactly where it was, so a DB hiccup never bubbles into the user-facing response. Operators now see failures in logs.

**C-C — ensurePersonalWorkspace race** ✅
`apps/api/src/lib/server/workspace.ts:49-69` now re-queries `workspaceMember.findFirst({ userId, role: 'owner' })` inside the P2002 catch. If the user already owns a workspace (concurrent same-user signup case), it returns that workspace and skips the suffixed-create path. Only when no owner membership exists for this `userId` (genuine cross-user slug collision) does it fall back to `${baseSlug}-${suffix}`. The free-tier subscription `upsert` at the bottom remains idempotent so it's safe on either branch. Race trace walked end-to-end; no path now creates a duplicate workspace for the same user.

**C-D — PUBLIC_WEB_URL documentation** ✅
Added to two places:
- `.env.example:31` — `PUBLIC_WEB_URL=""` with comment noting dev fallback and production requirement.
- `docs/quickstart.md` — full row in the optional-env table explaining the CLI device-code use case, dev `:3000→:5176` fallback, and production requirement.
Doc text matches the implementation at `apps/api/src/routes/api/auth/device/start/+server.ts:64` exactly (`process.env.PUBLIC_WEB_URL ?? event.url.origin.replace(/:3000$/, ':5176')`).

**Stale comment cleanup** ✅
`apps/api/src/routes/api/v1/[collection]/+server.ts:31-34` now correctly states "Sort keys that target JSON fields under `data` are silently dropped — Prisma can't push them down and we no longer support in-memory sorting for paged queries." Matches actual behavior.

## Three-cycle totals

| Cycle | Found | Fixed | Verified | Deferred |
|-------|-------|-------|----------|----------|
| 1     | 12    | 11    | 9        | 1 (B-004) |
| 2     | 2     | 2     | 1+1⚠     | 0        |
| 3     | 4     | 4     | 4        | 0        |
| **Total** | **18** | **17** | **14+1⚠** | **1** |

(Cycle 2's ⚠ was a partial-verify on a fix that landed but with a known follow-up — addressed and cleared in cycle 3.)

## Outstanding items

- **B-004** — Email "delivered: false" handling. Deferred by design judgment in cycle 1. Still applicable as a product decision, not a code bug.

## Loop status

🛑 **Loop terminates here** — three consecutive cycles, all cycle-3 fixes verified, no new bugs introduced by fixes, no carry-overs remaining, deferral list stable at 1 (B-004, which is a product decision rather than a defect).
