import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { parseQuery, projectFields } from '$lib/server/query';
import { fireWebhooks } from '$lib/server/webhook';
import { rebuildBackrefs } from '$lib/server/backref';
import { enforceEntryCap } from '$lib/server/limits';
import { ContentEntryCreate } from '@questpage/core';

/**
 * GET /api/v1/:collection
 * List entries of a content type (workspace-scoped via actor).
 */
export async function GET(event) {
  try {
    const actor = await resolveActor(event);
    const slug = event.params.collection;

    const contentType = await db.contentType.findFirst({
      where: { workspaceId: actor.workspaceId, slug, deletedAt: null },
    });
    if (!contentType) throw error(404, `Collection "${slug}" not found`);

    const q = parseQuery(event.url);

    const where: Record<string, unknown> = { contentTypeId: contentType.id, deletedAt: null, ...q.where };
    const orderBy = q.orderBy
      .map((o) => ({ [o.field]: o.dir }))
      .filter((o) =>
        ['createdAt', 'updatedAt', 'id'].includes(Object.keys(o)[0])
      );

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
  } catch (err: any) {
    if (err.status) throw err; // rethrow sveltekit errors
    console.error("API GET ERROR:", err);
    require('fs').writeFileSync('D:/PROJECTS/website/QuestPage/error.log', err.stack || err.message || String(err));
    return json({ error: err.message, stack: err.stack }, { status: 500 });
  }
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
