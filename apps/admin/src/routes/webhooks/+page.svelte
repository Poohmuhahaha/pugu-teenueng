<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  interface Webhook {
    id: number;
    url: string;
    contentTypeSlug: string | null;
    events: string[];
    disabledAt: string | null;
    createdAt: string;
    updatedAt: string;
  }

  let hooks: Webhook[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(hooks.length / itemsPerPage) || 1;
  $: paginatedHooks = hooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let loading = true;

  let deleteModalOpen = false;
  let hookToDelete: Webhook | null = null;
  let creating = false;
  let newUrl = '';
  let newSlug = '';
  let selectedEvents = { afterCreate: true, afterUpdate: true, afterDelete: true, beforeDelete: false };
  let issuedSecret = '';
  let err = '';

  let expandedFailures: number | null = null;
  let failures: Array<{ id: number; event: string; statusCode: number | null; errorMsg: string | null; attempts: number; createdAt: string; nextRetryAt: string | null }> = [];

  async function loadHooks() {
    loading = true;
    const res = await fetch('/api/v1/webhooks');
    if (res.ok) hooks = (await res.json()).data;
    loading = false;
  }

  async function toggleDisabled(hook: Webhook) {
    const res = await fetch(`/api/v1/webhooks/${hook.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ disabled: !hook.disabledAt }),
    });
    if (res.ok) await loadHooks();
  }

  function deleteHook(hook: Webhook) {
    hookToDelete = hook;
    deleteModalOpen = true;
  }

  async function confirmDeleteHook() {
    if (!hookToDelete) return;
    const res = await fetch(`/api/v1/webhooks/${hookToDelete.id}`, { method: 'DELETE' });
    if (res.ok) {
      deleteModalOpen = false;
      hookToDelete = null;
      await loadHooks();
    }
  }

  async function showFailures(hookId: number) {
    if (expandedFailures === hookId) { expandedFailures = null; failures = []; return; }
    expandedFailures = hookId;
    const res = await fetch(`/api/v1/webhooks/${hookId}/failures`);
    if (res.ok) failures = (await res.json()).data;
  }

  async function submit() {
    err = '';
    issuedSecret = '';
    const events = Object.entries(selectedEvents).filter(([, v]) => v).map(([k]) => k);
    if (events.length === 0) { err = 'Pick at least one event'; return; }
    const res = await fetch('/api/v1/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: newUrl, contentTypeSlug: newSlug || undefined, events }),
    });
    if (!res.ok) { err = await res.text(); return; }
    const body = await res.json();
    issuedSecret = body.secret;
    newUrl = ''; newSlug = '';
    creating = false;
    await loadHooks();
  }

  onMount(loadHooks);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">Webhooks</h2>
    <button class="btn" on:click={() => (creating = !creating)}>{creating ? 'Cancel' : '+ New Webhook'}</button>
  </div>
  <p style="color:var(--c-muted); font-size:13.5px; margin:4px 0 16px">
    Register HTTP POST endpoints to receive real-time JSON payloads whenever database entries are created, updated, or deleted. deliveries are HMAC-signed for security.
  </p>

  {#if creating}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (creating = false)}>
      <div class="modal-card" on:click|stopPropagation>
        <div class="modal-header">
          <h3 style="margin:0; font-family: var(--font-display, inherit);">Register Webhook</h3>
          <button class="modal-close-btn" on:click={() => (creating = false)}>×</button>
        </div>
        <form class="modal-body stack" on:submit|preventDefault={submit}>
          <div>
            <div class="label">URL</div>
            <input type="url" bind:value={newUrl} placeholder="https://hooks.zapier.com/…" required style="width:100%" />
          </div>
          <div>
            <div class="label">Content type (optional — empty = all types)</div>
            <input bind:value={newSlug} placeholder="personal-crm" style="width:100%" />
          </div>
          <div>
            <div class="label">Events</div>
            <div class="h-row" style="flex-wrap:wrap; gap:12px">
              {#each Object.keys(selectedEvents) as e}
                <label class="h-row" style="font-size:13px"><input type="checkbox" bind:checked={selectedEvents[e]} /> {e}</label>
              {/each}
            </div>
          </div>
          {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" on:click={() => (creating = false)}>Cancel</button>
            <button type="submit" class="btn">Register</button>
          </div>
        </form>
      </div>
    </div>
  {/if}

  {#if issuedSecret}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={() => (issuedSecret = '')}>
      <div class="modal-card" style="border-color: #8b5cf6; box-shadow: 6px 6px 0 #8b5cf6;" on:click|stopPropagation>
        <div class="modal-header" style="border-bottom-color: #8b5cf6;">
          <h3 style="margin: 0; color: var(--c-ink); font-family: var(--font-display, inherit);">Webhook Created</h3>
          <button class="modal-close-btn" on:click={() => (issuedSecret = '')}>×</button>
        </div>
        <div class="modal-body stack">
          <div class="warning-banner" style="border-color: #8b5cf6; background: rgba(139, 92, 246, 0.08);">
            <div style="font-weight: 700; color: #6d28d9;">⚠ Signing secret — save it now!</div>
            <div style="color: #7c3aed; font-size: 12.5px;">It will not be shown again for security reasons.</div>
          </div>
          <code style="display:block; word-break:break-all; padding:12px; background:var(--c-canvas); border: 2px solid #8b5cf6; border-radius:4px; margin-top:8px; font-size:12px">{issuedSecret}</code>
          <div style="font-size:11px; color:var(--c-muted); margin-top:4px">Verify webhook deliveries with: HMAC-SHA256(rawBody, secret) === X-QuestPage-Signature header.</div>
          <div class="modal-actions">
            <button type="button" class="btn" on:click={() => (issuedSecret = '')}>Done</button>
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if hooks.length === 0}
    <div class="card" style="text-align:center; padding:48px 20px; color:var(--c-muted)">
      No webhooks yet. Register one to receive HTTP POSTs on content-entry events.
    </div>
  {:else}
    <table class="t">
      <thead><tr><th>URL</th><th>Type</th><th>Events</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>
        {#each paginatedHooks as h (h.id)}
          <tr>
            <td><code>{h.url}</code></td>
            <td>{h.contentTypeSlug ?? '*'}</td>
            <td>{h.events.join(', ')}</td>
            <td style:color={h.disabledAt ? 'var(--c-muted)' : '#10b981'}>{h.disabledAt ? 'disabled' : 'active'}</td>
            <td>
              <button class="link" on:click={() => toggleDisabled(h)}>{h.disabledAt ? 'Enable' : 'Disable'}</button>
              <button class="link" on:click={() => showFailures(h.id)}>{expandedFailures === h.id ? 'Hide' : 'Failures'}</button>
              <button class="link danger" on:click={() => deleteHook(h)}>Delete</button>
            </td>
          </tr>
          {#if expandedFailures === h.id}
            <tr>
              <td colspan="5" style="padding: 12px; background: var(--c-surface-card)">
                {#if failures.length === 0}
                  <p style="color:var(--c-muted); font-size:13px; margin:0">No failures recorded. 🎉</p>
                {:else}
                  <table class="t-inner">
                    <thead><tr><th>When</th><th>Event</th><th>Status</th><th>Attempts</th><th>Next retry</th><th>Error</th></tr></thead>
                    <tbody>
                      {#each failures as f (f.id)}
                        <tr>
                          <td>{new Date(f.createdAt).toLocaleString()}</td>
                          <td>{f.event}</td>
                          <td>{f.statusCode ?? '—'}</td>
                          <td>{f.attempts} / 5</td>
                          <td>{f.nextRetryAt ? new Date(f.nextRetryAt).toLocaleString() : '—'}</td>
                          <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap" title={f.errorMsg ?? ''}>{f.errorMsg ?? ''}</td>
                        </tr>
                      {/each}
                    </tbody>
                  </table>
                {/if}
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
    <Pagination bind:currentPage {totalPages} />
  {/if}
</div>

<ConfirmModal 
  title="Delete Webhook" 
  message={hookToDelete ? `Delete webhook for <strong>${hookToDelete.url}</strong>? This will not undelete its failure history.` : ''}
  confirmText="Delete Webhook"
  bind:isOpen={deleteModalOpen}
  on:confirm={confirmDeleteHook}
  on:cancel={() => { hookToDelete = null; deleteModalOpen = false; }}
/>

<style>
  .link { background: transparent; border: none; color: var(--c-ink); font-size: 12px; cursor: pointer; padding: 2px 6px; margin-right: 4px; }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }
  .t-inner { width: 100%; border-collapse: collapse; font-size: 12px; }
  .t-inner th { text-align: left; padding: 6px 8px; color: var(--c-muted); font-size: 10px; text-transform: uppercase; border-bottom: 1px solid var(--c-hairline); }
  .t-inner td { padding: 6px 8px; border-bottom: 1px solid var(--c-hairline); }

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
    padding: 12px;
    border: 2px dashed #f59e0b;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-size: 13px;
  }
</style>
