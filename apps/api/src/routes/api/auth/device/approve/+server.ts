import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';
import { rateLimit } from '$lib/server/ratelimit';

/**
 * POST /api/auth/device/approve
 *
 * Called by the WEB app's /auth/device page when the signed-in user clicks
 * Approve (or Deny). Authenticates as the current user via the existing
 * session cookie, then attaches the user to the pending device code.
 *
 * Body:
 *   { "user_code": "ABCD-1234", "decision": "approve" | "deny" }
 */

const Body = z.object({
  user_code: z.string().min(4),
  decision: z.enum(['approve', 'deny']),
});

export async function POST(event) {
  await rateLimit(event, { route: 'auth.device.approve', limit: 60, windowSec: 60 * 60 });

  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'only user sessions can approve device codes');

  const body = Body.safeParse(await event.request.json().catch(() => ({})));
  if (!body.success) throw error(400, body.error.message);

  const row = await db.deviceCode.findUnique({ where: { userCode: body.data.user_code } });
  if (!row) throw error(404, 'unknown user code');

  if (row.consumedAt) throw error(410, 'device code already consumed');
  if (row.expiresAt < new Date()) throw error(410, 'device code expired');
  if (row.status !== 'pending') throw error(409, `device code is ${row.status}`);

  const newStatus = body.data.decision === 'approve' ? 'approved' : 'denied';
  await db.deviceCode.update({
    where: { id: row.id },
    data: { status: newStatus, userId: body.data.decision === 'approve' ? actor.userId : null },
  });

  return json({ ok: true, status: newStatus });
}
