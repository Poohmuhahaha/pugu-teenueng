import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

const PatchInput = z.array(
  z.object({
    role: z.enum(['owner', 'admin', 'editor', 'member', 'viewer']),
    actions: z.array(z.enum(['read', 'create', 'update', 'delete'])),
  })
);

async function loadContentType(event) {
  const actor = await resolveActor(event);
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');
  const ct = await db.contentType.findFirst({
    where: { id, workspaceId: actor.workspaceId, deletedAt: null },
  });
  if (!ct) throw error(404, 'Content type not found in this workspace');
  return { actor, id, ct };
}

export async function GET(event) {
  const { id } = await loadContentType(event);
  const perms = await db.contentTypePermission.findMany({
    where: { contentTypeId: id },
    orderBy: { role: 'asc' },
  });
  return json({ data: perms });
}

/**
 * PUT /api/v1/content-types/[id]/permissions
 * Replace all permission rows for this content type. Admin+ required.
 * Body: [ { role, actions }, ... ]
 */
export async function PUT(event) {
  const { actor, id } = await loadContentType(event);
  requireRole(actor.role, 'admin');

  const body = PatchInput.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await db.$transaction(async (tx) => {
    await tx.contentTypePermission.deleteMany({ where: { contentTypeId: id } });
    for (const row of body.data) {
      await tx.contentTypePermission.create({
        data: { contentTypeId: id, role: row.role, actions: row.actions },
      });
    }
  });
  return json({ ok: true, count: body.data.length });
}
