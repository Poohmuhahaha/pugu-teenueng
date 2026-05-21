import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { signSession, hashPassword, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/server/auth';
import { ensurePersonalWorkspace } from '$lib/server/workspace';
import { sendEmail, emailTemplates } from '$lib/server/email';

const Body = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST({ request, cookies }) {
  const body = Body.safeParse(await request.json());
  if (!body.success) throw error(400, body.error.message);

  const existing = await db.user.findUnique({ where: { email: body.data.email } });
  if (existing) throw error(409, 'Email already registered');

  const passwordHash = await hashPassword(body.data.password);
  const user = await db.user.create({
    data: { name: body.data.name.trim(), email: body.data.email, passwordHash },
  });

  await ensurePersonalWorkspace(user.id, user.name);

  const tmpl = emailTemplates.welcome(user.name);
  sendEmail({ to: user.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html }).catch(() => {});

  const token = await signSession({ uid: user.id, name: user.name, email: user.email });
  cookies.set(COOKIE_NAME, token, COOKIE_OPTIONS);
  return json({ ok: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
}
