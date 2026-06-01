<script lang="ts">
  import { onMount } from 'svelte';

  export let params: any = undefined;

  interface Billing { subscription: { plan: string; status: string }; usage: { entries: number; members: number }; }

  let billing: Billing | null = null;
  let types: Array<{ slug: string; name: string }> = [];
  let loading = true;
  let error = '';

  async function load() {
    loading = true;
    error = '';
    try {
      const [b, t] = await Promise.all([
        fetch('/api/v1/billing').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/content-types').then((r) => (r.ok ? r.json() : { data: [] })),
      ]);
      billing = b;
      types = t.data ?? [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load workspace data';
    } finally {
      loading = false;
    }
  }
  onMount(load);
</script>

<div class="page-head">
  <div>
    <h1 class="page-title">Your workspace</h1>
    <p class="page-sub">Overview of your subscription, usage, and collections.</p>
  </div>
  <a href="/collections" class="btn btn-secondary">Browse collections</a>
</div>

{#if loading}
  <div class="muted">Loading…</div>
{:else if error}
  <div class="card" style="border-color: var(--c-error); color: var(--c-error)">{error}</div>
{:else if billing}
  <div class="cards">
    <div class="card-soft">
      <div class="kpi-label">Plan</div>
      <div class="kpi-big" style="text-transform: capitalize">{billing.subscription.plan}</div>
      <div class="kpi-sub">
        <span class="badge {billing.subscription.status === 'active' ? 'badge-success' : 'badge-warning'}">
          {billing.subscription.status}
        </span>
      </div>
    </div>
    <div class="card-soft">
      <div class="kpi-label">Entries</div>
      <div class="kpi-big">{billing.usage.entries.toLocaleString()}</div>
      <div class="kpi-sub">across {types.length} collection{types.length === 1 ? '' : 's'}</div>
    </div>
    <div class="card-soft">
      <div class="kpi-label">Members</div>
      <div class="kpi-big">{billing.usage.members}</div>
      <div class="kpi-sub">workspace seats</div>
    </div>
  </div>
{/if}

<h2 class="section-title">Collections</h2>
{#if !loading && types.length === 0}
  <div class="empty-state">
    <h3>No collections yet</h3>
    <p>Define content types in admin, then create entries here.</p>
    <a href="http://localhost:5175" class="btn btn-secondary">Open admin</a>
  </div>
{:else if types.length > 0}
  <div class="grid">
    {#each types as t (t.slug)}
      <a href={`/collections/${t.slug}`} class="card collection-card">
        <div class="big">{t.name}</div>
        <div class="sub"><code>/{t.slug}</code></div>
      </a>
    {/each}
  </div>
{/if}

<style>
  .cards { display: grid; gap: var(--s-lg); grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .grid { display: grid; gap: var(--s-lg); grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
  .section-title {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600; letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: var(--s-xxl) 0 var(--s-lg);
  }
  .kpi-label {
    font: 500 13px/1.4 var(--font-body);
    color: var(--c-muted);
  }
  .kpi-big {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 600; letter-spacing: -0.5px;
    color: var(--c-ink);
    margin-top: var(--s-xs);
  }
  .kpi-sub { font-size: 13px; color: var(--c-muted-soft); margin-top: 6px; }
  .collection-card {
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .collection-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--c-ink);
    text-decoration: none;
  }
  .collection-card .big {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 600; letter-spacing: -0.3px;
    color: var(--c-ink);
  }
  .collection-card .sub { font-size: 13px; color: var(--c-muted); margin-top: 6px; }
</style>
