import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

/**
 * GET /api/v1/me/export — PDPA data portability.
 * Returns every row owned by, or visible to, the authenticated user across all
 * their workspaces, plus the user's profile. Set Content-Disposition for download.
 */
export async function GET(event) {
  const actor = await resolveActor(event);

  const [user, memberships, ownedWorkspaces] = await Promise.all([
    db.user.findUnique({
      where: { id: actor.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    db.workspaceMember.findMany({
      where: { userId: actor.userId },
      include: { workspace: true },
    }),
    db.workspaceMember.findMany({
      where: { userId: actor.userId, role: 'owner' },
      select: { workspaceId: true },
    }),
  ]);

  // For workspaces the user owns, dump full content. For non-owned, just metadata.
  const ownedIds = new Set(ownedWorkspaces.map((m) => m.workspaceId));
  const workspaces: unknown[] = [];
  for (const m of memberships) {
    const ws = m.workspace;
    const base = { id: ws.id, name: ws.name, slug: ws.slug, role: m.role, joinedAt: m.createdAt };
    if (!ownedIds.has(ws.id)) {
      workspaces.push(base);
      continue;
    }
    const [contentTypes, entries, apiKeys, webhooks, subscription] = await Promise.all([
      db.contentType.findMany({ where: { workspaceId: ws.id } }),
      db.contentEntry.findMany({ where: { workspaceId: ws.id } }),
      db.apiKey.findMany({
        where: { workspaceId: ws.id },
        select: { id: true, name: true, prefix: true, role: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true },
      }),
      db.webhook.findMany({
        where: { workspaceId: ws.id },
        select: { id: true, url: true, events: true, contentTypeSlug: true, createdAt: true, updatedAt: true, disabledAt: true },
      }),
      db.subscription.findUnique({ where: { workspaceId: ws.id } }),
    ]);
    workspaces.push({ ...base, contentTypes, entries, apiKeys, webhooks, subscription });
  }

  return json(
    {
      exportedAt: new Date().toISOString(),
      schema: 'questpage.v1',
      user,
      workspaces,
    },
    {
      headers: {
        'Content-Disposition': `attachment; filename="questpage-export-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    }
  );
}
