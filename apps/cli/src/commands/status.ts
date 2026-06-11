import { c } from '../colors.js';
import { info, ok, warn, out } from '../output.js';
import { configPath } from '../config.js';
import { ApiError } from '../api.js';
import type { Ctx } from '../cli.js';

export async function runStatus(_args: string[], ctx: Ctx): Promise<void> {
  const cfg = await ctx.config();
  out.write(`${c.dim('api')}      ${cfg.apiUrl}\n`);
  out.write(`${c.dim('config')}   ${configPath()}\n`);

  if (!cfg.auth) {
    warn('not logged in — run `life login`');
    return;
  }
  out.write(`${c.dim('auth')}     ${cfg.auth.kind === 'apikey' ? 'Workspace Seal' : 'session'} (issued ${cfg.auth.issuedAt})\n`);

  // Live check against /api/v1/me so we catch expired / revoked credentials.
  try {
    const api = await ctx.api();
    type Me = {
      user: { id: number; email: string; name: string };
      actor: { kind: string; workspaceId: number; role: string };
      memberships: Array<{ workspaceId: number; role: string; workspace: { id: number; name: string; slug: string } }>;
    };
    const me = await api.get<Me>('/api/v1/me');
    const ws = me.memberships.find((m) => m.workspaceId === me.actor.workspaceId);
    ok(`signed in as ${c.bold(me.user.email)} ${c.dim(`(#${me.user.id})`)}`);
    out.write(`${c.dim('tavern')}    ${ws?.workspace.name ?? '?'} ${c.dim(`(${ws?.workspace.slug ?? me.actor.workspaceId}, ${me.actor.role})`)}\n`);
    out.write(`${c.dim('memberships')} ${me.memberships.length}\n`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      warn('stored credentials no longer work — run `life login` again');
      return;
    }
    info(`could not reach API (${e instanceof Error ? e.message : String(e)})`);
  }
}
