# LifeOS

> Headless productivity OS you can self-host — Strapi for personal life management.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](LICENSE)
[![Deno](https://img.shields.io/badge/Deno-2.x-blue)](https://deno.com)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-4.x-red)](https://kit.svelte.dev)

Combines what people leave Notion + Obsidian to find: **knowledge graph**, **block-based pages**, **database views**, **local-first sync**, and a **public REST API** so your data is actually yours.

---

## Quick Start

```bash
git clone https://github.com/Poohmuhahaha/lifeos.git
cd lifeos
cp .env.example .env  # set POSTGRES_PASSWORD, JWT_SECRET, CSRF_SECRET
docker compose up -d
docker compose exec api npx prisma migrate deploy
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
| **Auth** | JWT + bcrypt + Workspace RBAC (Owner / Admin / Editor / Viewer / Member) |
| **License** | AGPL-3.0 for the OSS core |

---

## Monorepo Layout

```
lifeos/
├─ apps/
│  ├─ web/          # SvelteKit frontend — localhost:5176 (dev) / 3001 (prod)
│  ├─ api/          # SvelteKit server-only API — localhost:3000
│  ├─ admin/        # Workspace admin UI — localhost:5175
│  └─ landing/      # Marketing site — localhost:5177
├─ packages/
│  ├─ core/         # Zod schemas + domain types — shared by all apps
│  ├─ ui/           # Svelte component library
│  ├─ sdk/          # TypeScript client, auto-generated from OpenAPI
│  └─ templates/    # Starter content-type packs (Personal CRM, Habit Tracker, Reading Log)
├─ docs/            # Full documentation
├─ docker-compose.yml
└─ helm/lifeos/     # Kubernetes Helm chart
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [docs/quickstart.md](docs/quickstart.md) | Get running in 10 minutes — Docker, Node, or Kubernetes |
| [docs/self-host.md](docs/self-host.md) | Production deployment checklist: TLS, backups, secrets, hardening |
| [docs/scaling.md](docs/scaling.md) | Scale beyond one node — Redis pub/sub, read replicas, webhook queues |
| [docs/api.md](docs/api.md) | REST API reference — collections, auth, admin endpoints, SDK |
| [docs/webhooks.md](docs/webhooks.md) | Webhook registration, signature verification, retry semantics, recipes |
| [docs/privacy-policy.md](docs/privacy-policy.md) | Privacy Policy |
| [docs/terms-of-service.md](docs/terms-of-service.md) | Terms of Service |

---

## Pricing (tentative)

| Tier | THB / month | USD / month | Limits |
|------|------------:|------------:|--------|
| Free | 0 | $0 | 1 workspace · 1 user · 1 000 entries · community support |
| Personal Pro | 199 | $5.99 | Unlimited entries · 5 GB · public API |
| Studio | 999 | $29 | 10 users · 50 GB · SSO · audit log · email SLA |
| Self-host | AGPL-3.0 | — | Unlimited; paid customization & support |

---

## Local Development

```bash
deno task setup-dev   # sets up environment, database, and starts dev servers
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to submit issues, feature requests, and pull requests.

## Security

To report a security vulnerability, please follow our [SECURITY.md](SECURITY.md) responsible-disclosure process.

## License

LifeOS is licensed under the **GNU Affero General Public License v3.0**. See [LICENSE](LICENSE) for the full text.