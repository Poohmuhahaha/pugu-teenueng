import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, COOKIE_NAME } from '$lib/server/auth';

/** GET /api/v1/me — current user + memberships */
export async function GET(event) {
  const actor = await resolveActor(event);
  const [user, memberships] = await Promise.all([
    db.user.findUnique({
      where: { id: actor.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.workspaceMember.findMany({
      where: { userId: actor.userId },
      include: { workspace: { select: { id: true, name: true, slug: true } } },
      orderBy: { createdAt: 'asc' },
    }),
  ]);
  return json({
    user,
    memberships: memberships.map((m) => ({
      workspaceId: m.workspaceId,
      role: m.role,
      workspace: m.workspace,
    })),
    actor: { kind: actor.kind, workspaceId: actor.workspaceId, role: actor.role },
  });
}

const DeleteInput = z.object({ confirm: z.literal('DELETE MY ACCOUNT') });

/**
 * DELETE /api/v1/me — PDPA / GDPR right to erasure.
 * Hard-deletes the user; cascade FKs remove memberships + activity.
 * Workspaces the user solely owned (single owner = this user) are also deleted.
 * Caller must send { "confirm": "DELETE MY ACCOUNT" } as JSON body.
 */
export async function DELETE(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'Only user sessions can delete the account');

  const body = DeleteInput.safeParse(await event.request.json().catch(() => ({})));
  if (!body.success) throw error(400, 'Confirmation phrase required');

  // For each workspace where this user is the only owner → delete the workspace too
  const owned = await db.workspaceMember.findMany({
    where: { userId: actor.userId, role: 'owner' },
    select: { workspaceId: true },
  });
  for (const o of owned) {
    const otherOwners = await db.workspaceMember.count({
      where: { workspaceId: o.workspaceId, role: 'owner', NOT: { userId: actor.userId } },
    });
    if (otherOwners === 0) {
      await db.workspace.delete({ where: { id: o.workspaceId } });
    }
  }
  await db.user.delete({ where: { id: actor.userId } });
  event.cookies.delete(COOKIE_NAME, { path: '/' });

  return json({ ok: true, deletedAt: new Date().toISOString() });
}
