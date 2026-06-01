import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, ACTIVE_WS_COOKIE, COOKIE_OPTIONS } from '$lib/server/auth';

/**
 * POST /api/v1/workspaces/:id/switch
 *
 * Sets the active workspace for the current user. Verifies that the user is
 * actually a member of the target workspace. The active workspace ID is
 * persisted in a separate cookie so it survives JWT rotation.
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys are scoped to a single workspace');

  const workspaceId = parseInt(event.params.id ?? '', 10);
  if (!Number.isFinite(workspaceId)) throw error(400, 'Invalid workspace id');

  const membership = await db.workspaceMember.findFirst({
    where: { userId: actor.userId, workspaceId },
    include: { workspace: { select: { id: true, slug: true, name: true } } },
  });
  if (!membership) throw error(403, 'You are not a member of that workspace');

  event.cookies.set(ACTIVE_WS_COOKIE, String(workspaceId), COOKIE_OPTIONS);

  return json({
    ok: true,
    workspaceId: membership.workspaceId,
    role: membership.role,
    workspace: membership.workspace,
  });
}
