import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';
import { PLAN_LIMITS } from '$lib/server/billing';

/**
 * GET /api/v1/billing — current subscription + usage + plan limits
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  const [sub, entryCount, memberCount] = await Promise.all([
    db.subscription.findUnique({ where: { workspaceId: actor.workspaceId } }),
    db.contentEntry.count({ where: { workspaceId: actor.workspaceId, deletedAt: null } }),
    db.workspaceMember.count({ where: { workspaceId: actor.workspaceId } }),
  ]);
  const plan = sub?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  return json({
    subscription: sub ?? { plan: 'free', status: 'active' },
    usage: { entries: entryCount, members: memberCount },
    limits,
  });
}
