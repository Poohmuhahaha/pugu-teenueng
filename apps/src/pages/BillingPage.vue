<script setup lang="ts">
import Panel from '@huuk/ui/Panel.vue'
import Badge from '@huuk/ui/Badge.vue'

const plans = [
  { name: 'Free', price: '$0', note: '1 Dashboard · 1 Adventurer · 1,000 entries' },
  { name: 'Adventurer Pro', price: '$5.99', note: 'Unlimited entries · 5 GB · Workspace Seal API' },
  { name: 'Admin', price: '$29', note: '10 Adventurers · 50 GB · SSO' },
]
</script>

<template>
  <div class="page">
    <header class="page-head">
      <span class="eyebrow">pugu · account</span>
      <h1>Billing &amp; usage</h1>
      <p class="muted">Your subscription, seats, and consumption.</p>
    </header>
    <div class="tiers">
      <Panel v-for="(p, i) in plans" :key="p.name" :title="p.name">
        <template #actions>
          <Badge v-if="i === 1" variant="solid">popular</Badge>
        </template>
        <div class="tier-price">{{ p.price }} <span>/ month</span></div>
        <p class="muted">{{ p.note }}</p>
      </Panel>
    </div>
  </div>
</template>

<style scoped>
.page { padding: clamp(28px, 4vw, 48px) clamp(24px, 5vw, 80px) 72px; max-width: 1100px; margin: 0 auto; }
.page-head { margin-bottom: 8px; }
.eyebrow { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--c-muted); }
h1 { font-family: var(--font-main); font-size: clamp(30px, 3.4vw, 44px); margin: 0.1em 0; }
.tiers { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }
.tier-price { font-family: var(--font-main); font-size: 34px; font-weight: 700; margin: 0 0 10px; }
.tier-price span { font-family: var(--font-body); font-size: 13px; font-weight: 400; color: var(--c-muted); }
@media (max-width: 860px) { .tiers { grid-template-columns: 1fr; } }
</style>
