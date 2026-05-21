import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { createCheckoutSession } from '$lib/server/billing';

const Body = z.object({ plan: z.enum(['personal', 'studio']) });

export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const body = Body.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  const ws = await db.workspace.findUnique({ where: { id: actor.workspaceId } });
  if (!ws) throw error(404, 'Workspace not found');

  const user = await db.user.findUnique({ where: { id: actor.userId } });
  if (!user) throw error(404, 'User not found');

  const session = await createCheckoutSession({
    workspaceId: ws.id,
    workspaceSlug: ws.slug,
    customerEmail: user.email,
    plan: body.data.plan,
    existingCustomerId: ws.stripeCustomerId,
  });
  if (!session) throw error(503, 'Billing not configured on this instance');
  return json(session);
}
