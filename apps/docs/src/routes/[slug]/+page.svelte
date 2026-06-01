<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import type { PageData } from './$types';

  export let data: PageData;

  $: page = data.page;
  $: html = data.html;
  $: toc = data.toc;
  $: prev = data.prev;
  $: next = data.next;
  $: excerpt = data.excerpt;

  // GitHub edit URL — points to the source markdown so contributors can submit fixes.
  $: editUrl = `https://github.com/Poohmuhahaha/lifeos/edit/main/docs/${page.file}`;

  // "On this page" active-section tracking
  let activeId = '';
  onMount(() => {
    const headings = Array.from(document.querySelectorAll('.doc-prose h2, .doc-prose h3')) as HTMLElement[];
    if (!headings.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            activeId = e.target.id;
            break;
          }
        }
      },
      { rootMargin: '0% 0% -70% 0%', threshold: 0 },
    );
    headings.forEach((h) => io.observe(h));
    return () => io.disconnect();
  });
</script>

<svelte:head>
  <title>{page.title} · LifeOS Docs</title>
  <meta name="description" content={page.description || excerpt} />
  <meta property="og:title" content={`${page.title} · LifeOS Docs`} />
  <meta property="og:description" content={page.description || excerpt} />
  <link rel="canonical" href={`https://lifeos.app/docs/${page.slug}`} />
</svelte:head>

<div class="doc-page">
  <article class="doc-article">
    <nav class="doc-crumbs" aria-label="Breadcrumb">
      <a href={base + '/'}>Docs</a>
      <span class="sep">/</span>
      <span class="muted">{page.section.title}</span>
      <span class="sep">/</span>
      <span class="cur">{page.title}</span>
    </nav>

    <header class="doc-pagehead">
      <h1>{page.title}</h1>
      <p class="doc-lede">{page.description}</p>
    </header>

    <div class="doc-prose">{@html html}</div>

    <p class="doc-edit">
      <a href={editUrl} target="_blank" rel="noopener">Edit this page on GitHub →</a>
    </p>

    <nav class="doc-pagination" aria-label="Page navigation">
      {#if prev}
        <a class="doc-pagelink prev" href={`${base}/${prev.slug}`}>
          <span class="meta">← Previous</span>
          <span class="target">{prev.title}</span>
        </a>
      {:else}
        <span></span>
      {/if}
      {#if next}
        <a class="doc-pagelink next" href={`${base}/${next.slug}`}>
          <span class="meta">Next →</span>
          <span class="target">{next.title}</span>
        </a>
      {:else}
        <span></span>
      {/if}
    </nav>
  </article>

  {#if toc.length > 1}
    <aside class="doc-toc" aria-label="On this page">
      <h2>On this page</h2>
      <ul>
        {#each toc.filter((t) => t.depth >= 2 && t.depth <= 4) as item (item.id)}
          <li>
            <a
              href={`#${item.id}`}
              class:active={activeId === item.id}
              class={`depth-${item.depth}`}
            >{item.text}</a>
          </li>
        {/each}
      </ul>
    </aside>
  {/if}
</div>

<style>
  .doc-toc a.active { color: var(--c-ink); font-weight: 600; }
</style>
