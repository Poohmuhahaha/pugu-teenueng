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
    <div class="card" style="border-color:var(--accent); background:rgba(124,58,237,0.06)">
      <div class="label" style="color:var(--accent)">⚠ Save this key — it will not be shown again</div>
      <code style="display:block; word-break:break-all; padding:12px; background:var(--bg); border-radius:8px; margin-top:8px; font-size:12px">{issuedSecret}</code>
    </div>
  {/if}

  {#if loading}
    <p style="color:var(--muted)">Loading…</p>
  {:else if keys.length === 0}
    <div class="card" style="text-align:center; padding:48px 20px; color:var(--muted)">
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
            <td style:color={k.revokedAt ? 'var(--muted)' : '#10b981'}>{k.revokedAt ? 'revoked' : 'active'}</td>
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
  .t { width:100%; border-collapse: collapse; background: var(--surface); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .t th { text-align:left; font-size:11px; text-transform:uppercase; color:var(--muted); padding:10px 12px; background:var(--surface); border-bottom:1px solid var(--border); }
  .t td { padding:10px 12px; font-size:13px; border-bottom:1px solid var(--border); }
  .t tr:last-child td { border-bottom:none; }
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--accent); }
  .link:hover { text-decoration: underline; }
  .link.danger { color: #dc2626; }
</style>
