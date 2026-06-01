import { db } from './db';
import { sendEmail, type SendEmailRequest } from './email';
import { enqueueEmailJob, activeBackendName } from './queue';

const MAX_ATTEMPTS = 5;
const BACKOFFS_SEC = [30, 120, 600, 3600, 21600]; // 30s, 2m, 10m, 1h, 6h

/**
 * Persist an email and dispatch it.
 *
 * Backend dispatch:
 *   - Default (Postgres): processOne() runs in-process, cron retries.
 *   - BullMQ (REDIS_URL set): enqueues to BullMQ; an external worker reads
 *     the EmailJob row and calls sendEmail(). See docs/scaling.md.
 *
 * Use this for transactional emails (signup welcome, invites, etc.) where
 * losing the message because the process crashed is unacceptable.
 */
export async function enqueueEmail(req: SendEmailRequest): Promise<number> {
  const row = await db.emailJob.create({
    data: {
      recipient: req.to,
      subject: req.subject,
      text: req.text,
      html: req.html ?? null,
    },
  });

  const backend = await activeBackendName();
  if (backend === 'bullmq') {
    await enqueueEmailJob({ ...req, jobId: row.id });
  } else {
    // In-process: try immediately so dev flows don't wait for the cron tick
    processOne(row.id).catch(() => {});
  }
  return row.id;
}

async function processOne(jobId: number): Promise<void> {
  const job = await db.emailJob.findUnique({ where: { id: jobId } });
  if (!job || job.sentAt || job.abandonedAt) return;
  try {
    const res = await sendEmail({
      to: job.recipient,
      subject: job.subject,
      text: job.text,
      html: job.html ?? undefined,
    });
    if (res.delivered) {
      await db.emailJob.update({ where: { id: jobId }, data: { sentAt: new Date() } });
    } else {
      // Resend not configured — mark as delivered in dev so we don't fill the queue
      if (process.env.NODE_ENV !== 'production') {
        await db.emailJob.update({ where: { id: jobId }, data: { sentAt: new Date(), lastError: 'resend disabled' } });
      } else {
        await scheduleRetry(jobId, 'no SDK delivery');
      }
    }
  } catch (e) {
    await scheduleRetry(jobId, e instanceof Error ? e.message : String(e));
  }
}

async function scheduleRetry(jobId: number, errorMsg: string): Promise<void> {
  const job = await db.emailJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  const nextAttempt = job.attempts + 1;
  if (nextAttempt >= MAX_ATTEMPTS) {
    await db.emailJob.update({
      where: { id: jobId },
      data: { attempts: nextAttempt, lastError: errorMsg, abandonedAt: new Date() },
    });
    return;
  }
  const backoff = BACKOFFS_SEC[nextAttempt] ?? BACKOFFS_SEC[BACKOFFS_SEC.length - 1];
  await db.emailJob.update({
    where: { id: jobId },
    data: {
      attempts: nextAttempt,
      lastError: errorMsg,
      nextRunAt: new Date(Date.now() + backoff * 1000),
    },
  });
}

/**
 * Worker tick — call from cron every ~30s alongside webhook-retry.
 * Picks up to 25 due jobs, runs them. Failures are scheduled for retry.
 */
export async function runEmailQueue(): Promise<{ processed: number; sent: number; failed: number; abandoned: number }> {
  const now = new Date();
  const due = await db.emailJob.findMany({
    where: {
      sentAt: null,
      abandonedAt: null,
      nextRunAt: { lte: now },
      attempts: { lt: MAX_ATTEMPTS },
    },
    take: 25,
    orderBy: { nextRunAt: 'asc' },
    select: { id: true },
  });
  let sent = 0, failed = 0, abandoned = 0;
  for (const j of due) {
    const before = await db.emailJob.findUnique({ where: { id: j.id } });
    await processOne(j.id);
    const after = await db.emailJob.findUnique({ where: { id: j.id } });
    if (after?.sentAt && !before?.sentAt) sent += 1;
    else if (after?.abandonedAt) abandoned += 1;
    else failed += 1;
  }
  return { processed: due.length, sent, failed, abandoned };
}
