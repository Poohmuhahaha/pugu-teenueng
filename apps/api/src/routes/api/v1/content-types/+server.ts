import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { ContentTypeCreate } from '@questpage/core';

export async function GET(event) {
  const actor = await resolveActor(event);
  const types = await db.contentType.findMany({
    where: { workspaceId: actor.workspaceId, deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  return json({ data: types });
}

export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const parsed = ContentTypeCreate.safeParse(await event.request.json());
  if (!parsed.success) throw error(400, parsed.error.message);

  const existing = await db.contentType.findFirst({
    where: { workspaceId: actor.workspaceId, slug: parsed.data.slug },
  });
  if (existing) throw error(409, 'Slug already in use within this workspace');

  // Look up workspace permission defaults; if any exist, apply them in the same transaction
  const defaults = await db.workspacePermissionDefault.findMany({
    where: { workspaceId: actor.workspaceId },
  });

  const created = await db.$transaction(async (tx) => {
    const ct = await tx.contentType.create({
      data: {
        workspaceId: actor.workspaceId,
        slug: parsed.data.slug,
        name: parsed.data.name,
        schema: parsed.data.schema,
      },
    });
    if (defaults.length > 0) {
      await tx.contentTypePermission.createMany({
        data: defaults.map((d) => ({
          contentTypeId: ct.id,
          role: d.role,
          actions: d.actions,
        })),
      });
    }
    return ct;
  });

  return json(created, { status: 201 });
}
