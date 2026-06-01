<script lang="ts">
  import { onMount } from 'svelte';

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
  <h2 style="margin:0">Email queue</h2>

  <div class="h-row" style="gap:6px; flex-wrap:wrap">
    {#each filterOptions as f}
      <button class="chip" class:active={filter === f} on:click={() => (filter = f)}>{f}</button>
    {/each}
  </div>

  {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if jobs.length === 0}
    <p style="color:var(--c-muted)">No jobs match filter "{filter}".</p>
  {:else}
    <table class="t">
      <thead>
        <tr><th>Recipient</th><th>Subject</th><th>Attempts</th><th>Next / sent at</th><th>Status</th><th>Last error</th><th></th></tr>
      </thead>
      <tbody>
        {#each jobs as j (j.id)}
          {@const s = statusOf(j)}
          <tr>
            <td>{j.recipient}</td>
            <td style="max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{j.subject}</td>
            <td>{j.attempts} / 5</td>
            <td>{j.sentAt ? new Date(j.sentAt).toLocaleString() : new Date(j.nextRunAt).toLocaleString()}</td>
            <td><span style:color={s.color} style="font-weight:600; font-size:12px; text-transform:uppercase">{s.label}</span></td>
            <td style="max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:11px; color:var(--c-muted)" title={j.lastError ?? ''}>{j.lastError ?? ''}</td>
            <td>
              {#if !j.sentAt}
                <button class="link" on:click={() => retry(j)}>Retry</button>
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
  .chip { padding: 4px 12px; background: var(--c-surface-card); border: 1px solid var(--c-hairline); border-radius: 999px; font-size: 12px; cursor: pointer; color: var(--c-ink); text-transform: capitalize; }
  .chip.active { background: var(--c-ink); color: #fff; border-color: var(--c-ink); }
  .link { background: transparent; border: none; color: var(--c-ink); cursor: pointer; padding: 2px 6px; font-size: 12px; }
  .link:hover { text-decoration: underline; }
</style>
