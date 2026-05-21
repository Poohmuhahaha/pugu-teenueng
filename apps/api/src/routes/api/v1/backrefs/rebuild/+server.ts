import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { rebuildBackrefs } from '$lib/server/backref';

/**
 * POST /api/v1/backrefs/rebuild
 * Re-scan every entry in the active workspace and rebuild outgoing Backref rows.
 * Use for: initial migration, schema changes, or after a backref worker outage.
 * Admin role required (write-heavy operation).
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const entries = await db.contentEntry.findMany({
    where: { workspaceId: actor.workspaceId, deletedAt: null },
    select: { id: true },
  });

  let resolved = 0;
  let unresolved = 0;
  for (const e of entries) {
    const r = await rebuildBackrefs(e.id);
    resolved += r.resolved;
    unresolved += r.unresolved;
  }

  return json({
    ok: true,
    entriesScanned: entries.length,
    resolved,
    unresolved,
    at: new Date().toISOString(),
  });
}
