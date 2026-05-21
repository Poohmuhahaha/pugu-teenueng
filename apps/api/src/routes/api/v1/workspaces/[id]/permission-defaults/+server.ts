import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole, type Role } from '$lib/server/auth';

const PutInput = z.array(z.object({
  role: z.enum(['owner', 'admin', 'editor', 'member', 'viewer']),
  actions: z.array(z.enum(['read', 'create', 'update', 'delete'])),
}));

async function loadMyRole(workspaceId: number, userId: number): Promise<Role | null> {
  const m = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return m ? (m.role as Role) : null;
}

export async function GET(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  if (Number.isNaN(workspaceId)) throw error(400, 'Invalid id');
  if (actor.workspaceId !== workspaceId) throw error(403, 'Not active in this workspace');

  const rows = await db.workspacePermissionDefault.findMany({
    where: { workspaceId },
    orderBy: { role: 'asc' },
  });
  return json({ data: rows });
}

/**
 * PUT replaces the entire default-permission set for this workspace.
 * Only owners can change defaults (changes templates affecting future CTs).
 */
export async function PUT(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  if (Number.isNaN(workspaceId)) throw error(400, 'Invalid id');
  if (actor.workspaceId !== workspaceId) throw error(403, 'Not active in this workspace');

  const myRole = await loadMyRole(workspaceId, actor.userId);
  if (!myRole) throw error(403, 'Not a member');
  requireRole(myRole, 'owner');

  const body = PutInput.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await db.$transaction(async (tx) => {
    await tx.workspacePermissionDefault.deleteMany({ where: { workspaceId } });
    for (const row of body.data) {
      await tx.workspacePermissionDefault.create({
        data: { workspaceId, role: row.role, actions: row.actions },
      });
    }
  });
  return json({ ok: true, count: body.data.length });
}
