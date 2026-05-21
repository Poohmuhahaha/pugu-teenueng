import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { publish } from '$lib/server/sync';
import { writeAudit } from '$lib/server/audit';

const Patch = z.object({
  name: z.string().min(1).max(120).optional(),
  schema: z.object({ fields: z.array(z.unknown()) }).optional(),
});

async function loadAndAuthorize(event, requiredRole: 'editor' | 'admin' = 'admin') {
  const actor = await resolveActor(event);
  requireRole(actor.role, requiredRole);
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');
  const ct = await db.contentType.findFirst({
    where: { id, workspaceId: actor.workspaceId, deletedAt: null },
  });
  if (!ct) throw error(404, 'Content type not found in this workspace');
  return { actor, id, ct };
}

export async function GET(event) {
  const { ct } = await loadAndAuthorize(event, 'editor');
  return json(ct);
}

export async function PATCH(event) {
  const { actor, id, ct } = await loadAndAuthorize(event);
  const body = Patch.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  const updated = await db.contentType.update({
    where: { id },
    data: { ...(body.data.name ? { name: body.data.name } : {}), ...(body.data.schema ? { schema: body.data.schema } : {}) },
  });
  publish({ type: 'contentType.changed', workspaceId: actor.workspaceId, slug: ct.slug });
  writeAudit({ event, workspaceId: actor.workspaceId, userId: actor.userId, action: 'update', entity: 'contentType', entityId: id });
  return json(updated);
}

/**
 * DELETE — soft delete. Entries remain in DB (also soft-deleted via cascade query).
 */
export async function DELETE(event) {
  const { actor, id, ct } = await loadAndAuthorize(event);

  // Soft-delete entries first (so subsequent reads return 0)
  await db.$transaction([
    db.contentEntry.updateMany({
      where: { contentTypeId: id, deletedAt: null },
      data: { deletedAt: new Date() },
    }),
    db.contentType.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ]);
  publish({ type: 'contentType.changed', workspaceId: actor.workspaceId, slug: ct.slug });
  writeAudit({ event, workspaceId: actor.workspaceId, userId: actor.userId, action: 'delete', entity: 'contentType', entityId: id });
  return json({ ok: true });
}
