import { json, error } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { db } from '$lib/server/db';

const MAX_ATTEMPTS = 5;
const BACKOFFS_SEC = [60, 300, 900, 3600, 21600]; // 1m, 5m, 15m, 1h, 6h

/**
 * Internal worker — call from cron or scheduler every ~30s.
 * Auth: shared secret in X-Internal-Token header (INTERNAL_WORKER_TOKEN env).
 *
 * Picks failures with nextRetryAt <= now, retries the POST, updates attempts.
 * Disables the hook after MAX_ATTEMPTS.
 */
export async function POST({ request }) {
  const expected = process.env.INTERNAL_WORKER_TOKEN;
  const given = request.headers.get('x-internal-token');
  if (!expected || given !== expected) throw error(401, 'Internal-only endpoint');

  const now = new Date();
  const due = await db.webhookFailure.findMany({
    where: {
      nextRetryAt: { lte: now },
      attempts: { lt: MAX_ATTEMPTS },
    },
    take: 50,
    include: { webhook: true },
    orderBy: { createdAt: 'asc' },
  });

  const results = { processed: 0, succeeded: 0, retried: 0, disabled: 0 };

  for (const failure of due) {
    if (failure.webhook.disabledAt) {
      // Hook was disabled in the meantime — drop the failure row
      await db.webhookFailure.delete({ where: { id: failure.id } });
      continue;
    }
    results.processed += 1;
    const body = JSON.stringify(failure.payload);
    const sig = createHmac('sha256', failure.webhook.secret).update(body).digest('hex');
    let status: number | null = null;
    let errMsg: string | null = null;
    try {
      const res = await fetch(failure.webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-QuestPage-Signature': `sha256=${sig}`,
          'X-QuestPage-Attempt': String(failure.attempts + 1),
        },
        body,
      });
      status = res.status;
      if (res.ok) {
        await db.webhookFailure.delete({ where: { id: failure.id } });
        results.succeeded += 1;
        continue;
      }
      errMsg = await res.text().catch(() => '');
    } catch (e) {
      errMsg = e instanceof Error ? e.message : String(e);
    }

    const nextAttempts = failure.attempts + 1;
    if (nextAttempts >= MAX_ATTEMPTS) {
      // Disable the hook + keep failure for forensics
      await db.$transaction([
        db.webhook.update({ where: { id: failure.webhookId }, data: { disabledAt: new Date() } }),
        db.webhookFailure.update({
          where: { id: failure.id },
          data: { attempts: nextAttempts, statusCode: status, errorMsg: errMsg, nextRetryAt: null },
        }),
      ]);
      results.disabled += 1;
    } else {
      const backoff = BACKOFFS_SEC[nextAttempts] ?? BACKOFFS_SEC[BACKOFFS_SEC.length - 1];
      await db.webhookFailure.update({
        where: { id: failure.id },
        data: {
          attempts: nextAttempts,
          statusCode: status,
          errorMsg: errMsg,
          nextRetryAt: new Date(Date.now() + backoff * 1000),
        },
      });
      results.retried += 1;
    }
  }

  return json({ ok: true, ...results, at: now.toISOString() });
}
