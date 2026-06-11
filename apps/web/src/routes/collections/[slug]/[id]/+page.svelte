<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { renderWikiLinks } from '@questpage/core';
  import type { ContentTypeField } from '@questpage/core';

  export let params: any = undefined;

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
  <a href={`/collections/${slug}`} style="color:var(--c-muted); font-size:13px; text-decoration:none">← {type.name}</a>
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
  <p style="color:var(--c-muted)">Loading…</p>
{/if}

<style>
  h1 { font-size: 28px; font-weight: 600; letter-spacing: -0.04em; margin: 8px 0 32px; color: var(--c-ink); }
  h2 { font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--c-muted); letter-spacing: 0.05em; margin: 0 0 16px; }
  .fields { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }
  .field {
    display: grid; grid-template-columns: 180px 1fr; gap: 16px;
    padding-bottom: 16px; border-bottom: 1px solid var(--c-hairline);
    align-items: baseline;
  }
  .label { font-size: 11px; text-transform: uppercase; color: var(--c-muted); font-weight: 600; letter-spacing: 0.05em; }
  .value { font-size: 14px; white-space: pre-wrap; color: var(--c-body); }
  :global(.wikilink) {
    color: var(--c-brand-accent); font-weight: 600; cursor: pointer;
    background: var(--c-surface-card); border: 1px solid var(--c-hairline);
    padding: 2px 8px; border-radius: 6px; text-decoration: none;
    transition: all 0.2s;
  }
  :global(.wikilink:hover) { background: var(--c-hairline-soft); border-color: var(--c-muted); }
  .refs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding-top: 32px; border-top: 1px solid var(--c-hairline); }
  .ref { padding: 8px 0; font-size: 13px; display: flex; align-items: center; border-bottom: 1px dashed var(--c-hairline-soft); }
  .ref:last-child { border-bottom: none; }
  .ref a { color: var(--c-brand-accent); text-decoration: none; font-weight: 600; }
  .ref a:hover { text-decoration: underline; }
  .ref .context { color: var(--c-muted-soft); margin-left: 8px; font-size: 12px; font-style: italic; }
  .unresolved { color: var(--c-muted); font-style: italic; }
  .empty { color: var(--c-muted-soft); font-size: 13px; margin: 0; }
  .empty code { background: var(--c-surface-card); border: 1px solid var(--c-hairline); padding: 2px 6px; border-radius: 4px; color: var(--c-ink); }
</style>
