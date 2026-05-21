# LifeOS — REST API reference

Base URL: `https://your-instance.com/api/v1`
OpenAPI 3.1 spec: `GET /api/v1/docs`

## Authentication

Two equivalent ways — send either on every request:

```http
Authorization: Bearer <jwt-from-/api/auth/login>
X-API-Key: lk_xxx.your-secret
```

API keys are workspace-scoped. JWT sessions resolve the workspace via the `wgpu_workspace` / first-membership cookie.

## Content entries (Strapi-style)

### List `GET /api/v1/:collection`

```
GET /api/v1/personal-crm?
  filters[status][$eq]=active&
  filters[lastContacted][$lt]=2026-05-01&
  sort=updatedAt:desc&
  pagination[page]=1&
  pagination[pageSize]=50&
  fields=name,email
```

Filter operators: `$eq`, `$ne`, `$contains`, `$gt`, `$gte`, `$lt`, `$lte`, `$in` (repeat param), `$null`.

Response:
```json
{ "data": [{ "id": 1, "name": "Alice", ... }], "meta": { "page": 1, "pageSize": 50, "total": 12, "contentType": "personal-crm" } }
```

### Create `POST /api/v1/:collection`

Body is your raw entry data — schema validation happens against `ContentType.schema`.

### Read `GET /api/v1/:collection/:id`
### Patch `PATCH /api/v1/:collection/:id`
Shallow merge into the `data` JSON.

### Delete `DELETE /api/v1/:collection/:id`
Soft delete — sets `deletedAt`. Use `DELETE /api/v1/me` to actually wipe yourself.

## Admin

| Endpoint | Method | Requires |
|---|---|---|
| `/content-types` | GET / POST | viewer / admin |
| `/content-types/:id/permissions` | GET / PUT | viewer / admin |
| `/api-keys` | GET / POST | admin |
| `/api-keys/:id` | DELETE | admin (revoke) |
| `/webhooks` | GET / POST | admin |
| `/webhooks/:id` | PATCH / DELETE | admin |
| `/webhooks/:id/failures` | GET | viewer |
| `/backrefs?to=&from=&target=` | GET | viewer |
| `/backrefs/rebuild` | POST | admin |
| `/billing` | GET | viewer |
| `/billing/checkout` | POST | admin |
| `/billing/portal` | POST | admin |
| `/me` | GET / DELETE | actor |
| `/me/export` | GET | actor |

## Webhooks

Register one for entry events:

```json
POST /api/v1/webhooks
{
  "url": "https://hooks.zapier.com/...",
  "contentTypeSlug": "personal-crm",
  "events": ["afterCreate", "afterUpdate"]
}
```

Response includes a one-time `secret`. Verify deliveries:

```
X-LifeOS-Signature: sha256=<hex>
```

`hmac_sha256(rawBody, secret) === provided hex`.

Failures are retried with exponential backoff (1m, 5m, 15m, 1h, 6h) and the hook is auto-disabled after 5 attempts. View failures at `GET /api/v1/webhooks/:id/failures`.

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
| 404 | Resource not in this workspace |
| 409 | Conflict (duplicate slug, last owner removal, etc.) |
| 429 | Rate limited |

## SDK

```ts
import { LifeOSClient } from '@lifeos/sdk';
const client = new LifeOSClient({ baseUrl: '...', apiKey: process.env.LIFEOS_API_KEY });

const { data } = await client.list('personal-crm', {
  filters: { status: { $eq: 'active' } },
  sort: 'updatedAt:desc',
});
```
