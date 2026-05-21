import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

const Body = z.union([
  z.object({ userId: z.number().int() }),
  z.object({ email: z.string().email() }),
]);

/**
 * POST /api/v1/workspaces/[id]/transfer
 * Promote target user to owner, demote caller to admin.
 * Accepts either { userId } or { email } — useful when admin doesn't know the id.
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys cannot transfer ownership');
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');
  if (actor.workspaceId !== id) throw error(403, 'Not active in this workspace');
  requireRole(actor.role, 'owner');

  const body = Body.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  let targetUserId: number;
  if ('userId' in body.data) {
    targetUserId = body.data.userId;
  } else {
    const user = await db.user.findUnique({ where: { email: body.data.email } });
    if (!user) throw error(404, `No user with email ${body.data.email}`);
    targetUserId = user.id;
  }

  const target = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: targetUserId } },
  });
  if (!target) throw error(404, 'Target user is not a member of this workspace');

  await db.$transaction([
    db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: id, userId: actor.userId } },
      data: { role: 'admin' },
    }),
    db.workspaceMember.update({
      where: { workspaceId_userId: { workspaceId: id, userId: targetUserId } },
      data: { role: 'owner' },
    }),
  ]);

  return json({ ok: true });
}
