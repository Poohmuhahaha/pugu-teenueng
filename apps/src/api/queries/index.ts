// apps/vue/src/api/queries/index.ts — TanStack Query Hooks (SOP §0.1, §0.2 Step 6, §10.1)
import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import type { ExtraSheetData } from '@huuk/tables/hf'
import { api, type ContentType, type ContentTypeField, type Entry, type SheetMeta } from '@/lib/api'

export interface LeadDeskPayload {
  types: ContentType[]
  entries: Entry[]
}

export function useLeadDeskQuery() {
  return useQuery({
    queryKey: ['lead-desk'],
    queryFn: async (): Promise<LeadDeskPayload> => {
      const types = await api.contentTypes()
      const first = types[0]
      const entries = first ? (await api.entries(first.slug, 1, 5)).data : []
      return { types, entries }
    },
  })
}

export function useContentTypesQuery() {
  return useQuery({
    queryKey: ['content-types'],
    queryFn: () => api.contentTypes(),
  })
}

export function useEntriesQuery(
  slug: MaybeRefOrGetter<string>,
  page: MaybeRefOrGetter<number>,
  pageSize = 12,
) {
  return useQuery({
    queryKey: computed(() => ['entries', toValue(slug), toValue(page), pageSize] as const),
    queryFn: () => api.entries(toValue(slug), toValue(page), pageSize),
    enabled: computed(() => Boolean(toValue(slug))),
  })
}

export interface GraphNodeItem {
  id: number
  label: string
  group: string
}

export interface GraphEdgeItem {
  source: number
  target: number
}

export interface GraphDataPayload {
  nodes: GraphNodeItem[]
  edges: GraphEdgeItem[]
  colors: Record<string, string>
}

const GRAPH_PALETTE = [
  'var(--c-graph-1)',
  'var(--c-graph-2)',
  'var(--c-graph-3)',
  'var(--c-graph-4)',
  'var(--c-graph-5)',
  'var(--c-graph-6)',
  'var(--c-graph-7)',
  'var(--c-graph-8)',
]

export function useGraphDataQuery() {
  return useQuery({
    queryKey: ['graph-data'],
    queryFn: async (): Promise<GraphDataPayload> => {
      const types = await api.contentTypes()
      const colors: Record<string, string> = {}
      types.forEach((t, i) => {
        colors[t.slug] = GRAPH_PALETTE[i % GRAPH_PALETTE.length]
      })

      const nodes: GraphNodeItem[] = []
      for (const t of types) {
        const res = await api.entries(t.slug, 1, 200)
        for (const e of res.data) {
          nodes.push({
            id: e.id,
            label: String(e.title ?? e.name ?? `#${e.id}`).slice(0, 40),
            group: t.slug,
          })
        }
      }

      const known = new Set(nodes.map((n) => n.id))
      const refs = await api.backrefsAll()
      const edges: GraphEdgeItem[] = refs
        .filter((r): r is typeof r & { toEntryId: number } =>
          r.toEntryId !== null && known.has(r.fromEntryId) && known.has(r.toEntryId),
        )
        .map((r) => ({ source: r.fromEntryId, target: r.toEntryId }))

      return { nodes, edges, colors }
    },
  })
}

export interface SheetWorkspacePayload {
  types: ContentType[]
  rows: Entry[]
  extraSheets: ExtraSheetData[]
  workspaceEntries: Entry[]
}

export function useSheetWorkspaceQuery(slug: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => ['sheet-workspace', toValue(slug)] as const),
    queryFn: async (): Promise<SheetWorkspacePayload> => {
      const currentSlug = toValue(slug)
      const types = await api.contentTypes()
      const targetType = types.find((t) => t.slug === currentSlug) ?? null
      const rows = targetType ? [...(await api.entries(currentSlug, 1, 1000)).data] : []

      const extras: ExtraSheetData[] = []
      const allEnts: Entry[] = []
      for (const ct of types) {
        if (ct.slug === currentSlug) continue
        try {
          const r = await api.entries(ct.slug, 1, 200)
          allEnts.push(...r.data)
          if (ct.kind === 'spreadsheet') {
            const colNames = new Set<string>(ct.schema.fields.map((f) => f.name))
            for (const row of r.data) {
              for (const k of Object.keys(row)) {
                if (!k.startsWith('_') && k !== 'id' && k !== 'createdAt' && k !== 'updatedAt') {
                  colNames.add(k)
                }
              }
            }
            const cols = Array.from(colNames).map((name) => ({ name }))
            extras.push({ slug: ct.slug, name: ct.name, columns: cols, rows: r.data })
          }
        } catch {
          // ignore companion sheet fetch error
        }
      }

      return {
        types,
        rows,
        extraSheets: extras,
        workspaceEntries: [...rows, ...allEnts],
      }
    },
    enabled: computed(() => Boolean(toValue(slug))),
  })
}

export function useCreateContentTypeMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: {
      slug: string
      name: string
      kind?: string
      schema: { fields: ContentTypeField[]; meta?: SheetMeta }
    }) => api.createContentType(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['content-types'] })
      void queryClient.invalidateQueries({ queryKey: ['lead-desk'] })
      void queryClient.invalidateQueries({ queryKey: ['sheet-workspace'] })
    },
  })
}
