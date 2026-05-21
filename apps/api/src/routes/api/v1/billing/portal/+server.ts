import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { createPortalSession } from '$lib/server/billing';

export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const ws = await db.workspace.findUnique({ where: { id: actor.workspaceId } });
  if (!ws) throw error(404, 'Workspace not found');
  if (!ws.stripeCustomerId) throw error(409, 'No active subscription — start with checkout first');

  const session = await createPortalSession({
    customerId: ws.stripeCustomerId,
    workspaceSlug: ws.slug,
  });
  if (!session) throw error(503, 'Billing not configured on this instance');
  return json(session);
}
