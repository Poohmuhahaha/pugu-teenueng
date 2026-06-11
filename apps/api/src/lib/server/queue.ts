/**
 * Pluggable job queue adapter — wraps email + webhook delivery.
 *
 * Two backends:
 *   1. In-process / Postgres-backed (default — single-node deployments)
 *      - `EmailJob` + `WebhookFailure` tables are polled by cron.
 *      - No additional services required.
 *
 *   2. BullMQ + Redis (multi-node / horizontal scale)
 *      - Activated when REDIS_URL is set AND `bullmq` is installed.
 *      - Workers can be run as a separate process — see docs/scaling.md.
 *      - Jobs are still persisted to Postgres for audit + recovery, but
 *        delivery is driven by BullMQ instead of DB-polling.
 *
 * The export surface is identical regardless of backend. Callers should
 * use these functions instead of importing email-queue.ts / webhook.ts
 * directly for delivery.
 */

import type { SendEmailRequest } from './email';

type EmailJobPayload = SendEmailRequest & { jobId: number };

type WebhookJobPayload = {
  url: string;
  secret: string;
  body: string;
  hookId: number;
  event: string;
  contentTypeSlug: string;
  entityId: number;
  workspaceId: number;
};

interface QueueBackend {
  name: 'bullmq' | 'postgres';
  enqueueEmail(payload: EmailJobPayload): Promise<void>;
  enqueueWebhook(payload: WebhookJobPayload): Promise<void>;
}

let cached: QueueBackend | null | undefined;

async function loadBullMQ(): Promise<QueueBackend | null> {
  if (!process.env.REDIS_URL) return null;
  try {
    // Both libs are peer-optional. If either is missing, fall back.
    const [{ Queue }, ioredis] = await Promise.all([
      import(/* @vite-ignore */ 'bullmq').catch(() => null),
      import(/* @vite-ignore */ 'ioredis').catch(() => null),
    ]);
    if (!Queue || !ioredis) return null;

    const Redis = (ioredis as { default?: unknown }).default ?? (ioredis as { Redis?: unknown }).Redis;
    if (!Redis) return null;

    const connection = new (Redis as new (url: string, opts?: unknown) => unknown)(
      process.env.REDIS_URL!,
      { maxRetriesPerRequest: null },
    );

    type QueueType = { add: (name: string, payload: unknown, opts?: unknown) => Promise<unknown> };
    const emailQueue = new (Queue as new (n: string, opts: { connection: unknown }) => QueueType)(
      'questpage:email',
      { connection },
    );
    const webhookQueue = new (Queue as new (n: string, opts: { connection: unknown }) => QueueType)(
      'questpage:webhook',
      { connection },
    );

    return {
      name: 'bullmq',
      async enqueueEmail(payload) {
        await emailQueue.add('send', payload, {
          attempts: 5,
          backoff: { type: 'exponential', delay: 30_000 },
          removeOnComplete: { count: 1_000 },
          removeOnFail: { count: 1_000 },
        });
      },
      async enqueueWebhook(payload) {
        await webhookQueue.add('deliver', payload, {
          attempts: 8,
          backoff: { type: 'exponential', delay: 60_000 },
          removeOnComplete: { count: 1_000 },
          removeOnFail: { count: 5_000 },
        });
      },
    };
  } catch {
    return null;
  }
}

async function getBackend(): Promise<QueueBackend> {
  if (cached !== undefined) return cached!;
  const bull = await loadBullMQ();
  cached = bull ?? postgresBackend;
  if (cached.name === 'bullmq') {
    // eslint-disable-next-line no-console
    console.log('[queue] BullMQ backend enabled');
  }
  return cached;
}

/**
 * Postgres-backed fallback. Email + webhook delivery already runs from
 * cron-polled DB tables, so this backend is a no-op at enqueue time —
 * the row was already created by the caller.
 */
const postgresBackend: QueueBackend = {
  name: 'postgres',
  enqueueEmail: async () => { /* row already persisted, cron will pick it up */ },
  enqueueWebhook: async () => { /* WebhookFailure rows are created on demand by webhook.ts */ },
};

/**
 * Enqueue an email job. Caller is responsible for creating the EmailJob row first
 * (so the DB stays authoritative even when BullMQ is the active worker).
 */
export async function enqueueEmailJob(payload: EmailJobPayload): Promise<void> {
  const backend = await getBackend();
  await backend.enqueueEmail(payload);
}

/**
 * Enqueue a webhook delivery. Caller is responsible for tracking failure rows
 * (so the DB stays authoritative even when BullMQ is the active worker).
 */
export async function enqueueWebhookJob(payload: WebhookJobPayload): Promise<void> {
  const backend = await getBackend();
  await backend.enqueueWebhook(payload);
}

/** Visible for diagnostics / tests. */
export async function activeBackendName(): Promise<'bullmq' | 'postgres'> {
  const b = await getBackend();
  return b.name;
}
