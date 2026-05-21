import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

/**
 * GET /api/v1/backrefs?to=<entryId>          — all references pointing to an entry
 * GET /api/v1/backrefs?from=<entryId>        — all references originating from an entry
 * GET /api/v1/backrefs?target=<name>         — references to an unresolved name
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  const sp = event.url.searchParams;
  const to = sp.get('to');
  const from = sp.get('from');
  const target = sp.get('target');

  const where: Record<string, unknown> = { workspaceId: actor.workspaceId };
  if (to) where.toEntryId = parseInt(to);
  else if (from) where.fromEntryId = parseInt(from);
  else if (target) where.targetName = { equals: target, mode: 'insensitive' };

  const refs = await db.backref.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true, fromEntryId: true, toEntryId: true, targetName: true,
      alias: true, offset: true, context: true, createdAt: true,
    },
  });
  return json({ data: refs });
}
