<script lang="ts">
  import { onMount } from 'svelte';

  export let params: any = undefined;

  interface Billing { subscription: { plan: string; status: string }; usage: { entries: number; members: number }; }

  let billing: Billing | null = null;
  let types: Array<{ slug: string; name: string }> = [];

  async function load() {
    const [b, t] = await Promise.all([
      fetch('/api/v1/billing').then((r) => (r.ok ? r.json() : null)),
      fetch('/api/v1/content-types').then((r) => (r.ok ? r.json() : { data: [] })),
    ]);
    billing = b;
    types = t.data;
  }
  onMount(load);
</script>

<h1>Your workspace</h1>

{#if billing}
  <div class="cards">
    <div class="card">
      <div class="label">Plan</div>
      <div class="big" style="text-transform:capitalize">{billing.subscription.plan}</div>
      <div class="sub">{billing.subscription.status}</div>
    </div>
    <div class="card">
      <div class="label">Entries</div>
      <div class="big">{billing.usage.entries.toLocaleString()}</div>
      <div class="sub">across {types.length} collections</div>
    </div>
    <div class="card">
      <div class="label">Members</div>
      <div class="big">{billing.usage.members}</div>
      <div class="sub">workspace seats</div>
    </div>
  </div>
{/if}

<h2 style="margin-top:32px">Collections</h2>
{#if types.length === 0}
  <p style="color:var(--muted)">No collections yet. Define some at <a href="http://localhost:5175">admin</a>.</p>
{:else}
  <div class="grid">
    {#each types as t (t.slug)}
      <a href={`/collections/${t.slug}`} class="card link">
        <div class="big">{t.name}</div>
        <div class="sub"><code>/{t.slug}</code></div>
      </a>
    {/each}
  </div>
{/if}

<style>
  h1 { font-size: 28px; margin: 0 0 24px; letter-spacing: -0.02em; }
  h2 { font-size: 18px; margin: 24px 0 14px; }
  .cards, .grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 18px; text-decoration: none; color: inherit; }
  .card.link:hover { border-color: var(--accent); }
  .label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; }
  .big { font-size: 22px; font-weight: 700; margin-top: 6px; }
  .sub { font-size: 12px; color: var(--muted); margin-top: 4px; }
  code { background: rgba(124, 58, 237, 0.08); padding: 1px 6px; border-radius: 4px; }
</style>
