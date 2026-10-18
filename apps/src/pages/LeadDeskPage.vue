<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import KpiCard from '@huuk/ui/KpiCard.vue'
import NavList from '@huuk/ui/NavList.vue'
import SectionHeader from '@huuk/ui/SectionHeader.vue'
import DataTable from '@huuk/ui/DataTable.vue'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Skeleton from '@huuk/ui/Skeleton.vue'
import Alert from '@huuk/ui/Alert.vue'
import Button from '@huuk/ui/Button.vue'
import { useLeadDeskQuery } from '@/api/queries'

const router = useRouter()

const { data, isPending, isError, error, refetch } = useLeadDeskQuery()

const types = computed(() => data.value?.types ?? [])
const entries = computed(() => data.value?.entries ?? [])

const entryCols = [
  { key: 'id', label: 'ID', width: '5rem' },
  { key: 'title', label: 'Title' },
  { key: 'updated', label: 'Updated', width: '9rem' },
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

    <!-- 1. isPending: Skeleton with layout height (SOP §10.1) -->
    <div v-if="isPending" class="loading-stack">
      <Skeleton v-for="i in 4" :key="i" variant="line" width="100%" />
    </div>

    <!-- 2. isError: Alert + Retry (SOP §10.1) -->
    <div v-else-if="isError" class="error-band">
      <Alert tone="danger" title="Failed to load workspace data">
        {{ error?.message ?? 'An unexpected error occurred' }}
      </Alert>
      <Button size="sm" @click="() => refetch()">Retry</Button>
    </div>

    <!-- 3. isEmpty: EmptyState when no collections exist (SOP §10.1) -->
    <EmptyState
      v-else-if="types.length === 0"
      title="No collections yet"
      message="Create your first collection in Entries to start tracking records."
    />

    <!-- 4. Success: validated payload (SOP §10.1) -->
    <template v-else>
      <section class="band">
        <SectionHeader title="Collections">
          <template #actions>
            <Button variant="ghost" size="sm" @click="router.push('/entries')">View all →</Button>
          </template>
        </SectionHeader>
        <NavList :model-value="''" :items="typeItems" @update:model-value="openType" />
      </section>

      <section class="band">
        <SectionHeader :title="`Latest ${types[0]?.name ?? 'entries'}`" />
        <DataTable v-if="entries.length" :columns="entryCols" :rows="rows" />
        <EmptyState
          v-else
          title="No entries yet"
          message="Records will appear here once you add them in Entries."
        />
      </section>
    </template>
  </div>
</template>

<style scoped>
.page {
  padding: var(--s-xl) var(--s-xxl) var(--s-xxl);
  max-width: var(--layout-max-w);
  margin: 0 auto;
}
.page-head { margin-bottom: var(--s-lg); }
.eyebrow {
  font-size: 0.6875rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: var(--c-muted);
}
h1 { font-family: var(--font-main); margin: 0.1em 0; }
.kpis {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--s-md);
  margin-bottom: var(--s-xs);
}
.band {
  padding-block: var(--s-xl);
  border-bottom: 1px solid var(--c-hairline-soft);
}
.loading-stack {
  display: flex;
  flex-direction: column;
  gap: var(--s-xs);
  padding: var(--s-md) 0;
}
.error-band {
  display: flex;
  flex-direction: column;
  gap: var(--s-sm);
  padding: var(--s-md) 0;
}
@media (max-width: 54rem) {
  .kpis { grid-template-columns: 1fr; }
}
</style>
