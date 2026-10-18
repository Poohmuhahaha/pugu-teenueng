import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { loadMe, me } from '@/lib/auth'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { public: true, title: 'Sign in' },
  },
  { path: '/', name: 'lead-desk', component: () => import('@/pages/LeadDeskPage.vue') },
  { path: '/entries', name: 'entries', component: () => import('@/pages/EntriesPage.vue') },
  { path: '/sheet/:slug', name: 'sheet', component: () => import('@/pages/SheetPage.vue') },
  { path: '/sheet/:slug/:id', name: 'sheet-row', component: () => import('@/pages/SheetPage.vue') },
  { path: '/graph', name: 'graph', component: () => import('@/pages/GraphPage.vue') },
  { path: '/billing', name: 'billing', component: () => import('@/pages/BillingPage.vue') },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { public: true },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  if (!me.value) await loadMe()
  if (!me.value) return { name: 'login', query: { return: to.fullPath } }
  return true
})
