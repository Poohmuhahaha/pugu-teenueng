<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import EmptyState from '@huuk/ui/EmptyState.vue'
import Skeleton from '@huuk/ui/Skeleton.vue'
import Alert from '@huuk/ui/Alert.vue'
import Button from '@huuk/ui/Button.vue'
import QuestGraph from '@huuk/ui/QuestGraph.vue'
import { useGraphDataQuery, type GraphNodeItem } from '@/api/queries'

const router = useRouter()
const TOPBAR_H = 54

const { data, isPending, isError, error, refetch } = useGraphDataQuery()

const nodes = computed(() => data.value?.nodes ?? [])
const edges = computed(() => data.value?.edges ?? [])
const colors = computed(() => data.value?.colors ?? {})
const graphHeight = ref(Math.max(320, window.innerHeight - TOPBAR_H))

function openNode(node: GraphNodeItem) {
  router.push({ path: '/entries', query: { type: node.group } })
}

function onResize() {
  graphHeight.value = Math.max(320, window.innerHeight - TOPBAR_H)
}

onMounted(() => {
  window.addEventListener('resize', onResize)
})
onUnmounted(() => window.removeEventListener('resize', onResize))
</script>

<template>
  <div class="graph-page">
    <!-- 1. isPending: Skeleton (SOP §10.1) -->
    <div v-if="isPending" class="loading-stack">
      <Skeleton v-for="i in 4" :key="i" variant="line" width="100%" />
    </div>

    <!-- 2. isError: Alert + Retry (SOP §10.1) -->
    <div v-else-if="isError" class="center">
      <Alert tone="danger" title="Failed to load knowledge graph">
        {{ error?.message ?? 'An unexpected error occurred' }}
      </Alert>
      <Button size="sm" @click="() => refetch()">Retry</Button>
    </div>

    <!-- 3. isEmpty: EmptyState (SOP §10.1) -->
    <EmptyState
      v-else-if="nodes.length === 0"
      title="Nothing to map yet"
      message="Create entries and add [[wiki-links]] in any text field."
    />

    <!-- 4. Success: validated graph payload (SOP §10.1) -->
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
.graph-page { min-height: calc(100vh - var(--layout-topbar-h)); }
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
