<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="settings-layout stack">
  <header class="hero-head" style="padding-bottom: 0;">
    <div class="hero-row" style="margin-bottom: var(--s-lg);">
      <div class="hero-text">
        <h1 class="hero-title">Settings</h1>
        <p class="hero-sub">Manage your workspace configuration and active sessions.</p>
      </div>
    </div>
    <div class="tabs h-row" style="gap: 24px;">
      <a href="/settings/workspace" class="tab" class:active={$page.url.pathname.includes('/settings/workspace')}>Workspace</a>
      <a href="/settings/usage" class="tab" class:active={$page.url.pathname.includes('/settings/usage')}>Usage</a>
      <a href="/settings/sessions" class="tab" class:active={$page.url.pathname.includes('/settings/sessions')}>Sessions</a>
    </div>
  </header>

  <div class="settings-content">
    <slot />
  </div>
</div>

<style>
  /* Base Hero */
  .hero-head {
    padding-bottom: var(--s-xl);
    margin-bottom: var(--s-xl);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .hero-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: var(--s-lg);
  }
  .hero-text { min-width: 0; flex: 1; }
  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 4.5vw, 44px);
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.08;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .hero-sub {
    font-size: 17px;
    color: var(--c-body);
    line-height: 1.55;
    margin: 0;
    max-width: 620px;
  }
  @media (max-width: 768px) {
    .hero-row { flex-direction: column; align-items: stretch; }
    .hero-title { font-size: 30px; letter-spacing: -0.7px; }
    .hero-sub { font-size: 15px; }
  }

  .tab {
    padding: 10px 0;
    color: var(--c-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    margin-bottom: -1px;
  }
  .tab:hover {
    color: var(--c-ink);
    text-decoration: none;
  }
  .tab.active {
    color: var(--c-ink);
    border-bottom-color: var(--c-primary);
  }
</style>
