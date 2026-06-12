<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  export let title: string;
  export let message: string;
  export let confirmText: string = 'Confirm';
  export let type: 'danger' | 'primary' = 'danger';
  export let isOpen = false;

  const dispatch = createEventDispatcher();

  function cancel() {
    isOpen = false;
    dispatch('cancel');
  }

  function confirm() {
    isOpen = false;
    dispatch('confirm');
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="modal-overlay" on:click={cancel}>
    <div 
      class="modal-card" 
      style="border-color: {type === 'danger' ? '#ef4444' : 'var(--c-primary)'}; box-shadow: 6px 6px 0 {type === 'danger' ? '#ef4444' : 'var(--c-primary)'};" 
      on:click|stopPropagation
    >
      <div 
        class="modal-header" 
        style="background: {type === 'danger' ? 'rgba(239, 68, 68, 0.08)' : 'var(--c-surface-soft)'}; border-bottom-color: {type === 'danger' ? '#ef4444' : 'var(--c-primary)'};"
      >
        <h3 style="margin: 0; color: {type === 'danger' ? '#ef4444' : 'var(--c-ink)'}; font-family: var(--font-display, inherit);">{title}</h3>
        <button class="modal-close-btn" on:click={cancel}>×</button>
      </div>
      <div class="modal-body stack">
        <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--c-ink);">
          {@html message}
        </p>
        <slot name="extra" />
        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" on:click={cancel}>Cancel</button>
          <button 
            type="button" 
            class="btn" 
            style={type === 'danger' ? 'background: #ef4444; color: white; border-color: #ef4444; box-shadow: 2px 2px 0 #991b1b;' : ''} 
            on:click={confirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(58, 38, 22, 0.4);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 15vh;
  }
  .modal-card {
    width: 90%;
    max-width: 500px;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    box-shadow: 6px 6px 0 var(--c-primary);
    display: flex;
    flex-direction: column;
  }
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 3px solid var(--c-primary);
    background: var(--c-surface-soft);
  }
  .modal-close-btn {
    background: transparent;
    border: none;
    font-size: 24px;
    cursor: pointer;
    line-height: 1;
    color: var(--c-muted);
    padding: 0;
  }
  .modal-close-btn:hover {
    color: var(--c-ink);
  }
  .modal-body {
    padding: 20px;
  }
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
  }
</style>
