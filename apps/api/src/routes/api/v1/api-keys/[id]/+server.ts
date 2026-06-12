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

  const key = await db.apiKey.findFirst({
    where: { id, workspaceId: actor.workspaceId },
  });
  if (!key) throw error(404, 'API key not found');

  if (key.revokedAt === null) {
    // Soft revoke
    await db.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return json({ ok: true, action: 'revoked' });
  } else {
    // Hard delete
    await db.apiKey.delete({
      where: { id },
    });
    return json({ ok: true, action: 'deleted' });
  }
}
