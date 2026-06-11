import type { Role } from '@questpage/core';

export interface QuestPageClientOptions {
  baseUrl: string;
  apiKey?: string;     // X-API-Key header
  bearerToken?: string; // Authorization: Bearer <jwt>
  fetch?: typeof fetch;
}

export interface ListQuery {
  filters?: Record<string, Record<string, string | number | boolean | null | string[]>>;
  sort?: string;
  page?: number;
  pageSize?: number;
  fields?: string[];
  populate?: string[];
}

export interface ListResponse<T = Record<string, unknown>> {
  data: Array<T & { id: number; createdAt: string; updatedAt: string }>;
  meta: { page: number; pageSize: number; total: number; contentType: string };
}

export interface ContentType {
  id: number;
  workspaceId: number;
  slug: string;
  name: string;
  schema: { fields: Array<{ name: string; type: string; required?: boolean }> };
}

export interface ApiKeyInfo {
  id: number;
  name: string;
  prefix: string;
  role: Role;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export class QuestPageClient {
  private opts: QuestPageClientOptions;
  private f: typeof fetch;

  constructor(opts: QuestPageClientOptions) {
    this.opts = opts;
    this.f = opts.fetch ?? fetch;
  }

  private headers(extra?: HeadersInit): Headers {
    const h = new Headers(extra);
    if (this.opts.apiKey) h.set('X-API-Key', this.opts.apiKey);
    if (this.opts.bearerToken) h.set('Authorization', `Bearer ${this.opts.bearerToken}`);
    return h;
  }

  private url(path: string, query?: Record<string, string | number | undefined>): string {
    const u = new URL(path, this.opts.baseUrl);
    if (query) for (const [k, v] of Object.entries(query)) {
      if (v !== undefined) u.searchParams.set(k, String(v));
    }
    return u.toString();
  }

  async list<T = Record<string, unknown>>(collection: string, query?: ListQuery): Promise<ListResponse<T>> {
    const sp = new URLSearchParams();
    if (query?.sort) sp.set('sort', query.sort);
    if (query?.page) sp.set('pagination[page]', String(query.page));
    if (query?.pageSize) sp.set('pagination[pageSize]', String(query.pageSize));
    if (query?.fields?.length) sp.set('fields', query.fields.join(','));
    if (query?.populate?.length) sp.set('populate', query.populate.join(','));
    if (query?.filters) {
      for (const [field, ops] of Object.entries(query.filters)) {
        for (const [op, value] of Object.entries(ops)) {
          if (Array.isArray(value)) {
            for (const v of value) sp.append(`filters[${field}][${op}]`, String(v));
          } else {
            sp.set(`filters[${field}][${op}]`, String(value));
          }
        }
      }
    }
    const url = new URL(`/api/v1/${collection}`, this.opts.baseUrl);
    url.search = sp.toString();
    const res = await this.f(url.toString(), { headers: this.headers() });
    if (!res.ok) throw await asError(res);
    return res.json();
  }

  async get<T = Record<string, unknown>>(collection: string, id: number): Promise<T & { id: number }> {
    const res = await this.f(this.url(`/api/v1/${collection}/${id}`), { headers: this.headers() });
    if (!res.ok) throw await asError(res);
    return res.json();
  }

  async create<T = Record<string, unknown>>(collection: string, data: Record<string, unknown>): Promise<T & { id: number }> {
    const res = await this.f(this.url(`/api/v1/${collection}`), {
      method: 'POST',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw await asError(res);
    return res.json();
  }

  async update<T = Record<string, unknown>>(collection: string, id: number, patch: Record<string, unknown>): Promise<T & { id: number }> {
    const res = await this.f(this.url(`/api/v1/${collection}/${id}`), {
      method: 'PATCH',
      headers: this.headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw await asError(res);
    return res.json();
  }

  async remove(collection: string, id: number): Promise<{ ok: true; id: number }> {
    const res = await this.f(this.url(`/api/v1/${collection}/${id}`), {
      method: 'DELETE',
      headers: this.headers(),
    });
    if (!res.ok) throw await asError(res);
    return res.json();
  }

  async listContentTypes(): Promise<{ data: ContentType[] }> {
    const res = await this.f(this.url(`/api/v1/content-types`), { headers: this.headers() });
    if (!res.ok) throw await asError(res);
    return res.json();
  }
}

async function asError(res: Response): Promise<Error> {
  const txt = await res.text().catch(() => res.statusText);
  return new Error(`QuestPage API ${res.status}: ${txt}`);
}
