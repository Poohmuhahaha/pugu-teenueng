import { createHmac } from 'node:crypto';
import { db } from './db';
import { enqueueWebhookJob, activeBackendName } from './queue';

export type HookEvent = 'afterCreate' | 'afterUpdate' | 'afterDelete' | 'beforeDelete' | 'prospect.approved';

/**
 * Fire all matching webhooks for a workspace + content-type event.
 *
 * Backend dispatch:
 *   - Default (in-process fetch): fire-and-forget; failures land in
 *     WebhookFailure for cron-driven retry.
 *   - BullMQ (REDIS_URL set): enqueues to BullMQ; an external worker
 *     handles delivery + retries. See docs/scaling.md.
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

  const backend = await activeBackendName();
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

    if (backend === 'bullmq') {
      enqueueWebhookJob({
        url: hook.url,
        secret: hook.secret,
        body,
        hookId: hook.id,
        event: opts.event,
        contentTypeSlug: opts.contentTypeSlug,
        entityId: opts.entityId,
        workspaceId: opts.workspaceId,
      }).catch(() => { /* falls back to DB retry below if BullMQ enqueue itself fails */ });
      continue;
    }

    const signature = createHmac('sha256', hook.secret).update(body).digest('hex');
    fetch(hook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-QuestPage-Signature': `sha256=${signature}` },
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
              nextRetryAt: new Date(Date.now() + 60_000),
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
