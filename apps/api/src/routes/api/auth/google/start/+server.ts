import { redirect, error } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { buildAuthUrl, isConfigured } from '$lib/server/oauth';

export async function GET({ cookies }) {
  if (!isConfigured()) throw error(503, 'Google sign-in not configured on this instance');

  const state = randomBytes(16).toString('hex');
  cookies.set('lifeos_oauth_state', state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 600,
  });
  throw redirect(303, buildAuthUrl(state));
}
