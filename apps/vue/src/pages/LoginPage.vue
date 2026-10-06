<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Input from '@huuk/ui/Input.vue'
import Field from '@huuk/ui/Field.vue'
import Alert from '@huuk/ui/Alert.vue'
import Button from '@huuk/ui/Button.vue'
import AuthCard from '@huuk/ui/AuthCard.vue'
import { signIn } from '@/lib/auth'

const route = useRoute()
const router = useRouter()

const email = ref('pooh@questpage.app')
const password = ref('changeme123')
const err = ref('')
const loading = ref(false)

async function submit() {
  err.value = ''
  loading.value = true
  try {
    await signIn(email.value, password.value)
    const ret = String(route.query.return ?? '/')
    router.push(ret.startsWith('/') && !ret.startsWith('//') ? ret : '/')
  } catch (e) {
    err.value = e instanceof Error ? e.message : 'Sign in failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthCard brand="pugu" title="Sign in" subtitle="Welcome back. Enter your credentials to continue.">
    <form class="auth-form" @submit.prevent="submit">
      <Field label="Email" html-for="email">
        <Input id="email" v-model="email" type="email" placeholder="you@company.com" />
      </Field>
      <Field label="Password" html-for="password">
        <Input id="password" v-model="password" type="password" placeholder="••••••••" />
      </Field>
      <Alert v-if="err" tone="danger" title="Sign in failed">{{ err }}</Alert>
      <Button type="submit" variant="primary" block :loading="loading">
        {{ loading ? 'Signing in…' : 'Sign in' }}
      </Button>
    </form>
    <template #footer>Demo workspace · pooh@questpage.app / changeme123</template>
  </AuthCard>
</template>

<style scoped>
.auth-form { display: flex; flex-direction: column; gap: 16px; }
</style>
