<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Spinner from '@huuk/ui/Spinner.vue'
import QuestGraph from '@huuk/ui/QuestGraph.vue'
import { api } from '@/lib/api'

interface GraphNode {
  id: number
  label: string
  group: string
}
interface GraphEdge {
  source: number
  target: number
}

const router = useRouter()
const PALETTE = ['#000000', '#3f3f46', '#71717a', '#a1a1aa', '#18181b', '#52525b', '#a3a3a3', '#27272a']
const TOPBAR_H = 54

const nodes = ref<GraphNode[]>([])
const edges = ref<GraphEdge[]>([])
const colors = ref<Record<string, string>>({})
const loading = ref(true)
const graphHeight = ref(Math.max(320, window.innerHeight - TOPBAR_H))

async function load() {
  loading.value = true
  const types = await api.contentTypes()
  const map: Record<string, string> = {}
  types.forEach((t, i) => (map[t.slug] = PALETTE[i % PALETTE.length]))
  colors.value = map

  const all: GraphNode[] = []
  for (const t of types) {
    const res = await api.entries(t.slug, 1, 200)
    for (const e of res.data) {
      all.push({ id: e.id, label: String(e.title ?? e.name ?? `#${e.id}`).slice(0, 40), group: t.slug })
    }
  }
  nodes.value = all

  const known = new Set(all.map((n) => n.id))
  const refs = await api.backrefsAll()
  edges.value = refs
    .filter((r) => r.toEntryId !== null && known.has(r.fromEntryId) && known.has(r.toEntryId))
    .map((r) => ({ source: r.fromEntryId, target: r.toEntryId as number }))

  loading.value = false
}

function openNode(node: GraphNode) {
  router.push({ path: '/entries', query: { type: node.group } })
}

function onResize() {
  graphHeight.value = Math.max(320, window.innerHeight - TOPBAR_H)
}

onMounted(() => {
  window.addEventListener('resize', onResize)
  load()
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="graph-page">
    <div v-if="loading" class="center"><Spinner :size="18" /></div>
    <EmptyState
      v-else-if="nodes.length === 0"
      title="Nothing to map yet"
      message="Create entries and add [[wiki-links]] in any text field."
    />
    <QuestGraph
      v-else
      :nodes="nodes"
      :edges="edges"
      :colors="colors"
      :height="graphHeight"
      :framed="false"
      @select="openNode"
    />
  </div>
</template>

<style scoped>
.graph-page { min-height: calc(100vh - 54px); }
.center { display: grid; place-items: center; padding: 40px; }
</style>
