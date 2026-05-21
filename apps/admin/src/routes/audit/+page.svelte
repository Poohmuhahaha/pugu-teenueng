<script lang="ts">
  import { onMount } from 'svelte';

  interface AuditRow {
    id: number;
    userId: number | null;
    action: string;
    entity: string;
    entityId: number | null;
    diff: unknown;
    ip: string | null;
    ua: string | null;
    createdAt: string;
  }

  let rows: AuditRow[] = [];
  let loading = true;
  let entityFilter = '';
  let actionFilter = '';
  let expanded: number | null = null;

  async function load() {
    loading = true;
    const sp = new URLSearchParams();
    if (entityFilter) sp.set('entity', entityFilter);
    if (actionFilter) sp.set('action', actionFilter);
    const res = await fetch('/api/v1/audit-log?' + sp.toString());
    if (res.ok) rows = (await res.json()).data;
    loading = false;
  }

  onMount(load);
</script>

<div class="stack">
  <h2 style="margin:0">Audit Log</h2>

  <div class="h-row">
    <input bind:value={entityFilter} placeholder="Filter entity (e.g. personal-crm)" style="flex:1" />
    <input bind:value={actionFilter} placeholder="Filter action (create/update/delete)" style="flex:1" />
    <button class="btn" on:click={load}>Apply</button>
  </div>

  {#if loading}
    <p style="color:var(--muted)">Loading…</p>
  {:else if rows.length === 0}
    <div class="card" style="text-align:center; padding:40px; color:var(--muted)">
      No audit entries match your filter.
    </div>
  {:else}
    <table class="t">
      <thead>
        <tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>IP</th><th></th></tr>
      </thead>
      <tbody>
        {#each rows as r (r.id)}
          <tr>
            <td>{new Date(r.createdAt).toLocaleString()}</td>
            <td>{r.userId ?? 'system'}</td>
            <td>
              <span class="chip" data-action={r.action}>{r.action}</span>
            </td>
            <td><code>{r.entity}</code></td>
            <td>{r.entityId ?? '—'}</td>
            <td style="font-size:11px; color:var(--muted)">{r.ip ?? ''}</td>
            <td>
              {#if r.diff}
                <button class="link" on:click={() => (expanded = expanded === r.id ? null : r.id)}>{expanded === r.id ? 'Hide' : 'Diff'}</button>
              {/if}
            </td>
          </tr>
          {#if expanded === r.id}
            <tr>
              <td colspan="7" style="padding: 8px 12px; background: var(--surface)">
                <pre style="font-size: 11px; margin: 0; white-space: pre-wrap; word-break: break-word">{JSON.stringify(r.diff, null, 2)}</pre>
              </td>
            </tr>
          {/if}
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
  .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--surface-alt, #f5f5f5); }
  .chip[data-action="create"] { background: rgba(16,185,129,0.12); color: #047857; }
  .chip[data-action="update"] { background: rgba(59,130,246,0.12); color: #1d4ed8; }
  .chip[data-action="delete"] { background: rgba(220,38,38,0.12); color: #b91c1c; }
  .link { background: transparent; border: none; color: var(--accent); font-size: 12px; cursor: pointer; }
  .link:hover { text-decoration: underline; }
</style>
