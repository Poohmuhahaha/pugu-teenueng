import { ask, confirm } from '../prompts.js';
import { c } from '../colors.js';
import { ok, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

interface ContentType {
  slug: string;
  name: string;
  schema: { fields: Array<{ name: string; type: string; required?: boolean }> };
}

export async function runNew(args: string[], ctx: Ctx): Promise<void> {
  const type = args[0];
  if (!type) { err('usage: new <type>'); return; }

  const api = await ctx.api();
  const types = await api.get<{ data: ContentType[] }>('/api/v1/content-types');
  const ct = types.data.find((t) => t.slug === type);
  if (!ct) { err(`unknown content type "${type}"`); return; }

  info(`Creating a ${c.bold(ct.name)} entry. Press enter to skip optional fields.`);

  const payload: Record<string, unknown> = {};
  for (const f of ct.schema.fields) {
    const label = `${f.name}${f.required ? c.red('*') : ''} (${c.dim(f.type)})`;
    if (f.type === 'checkbox') {
      const v = await confirm(`  ${label}?`, false);
      if (v !== null) payload[f.name] = v;
      continue;
    }
    const raw = await ask(`  ${label}`);
    if (!raw) {
      if (f.required) { err(`${f.name} is required`); return; }
      continue;
    }
    payload[f.name] = coerce(raw, f.type);
  }

  if (Object.keys(payload).length === 0) { err('nothing to create'); return; }

  const created = await api.post<{ id: number }>(`/api/v1/${encodeURIComponent(ct.slug)}`, payload);
  ok(`created ${ct.slug} #${created.id}`);
}

function coerce(raw: string, type: string): unknown {
  switch (type) {
    case 'number': {
      const n = Number(raw);
      return Number.isFinite(n) ? n : raw;
    }
    case 'checkbox':
      return /^(y|yes|true|1)$/i.test(raw);
    case 'date':
      return raw; // ISO string passthrough
    default:
      return raw;
  }
}
