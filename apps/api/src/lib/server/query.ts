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

  // Filters → build a JSONB path query for ContentEntry.data.
  // Prisma JSON filters use the shape: { data: { path: ['field'], <op>: value } }.
  // We accumulate one AND clause per filter so multiple filters on different fields compose.
  const FIELD_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  const andClauses: Array<Record<string, unknown>> = [];
  const seenInKeys = new Set<string>();
  for (const [key, value] of sp.entries()) {
    const m = key.match(/^filters\[([^\]]+)\]\[(\$\w+)\]$/);
    if (!m) continue;
    const [, field, op] = m;
    if (!ALLOWED_OPS.has(op as FilterOp)) continue;
    // Strict identifier whitelist — field names get used as JSON path keys.
    if (!FIELD_NAME.test(field)) continue;
    if (op === '$in') {
      // Deduplicate: getAll() returns all values for the key in one shot.
      if (seenInKeys.has(key)) continue;
      seenInKeys.add(key);
      const all = sp.getAll(key).map(castValue);
      // $in means "field value matches ANY of these" — Prisma's array_contains
      // checks the OPPOSITE (the stored JSON array contains a value), which is
      // wrong here. Expand to an OR of scalar equality checks.
      andClauses.push({ OR: all.map((v) => ({ data: { path: [field], equals: v } })) });
    } else if (op === '$null') {
      andClauses.push({ data: value === 'true' ? { path: [field], equals: null } : { path: [field], not: null } });
    } else if (op === '$contains') {
      andClauses.push({ data: { path: [field], string_contains: String(castValue(value)) } });
    } else {
      const opMap: Record<string, string> = {
        $eq: 'equals', $ne: 'not', $gt: 'gt', $gte: 'gte', $lt: 'lt', $lte: 'lte',
      };
      andClauses.push({ data: { path: [field], [opMap[op]]: castValue(value) } });
    }
  }
  const where: Record<string, unknown> = andClauses.length ? { AND: andClauses } : {};

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
  // Strict identifier whitelist — these names get used as object keys when
  // projecting, so reject anything that isn't a plain identifier. Reuses the
  // FIELD_NAME regex declared above for filter-key validation.
  const fields = fieldsRaw
    ? fieldsRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && FIELD_NAME.test(s))
    : null;

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
