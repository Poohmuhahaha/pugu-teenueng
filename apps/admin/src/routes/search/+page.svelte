<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  interface Hit { id: number; slug: string; typeName: string; data: Record<string, unknown>; updatedAt: string; }

  let q = '';
  let hits: Hit[] = [];
  let loading = false;
  let total = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    q = $page.url.searchParams.get('q') ?? '';
    if (q) search();
  });

  function onInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(search, 250);
  }

  async function search() {
    if (q.trim().length < 2) { hits = []; total = 0; return; }
    loading = true;
    const url = new URL(window.location.href);
    url.searchParams.set('q', q);
    history.replaceState({}, '', url);
    const res = await fetch(`/api/v1/search?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const body = await res.json();
      hits = body.data;
      total = body.meta.total;
    }
    loading = false;
  }

  function primaryField(d: Record<string, unknown>): string {
    return String(d.title ?? d.name ?? d.email ?? Object.values(d)[0] ?? '—').slice(0, 80);
  }

  function snippet(d: Record<string, unknown>, q: string): string {
    const all = Object.values(d).filter((v) => typeof v === 'string').join(' ');
    const i = all.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return all.slice(0, 120) + (all.length > 120 ? '…' : '');
    const start = Math.max(0, i - 40);
    const end = Math.min(all.length, i + q.length + 40);
    return (start > 0 ? '…' : '') + all.slice(start, end) + (end < all.length ? '…' : '');
  }
</script>

<div class="stack">
  <h2 style="margin:0">Search</h2>
  <!-- svelte-ignore a11y-autofocus -->
  <input
    bind:value={q}
    on:input={onInput}
    on:keydown={(e) => e.key === 'Enter' && search()}
    placeholder="Search across all collections…"
    autofocus
    style="width:100%; height:44px; font-size:15px"
  />

  {#if loading}
    <p style="color:var(--c-muted)">Searching…</p>
  {:else if hits.length === 0 && q.trim().length >= 2}
    <p style="color:var(--c-muted)">No results for <strong>{q}</strong>.</p>
  {:else if hits.length > 0}
    <p style="color:var(--c-muted); font-size:13px; margin:0">{total} {total === 1 ? 'hit' : 'hits'}</p>
    <div class="stack">
      {#each hits as h (`${h.slug}-${h.id}`)}
        <a href={`/entries?type=${h.slug}`} class="card">
          <div class="h-row" style="justify-content:space-between; align-items:flex-start">
            <div style="flex:1">
              <div style="font-weight:600">{primaryField(h.data)}</div>
              <div style="font-size:12px; color:var(--c-muted); margin-top:4px">in <code>{h.slug}</code> · {h.typeName}</div>
              <p style="font-size:13px; margin:8px 0 0; color:var(--c-ink)">{snippet(h.data, q)}</p>
            </div>
            <div style="font-size:11px; color:var(--c-muted)">{new Date(h.updatedAt).toLocaleDateString()}</div>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .card { display: block; background: var(--c-surface-card); border: 1px solid var(--c-hairline); border-radius: 10px; padding: 16px; text-decoration: none; color: inherit; }
  .card:hover { border-color: var(--c-ink); }
  code { background: rgba(124,58,237,0.08); padding: 1px 5px; border-radius: 4px; font-size: 11px; }
</style>
