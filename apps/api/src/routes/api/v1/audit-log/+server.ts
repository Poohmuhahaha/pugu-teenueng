import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

export async function GET(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const sp = event.url.searchParams;
  const entity = sp.get('entity');
  const action = sp.get('action');
  const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') ?? '100')));

  const where: Record<string, unknown> = { workspaceId: actor.workspaceId };
  if (entity) where.entity = entity;
  if (action) where.action = action;

  const rows = await db.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  if (!rows) throw error(500, 'Audit query failed');
  return json({ data: rows, meta: { total: rows.length } });
}
