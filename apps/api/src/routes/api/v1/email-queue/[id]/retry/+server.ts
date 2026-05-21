import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

/**
 * POST /api/v1/email-queue/[id]/retry — admin manual retry.
 * Resets nextRunAt to now and clears abandonedAt so worker tick picks it up.
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const result = await db.emailJob.updateMany({
    where: { id, sentAt: null },
    data: { nextRunAt: new Date(), abandonedAt: null, lastError: null },
  });
  if (result.count === 0) throw error(404, 'Job not found or already sent');
  return json({ ok: true });
}
