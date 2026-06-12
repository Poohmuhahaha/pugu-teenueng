import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '$lib/server/db';
import { resolveActor, requireRole, generateApiKey } from '$lib/server/auth';

const Create = z.object({
  name: z.string().min(1).max(80),
  role: z.enum(['viewer', 'editor', 'admin']).default('viewer'),
  expiresAt: z.string().datetime().nullable().optional(),
});

export async function GET(event) {
  const actor = await resolveActor(event);
  const keys = await db.apiKey.findMany({
    where: { workspaceId: actor.workspaceId },
    select: {
      id: true, name: true, prefix: true, role: true,
      lastUsedAt: true, expiresAt: true, createdAt: true, revokedAt: true,
      secret: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return json({ data: keys });
}

export async function POST(event) {
  const actor = await resolveActor(event);
  requireRole(actor.role, 'admin');

  const parsed = Create.safeParse(await event.request.json());
  if (!parsed.success) throw error(400, parsed.error.message);

  const { full, prefix, secret } = generateApiKey();
  const hash = await bcrypt.hash(secret, 10);
  const key = await db.apiKey.create({
    data: {
      workspaceId: actor.workspaceId,
      userId: actor.userId,
      name: parsed.data.name,
      prefix,
      hash,
      secret,
      role: parsed.data.role,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  // Return the full key ONCE. Cannot be retrieved later.
  return json(
    { id: key.id, name: key.name, prefix: key.prefix, role: key.role, key: full },
    { status: 201, headers: { 'X-QuestPage-Warning': 'Save this key now - it cannot be retrieved later.' } }
  );
}
