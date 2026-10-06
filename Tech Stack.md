# Pugu: Main App Tech Stack

Core technology stack for the `pugu` monorepo.

## 🏗️ Core Architecture (Bun Workspace Monorepo)

The project uses a **Bun workspace** to manage multiple SvelteKit applications and shared packages, ensuring consistent dependencies and modularity. Deno is no longer used.

### 1. Frontend & Applications (`/apps`)
- **Framework:** **SvelteKit** (`web`, `admin`, `api`, `landing`, `docs`)
- **Language:** **TypeScript**
- **Design System:** **Teenueng** monochrome (ink on paper, Tinos + Inter, 1px hairlines, hard offset hover shadow) — shared via `@pugu/ui` (`packages/ui/src/design.css`)
- **Component gallery:** `/components` in the web app renders every primitive live
- **Animations:** CSS transitions (reduced-motion aware)

### 2. Backend API (`/apps/server`)
- **Server:** **SvelteKit API Routes** built with Vite and run with **Bun**
- **Validation:** **Zod** & `@asteasolutions/zod-to-openapi`
- **Auth & Security:** `bcryptjs`, `jose` (JWT), device-code OAuth flows
- **Queues / Background Jobs:** `bullmq`, `ioredis` (optional, for email & webhook dispatching)

### 3. Database (`/apps/server/prisma`)
- **Database Engine:** **PostgreSQL**
- **ORM:** **Prisma** (`@prisma/client`)
- **Client Mapping:** a `custom-prisma-client` generated locally (`prisma generate`) and patched to CommonJS via `scripts/patch-prisma.js`

### 4. Integration & Real-time
- **Webhooks:** Prisma `Webhook` / `WebhookFailure` models handle outbound callbacks.
- **Real-time:** SSE (Server-Sent Events) for the approval dashboard.

### 5. Tooling, Testing & Quality
- **Package manager / runtime:** **Bun** (`bun install`, `bun run`, `bunx`) — `bunfig.toml` pins `linker = "hoisted"` for predictable Docker copies
- **Unit Testing:** **Vitest**
- **E2E Testing:** **Playwright**
- **CI:** GitHub Actions with `oven-sh/setup-bun`
- **Containers:** Docker images use `oven/bun` (`oven/bun:1-debian` for the API so Prisma engines work, `oven/bun:1-alpine` for the web app)

### 6. Commands
```bash
bun install            # install the workspace
bun run setup-dev      # env + migrations + seed + all dev servers
bun run build          # build every app/package
bun run test           # run tests
docker compose up -d   # production stack (app :3001, api :3000, db :5432)
```
