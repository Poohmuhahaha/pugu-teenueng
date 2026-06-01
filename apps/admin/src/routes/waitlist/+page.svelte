<script lang="ts">
  import { onMount } from 'svelte';

  interface Entry { id: number; email: string; utmSource: string | null; utmCampaign: string | null; ref: string | null; createdAt: string; }

  let rows: Entry[] = [];
  let loading = true;
  let search = '';

  async function load() {
    loading = true;
    const res = await fetch('/api/v1/waitlist?limit=1000');
    if (res.ok) rows = (await res.json()).data;
    loading = false;
  }

  $: filtered = search.trim()
    ? rows.filter((r) =>
        r.email.toLowerCase().includes(search.toLowerCase())
        || (r.utmSource ?? '').toLowerCase().includes(search.toLowerCase())
        || (r.utmCampaign ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : rows;

  onMount(load);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">Waitlist <span style="color:var(--c-muted); font-weight:400">({rows.length})</span></h2>
    <a class="btn" href="/api/v1/waitlist/export">Download CSV</a>
  </div>

  <input bind:value={search} placeholder="Search email / utm…" style="width:100%" />

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if filtered.length === 0}
    <div class="card" style="text-align:center; padding:40px; color:var(--c-muted)">No matches.</div>
  {:else}
    <table class="t">
      <thead><tr><th>Email</th><th>Source</th><th>Campaign</th><th>Referrer</th><th>Joined</th></tr></thead>
      <tbody>
        {#each filtered as r (r.id)}
          <tr>
            <td>{r.email}</td>
            <td>{r.utmSource ?? ''}</td>
            <td>{r.utmCampaign ?? ''}</td>
            <td style="font-size:11px; color:var(--c-muted); max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap" title={r.ref ?? ''}>{r.ref ?? ''}</td>
            <td>{new Date(r.createdAt).toLocaleDateString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .t { width:100%; border-collapse: collapse; background: var(--c-surface-card); border:1px solid var(--c-hairline); border-radius:10px; overflow:hidden; }
  .t th { text-align:left; font-size:11px; text-transform:uppercase; color:var(--c-muted); padding:10px 12px; background:var(--c-surface-card); border-bottom:1px solid var(--c-hairline); }
  .t td { padding:10px 12px; font-size:13px; border-bottom:1px solid var(--c-hairline); }
  .t tr:last-child td { border-bottom:none; }
</style>
