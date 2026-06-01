<script lang="ts">
  import { onMount } from 'svelte';

  interface Billing {
    subscription: { plan: string; status: string; currentPeriodEnd?: string };
    usage: { entries: number; members: number; storage?: number };
    limits?: { entries?: number; members?: number; storage?: number };
  }

  let billing: Billing | null = null;
  let loading = true;
  let error = '';

  async function load() {
    loading = true;
    error = '';
    try {
      const res = await fetch('/api/v1/billing');
      if (!res.ok) { error = `Failed to load billing (${res.status})`; return; }
      billing = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : 'Network error';
    } finally {
      loading = false;
    }
  }

  function fmtNum(n: number | undefined): string {
    if (n === undefined || n === null) return '—';
    return n.toLocaleString();
  }

  onMount(load);
</script>

<svelte:head><title>Billing · LifeOS</title></svelte:head>

<div class="page-head">
  <div>
    <h1 class="page-title">Billing & usage</h1>
    <p class="page-sub">Your subscription, seats, and consumption.</p>
  </div>
  <a href="/" class="btn btn-secondary">Back to home</a>
</div>

{#if loading}
  <div class="muted">Loading…</div>
{:else if error}
  <div class="card" style="border-color: var(--c-error); color: var(--c-error)">{error}</div>
{:else if billing}
  <div class="grid">
    <div class="card-soft">
      <div class="kpi-label">Current plan</div>
      <div class="kpi-big" style="text-transform: capitalize">{billing.subscription.plan}</div>
      <div class="kpi-sub">
        <span class="badge {billing.subscription.status === 'active' ? 'badge-success' : 'badge-warning'}">
          {billing.subscription.status}
        </span>
      </div>
    </div>
    <div class="card-soft">
      <div class="kpi-label">Entries</div>
      <div class="kpi-big">{fmtNum(billing.usage.entries)}</div>
      {#if billing.limits?.entries}
        <div class="kpi-sub">of {fmtNum(billing.limits.entries)} allowed</div>
      {/if}
    </div>
    <div class="card-soft">
      <div class="kpi-label">Members</div>
      <div class="kpi-big">{fmtNum(billing.usage.members)}</div>
      {#if billing.limits?.members}
        <div class="kpi-sub">of {fmtNum(billing.limits.members)} seats</div>
      {/if}
    </div>
  </div>

  <div class="card mt-xxl">
    <h2 class="block-title">Manage your subscription</h2>
    <p class="muted">Plan upgrades, payment methods, and invoices live in the admin console.</p>
    <a class="btn mt-md" href="http://localhost:5175/billing" target="_blank" rel="noopener">Open admin billing</a>
  </div>
{/if}

<style>
  .grid { display: grid; gap: var(--s-lg); grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .kpi-label { font: 500 13px/1.4 var(--font-body); color: var(--c-muted); }
  .kpi-big {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 600; letter-spacing: -0.5px;
    color: var(--c-ink);
    margin-top: var(--s-xs);
  }
  .kpi-sub { font-size: 13px; color: var(--c-muted-soft); margin-top: 6px; }
  .block-title {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600; letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
</style>
