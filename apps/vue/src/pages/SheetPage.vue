<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Spinner from '@huuk/ui/Spinner.vue'
import Button from '@huuk/ui/Button.vue'
import Select from '@huuk/ui/Select.vue'
import Toolbar from '@huuk/ui/Toolbar.vue'
import MenuBar from '@huuk/ui/MenuBar.vue'
import FormulaBar from '@huuk/ui/FormulaBar.vue'
import Tabs from '@huuk/ui/Tabs.vue'
import NavList from '@huuk/ui/NavList.vue'
import SheetGrid from '@huuk/tables/SheetGrid.vue'
import { api, type ContentType, type Entry, type FieldFormat } from '@/lib/api'

const route = useRoute()
const router = useRouter()

const slug = computed(() => String(route.params.slug ?? ''))
const types = ref<ContentType[]>([])
const rows = ref<Entry[]>([])
const loading = ref(true)

const type = computed(() => types.value.find((t) => t.slug === slug.value) ?? null)

// Free-form columns: the union of data keys across rows (no schema binding).
const columns = computed<string[]>(() => {
  const seen: string[] = []
  for (const row of rows.value) {
    for (const k of Object.keys(row)) {
      if (k.startsWith('_') || k === 'id' || k === 'createdAt' || k === 'updatedAt') continue
      const v = row[k]
      if (v === null || v === undefined) continue
      if (!seen.includes(k)) seen.push(k)
    }
  }
  return seen
})
const sheetColumns = computed(() => columns.value.map((name) => ({ name })))

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

async function load(silent = false) {
  if (!silent) loading.value = true
  try {
    types.value = await api.contentTypes()
    if (type.value) {
      const res = await api.entries(slug.value, 1, 200)
      rows.value = [...res.data].sort((a, b) => a.id - b.id)
    }
  } finally {
    if (!silent) loading.value = false
  }
}

onMounted(() => load())
watch(slug, () => load())

async function saveCell(row: Entry, field: string, value: string) {
  if (String(row[field] ?? '') === value) return
  row[field] = value
  try {
    await api.updateEntry(slug.value, row.id, { [field]: value })
  } catch {
    await load(true)
  }
}

function colLetter(i: number): string {
  let s = ''
  let n = i
  do {
    s = String.fromCharCode(65 + (n % 26)) + s
    n = Math.floor(n / 26) - 1
  } while (n >= 0)
  return s
}

function nextFieldName(): string {
  const used = new Set(columns.value)
  let i = columns.value.length
  while (used.has(colLetter(i).toLowerCase())) i++
  return colLetter(i).toLowerCase()
}

async function addRow() {
  await api.createEntry(slug.value, {})
  await load(true)
}

async function addRowWith(field: string, value: string) {
  await api.createEntry(slug.value, { [field]: value })
  await load(true)
}

async function addColumnWith(payload: { rowId: number | null; value: string }) {
  const name = nextFieldName()
  if (payload.rowId !== null) {
    await api.updateEntry(slug.value, payload.rowId, { [name]: payload.value })
  } else {
    await api.createEntry(slug.value, { [name]: payload.value })
  }
  await load(true)
}

async function addColumn() {
  const name = window.prompt('New column name')?.trim()
  if (!name) return
  if (rows.value.length === 0) {
    await api.createEntry(slug.value, { [name]: '' })
  } else {
    await api.updateEntry(slug.value, rows.value[0].id, { [name]: '' })
  }
  await load(true)
}

async function removeRow(id: number) {
  await api.deleteEntry(slug.value, id)
  await load(true)
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
  gridRef.value?.applyDraft(value)
}

function onFormulaCancel() {
  gridRef.value?.cancelEdit()
}

const activeFormat = computed<FieldFormat | null>(() => {
  const { r, c } = activeCell.value
  if (c < 0 || c >= columns.value.length) return null
  const row = rows.value[r]
  if (!row) return null
  const fmt = row._fmt as Record<string, FieldFormat> | undefined
  return fmt?.[columns.value[c]] ?? null
})

const canFormat = computed(() => activeRange.value.r1 < rows.value.length && columns.value.length > 0)

const numberOptions = [
  { value: 'plain', label: 'Plain' },
  { value: 'currency', label: '$ Currency' },
  { value: 'percent', label: '% Percent' },
]

const sizeOptions = [10, 11, 12, 13, 14, 16, 18, 20].map((n) => ({ value: String(n), label: String(n) }))

async function applyFormat(patch: FieldFormat) {
  const g = activeRange.value
  const rStart = Math.max(0, g.r1)
  const rEnd = Math.min(rows.value.length - 1, g.r2)
  const cStart = Math.max(0, g.c1)
  const cEnd = Math.min(columns.value.length - 1, g.c2)
  if (rStart > rEnd || cStart > cEnd) return
  for (let r = rStart; r <= rEnd; r++) {
    const row = rows.value[r]
    const fmt: Record<string, FieldFormat> = { ...((row._fmt as Record<string, FieldFormat>) ?? {}) }
    for (let c = cStart; c <= cEnd; c++) {
      const key = columns.value[c]
      fmt[key] = { ...(fmt[key] ?? {}), ...patch }
    }
    row._fmt = fmt
    await api.updateEntry(slug.value, row.id, { _fmt: fmt })
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
  if (c < 0 || c >= columns.value.length) return ''
  const row = rows.value[r]
  return row ? String(row[columns.value[c]] ?? '') : ''
})

function commitFormula(value: string) {
  if (gridRef.value?.commitEdit()) return
  const { r, c } = activeCell.value
  if (c < 0 || c >= columns.value.length) return
  if (r < rows.value.length) {
    void saveCell(rows.value[r], columns.value[c], value)
    return
  }
  const key = columns.value[c]
  if (key) void addRowWith(key, value)
}

// ---- menu bar ----------------------------------------------------------
const menus = [
  {
    id: 'file',
    label: 'File',
    items: [
      { id: 'new-row', label: 'New row' },
      { id: 'new-col', label: 'New column' },
      { id: 'delete-row', label: 'Delete row', danger: true },
    ],
  },
  {
    id: 'edit',
    label: 'Edit',
    items: [
      { id: 'copy', label: 'Copy' },
      { id: 'clear', label: 'Clear range' },
      { id: 'clear-format', label: 'Clear formatting' },
    ],
  },
  {
    id: 'insert',
    label: 'Insert',
    items: [
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
      { id: 'align-left', label: 'Align left' },
      { id: 'align-center', label: 'Align center' },
      { id: 'align-right', label: 'Align right' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    items: [{ id: 'rebuild', label: 'Rebuild wiki-links' }],
  },
  {
    id: 'tools',
    label: 'Tools',
    items: [{ id: 'print', label: 'Print' }],
  },
  {
    id: 'help',
    label: 'Help',
    items: [{ id: 'shortcuts', label: 'Keys: arrows · Enter · Tab · Ctrl+C/V', disabled: true }],
  },
]

function onMenu(_menu: string, item: string) {
  switch (item) {
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
  for (let r = Math.max(0, g.r1); r <= Math.min(rows.value.length - 1, g.r2); r++) {
    for (let c = Math.max(0, g.c1); c <= Math.min(columns.value.length - 1, g.c2); c++) {
      const row = rows.value[r]
      const key = columns.value[c]
      if (String(row[key] ?? '') !== '') {
        row[key] = ''
        await api.updateEntry(slug.value, row.id, { [key]: '' })
      }
    }
  }
}

async function clearFormat() {
  const g = activeRange.value
  for (let r = Math.max(0, g.r1); r <= Math.min(rows.value.length - 1, g.r2); r++) {
    const row = rows.value[r]
    const fmt: Record<string, FieldFormat> = { ...((row._fmt as Record<string, FieldFormat>) ?? {}) }
    for (let c = Math.max(0, g.c1); c <= Math.min(columns.value.length - 1, g.c2); c++) {
      delete fmt[columns.value[c]]
    }
    row._fmt = fmt
    await api.updateEntry(slug.value, row.id, { _fmt: fmt })
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
    types.value = await api.contentTypes()
    router.push(`/sheet/${s}`)
  } catch (e) {
    window.alert(e instanceof Error ? e.message : 'Create failed')
  }
}

const zoom = ref(100)
const zoomOptions = [50, 75, 90, 100, 125, 150].map((n) => ({ value: String(n), label: `${n}%` }))

function printSheet() {
  window.print()
}
</script>

<template>
  <div class="sheet-shell">
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
      <MenuBar v-if="!loading && type" :menus="menus" @select="onMenu" />
      <FormulaBar
        v-if="!loading && type"
        :cell-ref="cellRef"
        :value="cellDraft ?? activeRaw"
        :disabled="activeCell.c >= columns.length"
        @commit="commitFormula"
        @goto="goToCell"
        @draft="onDraft"
        @cancel="onFormulaCancel"
      />
      <Toolbar v-if="!loading && type">
        <strong class="tool-label">{{ type.name }}</strong>
        <span class="sep" />
        <Button size="sm" variant="ghost" disabled title="Undo (not available)">↺</Button>
        <Button size="sm" variant="ghost" disabled title="Redo (not available)">↻</Button>
        <Button size="sm" variant="ghost" title="Print" @click="printSheet">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
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
          @update:model-value="(v) => applyFormat({ number: (v ?? 'plain') as FieldFormat['number'] })"
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
          <span class="color-a" :style="{ borderColor: activeFormat?.color ?? '#000000' }">A</span>
          <input
            type="color"
            class="color-input"
            :value="activeFormat?.color ?? '#000000'"
            :disabled="!canFormat"
            @input="applyFormat({ color: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <label class="color-wrap" title="Fill color">
          <span class="color-fill" :style="{ background: activeFormat?.bg ?? '#ffffff' }" />
          <input
            type="color"
            class="color-input"
            :value="activeFormat?.bg ?? '#ffffff'"
            :disabled="!canFormat"
            @input="applyFormat({ bg: ($event.target as HTMLInputElement).value })"
          />
        </label>
        <span class="sep" />
        <Button size="sm" variant="ghost" :disabled="!canFormat" title="Align left" @click="applyFormat({ align: 'left' })">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
        </Button>
        <Button size="sm" variant="ghost" :disabled="!canFormat" title="Align center" @click="applyFormat({ align: 'center' })">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
        </Button>
        <Button size="sm" variant="ghost" :disabled="!canFormat" title="Align right" @click="applyFormat({ align: 'right' })">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
        </Button>
        <Button
          size="sm"
          :variant="activeFormat?.wrap ? 'primary' : 'ghost'"
          :disabled="!canFormat"
          title="Wrap text"
          @click="applyFormat({ wrap: !activeFormat?.wrap })"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><path d="M3 12h13a3 3 0 0 1 0 6h-4"/><polyline points="14 15 12 18 14 21"/><line x1="3" y1="18" x2="8" y2="18"/></svg>
        </Button>
        <span class="sep" />
        <Button size="sm" variant="ghost" :disabled="!activeRow" title="Delete row" @click="deleteActive">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
        </Button>
      </Toolbar>

      <div v-if="loading" class="center"><Spinner :size="18" /></div>
      <EmptyState v-else-if="!type" title="Collection not found" message="This database does not exist." />
      <SheetGrid
        v-else
        ref="gridRef"
        :style="{ zoom: `${zoom}%` }"
        :columns="sheetColumns"
        :rows="rows"
        @cell-change="saveCell"
        @delete-row="removeRow"
        @add-row="addRow"
        @add-row-with="addRowWith"
        @add-column="addColumn"
        @add-column-with="addColumnWith"
        @select="onSelect"
        @select-cell="(cell) => (activeCell = cell)"
        @select-range="(r) => (activeRange = r)"
        @edit-draft="(v) => (cellDraft = v)"
      />
      <div v-if="!loading && type" class="sheet-tabsbar">
        <Tabs :model-value="slug" :tabs="sheetTabs" @update:model-value="(id) => openItem(id)" />
        <Button size="sm" variant="ghost" title="New sheet" @click="newSheet">+</Button>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sheet-shell { display: grid; grid-template-columns: 232px minmax(0, 1fr); height: calc(100vh - 54px); }
.db-side {
  border-right: 1px solid var(--c-hairline-soft);
  padding: 20px 14px;
  overflow-y: auto;
}
.sheet-main { min-width: 0; height: calc(100vh - 54px); display: flex; flex-direction: column; overflow: hidden; }
.fmt-select { width: 124px; }
.size-select { width: 72px; }
.zoom-select { width: 84px; }
.sheet-tabsbar {
  flex: none;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 10px;
  border-top: 1px solid var(--c-hairline-soft);
  background: var(--c-canvas);
}
.color-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--c-hairline-soft);
  border-radius: 6px;
  cursor: pointer;
  flex: none;
}
.color-input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.color-a { font-size: 12px; font-weight: 700; line-height: 1; border-bottom: 2px solid currentColor; }
.color-fill { width: 12px; height: 12px; border: 1px solid var(--c-hairline-soft); }
.sheet-main :deep(.p-sheetwrap) { flex: 1; min-height: 0; height: auto; }
.center { display: grid; place-items: center; padding: 40px; }
</style>
