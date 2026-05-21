import { db } from './db';

/**
 * Ensures that a user has a personal workspace created for them,
 * and makes them the owner of that workspace. Also boots a default
 * free tier subscription for the workspace.
 */
export async function ensurePersonalWorkspace(userId: number, userName: string): Promise<void> {
  const slug = `${userName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${userId}`;

  // Find if user already has an owned workspace or if this workspace exists
  const existing = await db.workspaceMember.findFirst({
    where: { userId, role: 'owner' },
  });

  if (existing) {
    return;
  }

  // Create workspace and owner membership
  const ws = await db.workspace.upsert({
    where: { slug },
    update: {},
    create: {
      name: `${userName}'s Workspace`,
      slug,
      members: {
        create: {
          userId,
          role: 'owner',
        },
      },
    },
  });

  // Create a default free subscription
  await db.subscription.upsert({
    where: { workspaceId: ws.id },
    update: {},
    create: {
      workspaceId: ws.id,
      plan: 'free',
      status: 'active',
    },
  });
}
