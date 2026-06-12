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
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
    <h2 style="margin:0">Billing</h2>
  </div>

  {#if returnMsg}
    <div class="banner">{returnMsg}</div>
  {/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if summary}
    <div class="stack">
      <div class="h-row" style="justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none;">Current plan</div>
          <div style="font-size:24px; font-weight:700; margin-top:4px; text-transform:capitalize">{summary.subscription.plan}</div>
          <div style="font-size:13px; color:var(--c-muted); margin-top:4px">Status: <strong style="color:var(--c-ink); font-weight: 600;">{summary.subscription.status}</strong></div>
        </div>
        {#if summary.subscription.plan === 'free'}
          <button class="btn" on:click={() => startCheckout('personal')} disabled={upgrading}>Upgrade to Personal Pro</button>
        {:else}
          <button class="btn btn-ghost" on:click={manage} disabled={upgrading}>Manage subscription</button>
        {/if}
      </div>

      <div class="usage" style="margin-top: 16px;">
        <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none; margin-bottom: 8px; border-bottom: none;">Usage & Limits</div>
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
      <hr class="divider" />
      <div class="stack">
        <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none;">Other plans</div>
        <div style="font-size:13px; color:var(--c-muted); margin-bottom: 12px;">Need more power? Upgrade your workspace to unlock premium features and limits.</div>
        
        <div class="h-row" style="justify-content: space-between; background: var(--c-surface-soft); padding: 16px; border: 1px solid var(--c-hairline); border-radius: 4px;">
          <div>
            <div style="font-weight:600; font-size: 16px;">Studio Plan</div>
            <div style="font-size:13px; color:var(--c-muted); margin-top: 4px;">Up to 10 users · 50 GB Storage · SSO & Audit Log</div>
            <div style="font-weight: 600; margin-top: 8px; color: var(--c-ink);">฿999 <span style="font-weight: 400; color: var(--c-muted); font-size: 12px;">/ month</span></div>
          </div>
          <button class="btn" on:click={() => startCheckout('studio')} disabled={upgrading}>Upgrade to Studio</button>
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  .usage { display: flex; flex-direction: column; gap: 6px; padding-top: 16px; border-top: 1px dashed var(--c-hairline); }
  .usage-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 12px; background: rgba(0,0,0,0.02); border-radius: 4px; }
  .usage-row span:first-child { color: var(--c-ink); font-weight: 500; }
  .usage-row span:last-child { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--c-primary); }
  .banner { padding: 12px 16px; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 4px; color: #047857; font-size: 13px; font-weight: 500; margin-bottom: 16px; }
</style>
