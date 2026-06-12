<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';

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
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
  $: paginatedRows = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

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

<svelte:head>
  <title>Dashboard Chronicles · QuestPage Admin</title>
</svelte:head>

<div class="stack">
  <h2 style="margin:0">Dashboard Chronicles</h2>

  <div class="h-row">
    <input bind:value={entityFilter} placeholder="Filter quest board (e.g. tavern-quests)" style="flex:1" />
    <input bind:value={actionFilter} placeholder="Filter adventure action (create/update/delete)" style="flex:1" />
    <button class="btn" on:click={load}>Apply</button>
  </div>

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if rows.length === 0}
    <div class="card" style="text-align:center; padding:40px; color:var(--c-muted)">
      No chronicle entries match your filter.
    </div>
  {:else}
    <table class="t">
      <thead>
        <tr><th>When</th><th>User</th><th>Action</th><th>Entity</th><th>ID</th><th>IP</th><th></th></tr>
      </thead>
      <tbody>
        {#each paginatedRows as r (r.id)}
          <tr>
            <td>{new Date(r.createdAt).toLocaleString()}</td>
            <td>{r.userId ?? 'system'}</td>
            <td>
              <span class="chip" data-action={r.action}>{r.action}</span>
            </td>
            <td><code>{r.entity}</code></td>
            <td>{r.entityId ?? '—'}</td>
            <td style="font-size:11px; color:var(--c-muted)">{r.ip ?? ''}</td>
            <td>
              {#if r.diff}
                <button class="link" on:click={() => (expanded = expanded === r.id ? null : r.id)}>{expanded === r.id ? 'Hide' : 'Diff'}</button>
              {/if}
            </td>
          </tr>
          {#if expanded === r.id}
            <tr>
              <td colspan="7" style="padding: 8px 12px; background: var(--c-surface-card)">
                <pre style="font-size: 11px; margin: 0; white-space: pre-wrap; word-break: break-word">{JSON.stringify(r.diff, null, 2)}</pre>
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
    <Pagination bind:currentPage {totalPages} />
  {/if}
</div>

<style>
  .chip { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; background: var(--surface-alt, #f5f5f5); }
  .chip[data-action="create"] { background: rgba(16,185,129,0.12); color: #047857; }
  .chip[data-action="update"] { background: rgba(59,130,246,0.12); color: #1d4ed8; }
  .chip[data-action="delete"] { background: rgba(220,38,38,0.12); color: #b91c1c; }
  .link { background: transparent; border: none; color: var(--c-ink); font-size: 12px; cursor: pointer; }
  .link:hover { text-decoration: underline; }
</style>
