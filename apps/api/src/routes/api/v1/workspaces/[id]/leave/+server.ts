import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

/**
 * POST /api/v1/workspaces/[id]/leave
 * Caller removes their own membership. Refuses if they are the sole owner.
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys cannot leave workspaces');
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const me = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: id, userId: actor.userId } },
  });
  if (!me) throw error(404, 'Not a member');

  if (me.role === 'owner') {
    const otherOwners = await db.workspaceMember.count({
      where: { workspaceId: id, role: 'owner', NOT: { userId: actor.userId } },
    });
    if (otherOwners === 0) {
      throw error(409, 'You are the only owner. Transfer ownership or delete the workspace instead.');
    }
  }
  await db.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId: id, userId: actor.userId } },
  });
  return json({ ok: true });
}
