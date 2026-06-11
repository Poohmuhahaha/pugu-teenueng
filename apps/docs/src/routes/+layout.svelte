<script lang="ts">
  import '@questpage/ui/design.css';
  import './docs.css';
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { SECTIONS, FLAT_PAGES } from '$lib/sections';
  import { onMount } from 'svelte';

  $: pathname = $page.url.pathname;
  $: stripped = pathname.replace(new RegExp(`^${base}`), '') || '/';
  $: activeSlug = stripped === '/' ? '' : stripped.replace(/^\/+|\/+$/g, '');

  // Mobile sidebar
  let menuOpen = false;
  function closeMenu() { menuOpen = false; }

  // === Search Modal ===
  let searchQuery = '';
  let searchOpen = false;
  let searchInputEl: HTMLInputElement;
  let activeIdx = 0;

  $: searchResults = searchQuery.trim().length < 1
    ? FLAT_PAGES.slice(0, 6)   // show recent pages when empty
    : FLAT_PAGES.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.section.title.toLowerCase().includes(q)
        );
      }).slice(0, 8);

  $: if (searchQuery || searchOpen) { activeIdx = 0; }

  function openSearch() {
    searchOpen = true;
    setTimeout(() => searchInputEl?.focus(), 30);
  }

  function closeSearch() {
    searchOpen = false;
    searchQuery = '';
    activeIdx = 0;
  }

  function selectResult(slug: string) {
    goto(`${base}/${slug}`);
    closeSearch();
  }

  function onModalKey(e: KeyboardEvent) {
    if (e.key === 'Escape') { closeSearch(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIdx = Math.min(activeIdx + 1, searchResults.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIdx = Math.max(activeIdx - 1, 0);
    } else if (e.key === 'Enter' && searchResults[activeIdx]) {
      selectResult(searchResults[activeIdx].slug);
    }
  }

  function onGlobalKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchOpen ? closeSearch() : openSearch();
    }
    if (e.key === 'Escape' && searchOpen) closeSearch();
  }

  onMount(() => {
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  });
</script>

<header class="top-nav">
  <div class="top-nav-inner">
    <div class="row">
      <button
        class="menu-btn"
        type="button"
        aria-label="Open navigation"
        aria-expanded={menuOpen}
        on:click={() => (menuOpen = !menuOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          {#if menuOpen}
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          {:else}
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          {/if}
        </svg>
      </button>
      <a class="brand" href="http://localhost:5177/">
        <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
        <span>QuestPage</span>
        <span class="brand-tag">Docs</span>
      </a>
    </div>

    <!-- Search trigger button (not a real input) -->
    <button class="search-trigger" type="button" aria-label="Search docs" on:click={openSearch}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <span>Search docs…</span>
      <kbd>⌘ K</kbd>
    </button>

    <nav class="nav-links">
      <a href={base + '/'} class:active={stripped === '/'}>Docs</a>
      <a href={base + '/api'} class:active={stripped.startsWith('/api')}>API</a>
      <a href="https://github.com/Poohmuhahaha/questpage" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</header>

<!-- Search Modal -->
{#if searchOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="search-overlay" on:click={closeSearch}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="search-modal" on:click|stopPropagation role="dialog" aria-modal="true" aria-label="Search">
      <!-- Input -->
      <div class="search-modal-input-row">
        <svg class="search-modal-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          bind:this={searchInputEl}
          bind:value={searchQuery}
          type="search"
          placeholder="Search docs…"
          aria-label="Search docs"
          on:keydown={onModalKey}
        />
        <button class="search-close-btn" type="button" on:click={closeSearch} aria-label="Close search">
          ESC
        </button>
      </div>

      <!-- Results -->
      <ul class="search-results" role="listbox">
        {#if searchResults.length > 0}
          {#if searchQuery.trim().length === 0}
            <li class="search-hint">Recent pages</li>
          {/if}
          {#each searchResults as result, i (result.slug)}
            <li
              class="search-result-item"
              class:active={i === activeIdx}
              role="option"
              aria-selected={i === activeIdx}
            >
              <a
                href="{base}/{result.slug}"
                on:click|preventDefault={() => selectResult(result.slug)}
                on:mouseenter={() => activeIdx = i}
              >
                <div class="sri-left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="sri-body">
                  <span class="sri-title">{result.title}</span>
                  <span class="sri-section">{result.section.title}</span>
                </div>
                <svg class="sri-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </a>
            </li>
          {/each}
        {:else}
          <li class="search-no-results">
            No results for "<strong>{searchQuery}</strong>"
          </li>
        {/if}
      </ul>

      <!-- Footer hint -->
      <div class="search-modal-footer">
        <span><kbd>↑↓</kbd> navigate</span>
        <span><kbd>↵</kbd> select</span>
        <span><kbd>ESC</kbd> close</span>
      </div>
    </div>
  </div>
{/if}

<div class="docs-shell">
  <aside class="docs-sidebar" class:open={menuOpen}>
    <nav aria-label="Documentation navigation">
      {#each SECTIONS as section (section.id)}
        <div class="sb-section">
          <div class="sb-section-title">{section.title}</div>
          <ul>
            {#each section.pages as p (p.slug)}
              <li>
                <a
                  href={`${base}/${p.slug}`}
                  class:active={activeSlug === p.slug}
                  on:click={closeMenu}
                >{p.title}</a>
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </nav>
  </aside>

  {#if menuOpen}
    <button class="sb-scrim" type="button" aria-label="Close navigation" on:click={closeMenu}></button>
  {/if}

  <main class="docs-main">
    <slot />
  </main>
</div>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a class="brand" href="http://localhost:5177/">
        <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
        <span>QuestPage</span>
      </a>
      <p class="footer-tag">Your personal AI secretary that turns daily life into RPG quests.</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Docs</h4>
        <a href={base + '/quickstart'}>Quickstart</a>
        <a href={base + '/self-host'}>Self-host</a>
        <a href={base + '/api'}>REST API</a>
        <a href={base + '/webhooks'}>Webhooks</a>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="https://questpage.app/">Marketing site</a>
        <a href="https://questpage.app/#pricing">Pricing</a>
        <a href="https://github.com/Poohmuhahaha/questpage" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href={base + '/privacy-policy'}>Privacy</a>
        <a href={base + '/terms-of-service'}>Terms</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">© {new Date().getFullYear()} QuestPage · All rights reserved</div>
</footer>

<style>
  /* ── Search trigger button in navbar ── */
  .search-trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 36px;
    padding: 0 12px;
    background: var(--c-surface-soft, #FFD59A);
    border: 2px solid var(--c-hairline, #B97A3A);
    color: var(--c-muted, #B97A3A);
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    flex: 1;
    max-width: 280px;
    text-align: left;
    transition: border-color 0.15s, background 0.15s;
  }
  .search-trigger span { flex: 1; }
  .search-trigger:hover {
    border-color: var(--c-primary, #3A2616);
    color: var(--c-ink, #3A2616);
  }
  .search-trigger kbd {
    font-size: 11px;
    font-family: inherit;
    background: var(--c-canvas, #FFF2D9);
    border: 1px solid var(--c-hairline, #B97A3A);
    padding: 2px 5px;
    color: var(--c-muted, #B97A3A);
  }

  /* ── Search Modal overlay ── */
  .search-overlay {
    position: fixed;
    inset: 0;
    z-index: 500;
    background: rgba(58, 38, 22, 0.5);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 80px;
    animation: fadeIn 0.1s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .search-modal {
    width: 100%;
    max-width: 560px;
    background: var(--c-canvas, #FFF2D9);
    border: 3px solid var(--c-primary, #3A2616);
    box-shadow: 6px 6px 0 var(--c-primary, #3A2616);
    display: flex;
    flex-direction: column;
    animation: slideDown 0.15s ease;
    max-height: calc(100vh - 140px);
  }

  @keyframes slideDown {
    from { transform: translateY(-12px); opacity: 0; }
    to   { transform: translateY(0);     opacity: 1; }
  }

  /* Input row */
  .search-modal-input-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border-bottom: 3px solid var(--c-primary, #3A2616);
  }
  .search-modal-icon { flex: none; color: var(--c-muted, #B97A3A); }
  .search-modal-input-row input {
    flex: 1;
    border: none;
    background: transparent;
    font-size: 16px;
    font-family: inherit;
    color: var(--c-ink, #3A2616);
    outline: none;
  }
  .search-modal-input-row input::placeholder { color: var(--c-muted, #B97A3A); }
  /* hide browser default search clear button */
  .search-modal-input-row input::-webkit-search-cancel-button { display: none; }

  .search-close-btn {
    flex: none;
    background: var(--c-surface-soft, #FFD59A);
    border: 1px solid var(--c-hairline, #B97A3A);
    font-size: 11px;
    font-family: inherit;
    color: var(--c-muted, #B97A3A);
    padding: 3px 7px;
    cursor: pointer;
  }

  /* Results list */
  .search-results {
    list-style: none;
    margin: 0;
    padding: 6px 0;
    overflow-y: auto;
    flex: 1;
  }
  .search-hint {
    padding: 6px 16px 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-muted, #B97A3A);
  }
  .search-result-item a {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    text-decoration: none;
    transition: background 0.1s;
  }
  .search-result-item.active a,
  .search-result-item a:hover {
    background: var(--c-surface-soft, #FFD59A);
  }
  .sri-left {
    flex: none;
    width: 28px; height: 28px;
    display: flex; align-items: center; justify-content: center;
    background: var(--c-surface-card, #FFD59A);
    border: 2px solid var(--c-primary, #3A2616);
    color: var(--c-primary, #3A2616);
  }
  .sri-body { flex: 1; min-width: 0; }
  .sri-title {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--c-ink, #3A2616);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .sri-section {
    display: block;
    font-size: 12px;
    color: var(--c-muted, #B97A3A);
  }
  .sri-arrow { flex: none; color: var(--c-muted, #B97A3A); opacity: 0; transition: opacity 0.1s; }
  .search-result-item.active .sri-arrow,
  .search-result-item a:hover .sri-arrow { opacity: 1; }

  .search-no-results {
    padding: 24px 16px;
    font-size: 14px;
    color: var(--c-muted, #B97A3A);
    text-align: center;
  }

  /* Footer hints */
  .search-modal-footer {
    display: flex;
    gap: 16px;
    padding: 8px 16px;
    border-top: 2px solid var(--c-hairline-soft, #FFD59A);
    font-size: 11px;
    color: var(--c-muted, #B97A3A);
  }
  .search-modal-footer kbd {
    font-family: inherit;
    background: var(--c-surface-soft, #FFD59A);
    border: 1px solid var(--c-hairline, #B97A3A);
    padding: 1px 5px;
    font-size: 10px;
    margin-right: 3px;
  }

  @media (max-width: 640px) {
    .search-overlay { padding-top: 20px; align-items: flex-start; }
    .search-modal { max-width: 100%; margin: 0 12px; }
    .search-trigger { max-width: 160px; }
    .search-trigger kbd { display: none; }
  }
</style>
