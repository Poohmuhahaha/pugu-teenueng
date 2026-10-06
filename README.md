# Pugu

> Your personal AI secretary that turns daily life into RPG quests.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Bun](https://img.shields.io/badge/Bun-1.x-black)](https://bun.sh)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-4.x-red)](https://kit.svelte.dev)

An intelligent assistant that turns your life, tasks, and notes into an RPG adventure. It combines a **private AI secretary**, **fantasy quest boards**, **block-based pages**, and **webhooks/REST APIs** so your life remains automated and your data remains 100% yours.

---

## Quick Start

```bash
git clone https://github.com/Poohmuhahaha/questpage.git
cd pugu
cp .env.example .env  # set POSTGRES_PASSWORD, JWT_SECRET, CSRF_SECRET
docker compose up -d
docker compose exec server bunx prisma migrate deploy --schema=prisma/schema.prisma
docker compose exec server bun run db:seed   # creates pooh@questpage.app / changeme123
```

Open `http://localhost:3001` and sign in.  
Full guide → [docs/quickstart.md](docs/quickstart.md)

---

## Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | SvelteKit 4 (Svelte 5 once Tiptap-svelte stabilizes) |
| **API** | SvelteKit server-only routes |
| **Database** | PostgreSQL 16 via Prisma |
| **Editor** | TipTap (svelte-tiptap) |
| **Offline / Sync** | RxDB + Dexie adapter (replication via REST + SSE) |
| **Auth** | JWT + bcrypt + Dashboard RBAC (Owner / Admin / Editor / Viewer / Member) |
| **License** | AGPL-3.0 for the OSS core |

---

## Monorepo Layout

```
pugu/
├─ apps/
│  ├─ web/          # SvelteKit frontend — localhost:5176 (dev) / 3001 (prod)
│  ├─ api/          # SvelteKit server-only API — localhost:3000
│  ├─ admin/        # Dashboard admin UI — localhost:5175
│  └─ landing/      # Marketing site — localhost:5177
├─ packages/
│  ├─ core/         # Zod schemas + domain types — shared by all apps
│  ├─ ui/           # Svelte component library
│  ├─ sdk/          # TypeScript client, auto-generated from OpenAPI
│  └─ templates/    # Starter quest-type packs (Dashboard Quests, Revenue Tracker, Integration & Rations, Documentation)
├─ docs/            # Full documentation
├─ docker-compose.yml
└─ helm/pugu/     # Kubernetes Helm chart
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/quickstart.md](docs/quickstart.md) | Get running in 10 minutes — Docker, Node, or Kubernetes |
| [docs/scaling.md](docs/scaling.md) | Scale beyond one node — Redis pub/sub, read replicas, webhook queues |
| [docs/api.md](docs/api.md) | Workspace API reference — quest boards, auth, admin endpoints, SDK |
| [docs/webhooks.md](docs/webhooks.md) | Messenger Bird registration, signature verification, retry semantics, recipes |
| [docs/privacy-policy.md](docs/privacy-policy.md) | Privacy Policy |
| [docs/terms-of-service.md](docs/terms-of-service.md) | Terms of Service |

---

## Pricing (tentative)

| Tier | THB / month | USD / month | Limits |
|------|------------:|------------:|--------|
| Free | 0 | $0 | 1 Dashboard · 1 Adventurer · 1,000 entries · community support |
| Adventurer Pro | 199 | $5.99 | Unlimited entries · 5 GB · Workspace Seal API |
| Admin | 999 | $29 | 10 Adventurers · 50 GB · SSO · Dashboard Chronicles · Fast Support |

---

## Local Development

```bash
bun run setup-dev   # sets up environment, database, and starts dev servers
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit issues, feature requests, and pull requests.

## Security

To report a security vulnerability, please follow our [SECURITY.md](SECURITY.md) responsible-disclosure process.

## License

Pugu is licensed under the **GNU Affero General Public License v3.0**. See [LICENSE](LICENSE) for the full text.