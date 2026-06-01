<script lang="ts">
  import { onMount } from 'svelte';
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

  async function loadTypes() {
    loading = true;
    const res = await fetch('/api/v1/content-types');
    if (res.ok) {
      const body = await res.json();
      types = body.data;
    }
    loading = false;
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
    if (!confirm(`Delete content type "${t.name}" and all its entries? This is reversible only via DB restore.`)) return;
    const res = await fetch(`/api/v1/content-types/${t.id}`, { method: 'DELETE' });
    if (res.ok) await loadTypes();
    else err = await res.text();
  }

  onMount(loadTypes);
</script>

<style>
  .link { background: transparent; border: none; color: var(--c-ink); cursor: pointer; padding: 2px 6px; font-size: 12px; text-decoration: none; }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }
</style>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">Content Types</h2>
    <button class="btn" on:click={() => (creating = !creating)}>{creating ? 'Cancel' : '+ New Type'}</button>
  </div>
  <p style="color:var(--c-muted); font-size:13.5px; margin:4px 0 16px">
    Design and manage your headless database schemas. Each Content Type defines fields (e.g. text, relations, select choices) and strict validation rules for database entries across your workspaces.
  </p>

  {#if creating}
    <form class="card stack" on:submit|preventDefault={submit}>
      <div class="h-row">
        <div style="flex:1">
          <div class="label">Slug</div>
          <input bind:value={newSlug} placeholder="personal-crm" pattern="[a-z][a-z0-9-]*" required />
        </div>
        <div style="flex:1">
          <div class="label">Name</div>
          <input bind:value={newName} placeholder="Personal CRM" required />
        </div>
      </div>

      <div>
        <div class="h-row" style="justify-content: space-between; margin-bottom: 8px">
          <span class="label">Fields</span>
          <button type="button" class="btn btn-ghost" on:click={addField}>+ Field</button>
        </div>
        <div class="stack">
          {#each newFields as f, i (i)}
            <div class="h-row">
              <input bind:value={f.name} placeholder="field name" style="flex:1" />
              <select bind:value={f.type}>
                <option value="text">text</option>
                <option value="richtext">richtext</option>
                <option value="number">number</option>
                <option value="date">date</option>
                <option value="select">select</option>
                <option value="relation">relation</option>
                <option value="file">file</option>
                <option value="checkbox">checkbox</option>
              </select>
              <label class="h-row" style="font-size:12px; color:var(--c-muted)">
                <input type="checkbox" bind:checked={f.required} /> required
              </label>
              <button type="button" class="btn btn-ghost" on:click={() => removeField(i)}>×</button>
            </div>
          {/each}
        </div>
      </div>

      {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
      <button type="submit" class="btn">Create</button>
    </form>
  {/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if types.length === 0}
    <div class="card" style="text-align:center; padding:48px 20px; color:var(--c-muted)">
      No content types yet. Click + New Type to define your first collection.
    </div>
  {:else}
    <div class="stack">
      {#each types as t (t.id)}
        <div class="card">
          <div class="h-row" style="justify-content:space-between; align-items:center">
            <a href={`/entries?type=${t.slug}`} style="text-decoration:none; color:inherit; flex:1">
              <div style="font-weight:600">{t.name}</div>
              <div style="font-size:12px; color:var(--c-muted); margin-top:4px">/{t.slug} · {t.schema.fields.length} fields</div>
            </a>
            <div class="h-row" style="gap:8px; font-size:12px">
              <a href={`/content-types/${t.id}/permissions`} class="link">Permissions</a>
              <button class="link danger" type="button" on:click={() => deleteType(t)}>Delete</button>
              <span style="color:var(--c-muted); font-size:11px; margin-left:8px">{new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>
