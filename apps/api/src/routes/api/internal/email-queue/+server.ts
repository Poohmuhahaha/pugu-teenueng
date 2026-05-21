import { json, error } from '@sveltejs/kit';
import { runEmailQueue } from '$lib/server/email-queue';

/**
 * POST /api/internal/email-queue
 * Cron tick (call every ~30s). Auth via X-Internal-Token = INTERNAL_WORKER_TOKEN.
 * Same auth model as webhook-retry — safe to schedule next to it.
 */
export async function POST({ request }) {
  const expected = process.env.INTERNAL_WORKER_TOKEN;
  const given = request.headers.get('x-internal-token');
  if (!expected || given !== expected) throw error(401, 'Internal-only endpoint');

  const result = await runEmailQueue();
  return json({ ok: true, ...result, at: new Date().toISOString() });
}
