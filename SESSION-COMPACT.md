# Session Compact — Pugu

Snapshot of everything built in this conversation. Read this first when picking up
a new session — it gives a future Claude (or human) enough context to be useful
on minute one.

**Repo**: `D:\PROJECTS\website\pugu` · `github.com/Poohmuhahaha/questpage` · `main`
**Stack**: Deno workspaces · SvelteKit 4 · Prisma + Postgres · TypeScript
**Last commit at compact time**: `5777e0f`

---

## TL;DR — what shipped in this session

15 commits on `main`, no PRs (user pre-authorized direct pushes for this run):

```
5777e0f  feat(ui): remove button press animations + unify admin/web with landing voice
69a6613  feat(ui): dramatic hero animation + redesign admin/web home pages
3bf9284  feat(motion): add expressive animations across landing, docs, and web
74f9b39  docs: bug audit cycle 3 — loop closed
63335df  fix: audit cycle 3 — clear remaining carry-overs (B-015 + C-B/C-C/C-D)
e47fe28  docs: bug audit cycle 2 — Agent 3.2 verification report
9d24652  fix: audit cycle 2 — apply Agent 1.2 bug fixes
2c3e542  docs: bug audit cycle 1 — Agent 3 verification report
52ff597  fix: audit cycle — apply Agent 1 bug-list fixes (11 fixes)
117ef97  feat: ship Life Command — the Pugu CLI (apps/cli)
ebaf894  fix(docs): resolve /@fs/ 403 + serve docs under /docs path
a75e3be  docs: ship apps/docs — framework-style documentation site
6f462e5  feat: P1/P2 cleanup — legacy CSS sweep, e2e coverage, BullMQ adapter
530078d  feat: P0/P1 hardening — workspace switch, rate limiting, design system consolidation
e8f563b  feat: Cal.com-inspired redesign, SEO + business positioning, perf hardening
```

---

## Apps + ports

| App | Path | Dev port | Adapter | Purpose |
|---|---|---|---|---|
| Landing | `apps/landing/` | 5177 | static | Marketing site (Cal.com-inspired design) |
| Web | `apps/web/` | 5176 | node | Authenticated workspace |
| Admin | `apps/admin/` | 5175 | node | Workspace admin (content types, entries, API keys) |
| Docs | `apps/docs/` | 5178 (`/docs/` base) | static | Framework-style docs site, reads `docs/*.md` |
| API | `apps/api/` | 3000 | node | SvelteKit server routes + Prisma |
| **CLI** | `apps/cli/` | — | npm bin | Life Command — `life` binary, REPL + commands |

Run everything: `deno task dev`. It launches all five via `scripts/setup-and-run.js`.

---

## Design system

- Lives in `packages/ui/`:
  - `src/design.css` — the single source of truth. Cal.com tokens (`--c-primary`, `--c-ink`, `--c-surface-card`, etc.), base typography, utility classes (`.btn`, `.card`, `.input`, `.badge`, `.nav-pill-group`, `.auth-card`, `.t` for tables).
  - `src/motion.ts` — animation utilities built on Motion One. Exports: `reveal`, `staggerChildren`, `countUp`, `pageTransition`, `prefersReducedMotion`, `EASING`, `DURATIONS`.
  - `src/index.ts` — barrel. **`springPress` is intentionally NOT re-exported** (user feedback: buttons should not animate on press).
- Each app does `import '@pugu/ui/design.css';` at its layout. The CSS file is loaded once per app.
- Resolution: Deno workspaces hoist `node_modules/@pugu/ui` as a junction to `packages/ui`. If the junction is missing (after fresh clone or `deno install` reset), create with PowerShell:
  ```powershell
  New-Item -ItemType Junction -Path "D:\PROJECTS\website\pugu\node_modules\@pugu\ui" -Target "D:\PROJECTS\website\pugu\packages\ui"
  ```

---

## Animation system

Motion One added at the workspace root (`deno.json` imports `motion@^12`).

- **Landing hero**: word-stagger headline (each word rises 48px with -2° rotation), 3D-perspective mockup-card swing-in (`rotateY -18°, rotateX 6°`), scroll-linked parallax, looping mockup badge/check pulse (2.4s cadence).
- **Docs**: page-head fade-up, prose-block stagger, help-card reveals.
- **Web**: KPI count-up, collection-card reveal, workspace-switcher dropdown fly+fade with chevron rotation.
- **All apps**: `prefers-reduced-motion: reduce` no-ops everything.
- **Buttons**: NO animation. CSS `:active` only. `springPress` exists in the source but is not re-exported.

---

## Backend systems built

### Auth
- JWT session cookie (`pugu_session`) + active-workspace cookie (`pugu_workspace`).
- `POST /api/v1/workspaces/[id]/switch` — sets the active-workspace cookie atomically.
- **Device-code flow** for the CLI:
  - `POST /api/auth/device/start` — issues `device_code` + `user_code`.
  - `POST /api/auth/device/approve` — browser-side approval (uses `updateMany({ where: { status: 'pending' }})` to prevent TOCTOU races).
  - `POST /api/auth/device/poll` — CLI polls. JWT minted just-in-time, never stored. Sets `consumedAt` on first successful exchange.
  - Browser-side page: `apps/web/src/routes/auth/device/+page.svelte`.

### Rate limiting
- `apps/api/src/lib/server/ratelimit.ts` — LRU fallback + optional Redis (`redisRateLimit` already in `redis.ts`).
- Composite keys (route + IP + optional email qualifier).
- Wired into: `/api/auth/{login,signup,forgot,reset,magic}`, `/api/v1/waitlist/join`, `/api/auth/device/start`, `/api/auth/device/poll`, `/api/auth/device/approve`.

### Queue adapter (feature-flagged)
- `apps/api/src/lib/server/queue.ts` — chooses BullMQ when `REDIS_URL` is set AND `bullmq` is installed; otherwise falls back to Postgres-backed polling.
- `email-queue.ts` and `webhook.ts` route through the adapter. No worker process exists yet (deferred — see `docs/migration-notes.md`).

---

## Three bug-audit cycles (closed)

Ran a three-agent loop: Agent 1 finds → Agent 2 fixes → Agent 3 verifies. Looped 3 times.

| Cycle | Found | Fixed | Verified | Deferred |
|---|---|---|---|---|
| 1 | 12 | 11 | 9 + 1⚠ | 1 (B-004) |
| 2 | 2 | 2 | 1 + 1⚠ (B-013 introduced B-015) | 0 |
| 3 | 4 | 4 | 4 ✅ | 0 |

Loop terminated by Agent 3.3 — no new bugs, no carry-overs. **18 total bugs found, 17 fixed, 1 deferred** (B-004: email "delivered:false" handling — product decision, not a code bug).

Full report: `docs/bug-audit-report.md`.

---

## Life Command (CLI)

- **Install**: `npm i -g @pugu/cli` (also works with `bun add -g`, `deno install`).
- **Binary**: `life`. Cross-runtime entry shim in `apps/cli/bin/life.js`.
- **REPL**: `life` with no args drops you into an interactive prompt.
- **Auth**: both flows
  - `life login` — paste API key (validates via `/api/v1/me`).
  - `life login --device` — opens browser, polls until approved.
- **Commands**: `status`, `whoami`, `workspaces`/`ws`, `types`, `ls`, `cat`, `new`, `capture`, `search`, `keys`, `logout`.
- **Config**: `~/.pugu/config.json` (chmod 0600 on POSIX).
- **Source**: `apps/cli/src/`. Compiled JS in `apps/cli/dist/`. `npm run build` to recompile.

---

## Docs site (`apps/docs/`)

- Static SvelteKit at `/docs/*` (paths.base set).
- Renders `docs/*.md` via `marked@14` with a custom `DocsRenderer`:
  - Heading slugs + auto-TOC.
  - Code blocks with language data attrs.
  - Emoji-led blockquotes become typed callouts (`> ℹ️` info, `> ⚠️` warning, `> ✅` success).
  - Internal `.md` links auto-rewritten to `/<slug>` routes.
- Three-column shell: sticky sidebar (sections from `apps/docs/src/lib/sections.ts`) + content + sticky TOC.
- Landing's nav + footer + sitemap now point at `/docs/*`.

---

## Database

PostgreSQL via Prisma. 17 models in `apps/api/prisma/schema.prisma`:

- **Identity**: User, AuthToken, Session, **DeviceCode** (new this session)
- **Workspace**: Workspace, WorkspaceMember, WorkspacePermissionDefault
- **CMS core**: ContentType, ContentTypePermission, ContentEntry, Backref
- **Integrations**: ApiKey, Webhook, WebhookFailure
- **Billing**: Subscription
- **Ops**: AuditLog, EmailJob, WaitlistEntry

**Migrations**:
- `20260521070718_init` — original
- `20260601100000_device_codes` — DeviceCode model (created this session)

**Database isn't running?** No VPS needed. Options:
1. `docker compose up -d postgres` (uses the repo's `docker-compose.yml`)
2. Cloud free tier (Neon, Supabase, Railway) — paste connection URL into `DATABASE_URL`
3. Only need a VPS if you're *hosting Pugu for others*

---

## i18n

`packages/core/src/i18n.ts` — en + th. Extended this session with business sections (trust strip, who-it's-for, how-it-works, FAQ).

---

## Known deferred work

| Item | Why deferred | Effort to ship |
|---|---|---|
| Svelte 4 → 5 with runes | Cross-cutting migration, every component touches | ~1 day per app × 4 apps |
| BullMQ worker process | Adapter shipped but no out-of-process consumer | New `apps/worker/` Node entrypoint |
| Sentry integration | Peer dep declared, never instantiated | ~2 hours behind `SENTRY_DSN` env var |
| `@pugu/ui` Svelte components | Only CSS lives there; auth cards / switcher still duplicated | ~1 day to extract 5–6 components |
| Email `delivered: false` policy (B-004) | Product decision — fail loud vs. fail quiet | One commit when decided |
| Some admin pages off landing voice | Only `+page.svelte` (home) was promoted | Each sub-page needs the hero-head pattern applied |
| Turborepo | Not needed yet — Deno tasks handle parallelism | Skip until build crosses ~3 min |

---

## Recurring gotchas

1. **`/@fs/` 403 on dev**: each app's `vite.config.ts` already has `server.fs.allow: [WORKSPACE_ROOT]`. If you add a new app, copy that block.
2. **`@pugu/ui` 404 in Vite**: the junction at `node_modules/@pugu/ui` is created by Deno on `deno install` but may need manual `New-Item -ItemType Junction` on Windows after fresh clones.
3. **Direct pushes to main**: harness sub-agents flag this as a security concern even though the user pre-authorized for this session. Either run pushes from the main context, or open a PR via `gh pr create` if reviewing matters.
4. **CRLF warnings on `git commit`**: project mixes line endings; ignore the warnings.
5. **Pre-existing duplicate workspace race on signup**: cycle-3 fix re-checks ownership in the `P2002` catch — bug closed, but still worth a single owner-uniqueness constraint when you next touch the schema.

---

## File map — where stuff lives

```
D:\PROJECTS\website\pugu\
├─ SESSION-COMPACT.md      ← this file
├─ DESIGN.md               ← Cal.com design analysis (source of truth for tokens)
├─ docs/
│  ├─ bug-audit-report.md  ← 3-cycle audit history
│  ├─ migration-notes.md   ← deferred items + rationale
│  ├─ cli.md               ← Life Command docs
│  ├─ quickstart.md, scaling.md, api.md, webhooks.md
│  └─ privacy-policy.md, terms-of-service.md
├─ apps/
│  ├─ landing/             ← static marketing
│  ├─ web/                 ← authenticated workspace
│  ├─ admin/               ← workspace admin
│  ├─ docs/                ← documentation site
│  ├─ api/                 ← Prisma + SvelteKit server routes
│  └─ cli/                 ← Life Command
├─ packages/
│  ├─ core/                ← Zod schemas + i18n
│  ├─ sdk/                 ← TypeScript SDK
│  ├─ ui/                  ← Cal.com design system + Motion One helpers
│  └─ templates/           ← starter content-type packs
├─ scripts/
│  ├─ setup-and-run.js     ← `deno task dev` entry point
│  └─ patch-prisma.js
├─ deno.json               ← workspace + tasks
├─ docker-compose.yml      ← Postgres + minio for local dev
└─ helm/pugu/            ← Kubernetes chart
```

---

## To resume in the next session

1. `git pull origin main`
2. If `node_modules` looks stale: `deno install`
3. Verify `@pugu/ui` junction (see "Recurring gotchas" #2)
4. Bring up Postgres: `docker compose up -d postgres`
5. Apply any new Prisma migrations: `cd apps/api && npx prisma migrate deploy`
6. `deno task dev` to launch everything

Ports to bookmark:
- http://localhost:5177 — landing
- http://localhost:5177/docs/ — docs (through landing proxy)
- http://localhost:5178/docs/ — docs (direct)
- http://localhost:5176 — web app
- http://localhost:5175 — admin
- http://localhost:3000 — api console
