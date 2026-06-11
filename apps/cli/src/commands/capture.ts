import { c } from '../colors.js';
import { ok, err, info } from '../output.js';
import type { Ctx } from '../cli.js';

/**
 * Quick-capture: post a one-liner to the user's "inbox" quest board.
 * Defaults to slug "notes" — overridable with --type=<slug>.
 *
 * Examples:
 *   life capture "Buy oat milk"
 *   life capture "Read this paper" --type=reading
 */

export async function runCapture(args: string[], ctx: Ctx): Promise<void> {
  let target = 'notes';
  const text: string[] = [];
  for (const a of args) {
    const m = a.match(/^--type=(.+)$/);
    if (m) target = m[1];
    else text.push(a);
  }
  const body = text.join(' ').trim();
  if (!body) { err('usage: capture "<text>" [--type=<slug>]'); return; }

  const api = await ctx.api();
  try {
    const res = await api.post<{ id: number }>(`/api/v1/${encodeURIComponent(target)}`, {
      title: body.length > 80 ? body.slice(0, 77) + '…' : body,
      body,
    });
    ok(`captured to ${c.cyan(target)} #${res.id}`);
  } catch (e) {
    err(e instanceof Error ? e.message : String(e));
    info(`tip: pass --type=<slug> to target a specific quest type (default: "notes")`);
  }
}
