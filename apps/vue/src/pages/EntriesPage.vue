<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Dialog from '@huuk/overlays/Dialog.vue'
import ConfirmModal from '@huuk/overlays/ConfirmModal.vue'
import Input from '@huuk/ui/Input.vue'
import Field from '@huuk/ui/Field.vue'
import Select from '@huuk/ui/Select.vue'
import Textarea from '@huuk/ui/Textarea.vue'
import Badge from '@huuk/ui/Badge.vue'
import Chip from '@huuk/ui/Chip.vue'
import Alert from '@huuk/ui/Alert.vue'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Pagination from '@huuk/ui/Pagination.vue'
import Skeleton from '@huuk/ui/Skeleton.vue'
import DataTable from '@huuk/ui/DataTable.vue'
import Avatar from '@huuk/ui/Avatar.vue'
import Button from '@huuk/ui/Button.vue'
import ButtonGroup from '@huuk/ui/ButtonGroup.vue'
import NavList from '@huuk/ui/NavList.vue'
import SectionHeader from '@huuk/ui/SectionHeader.vue'
import { api, type ContentType, type Entry } from '@/lib/api'

const route = useRoute()
const router = useRouter()

const types = ref<ContentType[]>([])
const entries = ref<Entry[]>([])
const total = ref(0)
const loading = ref(false)
const err = ref('')

const selectedSlug = ref('')
const currentPage = ref(1)
const pageSize = 12
const selectedType = computed(() => types.value.find((t) => t.slug === selectedSlug.value) ?? null)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

// create / edit
const creating = ref(false)
const editingId = ref<number | null>(null)
const newData = ref<Record<string, any>>({})

// delete
const deleteId = ref<number | null>(null)

// create database (content type)
const creatingSchema = ref(false)
const newSlug = ref('')
const newName = ref('')
const newKind = ref<'document' | 'spreadsheet'>('document')
const schemaErr = ref('')

async function submitSchema() {
  schemaErr.value = ''
  try {
    await api.createContentType({
      slug: newSlug.value.trim().toLowerCase(),
      name: newName.value.trim(),
      kind: newKind.value,
      schema: { fields: [{ name: 'title', type: 'text', required: true }] },
    })
    creatingSchema.value = false
    newSlug.value = ''
    newName.value = ''
    newKind.value = 'document'
    types.value = await api.contentTypes()
  } catch (e) {
    schemaErr.value = e instanceof Error ? e.message : 'Create failed'
  }
}

function kindOf(t: ContentType): 'document' | 'spreadsheet' {
  return t.kind === 'spreadsheet' ? 'spreadsheet' : 'document'
}

const dbItems = computed(() => [
  { id: '', label: 'Overview' },
  ...types.value.map((t) => ({ id: t.slug, label: t.name, meta: kindOf(t) === 'spreadsheet' ? 'sheet' : 'doc' })),
])

// docs
const docsId = ref<number | null>(null)
const docsOpen = computed({
  get: () => docsId.value !== null,
  set: (v: boolean) => {
    if (!v) docsId.value = null
  },
})
const docsContent = ref('')
const docsTitle = ref('')
const savingDocs = ref(false)
const docsEl = ref<HTMLDivElement | null>(null)

const kindOptions = [
  { value: 'document', label: 'Document — popup note-taker' },
  { value: 'spreadsheet', label: 'Spreadsheet — full-page grid' },
]

const schemaCols = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'slug', label: 'Slug' },
  { key: 'kind', label: 'Kind' },
  { key: 'fields', label: 'Fields' },
  { key: 'createdAt', label: 'Created', width: '140px', sortable: true },
]

const entryCols = computed(() => {
  const fields =
    selectedType.value?.schema.fields.slice(0, 4).map((f) => ({ key: f.name, label: f.name })) ?? []
  return [
    { key: 'id', label: 'ID', width: '70px' },
    ...fields,
    { key: 'updatedAt', label: 'Updated', width: '130px' },
    { key: '_actions', label: 'Actions', width: '140px', align: 'right' as const },
  ]
})

onMounted(async () => {
  types.value = await api.contentTypes()
  selectedSlug.value = String(route.query.type ?? '')
})

watch(selectedSlug, async (slug) => {
  creating.value = false
  editingId.value = null
  newData.value = {}
  currentPage.value = 1
  const t = types.value.find((x) => x.slug === slug)
  if (t && kindOf(t) === 'spreadsheet') {
    router.replace(`/sheet/${slug}`)
    return
  }
  router.replace({ query: slug ? { type: slug } : {} })
  if (slug) await loadEntries(slug, 1)
})

watch(currentPage, async (p) => {
  if (selectedSlug.value) await loadEntries(selectedSlug.value, p)
})

async function loadEntries(slug: string, page = 1) {
  loading.value = true
  err.value = ''
  try {
    const res = await api.entries(slug, page, pageSize)
    entries.value = res.data
    total.value = res.meta.total
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Failed to load entries'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  newData.value = {}
  creating.value = true
}

function openEdit(entry: Entry) {
  editingId.value = entry.id
  newData.value = { ...entry }
  creating.value = true
}

async function submitNew() {
  if (!selectedType.value) return
  err.value = ''
  const slug = selectedType.value.slug
  const payload: Record<string, unknown> = {}
  for (const f of selectedType.value.schema.fields) payload[f.name] = newData.value[f.name]
  try {
    if (editingId.value) await api.updateEntry(slug, editingId.value, payload)
    else await api.createEntry(slug, payload)
    creating.value = false
    await loadEntries(slug, currentPage.value)
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Save failed'
  }
}

async function confirmDelete() {
  if (!selectedType.value || deleteId.value === null) return
  await api.deleteEntry(selectedType.value.slug, deleteId.value)
  entries.value = entries.value.filter((e) => e.id !== deleteId.value)
  deleteId.value = null
}

async function openDocs(entry: Entry) {
  docsId.value = entry.id
  docsTitle.value = String(entry.title ?? entry.name ?? '')
  docsContent.value = String(entry._docs ?? '<h1>Untitled</h1><p><br></p>')
  await Promise.resolve()
  if (docsEl.value) docsEl.value.innerHTML = docsContent.value
}

async function saveDocs() {
  if (!selectedType.value || docsId.value === null || !docsEl.value) return
  savingDocs.value = true
  const html = docsEl.value.innerHTML
  const title = docsTitle.value.trim()
  try {
    await api.updateEntry(selectedType.value.slug, docsId.value, { _docs: html, title })
    const i = entries.value.findIndex((e) => e.id === docsId.value)
    if (i !== -1) entries.value[i] = { ...entries.value[i], _docs: html, title }
    docsId.value = null
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Save failed'
  } finally {
    savingDocs.value = false
  }
}

function fmtDate(value: unknown): string {
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

function exec(command: string, value?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.document as any).execCommand(command, false, value)
}
</script>

<template>
  <div class="entries-shell">
    <aside class="db-side">
      <NavList v-model="selectedSlug" title="Workspace" subtitle="Databases" :items="dbItems" />
    </aside>

    <main class="entries-main">
      <template v-if="!selectedType">
        <SectionHeader title="Database Schemas">
          <Badge>{{ types.length }} collections</Badge>
          <template #actions>
            <Button size="sm" @click="creatingSchema = true">+ New database</Button>
          </template>
        </SectionHeader>

        <DataTable :columns="schemaCols" :rows="types" clickable @row-click="(t) => (selectedSlug = t.slug)">
          <template #cell-name="{ row }">
            <Avatar :label="String(row.name).charAt(0).toUpperCase()" />
            <span class="cell-primary">{{ row.name }}</span>
          </template>
          <template #cell-slug="{ row }"><code class="slug-code">/{{ row.slug }}</code></template>
          <template #cell-kind="{ row }">
            <Badge :variant="kindOf(row) === 'spreadsheet' ? 'solid' : 'neutral'">{{ kindOf(row) }}</Badge>
          </template>
          <template #cell-fields="{ row }">
            <Chip v-for="f in row.schema.fields.slice(0, 3)" :key="f.name" :label="f.name" />
            <Chip v-if="row.schema.fields.length > 3" :label="`+${row.schema.fields.length - 3}`" />
          </template>
          <template #cell-createdAt="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </DataTable>
      </template>

      <template v-else>
        <SectionHeader :title="selectedType.name">
          <Badge>{{ total }} total</Badge>
          <Badge :variant="kindOf(selectedType) === 'spreadsheet' ? 'solid' : 'neutral'">{{ kindOf(selectedType) }}</Badge>
          <template #actions>
            <Button size="sm" @click="openCreate">+ New Entry</Button>
          </template>
        </SectionHeader>

        <div v-if="loading" class="loading-stack">
          <Skeleton v-for="i in 4" :key="i" variant="line" width="100%" />
        </div>
        <Alert v-else-if="err" tone="danger" title="Something went wrong">{{ err }}</Alert>
        <EmptyState
          v-else-if="entries.length === 0"
          title="No entries yet"
          message="Create the first record in this collection."
        />

        <DataTable v-else :columns="entryCols" :rows="entries">
          <template #cell-updatedAt="{ row }">{{ fmtDate(row.updatedAt) }}</template>
          <template #cell-_actions="{ row }">
            <div class="actions">
              <Button
                size="sm"
                variant="ghost"
                :title="row._docs ? 'Open docs' : 'Create docs'"
                @click="openDocs(row)"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              </Button>
              <Button size="sm" variant="ghost" title="Edit" @click="openEdit(row)">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </Button>
              <Button size="sm" variant="ghost" title="Delete" @click="deleteId = row.id">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
              </Button>
            </div>
          </template>
        </DataTable>

        <Pagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          @update:current-page="currentPage = $event"
        />
      </template>
    </main>
  </div>

  <!-- Create database modal -->
  <Dialog
    v-model="creatingSchema"
    title="New database"
    description="Pick a kind — document opens a popup note-taker, spreadsheet opens a full-page grid."
    width="480px"
  >
    <div class="dlg-fields">
      <Field label="Display name" html-for="db-name">
        <Input id="db-name" v-model="newName" placeholder="e.g. Budget" />
      </Field>
      <Field label="Slug" html-for="db-slug" hint="lowercase, no spaces — e.g. budget">
        <Input id="db-slug" v-model="newSlug" placeholder="e.g. budget" />
      </Field>
      <Field label="Kind">
        <Select v-model="newKind" :options="kindOptions" />
      </Field>
      <Alert v-if="schemaErr" tone="danger" title="Create failed">{{ schemaErr }}</Alert>
    </div>
    <template #footer>
      <Button size="sm" @click="creatingSchema = false">Cancel</Button>
      <Button size="sm" variant="primary" @click="submitSchema">Create database</Button>
    </template>
  </Dialog>

  <!-- Create / edit modal -->
  <Dialog
    v-if="selectedType"
    v-model="creating"
    :title="`${editingId ? 'Edit' : 'Create'} ${selectedType.name}`"
    width="560px"
  >
    <div class="dlg-fields">
      <Field
        v-for="f in selectedType.schema.fields"
        :key="f.name"
        :label="f.name"
        :required="f.required"
        :html-for="`f-${f.name}`"
      >
        <Select
          v-if="f.type === 'select' && f.options"
          v-model="newData[f.name]"
          :options="f.options.map((o) => ({ value: o, label: o }))"
          placeholder="—"
        />
        <Textarea v-else-if="f.type === 'richtext'" :id="`f-${f.name}`" v-model="newData[f.name]" :rows="3" />
        <Input
          v-else
          :id="`f-${f.name}`"
          v-model="newData[f.name]"
          :type="f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'"
          :required="f.required"
        />
      </Field>
      <Alert v-if="err" tone="danger" title="Save failed">{{ err }}</Alert>
    </div>
    <template #footer>
      <Button size="sm" @click="creating = false">Cancel</Button>
      <Button size="sm" variant="primary" @click="submitNew">Save Entry</Button>
    </template>
  </Dialog>

  <!-- Docs modal -->
  <Dialog v-model="docsOpen" v-model:title="docsTitle" width="720px" expandable editable-title>
    <ButtonGroup>
      <Button size="sm" variant="ghost" title="Bold" @click="exec('bold')"><b>B</b></Button>
      <Button size="sm" variant="ghost" title="Italic" @click="exec('italic')"><i>I</i></Button>
      <Button size="sm" variant="ghost" title="Underline" @click="exec('underline')"><u>U</u></Button>
      <Button size="sm" variant="ghost" title="Heading" @click="exec('formatBlock', 'h2')">H2</Button>
      <Button size="sm" variant="ghost" title="Bulleted list" @click="exec('insertUnorderedList')">• List</Button>
    </ButtonGroup>
    <div class="docs-body">
      <div ref="docsEl" class="docs-page" contenteditable="true" spellcheck="false"></div>
    </div>
    <template #footer>
      <Button size="sm" @click="docsId = null">Close</Button>
      <Button size="sm" variant="primary" :loading="savingDocs" @click="saveDocs">
        {{ savingDocs ? 'Saving…' : 'Save Docs' }}
      </Button>
    </template>
  </Dialog>

  <!-- Delete confirm -->
  <ConfirmModal
    :open="deleteId !== null"
    title="Delete Entry"
    message="Delete this entry? This action cannot be undone."
    confirm-text="Delete"
    tone="danger"
    @cancel="deleteId = null"
    @confirm="confirmDelete"
  />
</template>

<style scoped>
.entries-shell { display: grid; grid-template-columns: 232px minmax(0, 1fr); min-height: 100vh; }
.entries-main { padding: clamp(28px, 4vw, 48px) clamp(24px, 5vw, 80px) 72px; min-width: 0; }
.db-side {
  border-right: 1px solid var(--c-hairline-soft);
  padding: 20px 14px;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.cell-primary { font-weight: 600; margin-left: 9px; vertical-align: middle; }
.slug-code { font-family: var(--font-mono); font-size: 12px; color: var(--c-muted); }
.actions { display: flex; gap: 4px; justify-content: flex-end; }
.loading-stack { display: flex; flex-direction: column; gap: 10px; padding: 8px 0; }
.dlg-fields { display: flex; flex-direction: column; gap: var(--s-md); }
.docs-body { padding: 20px 0 0; flex: 1; min-height: 0; overflow-y: auto; }
.docs-page { flex: 1; min-height: 300px; outline: none; font-size: 16px; line-height: 1.7; }
.docs-page :deep(h1), .docs-page :deep(h2) { font-family: var(--font-main); }
@media (max-width: 900px) {
  .entries-shell { grid-template-columns: 1fr; }
  .db-side { position: static; height: auto; border-right: none; border-bottom: 1px solid var(--c-hairline-soft); }
}
</style>
