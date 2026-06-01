import { json, error } from '@sveltejs/kit';
import { randomBytes } from 'node:crypto';
import { db } from '$lib/server/db';
import { resolveActor, requireRole } from '$lib/server/auth';
import { WebhookCreate } from '@lifeos/core';

export async function GET(event) {
  const actor = await resolveActor(event);
  const hooks = await db.webhook.findMany({
    where: { workspaceId: actor.workspaceId },
    select: {
      id: true, url: true, contentTypeSlug: true, events: true,
      disabledAt: true, createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return json({ data: hooks });
}

export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const parsed = WebhookCreate.safeParse(await event.request.json());
  if (!parsed.success) throw error(400, parsed.error.message);

  const secret = randomBytes(24).toString('hex');
  const hook = await db.webhook.create({
    data: {
      workspaceId: actor.workspaceId,
      url: parsed.data.url,
      contentTypeSlug: parsed.data.contentTypeSlug ?? null,
      events: parsed.data.events,
      secret,
    },
  });
  return json(
    { id: hook.id, url: hook.url, events: hook.events, contentTypeSlug: hook.contentTypeSlug, secret },
    { status: 201, headers: { 'X-LifeOS-Warning': 'Save this signing secret now — used to verify webhook signatures.' } }
  );
}
