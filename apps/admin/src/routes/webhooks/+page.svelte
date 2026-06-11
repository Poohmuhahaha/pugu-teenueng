<script lang="ts">
  import { onMount } from 'svelte';

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
  let loading = true;
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

  async function deleteHook(hook: Webhook) {
    if (!confirm(`Delete webhook for ${hook.url}? This will not undelete its failure history.`)) return;
    const res = await fetch(`/api/v1/webhooks/${hook.id}`, { method: 'DELETE' });
    if (res.ok) await loadHooks();
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
    <form class="card stack" on:submit|preventDefault={submit}>
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
      <button type="submit" class="btn">Register Webhook</button>
    </form>
  {/if}

  {#if issuedSecret}
    <div class="card" style="border-color:var(--c-ink); background:rgba(124,58,237,0.06)">
      <div class="label" style="color:var(--c-ink)">⚠ Signing secret — save it now to verify incoming signatures</div>
      <code style="display:block; word-break:break-all; padding:12px; background:var(--c-canvas); border-radius:8px; margin-top:8px; font-size:12px">{issuedSecret}</code>
      <div style="font-size:11px; color:var(--c-muted); margin-top:8px">Verify webhook deliveries with: HMAC-SHA256(rawBody, secret) === X-QuestPage-Signature header (after the "sha256=" prefix).</div>
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
        {#each hooks as h (h.id)}
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
  {/if}
</div>

<style>
  .t { width:100%; border-collapse: collapse; background: var(--c-surface-card); border:1px solid var(--c-hairline); border-radius:10px; overflow:hidden; }
  .t th { text-align:left; font-size:11px; text-transform:uppercase; color:var(--c-muted); padding:10px 12px; background:var(--c-surface-card); border-bottom:1px solid var(--c-hairline); }
  .t td { padding:10px 12px; font-size:13px; border-bottom:1px solid var(--c-hairline); }
  .t tr:last-child td { border-bottom:none; }
  .t code { font-size:11px; }
  .link { background: transparent; border: none; color: var(--c-ink); font-size: 12px; cursor: pointer; padding: 2px 6px; margin-right: 4px; }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }
  .t-inner { width: 100%; border-collapse: collapse; font-size: 12px; }
  .t-inner th { text-align: left; padding: 6px 8px; color: var(--c-muted); font-size: 10px; text-transform: uppercase; border-bottom: 1px solid var(--c-hairline); }
  .t-inner td { padding: 6px 8px; border-bottom: 1px solid var(--c-hairline); }
</style>
