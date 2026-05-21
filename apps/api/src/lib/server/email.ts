/**
 * Email delivery — lazy Resend SDK so self-hosters without Resend can still run.
 *
 * Required env (optional, dev falls back to console.log):
 *   RESEND_API_KEY=re_…
 *   EMAIL_FROM="LifeOS <hello@lifeos.so>"
 *   PUBLIC_BASE_URL=https://lifeos.example.com
 */

let cached: typeof import('resend').Resend | null | undefined;

async function loadResend(): Promise<typeof import('resend').Resend | null> {
  if (cached !== undefined) return cached;
  if (!process.env.RESEND_API_KEY) {
    cached = null;
    return null;
  }
  try {
    const mod = await import(/* @vite-ignore */ 'resend');
    cached = mod.Resend;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(req: SendEmailRequest): Promise<{ id: string | null; delivered: boolean }> {
  const Resend = await loadResend();
  const from = process.env.EMAIL_FROM ?? 'LifeOS <noreply@lifeos.local>';
  if (!Resend) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('\n────── EMAIL (resend disabled) ──────');
      console.log('From:    ', from);
      console.log('To:      ', req.to);
      console.log('Subject: ', req.subject);
      console.log('Body:\n', req.text, '\n────────────────────────────────────\n');
    }
    return { id: null, delivered: false };
  }
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const res = await resend.emails.send({ from, to: req.to, subject: req.subject, text: req.text, html: req.html });
  return { id: res.data?.id ?? null, delivered: !res.error };
}

// ── Templates ──────────────────────────────────────────────

const base = () => process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string)
  );
}

/**
 * Shared HTML shell. White-with-purple-accent, single column, no remote assets.
 * Designed to render legibly in Gmail/Outlook/Apple Mail without external CSS.
 */
function shell(opts: { preheader: string; heading: string; body: string; cta?: { label: string; url: string }; footer?: string }): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light dark" />
    <title>${escapeHtml(opts.heading)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color:#111;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(opts.preheader)}</div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f5f5; padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px; background:#ffffff; border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
            <tr>
              <td style="padding:32px 36px 0 36px;">
                <div style="font-weight:800; font-size:14px; color:#7c3aed; letter-spacing:0.1em;">LIFEOS</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 8px 36px;">
                <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; letter-spacing:-0.01em;">${escapeHtml(opts.heading)}</h1>
                <div style="font-size:15px; line-height:1.6; color:#374151;">${opts.body}</div>
              </td>
            </tr>
            ${opts.cta ? `<tr>
              <td style="padding:8px 36px 32px 36px;">
                <a href="${escapeHtml(opts.cta.url)}"
                   style="display:inline-block; padding:12px 22px; background:#7c3aed; color:#ffffff; font-weight:600; font-size:14px; border-radius:10px; text-decoration:none;">
                  ${escapeHtml(opts.cta.label)}
                </a>
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:0 36px 32px 36px; font-size:12px; line-height:1.55; color:#6b7280;">
                ${opts.footer ?? 'You\'re receiving this because of activity on your LifeOS account.'}
              </td>
            </tr>
          </table>
          <div style="margin-top:14px; font-size:11px; color:#9ca3af;">© LifeOS · <a href="${escapeHtml(base())}" style="color:#9ca3af;">${escapeHtml(base().replace(/^https?:\/\//, ''))}</a></div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const emailTemplates = {
  welcome(toName: string): { subject: string; text: string; html: string } {
    const subject = 'Welcome to LifeOS';
    const text = [
      `Hi ${toName},`,
      '',
      'Welcome to LifeOS — your headless productivity OS.',
      '',
      `Get started: ${base()}`,
      'Define your first collection: open the admin (port 5175 in dev).',
      'Read the API docs: see docs/api.md in the repo or /api/v1/docs on your instance.',
      '',
      'Reply to this email with any feedback. We read everything.',
      '',
      '— LifeOS',
    ].join('\n');
    const html = shell({
      preheader: 'Welcome — here\'s where to start.',
      heading: `Welcome, ${escapeHtml(toName)}.`,
      body: `<p style="margin:0 0 12px;">LifeOS is your headless productivity OS — knowledge graph, block editor, REST API, all in one.</p>
             <p style="margin:0 0 12px;">A starter workspace is ready for you. Open the admin to define your first content type, or skip straight to the API.</p>`,
      cta: { label: 'Open LifeOS', url: base() },
      footer: 'Reply to this email with any feedback. We read everything.',
    });
    return { subject, text, html };
  },

  magicLink(token: string): { subject: string; text: string; html: string } {
    const url = `${base()}/api/auth/magic/${token}`;
    const subject = 'Your LifeOS sign-in link';
    const text = [
      'Click below to sign in to LifeOS:',
      '',
      url,
      '',
      'Link expires in 15 minutes. If you didn\'t request this, ignore the email.',
    ].join('\n');
    const html = shell({
      preheader: 'One-tap sign-in — link expires in 15 minutes.',
      heading: 'Your sign-in link',
      body: `<p style="margin:0 0 12px;">Tap the button below to sign in. The link expires in <strong>15 minutes</strong>.</p>`,
      cta: { label: 'Sign in to LifeOS', url },
      footer: 'If you didn\'t request this email, you can safely ignore it — no one can access your account without the link above.',
    });
    return { subject, text, html };
  },

  passwordReset(token: string): { subject: string; text: string; html: string } {
    const url = `${base()}/reset-password?token=${token}`;
    const subject = 'Reset your LifeOS password';
    const text = [
      'You requested a password reset.',
      '',
      `Open this link to set a new password: ${url}`,
      '',
      'Link expires in 1 hour. If you didn\'t request this, your account is safe — ignore the email.',
    ].join('\n');
    const html = shell({
      preheader: 'Set a new password — link expires in 1 hour.',
      heading: 'Reset your password',
      body: `<p style="margin:0 0 12px;">Click below to set a new password. This link expires in <strong>1 hour</strong>.</p>`,
      cta: { label: 'Set new password', url },
      footer: 'If you didn\'t request this, your account is safe — ignore the email and your current password stays in place.',
    });
    return { subject, text, html };
  },

  invite(workspaceName: string, fromName: string, role: string): { subject: string; text: string; html: string } {
    const subject = `${fromName} invited you to "${workspaceName}" on LifeOS`;
    const url = base();
    const text = [
      `${fromName} added you to the "${workspaceName}" workspace on LifeOS as ${role}.`,
      '',
      `Sign in to start collaborating: ${url}`,
      '',
      'If you don\'t have an account yet, create one at the same URL.',
    ].join('\n');
    const html = shell({
      preheader: `${fromName} added you to ${workspaceName}.`,
      heading: 'You\'re invited',
      body: `<p style="margin:0 0 12px;"><strong>${escapeHtml(fromName)}</strong> added you to <strong>${escapeHtml(workspaceName)}</strong> as <strong>${escapeHtml(role)}</strong>.</p>
             <p style="margin:0 0 12px;">Sign in to start collaborating. If you don't have a LifeOS account yet, sign up with this email address and you'll join automatically.</p>`,
      cta: { label: 'Open workspace', url },
      footer: 'You can leave or change your role from <em>Settings → Workspace</em> at any time.',
    });
    return { subject, text, html };
  },
};
