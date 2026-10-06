<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import KpiCard from '@huuk/ui/KpiCard.vue'
import NavList from '@huuk/ui/NavList.vue'
import SectionHeader from '@huuk/ui/SectionHeader.vue'
import DataTable from '@huuk/ui/DataTable.vue'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Spinner from '@huuk/ui/Spinner.vue'
import Button from '@huuk/ui/Button.vue'
import { api, type ContentType, type Entry } from '@/lib/api'

const router = useRouter()

const types = ref<ContentType[]>([])
const entries = ref<Entry[]>([])
const loading = ref(true)

const entryCols = [
  { key: 'id', label: 'ID', width: '70px' },
  { key: 'title', label: 'Title' },
  { key: 'updated', label: 'Updated', width: '140px' },
]

const rows = computed(() =>
  entries.value.map((e) => ({
    id: e.id,
    title: String(e.title ?? e.name ?? '—'),
    updated: new Date(e.updatedAt).toLocaleDateString(),
  })),
)

const typeItems = computed(() =>
  types.value.map((t, i) => ({ id: t.slug, label: t.name, meta: String(i + 1).padStart(2, '0') })),
)

function openType(slug?: string) {
  if (!slug) return
  const t = types.value.find((x) => x.slug === slug)
  if (t && t.kind === 'spreadsheet') router.push(`/sheet/${slug}`)
  else router.push({ path: '/entries', query: { type: slug } })
}

onMounted(async () => {
  types.value = await api.contentTypes()
  const first = types.value[0]
  if (first) entries.value = (await api.entries(first.slug, 1, 5)).data
  loading.value = false
})
</script>

<template>
  <div class="page">
    <header class="page-head">
      <span class="eyebrow">pugu · workspace</span>
      <h1>Lead Desk</h1>
      <p class="muted">Verification center for incoming prospects and leads.</p>
    </header>

    <div class="kpis">
      <KpiCard label="Collections" :value="types.length" foot="content types" />
      <KpiCard label="Recent Entries" :value="entries.length" foot="latest records" />
      <KpiCard label="Entries page" foot="manage records">
        <Button variant="ghost" size="sm" @click="router.push('/entries')">Open →</Button>
      </KpiCard>
    </div>

    <section class="band">
      <SectionHeader title="Collections">
        <template #actions>
          <Button variant="ghost" size="sm" @click="router.push('/entries')">View all →</Button>
        </template>
      </SectionHeader>
      <div v-if="loading" class="loading-row"><Spinner :size="18" /></div>
      <NavList v-else :model-value="''" :items="typeItems" @update:model-value="openType" />
    </section>

    <section class="band">
      <SectionHeader :title="`Latest ${types[0]?.name ?? 'entries'}`" />
      <DataTable v-if="entries.length" :columns="entryCols" :rows="rows" />
      <EmptyState v-else title="No entries yet" message="Records will appear here once you add them in Entries." />
    </section>
  </div>
</template>

<style scoped>
.page { padding: clamp(28px, 4vw, 48px) clamp(24px, 5vw, 80px) 72px; max-width: 1100px; margin: 0 auto; }
.page-head { margin-bottom: 28px; }
.eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--c-muted); }
h1 { font-family: var(--font-main); font-size: clamp(30px, 3.4vw, 44px); margin: 0.1em 0; }
.kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 8px; }
.band { padding-block: clamp(28px, 4vw, 48px); border-bottom: 1px solid var(--c-hairline-soft); }
.loading-row { padding: 12px 0; }
@media (max-width: 860px) { .kpis { grid-template-columns: 1fr; } }
</style>
