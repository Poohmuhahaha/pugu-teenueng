import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { authenticate, signSession, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/server/auth';
import { rateLimit, RateLimits } from '$lib/server/ratelimit';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(event) {
  const body = Body.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  // Composite key (ip + email) so a single bad actor can't burn the global IP budget
  // by spraying many accounts.
  await rateLimit(event, { route: 'auth.login', qualifier: body.data.email.toLowerCase(), ...RateLimits.authStrict });

  const user = await authenticate(body.data.email, body.data.password);
  if (!user) throw error(401, 'Invalid email or password');

  const token = await signSession({ uid: user.id, name: user.name, email: user.email });
  event.cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return json({ id: user.id, name: user.name, email: user.email });
}
