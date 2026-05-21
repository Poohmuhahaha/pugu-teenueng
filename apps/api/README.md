# @lifeos/api

SvelteKit server-only app — implements the LifeOS public REST API.

## Endpoints

### Public CMS (Strapi-style)
- `GET /api/v1/:collection` — list entries (filters, sort, pagination, fields, populate)
- `POST /api/v1/:collection` — create entry (editor+)
- `GET /api/v1/:collection/:id`
- `PATCH /api/v1/:collection/:id` — shallow merge into `data` JSON (editor+)
- `DELETE /api/v1/:collection/:id` — soft delete (admin+)

### Admin
- `GET /POST /api/v1/content-types` — define your own collections
- `GET /POST /api/v1/api-keys` — issue + list API keys (secret returned once)
- `GET /POST /api/v1/webhooks` — outbound webhooks for entry events

### Misc
- `GET /api/v1/docs` — OpenAPI 3.1 skeleton (JSON)
- `GET /api/health`

## Auth

Pick one per request:
- `Authorization: Bearer <jwt>` — user session
- `X-API-Key: lk_xxx.secret` — workspace-scoped API key

All endpoints are workspace-scoped via the resolved actor.

## Roles

`owner` > `admin` > `editor` > `member` > `viewer`. Each endpoint enforces the minimum role required.

## Filter syntax

```
?filters[status][$eq]=done
?filters[priority][$in]=high&filters[priority][$in]=med
?filters[dueDate][$gte]=2026-05-01
?filters[notes][$contains]=urgent
?filters[archived][$null]=true
```

## Webhook payload

```json
{
  "event": "afterCreate",
  "entity": "personal-crm",
  "id": 42,
  "data": { "name": "Alice", "email": "a@x.com" },
  "workspaceId": 7,
  "timestamp": "2026-05-20T10:30:00.000Z"
}
```

Signed via `X-LifeOS-Signature: sha256=<hmac>`. Verify with the secret returned when the webhook was created.
