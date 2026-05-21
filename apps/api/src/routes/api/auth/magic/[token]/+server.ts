import { error, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { consumeToken } from '$lib/server/tokens';
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/server/auth';

/**
 * GET /api/auth/magic/[token]
 * One-time consumption: signs the user in and redirects to /.
 */
export async function GET({ params, cookies }) {
  const userId = await consumeToken(params.token, 'magic');
  if (!userId) throw error(401, 'Link expired or already used');
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw error(404, 'User not found');

  const jwt = await signSession({ uid: user.id, name: user.name, email: user.email });
  cookies.set(COOKIE_NAME, jwt, COOKIE_OPTIONS);
  throw redirect(303, '/');
}
