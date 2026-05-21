<script lang="ts">
  import { page } from '$app/stores';
  import WebWorkspaceSwitcher from '$lib/components/WebWorkspaceSwitcher.svelte';
  export let params: any = undefined;
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
    background-image: radial-gradient(circle at 50% -10%, rgba(var(--accent-rgb), 0.03) 0%, rgba(var(--bg-rgb), 0) 50%);
  }
  .shell { min-height: 100vh; display: flex; flex-direction: column; }
  .topbar {
    display: flex; align-items: center; gap: 32px;
    padding: 14px 32px;
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(16px);
    background: rgba(var(--bg-rgb), 0.85);
    border-bottom: 1px solid var(--border);
    box-shadow: 0 1px 2px rgba(0,0,0,0.01);
  }
  .brand {
    font-weight: 800; font-size: 19px; letter-spacing: -0.03em;
    text-decoration: none;
    color: var(--ink);
    display: flex;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s;
  }
  .brand::before {
    content: '';
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent);
  }
  .brand:hover { transform: scale(1.02); }
  nav { flex: 1; display: flex; gap: 12px; align-items: center; }
  nav a {
    color: var(--muted); text-decoration: none; font-size: 14px; font-weight: 500;
    padding: 6px 14px; border-radius: 8px; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  nav a:hover { color: var(--ink); background: var(--border); }
  nav a.active {
    background: var(--border);
    color: var(--ink);
    font-weight: 600;
  }
  .logout {
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    border-radius: 8px; padding: 6px 14px; font-size: 13px; font-weight: 500; cursor: pointer;
    transition: all 0.2s;
  }
  .logout:hover { color: #ef4444; border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); }
  main { padding: 40px 32px; max-width: 1200px; width: 100%; margin: 0 auto; flex: 1; }
</style>
