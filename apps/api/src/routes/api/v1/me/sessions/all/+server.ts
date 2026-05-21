import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, COOKIE_NAME } from '$lib/server/auth';
import { hashToken } from '$lib/server/sessions';

/**
 * POST /api/v1/me/sessions/all
 * Revoke every session for the current user EXCEPT the one making this request.
 * "Sign out everywhere else."
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys cannot revoke sessions');

  const currentToken = event.cookies.get(COOKIE_NAME);
  const currentHash = currentToken ? hashToken(currentToken) : null;

  const result = await db.session.updateMany({
    where: {
      userId: actor.userId,
      revokedAt: null,
      ...(currentHash ? { NOT: { tokenHash: currentHash } } : {}),
    },
    data: { revokedAt: new Date() },
  });
  return json({ ok: true, revoked: result.count });
}
