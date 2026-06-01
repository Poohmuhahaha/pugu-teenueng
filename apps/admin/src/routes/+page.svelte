<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import type { ContentTypeField } from '@lifeos/core';

  export let params: any = undefined;

  interface ContentType {
    id: number;
    slug: string;
    name: string;
    schema: { fields: ContentTypeField[] };
    createdAt: string;
  }

  let types: ContentType[] = [];
  let loading = true;
  let creating = false;
  let newSlug = '';
  let newName = '';
  let newFields: ContentTypeField[] = [{ name: 'title', type: 'text', required: true }];
  let err = '';

  // Inline-confirmation state — replaces window.confirm()
  let confirmingDelete: number | null = null;

  async function loadTypes() {
    loading = true;
    err = '';
    try {
      const res = await fetch('/api/v1/content-types');
      if (res.ok) {
        const body = await res.json();
        types = body.data;
      } else {
        err = `Failed to load content types (${res.status})`;
      }
    } finally {
      loading = false;
    }
  }

  function addField() { newFields = [...newFields, { name: '', type: 'text', required: false }]; }
  function removeField(i: number) { newFields = newFields.filter((_, idx) => idx !== i); }

  async function submit() {
    err = '';
    const res = await fetch('/api/v1/content-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: newSlug.trim().toLowerCase(),
        name: newName.trim(),
        schema: { fields: newFields.filter((f) => f.name.trim()) },
      }),
    });
    if (!res.ok) { err = await res.text(); return; }
    newSlug = ''; newName = ''; newFields = [{ name: 'title', type: 'text', required: true }];
    creating = false;
    await loadTypes();
  }

  async function deleteType(t: ContentType) {
    const res = await fetch(`/api/v1/content-types/${t.id}`, { method: 'DELETE' });
    if (res.ok) {
      confirmingDelete = null;
      await loadTypes();
    } else {
      err = await res.text();
    }
  }

  // Map field types to badge colours so each card has a small chromatic anchor.
  const fieldColor: Record<string, string> = {
    text: 'badge-muted',
    richtext: 'badge-violet',
    number: 'badge-blue',
    date: 'badge-orange',
    select: 'badge-emerald',
    relation: 'badge-pink',
    file: 'badge-warning',
    checkbox: 'badge-success',
  };

  onMount(loadTypes);
</script>

<header class="hero-head">
  <span class="eyebrow">Admin · Schemas</span>
  <div class="hero-row">
    <div class="hero-text">
      <h1 class="hero-title">Content types</h1>
      <p class="hero-sub">Design the schemas your workspace stores. Each type maps to a REST collection, a typed entry table, and a row of permissions you control.</p>
    </div>
    <button class="btn btn-lg" on:click={() => (creating = !creating)}>
      {creating ? 'Cancel' : '+ New type'}
    </button>
  </div>
</header>

{#if creating}
  <form class="card create-form" on:submit|preventDefault={submit} in:fly={{ y: -8, duration: 200, easing: quintOut }} out:fade={{ duration: 150 }}>
    <div class="form-grid">
      <div class="field">
        <label class="field-label" for="ct-slug">Slug</label>
        <input id="ct-slug" bind:value={newSlug} placeholder="personal-crm" pattern="[a-z][a-z0-9-]*" required />
        <span class="field-hint">lowercase, hyphen-separated. Becomes the URL: <code>/api/v1/&lt;slug&gt;</code></span>
      </div>
      <div class="field">
        <label class="field-label" for="ct-name">Display name</label>
        <input id="ct-name" bind:value={newName} placeholder="Personal CRM" required />
      </div>
    </div>

    <div class="fields-section">
      <div class="fields-header">
        <span class="label">Schema fields</span>
        <button type="button" class="btn btn-ghost btn-sm" on:click={addField}>+ Add field</button>
      </div>
      <div class="field-rows">
        {#each newFields as f, i (i)}
          <div class="field-row" in:fly={{ y: -4, duration: 160 }}>
            <input bind:value={f.name} placeholder="field name" class="field-name" />
            <select bind:value={f.type} class="field-type">
              <option value="text">text</option>
              <option value="richtext">richtext</option>
              <option value="number">number</option>
              <option value="date">date</option>
              <option value="select">select</option>
              <option value="relation">relation</option>
              <option value="file">file</option>
              <option value="checkbox">checkbox</option>
            </select>
            <label class="required-toggle">
              <input type="checkbox" bind:checked={f.required} />
              <span>required</span>
            </label>
            {#if newFields.length > 1}
              <button type="button" class="btn btn-ghost btn-sm icon-btn" on:click={() => removeField(i)} aria-label="Remove field">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            {/if}
          </div>
        {/each}
      </div>
    </div>

    {#if err}<div class="form-error">{err}</div>{/if}
    <div class="form-actions">
      <button type="button" class="btn btn-secondary" on:click={() => (creating = false)}>Cancel</button>
      <button type="submit" class="btn">Create content type</button>
    </div>
  </form>
{/if}

{#if loading}
  <div class="loading-grid">
    {#each Array(3) as _, i}
      <div class="card skeleton" style="--delay: {i * 0.1}s"></div>
    {/each}
  </div>
{:else if err && types.length === 0}
  <div class="card error-state">
    <strong>Something went wrong.</strong>
    <p>{err}</p>
    <button class="btn btn-secondary btn-sm" on:click={loadTypes}>Retry</button>
  </div>
{:else if types.length === 0}
  <div class="empty-state">
    <div class="empty-icon" aria-hidden="true">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>
      </svg>
    </div>
    <h3>No content types yet</h3>
    <p>Start by defining a schema — a collection of typed fields. You'll create entries against it from anywhere LifeOS reaches.</p>
    <button class="btn" on:click={() => (creating = true)}>+ Create your first type</button>
  </div>
{:else}
  <div class="type-grid">
    {#each types as t, i (t.id)}
      <article class="type-card" use:reveal={{ delay: i * 0.04, y: 12 }}>
        <a class="type-card-main" href={`/entries?type=${t.slug}`}>
          <div class="type-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          </div>
          <div class="type-meta">
            <div class="type-name">{t.name}</div>
            <div class="type-slug"><code>/{t.slug}</code></div>
          </div>
        </a>

        <div class="type-fields">
          {#each t.schema.fields.slice(0, 4) as f}
            <span class="badge {fieldColor[f.type] ?? 'badge-muted'}">{f.name}<span class="field-type-hint">·{f.type}</span></span>
          {/each}
          {#if t.schema.fields.length > 4}
            <span class="badge badge-muted">+{t.schema.fields.length - 4}</span>
          {/if}
        </div>

        <footer class="type-foot">
          <span class="type-date">Created {new Date(t.createdAt).toLocaleDateString()}</span>
          <div class="type-actions">
            <a class="link-action" href={`/content-types/${t.id}/permissions`}>Permissions</a>
            {#if confirmingDelete === t.id}
              <span class="confirm-inline" in:fly={{ x: 4, duration: 140 }}>
                Delete <strong>{t.name}</strong>?
                <button class="link-action danger" on:click={() => deleteType(t)}>Yes, delete</button>
                <button class="link-action" on:click={() => (confirmingDelete = null)}>Cancel</button>
              </span>
            {:else}
              <button class="link-action danger" on:click={() => (confirmingDelete = t.id)}>Delete</button>
            {/if}
          </div>
        </footer>
      </article>
    {/each}
  </div>
{/if}

<style>
  /* === Hero head — matches the landing page's display-title rhythm ===
     Bigger headline, eyebrow chip, generous spacing. */
  .hero-head {
    padding-bottom: var(--s-xl);
    margin-bottom: var(--s-xl);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .eyebrow {
    display: inline-block;
    font: 500 12px/1 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-muted);
    padding: 5px 12px;
    background: var(--c-surface-card);
    border-radius: var(--r-pill);
    margin-bottom: var(--s-md);
  }
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

  /* === Create form === */
  .create-form {
    margin-bottom: var(--s-lg);
    display: flex;
    flex-direction: column;
    gap: var(--s-md);
  }
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--s-md);
  }
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field-hint { font-size: 12px; color: var(--c-muted-soft); }
  .field-hint code {
    font-family: var(--font-mono); font-size: 11px;
    background: var(--c-surface-card); padding: 1px 4px; border-radius: 3px;
  }

  .fields-section { display: flex; flex-direction: column; gap: var(--s-xs); }
  .fields-header {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 4px;
  }
  .field-rows { display: flex; flex-direction: column; gap: 6px; }
  .field-row {
    display: grid;
    grid-template-columns: 1fr 130px auto auto;
    gap: 8px;
    align-items: center;
  }
  .field-name, .field-type { height: 36px; font-size: 13px; }
  .required-toggle {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px; color: var(--c-muted);
    padding: 0 8px;
    white-space: nowrap;
  }
  .required-toggle input { width: auto; height: auto; }
  .icon-btn { padding: 0; width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; }

  .form-error {
    background: rgba(239, 68, 68, 0.08);
    color: var(--c-error);
    border-radius: var(--r-md);
    padding: 8px 12px;
    font-size: 13px;
  }
  .form-actions { display: flex; justify-content: flex-end; gap: 8px; }

  /* === Type grid === */
  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--s-md);
  }
  .type-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .type-card:hover {
    border-color: var(--c-ink);
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .type-card-main {
    display: flex; align-items: center; gap: var(--s-sm);
    padding: var(--s-md) var(--s-lg);
    text-decoration: none;
    color: var(--c-ink);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .type-icon {
    width: 36px; height: 36px;
    flex: none;
    border-radius: var(--r-md);
    background: var(--c-surface-card);
    color: var(--c-ink);
    display: flex; align-items: center; justify-content: center;
  }
  .type-name {
    font: 600 16px/1.3 var(--font-body);
    color: var(--c-ink);
  }
  .type-slug {
    font-size: 12px; color: var(--c-muted);
    margin-top: 2px;
  }
  .type-slug code {
    font-family: var(--font-mono);
    background: transparent; padding: 0;
  }

  .type-fields {
    padding: var(--s-sm) var(--s-lg);
    display: flex; flex-wrap: wrap; gap: 6px;
    min-height: 44px;
    align-items: center;
  }
  .type-fields .badge {
    padding: 3px 10px;
    font-size: 12px;
  }
  .field-type-hint {
    margin-left: 4px;
    opacity: 0.6;
    font-size: 11px;
    font-family: var(--font-mono);
  }

  .type-foot {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px var(--s-lg);
    background: var(--c-surface-soft);
    border-top: 1px solid var(--c-hairline-soft);
  }
  .type-date { font-size: 12px; color: var(--c-muted-soft); }
  .type-actions { display: flex; align-items: center; gap: var(--s-sm); }

  .link-action {
    background: transparent;
    border: none;
    color: var(--c-muted);
    font: 500 12px/1.4 var(--font-body);
    padding: 4px 8px;
    border-radius: var(--r-md);
    cursor: pointer;
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
  }
  .link-action:hover { color: var(--c-ink); background: var(--c-hairline-soft); }
  .link-action.danger { color: var(--c-error); }
  .link-action.danger:hover { background: rgba(239, 68, 68, 0.1); color: var(--c-error); }

  .confirm-inline {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 12px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    padding: 4px 8px;
    color: var(--c-body);
  }
  .confirm-inline strong { color: var(--c-ink); }

  /* === Empty / error / loading states === */
  .empty-state {
    background: var(--c-surface-soft);
    border: 1px dashed var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xxl) var(--s-xl);
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--s-sm);
  }
  .empty-icon {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--c-muted);
    margin-bottom: var(--s-xs);
  }
  .empty-state h3 {
    font: 600 18px/1.3 var(--font-display);
    letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0;
  }
  .empty-state p {
    color: var(--c-body);
    font-size: 14px;
    max-width: 380px;
    margin: 0 0 var(--s-sm);
  }

  .error-state {
    border-color: var(--c-error);
    background: rgba(239, 68, 68, 0.04);
    text-align: center;
  }
  .error-state strong { color: var(--c-error); display: block; }

  .loading-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: var(--s-md);
  }
  .skeleton {
    height: 168px;
    background: linear-gradient(90deg, var(--c-surface-soft) 0%, var(--c-surface-card) 50%, var(--c-surface-soft) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    animation-delay: var(--delay);
    border: 1px solid var(--c-hairline-soft);
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 640px) {
    .form-grid { grid-template-columns: 1fr; }
    .field-row { grid-template-columns: 1fr; }
    .type-grid, .loading-grid { grid-template-columns: 1fr; }
    .type-foot { flex-direction: column; align-items: flex-start; gap: 8px; }
  }
</style>
