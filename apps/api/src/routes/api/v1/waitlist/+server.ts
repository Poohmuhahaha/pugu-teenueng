import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

/**
 * GET /api/v1/waitlist — list waitlist entries. Admin+ in any workspace.
 * Returns most recent 500 by default; ?limit=N to override (max 5000).
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const limit = Math.min(5000, Math.max(1, parseInt(event.url.searchParams.get('limit') ?? '500')));
  const rows = await db.waitlistEntry.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return json({ data: rows, meta: { total: rows.length } });
}
