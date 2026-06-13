<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { page } from '$app/stores';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ContentTypeField } from '@questpage/core';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';


  interface ContentType { id: number; slug: string; name: string; schema: { fields: ContentTypeField[] }; }
  interface Entry { id: number; createdAt: string; updatedAt: string; [k: string]: unknown; }

  let types: ContentType[] = [];
  let selectedSlug = '';
  let selectedType: ContentType | null = null;
  let entries: Entry[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  let totalEntries = 0;
  $: totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;

  let loading = false;
  let creating = false;
  let editingEntryId: number | null = null;
  let newData: Record<string, unknown> = {};
  let err = '';

  let creatingSchema = false;
  let newSlug = '';
  let newName = '';
  let newFields = [{ name: 'title', type: 'text', required: true }];
  let schemaErr = '';
  let confirmingSchemaDelete = null;

  function addField() { newFields = [...newFields, { name: '', type: 'text', required: false }]; }
  function removeField(i) { newFields = newFields.filter((_, idx) => idx !== i); }

  async function submitSchema() {
    schemaErr = '';
    const res = await fetch('/api/v1/content-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: newSlug.trim().toLowerCase(),
        name: newName.trim(),
        schema: { fields: newFields.filter((f) => f.name.trim()) },
      }),
    });
    if (!res.ok) { schemaErr = await res.text(); return; }
    newSlug = ''; newName = ''; newFields = [{ name: 'title', type: 'text', required: true }];
    creatingSchema = false;
    await loadTypes();
  }

  async function deleteSchema(t) {
    const res = await fetch(`/api/v1/content-types/${t.id}`, { method: 'DELETE' });
    if(res.ok) {
      await loadTypes();
      confirmingSchemaDelete = null;
    }
  }

  const fieldColor = {
    text: 'badge-muted', richtext: 'badge-violet', number: 'badge-blue',
    date: 'badge-orange', select: 'badge-emerald', relation: 'badge-pink',
    file: 'badge-warning', checkbox: 'badge-success',
  };


  let deleteModalOpen = false;
  let entryToDelete: number | null = null;

  $: selectedSlug = $page.url.searchParams.get('type') ?? '';
  $: selectedType = types.find((t) => t.slug === selectedSlug) ?? null;

  async function loadTypes() {
    const res = await fetch('/api/v1/content-types');
    if (res.ok) types = (await res.json()).data;
  }

  async function loadEntries(slug: string, pageNum: number = 1) {
    if (!slug) return;
    loading = true;
    const res = await fetch(`/api/v1/${slug}?pagination[page]=${pageNum}&pagination[pageSize]=${itemsPerPage}&sort=updatedAt:desc`);
    if (res.ok) {
      const body = await res.json();
      entries = body.data;
      totalEntries = body.meta.total;
    }
    loading = false;
  }

  $: if (browser && selectedSlug) {
    loadEntries(selectedSlug, currentPage);
  }

  function pickSlug(slug: string) {
    const url = new URL(window.location.href);
    url.searchParams.set('type', slug);
    history.pushState({}, '', url);
    selectedSlug = slug;
    currentPage = 1;
    creating = false;
    editingEntryId = null;
    newData = {};
  }

  function openCreate() {
    editingEntryId = null;
    newData = {};
    creating = true;
  }

  function openEdit(entry: Entry) {
    editingEntryId = entry.id;
    newData = { ...entry };
    creating = true;
  }

  async function submitNew() {
    err = '';
    if (!selectedType) return;
    
    const url = editingEntryId 
      ? `/api/v1/${selectedType.slug}/${editingEntryId}` 
      : `/api/v1/${selectedType.slug}`;
    const method = editingEntryId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newData),
    });
    if (!res.ok) { err = await res.text(); return; }
    creating = false;
    editingEntryId = null;
    newData = {};
    await loadEntries(selectedType.slug, currentPage);
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
    <div class="sidebar-nav">
      <button class="nav-item overview-nav" class:active={selectedSlug === ''} on:click={() => pickSlug('')}>
        <span class="nav-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
        </span>
        <span class="nav-label" style="font-weight: 600;">Overview</span>
      </button>
    </div>

    <div class="sidebar-section">
      <div class="sidebar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-left: 4px;">
        <h3>Databases</h3>
        <button class="icon-action-btn" on:click={() => { pickSlug(''); creatingSchema = true; }} title="New Database">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>
      
      <div class="sidebar-nav">
        {#each types as t (t.id)}
          <button class="nav-item" class:active={t.slug === selectedSlug} on:click={() => pickSlug(t.slug)}>
            <span class="nav-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
            </span>
            <span class="nav-label">{t.name}</span>
          </button>
        {/each}
        {#if types.length === 0}
          <div class="empty-sidebar">
            <p>No databases found.</p>
            <button class="btn btn-secondary btn-sm" style="width: 100%; margin-top: 8px; justify-content: center;" on:click={() => { pickSlug(''); creatingSchema = true; }}>Create First DB</button>
          </div>
        {/if}
      </div>
    </div>
  </aside>

  <main class="main-content">
    {#if !selectedType}

  <div class="content-header" in:fade={{duration: 200}}>
    <div class="content-title">
      <h2>Database Schemas</h2>
      <span class="badge badge-muted">{types.length} Collections</span>
    </div>
    <button class="btn btn-primary" on:click={() => (creatingSchema = true)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      New Schema
    </button>
  </div>

  <div class="table-container">
    <table class="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Slug</th>
          <th>Fields</th>
          <th>Created</th>
          <th style="text-align: right;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each types as t, i (t.id)}
          <tr in:fly={{ delay: i * 20, y: 8, duration: 300, easing: quintOut }}>
            <td>
              <button class="type-name-link" style="background:none; border:none; padding:0; font:inherit; cursor:pointer;" on:click={() => pickSlug(t.slug)}>
                <div class="type-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
                </div>
                {t.name}
              </button>
            </td>
            <td><code>/{t.slug}</code></td>
            <td>
              <div class="type-fields-inline">
                {#each t.schema.fields.slice(0, 3) as f}
                  <span class="badge {fieldColor[f.type] ?? 'badge-muted'}">{f.name}</span>
                {/each}
                {#if t.schema.fields.length > 3}
                  <span class="badge badge-muted">+{t.schema.fields.length - 3}</span>
                {/if}
              </div>
            </td>
            <td class="type-date">{new Date(t.createdAt).toLocaleDateString()}</td>
            <td style="text-align: right;">
              <div class="type-actions">
                <a class="link-action" href={`/content-types/${t.id}/permissions`}>Permissions</a>
                {#if confirmingSchemaDelete === t.id}
                  <span class="confirm-inline" in:fly={{ x: 4, duration: 140 }}>
                    Delete?
                    <button class="link-action danger" on:click={() => deleteSchema(t)}>Yes</button>
                    <button class="link-action" on:click={() => (confirmingSchemaDelete = null)}>Cancel</button>
                  </span>
                {:else}
                  <button class="link-action danger" on:click={() => (confirmingSchemaDelete = t.id)}>Delete</button>
                {/if}
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  {#if creatingSchema}
    <div class="modal-overlay" on:click={() => (creatingSchema = false)}>
      <div class="modal-card panel" on:click|stopPropagation>
        <div class="modal-header">
          <h3>Create Content Type</h3>
          <button class="modal-close-btn" on:click={() => (creatingSchema = false)}>×</button>
        </div>
        <form class="modal-body stack" on:submit|preventDefault={submitSchema}>
          <div class="form-scroll">
            <div class="field-wrap">
              <label class="field-label" for="ct-slug">Database Slug</label>
              <input id="ct-slug" bind:value={newSlug} placeholder="e.g. personal-crm" pattern="[a-z][a-z0-9-]*" required class="modern-input" />
              <span class="field-hint">Used in API: <code>/api/v1/&lt;slug&gt;</code> (lowercase, hyphens only)</span>
            </div>
            <div class="field-wrap">
              <label class="field-label" for="ct-name">Display Name</label>
              <input id="ct-name" bind:value={newName} placeholder="e.g. Personal CRM" required class="modern-input" />
            </div>

            <div class="fields-section brutal-block">
              <div class="fields-header">
                <span class="fields-title">Schema Fields</span>
                <button type="button" class="btn btn-secondary btn-sm" on:click={addField}>+ Add Field</button>
              </div>
              <div class="field-rows">
                {#each newFields as f, i (i)}
                  <div class="field-row brutal-row">
                    <input bind:value={f.name} placeholder="Field Name" class="modern-input" style="flex:1;" />
                    <select bind:value={f.type} class="modern-input" style="width:130px;">
                      <option value="text">text</option>
                      <option value="richtext">richtext</option>
                      <option value="number">number</option>
                      <option value="date">date</option>
                      <option value="select">select</option>
                      <option value="relation">relation</option>
                      <option value="file">file</option>
                      <option value="checkbox">checkbox</option>
                    </select>
                    <label class="required-toggle brutal-toggle">
                      <input type="checkbox" bind:checked={f.required} />
                      <span class="checkmark"></span>
                      <span class="toggle-label">Required</span>
                    </label>
                    {#if newFields.length > 1}
                      <button type="button" class="action-btn delete" style="padding: 6px; border: 2px solid var(--c-ink); background: var(--c-canvas);" on:click={() => removeField(i)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </button>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
            {#if schemaErr}<div class="error-banner">{schemaErr}</div>{/if}
          </div>
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" on:click={() => (creatingSchema = false)}>Cancel</button>
            <button type="submit" class="btn btn-primary">Create Database</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {:else}
      <div class="content-header" in:fade={{duration: 200}}>
        <div class="content-title">
          <h2>{selectedType.name}</h2>
          <span class="badge badge-muted">{entries.length} Total</span>
        </div>
        <button class="btn btn-primary" on:click={openCreate}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New Entry
        </button>
      </div>

      <!-- Creation Slide-over / Modal -->
      {#if creating}
        <div class="modal-overlay" on:click={() => (creating = false)}>
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="modal-card panel" on:click|stopPropagation>
            <div class="modal-header">
              <h3>{editingEntryId ? 'Edit' : 'Create new'} {selectedType.name}</h3>
              <button class="modal-close-btn" on:click={() => (creating = false)}>×</button>
            </div>
            <form class="modal-body stack" on:submit|preventDefault={submitNew}>
              <div class="form-scroll">
                {#each selectedType.schema.fields as f (f.name)}
                  <div class="field-wrap">
                    <div class="field-label">{f.name}{f.required ? ' *' : ''}</div>
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
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading entries...</p>
        </div>
      {:else if entries.length === 0}
        <div class="empty-state" in:fade>
          <div class="empty-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <h3>No entries found</h3>
          <p>This collection is empty. Start by creating the first entry.</p>
          <button class="btn btn-primary" on:click={openCreate}>Create Entry</button>
        </div>
      {:else}
        <div class="table-container" in:fade>
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
                {#each entries as e, i (e.id)}
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
                      <button class="action-btn" on:click={() => openEdit(e)} title="Edit">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
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
    padding-bottom: var(--s-xl);
    margin-bottom: var(--s-xl);
    border-bottom: 1px solid var(--c-hairline-soft);
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
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 6px 6px 0 var(--c-primary);
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
    background: var(--c-surface-soft);
    border: 3px dashed var(--c-primary);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .empty-icon {
    width: 56px; height: 56px;
    border-radius: 0;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
    color: var(--c-ink);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .empty-state h3 { margin: 0; font-size: 18px; color: var(--c-ink); }
  .empty-state p { margin: 0 0 16px; color: var(--c-muted); max-width: 300px; font-size: 14px; }
  
  .loading-state {
    padding: 60px;
    text-align: center;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--c-primary);
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
    background: rgba(58, 38, 22, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }
  .modal-card.panel {
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    box-shadow: 6px 6px 0 var(--c-primary);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 3px solid var(--c-primary);
    background: var(--c-surface-soft);
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
    border: 2px solid var(--c-hairline);
    border-radius: 4px;
    font-size: 14px;
    color: var(--c-ink);
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .modern-input:focus {
    outline: none;
    border-color: var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
  }
  
  /* Toggle Switch */
  .toggle-switch {
    position: relative; display: inline-block; width: 44px; height: 24px;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--c-hairline); transition: .2s; border-radius: 0;
    border: 2px solid var(--c-ink);
  }
  .slider:before {
    position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
    background-color: white; transition: .2s; border-radius: 0;
    border: 1px solid var(--c-ink);
  }
  input:checked + .slider { background-color: var(--c-primary); }
  input:checked + .slider:before { transform: translateX(20px); }

  .error-banner {
    margin: 0 24px; padding: 12px; background: rgba(239,68,68,0.1);
    color: #ef4444; border-radius: 4px; font-size: 13px; border: 2px solid #ef4444;
  }
  
  .btn-primary {
    background: var(--c-primary); color: white; border: 2px solid var(--c-primary); padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
    box-shadow: 4px 4px 0 var(--c-primary); transition: transform 0.1s, box-shadow 0.1s;
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--c-primary); }
  .btn-primary:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--c-primary); }
  
  .btn-secondary {
    background: var(--c-surface-card); color: var(--c-ink); border: 2px solid var(--c-ink); padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
    box-shadow: 4px 4px 0 var(--c-ink); transition: transform 0.1s, box-shadow 0.1s;
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
    background: var(--c-surface-soft);
    border: 3px dashed var(--c-primary);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .empty-icon {
    width: 56px; height: 56px;
    border-radius: 0;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
    color: var(--c-ink);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 8px;
  }
  .empty-state h3 { margin: 0; font-size: 18px; color: var(--c-ink); }
  .empty-state p { margin: 0 0 16px; color: var(--c-muted); max-width: 300px; font-size: 14px; }
  
  .loading-state {
    padding: 60px;
    text-align: center;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--c-primary);
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
    background: rgba(58, 38, 22, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 10vh;
  }
  .modal-card.panel {
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    background: var(--c-canvas);
    border: 4px solid var(--c-ink);
    border-radius: 0;
    box-shadow: 10px 10px 0 var(--c-primary);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 4px solid var(--c-ink);
    background: var(--c-primary);
  }
  .modal-header h3 { margin: 0; font-family: var(--font-display); font-size: 20px; color: var(--c-canvas); text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; }
  .modal-close-btn {
    background: transparent; border: none; font-size: 28px; font-weight: bold; cursor: pointer; color: var(--c-canvas); opacity: 0.8; transition: all 0.15s;
  }
  .modal-close-btn:hover { color: #fff; opacity: 1; transform: scale(1.1) rotate(90deg); }
  .modal-body {
    display: flex; flex-direction: column; flex: 1; overflow: hidden;
  }
  .form-scroll {
    flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 20px;
  }
  .modal-actions {
    padding: 20px 24px;
    border-top: 4px solid var(--c-ink);
    background: var(--c-surface-soft);
    display: flex; justify-content: flex-end; gap: 12px;
  }

  /* Forms */
  .field-wrap { display: flex; flex-direction: column; gap: 8px; }
  .field-label { font-size: 14px; font-weight: 700; color: var(--c-ink); text-transform: uppercase; letter-spacing: 0.05em; }
  .modern-input {
    width: 100%;
    padding: 10px 12px;
    background: var(--c-canvas);
    border: 3px solid var(--c-ink);
    border-radius: 0;
    font-size: 15px;
    font-weight: 500;
    color: var(--c-ink);
    box-shadow: 4px 4px 0 rgba(0,0,0,0.1);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .modern-input:focus {
    outline: none;
    border-color: var(--c-primary);
    box-shadow: 6px 6px 0 var(--c-primary);
    transform: translate(-2px, -2px);
  }
  /* Brutalist Schema Builder */
  .brutal-block {
    margin-top: 16px;
    border: 3px solid var(--c-ink);
    background: var(--c-surface-soft);
    padding: 16px;
    box-shadow: 4px 4px 0 var(--c-ink);
  }
  .fields-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
  }
  .fields-title {
    font-weight: 800; font-size: 16px; text-transform: uppercase; color: var(--c-ink); letter-spacing: 0.05em;
  }
  .field-rows {
    display: flex; flex-direction: column; gap: 12px;
  }
  .brutal-row {
    display: flex; gap: 8px; align-items: center;
    background: var(--c-canvas); padding: 8px; border: 3px solid var(--c-ink);
  }
  .brutal-toggle {
    display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; text-transform: uppercase; cursor: pointer; user-select: none;
  }
  .brutal-toggle input { display: none; }
  .brutal-toggle .checkmark {
    width: 20px; height: 20px; border: 2px solid var(--c-ink); background: var(--c-canvas); display: inline-block; position: relative;
  }
  .brutal-toggle input:checked + .checkmark { background: var(--c-primary); }
  .brutal-toggle input:checked + .checkmark::after {
    content: ''; position: absolute; left: 5px; top: 1px; width: 6px; height: 10px; border: solid #fff; border-width: 0 3px 3px 0; transform: rotate(45deg);
  }

  /* Toggle Switch */
  .toggle-switch {
    position: relative; display: inline-block; width: 44px; height: 24px;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--c-hairline); transition: .2s; border-radius: 0;
    border: 2px solid var(--c-ink);
  }
  .slider:before {
    position: absolute; content: ""; height: 16px; width: 16px; left: 2px; bottom: 2px;
    background-color: white; transition: .2s; border-radius: 0;
    border: 1px solid var(--c-ink);
  }
  input:checked + .slider { background-color: var(--c-primary); }
  input:checked + .slider:before { transform: translateX(20px); }

  .error-banner {
    margin: 0 24px; padding: 12px; background: rgba(239,68,68,0.1);
    color: #ef4444; border-radius: 4px; font-size: 13px; border: 2px solid #ef4444;
  }
  
  .btn-primary {
    background: var(--c-primary); color: white; border: 2px solid var(--c-primary); padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
    box-shadow: 4px 4px 0 var(--c-primary); transition: transform 0.1s, box-shadow 0.1s;
  }
  .btn-primary:hover { filter: brightness(1.1); transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--c-primary); }
  .btn-primary:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--c-primary); }
  
  .btn-secondary {
    background: var(--c-surface-card); color: var(--c-ink); border: 2px solid var(--c-ink); padding: 8px 16px; border-radius: 4px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center;
    box-shadow: 4px 4px 0 var(--c-ink); transition: transform 0.1s, box-shadow 0.1s;
  }
  .btn-secondary:hover { background: var(--c-surface-soft); transform: translate(-2px, -2px); box-shadow: 6px 6px 0 var(--c-ink); }
  .btn-secondary:active { transform: translate(2px, 2px); box-shadow: 2px 2px 0 var(--c-ink); }

  .pagination-wrap { display: flex; justify-content: center; margin-top: 12px; }

  .hero-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: var(--s-lg);
  }
  .hero-text { min-width: 0; flex: 1; }
  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 4.5vw, 44px);
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.08;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .hero-sub {
    font-size: 17px;
    color: var(--c-body);
    line-height: 1.55;
    margin: 0;
    max-width: 620px;
  }
  @media (max-width: 768px) {
    .hero-row { flex-direction: column; align-items: stretch; }
    .hero-title { font-size: 30px; letter-spacing: -0.7px; }
    .hero-sub { font-size: 15px; }
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
    gap: var(--s-xl);
  }
  .sidebar-section {
    display: flex;
    flex-direction: column;
  }
  .sidebar-header h3 {
    font-size: 12px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--c-muted);
    margin: 0;
  }
  .sidebar-nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
    overflow-y: auto;
    max-height: calc(100vh - 150px);
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    border-radius: var(--r-md);
    background: transparent;
    border: 2px solid transparent;
    color: var(--c-body);
    font-size: 14px;
    font-weight: 500;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nav-item:hover {
    background: var(--c-surface-soft);
    color: var(--c-ink);
  }
  .nav-item.active {
    background: var(--c-canvas);
    border-color: var(--c-ink);
    color: var(--c-ink);
    font-weight: 600;
    box-shadow: 3px 3px 0 var(--c-ink);
    transform: translate(-1px, -1px);
  }
  .overview-nav {
    background: var(--c-surface-soft);
    border: 2px solid transparent;
  }
  .overview-nav.active {
    background: var(--c-primary);
    color: var(--c-canvas);
    border-color: var(--c-ink);
    box-shadow: 4px 4px 0 var(--c-ink);
  }
  .overview-nav.active .nav-icon {
    color: var(--c-canvas);
  }
  .nav-icon {
    display: flex;
    color: var(--c-muted);
    transition: color 0.2s;
  }
  .nav-item.active .nav-icon { color: var(--c-ink); }
  .nav-item:hover .nav-icon { color: var(--c-ink); }

  .empty-sidebar {
    padding: 16px;
    background: var(--c-surface-soft);
    border-radius: 8px;
    border: 2px dashed var(--c-hairline);
    text-align: center;
  }
  .empty-sidebar p {
    font-size: 13px;
    color: var(--c-muted);
    margin: 0;
  }
  .icon-action-btn {
    background: transparent;
    border: 2px solid transparent;
    color: var(--c-muted);
    padding: 4px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .icon-action-btn:hover {
    background: var(--c-ink);
    color: var(--c-canvas);
    border-color: var(--c-ink);
    box-shadow: 2px 2px 0 rgba(0,0,0,0.2);
    transform: translate(-1px, -1px);
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
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--c-primary);
  }

  .table-container {
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    box-shadow: 6px 6px 0 var(--c-primary);
    overflow-x: auto;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    text-align: left;
  }
  .data-table th {
    background: var(--c-surface-soft);
    padding: 12px 16px;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--c-primary);
    border-bottom: 3px solid var(--c-primary);
  }
  .data-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--c-hairline-soft);
    vertical-align: middle;
  }
  .data-table tr:hover td {
    background: var(--c-surface-soft);
  }
  .data-table tr:last-child td {
    border-bottom: none;
  }
  .type-name-link {
    display: inline-flex; align-items: center; gap: 8px;
    font-weight: 700;
    color: var(--c-ink);
    text-decoration: none;
  }
  .type-name-link:hover { text-decoration: underline; }
  .type-icon {
    width: 28px; height: 28px;
    background: var(--c-canvas);
    border: 2px solid var(--c-primary);
    border-radius: 4px;
    display: flex; align-items: center; justify-content: center;
    color: var(--c-primary);
  }
  .data-table code {
    font-family: var(--font-mono);
    font-size: 12px;
    background: transparent;
    color: var(--c-muted);
  }
  .type-fields-inline { display: flex; gap: 6px; flex-wrap: wrap; }
  .type-fields-inline .badge {
    padding: 2px 8px; font-size: 11px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.1);
  }
  .type-date { font-size: 13px; color: var(--c-muted); }
  .type-actions { display: inline-flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .confirm-inline {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    padding: 4px 8px;
    color: var(--c-body);
  }
  .link-action {
    background: transparent; border: none; color: var(--c-muted);
    font: 500 12px/1.4 var(--font-body); padding: 4px 8px; border-radius: var(--r-md);
    cursor: pointer; text-decoration: none; transition: color 0.15s, background 0.15s;
  }
  .link-action:hover { color: var(--c-ink); background: var(--c-hairline-soft); }
  .link-action.danger { color: var(--c-error); }
  .link-action.danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--c-error); }

  /* FIX SIDEBAR LAG/LACKLESS */
  .sidebar-nav {
    overflow-y: auto;
    max-height: calc(100vh - 150px);
  }

</style>
