import { db } from './db';
import { randomBytes } from 'node:crypto';

/**
 * Ensures that a user has a personal workspace created for them,
 * and makes them the owner of that workspace. Also boots a default
 * free tier subscription for the workspace.
 */
export async function ensurePersonalWorkspace(userId: number, userName: string): Promise<void> {
  const baseSlug = `${userName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${userId}`;

  // Find if user already has an owned workspace or if this workspace exists
  const existing = await db.workspaceMember.findFirst({
    where: { userId, role: 'owner' },
  });

  if (existing) {
    return;
  }

  // Create workspace and owner membership. If two concurrent signups race for
  // the same slug, Prisma raises P2002 on the unique constraint — retry once
  // with a suffixed slug rather than corrupting state.
  let ws;
  try {
    ws = await db.workspace.upsert({
      where: { slug: baseSlug },
      update: {},
      create: {
        name: `${userName}'s Workspace`,
        slug: baseSlug,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code !== 'P2002') throw e;
    const suffix = randomBytes(3).toString('hex');
    ws = await db.workspace.create({
      data: {
        name: `${userName}'s Workspace`,
        slug: `${baseSlug}-${suffix}`,
        members: {
          create: {
            userId,
            role: 'owner',
          },
        },
      },
    });
  }

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
