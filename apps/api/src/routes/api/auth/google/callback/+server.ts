import { redirect, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { signSession, COOKIE_NAME, COOKIE_OPTIONS } from '$lib/server/auth';
import { exchangeCode, isConfigured } from '$lib/server/oauth';
import { ensurePersonalWorkspace } from '$lib/server/workspace';
import { sendEmail, emailTemplates } from '$lib/server/email';

export async function GET({ url, cookies }) {
  if (!isConfigured()) throw error(503, 'Google sign-in not configured');

  const code = url.searchParams.get('code');
  const stateGiven = url.searchParams.get('state');
  const stateCookie = cookies.get('questpage_oauth_state');
  cookies.delete('questpage_oauth_state', { path: '/' });

  if (!code) throw error(400, 'Missing code');
  if (!stateGiven || !stateCookie || stateGiven !== stateCookie) {
    throw error(400, 'OAuth state mismatch — request expired or tampered with');
  }

  const profile = await exchangeCode(code);
  const isNew = !(await db.user.findUnique({ where: { email: profile.email } }));

  const user = await db.user.upsert({
    where: { email: profile.email },
    update: { name: profile.name },
    create: { email: profile.email, name: profile.name, passwordHash: null },
  });

  if (isNew) {
    await ensurePersonalWorkspace(user.id, user.name);
    const tmpl = emailTemplates.welcome(user.name);
    sendEmail({ to: user.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html }).catch(() => {});
  }

  const jwt = await signSession({ uid: user.id, name: user.name, email: user.email });
  cookies.set(COOKIE_NAME, jwt, COOKIE_OPTIONS);
  throw redirect(303, '/');
}
