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

  // Filtering on JSONB: parseQuery emits Prisma-compatible JSON-path clauses
  // under q.where.AND. Spread them into the base where so they actually apply.
  const where: Record<string, unknown> = { contentTypeId: contentType.id, deletedAt: null, ...q.where };
  const orderBy = q.orderBy
    .map((o) => ({ [o.field]: o.dir }))
    .filter((o) =>
      // Only sort on real ContentEntry columns. Sort keys that target JSON
      // fields under `data` are silently dropped — Prisma can't push them down
      // and we no longer support in-memory sorting for paged queries.
      ['createdAt', 'updatedAt', 'id'].includes(Object.keys(o)[0])
    );

  // Page at the database layer so we don't load the entire collection into memory.
  const [total, slice] = await Promise.all([
    db.contentEntry.count({ where }),
    db.contentEntry.findMany({
      where,
      orderBy,
      take: q.pageSize,
      skip: (q.page - 1) * q.pageSize,
    }),
  ]);

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
