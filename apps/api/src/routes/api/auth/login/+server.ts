import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { authenticate, signSession, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/server/auth';

const Body = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST({ request, cookies }) {
  const body = Body.safeParse(await request.json());
  if (!body.success) throw error(400, body.error.message);

  const user = await authenticate(body.data.email, body.data.password);
  if (!user) throw error(401, 'Invalid email or password');

  const token = await signSession({ uid: user.id, name: user.name, email: user.email });
  cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return json({ id: user.id, name: user.name, email: user.email });
}
