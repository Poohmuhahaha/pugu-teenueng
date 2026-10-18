<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Skeleton from '@huuk/ui/Skeleton.vue'
import Alert from '@huuk/ui/Alert.vue'
import Button from '@huuk/ui/Button.vue'
import Select from '@huuk/ui/Select.vue'
import Toolbar from '@huuk/ui/Toolbar.vue'
import MenuBar from '@huuk/ui/MenuBar.vue'
import FormulaBar from '@huuk/ui/FormulaBar.vue'
import Tabs from '@huuk/ui/Tabs.vue'
import NavList from '@huuk/ui/NavList.vue'
import SheetGrid, {
  type BatchCellPatch,
  type ConditionalRule,
  type SheetColumn,
} from '@huuk/tables/SheetGrid.vue'
import PivotChartDrawer from '@huuk/tables/PivotChartDrawer.vue'
import type { ExtraSheetData } from '@huuk/tables/hf'
import { useSheetWorkspaceQuery } from '@/api/queries'
import {
  api,
  type ContentType,
  type Entry,
  type FieldFormat,
  type SheetMeta,
} from '@/lib/api'

const route = useRoute()
const router = useRouter()

const DEFAULT_INK_COLOR = 'var(--c-ink)'
const DEFAULT_SURFACE_COLOR = 'var(--c-canvas)'

const slug = computed(() => String(route.params.slug ?? ''))
const types = ref<ContentType[]>([])
const rows = ref<Entry[]>([])
const extraSheets = ref<ExtraSheetData[]>([])
const workspaceEntries = ref<Entry[]>([])

const {
  data: sheetData,
  isPending,
  isError,
  error,
  refetch,
} = useSheetWorkspaceQuery(slug)

watch(
  sheetData,
  (val) => {
    if (!val) return
    types.value = [...val.types]
    rows.value = [...val.rows]
    extraSheets.value = [...val.extraSheets]
    workspaceEntries.value = [...val.workspaceEntries]
  },
  { immediate: true },
)

const type = computed(() => types.value.find((t) => t.slug === slug.value) ?? null)

function colLetter(i: number): string {
  let s = ''
  let n = i
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

// Hybrid Schema + Sparse Coordinate Columns (always at least 26 columns A..Z)
const sheetColumns = computed<SheetColumn[]>(() => {
  const cols: SheetColumn[] = []
  const seen = new Set<string>()

  // 1. Schema fields first (keeps full compatibility with EntriesPage database view)
  for (const f of type.value?.schema.fields ?? []) {
    seen.add(f.name)
    cols.push({
      name: f.name,
      label: f.name,
      type: f.type,
      options: f.options,
      format: f.format,
    })
  }

  // 2. Any extra keys already present in rows
  for (const row of rows.value) {
    for (const k of Object.keys(row)) {
      if (k.startsWith('_') || k === 'id' || k === 'createdAt' || k === 'updatedAt') continue
      const v = row[k]
      if (v === null || v === undefined) continue
      if (!seen.has(k)) {
        seen.add(k)
        cols.push({ name: k })
      }
    }
  }

  // 3. Pad to at least 26 columns (A..Z) using coordinate keys ('a', 'b', ...)
  const targetCount = Math.max(26, cols.length)
  for (let i = cols.length; i < targetCount; i++) {
    let candidate = colLetter(i).toLowerCase()
    let suffix = i
    while (seen.has(candidate)) {
      suffix++
      candidate = colLetter(suffix).toLowerCase()
    }
    seen.add(candidate)
    cols.push({ name: candidate })
  }

  return cols
})

const columns = computed<string[]>(() => sheetColumns.value.map((c) => c.name))

// Sheet metadata (Named Ranges, Conditional Formatting, Merged Cells, Column Widths)
const sheetMeta = ref<SheetMeta>({
  namedRanges: {},
  conditionalRules: [],
  mergedCells: [],
  colWidths: {},
})

watch(
  type,
  (t) => {
    const m = t?.schema?.meta
    sheetMeta.value = {
      namedRanges: { ...(m?.namedRanges ?? {}) },
      conditionalRules: [...(m?.conditionalRules ?? [])],
      mergedCells: [...(m?.mergedCells ?? [])],
      colWidths: { ...(m?.colWidths ?? {}) },
    }
  },
  { immediate: true },
)

async function persistMeta() {
  if (!type.value) return
  try {
    const { data: updated } = await api.updateContentType(type.value.id, {
      schema: {
        fields: type.value.schema.fields,
        meta: sheetMeta.value,
      },
    })
    const idx = types.value.findIndex((t) => t.id === updated.id)
    if (idx !== -1) types.value[idx] = updated
  } catch {
    /* ignore transient save error */
  }
}

const dbItems = computed(() => [
  { id: '', label: 'Overview' },
  ...types.value.map((t) => ({
    id: t.slug,
    label: t.name,
    meta: t.kind === 'spreadsheet' ? 'sheet' : 'doc',
  })),
])

function openItem(id?: string) {
  if (!id) {
    router.push('/entries')
    return
  }
  const t = types.value.find((x) => x.slug === id)
  if (!t) return
  if (t.kind === 'spreadsheet') router.push(`/sheet/${t.slug}`)
  else router.push({ path: '/entries', query: { type: t.slug } })
}

async function load() {
  await refetch()
}

function resolveEntry(target: string, field?: string): unknown {
  const q = target.trim().toLowerCase()
  const pool = [...rows.value, ...workspaceEntries.value]
  const found = pool.find((e) => {
    const title = String(e.title ?? e.name ?? e.a ?? '').trim().toLowerCase()
    return title === q
  })
  if (!found) return undefined
  if (field && found[field] !== undefined) return found[field]
  return found.title ?? found.estimate ?? found.status ?? found.description ?? ''
}

// ---- Undo / Redo Command Stack -----------------------------------------
interface HistoryStep {
  patches: Array<{ r: number; field: string; prev: string; next: string }>
}
const undoStack = ref<HistoryStep[]>([])
const redoStack = ref<HistoryStep[]>([])

function recordHistory(patches: Array<{ r: number; field: string; prev: string; next: string }>) {
  const meaningful = patches.filter((p) => p.prev !== p.next)
  if (!meaningful.length) return
  undoStack.value.push({ patches: meaningful })
  if (undoStack.value.length > 100) undoStack.value.shift()
  redoStack.value = []
}

async function applyCellPatches(changes: BatchCellPatch[], record = true) {
  if (!changes.length) return
  const maxR = Math.max(...changes.map((c) => c.r))
  const currentLen = rows.value.length

  // Record history before mutating
  if (record) {
    const hist = changes.map((ch) => {
      const key = columns.value[ch.c] ?? ch.field
      const prev = ch.r < currentLen ? String(rows.value[ch.r]?.[key] ?? '') : ''
      return { r: ch.r, field: key, prev, next: ch.value }
    })
    recordHistory(hist)
  }

  const createPayloads: Record<string, unknown>[] = []
  const updateMap = new Map<number, Record<string, unknown>>()

  // Optimistic local state update + build batch payload
  for (let r = currentLen; r <= maxR; r++) {
    createPayloads.push({ _row: r })
  }

  for (const ch of changes) {
    const key = columns.value[ch.c] ?? ch.field
    if (ch.r < currentLen) {
      const row = rows.value[ch.r]
      if (row) {
        row[key] = ch.value
        const patch = updateMap.get(row.id) ?? {}
        patch[key] = ch.value
        updateMap.set(row.id, patch)
      }
    } else {
      const idx = ch.r - currentLen
      if (createPayloads[idx]) {
        createPayloads[idx][key] = ch.value
      }
    }
  }

  try {
    const updatedRows = await api.batchEntries(slug.value, {
      create: createPayloads,
      update: Array.from(updateMap.entries()).map(([id, data]) => ({ id, data })),
    })
    rows.value = updatedRows
  } catch {
    await load()
  }
}

function onSetCell(payload: BatchCellPatch) {
  void applyCellPatches([payload], true)
}

function onBatchCells(changes: BatchCellPatch[]) {
  void applyCellPatches(changes, true)
}

async function undo() {
  const step = undoStack.value.pop()
  if (!step) return
  redoStack.value.push(step)
  const revertChanges: BatchCellPatch[] = step.patches.map((p) => ({
    r: p.r,
    c: Math.max(0, columns.value.indexOf(p.field)),
    field: p.field,
    value: p.prev,
  }))
  await applyCellPatches(revertChanges, false)
}

async function redo() {
  const step = redoStack.value.pop()
  if (!step) return
  undoStack.value.push(step)
  const forwardChanges: BatchCellPatch[] = step.patches.map((p) => ({
    r: p.r,
    c: Math.max(0, columns.value.indexOf(p.field)),
    field: p.field,
    value: p.next,
  }))
  await applyCellPatches(forwardChanges, false)
}

async function addRow() {
  await api.createEntry(slug.value, { _row: rows.value.length })
  await load()
}

async function addColumn() {
  const name = window.prompt('New column name')?.trim()
  if (!name || !type.value) return
  const exists = type.value.schema.fields.some((f) => f.name.toLowerCase() === name.toLowerCase())
  if (!exists) {
    await api.updateContentType(type.value.id, {
      schema: {
        fields: [...type.value.schema.fields, { name, type: 'text', required: false }],
        meta: sheetMeta.value,
      },
    })
  }
  await load()
}

async function removeRow(id: number) {
  await api.deleteEntry(slug.value, id)
  await load()
}

const activeRow = ref<Entry | null>(null)
function onSelect(row: Entry | null) {
  activeRow.value = row
}
async function deleteActive() {
  if (!activeRow.value) return
  const id = activeRow.value.id
  activeRow.value = null
  await removeRow(id)
}

const activeCell = ref({ r: 0, c: 0 })
const activeRange = ref({ r1: 0, r2: 0, c1: 0, c2: 0 })
const gridRef = ref<InstanceType<typeof SheetGrid> | null>(null)

function goToCell(target: string) {
  gridRef.value?.goTo(target)
}

const cellDraft = ref<string | null>(null)

function onDraft(value: string) {
  cellDraft.value = value
  gridRef.value?.applyDraft(value)
}

function onFocusBar() {
  gridRef.value?.startEditFromBar()
}

function onFormulaCancel() {
  cellDraft.value = null
  gridRef.value?.cancelEdit()
}

function onDefineName(name: string, rng: string) {
  sheetMeta.value.namedRanges = {
    ...(sheetMeta.value.namedRanges ?? {}),
    [name]: rng.toUpperCase(),
  }
  void persistMeta()
}

function onRemoveName(name: string) {
  const copy = { ...(sheetMeta.value.namedRanges ?? {}) }
  delete copy[name]
  sheetMeta.value.namedRanges = copy
  void persistMeta()
}

function onAddCondRule(rule: ConditionalRule) {
  sheetMeta.value.conditionalRules = [...(sheetMeta.value.conditionalRules ?? []), rule]
  void persistMeta()
}

function onRemoveCondRule(id: string) {
  sheetMeta.value.conditionalRules = (sheetMeta.value.conditionalRules ?? []).filter(
    (r) => r.id !== id,
  )
  void persistMeta()
}

function onResizeColumn(colName: string, width: number) {
  sheetMeta.value.colWidths = {
    ...(sheetMeta.value.colWidths ?? {}),
    [colName]: width,
  }
  void persistMeta()
}

function toggleMergeSelection() {
  const g = activeRange.value
  if (g.r1 === g.r2 && g.c1 === g.c2) return
  const list = [...(sheetMeta.value.mergedCells ?? [])]
  const existingIdx = list.findIndex(
    (m) => m.r1 === g.r1 && m.r2 === g.r2 && m.c1 === g.c1 && m.c2 === g.c2,
  )
  if (existingIdx !== -1) {
    list.splice(existingIdx, 1)
  } else {
    list.push({ r1: g.r1, c1: g.c1, r2: g.r2, c2: g.c2 })
  }
  sheetMeta.value.mergedCells = list
  void persistMeta()
}

function getRowFormatMap(row: Entry | undefined): Record<string, FieldFormat> {
  if (!row || typeof row._fmt !== 'object' || row._fmt === null) return {}
  return row._fmt as Record<string, FieldFormat>
}

const activeFormat = computed<FieldFormat | null>(() => {
  const { r, c } = activeCell.value
  const key = columns.value[c] ?? colLetter(c).toLowerCase()
  const fmt = getRowFormatMap(rows.value[r])
  return fmt[key] ?? null
})

const canFormat = computed(() => columns.value.length > 0)

const numberOptions = [
  { value: 'plain', label: 'Plain' },
  { value: 'currency', label: '$ Currency' },
  { value: 'percent', label: '% Percent' },
]

const sizeOptions = [10, 11, 12, 13, 14, 16, 18, 20].map((n) => ({
  value: String(n),
  label: String(n),
}))

async function applyFormat(patch: FieldFormat) {
  const g = activeRange.value
  const rStart = Math.max(0, g.r1)
  const rEnd = Math.max(rStart, g.r2)
  const cStart = Math.max(0, g.c1)
  const cEnd = Math.max(cStart, g.c2)

  const createPayloads: Record<string, unknown>[] = []
  const updates: Array<{ id: number; data: Record<string, unknown> }> = []

  for (let r = rows.value.length; r <= rEnd; r++) {
    createPayloads.push({ _row: r, _fmt: {} })
  }

  for (let r = rStart; r <= rEnd; r++) {
    if (r < rows.value.length) {
      const row = rows.value[r]
      const fmt: Record<string, FieldFormat> = { ...getRowFormatMap(row) }
      for (let c = cStart; c <= cEnd; c++) {
        const key = columns.value[c] ?? colLetter(c).toLowerCase()
        fmt[key] = { ...(fmt[key] ?? {}), ...patch }
      }
      row._fmt = fmt
      updates.push({ id: row.id, data: { _fmt: fmt } })
    } else {
      const idx = r - rows.value.length
      const fmt: Record<string, FieldFormat> = {}
      for (let c = cStart; c <= cEnd; c++) {
        const key = columns.value[c] ?? colLetter(c).toLowerCase()
        fmt[key] = { ...patch }
      }
      if (createPayloads[idx]) createPayloads[idx]._fmt = fmt
    }
  }

  try {
    rows.value = await api.batchEntries(slug.value, { create: createPayloads, update: updates })
  } catch {
    await load()
  }
}

// ---- formula bar -------------------------------------------------------
const cellRef = computed(() => {
  const g = activeRange.value
  const single = g.r1 === g.r2 && g.c1 === g.c2
  if (single) return `${colLetter(activeCell.value.c)}${activeCell.value.r + 1}`
  return `${colLetter(g.c1)}${g.r1 + 1}:${colLetter(g.c2)}${g.r2 + 1}`
})

const activeRaw = computed(() => {
  const { r, c } = activeCell.value
  const key = columns.value[c] ?? colLetter(c).toLowerCase()
  const row = rows.value[r]
  return row ? String(row[key] ?? '') : ''
})

function commitFormula(value: string) {
  cellDraft.value = null
  if (gridRef.value?.commitEdit()) return
  const { r, c } = activeCell.value
  const field = columns.value[c] ?? colLetter(c).toLowerCase()
  void applyCellPatches([{ r, c, field, value }], true)
}

// ---- Import / Export (.ods & .csv) -------------------------------------
const fileInputEl = ref<HTMLInputElement | null>(null)

function triggerImportFile() {
  fileInputEl.value?.click()
}

async function onImportFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const ext = file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'ods'
    if (ext === 'csv') {
      const content = await file.text()
      const res = await api.importSheet(slug.value, { format: 'csv', content, replace: true })
      rows.value = res.data
    } else {
      const buf = await file.arrayBuffer()
      const bytes = new Uint8Array(buf)
      let binary = ''
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
      const base64 = btoa(binary)
      const res = await api.importSheet(slug.value, { format: 'ods', base64, replace: true })
      rows.value = res.data
      if (res.contentType) {
        const idx = types.value.findIndex((t) => t.id === res.contentType!.id)
        if (idx !== -1) types.value[idx] = res.contentType
      }
    }
  } catch (err) {
    window.alert(err instanceof Error ? err.message : 'Failed to import file')
  } finally {
    input.value = ''
  }
}

function downloadExport(format: 'ods' | 'csv') {
  window.open(api.exportSheetUrl(slug.value, format), '_blank')
}

// ---- Pivot & Chart Drawer ----------------------------------------------
const drawerOpen = ref(false)
const drawerMode = ref<'pivot' | 'chart' | 'rules'>('pivot')

function openDrawer(mode: 'pivot' | 'chart' | 'rules') {
  if (drawerOpen.value && drawerMode.value === mode) {
    drawerOpen.value = false
  } else {
    drawerMode.value = mode
    drawerOpen.value = true
  }
}

// ---- menu bar ----------------------------------------------------------
const menus = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'import-file', label: 'Import .ods / .csv…' },
      { id: 'export-ods', label: 'Export LibreOffice Calc (.ods)' },
      { id: 'export-csv', label: 'Export CSV (.csv)' },
      { id: 'new-row', label: 'New row' },
      { id: 'new-col', label: 'New column' },
      { id: 'delete-row', label: 'Delete row', danger: true },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'undo', label: 'Undo (Ctrl+Z)' },
      { id: 'redo', label: 'Redo (Ctrl+Y)' },
      { id: 'copy', label: 'Copy' },
      { id: 'clear', label: 'Clear range' },
      { id: 'clear-format', label: 'Clear formatting' },
    ],
  },
  {
    id: 'insert',
    label: 'Insert',
    items: [
      { id: 'pivot-table', label: 'Pivot Table (DataPilot)…' },
      { id: 'chart', label: 'Chart…' },
      { id: 'named-range', label: 'Named Range / Conditional Rule…' },
      { id: 'new-row', label: 'Row at end' },
      { id: 'new-col', label: 'Column at end' },
      { id: 'new-sheet', label: 'New sheet' },
    ],
  },
  {
    id: 'format',
    label: 'Format',
    items: [
      { id: 'plain', label: 'Number — Plain' },
      { id: 'currency', label: 'Number — Currency' },
      { id: 'percent', label: 'Number — Percent' },
      { id: 'bold', label: 'Bold' },
      { id: 'italic', label: 'Italic' },
      { id: 'merge-cells', label: 'Merge / Unmerge cells' },
      { id: 'cond-format', label: 'Conditional formatting…' },
      { id: 'align-left', label: 'Align left' },
      { id: 'align-center', label: 'Align center' },
      { id: 'align-right', label: 'Align right' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [
      { id: 'pivot-table', label: 'Pivot Table…' },
      { id: 'rebuild', label: 'Rebuild [[Wiki-Links]] & =ENTRY()' },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [{ id: 'print', label: 'Print' }],
  },
  {
    id: 'help',
    label: 'Help',
    items: [
      {
        id: 'shortcuts',
        label: 'Keys: =Formula · Point&Click · Drag-Fill · Ctrl+Z/Y',
        disabled: true,
      },
    ],
  },
]

function onMenu(_menu: string, item: string) {
  switch (item) {
    case 'import-file':
      triggerImportFile()
      break
    case 'export-ods':
      downloadExport('ods')
      break
    case 'export-csv':
      downloadExport('csv')
      break
    case 'undo':
      void undo()
      break
    case 'redo':
      void redo()
      break
    case 'new-row':
      void addRow()
      break
    case 'new-col':
      void addColumn()
      break
    case 'delete-row':
      void deleteActive()
      break
    case 'copy':
      void copySelection()
      break
    case 'clear':
      void clearSelection()
      break
    case 'clear-format':
      void clearFormat()
      break
    case 'plain':
      void applyFormat({ number: 'plain' })
      break
    case 'currency':
      void applyFormat({ number: 'currency' })
      break
    case 'percent':
      void applyFormat({ number: 'percent' })
      break
    case 'bold':
      void applyFormat({ bold: !activeFormat.value?.bold })
      break
    case 'italic':
      void applyFormat({ italic: !activeFormat.value?.italic })
      break
    case 'merge-cells':
      toggleMergeSelection()
      break
    case 'cond-format':
    case 'named-range':
      openDrawer('rules')
      break
    case 'pivot-table':
      openDrawer('pivot')
      break
    case 'chart':
      openDrawer('chart')
      break
    case 'align-left':
      void applyFormat({ align: 'left' })
      break
    case 'align-center':
      void applyFormat({ align: 'center' })
      break
    case 'align-right':
      void applyFormat({ align: 'right' })
      break
    case 'new-sheet':
      void newSheet()
      break
    case 'rebuild':
      void api.rebuildBackrefs()
      break
    case 'print':
      window.print()
      break
  }
}

async function copySelection() {
  const g = activeRange.value
  const lines: string[] = []
  for (let r = Math.max(0, g.r1); r <= Math.min(rows.value.length - 1, g.r2); r++) {
    const cells: string[] = []
    for (let c = Math.max(0, g.c1); c <= Math.min(columns.value.length - 1, g.c2); c++) {
      cells.push(String(rows.value[r][columns.value[c]] ?? ''))
    }
    lines.push(cells.join('\t'))
  }
  try {
    await navigator.clipboard.writeText(lines.join('\n'))
  } catch {
    /* clipboard unavailable */
  }
}

async function clearSelection() {
  const g = activeRange.value
  const changes: BatchCellPatch[] = []
  for (let r = Math.max(0, g.r1); r <= Math.min(rows.value.length - 1, g.r2); r++) {
    for (let c = Math.max(0, g.c1); c <= Math.min(columns.value.length - 1, g.c2); c++) {
      const key = columns.value[c]
      if (String(rows.value[r]?.[key] ?? '') !== '') {
        changes.push({ r, c, field: key, value: '' })
      }
    }
  }
  await applyCellPatches(changes, true)
}

async function clearFormat() {
  const g = activeRange.value
  const updates: Array<{ id: number; data: Record<string, unknown> }> = []
  for (let r = Math.max(0, g.r1); r <= Math.min(rows.value.length - 1, g.r2); r++) {
    const row = rows.value[r]
    const fmt: Record<string, FieldFormat> = { ...getRowFormatMap(row) }
    for (let c = Math.max(0, g.c1); c <= Math.min(columns.value.length - 1, g.c2); c++) {
      delete fmt[columns.value[c]]
    }
    row._fmt = fmt
    updates.push({ id: row.id, data: { _fmt: fmt } })
  }
  if (updates.length) {
    rows.value = await api.batchEntries(slug.value, { update: updates })
  }
}

// ---- bottom sheet tabs -------------------------------------------------
const sheetTabs = computed(() =>
  types.value.filter((t) => t.kind === 'spreadsheet').map((t) => ({ id: t.slug, label: t.name })),
)

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function newSheet() {
  const name = window.prompt('New sheet name')?.trim()
  if (!name) return
  const s = slugify(name) || `sheet-${Date.now()}`
  try {
    await api.createContentType({ slug: s, name, kind: 'spreadsheet', schema: { fields: [] } })
    await load()
    router.push(`/sheet/${s}`)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Create failed')
  }
}

const zoom = ref(100)
const zoomOptions = [50, 75, 90, 100, 125, 150].map((n) => ({
  value: String(n),
  label: `${n}%`,
}))

function printSheet() {
  window.print()
}
</script>

<template>
  <div class="sheet-shell">
    <input
      ref="fileInputEl"
      type="file"
      accept=".ods,.csv,.xml"
      style="display: none"
      @change="onImportFileChange"
    />
    <aside class="db-side">
      <NavList
        :model-value="slug"
        title="Workspace"
        subtitle="Databases"
        :items="dbItems"
        @update:model-value="openItem"
      />
    </aside>

    <main class="sheet-main">
      <MenuBar v-if="!isPending && !isError && type" :menus="menus" @select="onMenu" />
      <FormulaBar
        v-if="!isPending && !isError && type"
        :cell-ref="cellRef"
        :value="cellDraft ?? activeRaw"
        :disabled="false"
        :named-ranges="sheetMeta.namedRanges"
        @commit="commitFormula"
        @goto="goToCell"
        @draft="onDraft"
        @focus-bar="onFocusBar"
        @define-name="onDefineName"
        @cancel="onFormulaCancel"
      />
      <Toolbar v-if="!isPending && !isError && type">
        <strong class="tool-label">{{ type.name }}</strong>
        <span class="sep" />
        <Button
          size="sm"
          variant="ghost"
          :disabled="undoStack.length === 0"
          title="Undo (Ctrl+Z)"
          @click="undo"
        >
          ↺
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="redoStack.length === 0"
          title="Redo (Ctrl+Y)"
          @click="redo"
        >
          ↻
        </Button>
        <Button size="sm" variant="ghost" title="Print" @click="printSheet">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
        </Button>
        <Select
          class="zoom-select"
          size="sm"
          :model-value="String(zoom)"
          :options="zoomOptions"
          @update:model-value="(v) => (zoom = Number(v))"
        />
        <span class="sep" />
        <Select
          class="fmt-select"
          size="sm"
          :model-value="activeFormat?.number ?? 'plain'"
          :options="numberOptions"
          :disabled="!canFormat"
          @update:model-value="(v) => applyFormat({ number: String(v ?? 'plain') })"
        />
        <Button
          size="sm"
          variant="ghost"
          :disabled="!canFormat"
          title="Decrease decimals"
          @click="applyFormat({ decimals: Math.max(0, (activeFormat?.decimals ?? 2) - 1) })"
        >
          .0
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="!canFormat"
          title="Increase decimals"
          @click="applyFormat({ decimals: (activeFormat?.decimals ?? 0) + 1 })"
        >
          .00
        </Button>
        <Select
          class="size-select"
          size="sm"
          :model-value="String(activeFormat?.size ?? 13)"
          :options="sizeOptions"
          :disabled="!canFormat"
          @update:model-value="(v) => applyFormat({ size: Number(v) })"
        />
        <span class="sep" />
        <Button
          size="sm"
          :variant="activeFormat?.bold ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Bold"
          @click="applyFormat({ bold: !activeFormat?.bold })"
        >
          <b>B</b>
        </Button>
        <Button
          size="sm"
          :variant="activeFormat?.italic ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Italic"
          @click="applyFormat({ italic: !activeFormat?.italic })"
        >
          <i>I</i>
        </Button>
        <Button
          size="sm"
          :variant="activeFormat?.underline ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Underline"
          @click="applyFormat({ underline: !activeFormat?.underline })"
        >
          <u>U</u>
        </Button>
        <Button
          size="sm"
          :variant="activeFormat?.strike ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Strikethrough"
          @click="applyFormat({ strike: !activeFormat?.strike })"
        >
          <s>S</s>
        </Button>
        <span class="sep" />
        <label class="color-wrap" title="Text color">
          <span class="color-a" :style="{ borderColor: activeFormat?.color ?? DEFAULT_INK_COLOR }"
            >A</span
          >
          <input
            type="color"
            class="color-input"
            :value="activeFormat?.color ?? ''"
            :disabled="!canFormat"
            @input="applyFormat({ color: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="color-wrap" title="Fill color">
          <span
            class="color-fill"
            :style="{ background: activeFormat?.bg ?? DEFAULT_SURFACE_COLOR }"
          />
          <input
            type="color"
            class="color-input"
            :value="activeFormat?.bg ?? ''"
            :disabled="!canFormat"
            @input="applyFormat({ bg: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <span class="sep" />
        <Button
          size="sm"
          variant="ghost"
          :disabled="!canFormat"
          title="Align left"
          @click="applyFormat({ align: 'left' })"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="15" y2="12" />
            <line x1="3" y1="18" x2="18" y2="18" />
          </svg>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="!canFormat"
          title="Align center"
          @click="applyFormat({ align: 'center' })"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="6" y1="12" x2="18" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
          </svg>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          :disabled="!canFormat"
          title="Align right"
          @click="applyFormat({ align: 'right' })"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="9" y1="12" x2="21" y2="12" />
            <line x1="6" y1="18" x2="21" y2="18" />
          </svg>
        </Button>
        <Button
          size="sm"
          :variant="activeFormat?.wrap ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Wrap text"
          @click="applyFormat({ wrap: !activeFormat?.wrap })"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M3 12h13a3 3 0 0 1 0 6h-4" />
            <polyline points="14 15 12 18 14 21" />
            <line x1="3" y1="18" x2="8" y2="18" />
          </svg>
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title="Merge / Unmerge selected cells"
          @click="toggleMergeSelection"
        >
          ⊞
        </Button>
        <span class="sep" />
        <Button
          size="sm"
          :variant="drawerOpen && drawerMode === 'pivot' ? 'primary' : 'ghost'"
          title="Pivot Table (DataPilot)"
          @click="openDrawer('pivot')"
        >
          Pivot
        </Button>
        <Button
          size="sm"
          :variant="drawerOpen && drawerMode === 'chart' ? 'primary' : 'ghost'"
          title="Chart Builder"
          @click="openDrawer('chart')"
        >
          Chart
        </Button>
        <Button
          size="sm"
          :variant="drawerOpen && drawerMode === 'rules' ? 'primary' : 'ghost'"
          title="Conditional Formatting & Named Ranges"
          @click="openDrawer('rules')"
        >
          Rules
        </Button>
        <Button size="sm" variant="ghost" title="Import .ods / .csv" @click="triggerImportFile">
          Import
        </Button>
        <Button
          size="sm"
          variant="ghost"
          title="Export LibreOffice Calc (.ods)"
          @click="downloadExport('ods')"
        >
          .ODS
        </Button>
        <span class="sep" />
        <Button
          size="sm"
          variant="ghost"
          :disabled="!activeRow"
          title="Delete row"
          @click="deleteActive"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </Button>
      </Toolbar>

      <!-- 1. isPending: Skeleton (SOP §10.1) -->
      <div v-if="isPending" class="loading-stack">
        <Skeleton v-for="i in 5" :key="i" variant="line" width="100%" />
      </div>

      <!-- 2. isError: Alert + Retry (SOP §10.1) -->
      <div v-else-if="isError" class="center">
        <Alert tone="danger" title="Failed to load spreadsheet">
          {{ error?.message ?? 'An unexpected error occurred' }}
        </Alert>
        <Button size="sm" @click="() => refetch()">Retry</Button>
      </div>

      <!-- 3. isEmpty: EmptyState when collection does not exist (SOP §10.1) -->
      <EmptyState
        v-else-if="!type"
        title="Collection not found"
        message="This database does not exist."
      />

      <!-- 4. Success: SheetGrid & PivotChartDrawer (SOP §10.1) -->
      <div v-else class="sheet-workarea">
        <SheetGrid
          ref="gridRef"
          :style="{ zoom: `${zoom}%` }"
          :columns="sheetColumns"
          :rows="rows"
          :extra-sheets="extraSheets"
          :named-ranges="sheetMeta.namedRanges"
          :conditional-rules="sheetMeta.conditionalRules"
          :merged-cells="sheetMeta.mergedCells"
          :col-widths="sheetMeta.colWidths"
          :resolve-entry="resolveEntry"
          @set-cell="onSetCell"
          @batch-cells="onBatchCells"
          @delete-row="removeRow"
          @add-row="addRow"
          @add-column="addColumn"
          @resize-column="onResizeColumn"
          @undo="undo"
          @redo="redo"
          @select="onSelect"
          @select-cell="(cell) => (activeCell = cell)"
          @select-range="(r) => (activeRange = r)"
          @edit-draft="(v) => (cellDraft = v)"
        />
        <PivotChartDrawer
          :open="drawerOpen"
          :mode="drawerMode"
          :columns="sheetColumns"
          :rows="rows"
          :active-range-ref="cellRef"
          :conditional-rules="sheetMeta.conditionalRules ?? []"
          :named-ranges="sheetMeta.namedRanges ?? {}"
          @close="drawerOpen = false"
          @update:mode="(m) => (drawerMode = m)"
          @add-rule="onAddCondRule"
          @remove-rule="onRemoveCondRule"
          @define-name="onDefineName"
          @remove-name="onRemoveName"
        />
      </div>
      <div v-if="!isPending && !isError && type" class="sheet-tabsbar">
        <Tabs :model-value="slug" :tabs="sheetTabs" @update:model-value="(id) => openItem(id)" />
        <Button size="sm" variant="ghost" title="New sheet" @click="newSheet">+</Button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sheet-shell {
  display: grid;
  grid-template-columns: var(--layout-sidebar-w) minmax(0, 1fr);
  height: calc(100vh - var(--layout-topbar-h));
}
.db-side {
  border-right: 1px solid var(--c-hairline-soft);
  padding: var(--s-md) var(--s-sm);
  overflow-y: auto;
}
.sheet-main {
  min-width: 0;
  height: calc(100vh - var(--layout-topbar-h));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sheet-workarea {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
}
.sheet-workarea :deep(.p-sheetwrap) {
  flex: 1;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.fmt-select { width: 7.75rem; }
.size-select { width: 4.5rem; }
.zoom-select { width: 5.25rem; }
.sheet-tabsbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: var(--s-xs);
  height: 2.625rem;
  padding: 0 var(--s-xs);
  border-top: 1px solid var(--c-hairline-soft);
  background: var(--c-canvas);
}
.color-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  border: 1px solid var(--c-hairline-soft);
  border-radius: var(--s-xxs);
  cursor: pointer;
  flex: none;
}
.color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.color-a {
  font-size: 0.75rem;
  font-weight: 700;
  line-height: 1;
  border-bottom: 2px solid currentColor;
}
.color-fill {
  width: var(--s-sm);
  height: var(--s-sm);
  border: 1px solid var(--c-hairline-soft);
}
.loading-stack {
  display: flex;
  flex-direction: column;
  gap: var(--s-sm);
  padding: var(--s-xl);
}
.center {
  display: grid;
  place-items: center;
  gap: var(--s-sm);
  padding: var(--s-xxl);
}
</style>
