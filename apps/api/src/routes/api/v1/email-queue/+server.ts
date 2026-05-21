import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

/**
 * GET /api/v1/email-queue — admin viewer. ?status=pending|sent|abandoned (default: all)
 * Returns last 200 by createdAt desc.
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const status = event.url.searchParams.get('status');
  const where: Record<string, unknown> = {};
  if (status === 'pending') { where.sentAt = null; where.abandonedAt = null; }
  if (status === 'sent') where.sentAt = { not: null };
  if (status === 'abandoned') where.abandonedAt = { not: null };

  const rows = await db.emailJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, recipient: true, subject: true, attempts: true,
      nextRunAt: true, lastError: true, sentAt: true, abandonedAt: true, createdAt: true,
    },
  });
  return json({ data: rows });
}
