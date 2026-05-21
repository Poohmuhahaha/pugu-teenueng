import { json, error } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { resolveActor, requireRole, type Role } from '$lib/server/auth';
import { sendEmail, emailTemplates } from '$lib/server/email';
import { enforceMemberCap } from '$lib/server/limits';

const InviteInput = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'editor', 'viewer', 'member']).default('member'),
});

const PatchInput = z.object({
  userId: z.number().int(),
  role: z.enum(['admin', 'editor', 'viewer', 'member']),
});

async function loadMyMembership(workspaceId: number, userId: number) {
  const m = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  return m ? (m.role as Role) : null;
}

export async function GET(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  const myRole = await loadMyMembership(workspaceId, actor.userId);
  if (!myRole) throw error(403, 'Not a member');

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: 'asc' },
  });
  return json(
    members.map((m) => ({
      userId: m.userId, role: m.role, name: m.user.name, email: m.user.email,
    }))
  );
}

/**
 * POST /api/v1/workspaces/[id]/members
 * Add an existing user as a member, or — if no user with that email exists yet —
 * send a "we invited you to LifeOS" email. The actual join happens on signup
 * via PendingInvite resolution (see `ensurePersonalWorkspace` callers).
 */
export async function POST(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  const myRole = await loadMyMembership(workspaceId, actor.userId);
  if (!myRole) throw error(403, 'Not a member');
  requireRole(myRole, 'admin');

  const body = InviteInput.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await enforceMemberCap(workspaceId);

  const ws = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) throw error(404, 'Workspace not found');

  const inviter = await db.user.findUnique({ where: { id: actor.userId } });
  const user = await db.user.findUnique({ where: { email: body.data.email } });

  if (user) {
    const member = await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId, userId: user.id } },
      update: { role: body.data.role },
      create: { workspaceId, userId: user.id, role: body.data.role },
    });
    const tmpl = emailTemplates.invite(ws.name, inviter?.name ?? 'Someone', body.data.role);
    sendEmail({ to: user.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html }).catch(() => {});
    return json({ userId: user.id, role: member.role, name: user.name, email: user.email, status: 'added' }, { status: 201 });
  }

  // User doesn't exist yet — send an invite email pointing at signup
  const tmpl = emailTemplates.invite(ws.name, inviter?.name ?? 'Someone', body.data.role);
  await sendEmail({ to: body.data.email, subject: tmpl.subject, text: tmpl.text, html: tmpl.html });
  return json({ email: body.data.email, role: body.data.role, status: 'invited' }, { status: 201 });
}

export async function PATCH(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  const myRole = await loadMyMembership(workspaceId, actor.userId);
  if (!myRole) throw error(403, 'Not a member');
  requireRole(myRole, 'admin');

  const body = PatchInput.safeParse(await event.request.json());
  if (!body.success) throw error(400, body.error.message);

  await db.workspaceMember.update({
    where: { workspaceId_userId: { workspaceId, userId: body.data.userId } },
    data: { role: body.data.role },
  });
  return json({ ok: true });
}

export async function DELETE(event) {
  const actor = await resolveActor(event);
  const workspaceId = parseInt(event.params.id);
  const myRole = await loadMyMembership(workspaceId, actor.userId);
  if (!myRole) throw error(403, 'Not a member');
  requireRole(myRole, 'admin');

  const body = z.object({ userId: z.number().int() }).safeParse(await event.request.json().catch(() => ({})));
  if (!body.success) throw error(400, 'userId required');

  // Prevent removing the last owner
  const owners = await db.workspaceMember.count({ where: { workspaceId, role: 'owner' } });
  const target = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: body.data.userId } },
  });
  if (target?.role === 'owner' && owners <= 1) {
    throw error(409, 'Cannot remove the last owner. Transfer ownership first.');
  }

  await db.workspaceMember.delete({
    where: { workspaceId_userId: { workspaceId, userId: body.data.userId } },
  });
  return json({ ok: true });
}
