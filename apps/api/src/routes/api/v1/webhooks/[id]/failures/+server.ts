import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

export async function GET(event) {
  const actor = await resolveActor(event);
  const id = parseInt(event.params.id);
  if (Number.isNaN(id)) throw error(400, 'Invalid id');

  const hook = await db.webhook.findFirst({ where: { id, workspaceId: actor.workspaceId } });
  if (!hook) throw error(404, 'Webhook not found in this workspace');

  const failures = await db.webhookFailure.findMany({
    where: { webhookId: id },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true, event: true, payload: true, statusCode: true,
      errorMsg: true, attempts: true, nextRetryAt: true, createdAt: true,
    },
  });
  return json({ data: failures });
}
