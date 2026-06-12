<script lang="ts">
  export let params: any = undefined;
  import '@questpage/ui/design.css';
  import { page } from '$app/stores';
  import WebWorkspaceSwitcher from '$lib/components/WebWorkspaceSwitcher.svelte';

  $: pathname = $page.url.pathname;
  $: hideShell = ['/login', '/signup', '/forgot', '/reset-password'].some((p) =>
    pathname.startsWith(p)
  );

  const navItems = [
    { href: '/', label: 'Lead Desk', icon: `<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>` },
    { href: '/collections', label: 'Collections', icon: `<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/>` },
    { href: '/graph', label: 'Graph', icon: `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>` },
  ];

  let sidebarOpen = false;
</script>

{#if hideShell}
  <slot />
{:else}
  <div class="app-shell">
    <!-- Sidebar -->
    <aside class="sidebar" class:open={sidebarOpen}>
      <div class="sidebar-brand">
        <a href="/" class="brand">
          <img src="/logo.png" alt="QuestPage" style="height:24px;width:auto;object-fit:contain;" />
          <span>QuestPage</span>
        </a>
      </div>

      <div class="sidebar-ws">
        <WebWorkspaceSwitcher />
      </div>

      <nav class="sidebar-nav">
        {#each navItems as item}
          <a
            href={item.href}
            class="sidebar-link"
            class:active={item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              {@html item.icon}
            </svg>
            {item.label}
          </a>
        {/each}
      </nav>

      <div class="sidebar-footer">
        <a href="/billing" class="sidebar-link" class:active={pathname === '/billing'}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Billing
        </a>
        <form method="post" action="/api/auth/logout" style="margin:0">
          <button type="submit" class="sidebar-signout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign out
          </button>
        </form>
      </div>
    </aside>

    <!-- Mobile overlay -->
    {#if sidebarOpen}
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div class="sidebar-scrim" on:click={() => (sidebarOpen = false)}></div>
    {/if}

    <!-- Main content area -->
    <div class="main-area">
      <!-- Mobile topbar -->
      <div class="mobile-topbar">
        <button class="mobile-menu-btn" type="button" aria-label="Open menu" on:click={() => (sidebarOpen = !sidebarOpen)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <a href="/" class="brand">
          <img src="/logo.png" alt="QuestPage" style="height:24px;width:auto;object-fit:contain;" />
          <span>QuestPage</span>
        </a>
      </div>

      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
{/if}

<style>
  /* ── App shell layout ── */
  .app-shell {
    display: flex;
    min-height: 100vh;
    background: var(--c-canvas, #FFF2D9);
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 220px;
    flex: none;
    display: flex;
    flex-direction: column;
    background: var(--c-primary, #3A2616);
    border-right: 3px solid var(--c-primary, #3A2616);
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
    z-index: 100;
  }

  .sidebar-brand {
    padding: 20px 16px 16px;
    border-bottom: 2px solid rgba(255,255,255,0.12);
  }
  .sidebar-brand .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    color: #FFFFFF;
    font-weight: 700;
    font-size: 15px;
    letter-spacing: -0.3px;
  }

  .sidebar-ws {
    padding: 12px 16px;
    border-bottom: 2px solid rgba(255,255,255,0.12);
  }

  .sidebar-nav {
    padding: 12px 8px;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-link {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border-radius: 0;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255,255,255,0.65);
    transition: background 0.12s, color 0.12s;
    border: 2px solid transparent;
  }
  .sidebar-link:hover {
    color: #FFFFFF;
    background: rgba(255,255,255,0.08);
  }
  .sidebar-link.active {
    color: #FFFFFF;
    background: rgba(255,255,255,0.14);
    border-color: rgba(255,255,255,0.3);
  }

  .sidebar-footer {
    padding: 12px 8px 20px;
    border-top: 2px solid rgba(255,255,255,0.12);
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .sidebar-signout {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    width: 100%;
    background: transparent;
    border: 2px solid transparent;
    font: 500 14px/1.4 var(--font-body, inherit);
    color: rgba(255,255,255,0.5);
    cursor: pointer;
    text-align: left;
    transition: background 0.12s, color 0.12s;
  }
  .sidebar-signout:hover {
    color: #FFFFFF;
    background: rgba(255,255,255,0.08);
  }

  /* ── Main area ── */
  .main-area {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  .main-content {
    flex: 1;
    padding: 32px 40px 64px;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  /* ── Mobile topbar ── */
  .mobile-topbar {
    display: none;
    align-items: center;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 3px solid var(--c-primary, #3A2616);
    background: var(--c-canvas, #FFF2D9);
    position: sticky;
    top: 0;
    z-index: 50;
  }
  .mobile-topbar .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    font-weight: 700;
    font-size: 15px;
    color: var(--c-ink, #3A2616);
  }
  .mobile-menu-btn {
    background: none;
    border: 2px solid var(--c-primary, #3A2616);
    padding: 6px;
    cursor: pointer;
    color: var(--c-ink, #3A2616);
    display: flex;
    align-items: center;
  }

  .sidebar-scrim {
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(58,38,22,0.4);
  }

  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: -240px;
      top: 0;
      height: 100vh;
      transition: left 0.22s ease;
      z-index: 100;
    }
    .sidebar.open { left: 0; }
    .mobile-topbar { display: flex; }
    .main-content { padding: 24px 20px 48px; }
  }
</style>
