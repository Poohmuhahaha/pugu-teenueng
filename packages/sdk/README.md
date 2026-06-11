# @questpage/sdk

Typed TypeScript client for the QuestPage REST API.

## Install

```bash
npm install @questpage/sdk
```

## Usage

```ts
import { QuestPageClient } from '@questpage/sdk';

const client = new QuestPageClient({
  baseUrl: 'https://api.questpage.so',
  apiKey: process.env.LIFEOS_API_KEY,
});

// List entries with Strapi-style filters
const { data, meta } = await client.list('personal-crm', {
  filters: { status: { $eq: 'active' }, lastContacted: { $lt: '2026-05-01' } },
  sort: 'updatedAt:desc',
  pageSize: 20,
});

// Create a new entry
const created = await client.create('personal-crm', {
  name: 'Alice',
  email: 'alice@example.com',
  relationship: 'friend',
});

// Update
await client.update('personal-crm', created.id, { lastContacted: '2026-05-20' });

// Soft-delete
await client.remove('personal-crm', created.id);

// Discover content types
const { data: types } = await client.listContentTypes();
```

## Auth

Either:
- `apiKey: 'lk_xxx.secret'` for headless / server use
- `bearerToken: '<jwt>'` for an authenticated user session

The client picks whichever you provide; if both, both headers are sent.
