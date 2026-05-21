<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@lifeos/core';

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
      <h1 class="logo">LifeOS Admin</h1>
      <div class="lang">
        {#each SUPPORTED_LOCALES as l}
          <button type="button" class:active={locale === l} on:click={() => switchLocale(l)}>{l.toUpperCase()}</button>
        {/each}
      </div>
    </div>
    <nav>
      <a href="/" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.contentTypes', locale)}</a>
      <a href="/entries" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.entries', locale)}</a>
      <a href="/search" class="nav-link" on:click={() => (mobileOpen = false)}>Search</a>
      <a href="/api-keys" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.apiKeys', locale)}</a>
      <a href="/webhooks" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.webhooks', locale)}</a>
      <a href="/audit" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.audit', locale)}</a>
      <a href="/waitlist" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.waitlist', locale)}</a>
      <a href="/billing" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.billing', locale)}</a>
      <a href="/settings/workspace" class="nav-link" on:click={() => (mobileOpen = false)}>{t('nav.workspace', locale)}</a>
      <a href="/settings/sessions" class="nav-link" on:click={() => (mobileOpen = false)}>Sessions</a>
      <a href="/email-queue" class="nav-link" on:click={() => (mobileOpen = false)}>Email Queue</a>
    </nav>
  </aside>
  <main><slot /></main>
</div>

<style>
  :global(:root) {
    --bg: #fff;
    --surface: #fafafa;
    --border: #e5e5e5;
    --ink: #111;
    --muted: #6b7280;
    --accent: #7c3aed;
    --accent-2: #facc15;
  }
  :global([data-theme="dark"]) {
    --bg: #0a0a0a;
    --surface: #141414;
    --border: #262626;
    --ink: #f5f5f5;
    --muted: #9ca3af;
  }
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; font-family: -apple-system, system-ui, sans-serif; background: var(--bg); color: var(--ink); }
  .shell { display: grid; grid-template-columns: 220px 1fr; min-height: 100vh; }
  .sidebar { padding: 24px 16px; background: var(--surface); border-right: 1px solid var(--border); }
  .brand-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .logo { font-size: 14px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--accent); margin: 0; }
  .lang { display: flex; gap: 2px; padding: 2px; background: var(--border); border-radius: 6px; }
  .lang button { background: transparent; border: none; padding: 2px 6px; font-size: 10px; cursor: pointer; border-radius: 4px; color: var(--muted); font-weight: 600; }
  .lang button.active { background: var(--bg); color: var(--accent); }
  nav { display: flex; flex-direction: column; gap: 4px; }
  .nav-link { display: block; padding: 8px 10px; border-radius: 6px; color: var(--ink); text-decoration: none; font-size: 13px; }
  .nav-link:hover { background: var(--border); }
  main { padding: 32px; max-width: 920px; }

  .hamburger {
    position: fixed; top: 12px; left: 12px;
    z-index: 60; width: 40px; height: 40px;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: 10px; color: var(--ink); cursor: pointer;
  }
  .scrim { position: fixed; inset: 0; z-index: 40; background: rgba(0,0,0,0.45); backdrop-filter: blur(2px); }

  @media (max-width: 767px) {
    .shell { grid-template-columns: 1fr; }
    main { padding: 16px; padding-top: 60px; max-width: 100%; }
    .sidebar {
      position: fixed; top: 0; left: 0;
      height: 100vh; width: 240px;
      z-index: 50;
      transform: translateX(-100%);
      transition: transform 0.2s ease;
    }
    .sidebar.mobile-open { transform: translateX(0); box-shadow: 0 4px 24px rgba(0,0,0,0.18); }
    :global(.t) { font-size: 12px; }
    :global(.t th) { padding: 6px 8px; }
    :global(.t td) { padding: 6px 8px; }
  }
</style>
