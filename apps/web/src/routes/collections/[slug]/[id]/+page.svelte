<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { renderWikiLinks } from '@lifeos/core';
  import type { ContentTypeField } from '@lifeos/core';

  interface Entry { id: number; createdAt: string; updatedAt: string; [k: string]: unknown; }
  interface ContentType { schema: { fields: ContentTypeField[] }; name: string; slug: string; }
  interface BackrefRow { id: number; fromEntryId: number; toEntryId: number | null; targetName: string | null; context: string | null; }

  let entry: Entry | null = null;
  let type: ContentType | null = null;
  let incoming: BackrefRow[] = [];
  let outgoing: BackrefRow[] = [];

  $: slug = $page.params.slug;
  $: id = parseInt($page.params.id);

  async function load() {
    const [eRes, typesRes, inRes, outRes] = await Promise.all([
      fetch(`/api/v1/${slug}/${id}`).then((r) => r.json()),
      fetch('/api/v1/content-types').then((r) => r.json()),
      fetch(`/api/v1/backrefs?to=${id}`).then((r) => r.json()),
      fetch(`/api/v1/backrefs?from=${id}`).then((r) => r.json()),
    ]);
    entry = eRes;
    type = (typesRes.data as ContentType[]).find((t) => t.slug === slug) ?? null;
    incoming = inRes.data;
    outgoing = outRes.data;
  }

  $: if (slug && id) load();

  function renderField(value: unknown): string {
    if (typeof value !== 'string') return String(value ?? '');
    return renderWikiLinks(value, (target, alias) => `<a class="wikilink" data-target="${escape(target)}">${alias ?? target}</a>`);
  }

  function escape(s: string): string {
    return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  }
</script>

{#if entry && type}
  <a href={`/collections/${slug}`} style="color:var(--muted); font-size:13px; text-decoration:none">← {type.name}</a>
  <h1>{String(entry.title ?? entry.name ?? `Entry #${entry.id}`)}</h1>

  <div class="fields">
    {#each type.schema.fields as f (f.name)}
      {#if entry[f.name] !== undefined && entry[f.name] !== ''}
        <div class="field">
          <div class="label">{f.name}</div>
          <div class="value">{@html renderField(entry[f.name])}</div>
        </div>
      {/if}
    {/each}
  </div>

  <div class="refs-grid">
    <div>
      <h2>Linked from {incoming.length}</h2>
      {#each incoming as r (r.id)}
        <div class="ref">
          <a href={`/collections/${slug}/${r.fromEntryId}`}>#{r.fromEntryId}</a>
          {#if r.context}<span class="context">…{r.context}…</span>{/if}
        </div>
      {/each}
      {#if incoming.length === 0}<p class="empty">No incoming links yet.</p>{/if}
    </div>
    <div>
      <h2>Links out {outgoing.length}</h2>
      {#each outgoing as r (r.id)}
        <div class="ref">
          {#if r.toEntryId}
            <a href={`/collections/${slug}/${r.toEntryId}`}>→ #{r.toEntryId}</a>
          {:else}
            <span class="unresolved">→ [[{r.targetName}]]</span>
          {/if}
          {#if r.context}<span class="context">…{r.context}…</span>{/if}
        </div>
      {/each}
      {#if outgoing.length === 0}<p class="empty">Add <code>[[Page Title]]</code> to any text field to create a link.</p>{/if}
    </div>
  </div>
{:else}
  <p style="color:var(--muted)">Loading…</p>
{/if}

<style>
  h1 { font-size: 28px; letter-spacing: -0.02em; margin: 8px 0 24px; }
  h2 { font-size: 14px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; margin: 0 0 12px; }
  .fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 32px; }
  .field { display: grid; grid-template-columns: 160px 1fr; gap: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border); }
  .label { font-size: 11px; text-transform: uppercase; color: var(--muted); font-weight: 700; }
  .value { font-size: 14px; white-space: pre-wrap; }
  :global(.wikilink) { color: var(--accent); font-weight: 600; cursor: pointer; background: rgba(124,58,237,0.08); padding: 1px 5px; border-radius: 4px; text-decoration: none; }
  .refs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding-top: 24px; border-top: 1px solid var(--border); }
  .ref { padding: 6px 0; font-size: 13px; }
  .ref a { color: var(--accent); text-decoration: none; }
  .ref .context { color: var(--muted); margin-left: 8px; font-size: 12px; }
  .unresolved { color: var(--muted); }
  .empty { color: var(--muted); font-size: 13px; }
  .empty code { background: rgba(124,58,237,0.08); padding: 1px 6px; border-radius: 4px; }
</style>
