import { json } from '@sveltejs/kit';

export const GET = async () =>
  json({ ok: true, service: 'lifeos-api', version: '0.0.1', ts: Date.now() });
