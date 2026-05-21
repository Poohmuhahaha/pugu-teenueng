import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export async function GET(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const rows = await db.waitlistEntry.findMany({ orderBy: { createdAt: 'desc' } });
  if (!rows) throw error(500, 'Failed to fetch');

  const header = ['id', 'email', 'utmSource', 'utmCampaign', 'ref', 'createdAt'];
  const lines = [header.join(',')];
  for (const r of rows) {
    lines.push([r.id, r.email, r.utmSource, r.utmCampaign, r.ref, r.createdAt.toISOString()].map(csvEscape).join(','));
  }

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="waitlist-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
