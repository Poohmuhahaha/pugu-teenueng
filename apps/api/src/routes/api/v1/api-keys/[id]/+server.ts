import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';

/**
 * DELETE /api/v1/api-keys/[id]
 * Revokes the key (sets revokedAt). Auth resolver rejects revoked keys.
 * Admin role required. Cannot be undone — must issue a new key.
 */
export async function DELETE(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const result = await db.apiKey.updateMany({
    where: { id, workspaceId: actor.workspaceId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (result.count === 0) throw error(404, 'API key not found or already revoked');
  return json({ ok: true });
}
