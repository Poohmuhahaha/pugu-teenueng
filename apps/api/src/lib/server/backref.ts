import { db } from './db';
import { parseWikiLinks } from '@questpage/core';

const CONTEXT_RADIUS = 80;

/**
 * Rebuild Backref rows for a given ContentEntry by scanning all string-valued
 * fields of `data` for `[[wiki-link]]` references.
 *
 * Resolution: tries to match the target name against any entry in the same
 * workspace whose `data.title` equals (case-insensitive) the target. Unresolved
 * targets land as Backref rows with `toEntryId = null` + `targetName` populated.
 */
export async function rebuildBackrefs(entryId: number): Promise<{ resolved: number; unresolved: number }> {
  const entry = await db.contentEntry.findUnique({ where: { id: entryId } });
  if (!entry) return { resolved: 0, unresolved: 0 };

  const data = entry.data as Record<string, unknown>;
  const links: { target: string; alias?: string; offset: number; context: string }[] = [];
  for (const value of Object.values(data)) {
    if (typeof value !== 'string') continue;
    for (const l of parseWikiLinks(value)) {
      const ctxStart = Math.max(0, l.offset - CONTEXT_RADIUS);
      const ctxEnd = Math.min(value.length, l.offset + CONTEXT_RADIUS);
      links.push({ ...l, context: value.slice(ctxStart, ctxEnd) });
    }
  }

  // Wipe existing outgoing refs and re-insert (small N expected per entry)
  await db.backref.deleteMany({ where: { fromEntryId: entryId } });
  if (links.length === 0) return { resolved: 0, unresolved: 0 };

  // Resolution heuristic: look up entries in the same workspace with a `title` field.
  const candidates = await db.contentEntry.findMany({
    where: {
      workspaceId: entry.workspaceId,
      deletedAt: null,
      NOT: { id: entryId },
    },
    select: { id: true, data: true },
  });
  const byTitle = new Map<string, number>();
  for (const c of candidates) {
    const title = (c.data as Record<string, unknown>).title;
    if (typeof title === 'string') byTitle.set(title.toLowerCase(), c.id);
  }

  let resolved = 0;
  let unresolved = 0;
  for (const link of links) {
    const targetId = byTitle.get(link.target.toLowerCase()) ?? null;
    if (targetId) resolved += 1; else unresolved += 1;
    await db.backref.create({
      data: {
        workspaceId: entry.workspaceId,
        fromEntryId: entryId,
        toEntryId: targetId,
        targetName: targetId ? null : link.target,
        alias: link.alias ?? null,
        offset: link.offset,
        context: link.context,
      },
    });
  }
  return { resolved, unresolved };
}
