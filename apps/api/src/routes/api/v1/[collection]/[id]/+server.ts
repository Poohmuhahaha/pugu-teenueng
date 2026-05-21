import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';
import { projectFields } from '$lib/server/query';
import { fireWebhooks } from '$lib/server/webhook';
import { rebuildBackrefs } from '$lib/server/backref';
import { requireContentTypeAction } from '$lib/server/permissions';
import { publish } from '$lib/server/sync';
import { writeAudit } from '$lib/server/audit';
import { ContentEntryPatch } from '@lifeos/core';

async function loadEntry(event) {
  const actor = await resolveActor(event);
  const slug = event.params.collection;
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const contentType = await db.contentType.findFirst({
    where: { workspaceId: actor.workspaceId, slug, deletedAt: null },
  });
  if (!contentType) throw error(404, 'Collection not found');

  const entry = await db.contentEntry.findFirst({
    where: { id, contentTypeId: contentType.id, deletedAt: null },
  });
  if (!entry) throw error(404, 'Entry not found');
  return { actor, slug, id, contentType, entry };
}

export async function GET(event) {
  const { actor, contentType, entry } = await loadEntry(event);
  await requireContentTypeAction(contentType.id, actor.role, 'read');
  return json(projectFields(entry, null));
}

export async function PATCH(event) {
  const { actor, slug, id, entry, contentType } = await loadEntry(event);
  await requireContentTypeAction(contentType.id, actor.role, 'update');

  const parsed = ContentEntryPatch.safeParse({ data: await event.request.json() });
  if (!parsed.success) throw error(400, parsed.error.message);

  // Merge patch into existing data (shallow)
  const newData = { ...(entry.data as Record<string, unknown>), ...parsed.data.data };
  const updated = await db.contentEntry.update({
    where: { id },
    data: { data: newData },
  });

  rebuildBackrefs(updated.id).catch(() => {});
  publish({ type: 'entry.updated', workspaceId: actor.workspaceId, contentTypeSlug: slug, entryId: id });
  writeAudit({ event, workspaceId: actor.workspaceId, userId: actor.userId, action: 'update', entity: slug, entityId: id, diff: parsed.data.data });

  fireWebhooks({
    workspaceId: actor.workspaceId,
    contentTypeSlug: slug,
    event: 'afterUpdate',
    entityId: id,
    data: updated.data,
  }).catch(() => {});

  return json(projectFields(updated, null));
}

export async function DELETE(event) {
  const { actor, slug, id, entry, contentType } = await loadEntry(event);
  await requireContentTypeAction(contentType.id, actor.role, 'delete');

  await fireWebhooks({
    workspaceId: actor.workspaceId,
    contentTypeSlug: slug,
    event: 'beforeDelete',
    entityId: id,
    data: entry.data,
  });

  // Soft delete
  await db.contentEntry.update({ where: { id }, data: { deletedAt: new Date() } });
  publish({ type: 'entry.deleted', workspaceId: actor.workspaceId, contentTypeSlug: slug, entryId: id });
  writeAudit({ event, workspaceId: actor.workspaceId, userId: actor.userId, action: 'delete', entity: slug, entityId: id });

  fireWebhooks({
    workspaceId: actor.workspaceId,
    contentTypeSlug: slug,
    event: 'afterDelete',
    entityId: id,
    data: entry.data,
  }).catch(() => {});

  return json({ ok: true, id });
}
