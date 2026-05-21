import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { issueToken } from '$lib/server/tokens';
import { sendEmail, emailTemplates } from '$lib/server/email';

const Body = z.object({ email: z.string().email() });

/**
 * POST /api/auth/forgot — request password reset.
 * Always 200 to avoid email enumeration.
 */
export async function POST({ request }) {
  const body = Body.safeParse(await request.json());
  if (!body.success) throw error(400, body.error.message);

  const user = await db.user.findUnique({ where: { email: body.data.email } });
  if (user) {
    const { raw } = await issueToken(user.id, 'reset');
    const tmpl = emailTemplates.passwordReset(raw);
    await sendEmail({ to: user.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html });
  }
  return json({ ok: true });
}
