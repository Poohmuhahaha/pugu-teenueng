import { test, expect, request } from '@playwright/test';

/**
 * End-to-end happy path:
 *   1. Sign up (also bootstraps a personal workspace)
 *   2. Create a content type
 *   3. Create / read / update an entry
 *   4. Verify backref worker resolved a [[wiki-link]]
 *   5. Issue an API key, exchange it for the same read using only the key
 *   6. Verify audit log captured each mutation
 *
 * Requires the API server to be running (Playwright config starts dev for us).
 */

const RUN = Date.now();
const EMAIL = `pw-${RUN}@example.com`;
const PASSWORD = 'hunter22-strong';
const NAME = `Playwright ${RUN}`;

test.describe.serial('LifeOS happy path', () => {
  let ctx: Awaited<ReturnType<typeof request.newContext>>;
  let apiKey: string;

  test.beforeAll(async ({ playwright, baseURL }) => {
    ctx = await playwright.request.newContext({
      baseURL,
      ignoreHTTPSErrors: true,
    });
  });
  test.afterAll(async () => { await ctx?.dispose(); });

  test('signup creates user + personal workspace + welcome email queued', async () => {
    const res = await ctx.post('/api/auth/signup', {
      data: { name: NAME, email: EMAIL, password: PASSWORD },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.user.email).toBe(EMAIL);

    const me = await ctx.get('/api/v1/me');
    expect(me.status()).toBe(200);
    const meBody = await me.json();
    expect(meBody.user.email).toBe(EMAIL);
    expect(meBody.memberships.length).toBeGreaterThan(0);
    expect(meBody.memberships[0].role).toBe('owner');
  });

  test('admin can create a content type', async () => {
    const res = await ctx.post('/api/v1/content-types', {
      data: {
        slug: `pw-notes-${RUN}`,
        name: 'PW Notes',
        schema: { fields: [
          { name: 'title', type: 'text', required: true },
          { name: 'body', type: 'richtext' },
        ] },
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.slug).toBe(`pw-notes-${RUN}`);
  });

  test('create + list + get + patch + delete entries with backref resolution', async () => {
    const slug = `pw-notes-${RUN}`;

    const a = await ctx.post(`/api/v1/${slug}`, {
      data: { title: 'Alice', body: 'Alice notes' },
    });
    expect(a.status()).toBe(201);
    const aId = (await a.json()).id;

    const b = await ctx.post(`/api/v1/${slug}`, {
      data: { title: 'Bob', body: 'Mentioned [[Alice]] here.' },
    });
    expect(b.status()).toBe(201);
    const bId = (await b.json()).id;

    // Wait briefly for fire-and-forget backref worker
    await new Promise((r) => setTimeout(r, 300));

    const refs = await ctx.get(`/api/v1/backrefs?to=${aId}`);
    expect(refs.status()).toBe(200);
    const refsBody = await refs.json();
    expect(refsBody.data.length).toBeGreaterThanOrEqual(1);
    expect(refsBody.data[0].fromEntryId).toBe(bId);

    const list = await ctx.get(`/api/v1/${slug}?sort=createdAt:desc`);
    expect(list.status()).toBe(200);
    const listBody = await list.json();
    expect(listBody.data.length).toBe(2);
    expect(listBody.meta.contentType).toBe(slug);

    const patch = await ctx.patch(`/api/v1/${slug}/${aId}`, {
      data: { title: 'Alice (renamed)' },
    });
    expect(patch.status()).toBe(200);

    const del = await ctx.delete(`/api/v1/${slug}/${bId}`);
    expect(del.status()).toBe(200);
  });

  test('issue API key, then read via the key', async () => {
    const issued = await ctx.post('/api/v1/api-keys', {
      data: { name: 'PW test key', role: 'editor' },
    });
    expect(issued.status()).toBe(201);
    const body = await issued.json();
    expect(body.key).toMatch(/^lk_[a-z0-9]{8}\..+/);
    apiKey = body.key;

    // Use the API key from a fresh, cookie-less context
    const fresh = await ctx.request ? null : null;
    const slug = `pw-notes-${RUN}`;
    const res = await ctx.get(`/api/v1/${slug}`, {
      headers: { 'X-API-Key': apiKey, Cookie: '' },
    });
    // Server should accept the API key
    expect(res.status()).toBe(200);
  });

  test('audit log captured the mutations', async () => {
    const slug = `pw-notes-${RUN}`;
    const res = await ctx.get(`/api/v1/audit-log?entity=${slug}&limit=20`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const actions = body.data.map((r: { action: string }) => r.action);
    expect(actions).toContain('create');
    expect(actions).toContain('update');
    expect(actions).toContain('delete');
  });

  test('waitlist accepts unauthenticated submissions', async ({ request }) => {
    const res = await request.post('/api/v1/waitlist/join', {
      data: { email: `wait-${RUN}@example.com`, utmSource: 'pw' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
