<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import type { ContentTypeField } from '@lifeos/core';

  export let params: any = undefined;

  interface ContentType { id: number; slug: string; name: string; schema: { fields: ContentTypeField[] }; }
  interface Entry { id: number; createdAt: string; updatedAt: string; [k: string]: unknown; }

  let types: ContentType[] = [];
  let selectedSlug = '';
  let selectedType: ContentType | null = null;
  let entries: Entry[] = [];
  let loading = false;
  let creating = false;
  let newData: Record<string, unknown> = {};
  let err = '';

  $: selectedSlug = $page.url.searchParams.get('type') ?? '';
  $: selectedType = types.find((t) => t.slug === selectedSlug) ?? null;

  async function loadTypes() {
    const res = await fetch('/api/v1/content-types');
    if (res.ok) types = (await res.json()).data;
  }

  async function loadEntries(slug: string) {
    if (!slug) return;
    loading = true;
    const res = await fetch(`/api/v1/${slug}?pagination[pageSize]=50&sort=updatedAt:desc`);
    if (res.ok) entries = (await res.json()).data;
    loading = false;
  }

  $: if (selectedSlug) loadEntries(selectedSlug);

  function pickSlug(slug: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('type', slug);
    history.pushState({}, '', url);
    selectedSlug = slug;
    creating = false;
    newData = {};
  }

  async function submitNew() {
    err = '';
    if (!selectedType) return;
    const res = await fetch(`/api/v1/${selectedType.slug}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (!res.ok) { err = await res.text(); return; }
    creating = false;
    newData = {};
    await loadEntries(selectedType.slug);
  }

  async function softDelete(id: number) {
    if (!selectedType || !confirm('Delete this entry?')) return;
    const res = await fetch(`/api/v1/${selectedType.slug}/${id}`, { method: 'DELETE' });
    if (res.ok) entries = entries.filter((e) => e.id !== id);
  }

  onMount(loadTypes);
</script>

<div class="stack">
  <h2 style="margin:0">Entries</h2>
  <p style="color:var(--muted); font-size:13.5px; margin:4px 0 16px">
    View, create, search, and manage individual raw database records across all custom collections and content types defined in your workspace.
  </p>

  <div class="h-row" style="flex-wrap:wrap; gap:6px">
    {#each types as t (t.id)}
      <button class="btn-chip" class:active={t.slug === selectedSlug} on:click={() => pickSlug(t.slug)}>
        {t.name}
      </button>
    {/each}
    {#if types.length === 0}
      <span style="color:var(--muted); font-size:13px">No content types yet — define one on the home page first.</span>
    {/if}
  </div>

  {#if selectedType}
    <div class="h-row" style="justify-content: space-between">
      <span style="color:var(--muted); font-size:13px">{entries.length} entries in <code>{selectedType.slug}</code></span>
      <button class="btn" on:click={() => (creating = !creating)}>{creating ? 'Cancel' : '+ New Entry'}</button>
    </div>

    {#if creating}
      <form class="card stack" on:submit|preventDefault={submitNew}>
        {#each selectedType.schema.fields as f (f.name)}
          <div>
            <div class="label">{f.name}{f.required ? ' *' : ''}</div>
            {#if f.type === 'richtext'}
              <textarea rows="4" bind:value={newData[f.name]} required={f.required} style="width:100%"></textarea>
            {:else if f.type === 'select' && f.options}
              <select bind:value={newData[f.name]} required={f.required}>
                <option value=""></option>
                {#each f.options as o}<option value={o}>{o}</option>{/each}
              </select>
            {:else if f.type === 'date'}
              <input type="date" bind:value={newData[f.name]} required={f.required} />
            {:else if f.type === 'number'}
              <input type="number" bind:value={newData[f.name]} required={f.required} />
            {:else if f.type === 'checkbox'}
              <input type="checkbox" bind:checked={newData[f.name]} />
            {:else}
              <input type="text" bind:value={newData[f.name]} required={f.required} style="width:100%" />
            {/if}
          </div>
        {/each}
        {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
        <button type="submit" class="btn">Create</button>
      </form>
    {/if}

    {#if loading}
      <p style="color:var(--muted)">Loading…</p>
    {:else if entries.length === 0}
      <div class="card" style="text-align:center; padding:48px 20px; color:var(--muted)">
        No entries yet in this collection.
      </div>
    {:else}
      <table class="entries-table">
        <thead>
          <tr>
            <th>id</th>
            {#each selectedType.schema.fields.slice(0, 4) as f}<th>{f.name}</th>{/each}
            <th>updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each entries as e (e.id)}
            <tr>
              <td>{e.id}</td>
              {#each selectedType.schema.fields.slice(0, 4) as f}
                <td>{String(e[f.name] ?? '').slice(0, 60)}</td>
              {/each}
              <td>{new Date(e.updatedAt).toLocaleDateString()}</td>
              <td><button class="btn-ghost" on:click={() => softDelete(e.id)}>Delete</button></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  {/if}
</div>

<style>
  .btn-chip {
    padding: 6px 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 999px;
    font-size: 12px;
    cursor: pointer;
    color: var(--ink);
  }
  .btn-chip:hover { background: var(--border); }
  .btn-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
  .entries-table { width: 100%; border-collapse: collapse; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  .entries-table th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--muted); padding: 10px 12px; background: var(--surface); border-bottom: 1px solid var(--border); }
  .entries-table td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
  .entries-table tr:last-child td { border-bottom: none; }
  .btn-ghost { background: transparent; border: 1px solid var(--border); padding: 4px 10px; border-radius: 6px; font-size: 12px; cursor: pointer; color: var(--ink); }
  .btn-ghost:hover { background: var(--border); }
</style>
