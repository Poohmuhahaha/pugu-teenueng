<script lang="ts">
  import '@questpage/ui/design.css';
  import { onMount } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@questpage/core';
  import { page } from '$app/stores';

  export let params: any = undefined;

  let mobileOpen = false;
  let isMobile = false;
  let locale: Locale = 'en';

  $: pathname = $page.url.pathname;
  $: hideShell = ['/login', '/signup', '/forgot', '/reset-password'].includes(pathname);

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  onMount(() => {
    locale = detectLocale();
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => { isMobile = mq.matches; if (!mq.matches) mobileOpen = false; };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  });

  function switchLocale(l: Locale) {
    setLocale(l);
    locale = l;
  }
</script>

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

  <div class="shell">
    <aside class="sidebar" class:mobile-open={mobileOpen} class:mobile-closed={isMobile && !mobileOpen}>
      <div class="brand-row">
        <a class="brand" href="/">
          <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
          <span>QuestPage</span>
        </a>
        <div class="nav-pill-group">
          {#each SUPPORTED_LOCALES as l}
            <button type="button" class="pill-tab" class:active={locale === l} on:click={() => switchLocale(l)}>{l.toUpperCase()}</button>
          {/each}
        </div>
      </div>

      <nav class="side-nav">
        <a href="/" class="nav-link" class:active={isActive('/')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
          {t('nav.contentTypes', locale)}
        </a>
        <a href="/entries" class="nav-link" class:active={isActive('/entries')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          {t('nav.entries', locale)}
        </a>
        <a href="/search" class="nav-link" class:active={isActive('/search')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          Search
        </a>
        <a href="/api-keys" class="nav-link" class:active={isActive('/api-keys')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
          {t('nav.apiKeys', locale)}
        </a>
        <a href="/webhooks" class="nav-link" class:active={isActive('/webhooks')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          {t('nav.webhooks', locale)}
        </a>
        <a href="/audit" class="nav-link" class:active={isActive('/audit')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          {t('nav.audit', locale)}
        </a>
        <a href="/waitlist" class="nav-link" class:active={isActive('/waitlist')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
          {t('nav.waitlist', locale)}
        </a>
        <a href="/billing" class="nav-link" class:active={isActive('/billing')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          {t('nav.billing', locale)}
        </a>
        <a href="/settings/workspace" class="nav-link" class:active={isActive('/settings/workspace')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          {t('nav.workspace', locale)}
        </a>
        <a href="/settings/sessions" class="nav-link" class:active={isActive('/settings/sessions')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          Sessions
        </a>
        <a href="/email-queue" class="nav-link" class:active={isActive('/email-queue')} on:click={() => (mobileOpen = false)}>
          <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Email Queue
        </a>
      </nav>

      <form method="post" action="/api/auth/logout" class="signout-form">
        <button type="submit" class="btn btn-secondary btn-block btn-sm">Sign out</button>
      </form>
    </aside>
    <main class="content">
      <slot />
    </main>
  </div>
{/if}

<style>
  .shell {
    display: grid;
    grid-template-columns: 260px 1fr;
    min-height: 100vh;
    background: var(--c-canvas);
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
  }
  .brand-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 4px 8px;
    margin-bottom: var(--s-md);
  }
  .side-nav {
    display: flex; flex-direction: column; gap: 2px;
    flex: 1;
  }
  .nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px;
    border-radius: var(--r-md);
    color: var(--c-body);
    text-decoration: none;
    font: 500 14px/1.4 var(--font-body);
    transition: background 0.15s, color 0.15s;
  }
  .nav-link .icon { color: var(--c-muted); flex: none; }
  .nav-link:hover { background: var(--c-hairline-soft); color: var(--c-ink); text-decoration: none; }
  .nav-link.active { background: var(--c-canvas); color: var(--c-ink); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .nav-link.active .icon { color: var(--c-ink); }

  .signout-form { padding: 4px 0 0; border-top: 1px solid var(--c-hairline-soft); margin-top: var(--s-xs); padding-top: var(--s-md); }

  .content {
    padding: var(--s-xl) var(--s-xxl);
    max-width: 1200px;
    width: 100%;
    margin: 0;
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
</style>
