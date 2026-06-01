<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { page } from '$app/stores';
  import type { ContentTypeField } from '@lifeos/core';
  import { onSyncEvent } from '$lib/sync';

  export let params: any = undefined;

  interface Entry { id: number; createdAt: string; updatedAt: string; [k: string]: unknown; }
  interface ContentType { id: number; slug: string; name: string; schema: { fields: ContentTypeField[] }; }

  let type: ContentType | null = null;
  let entries: Entry[] = [];
  let view: 'table' | 'kanban' | 'calendar' = 'table';
  let loading = true;
  let backrefs: Record<number, number> = {};

  $: slug = $page.params.slug;

  async function load() {
    loading = true;
    const [tRes, eRes] = await Promise.all([
      fetch('/api/v1/content-types').then((r) => r.json()),
      fetch(`/api/v1/${slug}?pagination[pageSize]=100&sort=updatedAt:desc`).then((r) => r.json()),
    ]);
    type = (tRes.data as ContentType[]).find((t) => t.slug === slug) ?? null;
    entries = eRes.data;
    // Fetch incoming-ref counts in parallel
    const counts = await Promise.all(
      entries.map((e) => fetch(`/api/v1/backrefs?to=${e.id}`).then((r) => r.json()).then((j) => j.data.length))
    );
    backrefs = Object.fromEntries(entries.map((e, i) => [e.id, counts[i] as number]));
    loading = false;
  }

  $: if (slug) load();

  let unsub: (() => void) | null = null;
  let debounce: ReturnType<typeof setTimeout> | null = null;
  onMount(() => {
    unsub = onSyncEvent((e) => {
      if ('contentTypeSlug' in e && e.contentTypeSlug === slug) {
        if (debounce) clearTimeout(debounce);
        debounce = setTimeout(load, 300);
      }
    });
  });
  onDestroy(() => { unsub?.(); if (debounce) clearTimeout(debounce); });

  function statusOf(e: Entry): string {
    return String(e.status ?? e.state ?? '—');
  }
  function dateOf(e: Entry): string | null {
    for (const k of ['date', 'dueDate', 'startedAt', 'lastContacted']) {
      const v = e[k];
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
    }
    return null;
  }
</script>

<div class="head">
  <div>
    <a href="/" style="color:var(--c-muted); text-decoration:none; font-size:13px">← Collections</a>
    <h1 style="margin:8px 0 0">{type?.name ?? slug}</h1>
    <p style="color:var(--c-muted); font-size:13px; margin:4px 0">{entries.length} entries</p>
  </div>
  <div class="views">
    <button class:active={view === 'table'} on:click={() => (view = 'table')}>Table</button>
    <button class:active={view === 'kanban'} on:click={() => (view = 'kanban')}>Kanban</button>
    <button class:active={view === 'calendar'} on:click={() => (view = 'calendar')}>Calendar</button>
  </div>
</div>

{#if loading}
  <p style="color:var(--c-muted)">Loading…</p>
{:else if entries.length === 0}
  <div class="empty">No entries yet. Add one from <a href="http://localhost:5175/entries?type={slug}">admin</a>.</div>
{:else if view === 'table' && type}
  <table class="t">
    <thead>
      <tr>
        <th>id</th>
        {#each type.schema.fields.slice(0, 5) as f}<th>{f.name}</th>{/each}
        <th>backrefs</th>
        <th>updated</th>
      </tr>
    </thead>
    <tbody>
      {#each entries as e (e.id)}
        <tr>
          <td><a href={`/collections/${slug}/${e.id}`}>{e.id}</a></td>
          {#each type.schema.fields.slice(0, 5) as f}
            <td>{String(e[f.name] ?? '').slice(0, 60)}</td>
          {/each}
          <td>{backrefs[e.id] || 0}</td>
          <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else if view === 'kanban'}
  <div class="kanban">
    {#each [...new Set(entries.map(statusOf))] as col (col)}
      <div class="col">
        <div class="col-head">{col}</div>
        {#each entries.filter((e) => statusOf(e) === col) as e (e.id)}
          <a href={`/collections/${slug}/${e.id}`} class="kb-card">{String(e.title ?? e.name ?? e.id)}</a>
        {/each}
      </div>
    {/each}
  </div>
{:else if view === 'calendar'}
  <div class="calendar">
    {#each entries.filter((e) => dateOf(e)) as e (e.id)}
      <div class="cal-row">
        <span class="cal-date">{dateOf(e)}</span>
        <a href={`/collections/${slug}/${e.id}`} class="cal-title">{String(e.title ?? e.name ?? e.id)}</a>
      </div>
    {/each}
    {#if entries.filter((e) => dateOf(e)).length === 0}
      <p style="color:var(--c-muted)">No entries with date fields.</p>
    {/if}
  </div>
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.04em; color: var(--c-ink); }
  .views {
    display: flex; gap: 4px; padding: 4px;
    background: var(--surface-soft, #f8f9fa);
    border: 1px solid var(--c-hairline); border-radius: 9999px;
  }
  .views button {
    padding: 6px 14px; border: none; background: transparent;
    border-radius: 9999px; font-size: 13px; cursor: pointer;
    color: var(--c-muted); font-weight: 500; transition: all 0.2s;
  }
  .views button:hover:not(.active) { color: var(--c-ink); }
  .views button.active {
    background: var(--c-canvas); color: var(--c-ink);
    font-weight: 600; box-shadow: var(--shadow-sm);
  }
  .empty { padding: 60px 20px; text-align: center; color: var(--c-muted-soft); border: 1px dashed var(--c-hairline); border-radius: 12px; }
  .t {
    width: 100%; border-collapse: collapse; background: var(--c-canvas);
    border: 1px solid var(--c-hairline); border-radius: 8px; overflow: hidden;
  }
  .t th {
    text-align: left; font-size: 11px; text-transform: uppercase;
    color: var(--c-muted); padding: 12px 16px; border-bottom: 1px solid var(--c-hairline);
    font-weight: 600; letter-spacing: 0.05em;
  }
  .t td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid var(--c-hairline); color: var(--c-body); }
  .t tr:last-child td { border-bottom: none; }
  .t a { color: var(--c-ink); text-decoration: none; font-weight: 600; }
  .t a:hover { color: var(--c-brand-accent); }
  .kanban { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px; }
  .col {
    min-width: 260px; background: var(--c-surface-card);
    border: 1px solid var(--c-hairline); border-radius: 12px;
    padding: 16px; display: flex; flex-direction: column; gap: 8px;
  }
  .col-head { font-size: 11px; text-transform: uppercase; color: var(--c-muted); font-weight: 600; letter-spacing: 0.05em; margin-bottom: 8px; }
  .kb-card {
    display: block; background: var(--c-canvas); border: 1px solid var(--c-hairline);
    border-radius: 8px; padding: 12px; font-size: 13px; color: var(--c-ink);
    text-decoration: none; transition: all 0.2s; font-weight: 500;
  }
  .kb-card:hover {
    border-color: var(--c-muted);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }
  .calendar { display: flex; flex-direction: column; gap: 8px; }
  .cal-row {
    display: flex; gap: 24px; align-items: center;
    padding: 12px 16px; border: 1px solid var(--c-hairline);
    border-radius: 8px; background: var(--c-canvas);
    transition: border-color 0.2s;
  }
  .cal-row:hover { border-color: var(--c-muted); }
  .cal-date { font-size: 12px; color: var(--c-muted); font-variant-numeric: tabular-nums; min-width: 100px; font-weight: 500; }
  .cal-title { color: var(--c-ink); text-decoration: none; font-size: 14px; font-weight: 600; transition: color 0.2s; }
  .cal-title:hover { color: var(--c-brand-accent); }
</style>
