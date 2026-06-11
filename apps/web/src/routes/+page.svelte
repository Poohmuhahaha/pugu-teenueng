<script lang="ts">
  import { onMount } from 'svelte';
  import { reveal } from '@questpage/ui';

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
  <title>{activeWs?.workspace.name ?? 'Workspace'} · QuestPage</title>
</svelte:head>

<!-- ── Page header ── -->
<div class="page-header">
  <div class="page-header-left">
    <div class="page-eyebrow">Workspace · Overview</div>
    <h1 class="page-title">
      {#if activeWs}{activeWs.workspace.name}{:else}Your workspace{/if}
    </h1>
    {#if activeWs}
      <div class="page-meta">
        <span class="badge badge-muted">{activeWs.role}</span>
        <span class="page-meta-sep">·</span>
        <code class="page-slug">/{activeWs.workspace.slug}</code>
      </div>
    {:else}
      <p class="page-sub">Overview of your subscription, usage, and collections.</p>
    {/if}
  </div>
  <div class="page-header-actions">
    <a href="/graph" class="btn btn-secondary">Open graph</a>
    <a href="/collections" class="btn">Browse collections →</a>
  </div>
</div>

{#if loading}
  <!-- Skeleton -->
  <div class="kpi-grid">
    {#each Array(3) as _, i}
      <div class="kpi-card skeleton-card" style="--delay: {i * 0.08}s"></div>
    {/each}
  </div>
{:else if error}
  <div class="error-banner">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <div>
      <strong>Couldn't load workspace</strong>
      <p>{error}</p>
    </div>
    <button class="btn btn-secondary btn-sm" on:click={load}>Retry</button>
  </div>
{:else if billing}
  <div class="kpi-grid">
    <!-- Subscription -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--violet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Subscription</div>
        <div class="kpi-value">{planLabel(billing.subscription.plan)}</div>
        <div class="kpi-foot">
          <span class="badge {billing.subscription.status === 'active' ? 'badge-success' : 'badge-warning'}">{billing.subscription.status}</span>
          {#if isFreePlan(billing.subscription.plan)}
            <a href="https://questpage.app/#pricing" target="_blank" rel="noopener" class="kpi-cta">Upgrade →</a>
          {:else}
            <a href="/billing" class="kpi-cta">Manage →</a>
          {/if}
        </div>
      </div>
    </article>

    <!-- Entries -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--orange">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Entries</div>
        <div class="kpi-value" use:countUp={{ to: billing.usage.entries, format: (n) => n.toLocaleString() }}>0</div>
        <div class="kpi-foot">
          <span class="kpi-foot-text">across {types.length} collection{types.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </article>

    <!-- Members -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--emerald">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Members</div>
        <div class="kpi-value" use:countUp={{ to: billing.usage.members }}>0</div>
        <div class="kpi-foot">
          <a href="/billing" class="kpi-cta">{billing.usage.members === 1 ? 'Invite teammates →' : 'Manage seats →'}</a>
        </div>
      </div>
    </article>
  </div>
{/if}

<section class="collections-section">
  <div class="section-head">
    <div>
      <h2 class="section-title">Collections</h2>
      <p class="section-sub">Structured tables in this workspace. Browse, filter, and edit entries.</p>
    </div>
    <a href="/admin" class="text-link">Define schemas →</a>
  </div>

  {#if !loading && types.length === 0}
    <div class="empty-state">
      <div class="empty-icon" aria-hidden="true">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
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
          <div class="cc-header">
            <div class="cc-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            </div>
            <div class="cc-count">
              <span class="cc-count-num">{(entryCounts[t.slug] ?? 0).toLocaleString()}</span>
              <span class="cc-count-label">{entryCounts[t.slug] === 1 ? 'entry' : 'entries'}</span>
            </div>
          </div>
          <div class="cc-body">
            <div class="cc-name">{t.name}</div>
            <div class="cc-slug"><code>/{t.slug}</code></div>
          </div>
          <div class="cc-arrow" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </a>
      {/each}
    </div>
  {/if}
</section>

<style>
  /* ── Page header ── */
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 24px;
    padding-bottom: 28px;
    margin-bottom: 28px;
    border-bottom: 3px solid var(--c-primary, #3A2616);
  }
  .page-eyebrow {
    font: 500 11px/1 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-muted, #B97A3A);
    margin-bottom: 10px;
  }
  .page-title {
    font-family: var(--font-display);
    font-size: clamp(26px, 3.5vw, 36px);
    font-weight: 600;
    letter-spacing: -1px;
    line-height: 1.1;
    color: var(--c-ink, #3A2616);
    margin: 0 0 8px;
  }
  .page-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .page-meta-sep { color: var(--c-muted-soft); }
  .page-slug {
    font-family: var(--font-mono);
    font-size: 13px;
    background: var(--c-surface-card);
    padding: 2px 8px;
    border: 2px solid var(--c-hairline, #B97A3A);
    color: var(--c-body);
  }
  .page-sub { color: var(--c-body); font-size: 15px; margin: 0; }
  .page-header-actions { display: flex; gap: 8px; flex-wrap: wrap; flex: none; }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 40px;
  }
  .kpi-card {
    background: var(--c-canvas, #FFF2D9);
    border: 3px solid var(--c-primary, #3A2616);
    box-shadow: 4px 4px 0 var(--c-primary, #3A2616);
    padding: 20px;
    display: flex;
    gap: 16px;
    align-items: flex-start;
  }
  .kpi-icon {
    width: 44px; height: 44px;
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid var(--c-primary, #3A2616);
  }
  .kpi-icon--violet { background: var(--c-badge-violet, #EDE9FE); color: #6D28D9; }
  .kpi-icon--orange { background: var(--c-badge-orange, #FEF3C7); color: #D97706; }
  .kpi-icon--emerald { background: var(--c-badge-emerald, #D1FAE5); color: #059669; }
  .kpi-body { flex: 1; min-width: 0; }
  .kpi-label {
    font: 500 11px/1.4 var(--font-body);
    color: var(--c-muted, #B97A3A);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 4px;
  }
  .kpi-value {
    font-family: var(--font-display);
    font-size: 30px; font-weight: 700; letter-spacing: -0.8px; line-height: 1.1;
    color: var(--c-ink, #3A2616);
    margin-bottom: 10px;
  }
  .kpi-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 10px;
    border-top: 2px solid var(--c-hairline-soft, #FFD59A);
    font-size: 13px;
  }
  .kpi-foot-text { color: var(--c-muted-soft, #D4A574); }
  .kpi-cta {
    color: var(--c-ink, #3A2616);
    font-weight: 600;
    text-decoration: none;
    font-size: 13px;
  }
  .kpi-cta:hover { text-decoration: underline; }

  .skeleton-card {
    height: 120px;
    background: linear-gradient(90deg, var(--c-surface-soft) 0%, var(--c-surface-card) 50%, var(--c-surface-soft) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.4s linear infinite;
    animation-delay: var(--delay);
    border: 3px solid var(--c-hairline-soft);
  }
  @keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* ── Error banner ── */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border: 3px solid #EF4444;
    background: rgba(239,68,68,0.06);
    box-shadow: 4px 4px 0 rgba(239,68,68,0.2);
    margin-bottom: 32px;
    color: #EF4444;
  }
  .error-banner strong { display: block; color: #EF4444; }
  .error-banner p { margin: 2px 0 0; font-size: 13px; color: var(--c-body); }
  .error-banner > div { flex: 1; }

  /* ── Collections section ── */
  .collections-section { padding-top: 4px; }
  .section-head {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 16px;
    margin-bottom: 20px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 20px; font-weight: 600; letter-spacing: -0.4px;
    color: var(--c-ink);
    margin: 0 0 4px;
  }
  .section-sub { font-size: 13px; color: var(--c-muted); margin: 0; }

  .collection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 12px;
  }
  .collection-card {
    background: var(--c-canvas, #FFF2D9);
    border: 3px solid var(--c-primary, #3A2616);
    box-shadow: 3px 3px 0 var(--c-primary, #3A2616);
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    color: var(--c-ink, #3A2616);
    text-decoration: none;
    transition: box-shadow 0.12s, transform 0.12s;
  }
  .collection-card:hover {
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--c-primary, #3A2616);
    text-decoration: none;
  }
  .cc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .cc-icon {
    width: 32px; height: 32px;
    border: 2px solid var(--c-primary, #3A2616);
    background: var(--c-surface-card);
    display: flex; align-items: center; justify-content: center;
    color: var(--c-ink);
    flex: none;
  }
  .cc-body { flex: 1; }
  .cc-name {
    font: 600 15px/1.3 var(--font-body);
    color: var(--c-ink);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 2px;
  }
  .cc-slug { font-size: 12px; color: var(--c-muted); }
  .cc-slug code { font-family: var(--font-mono); background: transparent; padding: 0; }
  .cc-count { text-align: right; }
  .cc-count-num {
    display: block;
    font: 700 20px/1 var(--font-display);
    color: var(--c-ink);
    letter-spacing: -0.5px;
  }
  .cc-count-label {
    font-size: 10px; color: var(--c-muted-soft);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .cc-arrow {
    align-self: flex-end;
    color: var(--c-muted);
    opacity: 0;
    transition: opacity 0.12s;
  }
  .collection-card:hover .cc-arrow { opacity: 1; }

  /* ── Empty state ── */
  .empty-state {
    border: 3px dashed var(--c-hairline, #B97A3A);
    padding: 48px 32px;
    text-align: center;
    display: flex; flex-direction: column; align-items: center; gap: 12px;
  }
  .empty-icon {
    width: 56px; height: 56px;
    border: 3px solid var(--c-primary, #3A2616);
    background: var(--c-surface-card);
    display: inline-flex; align-items: center; justify-content: center;
    color: var(--c-muted);
  }
  .empty-state h3 {
    font: 600 18px/1.3 var(--font-display);
    letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0;
  }
  .empty-state p { color: var(--c-body); font-size: 14px; max-width: 360px; margin: 0; }

  @media (max-width: 768px) {
    .page-header { flex-direction: column; align-items: stretch; }
    .kpi-grid { grid-template-columns: 1fr; }
    .section-head { flex-direction: column; gap: 8px; }
    .collection-grid { grid-template-columns: 1fr; }
  }
</style>
