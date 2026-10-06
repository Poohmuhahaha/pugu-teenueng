export interface FieldFormat {
  number?: 'plain' | 'currency' | 'percent'
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  size?: number
  decimals?: number
  align?: 'left' | 'center' | 'right'
  wrap?: boolean
  color?: string
  bg?: string
}

export interface ContentTypeField {
  name: string
  type: string
  required?: boolean
  options?: string[]
  format?: FieldFormat
}

export interface ContentType {
  id: number
  slug: string
  name: string
  kind?: 'document' | 'spreadsheet'
  schema: { fields: ContentTypeField[] }
  createdAt: string
  updatedAt: string
}

export interface Entry {
  id: number
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export interface Membership {
  role: string
  workspace: { id: number; name: string; slug: string }
}

export interface Me {
  actor: { id: number; name: string; email: string; workspaceId?: number }
  memberships: Membership[]
}

export interface Backref {
  id: number
  fromEntryId: number
  toEntryId: number | null
  targetName: string | null
  alias?: string | null
  offset?: number
  context?: string | null
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try {
      message = JSON.parse(text).error ?? text
    } catch {
      /* keep raw */
    }
    throw new Error(message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  me: () => req<Me>('/api/v1/me'),
  login: (email: string, password: string) =>
    req<{ id: number; name: string; email: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => req<void>('/api/auth/logout', { method: 'POST' }),
  switchWorkspace: (id: number) =>
    req<{ data: { workspaceId: number } }>(`/api/v1/workspaces/${id}/switch`, { method: 'POST' }),

  contentTypes: () => req<{ data: ContentType[] }>('/api/v1/content-types').then((r) => r.data),
  createContentType: (body: { slug: string; name: string; kind?: string; schema: { fields: ContentTypeField[] } }) =>
    req<{ data: ContentType }>('/api/v1/content-types', { method: 'POST', body: JSON.stringify(body) }),
  updateContentType: (
    id: number,
    body: { name?: string; kind?: string; schema?: { fields: ContentTypeField[] } },
  ) =>
    req<{ data: ContentType }>(`/api/v1/content-types/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  deleteContentType: (id: number) => req<void>(`/api/v1/content-types/${id}`, { method: 'DELETE' }),

  entries: (slug: string, page = 1, pageSize = 25) =>
    req<{ data: Entry[]; meta: { total: number; page: number; pageSize: number } }>(
      `/api/v1/${slug}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
    ),
  getEntry: (slug: string, id: number) => req<{ data: Entry }>(`/api/v1/${slug}/${id}`).then((r) => r.data),
  createEntry: (slug: string, data: Record<string, unknown>) =>
    req<{ data: Entry }>(`/api/v1/${slug}`, { method: 'POST', body: JSON.stringify(data) }).then((r) => r.data),
  updateEntry: (slug: string, id: number, data: Record<string, unknown>) =>
    req<{ data: Entry }>(`/api/v1/${slug}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then((r) => r.data),
  deleteEntry: (slug: string, id: number) => req<void>(`/api/v1/${slug}/${id}`, { method: 'DELETE' }),
  backrefs: (to: number) => req<{ data: Backref[] }>(`/api/v1/backrefs?to=${to}`).then((r) => r.data),
  backrefsAll: () => req<{ data: Backref[] }>('/api/v1/backrefs').then((r) => r.data),
  rebuildBackrefs: () =>
    req<{ ok: boolean; entriesScanned: number; resolved: number; unresolved: number }>(
      '/api/v1/backrefs/rebuild',
      { method: 'POST' },
    ),
}
