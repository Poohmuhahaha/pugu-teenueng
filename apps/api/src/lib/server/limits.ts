import { db } from './db';
import { PLAN_LIMITS } from './billing';

/**
 * Throws if creating one more entry of any type would exceed the workspace's plan cap.
 * Free tier: 1000 entries. Paid tiers: unlimited.
 */
export async function enforceEntryCap(workspaceId: number): Promise<void> {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const plan = sub?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (limits.entries < 0) return; // unlimited

  const count = await db.contentEntry.count({ where: { workspaceId, deletedAt: null } });
  if (count >= limits.entries) {
    throw Object.assign(new Error(`Plan "${plan}" capped at ${limits.entries} entries. Upgrade to add more.`), {
      status: 402,
      code: 'PLAN_LIMIT_EXCEEDED',
    });
  }
}

export async function enforceMemberCap(workspaceId: number): Promise<void> {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  const plan = sub?.plan ?? 'free';
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  if (limits.workspaceMembers < 0) return;
  const count = await db.workspaceMember.count({ where: { workspaceId } });
  if (count >= limits.workspaceMembers) {
    throw Object.assign(new Error(`Plan "${plan}" capped at ${limits.workspaceMembers} members. Upgrade to invite more.`), {
      status: 402,
      code: 'PLAN_LIMIT_EXCEEDED',
    });
  }
}
