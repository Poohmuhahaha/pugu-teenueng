import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

/**
 * GET /api/v1/search?q=foo
 * Workspace-scoped global search across every content type's `data` JSON.
 * Postgres ILIKE on jsonb::text — good enough for a small workspace; swap for
 * tsvector + GIN index when search becomes a bottleneck.
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  const q = (event.url.searchParams.get('q') ?? '').trim();
  if (!q) return json({ data: [], meta: { q, total: 0 } });
  if (q.length < 2) throw error(400, 'Query must be at least 2 characters');

  const limit = Math.min(100, Math.max(1, parseInt(event.url.searchParams.get('limit') ?? '30')));

  // Use Prisma's raw query for jsonb cast + ILIKE
  const pattern = `%${q.replace(/[%_]/g, (c) => `\\${c}`)}%`;
  const rows = await db.$queryRawUnsafe<Array<{
    id: number;
    workspaceId: number;
    contentTypeId: number;
    data: unknown;
    createdAt: Date;
    updatedAt: Date;
    slug: string;
    name: string;
  }>>(
    `SELECT e.id, e."workspaceId", e."contentTypeId", e.data, e."createdAt", e."updatedAt",
            ct.slug, ct.name
     FROM "ContentEntry" e
     JOIN "ContentType" ct ON ct.id = e."contentTypeId"
     WHERE e."workspaceId" = $1
       AND e."deletedAt" IS NULL
       AND ct."deletedAt" IS NULL
       AND e.data::text ILIKE $2
     ORDER BY e."updatedAt" DESC
     LIMIT $3`,
    actor.workspaceId,
    pattern,
    limit,
  );

  return json({
    data: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      typeName: r.name,
      data: r.data,
      updatedAt: r.updatedAt,
    })),
    meta: { q, total: rows.length },
  });
}
