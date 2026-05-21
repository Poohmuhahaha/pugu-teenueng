# LifeOS — Quickstart

Get a working LifeOS instance in 10 minutes — locally or on a server.

## Option A — Docker (recommended)

You need Docker + Docker Compose. That's it.

```bash
git clone https://github.com/Poohmuhahaha/lifeos.git
cd lifeos
cp .env.example .env
# edit .env: set POSTGRES_PASSWORD, JWT_SECRET, CSRF_SECRET (32+ chars each)
docker compose up -d
```

You'll get:

| Service | URL | Purpose |
|--------|------|---------|
| `web` | http://localhost:3001 | User-facing app |
| `api` | http://localhost:3000 | REST API + OpenAPI at `/api/v1/docs` |
| `db`  | localhost:5432 | PostgreSQL 16 |

Then bootstrap the database and seed:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed   # creates pooh@lifeos.dev / changeme123
```

Open http://localhost:3001 and sign in.

## Option B — Node directly (for development)

You need Node 20 + pnpm 9 + a Postgres instance.

```bash
git clone https://github.com/Poohmuhahaha/lifeos.git
cd lifeos
pnpm install
cp .env.example .env  # set DATABASE_URL + secrets
pnpm --filter @lifeos/api exec prisma migrate dev --name init
pnpm --filter @lifeos/api db:seed
pnpm dev   # all 4 apps in parallel
```

| App | Port | URL |
|---|---|---|
| api     | 3000 | http://localhost:3000 |
| admin   | 5175 | http://localhost:5175 |
| web     | 5176 | http://localhost:5176 |
| landing | 5177 | http://localhost:5177 |

## Option C — Kubernetes (production)

```bash
helm install lifeos ./helm/lifeos \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.csrfSecret=$(openssl rand -hex 32) \
  --set secrets.postgresPassword=$(openssl rand -hex 16)
```

See `helm/lifeos/values.yaml` for all knobs.

## Next steps

1. **Define your first collection** — go to admin (`http://localhost:5175`) and click "+ New Type"
2. **Issue an API key** — admin → API Keys → "+ New Key" with role=`editor`
3. **Hit the API**:
   ```bash
   curl -H "X-API-Key: lk_xxx.your-secret" http://localhost:3000/api/v1/personal-crm
   ```
4. **Register a webhook** — admin → Webhooks → Slack incoming webhook URL → events `afterCreate,afterUpdate`

See `docs/api.md` for the full API reference, `docs/self-host.md` for production deployment guidance.
