import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, COOKIE_NAME } from '$lib/server/auth';
import { hashToken } from '$lib/server/sessions';

/** GET /api/v1/me/sessions — list active + revoked sessions for the current user */
export async function GET(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys cannot list sessions');

  const currentHash = event.cookies.get(COOKIE_NAME);
  const currentSha = currentHash ? hashToken(currentHash) : null;

  const rows = await db.session.findMany({
    where: { userId: actor.userId },
    orderBy: { lastSeenAt: 'desc' },
    select: {
      id: true, ua: true, ip: true,
      createdAt: true, lastSeenAt: true, revokedAt: true,
      tokenHash: true,
    },
  });

  return json({
    data: rows.map((r) => ({
      id: r.id,
      ua: r.ua,
      ip: r.ip,
      createdAt: r.createdAt,
      lastSeenAt: r.lastSeenAt,
      revokedAt: r.revokedAt,
      current: r.tokenHash === currentSha,
    })),
  });
}
