import { c } from '../colors.js';
import { table } from '../output.js';
import type { Ctx } from '../cli.js';

interface ContentType {
  id: number;
  slug: string;
  name: string;
  schema: { fields: Array<{ name: string; type: string; required?: boolean }> };
}

export async function runTypes(_args: string[], ctx: Ctx): Promise<void> {
  const api = await ctx.api();
  const res = await api.get<{ data: ContentType[] }>('/api/v1/content-types');
  table(
    ['slug', 'name', 'fields'],
    res.data.map((t) => [
      c.cyan(t.slug),
      t.name,
      c.dim(t.schema.fields.map((f) => `${f.name}:${f.type}`).join(', ')),
    ]),
  );
}
