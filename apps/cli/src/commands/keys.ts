import { ask, confirm } from '../prompts.js';
import { c } from '../colors.js';
import { table, ok, err, info, out } from '../output.js';
import type { Ctx } from '../cli.js';

interface ApiKey {
  id: number;
  name: string;
  prefix: string;
  role: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export async function runKeys(args: string[], ctx: Ctx): Promise<void> {
  const sub = args[0] ?? 'list';

  if (sub === 'list' || sub === 'ls') {
    const api = await ctx.api();
    const res = await api.get<{ data: ApiKey[] }>('/api/v1/api-keys');
    if (!res.data.length) { info('no Workspace Seals yet — run `keys new`'); return; }
    table(
      ['id', 'name', 'prefix', 'role', 'last used', 'status'],
      res.data.map((k) => [
        k.id,
        k.name,
        c.dim(`${k.prefix}.•••`),
        k.role,
        c.dim(k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'never'),
        k.revokedAt ? c.red('revoked') : c.green('active'),
      ]),
    );
    return;
  }

  if (sub === 'new' || sub === 'create') {
    const name = await ask('Name (e.g. "CI deploy bot")');
    if (!name) { err('aborted'); return; }
    const role = (await ask('Role [viewer|member|editor|admin]', 'editor')).toLowerCase();
    if (!['viewer', 'member', 'editor', 'admin'].includes(role)) {
      err(`invalid role: ${role}`); return;
    }
    const api = await ctx.api();
    const created = await api.post<{ id: number; key: string; prefix: string }>('/api/v1/api-keys', { name, role });
    ok(`created #${created.id}`);
    out.write('\n');
    out.write(c.yellow('  Save this Workspace Seal now — it will not be shown again:\n\n'));
    out.write(`    ${c.bold(created.key)}\n\n`);
    return;
  }

  if (sub === 'revoke') {
    const id = parseInt(args[1] ?? '', 10);
    if (!Number.isFinite(id)) { err('usage: keys revoke <id>'); return; }
    if (!(await confirm(`Revoke Workspace Seal #${id}?`, false))) { info('cancelled'); return; }
    const api = await ctx.api();
    await api.delete(`/api/v1/api-keys/${id}`);
    ok(`revoked #${id}`);
    return;
  }

  err(`unknown subcommand: ${sub}\nusage: keys [list|new|revoke <id>]`);
}
