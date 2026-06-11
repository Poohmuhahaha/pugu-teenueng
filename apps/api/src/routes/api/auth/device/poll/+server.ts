import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { signSession } from '$lib/server/auth';
import { recordSession } from '$lib/server/sessions';
import { rateLimit } from '$lib/server/ratelimit';

/**
 * POST /api/auth/device/poll
 *
 * Unauthenticated. The CLI polls with its device_code. Responses:
 *   200 { status: "approved", token, user }   — exchange complete, save the JWT
 *   200 { status: "denied" }                  — user clicked Deny
 *   200 { status: "expired" }                 — TTL elapsed
 *   400 { code: "authorization_pending" }     — still waiting on the browser
 *   400 { code: "slow_down" }                 — caller is polling too fast
 *
 * The JWT is minted on the fly when status flips from "approved" to
 * "consumed" — it is never stored. Subsequent polls after consumption
 * return 410 Gone (so a leaked device_code can't be re-exchanged).
 */

const Body = z.object({ device_code: z.string().min(32) });
const MIN_POLL_INTERVAL_SEC = 4;

export async function POST(event) {
  await rateLimit(event, { route: 'auth.device.poll', limit: 600, windowSec: 60 * 60 });

  const body = Body.safeParse(await event.request.json().catch(() => ({})));
  if (!body.success) throw error(400, 'invalid request');

  const row = await db.deviceCode.findUnique({ where: { deviceCode: body.data.device_code } });
  if (!row) throw error(404, 'unknown device code');

  // Already exchanged → CLI is now responsible for its own JWT
  if (row.consumedAt) throw error(410, 'device code already consumed');

  // Soft-expire entries that have aged out
  if (row.status === 'pending' && row.expiresAt < new Date()) {
    await db.deviceCode.update({ where: { id: row.id }, data: { status: 'expired' } });
    return json({ status: 'expired' });
  }

  // RFC 8628-style slow-down — caller polled too fast
  if (row.lastPollAt && Date.now() - row.lastPollAt.getTime() < MIN_POLL_INTERVAL_SEC * 1000) {
    return json({ code: 'slow_down' }, { status: 400 });
  }
  await db.deviceCode.update({ where: { id: row.id }, data: { lastPollAt: new Date() } });

  if (row.status === 'denied') return json({ status: 'denied' });
  if (row.status === 'expired') return json({ status: 'expired' });

  if (row.status === 'approved' && row.userId) {
    const user = await db.user.findUnique({
      where: { id: row.userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) {
      // User vanished between approval and poll
      await db.deviceCode.update({ where: { id: row.id }, data: { status: 'denied' } });
      return json({ status: 'denied' });
    }

    const token = await signSession({ uid: user.id, name: user.name, email: user.email });
    await db.deviceCode.update({ where: { id: row.id }, data: { consumedAt: new Date() } });

    const ua = event.request.headers.get('user-agent') ?? 'questpage-cli';
    const ip = event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? null;
    await recordSession(user.id, token, ua, ip);

    return json({ status: 'approved', token, user });
  }

  return json({ code: 'authorization_pending' }, { status: 400 });
}
