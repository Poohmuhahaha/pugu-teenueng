import { db } from './db';
import { error } from '@sveltejs/kit';
import type { Role } from '@lifeos/core';

export type Action = 'read' | 'create' | 'update' | 'delete';

const ROLE_RANK: Record<Role, number> = { viewer: 0, member: 1, editor: 2, admin: 3, owner: 4 };

// Default action requirements (workspace role rank required when no override exists)
const DEFAULT_RANK_REQUIRED: Record<Action, Role> = {
  read: 'viewer',
  create: 'editor',
  update: 'editor',
  delete: 'admin',
};

/**
 * Enforce permission for an action on a specific content type.
 * 1) If a ContentTypePermission row exists for { contentTypeId, role: actor.role }
 *    OR any role rank <= actor.role with the action in its `actions[]`, allow.
 * 2) Otherwise fall back to the workspace role rank baseline.
 */
export async function requireContentTypeAction(
  contentTypeId: number,
  actorRole: Role,
  action: Action
): Promise<void> {
  const perms = await db.contentTypePermission.findMany({
    where: { contentTypeId },
  });

  if (perms.length === 0) {
    // No overrides — use default rank
    const required = DEFAULT_RANK_REQUIRED[action];
    if (ROLE_RANK[actorRole] < ROLE_RANK[required]) {
      throw error(403, `Requires ${required} or higher for ${action}`);
    }
    return;
  }

  // Overrides exist. Allow if any row with role rank <= actor's role grants the action.
  for (const p of perms) {
    if (ROLE_RANK[actorRole] >= ROLE_RANK[p.role as Role] && p.actions.includes(action)) {
      return;
    }
  }
  // Still fall back to default rank if explicit grants don't cover
  const required = DEFAULT_RANK_REQUIRED[action];
  if (ROLE_RANK[actorRole] < ROLE_RANK[required]) {
    throw error(403, `Requires ${required} or higher for ${action} (no permission override matches)`);
  }
}
