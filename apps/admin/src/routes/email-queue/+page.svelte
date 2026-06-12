<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';

  interface Job {
    id: number;
    recipient: string;
    subject: string;
    attempts: number;
    nextRunAt: string;
    lastError: string | null;
    sentAt: string | null;
    abandonedAt: string | null;
    createdAt: string;
  }

  let jobs: Job[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(jobs.length / itemsPerPage) || 1;
  $: paginatedJobs = jobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let loading = true;
  let filter: 'all' | 'pending' | 'sent' | 'abandoned' = 'all';
  let err = '';

  async function load() {
    loading = true;
    err = '';
    const sp = filter === 'all' ? '' : `?status=${filter}`;
    const res = await fetch(`/api/v1/email-queue${sp}`);
    if (res.ok) jobs = (await res.json()).data;
    else err = await res.text();
    loading = false;
  }

  async function retry(j: Job) {
    const res = await fetch(`/api/v1/email-queue/${j.id}/retry`, { method: 'POST' });
    if (res.ok) await load();
    else err = await res.text();
  }

  function statusOf(j: Job): { label: string; color: string } {
    if (j.sentAt) return { label: 'sent', color: '#10b981' };
    if (j.abandonedAt) return { label: 'abandoned', color: '#dc2626' };
    if (j.attempts > 0) return { label: 'retrying', color: '#f59e0b' };
    return { label: 'pending', color: 'var(--c-muted)' };
  }

  $: filter, load();

  const filterOptions: (typeof filter)[] = ['all', 'pending', 'sent', 'abandoned'];
</script>

<div class="stack">
  <div style="display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px;">
    <div>
      <h2 style="margin:0; margin-bottom: 12px;">Email Queue</h2>
      <div class="h-row" style="gap:8px; flex-wrap:wrap">
        {#each filterOptions as f}
          <button class="chip" class:active={filter === f} on:click={() => (filter = f)}>{f}</button>
        {/each}
      </div>
    </div>
  </div>

  {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if jobs.length === 0}
    <div class="card" style="text-align:center; padding:48px 20px; color:var(--c-muted)">
      No email jobs match filter "{filter}".
    </div>
  {:else}
    <table class="t">
      <thead>
        <tr><th>Recipient</th><th>Subject</th><th>Attempts</th><th>Next / Sent at</th><th>Status</th><th>Last error</th><th></th></tr>
      </thead>
      <tbody>
        {#each paginatedJobs as j (j.id)}
          {@const s = statusOf(j)}
          <tr style:opacity={s.label === 'sent' || s.label === 'abandoned' ? 0.6 : 1}>
            <td>{j.recipient}</td>
            <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight: 500;">{j.subject}</td>
            <td><span style="font-variant-numeric: tabular-nums;">{j.attempts} / 5</span></td>
            <td style="font-variant-numeric: tabular-nums;">{j.sentAt ? new Date(j.sentAt).toLocaleString() : new Date(j.nextRunAt).toLocaleString()}</td>
            <td><span class="status-badge" style="color:{s.color}; border-color:{s.color};">{s.label}</span></td>
            <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:12px; color:var(--c-error)" title={j.lastError ?? ''}>{j.lastError ?? '—'}</td>
            <td style="text-align: right;">
              {#if !j.sentAt}
                <button class="link" on:click={() => retry(j)}>Retry</button>
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
  .chip { padding: 4px 14px; background: transparent; border: 1px solid var(--c-hairline); border-radius: 999px; font-size: 13px; font-weight: 500; cursor: pointer; color: var(--c-muted); text-transform: capitalize; transition: all 0.15s; }
  .chip:hover { border-color: var(--c-primary); color: var(--c-ink); }
  .chip.active { background: var(--c-primary); color: var(--c-on-dark); border-color: var(--c-primary); box-shadow: 2px 2px 0 var(--c-brand-accent); }
  .status-badge { padding: 2px 8px; border: 1px solid; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
  .link { background: transparent; border: none; color: var(--c-ink); cursor: pointer; padding: 4px 8px; font-size: 13px; font-weight: 600; }
  .link:hover { text-decoration: underline; color: var(--c-primary); }
</style>
