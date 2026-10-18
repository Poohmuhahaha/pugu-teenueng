import { z } from 'zod'
import { customFetch } from '@/api/client'
import {
  ApiErrorResponseSchema,
  BackrefSchema,
  ContentTypeSchema,
  EntryViewSchema,
  MeDtoSchema,
  UserSchema,
} from '@/api/schemas'
import type { Backref as BackrefDto } from '@/api/types/Backref'
import type { ConditionalRuleMeta as ConditionalRuleMetaDto } from '@/api/types/ConditionalRuleMeta'
import type { ContentType as ContentTypeDto } from '@/api/types/ContentType'
import type { Field as FieldDto } from '@/api/types/Field'
import type { FieldFormat as FieldFormatDto } from '@/api/types/FieldFormat'
import type { MeDto } from '@/api/types/MeDto'
import type { Membership as MembershipDto } from '@/api/types/Membership'
import type { MergedRangeMeta as MergedRangeMetaDto } from '@/api/types/MergedRangeMeta'

export type FieldFormat = FieldFormatDto
export type ContentTypeField = Omit<FieldDto, 'required'> & { required?: boolean }
export type ConditionalRuleMeta = ConditionalRuleMetaDto
export type MergedRangeMeta = MergedRangeMetaDto

export interface SheetMeta {
  namedRanges?: Record<string, string>
  conditionalRules?: ConditionalRuleMeta[]
  mergedCells?: MergedRangeMeta[]
  colWidths?: Record<string, number>
}

export type ContentType = Omit<ContentTypeDto, 'workspaceId' | 'kind' | 'schema'> & {
  workspaceId?: number
  kind?: string
  schema: { fields: ContentTypeField[]; meta?: SheetMeta }
}

export interface Entry {
  id: number
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export type Membership = MembershipDto
export type Me = MeDto
export type Backref = Omit<BackrefDto, 'workspaceId' | 'offset'> & {
  workspaceId?: number
  offset?: number
}

const ContentTypeListResponseSchema = z.object({
  data: z.array(ContentTypeSchema),
})

const ContentTypeItemResponseSchema = z.object({
  data: ContentTypeSchema,
})

const EntryListResponseSchema = z.object({
  data: z.array(EntryViewSchema),
  meta: z.object({
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
  }),
})

const EntryItemResponseSchema = z.object({
  data: EntryViewSchema,
})

const BatchEntryResponseSchema = z.object({
  data: z.array(EntryViewSchema),
})

const ImportSheetResponseSchema = z.object({
  data: z.array(EntryViewSchema),
  contentType: ContentTypeSchema.nullable().optional(),
})

const BackrefListResponseSchema = z.object({
  data: z.array(BackrefSchema),
})

const SwitchWorkspaceResponseSchema = z.object({
  data: z.object({
    workspaceId: z.number(),
  }),
})

const RebuildBackrefsResponseSchema = z.object({
  ok: z.boolean(),
  entriesScanned: z.number(),
  resolved: z.number(),
  unresolved: z.number(),
})

async function req<T>(path: string, init: RequestInit = {}, schema?: z.ZodType<T>): Promise<T> {
  const res = await customFetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text()
    let message = text
    try {
      const rawJson: unknown = JSON.parse(text)
      const parsedErr = ApiErrorResponseSchema.safeParse(rawJson)
      if (parsedErr.success) {
        message = parsedErr.data.message || parsedErr.data.error
      } else if (
        typeof rawJson === 'object' &&
        rawJson !== null &&
        ('message' in rawJson || 'error' in rawJson)
      ) {
        const fallback = rawJson as { message?: string; error?: string }
        message = fallback.message ?? fallback.error ?? text
      }
    } catch {
      /* keep raw text */
    }
    throw new Error(message || `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  const payload: unknown = await res.json()
  if (schema) {
    return schema.parse(payload)
  }
  return payload as T
}

export const api = {
  me: () => req<Me>('/api/v1/me', {}, MeDtoSchema),
  login: (email: string, password: string) =>
    req(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      },
      UserSchema,
    ),
  logout: () => req<void>('/api/auth/logout', { method: 'POST' }),
  switchWorkspace: (id: number) =>
    req(
      `/api/v1/workspaces/${id}/switch`,
      { method: 'POST' },
      SwitchWorkspaceResponseSchema,
    ),

  contentTypes: (): Promise<ContentType[]> =>
    req('/api/v1/content-types', {}, ContentTypeListResponseSchema).then((r) => r.data),
  createContentType: (body: {
    slug: string
    name: string
    kind?: string
    schema: { fields: ContentTypeField[]; meta?: SheetMeta }
  }): Promise<{ data: ContentType }> =>
    req(
      '/api/v1/content-types',
      { method: 'POST', body: JSON.stringify(body) },
      ContentTypeItemResponseSchema,
    ),
  updateContentType: (
    id: number,
    body: { name?: string; kind?: string; schema?: { fields: ContentTypeField[]; meta?: SheetMeta } },
  ): Promise<{ data: ContentType }> =>
    req(
      `/api/v1/content-types/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(body),
      },
      ContentTypeItemResponseSchema,
    ),
  deleteContentType: (id: number) => req<void>(`/api/v1/content-types/${id}`, { method: 'DELETE' }),

  entries: (
    slug: string,
    page = 1,
    pageSize = 25,
  ): Promise<{ data: Entry[]; meta: { total: number; page: number; pageSize: number } }> =>
    req(
      `/api/v1/${slug}?pagination[page]=${page}&pagination[pageSize]=${pageSize}`,
      {},
      EntryListResponseSchema,
    ),
  getEntry: (slug: string, id: number): Promise<Entry> =>
    req(`/api/v1/${slug}/${id}`, {}, EntryItemResponseSchema).then((r) => r.data),
  createEntry: (slug: string, data: Record<string, unknown>): Promise<Entry> =>
    req(
      `/api/v1/${slug}`,
      { method: 'POST', body: JSON.stringify(data) },
      EntryItemResponseSchema,
    ).then((r) => r.data),
  updateEntry: (slug: string, id: number, data: Record<string, unknown>): Promise<Entry> =>
    req(
      `/api/v1/${slug}/${id}`,
      { method: 'PATCH', body: JSON.stringify(data) },
      EntryItemResponseSchema,
    ).then((r) => r.data),
  deleteEntry: (slug: string, id: number) => req<void>(`/api/v1/${slug}/${id}`, { method: 'DELETE' }),
  batchEntries: (
    slug: string,
    body: {
      create?: Record<string, unknown>[]
      update?: Array<{ id: number; data: Record<string, unknown> }>
      delete?: number[]
    },
  ): Promise<Entry[]> =>
    req(
      `/api/v1/${slug}/batch`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      BatchEntryResponseSchema,
    ).then((r) => r.data),
  importSheet: (
    slug: string,
    body: { format: 'ods' | 'csv'; content?: string; base64?: string; replace?: boolean },
  ): Promise<{ data: Entry[]; contentType?: ContentType }> =>
    req(
      `/api/v1/${slug}/import`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      ImportSheetResponseSchema,
    ).then((r) => ({
      data: r.data,
      contentType: r.contentType ?? undefined,
    })),
  exportSheetUrl: (slug: string, format: 'ods' | 'csv' = 'ods') =>
    `/api/v1/${slug}/export?format=${format}`,
  backrefs: (to: number): Promise<Backref[]> =>
    req(`/api/v1/backrefs?to=${to}`, {}, BackrefListResponseSchema).then((r) => r.data),
  backrefsAll: (): Promise<Backref[]> =>
    req('/api/v1/backrefs', {}, BackrefListResponseSchema).then((r) => r.data),
  rebuildBackrefs: () =>
    req('/api/v1/backrefs/rebuild', { method: 'POST' }, RebuildBackrefsResponseSchema),
}
