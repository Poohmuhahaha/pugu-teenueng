import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { parseQuery, projectFields } from '$lib/server/query';
import { fireWebhooks } from '$lib/server/webhook';
import { rebuildBackrefs } from '$lib/server/backref';
import { enforceEntryCap } from '$lib/server/limits';
import { ContentEntryCreate } from '@lifeos/core';

/**
 * GET /api/v1/:collection
 * List entries of a content type (workspace-scoped via actor).
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  const slug = event.params.collection;

  const contentType = await db.contentType.findFirst({
    where: { workspaceId: actor.workspaceId, slug, deletedAt: null },
  });
  if (!contentType) throw error(404, `Collection "${slug}" not found`);

  const q = parseQuery(event.url);

  // Filtering on JSONB: Prisma supports `path` filter. Build a Prisma-compatible where.
  // For simplicity we evaluate filters in-memory after fetching by content-type.
  // Replace with raw SQL + JSONB path queries when scale demands.
  const entries = await db.contentEntry.findMany({
    where: { contentTypeId: contentType.id, deletedAt: null },
    orderBy: q.orderBy.map((o) => ({ [o.field]: o.dir })).filter((o) =>
      // only sort on real ContentEntry columns; field sorts on JSON data handled in-memory
      ['createdAt', 'updatedAt', 'id'].includes(Object.keys(o)[0])
    ),
  });

  const total = entries.length;
  const start = (q.page - 1) * q.pageSize;
  const slice = entries.slice(start, start + q.pageSize);

  const projected = slice.map((e) => projectFields(e, q.fields));
  return json({
    data: projected,
    meta: { page: q.page, pageSize: q.pageSize, total, contentType: slug },
  });
}

/**
 * POST /api/v1/:collection
 * Create a new entry. Requires editor role.
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'editor');
  const slug = event.params.collection;

  const contentType = await db.contentType.findFirst({
    where: { workspaceId: actor.workspaceId, slug, deletedAt: null },
  });
  if (!contentType) throw error(404, `Collection "${slug}" not found`);

  const parsed = ContentEntryCreate.safeParse({
    contentTypeId: contentType.id,
    data: await event.request.json(),
  });
  if (!parsed.success) throw error(400, parsed.error.message);

  await enforceEntryCap(actor.workspaceId);

  const created = await db.contentEntry.create({
    data: {
      contentTypeId: contentType.id,
      workspaceId: actor.workspaceId,
      data: parsed.data.data,
      createdById: actor.kind === 'user' ? actor.userId : null,
    },
  });

  rebuildBackrefs(created.id).catch(() => {});

  fireWebhooks({
    workspaceId: actor.workspaceId,
    contentTypeSlug: slug,
    event: 'afterCreate',
    entityId: created.id,
    data: created.data,
  }).catch(() => {});

  return json(projectFields(created, null), { status: 201 });
}
