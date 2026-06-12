<script lang="ts">
  import { page } from '$app/stores';
</script>

<div class="settings-layout stack">
  <div class="h-row" style="align-items: flex-end; gap: 32px; border-bottom: 2px solid var(--c-hairline-soft); padding-bottom: 12px; margin-bottom: 20px;">
    <h1 style="margin: 0; font-family: var(--font-display, inherit); font-size: 28px; line-height: 1;">Settings</h1>
    <div class="tabs h-row" style="gap: 20px; transform: translateY(14px);">
      <a href="/settings/workspace" class="tab" class:active={$page.url.pathname.includes('/settings/workspace')}>Workspace</a>
      <a href="/settings/sessions" class="tab" class:active={$page.url.pathname.includes('/settings/sessions')}>Sessions</a>
    </div>
  </div>

  <div class="settings-content">
    <slot />
  </div>
</div>

<style>
  .tab {
    padding: 8px 0;
    color: var(--c-muted);
    text-decoration: none;
    font-weight: 600;
    font-size: 14px;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
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
