import { c } from '../colors.js';
import { out, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

export async function runCat(args: string[], ctx: Ctx): Promise<void> {
  const [type, id, ...rest] = args;
  if (!type || !id) { err('usage: cat <type> <id> [--json]'); return; }
  const asJson = rest.includes('--json');

  const api = await ctx.api();
  const entry = await api.get<Record<string, unknown>>(`/api/v1/${encodeURIComponent(type)}/${encodeURIComponent(id)}`);

  if (asJson) {
    out.write(JSON.stringify(entry, null, 2) + '\n');
    return;
  }

  // Pretty-print: id + meta + each field on its own line
  out.write(`${c.dim('id')}        ${entry.id}\n`);
  if (entry.createdAt) out.write(`${c.dim('created')}   ${entry.createdAt}\n`);
  if (entry.updatedAt) out.write(`${c.dim('updated')}   ${entry.updatedAt}\n`);
  out.write('\n');

  const skip = new Set(['id', 'workspaceId', 'createdAt', 'updatedAt', 'createdById', 'deletedAt']);
  for (const [k, v] of Object.entries(entry)) {
    if (skip.has(k)) continue;
    const label = k.padEnd(10);
    const val = typeof v === 'string' ? v : JSON.stringify(v);
    out.write(`${c.cyan(label)} ${val}\n`);
  }

  // Backrefs
  try {
    type Refs = { data: Array<{ id: number; fromEntryId: number; toEntryId: number | null }> };
    const incoming = await api.get<Refs>(`/api/v1/backrefs?to=${entry.id}`);
    const outgoing = await api.get<Refs>(`/api/v1/backrefs?from=${entry.id}`);
    info(`${incoming.data.length} incoming · ${outgoing.data.length} outgoing wiki links`);
  } catch {
    // Backref endpoint may not exist on every install — silently skip
  }
}
