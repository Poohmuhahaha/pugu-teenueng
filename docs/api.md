# QuestPage — Workspace API reference

Base URL: `https://your-instance.com/api/v1`
OpenAPI 3.1 spec: `GET /api/v1/docs`

## Authentication

Two equivalent ways — send either on every request:

```http
Authorization: Bearer <jwt-from-/api/auth/login>
X-API-Key: qs_xxx.your-secret
```

Workspace Seals are tavern-scoped. JWT sessions resolve the tavern via the `wgpu_workspace` / first-membership cookie.

## Quest entries (RPG logs)

### List `GET /api/v1/:questType`

```
GET /api/v1/tavern-quests?
  filters[status][$eq]=active&
  sort=updatedAt:desc&
  pagination[page]=1&
  pagination[pageSize]=50&
  fields=title,difficulty
```

Filter operators: `$eq`, `$ne`, `$contains`, `$gt`, `$gte`, `$lt`, `$lte`, `$in` (repeat param), `$null`.

Response:
```json
{ "data": [{ "id": 1, "title": "Launch Campaign", ... }], "meta": { "page": 1, "pageSize": 50, "total": 12, "contentType": "tavern-quests" } }
```

### Create `POST /api/v1/:questType`

Body is your raw entry data — schema validation happens against `ContentType.schema`.

### Read `GET /api/v1/:questType/:id`
### Patch `PATCH /api/v1/:questType/:id`
Shallow merge into the `data` JSON.

### Delete `DELETE /api/v1/:questType/:id`
Soft delete — sets `deletedAt`. Use `DELETE /api/v1/me` to actually wipe yourself.

## Admin

| Endpoint | Method | Requires |
|---|---|---|
| `/content-types` | GET / POST | viewer / admin |
| `/content-types/:id/permissions` | GET / PUT | viewer / admin |
| `/api-keys` | GET / POST | admin (Workspace Seals) |
| `/api-keys/:id` | DELETE | admin (revoke Workspace Seal) |
| `/messenger birds` | GET / POST | admin (Messenger Birds) |
| `/messenger birds/:id` | PATCH / DELETE | admin |
| `/messenger birds/:id/failures` | GET | viewer |
| `/backrefs?to=&from=&target=` | GET | viewer |
| `/backrefs/rebuild` | POST | admin |
| `/billing` | GET | viewer |
| `/billing/checkout` | POST | admin |
| `/billing/portal` | POST | admin |
| `/me` | GET / DELETE | actor |
| `/me/export` | GET | actor |

## Messenger Birds (Messenger Birds)

Register one for entry events:

```json
POST /api/v1/messenger birds
{
  "url": "https://hooks.zapier.com/...",
  "contentTypeSlug": "tavern-quests",
  "events": ["afterCreate", "afterUpdate"]
}
```

Response includes a one-time `secret`. Verify deliveries:

```
X-QuestPage-Signature: sha256=<hex>
```

`hmac_sha256(rawBody, secret) === provided hex`.

Failures are retried with exponential backoff (1m, 5m, 15m, 1h, 6h) and the messenger bird is auto-disabled after 5 attempts. View failures at `GET /api/v1/messenger birds/:id/failures`.

## Errors

```json
{ "error": { "code": "PLAN_LIMIT_EXCEEDED", "message": "Plan 'free' capped at 1000 entries. Upgrade to add more." } }
```

| Status | Meaning |
|---|---|
| 400 | Validation failed |
| 401 | Unauthenticated |
| 402 | Plan limit exceeded |
| 403 | Authenticated but lacks permission |
| 404 | Resource not in this tavern |
| 409 | Conflict (duplicate slug, last owner removal, etc.) |
| 429 | Rate limited |

## SDK

```ts
import { QuestPageClient } from '@questpage/sdk';
const client = new QuestPageClient({ baseUrl: '...', apiKey: process.env.QUESTPAGE_GUILD_SEAL });

const { data } = await client.list('tavern-quests', {
  filters: { status: { $eq: 'active' } },
  sort: 'updatedAt:desc',
});
```
