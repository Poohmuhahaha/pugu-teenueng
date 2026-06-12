<script lang="ts">
  import '@questpage/ui/design.css';
  import { onMount } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@questpage/core';
  import { page } from '$app/stores';

  export let params: any = undefined;

  let mobileOpen = false;
  let isMobile = false;
  let locale: Locale = 'en';

  // Sidebar collapsible state
  let sidebarCollapsed = false;

  // Search Modal state
  let searchOpen = false;
  let searchQuery = '';
  let searchHits: any[] = [];
  let searchLoading = false;
  let searchDebounce: ReturnType<typeof setTimeout> | null = null;
  let searchInputEl: HTMLInputElement;

  $: pathname = $page.url.pathname;
  $: hideShell = ['/login', '/signup', '/forgot', '/reset-password'].includes(pathname);

  function isActive(href: string, currentPath: string): boolean {
    if (href === '/') return currentPath === '/';
    return currentPath === href || currentPath.startsWith(href + '/');
  }

  onMount(() => {
    locale = detectLocale();

    // Load sidebar collapsed state
    try {
      sidebarCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
    } catch (e) {
      console.error(e);
    }

    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => { isMobile = mq.matches; if (!mq.matches) mobileOpen = false; };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  });

  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    try {
      localStorage.setItem('sidebar_collapsed', String(sidebarCollapsed));
    } catch (e) {
      console.error(e);
    }
  }

  function switchLocale(l: Locale) {
    setLocale(l);
    locale = l;
  }

  // Search logic
  function handleSearchInput() {
    if (searchDebounce) clearTimeout(searchDebounce);
    searchDebounce = setTimeout(performSearch, 200);
  }

  async function performSearch() {
    const query = searchQuery.trim();
    if (query.length < 2) {
      searchHits = [];
      return;
    }
    searchLoading = true;
    try {
      const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const body = await res.json();
        searchHits = body.data || [];
      }
    } catch (e) {
      console.error('Search error:', e);
    } finally {
      searchLoading = false;
    }
  }

  function closeSearch() {
    searchOpen = false;
    searchQuery = '';
    searchHits = [];
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchOpen = !searchOpen;
      if (searchOpen) {
        setTimeout(() => searchInputEl?.focus(), 50);
      }
    } else if (e.key === 'Escape' && searchOpen) {
      closeSearch();
    }
  }

  function primaryField(d: Record<string, any>): string {
    return String(d.title ?? d.name ?? d.email ?? Object.values(d)[0] ?? '—').slice(0, 80);
  }

  function snippet(d: Record<string, any>, q: string): string {
    const all = Object.values(d).filter((v) => typeof v === 'string').join(' ');
    const i = all.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return all.slice(0, 120) + (all.length > 120 ? '…' : '');
    const start = Math.max(0, i - 40);
    const end = Math.min(all.length, i + q.length + 40);
    return (start > 0 ? '…' : '') + all.slice(start, end) + (end < all.length ? '…' : '');
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if hideShell}
  <slot />
{:else}
  {#if isMobile}
    <button
      type="button"
      class="hamburger"
      aria-label="Toggle navigation menu"
      aria-expanded={mobileOpen}
      on:click={() => (mobileOpen = !mobileOpen)}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        {#if mobileOpen}
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        {:else}
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        {/if}
      </svg>
    </button>
    {#if mobileOpen}
      <div class="scrim" role="presentation" on:click={() => (mobileOpen = false)}></div>
    {/if}
  {/if}

  <div class="shell" class:collapsed={sidebarCollapsed}>
    <aside class="sidebar" class:collapsed={sidebarCollapsed} class:mobile-open={mobileOpen} class:mobile-closed={isMobile && !mobileOpen}>
      {#if !isMobile}
        <button type="button" class="sidebar-toggle" on:click={toggleSidebar} aria-label="Toggle Sidebar">
          {#if sidebarCollapsed}
            »
          {:else}
            «
          {/if}
        </button>
      {/if}

      <div class="brand-row">
        <a class="brand" href="/">
          <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
          <span class="brand-text">QuestPage</span>
        </a>
      </div>

      <nav class="side-nav">
        <a href="/" class="nav-link" class:active={isActive('/', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.contentTypes', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          <span class="nav-text">{t('nav.contentTypes', locale)}</span>
        </a>
        <a href="/entries" class="nav-link" class:active={isActive('/entries', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.entries', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span class="nav-text">{t('nav.entries', locale)}</span>
        </a>
        <a href="/api-keys" class="nav-link" class:active={isActive('/api-keys', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.apiKeys', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          <span class="nav-text">{t('nav.apiKeys', locale)}</span>
        </a>
        <a href="/webhooks" class="nav-link" class:active={isActive('/webhooks', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.webhooks', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          <span class="nav-text">{t('nav.webhooks', locale)}</span>
        </a>
        <a href="/audit" class="nav-link" class:active={isActive('/audit', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.audit', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <span class="nav-text">{t('nav.audit', locale)}</span>
        </a>
        <a href="/waitlist" class="nav-link" class:active={isActive('/waitlist', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.waitlist', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
          <span class="nav-text">{t('nav.waitlist', locale)}</span>
        </a>
        <a href="/billing" class="nav-link" class:active={isActive('/billing', pathname)} on:click={() => (mobileOpen = false)} data-tooltip={t('nav.billing', locale)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          <span class="nav-text">{t('nav.billing', locale)}</span>
        </a>
        <a href="/settings/workspace" class="nav-link" class:active={isActive('/settings', pathname)} on:click={() => (mobileOpen = false)} data-tooltip="Settings">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          <span class="nav-text">Settings</span>
        </a>
        <a href="/email-queue" class="nav-link" class:active={isActive('/email-queue', pathname)} on:click={() => (mobileOpen = false)} data-tooltip="Email Queue">
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          <span class="nav-text">Email Queue</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="sidebar-search-btn" on:click={() => (searchOpen = true)} data-tooltip="Search (⌘K)">
          <span class="search-btn-inner">
            <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            {#if !sidebarCollapsed}
              <span class="search-text">Search</span>
              <kbd class="search-kbd">⌘K</kbd>
            {/if}
          </span>
        </button>

        {#if !sidebarCollapsed}
          <div class="nav-pill-group language-switcher">
            {#each SUPPORTED_LOCALES as l}
              <button type="button" class="pill-tab" class:active={locale === l} on:click={() => switchLocale(l)}>{l.toUpperCase()}</button>
            {/each}
          </div>
        {:else}
          <button type="button" class="lang-toggle-btn" on:click={() => switchLocale(locale === 'en' ? 'th' : 'en')} data-tooltip="Toggle Language">
            {locale.toUpperCase()}
          </button>
        {/if}

        <form method="post" action="/api/auth/logout" class="signout-form">
          {#if !sidebarCollapsed}
            <button type="submit" class="btn btn-ghost btn-block btn-sm" style="border: 1px solid var(--c-hairline); border-radius: var(--r-md); box-shadow: 0 1px 2px rgba(0,0,0,0.05); height: 36px;">Sign out</button>
          {:else}
            <button type="submit" class="signout-icon-btn" data-tooltip="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          {/if}
        </form>
      </div>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
{/if}

{#if searchOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="search-overlay" on:click={closeSearch}>
    <div class="search-modal" on:click|stopPropagation>
      <div class="search-header">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          bind:this={searchInputEl}
          bind:value={searchQuery}
          on:input={handleSearchInput}
          placeholder="Search collections, entries, and settings..."
          class="search-input-field"
        />
        <span class="search-esc-hint">ESC</span>
      </div>

      <div class="search-results-container">
        {#if searchLoading}
          <div class="search-loading-state">Searching...</div>
        {:else if searchQuery.trim().length >= 2 && searchHits.length === 0}
          <div class="search-empty-state">No results found for "{searchQuery}"</div>
        {:else if searchHits.length > 0}
          <div class="search-results-list">
            {#each searchHits as hit}
              <a href={`/entries?type=${hit.slug}`} class="search-result-item" on:click={closeSearch}>
                <div class="result-title">{primaryField(hit.data)}</div>
                <div class="result-meta">
                  <span class="result-badge">{hit.slug}</span>
                  <span class="result-snippet">{snippet(hit.data, searchQuery)}</span>
                </div>
              </a>
            {/each}
          </div>
        {:else}
          <div class="search-welcome-state">
            <div class="welcome-title">Search QuestPage Console</div>
            <div class="welcome-desc">Type at least 2 characters or press <strong>⌘K</strong> / <strong>Ctrl+K</strong> to trigger search.</div>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .shell {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
    background: var(--c-canvas);
    transition: grid-template-columns 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .shell.collapsed {
    grid-template-columns: 72px 1fr;
  }
  .sidebar {
    padding: var(--s-lg);
    background: var(--c-surface-soft);
    border-right: 1px solid var(--c-hairline);
    display: flex;
    flex-direction: column;
    gap: var(--s-md);
    position: sticky;
    top: 0;
    height: 100vh;
    transition: padding 0.18s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: 100;
  }
  .sidebar.collapsed {
    padding: var(--s-lg) 8px;
  }
  .sidebar-toggle {
    position: absolute;
    right: -12px;
    top: 24px;
    z-index: 110;
    width: 24px;
    height: 24px;
    border-radius: 0px;
    border: 3px solid var(--c-primary);
    background: var(--c-canvas);
    color: var(--c-primary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font: 600 12px/1 var(--font-body);
    box-shadow: 2px 2px 0 var(--c-primary);
    transition: transform 0.1s, background 0.12s;
  }
  .sidebar-toggle:hover {
    background: var(--c-surface-soft);
  }
  .brand-row {
    display: flex; align-items: center;
    padding: 4px 8px;
    margin-bottom: var(--s-md);
    transition: justify-content 0.18s;
  }
  .sidebar.collapsed .brand-row {
    justify-content: center;
    padding: 4px 0;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: var(--c-ink);
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.3px;
  }
  .brand-text {
    transition: opacity 0.15s;
  }
  .sidebar.collapsed .brand-text {
    display: none;
  }
  .side-nav {
    display: flex; flex-direction: column; gap: 6px;
    flex: 1;
  }
  .nav-link {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 14px;
    border-radius: 0px;
    border: 2px solid transparent;
    color: var(--c-body);
    text-decoration: none;
    font: 600 14px/1.4 var(--font-body);
    transition: background 0.12s, color 0.12s, border-color 0.12s, box-shadow 0.12s, justify-content 0.18s, padding 0.18s;
  }
  .nav-link .icon { color: var(--c-muted); flex: none; }
  .nav-link:hover { background: var(--c-hairline-soft); color: var(--c-ink); text-decoration: none; }
  .nav-link.active { 
    background: var(--c-canvas); 
    color: var(--c-ink); 
    border-color: var(--c-primary); 
    box-shadow: 2px 2px 0 var(--c-primary); 
  }
  .nav-link.active .icon { color: var(--c-ink); }

  .sidebar.collapsed .nav-text {
    display: none;
  }
  .sidebar.collapsed .nav-link {
    justify-content: center;
    padding: 10px 0;
  }

  .sidebar-footer {
    display: flex;
    flex-direction: column;
    margin-top: auto;
    padding-top: var(--s-md);
    border-top: 2px solid var(--c-hairline-soft);
  }

  /* ── Sidebar Search Button ── */
  .sidebar-search-btn {
    display: flex;
    align-items: center;
    width: 100%;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    padding: 8px 12px;
    margin-bottom: var(--s-md);
    cursor: pointer;
    font: 500 14px/1.4 var(--font-body);
    color: var(--c-body);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }
  .sidebar-search-btn:hover {
    background: var(--c-surface-soft);
    border-color: var(--c-hairline-soft);
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  }
  .sidebar-search-btn:active {
    transform: none;
  }
  .sidebar.collapsed .sidebar-search-btn {
    padding: 8px 0;
    justify-content: center;
  }
  .search-btn-inner {
    display: flex;
    align-items: center;
    width: 100%;
    gap: 10px;
    justify-content: inherit;
  }
  .search-text {
    flex: 1;
    text-align: left;
  }
  .search-kbd {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--c-surface-soft);
    border: 1px solid var(--c-hairline);
    border-radius: 4px;
    box-shadow: none;
    font-family: inherit;
    font-weight: 500;
  }

  /* ── Language Switcher Collapsed ── */
  .lang-toggle-btn {
    width: 100%;
    height: 36px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    font: 600 12px/1 var(--font-body);
    color: var(--c-body);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    margin-bottom: var(--s-md);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: background 0.2s;
  }
  .lang-toggle-btn:hover {
    background: var(--c-surface-soft);
  }

  /* ── Signout Button Collapsed ── */
  .signout-icon-btn {
    width: 100%;
    height: 36px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    color: var(--c-error);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    transition: background 0.2s;
  }
  .signout-icon-btn:hover {
    background: rgba(239, 68, 68, 0.08);
  }

  /* ── Tooltips for Collapsed Sidebar Items ── */
  .sidebar.collapsed .nav-link,
  .sidebar.collapsed .sidebar-search-btn,
  .sidebar.collapsed .lang-toggle-btn,
  .sidebar.collapsed .signout-icon-btn {
    position: relative;
  }
  .sidebar.collapsed .nav-link::after,
  .sidebar.collapsed .sidebar-search-btn::after,
  .sidebar.collapsed .lang-toggle-btn::after,
  .sidebar.collapsed .signout-icon-btn::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 14px;
    background: var(--c-primary);
    color: var(--c-on-dark);
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.12s ease, transform 0.12s ease;
    border: 2px solid var(--c-primary);
    box-shadow: 2px 2px 0 var(--c-brand-accent);
    z-index: 9999;
  }
  .sidebar.collapsed .nav-link:hover::after,
  .sidebar.collapsed .sidebar-search-btn:hover::after,
  .sidebar.collapsed .lang-toggle-btn:hover::after,
  .sidebar.collapsed .signout-icon-btn:hover::after {
    opacity: 1;
    transform: translateY(-50%) translateX(2px);
  }

  .language-switcher {
    width: 100%;
    margin-bottom: var(--s-md);
    display: flex;
    background: var(--c-surface-soft);
    border-radius: var(--r-md);
    padding: 2px;
  }
  .language-switcher .pill-tab {
    flex: 1;
    text-align: center;
    padding: 6px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-muted);
    background: transparent;
    border: none;
    border-radius: calc(var(--r-md) - 2px);
    cursor: pointer;
    transition: all 0.2s;
  }
  .language-switcher .pill-tab.active {
    background: var(--c-canvas);
    color: var(--c-ink);
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }
  .signout-form { padding: 0; }

  .content {
    padding: var(--s-xl) var(--s-xxl);
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  .hamburger {
    position: fixed; top: 12px; left: 12px;
    z-index: 60; width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    background: var(--c-canvas); border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    color: var(--c-ink); cursor: pointer;
    box-shadow: var(--shadow-sm);
  }
  .scrim {
    position: fixed; inset: 0; z-index: 40;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }

  @media (max-width: 767px) {
    .shell { grid-template-columns: 1fr; }
    .content { padding: var(--s-xl) var(--s-md); padding-top: 72px; max-width: 100%; }
    .sidebar {
      position: fixed; top: 0; left: 0;
      width: 260px; height: 100vh;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.25s ease;
    }
    .sidebar.mobile-open {
      transform: translateX(0);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }
  }
  .brand-logo {
    height: 28px;
    width: auto;
    object-fit: contain;
  }

  /* ── Search Modal styles ── */
  .search-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(58, 38, 22, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
  }
  .search-modal {
    width: 100%;
    max-width: 600px;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    box-shadow: 6px 6px 0 var(--c-primary);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .search-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 3px solid var(--c-primary);
    background: var(--c-surface-soft);
  }
  .search-icon {
    color: var(--c-primary);
    flex: none;
  }
  .search-input-field {
    flex: 1;
    background: transparent;
    border: none;
    font: 600 16px/1.4 var(--font-body);
    color: var(--c-ink);
    padding: 0;
  }
  .search-input-field:focus {
    outline: none;
  }
  .search-esc-hint {
    font-size: 11px;
    font-weight: bold;
    padding: 3px 6px;
    background: var(--c-canvas);
    border: 2px solid var(--c-primary);
    color: var(--c-muted);
    box-shadow: 1px 1px 0 var(--c-primary);
  }

  .search-results-container {
    max-height: 400px;
    overflow-y: auto;
    background: var(--c-canvas);
  }
  .search-loading-state, .search-empty-state, .search-welcome-state {
    padding: 32px;
    text-align: center;
    color: var(--c-muted);
    font-size: 14px;
  }
  .welcome-title {
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--c-ink);
    margin-bottom: 6px;
    font-weight: 600;
  }
  .welcome-desc {
    font-size: 13.5px;
    color: var(--c-muted);
  }

  .search-results-list {
    display: flex;
    flex-direction: column;
  }
  .search-result-item {
    display: block;
    padding: 14px 20px;
    border-bottom: 1px solid var(--c-hairline-soft);
    text-decoration: none;
    color: inherit;
    transition: background 0.1s;
  }
  .search-result-item:last-child {
    border-bottom: none;
  }
  .search-result-item:hover {
    background: var(--c-surface-soft);
    text-decoration: none;
  }
  .result-title {
    font-weight: 600;
    font-size: 15px;
    color: var(--c-ink);
  }
  .result-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 4px;
    font-size: 12px;
  }
  .result-badge {
    background: var(--c-canvas);
    border: 1.5px solid var(--c-primary);
    padding: 1px 6px;
    font-weight: 600;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--c-primary);
  }
  .result-snippet {
    color: var(--c-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
  }
</style>
