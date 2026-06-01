import { c } from '../colors.js';
import { table, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

interface ListResult {
  data: Array<Record<string, unknown> & { id: number; createdAt: string; updatedAt: string }>;
  meta: { pagination: { page: number; pageSize: number; total: number; pageCount: number } };
}

function parseFlags(args: string[]): { positional: string[]; flags: Record<string, string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  for (const a of args) {
    const m = a.match(/^--([^=]+)=(.*)$/);
    if (m) flags[m[1]] = m[2];
    else if (a.startsWith('--')) flags[a.slice(2)] = 'true';
    else positional.push(a);
  }
  return { positional, flags };
}

export async function runLs(args: string[], ctx: Ctx): Promise<void> {
  const { positional, flags } = parseFlags(args);
  const type = positional[0];
  if (!type) { err('usage: ls <type> [--page=1] [--size=25] [--fields=title,status]'); return; }

  const page = parseInt(flags.page ?? '1', 10) || 1;
  const size = parseInt(flags.size ?? '25', 10) || 25;
  const fieldsArg = flags.fields ? flags.fields.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const qs = new URLSearchParams({
    'pagination[page]': String(page),
    'pagination[pageSize]': String(size),
    'sort': 'updatedAt:desc',
  });
  const api = await ctx.api();
  const res = await api.get<ListResult>(`/api/v1/${encodeURIComponent(type)}?${qs.toString()}`);

  const inferred =
    fieldsArg ??
    (() => {
      const sample = res.data[0] ?? {};
      const skip = new Set(['id', 'workspaceId', 'createdAt', 'updatedAt', 'createdById', 'deletedAt']);
      return Object.keys(sample).filter((k) => !skip.has(k)).slice(0, 3);
    })();

  const headers = ['id', ...inferred, 'updated'];
  const rows = res.data.map((row) => {
    const cells: Array<string | number> = [c.dim(String(row.id))];
    for (const f of inferred) {
      const v = row[f];
      cells.push(v === undefined || v === null ? '' : String(v));
    }
    cells.push(c.dim(new Date(row.updatedAt).toLocaleDateString()));
    return cells;
  });

  table(headers, rows);
  info(
    `page ${res.meta.pagination.page}/${res.meta.pagination.pageCount} · ` +
      `${res.data.length} of ${res.meta.pagination.total} total`,
  );
}
