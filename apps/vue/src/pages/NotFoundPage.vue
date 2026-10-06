<script setup lang="ts">
import { useRouter } from 'vue-router'
import Button from '@huuk/ui/Button.vue'
import AuthCard from '@huuk/ui/AuthCard.vue'

const router = useRouter()
</script>

<template>
  <AuthCard brand="pugu" title="Page not found" subtitle="The page you're looking for doesn't exist.">
    <Button variant="primary" block @click="router.push('/')">Back to Lead Desk</Button>
  </AuthCard>
</template>
