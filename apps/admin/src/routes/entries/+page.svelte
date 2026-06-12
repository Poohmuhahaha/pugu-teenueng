<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ContentTypeField } from '@questpage/core';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  export let params: any = undefined;

  interface ContentType { id: number; slug: string; name: string; schema: { fields: ContentTypeField[] }; }
  interface Entry { id: number; createdAt: string; updatedAt: string; [k: string]: unknown; }

  let types: ContentType[] = [];
  let selectedSlug = '';
  let selectedType: ContentType | null = null;
  let entries: Entry[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(entries.length / itemsPerPage) || 1;
  $: paginatedEntries = entries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let loading = false;
  let creating = false;
  let newData: Record<string, unknown> = {};
  let err = '';

  let deleteModalOpen = false;
  let entryToDelete: number | null = null;

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

  function softDelete(id: number) {
    if (!selectedType) return;
    entryToDelete = id;
    deleteModalOpen = true;
  }

  async function confirmSoftDelete() {
    if (!selectedType || entryToDelete === null) return;
    const res = await fetch(`/api/v1/${selectedType.slug}/${entryToDelete}`, { method: 'DELETE' });
    if (res.ok) entries = entries.filter((e) => e.id !== entryToDelete);
    deleteModalOpen = false;
    entryToDelete = null;
  }

  onMount(loadTypes);
</script>

<header class="hero-head">
  <div class="hero-row">
    <div class="hero-text">
      <h1 class="hero-title">Entries</h1>
      <p class="hero-sub">Manage your workspace records, filter across custom collections, and intuitively create new entries.</p>
    </div>
  </div>
</header>

<div class="layout-container">
  <aside class="sidebar">
    <div class="sidebar-header">
      <h3>Collections</h3>
    </div>
    <div class="sidebar-nav">
      {#each types as t (t.id)}
        <button class="nav-item" class:active={t.slug === selectedSlug} on:click={() => pickSlug(t.slug)}>
          <span class="nav-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          </span>
          <span class="nav-label">{t.name}</span>
        </button>
      {/each}
      {#if types.length === 0}
        <div class="empty-sidebar">No collections found.</div>
      {/if}
    </div>
  </aside>

  <main class="main-content">
    {#if !selectedType}
      <div class="empty-state card">
        <div class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        </div>
        <h3>Select a collection</h3>
        <p>Pick a content type from the sidebar to view or manage its entries.</p>
      </div>
    {:else}
      <div class="content-header card" in:fade={{duration: 200}}>
        <div class="content-title">
          <h2>{selectedType.name}</h2>
          <span class="badge badge-muted">{entries.length} Total</span>
        </div>
        <button class="btn btn-primary" on:click={() => (creating = true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Entry
        </button>
      </div>

      <!-- Creation Slide-over / Modal -->
      {#if creating}
        <div class="modal-overlay" on:click={() => (creating = false)} in:fade={{duration: 200}} out:fade={{duration: 200}}>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="modal-card panel" on:click|stopPropagation in:fly={{ x: 200, duration: 250, easing: quintOut }} out:fly={{ x: 200, duration: 200, easing: quintOut }}>
            <div class="modal-header">
              <h3>Create new {selectedType.name}</h3>
              <button class="modal-close-btn" on:click={() => (creating = false)}>×</button>
            </div>
            <form class="modal-body stack" on:submit|preventDefault={submitNew}>
              <div class="form-scroll">
                {#each selectedType.schema.fields as f (f.name)}
                  <div class="field-wrap">
                    <label class="field-label">{f.name}{f.required ? ' *' : ''}</label>
                    {#if f.type === 'richtext'}
                      <textarea rows="4" bind:value={newData[f.name]} required={f.required} class="modern-input"></textarea>
                    {:else if f.type === 'select' && f.options}
                      <select bind:value={newData[f.name]} required={f.required} class="modern-input">
                        <option value=""></option>
                        {#each f.options as o}<option value={o}>{o}</option>{/each}
                      </select>
                    {:else if f.type === 'date'}
                      <input type="date" bind:value={newData[f.name]} required={f.required} class="modern-input" />
                    {:else if f.type === 'number'}
                      <input type="number" bind:value={newData[f.name]} required={f.required} class="modern-input" />
                    {:else if f.type === 'checkbox'}
                      <label class="toggle-switch">
                        <input type="checkbox" bind:checked={newData[f.name]} />
                        <span class="slider"></span>
                      </label>
                    {:else}
                      <input type="text" bind:value={newData[f.name]} required={f.required} class="modern-input" />
                    {/if}
                  </div>
                {/each}
              </div>
              {#if err}<div class="error-banner">{err}</div>{/if}
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" on:click={() => (creating = false)}>Cancel</button>
                <button type="submit" class="btn btn-primary">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      {/if}

      {#if loading}
        <div class="loading-state card">
          <div class="spinner"></div>
          <p>Loading entries...</p>
        </div>
      {:else if entries.length === 0}
        <div class="empty-state card" in:fade>
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3>No entries found</h3>
          <p>This collection is empty. Start by creating the first entry.</p>
          <button class="btn btn-primary" on:click={() => (creating = true)}>Create Entry</button>
        </div>
      {:else}
        <div class="table-container card" in:fade>
          <div style="overflow-x: auto;">
            <table class="modern-table">
              <thead>
                <tr>
                  <th width="80">ID</th>
                  {#each selectedType.schema.fields.slice(0, 4) as f}<th>{f.name}</th>{/each}
                  <th width="140">Updated</th>
                  <th width="80" style="text-align: right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each paginatedEntries as e, i (e.id)}
                  <tr in:fly={{y: 10, duration: 200, delay: i * 30}}>
                    <td class="id-cell"><span class="id-badge">#{e.id}</span></td>
                    {#each selectedType.schema.fields.slice(0, 4) as f}
                      <td class="data-cell">
                        {#if f.type === 'checkbox' || typeof e[f.name] === 'boolean'}
                          <span class="status-badge" class:active={e[f.name]}>{e[f.name] ? 'Yes' : 'No'}</span>
                        {:else}
                          {String(e[f.name] ?? '—').slice(0, 60)}
                        {/if}
                      </td>
                    {/each}
                    <td class="date-cell">{new Date(e.updatedAt).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}</td>
                    <td style="text-align: right">
                      <button class="action-btn delete" on:click={() => softDelete(e.id)} title="Delete">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
        <div class="pagination-wrap">
          <Pagination bind:currentPage {totalPages} />
        </div>
      {/if}
    {/if}
  </main>
</div>

<ConfirmModal 
  title="Delete Entry" 
  message="Delete this entry? This action cannot be undone."
  confirmText="Delete"
  bind:isOpen={deleteModalOpen}
  on:confirm={confirmSoftDelete}
  on:cancel={() => { entryToDelete = null; deleteModalOpen = false; }}
/>

<style>
  /* Base Hero */
  .hero-head {
    padding-bottom: var(--s-lg);
    margin-bottom: var(--s-lg);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 4vw, 36px);
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .hero-sub {
    font-size: 16px;
    color: var(--c-body);
    line-height: 1.5;
    margin: 0;
    max-width: 600px;
  }

  /* Layout */
  .layout-container {
    display: grid;
    grid-template-columns: 240px 1fr;
    gap: var(--s-xl);
    align-items: start;
  }
  @media (max-width: 768px) {
    .layout-container { grid-template-columns: 1fr; }
  }

  /* Sidebar */
  .sidebar {
    position: sticky;
    top: var(--s-lg);
    display: flex;
    flex-direction: column;
    gap: var(--s-md);
  }
  .sidebar-header h3 {
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--c-muted);
    margin: 0;
    padding-left: 12px;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--r-md);
    background: transparent;
    border: 1px solid transparent;
    color: var(--c-body);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
  }
  .nav-item:hover {
    background: var(--c-surface-soft);
    color: var(--c-ink);
  }
  .nav-item.active {
    background: var(--c-surface-card);
    border-color: var(--c-hairline);
    color: var(--c-primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  .nav-icon {
    display: flex;
    color: currentColor;
    opacity: 0.7;
  }
  .nav-item.active .nav-icon { opacity: 1; }
  .empty-sidebar {
    font-size: 13px;
    color: var(--c-muted);
    padding: 12px;
  }

  /* Main Content */
  .main-content {
    display: flex;
    flex-direction: column;
    gap: var(--s-md);
    min-width: 0;
  }
  
  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--s-md) var(--s-lg);
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  .content-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .content-title h2 {
    margin: 0;
    font-size: 20px;
    font-family: var(--font-display);
    color: var(--c-ink);
  }
  .badge {
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    background: var(--c-surface-soft);
    color: var(--c-muted);
  }

  /* Table */
  .table-container {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.02);
  }
  .modern-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    white-space: nowrap;
  }
  .modern-table th {
    background: var(--c-surface-soft);
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--c-hairline);
  }
  .modern-table td {
    padding: 14px 16px;
    font-size: 14px;
    color: var(--c-ink);
    border-bottom: 1px solid var(--c-hairline-soft);
    vertical-align: middle;
  }
  .modern-table tr:last-child td { border-bottom: none; }
  .modern-table tr:hover td { background: var(--c-surface-soft); }

  .id-badge {
    font-family: var(--font-mono);
    font-size: 12px;
    background: rgba(0,0,0,0.04);
    padding: 4px 6px;
    border-radius: 4px;
    color: var(--c-muted);
  }
  .data-cell { color: var(--c-body); }
  .date-cell { color: var(--c-muted); font-size: 13px; }
  
  .status-badge {
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
  .status-badge.active {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .action-btn {
    background: transparent;
    border: none;
    color: var(--c-muted);
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .action-btn:hover { background: var(--c-surface-card); color: var(--c-ink); }
  .action-btn.delete:hover { background: rgba(239,68,68,0.1); color: #ef4444; }

  /* Empty / Loading States */
  .empty-state {
    padding: 60px 20px;
    text-align: center;
    background: var(--c-canvas);
    border: 1px dashed var(--c-hairline);
    border-radius: var(--r-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .empty-icon {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--c-surface-soft);
    color: var(--c-muted);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .empty-state h3 { margin: 0; font-size: 18px; color: var(--c-ink); }
  .empty-state p { margin: 0 0 16px; color: var(--c-muted); max-width: 300px; font-size: 14px; }
  
  .loading-state {
    padding: 60px;
    text-align: center;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    color: var(--c-muted);
  }
  .spinner {
    width: 24px; height: 24px;
    border: 2px solid var(--c-hairline);
    border-top-color: var(--c-primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Modal / Slide-over */
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    justify-content: flex-end;
  }
  .modal-card.panel {
    width: 100%;
    max-width: 500px;
    height: 100vh;
    background: var(--c-canvas);
    border-left: 1px solid var(--c-hairline);
    box-shadow: -10px 0 30px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid var(--c-hairline);
    background: var(--c-canvas);
  }
  .modal-header h3 { margin: 0; font-family: var(--font-display); font-size: 20px; color: var(--c-ink); }
  .modal-close-btn {
    background: transparent; border: none; font-size: 24px; cursor: pointer; color: var(--c-muted);
  }
  .modal-close-btn:hover { color: var(--c-ink); }
  .modal-body {
    display: flex; flex-direction: column; flex: 1; overflow: hidden;
  }
  .form-scroll {
    flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;
  }
  .modal-actions {
    padding: 20px 24px;
    border-top: 1px solid var(--c-hairline);
    background: var(--c-surface-soft);
    display: flex; justify-content: flex-end; gap: 12px;
  }

  /* Forms */
  .field-wrap { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-size: 13px; font-weight: 500; color: var(--c-ink); }
  .modern-input {
    width: 100%;
    padding: 10px 12px;
    background: var(--c-surface-card);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    font-size: 14px;
    color: var(--c-ink);
    transition: border-color 0.2s;
  }
  .modern-input:focus {
    outline: none;
    border-color: var(--c-primary);
    box-shadow: 0 0 0 3px rgba(var(--c-primary-rgb), 0.1);
  }
  
  /* Toggle Switch */
  .toggle-switch {
    position: relative; display: inline-block; width: 44px; height: 24px;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--c-hairline); transition: .4s; border-radius: 24px;
  }
  .slider:before {
    position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
    background-color: white; transition: .4s; border-radius: 50%;
  }
  input:checked + .slider { background-color: var(--c-primary); }
  input:checked + .slider:before { transform: translateX(20px); }

  .error-banner {
    margin: 0 24px; padding: 12px; background: rgba(239,68,68,0.1);
    color: #ef4444; border-radius: var(--r-md); font-size: 13px;
  }
  .btn-primary {
    background: var(--c-primary); color: white; border: none; padding: 8px 16px; border-radius: var(--r-md); font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
  }
  .btn-primary:hover { filter: brightness(1.1); }

  .pagination-wrap { display: flex; justify-content: center; margin-top: 12px; }
</style>
