import { json, error } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { db } from '$lib/server/db';
import { rateLimit } from '$lib/server/ratelimit';

/**
 * POST /api/auth/device/start
 *
 * Unauthenticated. Issues a fresh (device_code, user_code) pair that the CLI
 * will hold while the user approves it in their browser.
 *
 *   {
 *     "device_code": "<random>",
 *     "user_code":   "ABCD-1234",
 *     "verification_uri":          "https://lifeos.app/auth/device",
 *     "verification_uri_complete": "https://lifeos.app/auth/device?code=ABCD-1234",
 *     "expires_in":                900,
 *     "interval":                  5
 *   }
 */

const TTL_SEC = 15 * 60;
const POLL_INTERVAL_SEC = 5;

function generateUserCode(): string {
  // 8 chars from a confusion-light alphabet, formatted XXXX-XXXX
  const alphabet = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  const bytes = randomBytes(8);
  let s = '';
  for (let i = 0; i < 8; i++) s += alphabet[bytes[i] % alphabet.length];
  return `${s.slice(0, 4)}-${s.slice(4)}`;
}

export async function POST(event) {
  // Per-IP throttle: 20 per hour. Generous enough for legit retries, tight
  // enough that brute-forcing user_code space is infeasible (~26^8 ≈ 2e11).
  await rateLimit(event, { route: 'auth.device.start', limit: 20, windowSec: 60 * 60 });

  const deviceCode = randomBytes(32).toString('hex');

  // Avoid collisions: try a few times before giving up
  let userCode = generateUserCode();
  for (let i = 0; i < 5; i++) {
    const clash = await db.deviceCode.findUnique({ where: { userCode } });
    if (!clash) break;
    userCode = generateUserCode();
  }

  const expiresAt = new Date(Date.now() + TTL_SEC * 1000);
  await db.deviceCode.create({
    data: { deviceCode, userCode, expiresAt, status: 'pending' },
  });

  // Build verification URLs based on the request's origin. The browser flow
  // lives on the web app (apps/web) at /auth/device, not on the API host.
  const origin = event.url.origin.replace(/:3000$/, ':5176');
  const verificationUri = `${origin.replace(/\/$/, '')}/auth/device`;
  const verificationUriComplete = `${verificationUri}?code=${encodeURIComponent(userCode)}`;

  return json({
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: verificationUri,
    verification_uri_complete: verificationUriComplete,
    expires_in: TTL_SEC,
    interval: POLL_INTERVAL_SEC,
  });
}
