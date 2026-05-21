<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  export let params: any = undefined;

  interface BillingSummary {
    subscription: { plan: string; status: string; currentPeriodEnd?: string };
    usage: { entries: number; members: number };
    limits: { entries: number; workspaceMembers: number; storageBytes: number };
  }

  let summary: BillingSummary | null = null;
  let loading = true;
  let upgrading = false;
  let err = '';
  let returnMsg = '';

  async function load() {
    loading = true;
    const res = await fetch('/api/v1/billing');
    if (res.ok) summary = await res.json();
    loading = false;
  }

  onMount(() => {
    const sp = $page.url.searchParams;
    if (sp.get('session_id')) {
      returnMsg = 'Checkout complete! It may take a few seconds for the plan to reflect — refresh if it doesn\'t update.';
      // Strip the query string so a refresh doesn't keep showing the banner
      const cleanUrl = window.location.pathname;
      history.replaceState({}, '', cleanUrl);
      // Re-poll the billing summary in a moment for the Stripe webhook to land
      setTimeout(load, 2000);
    } else if (sp.get('cancelled') === '1') {
      returnMsg = 'Checkout cancelled — no charge was made.';
      const cleanUrl = window.location.pathname;
      history.replaceState({}, '', cleanUrl);
    }
  });

  async function startCheckout(plan: 'personal' | 'studio') {
    upgrading = true;
    err = '';
    try {
      const res = await fetch('/api/v1/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      if (!res.ok) { err = await res.text(); return; }
      const body = await res.json();
      window.location.href = body.url;
    } finally {
      upgrading = false;
    }
  }

  async function manage() {
    upgrading = true;
    err = '';
    try {
      const res = await fetch('/api/v1/billing/portal', { method: 'POST' });
      if (!res.ok) { err = await res.text(); return; }
      const body = await res.json();
      window.location.href = body.url;
    } finally {
      upgrading = false;
    }
  }

  function fmtLimit(n: number): string { return n < 0 ? 'unlimited' : n.toLocaleString(); }
  function fmtBytes(n: number): string {
    if (n < 0) return 'unlimited';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let u = 0; let v = n;
    while (v > 1024 && u < units.length - 1) { v /= 1024; u++; }
    return `${v.toFixed(0)} ${units[u]}`;
  }

  onMount(load);
</script>

<div class="stack">
  <h2 style="margin:0">Billing</h2>

  {#if returnMsg}
    <div class="banner">{returnMsg}</div>
  {/if}

  {#if loading}
    <p style="color:var(--muted)">Loading…</p>
  {:else if summary}
    <div class="card stack">
      <div class="h-row" style="justify-content: space-between">
        <div>
          <div class="label">Current plan</div>
          <div style="font-size:24px; font-weight:700; margin-top:4px; text-transform:capitalize">{summary.subscription.plan}</div>
          <div style="font-size:12px; color:var(--muted); margin-top:4px">Status: {summary.subscription.status}</div>
        </div>
        {#if summary.subscription.plan === 'free'}
          <button class="btn" on:click={() => startCheckout('personal')} disabled={upgrading}>Upgrade to Personal Pro</button>
        {:else}
          <button class="btn btn-ghost" on:click={manage} disabled={upgrading}>Manage subscription</button>
        {/if}
      </div>

      <div class="usage">
        <div class="usage-row">
          <span>Entries</span>
          <span>{summary.usage.entries.toLocaleString()} / {fmtLimit(summary.limits.entries)}</span>
        </div>
        <div class="usage-row">
          <span>Members</span>
          <span>{summary.usage.members.toLocaleString()} / {fmtLimit(summary.limits.workspaceMembers)}</span>
        </div>
        <div class="usage-row">
          <span>Storage</span>
          <span>— / {fmtBytes(summary.limits.storageBytes)}</span>
        </div>
      </div>

      {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
    </div>

    {#if summary.subscription.plan === 'free'}
      <div class="card">
        <div class="label">Other plans</div>
        <div class="h-row" style="justify-content: space-between; margin-top:8px">
          <div>
            <div style="font-weight:600">Studio</div>
            <div style="font-size:12px; color:var(--muted)">10 users · 50 GB · SSO · audit log · ฿999/mo</div>
          </div>
          <button class="btn" on:click={() => startCheckout('studio')} disabled={upgrading}>Upgrade to Studio</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .usage { display: flex; flex-direction: column; gap: 6px; padding-top: 8px; border-top: 1px solid var(--border); }
  .usage-row { display: flex; justify-content: space-between; font-size: 13px; padding: 4px 0; }
  .usage-row span:first-child { color: var(--muted); }
  .usage-row span:last-child { font-variant-numeric: tabular-nums; }
  .banner { padding: 12px 16px; background: rgba(124,58,237,0.06); border: 1px solid var(--accent); border-radius: 10px; color: var(--accent); font-size: 13px; font-weight: 500; }
</style>
