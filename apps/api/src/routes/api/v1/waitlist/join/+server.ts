import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';

const Body = z.object({
  email: z.string().email(),
  utmSource: z.string().max(80).nullable().optional(),
  utmCampaign: z.string().max(80).nullable().optional(),
  ref: z.string().max(80).nullable().optional(),
});

/**
 * POST /api/v1/waitlist/join — public endpoint, no auth required.
 * Idempotent on email (upsert).
 */
export async function POST({ request }) {
  const body = Body.safeParse(await request.json());
  if (!body.success) throw error(400, body.error.message);

  const entry = await db.waitlistEntry.upsert({
    where: { email: body.data.email.toLowerCase() },
    update: {
      utmSource: body.data.utmSource ?? undefined,
      utmCampaign: body.data.utmCampaign ?? undefined,
      ref: body.data.ref ?? undefined,
    },
    create: {
      email: body.data.email.toLowerCase(),
      utmSource: body.data.utmSource ?? null,
      utmCampaign: body.data.utmCampaign ?? null,
      ref: body.data.ref ?? null,
    },
  });
  return json({ ok: true, id: entry.id }, { status: 201 });
}
