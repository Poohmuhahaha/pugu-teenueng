<script lang="ts">
  import '@lifeos/ui/design.css';
  import { page } from '$app/stores';
  import WebWorkspaceSwitcher from '$lib/components/WebWorkspaceSwitcher.svelte';

  $: pathname = $page.url.pathname;
  $: hideShell = ['/login', '/signup', '/forgot', '/reset-password'].includes(pathname);
</script>

{#if hideShell}
  <slot />
{:else}
  <div class="shell">
    <header class="top-nav">
      <div class="top-nav-inner">
        <div class="row">
          <a class="brand" href="/">
            <span class="brand-dot"></span>
            LifeOS
          </a>
          <WebWorkspaceSwitcher />
        </div>
        <nav class="nav-links">
          <a href="/" class:active={pathname === '/'}>Home</a>
          <a href="/collections" class:active={pathname.startsWith('/collections')}>Collections</a>
          <a href="/graph" class:active={pathname === '/graph'}>Graph</a>
        </nav>
        <div class="row">
          <form method="post" action="/api/auth/logout" style="margin:0">
            <button type="submit" class="btn btn-secondary btn-sm">Sign out</button>
          </form>
        </div>
      </div>
    </header>
    <main class="container shell-main">
      <slot />
    </main>
    <footer class="site-footer">
      <div class="site-footer-inner">
        <div>
          <a class="brand" href="/">
            <span class="brand-dot"></span>
            LifeOS
          </a>
          <p class="footer-tag">Smarter, simpler database workspaces.</p>
        </div>
        <div class="footer-cols">
          <div class="footer-col">
            <h4>Product</h4>
            <a href="/">Overview</a>
            <a href="/collections">Collections</a>
            <a href="/graph">Graph</a>
          </div>
          <div class="footer-col">
            <h4>Resources</h4>
            <a href="https://github.com/Poohmuhahaha/lifeos" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/quickstart.md">Documentation</a>
            <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/api.md">API</a>
          </div>
          <div class="footer-col">
            <h4>Account</h4>
            <a href="/billing">Billing</a>
            <form method="post" action="/api/auth/logout" style="margin:0">
              <button type="submit" class="footer-linkbtn">Sign out</button>
            </form>
          </div>
        </div>
      </div>
      <div class="site-footer-bottom">© {new Date().getFullYear()} LifeOS · All rights reserved</div>
    </footer>
  </div>
{/if}

<style>
  .shell { min-height: 100vh; display: flex; flex-direction: column; }
  .shell-main { padding: var(--s-xl) var(--s-xl) var(--s-section); width: 100%; flex: 1; }
  .top-nav-inner .nav-links a {
    padding: 6px 12px;
    border-radius: var(--r-md);
    transition: background 0.15s, color 0.15s;
  }
  .top-nav-inner .nav-links a:hover { background: var(--c-hairline-soft); }
  .top-nav-inner .nav-links a.active { background: var(--c-hairline-soft); color: var(--c-ink); }
  .footer-linkbtn {
    background: transparent;
    border: none;
    color: var(--c-on-dark-soft);
    font: 400 14px/1.4 var(--font-body);
    padding: 4px 0;
    cursor: pointer;
    text-align: left;
    display: block;
  }
  .footer-linkbtn:hover { color: var(--c-on-dark); }
  @media (max-width: 768px) {
    .top-nav-inner { padding: 0 var(--s-md); }
    .shell-main { padding: var(--s-md) var(--s-md) var(--s-xxl); }
  }
</style>
