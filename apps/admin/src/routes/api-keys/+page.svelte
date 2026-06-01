<script lang="ts">
  import { onMount } from 'svelte';

  interface ApiKey {
    id: number;
    name: string;
    prefix: string;
    role: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
    createdAt: string;
    revokedAt: string | null;
  }

  let keys: ApiKey[] = [];
  let loading = true;
  let creating = false;
  let newName = '';
  let newRole: 'viewer' | 'editor' | 'admin' = 'viewer';
  let issuedSecret = '';
  let err = '';

  async function loadKeys() {
    loading = true;
    const res = await fetch('/api/v1/api-keys');
    if (res.ok) keys = (await res.json()).data;
    loading = false;
  }

  async function submit() {
    err = '';
    issuedSecret = '';
    const res = await fetch('/api/v1/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, role: newRole }),
    });
    if (!res.ok) { err = await res.text(); return; }
    const body = await res.json();
    issuedSecret = body.key; // returned once
    newName = '';
    await loadKeys();
  }

  async function revoke(key: ApiKey) {
    if (!confirm(`Revoke "${key.name}"? Any client using this key will lose access immediately.`)) return;
    const res = await fetch(`/api/v1/api-keys/${key.id}`, { method: 'DELETE' });
    if (res.ok) await loadKeys();
    else err = await res.text();
  }

  onMount(loadKeys);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: space-between">
    <h2 style="margin:0">API Keys</h2>
    <button class="btn" on:click={() => (creating = !creating)}>{creating ? 'Cancel' : '+ New Key'}</button>
  </div>
  <p style="color:var(--c-muted); font-size:13.5px; margin:4px 0 16px">
    Issue secure authentication tokens to safely query and modify your workspace databases from external scripts, CLI clients, desktop extensions, or workflow automations.
  </p>

  {#if creating}
    <form class="card stack" on:submit|preventDefault={submit}>
      <div>
        <div class="label">Name</div>
        <input bind:value={newName} placeholder="My laptop · Zapier integration · …" required style="width:100%" />
      </div>
      <div>
        <div class="label">Role</div>
        <select bind:value={newRole}>
          <option value="viewer">viewer (read-only)</option>
          <option value="editor">editor (read + write)</option>
          <option value="admin">admin (full CRUD + admin endpoints)</option>
        </select>
      </div>
      {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
      <button type="submit" class="btn">Issue Key</button>
    </form>
  {/if}

  {#if issuedSecret}
    <div class="card" style="border-color:var(--c-ink); background:rgba(124,58,237,0.06)">
      <div class="label" style="color:var(--c-ink)">⚠ Save this key — it will not be shown again</div>
      <code style="display:block; word-break:break-all; padding:12px; background:var(--c-canvas); border-radius:8px; margin-top:8px; font-size:12px">{issuedSecret}</code>
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
        <tr><th>Name</th><th>Prefix</th><th>Role</th><th>Last used</th><th>Created</th><th>Status</th><th></th></tr>
      </thead>
      <tbody>
        {#each keys as k (k.id)}
          <tr style:opacity={k.revokedAt ? 0.5 : 1}>
            <td>{k.name}</td>
            <td><code>{k.prefix}.…</code></td>
            <td>{k.role}</td>
            <td>{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString() : '—'}</td>
            <td>{new Date(k.createdAt).toLocaleDateString()}</td>
            <td style:color={k.revokedAt ? 'var(--c-muted)' : '#10b981'}>{k.revokedAt ? 'revoked' : 'active'}</td>
            <td>
              {#if !k.revokedAt}
                <button class="link danger" on:click={() => revoke(k)}>Revoke</button>
              {/if}
            </td>
          </tr>
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
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--c-ink); }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }
</style>
