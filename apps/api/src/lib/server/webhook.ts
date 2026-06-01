import { createHmac } from 'node:crypto';
import { db } from './db';

export type HookEvent = 'afterCreate' | 'afterUpdate' | 'afterDelete' | 'beforeDelete';

/**
 * Fire all matching webhooks for a workspace + content-type event.
 * Fire-and-forget — failures land in WebhookFailure for retry.
 *
 * For a true production pipeline, replace direct fetch with BullMQ + Redis;
 * this in-process version is appropriate for self-host single-node deployments.
 */
export async function fireWebhooks(opts: {
  workspaceId: number;
  contentTypeSlug: string;
  event: HookEvent;
  entityId: number;
  data: unknown;
}): Promise<void> {
  const hooks = await db.webhook.findMany({
    where: {
      workspaceId: opts.workspaceId,
      disabledAt: null,
      events: { has: opts.event },
      OR: [{ contentTypeSlug: opts.contentTypeSlug }, { contentTypeSlug: null }],
    },
  });
  if (hooks.length === 0) return;

  const timestamp = new Date().toISOString();
  for (const hook of hooks) {
    const body = JSON.stringify({
      event: opts.event,
      entity: opts.contentTypeSlug,
      id: opts.entityId,
      data: opts.data,
      workspaceId: opts.workspaceId,
      timestamp,
    });
    const signature = createHmac('sha256', hook.secret).update(body).digest('hex');
    // Fire — don't await; track failures async
    fetch(hook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-LifeOS-Signature': `sha256=${signature}` },
      body,
    })
      .then(async (res) => {
        if (!res.ok) {
          await db.webhookFailure.create({
            data: {
              webhookId: hook.id,
              event: opts.event,
              payload: JSON.parse(body),
              statusCode: res.status,
              errorMsg: await res.text().catch(() => ''),
              attempts: 1,
              nextRetryAt: new Date(Date.now() + 60_000), // retry in 1 min
            },
          });
        }
      })
      .catch(async (err) => {
        await db.webhookFailure.create({
          data: {
            webhookId: hook.id,
            event: opts.event,
            payload: JSON.parse(body),
            statusCode: null,
            errorMsg: err instanceof Error ? err.message : String(err),
            attempts: 1,
            nextRetryAt: new Date(Date.now() + 60_000),
          },
        });
      });
  }
}
