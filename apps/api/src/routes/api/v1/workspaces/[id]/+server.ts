import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { publish } from '$lib/server/sync';

const Patch = z.object({
  name: z.string().min(1).max(60).optional(),
});

async function loadAndAuthorize(event, requiredRole: 'admin' | 'owner') {
  const actor = await resolveActor(event);
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');
  if (actor.workspaceId !== id) throw error(403, 'Not active in this workspace');
  requireRole(actor.role, requiredRole);
  return { actor, id };
}

export async function PATCH(event) {
  const { actor, id } = await loadAndAuthorize(event, 'admin');
  const body = Patch.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);
  await db.workspace.update({ where: { id }, data: body.data });
  publish({ type: 'workspace.updated', workspaceId: id });
  return json({ ok: true });
}

export async function DELETE(event) {
  const { actor, id } = await loadAndAuthorize(event, 'owner');
  // Refuse if there are other members
  const memberCount = await db.workspaceMember.count({ where: { workspaceId: id } });
  if (memberCount > 1) {
    throw error(409, 'Remove all other members before deleting the workspace');
  }
  await db.workspace.delete({ where: { id } });
  return json({ ok: true });
}
