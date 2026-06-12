import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

const Patch = z.object({
  url: z.string().url().optional(),
  events: z.array(z.enum(['afterCreate', 'afterUpdate', 'afterDelete', 'beforeDelete', 'prospect.approved'])).optional(),
  contentTypeSlug: z.string().nullable().optional(),
  disabled: z.boolean().optional(),
});

async function loadAndAuthorize(event, requiredRole: 'editor' | 'admin' = 'admin') {
  const actor = await resolveActor(event);
  requireRole(actor.role, requiredRole);
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');
  const hook = await db.webhook.findFirst({ where: { id, workspaceId: actor.workspaceId } });
  if (!hook) throw error(404, 'Webhook not found in this workspace');
  return { actor, id, hook };
}

export async function PATCH(event) {
  const { id } = await loadAndAuthorize(event);
  const body = Patch.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  const data: Record<string, unknown> = {};
  if (body.data.url !== undefined) data.url = body.data.url;
  if (body.data.events !== undefined) data.events = body.data.events;
  if (body.data.contentTypeSlug !== undefined) data.contentTypeSlug = body.data.contentTypeSlug;
  if (body.data.disabled !== undefined) data.disabledAt = body.data.disabled ? new Date() : null;

  const updated = await db.webhook.update({ where: { id }, data });
  return json({
    id: updated.id, url: updated.url, events: updated.events,
    contentTypeSlug: updated.contentTypeSlug, disabledAt: updated.disabledAt,
  });
}

export async function DELETE(event) {
  const { id } = await loadAndAuthorize(event, 'admin');
  await db.webhook.delete({ where: { id } });
  return json({ ok: true });
}
