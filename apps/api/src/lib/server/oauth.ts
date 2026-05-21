/**
 * Google OAuth 2.0 (Authorization Code) — minimal hand-rolled flow.
 * No SDK dependency; uses fetch + the standard token + userinfo endpoints.
 *
 * Required env (cloud only):
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   PUBLIC_BASE_URL  — used to build the redirect URI: ${PUBLIC_BASE_URL}/api/auth/google/callback
 */

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET);
}

export function redirectUri(): string {
  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return `${base.replace(/\/$/, '')}/api/auth/google/callback`;
}

export function buildAuthUrl(state: string): string {
  const u = new URL(AUTH_URL);
  u.searchParams.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID!);
  u.searchParams.set('redirect_uri', redirectUri());
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('scope', 'openid email profile');
  u.searchParams.set('state', state);
  u.searchParams.set('access_type', 'online');
  u.searchParams.set('prompt', 'select_account');
  return u.toString();
}

export interface GoogleUser {
  sub: string;       // stable Google user id
  email: string;
  name: string;
  email_verified: boolean;
  picture?: string;
}

export async function exchangeCode(code: string): Promise<GoogleUser> {
  const tokenRes = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
      client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) throw new Error(`Google token exchange failed: ${tokenRes.status}`);
  const tokens = (await tokenRes.json()) as { access_token: string };

  const userRes = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userRes.ok) throw new Error(`Google userinfo failed: ${userRes.status}`);
  const u = (await userRes.json()) as GoogleUser;
  if (!u.email || !u.email_verified) {
    throw new Error('Google account email is not verified');
  }
  return u;
}
