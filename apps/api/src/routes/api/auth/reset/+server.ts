import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { consumeToken } from '$lib/server/tokens';
import { hashPassword } from '$lib/server/auth';
import { rateLimit, RateLimits } from '$lib/server/ratelimit';

const Body = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(200),
});

/**
 * POST /api/auth/reset — exchange reset token + new password.
 */
export async function POST(event) {
  const body = Body.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await rateLimit(event, { route: 'auth.reset', ...RateLimits.authStrict });

  const userId = await consumeToken(body.data.token, 'reset');
  if (!userId) throw error(401, 'Token expired or already used');

  const passwordHash = await hashPassword(body.data.password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  return json({ ok: true });
}
