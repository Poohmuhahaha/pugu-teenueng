import { json } from '@sveltejs/kit';
import { COOKIE_NAME } from '$lib/server/auth';

export async function POST({ cookies }) {
  cookies.delete(COOKIE_NAME, { path: '/' });
  return json({ ok: true });
}
