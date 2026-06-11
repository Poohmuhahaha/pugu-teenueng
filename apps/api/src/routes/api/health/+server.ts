import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';

export const GET = async () => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';
  try {
    await db.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    dbStatus = 'disconnected';
  }

  return json({
    ok: true,
    service: 'questpage-api',
    version: '0.0.1',
    db: dbStatus,
    ts: Date.now(),
  });
};
