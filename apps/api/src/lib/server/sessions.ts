import { createHash } from 'node:crypto';
import { db } from './db';

export function hashToken(jwt: string): string {
  return createHash('sha256').update(jwt).digest('hex');
}

/** Record a new login. Idempotent — same JWT hash returns existing row. */
export async function recordSession(userId: number, jwt: string, ua: string | null, ip: string | null): Promise<number> {
  const tokenHash = hashToken(jwt);
  const row = await db.session.upsert({
    where: { tokenHash },
    update: { lastSeenAt: new Date(), revokedAt: null },
    create: { userId, tokenHash, ua, ip },
  });
  return row.id;
}

export async function touchSession(jwt: string): Promise<void> {
  const tokenHash = hashToken(jwt);
  // Fire-and-forget on the hot request path — we don't want a transient DB
  // hiccup to fail the user's request — but log to stderr so failures are
  // visible in production logs instead of silently swallowed.
  await db.session.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { lastSeenAt: new Date() },
  }).catch((err) => { console.error('[sessions.touch] update failed:', err); });
}

export async function isSessionRevoked(jwt: string): Promise<boolean> {
  const tokenHash = hashToken(jwt);
  const row = await db.session.findUnique({
    where: { tokenHash },
    select: { revokedAt: true },
  });
  return !!row?.revokedAt;
}
