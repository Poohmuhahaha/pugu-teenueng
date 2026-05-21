<script lang="ts">
  import { page } from '$app/stores';
  import WebWorkspaceSwitcher from '$lib/components/WebWorkspaceSwitcher.svelte';
  $: hideShell = ['/login', '/signup', '/forgot', '/reset-password'].includes($page.url.pathname);
</script>

{#if hideShell}
  <slot />
{:else}
  <div class="shell">
    <header class="topbar">
      <a href="/" class="brand">LifeOS</a>
      <WebWorkspaceSwitcher />
      <nav>
        <a href="/" class:active={$page.url.pathname === '/'}>Home</a>
        <a href="/collections" class:active={$page.url.pathname.startsWith('/collections')}>Collections</a>
        <a href="/graph" class:active={$page.url.pathname === '/graph'}>Graph</a>
      </nav>
      <form method="post" action="/api/auth/logout" style="margin:0">
        <button type="submit" class="logout">Sign out</button>
      </form>
    </header>
    <main><slot /></main>
  </div>
{/if}

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
  :global(body) { margin: 0; font-family: -apple-system, system-ui, 'Inter', sans-serif; background: var(--bg); color: var(--ink); }
  .shell { min-height: 100vh; display: flex; flex-direction: column; }
  .topbar {
    display: flex; align-items: center; gap: 32px;
    padding: 12px 24px; border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .brand { font-weight: 800; font-size: 16px; color: var(--accent); text-decoration: none; }
  nav { flex: 1; display: flex; gap: 20px; }
  nav a { color: var(--ink); text-decoration: none; font-size: 14px; padding: 6px 10px; border-radius: 6px; }
  nav a:hover { background: var(--border); }
  nav a.active { background: var(--accent); color: #fff; }
  .logout { background: transparent; border: 1px solid var(--border); color: var(--ink); border-radius: 6px; padding: 6px 12px; font-size: 13px; cursor: pointer; }
  main { padding: 32px 24px; max-width: 1100px; width: 100%; margin: 0 auto; }
</style>
