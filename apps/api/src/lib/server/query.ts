/**
 * Strapi-style query parser for /api/v1/:collection
 *
 * Supports:
 *   ?filters[status][$eq]=done
 *   ?filters[priority][$in]=high&filters[priority][$in]=med
 *   ?sort=createdAt:desc
 *   ?sort=name:asc,createdAt:desc
 *   ?pagination[page]=2&pagination[pageSize]=50
 *   ?fields=title,due           (select only these fields from data)
 *   ?populate=author,tags       (include relations — currently a no-op since
 *                                content entries are JSON-only; reserved for future)
 */

export interface ParsedQuery {
  where: Record<string, unknown>;
  orderBy: Array<{ field: string; dir: 'asc' | 'desc' }>;
  page: number;
  pageSize: number;
  fields: string[] | null;
  populate: string[];
}

const MAX_PAGE_SIZE = 200;
const DEFAULT_PAGE_SIZE = 50;

type FilterOp = '$eq' | '$ne' | '$contains' | '$gt' | '$gte' | '$lt' | '$lte' | '$in' | '$null';

const ALLOWED_OPS: ReadonlySet<FilterOp> = new Set([
  '$eq', '$ne', '$contains', '$gt', '$gte', '$lt', '$lte', '$in', '$null',
]);

function castValue(v: string): unknown {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  return v;
}

export function parseQuery(url: URL): ParsedQuery {
  const sp = url.searchParams;

  // Filters → build a JSONB path query for ContentEntry.data
  const where: Record<string, unknown> = {};
  for (const [key, value] of sp.entries()) {
    const m = key.match(/^filters\[([^\]]+)\]\[(\$\w+)\]$/);
    if (!m) continue;
    const [, field, op] = m;
    if (!ALLOWED_OPS.has(op as FilterOp)) continue;
    if (op === '$in') {
      const all = sp.getAll(key).map(castValue);
      where[`data.${field}`] = { in: all };
    } else if (op === '$null') {
      where[`data.${field}`] = value === 'true' ? { equals: null } : { not: null };
    } else if (op === '$contains') {
      where[`data.${field}`] = { contains: castValue(value) };
    } else {
      const opMap: Record<string, string> = {
        $eq: 'equals', $ne: 'not', $gt: 'gt', $gte: 'gte', $lt: 'lt', $lte: 'lte',
      };
      where[`data.${field}`] = { [opMap[op]]: castValue(value) };
    }
  }

  const orderBy: ParsedQuery['orderBy'] = [];
  const sortRaw = sp.get('sort');
  if (sortRaw) {
    for (const piece of sortRaw.split(',')) {
      const [field, dirRaw] = piece.split(':');
      const dir = (dirRaw ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';
      orderBy.push({ field, dir });
    }
  } else {
    orderBy.push({ field: 'createdAt', dir: 'desc' });
  }

  const page = Math.max(1, parseInt(sp.get('pagination[page]') ?? '1') || 1);
  const rawSize = parseInt(sp.get('pagination[pageSize]') ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, rawSize));

  const fieldsRaw = sp.get('fields');
  const fields = fieldsRaw ? fieldsRaw.split(',').map((s) => s.trim()).filter(Boolean) : null;

  const populateRaw = sp.get('populate');
  const populate = populateRaw ? populateRaw.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return { where, orderBy, page, pageSize, fields, populate };
}

export function projectFields(entry: { id: number; data: unknown; createdAt: Date; updatedAt: Date }, fields: string[] | null) {
  const data = entry.data as Record<string, unknown>;
  if (!fields) return { id: entry.id, ...data, createdAt: entry.createdAt, updatedAt: entry.updatedAt };
  const picked: Record<string, unknown> = { id: entry.id };
  for (const f of fields) if (f in data) picked[f] = data[f];
  picked.createdAt = entry.createdAt;
  picked.updatedAt = entry.updatedAt;
  return picked;
}
