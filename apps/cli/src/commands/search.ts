import { c } from '../colors.js';
import { table, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

interface SearchHit {
  id: number;
  contentTypeSlug: string;
  title?: string;
  excerpt?: string;
  score?: number;
}

export async function runSearch(args: string[], ctx: Ctx): Promise<void> {
  const q = args.join(' ').trim();
  if (!q) { err('usage: search "<query>"'); return; }

  const api = await ctx.api();
  const res = await api.get<{ data: SearchHit[] }>(`/api/v1/search?q=${encodeURIComponent(q)}`);

  if (!res.data?.length) { info('no matches'); return; }

  table(
    ['type', 'id', 'title', 'excerpt'],
    res.data.map((h) => [
      c.cyan(h.contentTypeSlug),
      h.id,
      h.title ?? '',
      c.dim((h.excerpt ?? '').slice(0, 60)),
    ]),
  );
}
