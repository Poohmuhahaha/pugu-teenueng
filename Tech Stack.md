# QuestPage: Main App Tech Stack

This document outlines the core technology stack for the main `questpage` application architecture, transitioning the QuestPage POC into a robust, scalable monorepo environment.

## 🏗️ Core Architecture (Deno Workspace Monorepo)

The project uses a **Deno Workspace** to manage multiple SvelteKit applications and shared packages, ensuring consistent dependencies and modularity.

### 1. Frontend & Applications (`/apps`)
- **Framework:** **SvelteKit** (across `web`, `admin`, `api`, `landing`)
- **Styling:** **Tailwind CSS** (shared via `@questpage/ui` package)
- **Language:** **TypeScript**
- **Design System:** Custom **Cal.com** aesthetics (as defined in `DESIGN.md`), featuring `Cal Sans` typography, 12px rounded cards, and high-contrast `#111111` accents.
- **Animations:** **Motion** (Framer Motion equivalent for modern UI micro-interactions)

### 2. Backend API (`/apps/api`)
- **Server:** **SvelteKit API Routes** (running on Node.js adapter, invoked via Deno task)
- **Validation:** **Zod** (Schema validation) & `@asteasolutions/zod-to-openapi` (Documentation)
- **Auth & Security:** `bcryptjs`, `jose` (JWT), and native device code OAuth flows.
- **Queues / Background Jobs:** `bullmq`, `ioredis` (Optional, for email & webhook dispatching)

### 3. Database (`/apps/api/prisma`)
- **Database Engine:** **PostgreSQL**
- **ORM:** **Prisma** (`@prisma/client`)
- **Client Mapping:** A `custom-prisma-client` generated locally to support Deno module resolution.

### 4. Integration & Real-time
- **Webhooks:** Native Prisma `Webhook` and `WebhookFailure` models are already configured to handle outbound HTTP callbacks to agents.
- **Real-time:** Utilizing SSE (Server-Sent Events) in SvelteKit for the QuestPage Human-in-the-Loop approval dashboard.

### 5. Testing & Quality
- **Unit Testing:** **Vitest**
- **E2E Testing:** **Playwright**
- **Linting & Formatting:** Native **Deno lint/fmt**
