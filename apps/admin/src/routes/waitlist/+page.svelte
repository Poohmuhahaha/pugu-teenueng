<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';

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

  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  $: paginatedFiltered = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  onMount(load);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">Waitlist <span style="color:var(--c-muted); font-weight:400">({rows.length})</span></h2>
    <a class="btn" href="/api/v1/waitlist/export">Download CSV</a>
  </div>

  <input bind:value={search} class="input" placeholder="Search email / utm…" style="width:100%" />

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if filtered.length === 0}
    <div class="card" style="text-align:center; padding:40px; color:var(--c-muted)">No matches.</div>
  {:else}
    <table class="t">
      <thead><tr><th>Email</th><th>Source</th><th>Campaign</th><th>Referrer</th><th>Joined</th></tr></thead>
      <tbody>
        {#each paginatedFiltered as r (r.id)}
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
    <Pagination bind:currentPage {totalPages} />
  {/if}
</div>

<style>
</style>
