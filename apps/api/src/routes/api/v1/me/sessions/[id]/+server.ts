import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

export async function DELETE(event) {
  const actor = await resolveActor(event);
  if (actor.kind !== 'user') throw error(403, 'API keys cannot revoke sessions');

  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const result = await db.session.updateMany({
    where: { id, userId: actor.userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw error(404, 'Session not found or already revoked');
  return json({ ok: true });
}
