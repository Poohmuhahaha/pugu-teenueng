import { c } from '../colors.js';
import { table, ok, warn, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

interface Me {
  user: { id: number; email: string; name: string };
  actor: { workspaceId: number; role: string };
  memberships: Array<{
    workspaceId: number;
    role: string;
    workspace: { id: number; name: string; slug: string };
  }>;
}

export async function runWorkspaces(args: string[], ctx: Ctx): Promise<void> {
  const api = await ctx.api();
  const me = await api.get<Me>('/api/v1/me');

  // `life ws use <id-or-slug>`
  if (args[0] === 'use') {
    const target = args[1];
    if (!target) { err('usage: ws use <id|slug>'); return; }
    const membership = me.memberships.find(
      (m) => String(m.workspaceId) === target || m.workspace.slug === target,
    );
    if (!membership) { err(`no membership matches "${target}"`); return; }
    type Switched = { ok: boolean; workspaceId: number };
    const res = await api.post<Switched>(`/api/v1/workspaces/${membership.workspaceId}/switch`);
    if (res.ok) ok(`active tavern → ${c.bold(membership.workspace.name)} (${membership.workspace.slug})`);
    else warn('switch returned non-ok response');
    info('note: Workspace Seal sessions are pinned to a single tavern and cannot be switched at runtime.');
    return;
  }

  // Default: list
  table(
    ['', 'id', 'name', 'slug', 'role'],
    me.memberships.map((m) => [
      m.workspaceId === me.actor.workspaceId ? c.green('●') : ' ',
      m.workspaceId,
      m.workspace.name,
      c.dim(m.workspace.slug),
      m.role,
    ]),
  );
  info(`active: ${c.bold(me.memberships.find((m) => m.workspaceId === me.actor.workspaceId)?.workspace.name ?? '?')}`);
}
