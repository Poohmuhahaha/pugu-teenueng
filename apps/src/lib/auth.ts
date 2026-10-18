import { ref } from 'vue'
import { api, type Me } from './api'

export const me = ref<Me | null>(null)
export const ready = ref(false)

export async function loadMe(): Promise<void> {
  try {
    me.value = await api.me()
  } catch {
    me.value = null
  } finally {
    ready.value = true
  }
}

export async function signIn(email: string, password: string): Promise<void> {
  await api.login(email, password)
  await loadMe()
}

export async function signOut(): Promise<void> {
  await api.logout()
  me.value = null
}

export async function switchWorkspace(id: number): Promise<void> {
  await api.switchWorkspace(id)
  await loadMe()
}
