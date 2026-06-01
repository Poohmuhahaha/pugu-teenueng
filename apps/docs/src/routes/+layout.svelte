<script lang="ts">
  import '@lifeos/ui/design.css';
  import './docs.css';
  import { page } from '$app/stores';
  import { SECTIONS } from '$lib/sections';

  $: pathname = $page.url.pathname;
  $: activeSlug = pathname === '/' ? '' : pathname.replace(/^\/+|\/+$/g, '');

  // Mobile sidebar
  let menuOpen = false;
  function closeMenu() { menuOpen = false; }
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
      <a class="brand" href="/">
        <span class="brand-dot"></span>
        LifeOS
        <span class="brand-tag">Docs</span>
      </a>
    </div>
    <div class="search">
      <span class="search-icon" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input type="search" placeholder="Search docs… (coming soon)" disabled aria-label="Search docs" />
      <span class="kbd">⌘ K</span>
    </div>
    <nav class="nav-links">
      <a href="/" class:active={pathname === '/'}>Docs</a>
      <a href="/api" class:active={pathname.startsWith('/api')}>API</a>
      <a href="https://github.com/Poohmuhahaha/lifeos" target="_blank" rel="noopener">GitHub</a>
    </nav>
  </div>
</header>

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
                  href={`/${p.slug}`}
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
      <a class="brand" href="/">
        <span class="brand-dot"></span>
        LifeOS
      </a>
      <p class="footer-tag">Headless productivity OS. Self-host or cloud.</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Docs</h4>
        <a href="/quickstart">Quickstart</a>
        <a href="/self-host">Self-host</a>
        <a href="/api">REST API</a>
        <a href="/webhooks">Webhooks</a>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="https://lifeos.app/">Marketing site</a>
        <a href="https://lifeos.app/#pricing">Pricing</a>
        <a href="https://github.com/Poohmuhahaha/lifeos" target="_blank" rel="noopener">GitHub</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms-of-service">Terms</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">© {new Date().getFullYear()} LifeOS · All rights reserved</div>
</footer>
