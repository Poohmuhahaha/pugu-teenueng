<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  interface ApiKey {
    id: number;
    name: string;
    prefix: string;
    role: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    revokedAt: string | null;
    secret: string | null;
  }

  let keys: ApiKey[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(keys.length / itemsPerPage) || 1;
  $: paginatedKeys = keys.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let loading = true;
  let creating = false;
  let newName = '';
  let newRole: 'viewer' | 'editor' | 'admin' = 'viewer';
  let expirationPreset = 'never';
  let customExpiryDate = '';
  let issuedSecret = '';
  let err = '';

  let copiedPrefixId: number | null = null;

  async function loadKeys() {
    loading = true;
    const res = await fetch('/api/v1/api-keys');
    if (res.ok) keys = (await res.json()).data;
    loading = false;
  }

  async function submit() {
    err = '';
    issuedSecret = '';

    let expiresAt: string | null = null;
    if (expirationPreset !== 'never') {
      if (expirationPreset === 'custom') {
        if (!customExpiryDate) {
          err = 'Please select a custom expiry date.';
          return;
        }
        expiresAt = new Date(customExpiryDate).toISOString();
      } else {
        const days = parseInt(expirationPreset, 10);
        const d = new Date();
        d.setDate(d.getDate() + days);
        expiresAt = d.toISOString();
      }
    }

    const res = await fetch('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, role: newRole, expiresAt }),
    });
    if (!res.ok) { err = await res.text(); return; }
    const body = await res.json();
    issuedSecret = body.key; // returned once
    newName = '';
    creating = false; // close the creation modal
    expirationPreset = 'never';
    customExpiryDate = '';
    await loadKeys();
  }

  let revokingKey: ApiKey | null = null;

  function revoke(key: ApiKey) {
    err = '';
    revokingKey = key;
  }

  async function confirmRevoke() {
    if (!revokingKey) return;
    const res = await fetch(`/api/v1/api-keys/${revokingKey.id}`, { method: 'DELETE' });
    if (res.ok) {
      revokingKey = null;
      await loadKeys();
    } else {
      err = await res.text();
    }
  }

  let deletingKey: ApiKey | null = null;

  function deleteKey(key: ApiKey) {
    err = '';
    deletingKey = key;
  }

  async function confirmDelete() {
    if (!deletingKey) return;
    const res = await fetch(`/api/v1/api-keys/${deletingKey.id}`, { method: 'DELETE' });
    if (res.ok) {
      deletingKey = null;
      await loadKeys();
    } else {
      err = await res.text();
    }
  }

  function copyToClipboard(text: string) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {
        fallbackCopyText(text);
      });
    } else {
      fallbackCopyText(text);
    }
  }

  function fallbackCopyText(text: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
    } catch (e) {
      console.error(e);
    }
    document.body.removeChild(textArea);
  }

  let copiedSecret = false;
  function copySecret() {
    copyToClipboard(issuedSecret);
    copiedSecret = true;
    setTimeout(() => {
      copiedSecret = false;
    }, 1500);
  }

  function copyKey(key: ApiKey) {
    const fullKey = key.secret ? `${key.prefix}.${key.secret}` : key.prefix;
    copyToClipboard(fullKey);
    copiedPrefixId = key.id;
    setTimeout(() => {
      if (copiedPrefixId === key.id) copiedPrefixId = null;
    }, 1500);
  }

  function formatExpiry(dateStr: string | null): string {
    if (!dateStr) return 'Never';
    const d = new Date(dateStr);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function getStatus(k: ApiKey): { label: string; color: string } {
    if (k.revokedAt) return { label: 'revoked', color: 'var(--c-muted)' };
    if (k.expiresAt && new Date(k.expiresAt) < new Date()) return { label: 'expired', color: '#ef4444' };
    return { label: 'active', color: '#10b981' };
  }

  onMount(loadKeys);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">API Keys</h2>
    <button class="btn" on:click={() => (creating = true)}>+ New Key</button>
  </div>
  <p style="color:var(--c-muted); font-size:13.5px; margin:4px 0 16px">
    Issue secure authentication tokens to safely query and modify your workspace databases from external scripts, CLI clients, desktop extensions, or workflow automations.
  </p>

  {#if creating}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (creating = false)}>
      <div class="modal-card" on:click|stopPropagation>
        <div class="modal-header">
          <h3 style="margin:0; font-family: var(--font-display, inherit);">Create API Key</h3>
          <button class="modal-close-btn" on:click={() => (creating = false)}>×</button>
        </div>
        <form class="modal-body stack" on:submit|preventDefault={submit}>
          <div>
            <div class="label">Name</div>
            <input bind:value={newName} placeholder="My laptop · Zapier integration · …" required style="width:100%" />
          </div>
          <div>
            <div class="label">Role</div>
            <select bind:value={newRole} style="width:100%">
              <option value="viewer">viewer (read-only)</option>
              <option value="editor">editor (read + write)</option>
              <option value="admin">admin (full CRUD + admin endpoints)</option>
            </select>
          </div>
          <div>
            <div class="label">Expiration</div>
            <select bind:value={expirationPreset} style="width:100%">
              <option value="never">Never expire</option>
              <option value="7">7 days</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="custom">Custom date...</option>
            </select>
          </div>
          {#if expirationPreset === 'custom'}
            <div>
              <div class="label">Expiry Date & Time</div>
              <input type="datetime-local" bind:value={customExpiryDate} required style="width:100%" />
            </div>
          {/if}
          {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" on:click={() => (creating = false)}>Cancel</button>
            <button type="submit" class="btn">Issue Key</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if issuedSecret}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (issuedSecret = '')}>
      <div class="modal-card" style="border-color: var(--c-primary);" on:click|stopPropagation>
        <div class="modal-header">
          <h3 style="margin: 0; color: var(--c-ink); font-family: var(--font-display, inherit);">API Key Created</h3>
          <button class="modal-close-btn" on:click={() => (issuedSecret = '')}>×</button>
        </div>
        <div class="modal-body stack">
          <div class="warning-banner">
            <div style="font-weight: 700; color: #b45309;">⚠ Save this key now!</div>
            <div style="color: #d97706; font-size: 12.5px;">It will not be shown again for security reasons.</div>
          </div>
          <div style="position: relative; margin-top: 12px; display: flex; align-items: center; gap: 8px;">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <code 
              style="flex:1; word-break:break-all; padding:12px 48px 12px 12px; background:var(--c-canvas); border: 2px solid var(--c-primary); border-radius:4px; font-size:12px; cursor: pointer;"
              on:click={copySecret}
              title="Click to copy full key"
            >
              {issuedSecret}
            </code>
            <button class="copy-btn" on:click={copySecret} title="Copy to clipboard">
              {#if copiedSecret}
                <span style="font-size: 10px; color: #10b981; font-weight: bold; padding: 0 4px;">Copied!</span>
              {:else}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
              {/if}
            </button>
          </div>
          <div class="modal-actions">
            <button type="button" class="btn" on:click={() => (issuedSecret = '')}>Done</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if revokingKey}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (revokingKey = null)}>
      <div class="modal-card" style="border-color: #ef4444; box-shadow: 6px 6px 0 #ef4444;" on:click|stopPropagation>
        <div class="modal-header" style="background: rgba(239, 68, 68, 0.08); border-bottom-color: #ef4444;">
          <h3 style="margin: 0; color: #ef4444; font-family: var(--font-display, inherit);">Revoke API Key</h3>
          <button class="modal-close-btn" on:click={() => (revokingKey = null)}>×</button>
        </div>
        <div class="modal-body stack">
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--c-ink);">
            Are you sure you want to revoke the API key <strong>"{revokingKey.name}"</strong>?
          </p>
          <p style="margin: 12px 0 0; font-size: 13px; color: #ef4444; font-weight: 500;">
            ⚠️ Any application or client integration using this key will lose access immediately. This action cannot be undone.
          </p>
          {#if err}<p style="color:#dc2626; font-size:13px; margin:8px 0 0">{err}</p>{/if}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" on:click={() => (revokingKey = null)}>Cancel</button>
            <button type="button" class="btn" style="background: #ef4444; color: white; border-color: #ef4444; box-shadow: 2px 2px 0 #991b1b;" on:click={confirmRevoke}>
              Yes, Revoke Key
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if deletingKey}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (deletingKey = null)}>
      <div class="modal-card" style="border-color: #ef4444; box-shadow: 6px 6px 0 #ef4444;" on:click|stopPropagation>
        <div class="modal-header" style="background: rgba(239, 68, 68, 0.08); border-bottom-color: #ef4444;">
          <h3 style="margin: 0; color: #ef4444; font-family: var(--font-display, inherit);">Delete API Key</h3>
          <button class="modal-close-btn" on:click={() => (deletingKey = null)}>×</button>
        </div>
        <div class="modal-body stack">
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: var(--c-ink);">
            Are you sure you want to permanently delete the API key <strong>"{deletingKey.name}"</strong>?
          </p>
          <p style="margin: 12px 0 0; font-size: 13px; color: #ef4444; font-weight: 500;">
            ⚠️ This will permanently remove the record from your dashboard. This action cannot be undone.
          </p>
          {#if err}<p style="color:#dc2626; font-size:13px; margin:8px 0 0">{err}</p>{/if}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" on:click={() => (deletingKey = null)}>Cancel</button>
            <button type="button" class="btn" style="background: #ef4444; color: white; border-color: #ef4444; box-shadow: 2px 2px 0 #991b1b;" on:click={confirmDelete}>
              Yes, Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if keys.length === 0}
    <div class="card" style="text-align:center; padding:48px 20px; color:var(--c-muted)">
      No API keys issued yet. Use one to access the REST API from outside this dashboard.
    </div>
  {:else}
    <table class="t">
      <thead>
        <tr><th>Name</th><th>API Key</th><th>Role</th><th>Last used</th><th>Expires</th><th>Created</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        {#each paginatedKeys as k (k.id)}
          {@const status = getStatus(k)}
          {@const isInactive = k.revokedAt || (k.expiresAt && new Date(k.expiresAt) < new Date())}
          <tr style:opacity={isInactive ? 0.5 : 1}>
            <td>{k.name}</td>
            <td>
              <div style="display: flex; align-items: center; gap: 6px;">
                <code style="width: 135px; display: inline-block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">{k.prefix}.…</code>
                <button class="icon-copy-btn" on:click={() => copyKey(k)} title="Copy API Key">
                  {#if copiedPrefixId === k.id}
                    <span style="font-size: 10px; color: #10b981; font-weight: bold;">Copied!</span>
                  {:else}
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {/if}
                </button>
              </div>
            </td>
            <td>{k.role}</td>
            <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}</td>
            <td>{formatExpiry(k.expiresAt)}</td>
            <td>{new Date(k.createdAt).toLocaleDateString()}</td>
            <td style:color={status.color} style="font-weight: 600;">{status.label}</td>
            <td>
              {#if !k.revokedAt}
                <button class="link danger" on:click={() => revoke(k)}>Revoke</button>
              {:else}
                <button class="link danger" on:click={() => deleteKey(k)}>Delete</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>

    <Pagination bind:currentPage {totalPages} />
  {/if}
</div>

<style>
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--c-ink); }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }

  .icon-copy-btn {
    background: transparent;
    border: none;
    padding: 2px;
    cursor: pointer;
    color: var(--c-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .icon-copy-btn:hover {
    color: var(--c-ink);
  }

  /* ── Modal overlay styles ── */
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
  .warning-banner {
    background: rgba(245, 158, 11, 0.1);
    border: 2px dashed #f59e0b;
    padding: 12px;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
  .copy-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--c-canvas);
    border: 2px solid var(--c-primary);
    border-radius: 4px;
    padding: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 1px 1px 0 var(--c-primary);
    color: var(--c-ink);
  }
  .copy-btn:hover {
    background: var(--c-surface-soft);
  }
  .copy-btn:active {
    box-shadow: 0 0 0 var(--c-primary);
    transform: translateY(-50%) translate(1px, 1px);
  }
</style>
