<script lang="ts">
  export let params: any = undefined;
  import { onMount } from 'svelte';

  interface ContentTypeField {
    name: string;
    type: string;
    required?: boolean;
  }

  interface ContentType {
    id: number;
    slug: string;
    name: string;
    schema: {
      fields: ContentTypeField[];
    };
  }

  let collections: ContentType[] = [];
  let searchQuery = '';
  let loading = true;
  let errorMsg = '';

  async function loadCollections() {
    try {
      loading = true;
      const res = await fetch('/api/v1/content-types');
      if (res.ok) {
        const json = await res.json();
        collections = json.data ?? [];
      } else {
        errorMsg = 'Failed to load collections. Please make sure you are logged in.';
      }
    } catch (e) {
      errorMsg = 'An error occurred while fetching collections.';
      console.error(e);
    } finally {
      loading = false;
    }
  }

  onMount(loadCollections);

  $: filteredCollections = collections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );
</script>

<div class="collections-container">
  <div class="header-section">
    <div class="breadcrumbs">
      <a href="/">Dashboard</a>
      <span class="separator">/</span>
      <span class="current">Collections</span>
    </div>
    <h1>Collections</h1>
    <p class="subtitle">Explore, browse, and manage your structured workspace databases.</p>
  </div>

  <div class="controls-section">
    <div class="search-wrapper">
      <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      <input
        type="text"
        placeholder="Search collections..."
        bind:value={searchQuery}
        class="search-input"
      />
      {#if searchQuery}
        <button class="clear-search" on:click={() => searchQuery = ''}>Clear</button>
      {/if}
    </div>
    
    <div class="admin-banner">
      <span>Need new structures?</span>
      <a href="http://localhost:5175" class="admin-link" target="_blank" rel="noopener noreferrer">
        Open Admin Console
        <svg class="external-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
          <polyline points="15 3 21 3 21 9"></polyline>
          <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
      </a>
    </div>
  </div>

  {#if loading}
    <div class="state-container">
      <div class="spinner"></div>
      <p>Loading your collections...</p>
    </div>
  {:else if errorMsg}
    <div class="state-container error-state">
      <div class="error-icon">!</div>
      <p>{errorMsg}</p>
      <button class="retry-btn" on:click={loadCollections}>Retry</button>
    </div>
  {:else if filteredCollections.length === 0}
    <div class="state-container empty-state">
      <h3>No Collections Found</h3>
      {#if searchQuery}
        <p>No collections match "{searchQuery}". Try a different search term.</p>
        <button class="clear-btn" on:click={() => searchQuery = ''}>Show All Collections</button>
      {:else}
        <p>Your workspace doesn't have any collections yet.</p>
        <a href="http://localhost:5175" class="create-btn" target="_blank">Define at Admin Console</a>
      {/if}
    </div>
  {:else}
    <div class="collections-grid">
      {#each filteredCollections as c (c.slug)}
        <a href={`/collections/${c.slug}`} class="collection-card">
          <div class="card-header">
            <div class="collection-meta">
              <span class="collection-slug">/{c.slug}</span>
            </div>
            <h2 class="collection-title">{c.name}</h2>
          </div>
          
          <div class="card-body">
            {#if c.schema?.fields && c.schema.fields.length > 0}
              <div class="fields-label">Schema Fields ({c.schema.fields.length})</div>
              <div class="fields-tags">
                {#each c.schema.fields as field}
                  <span class="field-tag" title={`${field.name} (${field.type})`}>
                    <span class="field-name">{field.name}</span>
                    <span class="field-type">{field.type}</span>
                  </span>
                {/each}
              </div>
            {:else}
              <p class="no-fields">No fields defined in this schema.</p>
            {/if}
          </div>

          <div class="card-footer">
            <span class="explore-link">
              Explore Collection
              <svg class="arrow-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .collections-container {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* Breadcrumbs */
  .breadcrumbs {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    margin-bottom: 12px;
  }
  .breadcrumbs a {
    color: var(--c-muted);
    text-decoration: none;
    transition: color 0.2s;
  }
  .breadcrumbs a:hover {
    color: var(--c-ink);
  }
  .breadcrumbs .separator {
    color: var(--c-hairline);
  }
  .breadcrumbs .current {
    color: var(--c-ink);
    font-weight: 500;
  }

  /* Headers */
  h1 {
    font-size: 32px;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: -0.04em;
    color: var(--c-ink);
  }
  .subtitle {
    font-size: 15px;
    color: var(--c-muted);
    margin: 0;
    max-width: 600px;
  }

  /* Controls Section */
  .controls-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--c-hairline);
    padding-bottom: 24px;
  }

  /* Search */
  .search-wrapper {
    position: relative;
    flex: 1;
    min-width: 280px;
    max-width: 480px;
  }
  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    color: var(--c-muted);
    pointer-events: none;
  }
  .search-input {
    width: 100%;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: 8px;
    padding: 10px 14px 10px 40px;
    font-family: inherit;
    font-size: 14px;
    color: var(--c-ink);
    outline: none;
    transition: all 0.2s;
  }
  .search-input:focus {
    border-color: var(--c-ink);
  }
  .clear-search {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--c-muted);
    font-size: 12px;
    cursor: pointer;
    font-weight: 500;
  }
  .clear-search:hover {
    color: var(--c-ink);
  }

  /* Admin Banner */
  .admin-banner {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--c-muted);
    background: var(--c-surface-card);
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--c-hairline);
  }
  .admin-link {
    color: var(--c-ink);
    font-weight: 600;
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;
    transition: color 0.2s;
  }
  .admin-link:hover {
    color: var(--c-brand-accent);
  }
  .external-icon {
    width: 12px;
    height: 12px;
  }

  /* Grid Layout */
  .collections-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 24px;
  }

  /* Card */
  .collection-card {
    background: transparent;
    border: none;
    border-top: 3px solid var(--c-primary);
    border-radius: 0px;
    padding: 24px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-decoration: none;
    color: inherit;
    min-height: 220px;
  }
  .collection-card:hover {
    border-top-color: var(--c-brand-accent);
  }

  .collection-meta {
    margin-bottom: 8px;
  }
  .collection-slug {
    font-family: monospace;
    font-size: 12px;
    color: var(--c-muted);
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 600;
  }
  .collection-title {
    font-size: 20px;
    font-weight: 600;
    margin: 0;
    color: var(--c-ink);
    letter-spacing: -0.03em;
  }

  .card-body {
    margin-top: 16px;
    flex-grow: 1;
  }
  .fields-label {
    font-size: 11px;
    text-transform: uppercase;
    color: var(--c-muted);
    font-weight: 600;
    letter-spacing: 0.05em;
    margin-bottom: 10px;
  }
  .fields-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .field-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: 9999px;
    padding: 4px 10px;
    font-size: 11px;
  }
  .field-name {
    color: var(--c-ink);
    font-weight: 500;
  }
  .field-type {
    color: var(--c-muted);
    font-size: 10px;
    border-left: 1px solid var(--c-hairline);
    padding-left: 6px;
  }
  .no-fields {
    font-size: 13px;
    color: var(--c-muted-soft);
    margin: 0;
    font-style: italic;
  }

  .card-footer {
    margin-top: 24px;
    border-top: 1px solid var(--c-hairline);
    padding-top: 16px;
  }
  .explore-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--c-ink);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: gap 0.2s;
  }
  .collection-card:hover .explore-link {
    gap: 10px;
  }
  .arrow-icon {
    width: 14px;
    height: 14px;
  }

  /* States */
  .state-container {
    padding: 80px 20px;
    text-align: center;
    background: var(--c-surface-card);
    border: 1px solid var(--c-hairline);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .state-container p {
    color: var(--c-muted);
    margin: 0;
    font-size: 14px;
  }

  /* Spinner */
  .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--c-primary);
    border-top-color: var(--c-brand-accent);
    border-radius: 0px;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Error state */
  .error-state p {
    color: var(--c-brand-accent);
    font-weight: 600;
  }
  .error-icon {
    width: 32px;
    height: 32px;
    border-radius: 0px;
    background: var(--c-surface-card);
    border: 2px solid var(--c-primary);
    color: var(--c-ink);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
  }
  .retry-btn, .clear-btn, .create-btn {
    background: var(--c-primary);
    color: var(--c-canvas);
    border: none;
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s;
  }
  .retry-btn:hover, .clear-btn:hover, .create-btn:hover {
    background: var(--c-primary-active);
  }

  /* Empty state */
  .empty-state h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--c-ink);
  }
</style>
