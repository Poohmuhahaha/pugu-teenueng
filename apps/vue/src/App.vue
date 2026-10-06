<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import Sidebar from '@huuk/layout/Sidebar.vue'
import AppTopbar from '@huuk/layout/AppTopbar.vue'
import Button from '@huuk/ui/Button.vue'
import DropdownMenu from '@huuk/ui/DropdownMenu.vue'
import { me, signOut, switchWorkspace } from '@/lib/auth'

const route = useRoute()
const router = useRouter()

const nav = [
  { id: '/', label: 'Lead Desk', icon: '◆', to: '/' },
  { id: '/entries', label: 'Entries', icon: '▤', to: '/entries' },
  { id: '/graph', label: 'Neural', icon: '✦', to: '/graph' },
]

const isActive = (to: string): boolean =>
  to === '/entries'
    ? route.path.startsWith('/entries') || route.path.startsWith('/sheet')
    : route.path === to

const section = computed({
  get: () => nav.find((n) => isActive(n.to))?.id ?? '',
  set: (id: string) => {
    if (id) router.push(id)
  },
})

const workspaces = computed(() => me.value?.memberships ?? [])
const activeWorkspaceId = computed(
  () => me.value?.actor.workspaceId ?? workspaces.value[0]?.workspace.id ?? null,
)
const workspace = computed(() => {
  const active = workspaces.value.find((m) => m.workspace.id === activeWorkspaceId.value)
  return active?.workspace.name ?? workspaces.value[0]?.workspace.name ?? 'Workspace'
})
const wsItems = computed(() =>
  workspaces.value.map((m) => ({ id: String(m.workspace.id), label: `${m.workspace.name} · ${m.role}` })),
)

const switching = ref(false)
async function pickWorkspace(id: string) {
  const wsId = Number(id)
  if (!wsId || wsId === activeWorkspaceId.value || switching.value) return
  switching.value = true
  try {
    await switchWorkspace(wsId)
    window.location.reload()
  } finally {
    switching.value = false
  }
}

async function logout() {
  await signOut()
  router.push('/login')
}
</script>

<template>
  <RouterView v-if="route.meta.public" />
  <div v-else class="app-shell">
    <div class="app-nav">
      <Sidebar v-model="section" :items="nav" title="pugu" />
    </div>
    <div class="main-area">
      <AppTopbar>
        <template #left>
          <DropdownMenu :items="wsItems" @select="pickWorkspace">
            <template #trigger>
              <Button variant="ghost" size="sm" :caps="false" :disabled="switching">
                {{ workspace }} ▾
              </Button>
            </template>
          </DropdownMenu>
        </template>
        <template #right>
          <Button variant="ghost" size="sm" :caps="false" @click="router.push('/billing')">Billing</Button>
          <Button variant="ghost" size="sm" :caps="false" @click="logout">Sign out</Button>
        </template>
      </AppTopbar>
      <main class="main-content"><RouterView /></main>
    </div>
  </div>
</template>

<style scoped>
.app-shell { display: flex; min-height: 100vh; background: var(--c-canvas); }
.app-nav {
  flex: none; width: fit-content; display: flex; flex-direction: column;
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
}
.app-nav :deep(.p-sidebar) { height: 100%; border: 0; border-right: 1px solid var(--c-hairline-soft); }
.main-area { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.main-content { flex: 1; min-width: 0; }
</style>
