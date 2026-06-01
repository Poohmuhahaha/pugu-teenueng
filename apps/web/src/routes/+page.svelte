<script lang="ts">
  import { onMount } from 'svelte';

  export let params: any = undefined;

  interface Me {
    user: { id: number; email: string; name: string };
    actor: { workspaceId: number; role: string };
    memberships: Array<{ workspaceId: number; role: string; workspace: { id: number; name: string; slug: string } }>;
  }
  interface Billing { subscription: { plan: string; status: string }; usage: { entries: number; members: number }; }
  interface ContentType { slug: string; name: string; }

  let me: Me | null = null;
  let billing: Billing | null = null;
  let types: ContentType[] = [];
  let entryCounts: Record<string, number> = {};
  let loading = true;
  let error = '';

  $: activeWs = me?.memberships.find((m) => m.workspaceId === me?.actor.workspaceId);

  async function load() {
    loading = true;
    error = '';
    try {
      const [meRes, b, t] = await Promise.all([
        fetch('/api/v1/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/billing').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/content-types').then((r) => (r.ok ? r.json() : { data: [] })),
      ]);
      me = meRes;
      billing = b;
      types = t.data ?? [];

      // Fetch entry counts per collection in parallel — small hit, big UX gain.
      const counts = await Promise.all(
        types.map((ct) =>
          fetch(`/api/v1/${encodeURIComponent(ct.slug)}?pagination[pageSize]=1&pagination[page]=1`)
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => (j?.meta?.pagination?.total ?? 0) as number)
            .catch(() => 0),
        ),
      );
      entryCounts = Object.fromEntries(types.map((ct, i) => [ct.slug, counts[i]]));
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load workspace data';
    } finally {
      loading = false;
    }
  }

  function planLabel(plan: string): string {
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  }

  function isFreePlan(plan: string | undefined): boolean {
    return !plan || plan.toLowerCase() === 'free';
  }

  onMount(load);
</script>

<svelte:head>
  <title>{activeWs?.workspace.name ?? 'Workspace'} · LifeOS</title>
</svelte:head>

<header class="hero-head">
  <span class="eyebrow">Workspace · Overview</span>
  <div class="hero-row">
    <div class="hero-text">
      <h1 class="hero-title">
        {#if activeWs}{activeWs.workspace.name}{:else}Your workspace{/if}
      </h1>
      <p class="hero-sub">
        {#if activeWs}
          <span class="badge badge-muted">{activeWs.role}</span>
          <span class="dot-sep">·</span>
          <code>/{activeWs.workspace.slug}</code>
        {:else}
          Overview of your subscription, usage, and collections.
        {/if}
      </p>
    </div>
    <div class="hero-actions">
      <a href="/graph" class="btn btn-secondary">Open graph</a>
      <a href="/collections" class="btn">Browse collections →</a>
    </div>
  </div>
</header>

{#if loading}
  <div class="kpi-grid">
    {#each Array(3) as _, i}
      <div class="card-soft skeleton" style="--delay: {i * 0.08}s"></div>
    {/each}
  </div>
{:else if error}
  <div class="card error-state">
    <strong>Couldn't load workspace</strong>
    <p>{error}</p>
    <button class="btn btn-secondary btn-sm" on:click={load}>Retry</button>
  </div>
{:else if billing}
  <div class="kpi-grid">
    <article class="kpi-card">
      <header>
        <span class="kpi-label">Subscription</span>
        <span class="badge {billing.subscription.status === 'active' ? 'badge-success' : 'badge-warning'}">
          {billing.subscription.status}
        </span>
      </header>
      <div class="kpi-value">{planLabel(billing.subscription.plan)}</div>
      <footer>
        {#if isFreePlan(billing.subscription.plan)}
          <a href="https://lifeos.app/#pricing" target="_blank" rel="noopener" class="kpi-cta">Upgrade to Pro →</a>
        {:else}
          <a href="/billing" class="kpi-cta">Manage billing →</a>
        {/if}
      </footer>
    </article>

    <article class="kpi-card">
      <header>
        <span class="kpi-label">Entries</span>
      </header>
      <div class="kpi-value" use:countUp={{ to: billing.usage.entries, format: (n) => n.toLocaleString() }}>0</div>
      <footer>
        <span class="kpi-foot-text">across {types.length} collection{types.length === 1 ? '' : 's'}</span>
      </footer>
    </article>

    <article class="kpi-card">
      <header>
        <span class="kpi-label">Members</span>
      </header>
      <div class="kpi-value" use:countUp={{ to: billing.usage.members }}>0</div>
      <footer>
        <a href="/billing" class="kpi-cta">{billing.usage.members === 1 ? 'Invite teammates →' : 'Manage seats →'}</a>
      </footer>
    </article>
  </div>
{/if}

<section class="collections-section">
  <div class="section-head">
    <div>
      <h2 class="section-title">Collections</h2>
      <p class="section-sub">Structured tables in this workspace. Browse, filter, and edit entries.</p>
    </div>
    <a href="/admin" class="text-link mt-md">Define schemas →</a>
  </div>

  {#if !loading && types.length === 0}
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
      </div>
      <h3>No collections yet</h3>
      <p>Open the admin console to define your first content type — a collection of typed fields.</p>
      <a href="/admin" class="btn">Open admin console →</a>
    </div>
  {:else if types.length > 0}
    <div class="collection-grid">
      {#each types as t, i (t.slug)}
        <a
          href={`/collections/${t.slug}`}
          class="collection-card"
          use:reveal={{ delay: i * 0.04, y: 16 }}
         
        >
          <div class="cc-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
          </div>
          <div class="cc-text">
            <div class="cc-name">{t.name}</div>
            <div class="cc-slug"><code>/{t.slug}</code></div>
          </div>
          <div class="cc-count">
            <span class="cc-count-num">{(entryCounts[t.slug] ?? 0).toLocaleString()}</span>
            <span class="cc-count-label">{entryCounts[t.slug] === 1 ? 'entry' : 'entries'}</span>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  /* === Hero head — matches landing's display-title rhythm ===
     Eyebrow chip, generous spacing, big display title. */
  .hero-head {
    padding-bottom: var(--s-xl);
    margin-bottom: var(--s-xl);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .eyebrow {
    display: inline-block;
    font: 500 12px/1 var(--font-body);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-muted);
    padding: 5px 12px;
    background: var(--c-surface-card);
    border-radius: var(--r-pill);
    margin-bottom: var(--s-md);
  }
  .hero-row {
    display: flex; align-items: flex-start; justify-content: space-between;
    gap: var(--s-lg);
  }
  .hero-text { min-width: 0; flex: 1; }
  .hero-title {
    font-family: var(--font-display);
    font-size: clamp(32px, 4.5vw, 44px);
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.08;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .hero-sub {
    color: var(--c-body);
    font-size: 16px;
    margin: 0;
    display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  }
  .dot-sep { color: var(--c-muted-soft); }
  .hero-sub code {
    font-family: var(--font-mono);
    background: var(--c-surface-card);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 13px;
    color: var(--c-body);
  }
  .hero-actions { display: flex; gap: 8px; flex-wrap: wrap; }
  @media (max-width: 768px) {
    .hero-row { flex-direction: column; align-items: stretch; }
    .hero-title { font-size: 30px; letter-spacing: -0.7px; }
  }

  /* === KPI cards === */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--s-md);
    margin-bottom: var(--s-xxl);
  }
  .kpi-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-md) var(--s-lg) var(--s-sm);
    display: flex;
    flex-direction: column;
    gap: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .kpi-card:hover { border-color: var(--c-hairline); }
  .kpi-card header {
    display: flex; align-items: center; justify-content: space-between;
    gap: 8px;
  }
  .kpi-label {
    font: 500 12px/1.4 var(--font-body);
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .kpi-value {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 600; letter-spacing: -0.6px; line-height: 1.1;
    color: var(--c-ink);
    margin-top: 4px;
  }
  .kpi-card footer {
    margin-top: auto;
    padding-top: var(--s-sm);
    border-top: 1px solid var(--c-hairline-soft);
    font-size: 13px;
  }
  .kpi-foot-text { color: var(--c-muted-soft); }
  .kpi-cta {
    color: var(--c-ink);
    font-weight: 500;
    text-decoration: none;
    transition: color 0.15s;
  }
  .kpi-cta:hover { color: var(--c-brand-accent); }

  /* === Collections section === */
  .collections-section { padding-top: var(--s-md); }
  .section-head {
    display: flex; justify-content: space-between; align-items: flex-end;
    gap: var(--s-md);
    margin-bottom: var(--s-lg);
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600; letter-spacing: -0.4px;
    color: var(--c-ink);
    margin: 0 0 4px;
  }
  .section-sub { font-size: 14px; color: var(--c-muted); margin: 0; }

  .collection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: var(--s-md);
  }
  .collection-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-md) var(--s-lg);
    display: grid;
    grid-template-columns: 36px 1fr auto;
    gap: var(--s-sm);
    align-items: center;
    color: var(--c-ink);
    text-decoration: none;
    transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
  }
  .collection-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
    border-color: var(--c-ink);
    text-decoration: none;
  }
  .cc-icon {
    width: 36px; height: 36px;
    border-radius: var(--r-md);
    background: var(--c-surface-card);
    color: var(--c-ink);
    display: flex; align-items: center; justify-content: center;
  }
  .cc-text { min-width: 0; }
  .cc-name {
    font: 600 15px/1.3 var(--font-body);
    color: var(--c-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .cc-slug { font-size: 12px; color: var(--c-muted); margin-top: 2px; }
  .cc-slug code { font-family: var(--font-mono); background: transparent; padding: 0; }
  .cc-count {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  .cc-count-num {
    display: block;
    font: 600 16px/1 var(--font-display);
    color: var(--c-ink);
    letter-spacing: -0.2px;
  }
  .cc-count-label {
    font-size: 11px; color: var(--c-muted-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* === Empty / error / loading === */
  .empty-state {
    background: var(--c-surface-soft);
    border: 1px dashed var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xxl) var(--s-xl);
    text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: var(--s-sm);
  }
  .empty-icon {
    width: 64px; height: 64px; border-radius: 50%;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--c-muted);
    margin-bottom: var(--s-xs);
  }
  .empty-state h3 {
    font: 600 18px/1.3 var(--font-display);
    letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0;
  }
  .empty-state p { color: var(--c-body); font-size: 14px; max-width: 380px; margin: 0 0 var(--s-sm); }

  .error-state {
    border-color: var(--c-error);
    background: rgba(239, 68, 68, 0.04);
    text-align: center;
  }
  .error-state strong { color: var(--c-error); display: block; }

  .skeleton {
    height: 130px;
    background: linear-gradient(90deg, var(--c-surface-soft) 0%, var(--c-surface-card) 50%, var(--c-surface-soft) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    animation-delay: var(--delay);
    border: 1px solid var(--c-hairline-soft);
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  @media (max-width: 768px) {
    .kpi-grid { grid-template-columns: 1fr; }
    .section-head { flex-direction: column; align-items: flex-start; gap: 8px; }
    .collection-grid { grid-template-columns: 1fr; }
  }
</style>
