<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@lifeos/core';

  import { page } from '$app/stores';
  export let params: any = undefined;

  let mobileOpen = false;
  let isMobile = false;
  let locale: Locale = 'en';

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
      <h1 class="logo">
        <span class="logo-dot"></span>
        LifeOS
      </h1>
      <div class="lang">
        {#each SUPPORTED_LOCALES as l}
          <button type="button" class:active={locale === l} on:click={() => switchLocale(l)}>{l.toUpperCase()}</button>
        {/each}
      </div>
    </div>
    <nav>
      <a href="/" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
        {t('nav.contentTypes', locale)}
      </a>
      <a href="/entries" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        {t('nav.entries', locale)}
      </a>
      <a href="/search" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        Search
      </a>
      <a href="/api-keys" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
        {t('nav.apiKeys', locale)}
      </a>
      <a href="/webhooks" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        {t('nav.webhooks', locale)}
      </a>
      <a href="/audit" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        {t('nav.audit', locale)}
      </a>
      <a href="/waitlist" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>
        {t('nav.waitlist', locale)}
      </a>
      <a href="/billing" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        {t('nav.billing', locale)}
      </a>
      <a href="/settings/workspace" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        {t('nav.workspace', locale)}
      </a>
      <a href="/settings/sessions" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        Sessions
      </a>
      <a href="/email-queue" class="nav-link" on:click={() => (mobileOpen = false)}>
        <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
        Email Queue
      </a>
    </nav>
  </aside>
  <main><slot /></main>
</div>
{/if}

<style>
  :global(:root) {
    --bg: #ffffff;
    --bg-rgb: 255, 255, 255;
    --surface: #d7e5f0;
    --border: #c5c6c7;
    --ink: #000000;
    --muted: #73787c;
    --accent: #c9ad93;
    --accent-rgb: 201, 173, 147;
    --accent-kpi: #879a77;
    --accent-kpi-rgb: 135, 154, 119;
    --shadow: 0 2px 12px rgba(0, 0, 0, 0.03);
  }
  :global([data-theme="dark"]) {
    --bg: #000000;
    --bg-rgb: 0, 0, 0;
    --surface: #554940;
    --border: #73787c;
    --ink: #d7e5f0;
    --muted: #c5c6c7;
    --accent: #c9ad93;
    --accent-rgb: 201, 173, 147;
    --accent-kpi: #879a77;
    --accent-kpi-rgb: 135, 154, 119;
    --shadow: 0 4px 24px rgba(0, 0, 0, 0.6);
  }
  :global(*) { box-sizing: border-box; }
  :global(body) {
    margin: 0;
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    background: var(--bg);
    color: var(--ink);
    line-height: 1.6;
    background-attachment: fixed;
    background-image: radial-gradient(circle at 100% 0%, rgba(var(--accent-rgb), 0.03) 0%, rgba(var(--bg-rgb), 0) 40%);
  }
  .shell { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
  .sidebar {
    padding: 24px 16px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    backdrop-filter: blur(12px);
    display: flex;
    flex-direction: column;
  }
  .brand-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding: 0 8px; }
  .logo {
    font-size: 16px; font-weight: 800; letter-spacing: -0.03em;
    color: var(--ink);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .logo-dot {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }
  .lang { display: flex; gap: 2px; padding: 2px; background: var(--border); border-radius: 6px; }
  .lang button { background: transparent; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer; border-radius: 4px; color: var(--muted); font-weight: 700; transition: all 0.2s; }
  .lang button.active { background: var(--bg); color: var(--accent); }
  nav { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: 8px; color: var(--muted);
    text-decoration: none; font-size: 13.5px; font-weight: 500;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .nav-link :global(.icon) {
    color: var(--muted);
    transition: color 0.2s;
  }
  .nav-link:hover { color: var(--ink); background: var(--border); }
  .nav-link:hover :global(.icon) { color: var(--ink); }
  :global(.nav-link.active) {
    background: var(--border) !important;
    color: var(--ink) !important;
    font-weight: 600 !important;
  }
  :global(.nav-link.active) :global(.icon) {
    color: var(--accent) !important;
  }
  main { padding: 40px; max-width: 1100px; width: 100%; margin: 0; }
  
  .hamburger {
    position: fixed; top: 12px; left: 12px;
    z-index: 60; width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; color: var(--ink); cursor: pointer;
    box-shadow: var(--shadow);
  }
  .scrim { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.45); backdrop-filter: blur(4px); }

  @media (max-width: 767px) {
    .shell { grid-template-columns: 1fr; }
    main { padding: 24px; padding-top: 76px; max-width: 100%; }
    .sidebar {
      position: fixed; top: 0; left: 0;
      height: 100vh; width: 240px;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .sidebar.mobile-open { transform: translateX(0); box-shadow: var(--shadow); }
    :global(.t) { font-size: 12px; }
    :global(.t th) { padding: 6px 8px; }
    :global(.t td) { padding: 6px 8px; }
  }
</style>
