# QuestPage — Quickstart

Get a working QuestPage instance in 10 minutes — locally or on a server.

## Option A — Docker (recommended)

You need Docker + Docker Compose. That's it.

```bash
git clone https://github.com/Poohmuhahaha/questpage.git
cd questpage
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
docker compose exec server bunx prisma migrate deploy --schema=prisma/schema.prisma
docker compose exec server bun run db:seed   # creates pooh@questpage.dev / changeme123
```

Open http://localhost:3001 and sign in.

## Option B — Deno directly (for development)

You need Deno 2 + a Postgres instance.

```bash
git clone https://github.com/Poohmuhahaha/questpage.git
cd questpage
bun run setup-dev   # sets up environment, database, and runs all dev servers in parallel
```

| App | Port | URL |
|---|---|---|
| api     | 3000 | http://localhost:3000 |
| admin   | 5175 | http://localhost:5175 |
| web     | 5176 | http://localhost:5176 |
| landing | 5177 | http://localhost:5177 |

## Option C — Kubernetes (production)

```bash
helm install questpage ./helm/questpage \
  --set secrets.jwtSecret=$(openssl rand -hex 32) \
  --set secrets.csrfSecret=$(openssl rand -hex 32) \
  --set secrets.postgresPassword=$(openssl rand -hex 16)
```

See `helm/questpage/values.yaml` for all knobs.

## Next steps

1. **Define your first quest type** — go to the admin console (`http://localhost:5175`) and click "+ New Type"
2. **Issue a Workspace Seal** — admin → Workspace Seals → "+ New Seal" with role=`editor`
3. **Hit the API**:
   ```bash
   curl -H "X-API-Key: qs_xxx.your-secret" http://localhost:3000/api/v1/tavern-quests
   ```
4. **Register a Messenger Bird** — admin → Messenger Birds → Slack incoming messenger bird URL → events `afterCreate,afterUpdate`

See `docs/api.md` for the full API reference and `docs/scaling.md` for scaling guidance.
