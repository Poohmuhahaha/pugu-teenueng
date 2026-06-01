import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { issueToken } from '$lib/server/tokens';
import { sendEmail, emailTemplates } from '$lib/server/email';
import { rateLimit, RateLimits } from '$lib/server/ratelimit';

const Body = z.object({ email: z.string().email() });

/**
 * POST /api/auth/magic — request a one-time sign-in link.
 * Always returns 200 so we don't leak which emails are registered.
 */
export async function POST(event) {
  const body = Body.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await rateLimit(event, { route: 'auth.magic', qualifier: body.data.email.toLowerCase(), ...RateLimits.authLinkRequest });

  const user = await db.user.findUnique({ where: { email: body.data.email } });
  if (user) {
    const { raw } = await issueToken(user.id, 'magic');
    const tmpl = emailTemplates.magicLink(raw);
    await sendEmail({ to: user.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html });
  }
  return json({ ok: true });
}
