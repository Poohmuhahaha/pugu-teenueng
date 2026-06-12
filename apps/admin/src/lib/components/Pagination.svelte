<script lang="ts">
  export let currentPage: number;
  export let totalPages: number;

  function prev() {
    if (currentPage > 1) currentPage -= 1;
  }

  function next() {
    if (currentPage < totalPages) currentPage += 1;
  }
</script>

{#if totalPages > 1}
  <div class="pagination">
    <span class="page-info">Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
    <div class="pagination-controls">
      <button class="btn-pagination" disabled={currentPage === 1} on:click={prev}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;"><polyline points="15 18 9 12 15 6"></polyline></svg>
        Prev
      </button>
      <button class="btn-pagination" disabled={currentPage === totalPages} on:click={next}>
        Next
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 4px;"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>
  </div>
{/if}

<style>
  .pagination {
    position: sticky;
    bottom: 0;
    z-index: 10;
    background: var(--c-canvas);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 24px;
    padding: 16px 0;
    border-top: 3px dashed var(--c-surface-strong);
  }
  .pagination-controls {
    display: flex;
    gap: 12px;
  }
  .page-info {
    font-size: 14px;
    color: var(--c-muted);
  }
  .page-info strong {
    color: var(--c-ink);
  }
  .btn-pagination {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    padding: 0 16px;
    background: var(--c-surface-soft);
    border: 3px solid var(--c-primary);
    color: var(--c-ink);
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--c-primary);
    transition: transform 0.05s, box-shadow 0.05s, background 0.1s;
  }
  .btn-pagination:hover:not(:disabled) {
    background: var(--c-canvas);
  }
  .btn-pagination:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--c-primary);
  }
  .btn-pagination:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
    border-color: var(--c-muted);
  }
</style>
