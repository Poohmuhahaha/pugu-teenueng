<script lang="ts">
  export let params: any = undefined;
  import { onMount } from 'svelte';
  import { reveal, countUp } from '@questpage/ui';

  interface Prospect {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    createdAt: string;
  }

  interface Me {
    user: { id: number; email: string; name: string };
    actor: { workspaceId: number; role: string };
    memberships: Array<{ workspaceId: number; role: string; workspace: { id: number; name: string; slug: string } }>;
  }

  interface Webhook {
    id: number;
    url: string;
    disabledAt: string | null;
    events: string[];
  }

  let me: Me | null = null;
  let prospects: Prospect[] = [];
  let webhooks: Webhook[] = [];
  let loading = true;
  let error = '';
  let activeTab: 'all' | 'pending' | 'approved' | 'rejected' = 'all';
  let simulating = false;
  let searchRaw = '';

  $: activeWs = me?.memberships.find((m) => m.workspaceId === me?.actor.workspaceId);

  // Compute stats
  $: totalLeads = prospects.length;
  $: pendingLeads = prospects.filter(p => p.status === 'pending').length;
  $: approvedLeads = prospects.filter(p => p.status === 'approved').length;
  $: activeWebhooksCount = webhooks.filter(w => !w.disabledAt).length;

  // Filter prospects
  $: filteredProspects = prospects.filter(p => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch = !searchRaw || 
      p.name.toLowerCase().includes(searchRaw.toLowerCase()) || 
      p.email.toLowerCase().includes(searchRaw.toLowerCase()) || 
      (p.phone && p.phone.includes(searchRaw));
    return matchesTab && matchesSearch;
  });

  async function load() {
    loading = true;
    error = '';
    try {
      const [meRes, prospectsRes, webhooksRes] = await Promise.all([
        fetch('/api/v1/me').then((r) => (r.ok ? r.json() : null)),
        fetch('/api/v1/prospects').then((r) => (r.ok ? r.json() : [])),
        fetch('/api/v1/webhooks').then((r) => (r.ok ? r.json() : { data: [] })),
      ]);
      me = meRes;
      prospects = prospectsRes;
      webhooks = webhooksRes.data || [];
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load workspace data';
    } finally {
      loading = false;
    }
  }

  // Poll for prospects to simulate live lead updates in POC
  onMount(() => {
    load();
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/v1/prospects');
        if (res.ok) {
          prospects = await res.json();
        }
      } catch (e) {
        console.error('Failed to poll prospects', e);
      }
    }, 3000);
    return () => clearInterval(interval);
  });

  async function updateProspectField(id: number, field: 'name' | 'email' | 'phone', value: string) {
    // Optimistic update
    prospects = prospects.map(p => p.id === id ? { ...p, [field]: value } : p);
    
    try {
      await fetch(`/api/v1/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      });
    } catch (e) {
      console.error('Failed to save field', e);
    }
  }

  async function approve(id: number) {
    const item = prospects.find(p => p.id === id);
    if (!item) return;
    try {
      const res = await fetch(`/api/v1/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          email: item.email,
          phone: item.phone,
          status: 'approved'
        })
      });
      if (res.ok) {
        const updated = await res.json();
        prospects = prospects.map(p => p.id === id ? updated : p);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function reject(id: number) {
    try {
      const res = await fetch(`/api/v1/prospects/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      });
      if (res.ok) {
        const updated = await res.json();
        prospects = prospects.map(p => p.id === id ? updated : p);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function simulateLeadIntake() {
    simulating = true;
    const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Garcia', 'Rodriguez', 'Wilson', 'Martinez', 'Anderson', 'Taylor'];
    const companies = ['InnovateCorp', 'Stripe', 'Google', 'Vercel', 'Linear', 'Cal.com', 'Acme Inc', 'Supabase', 'Clerk', 'Resend'];
    
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    
    const company = companies[Math.floor(Math.random() * companies.length)];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${company.toLowerCase().replace(' ', '')}.com`;
    const phone = `0${Math.floor(81 + Math.random() * 8)}-${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const res = await fetch('/api/v1/prospects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });
      if (res.ok) {
        const newProspect = await res.json();
        prospects = [newProspect, ...prospects];
      }
    } catch (e) {
      console.error('Simulation failed', e);
    } finally {
      simulating = false;
    }
  }
</script>

<svelte:head>
  <title>{activeWs?.workspace.name ?? 'Workspace'} · QuestPage Lead Desk</title>
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
      <p class="page-sub">Verification center for incoming prospects and leads.</p>
    {/if}
  </div>
  <div class="page-header-actions">
    <button on:click={simulateLeadIntake} disabled={simulating} class="btn">
      {#if simulating}Simulating...{:else}Simulate Lead Intake{/if}
    </button>
    <button on:click={load} class="btn btn-secondary">Refresh</button>
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
      <strong>Couldn't load workspace data</strong>
      <p>{error}</p>
    </div>
    <button class="btn btn-secondary btn-sm" on:click={load}>Retry</button>
  </div>
{:else}
  <div class="kpi-grid">
    <!-- Total Leads -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--violet">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Total Prospects</div>
        <div class="kpi-value" use:countUp={{ to: totalLeads }}>0</div>
        <div class="kpi-foot">
          <span class="kpi-foot-text">leads generated by AI</span>
        </div>
      </div>
    </article>

    <!-- Pending Action -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--orange">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Pending Verification</div>
        <div class="kpi-value" use:countUp={{ to: pendingLeads }}>0</div>
        <div class="kpi-foot">
          <span class="kpi-foot-text">require human review</span>
        </div>
      </div>
    </article>

    <!-- Webhooks Status -->
    <article class="kpi-card">
      <div class="kpi-icon kpi-icon--emerald">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </div>
      <div class="kpi-body">
        <div class="kpi-label">Active Messenger Birds</div>
        <div class="kpi-value" use:countUp={{ to: activeWebhooksCount }}>0</div>
        <div class="kpi-foot">
          <a href="/admin" class="kpi-cta">Setup callback webhooks →</a>
        </div>
      </div>
    </article>
  </div>
{/if}

<div class="dashboard-grid">
  <!-- Leads desk -->
  <section class="leads-section">
    <div class="section-head">
      <div>
        <h2 class="section-title">Lead Verification Table</h2>
        <p class="section-sub">Click on name, email, or phone of pending prospects to edit details before approving.</p>
      </div>
    </div>

    <!-- Filters and Search -->
    <div class="filters-row">
      <div class="nav-pill-group">
        <button class="pill-tab" class:active={activeTab === 'all'} on:click={() => activeTab = 'all'}>All</button>
        <button class="pill-tab" class:active={activeTab === 'pending'} on:click={() => activeTab = 'pending'}>
          Pending ({pendingLeads})
        </button>
        <button class="pill-tab" class:active={activeTab === 'approved'} on:click={() => activeTab = 'approved'}>
          Approved ({approvedLeads})
        </button>
        <button class="pill-tab" class:active={activeTab === 'rejected'} on:click={() => activeTab = 'rejected'}>
          Rejected
        </button>
      </div>

      <div class="search-box">
        <input 
          type="search" 
          placeholder="Filter by name or email..." 
          bind:value={searchRaw}
          class="search-input" 
        />
      </div>
    </div>

    <table class="t">
      <thead>
        <tr>
          <th style="width: 80px;">ID</th>
          <th>Name (Click to edit)</th>
          <th>Email (Click to edit)</th>
          <th>Phone (Click to edit)</th>
          <th style="width: 130px;">Status</th>
          <th style="width: 200px;">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each filteredProspects as item (item.id)}
          <tr class="prospect-row {item.status}">
            <td class="muted">#{item.id}</td>
            <td>
              <input 
                type="text" 
                class="cell-input" 
                value={item.name} 
                disabled={item.status !== 'pending'}
                on:blur={(e) => updateProspectField(item.id, 'name', e.currentTarget.value)}
              />
            </td>
            <td>
              <input 
                type="email" 
                class="cell-input" 
                value={item.email} 
                disabled={item.status !== 'pending'}
                on:blur={(e) => updateProspectField(item.id, 'email', e.currentTarget.value)}
              />
            </td>
            <td>
              <input 
                type="text" 
                class="cell-input" 
                value={item.phone || ''} 
                placeholder="—"
                disabled={item.status !== 'pending'}
                on:blur={(e) => updateProspectField(item.id, 'phone', e.currentTarget.value)}
              />
            </td>
            <td>
              <span class="badge badge-{item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'error' : 'warning'}">
                {item.status}
              </span>
            </td>
            <td>
              {#if item.status === 'pending'}
                <div class="action-buttons">
                  <button on:click={() => approve(item.id)} class="btn btn-sm btn-approve">
                    Approve
                  </button>
                  <button on:click={() => reject(item.id)} class="btn btn-sm btn-secondary btn-reject">
                    Reject
                  </button>
                </div>
              {:else if item.status === 'approved'}
                <span class="status-confirmed success">Approved & dispatched</span>
              {:else}
                <span class="status-confirmed error">Rejected</span>
              {/if}
            </td>
          </tr>
        {/each}
        {#if filteredProspects.length === 0}
          <tr>
            <td colspan="6" class="center empty-td">
              No prospects found in this view.
            </td>
          </tr>
        {/if}
      </tbody>
    </table>
  </section>

  <!-- Sidebar Info -->
  <aside class="sidebar-info">
    <div class="info-card">
      <h3 class="info-title">How this works</h3>
      <p class="info-desc">
        QuestPage acts as a secure verification firewall for your business leads:
      </p>
      <ol class="info-steps">
        <li><strong>AI secretary finds leads</strong> and submits them securely to QuestPage using an API Key.</li>
        <li><strong>Pending leads wait here</strong> for human review, where you can modify details.</li>
        <li><strong>Upon clicking Approve</strong>, QuestPage signs and delivers the payload back to your systems using callback webhooks.</li>
      </ol>
    </div>

    <div class="info-card webhook-status-card">
      <h3 class="info-title">Connected webhooks</h3>
      {#if webhooks.length === 0}
        <p class="info-desc muted">No webhooks registered for this workspace.</p>
        <a href="/admin" class="text-link">Register callback webhook →</a>
      {:else}
        <div class="webhook-list">
          {#each webhooks as hook}
            <div class="webhook-item" class:disabled={hook.disabledAt}>
              <div class="webhook-url"><code>{hook.url}</code></div>
              <div class="webhook-meta">
                <span class="badge badge-muted">Events: {hook.events.join(', ')}</span>
                <span class="status-indicator {hook.disabledAt ? 'disabled' : 'active'}">
                  {hook.disabledAt ? 'Disabled' : 'Active'}
                </span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </aside>
</div>

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
  .page-header-actions { display: flex; gap: 12px; flex-wrap: wrap; flex: none; }

  /* ── KPI Grid ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
    margin-bottom: 48px;
  }
  .kpi-card {
    background: var(--c-canvas, #FFF2D9);
    border: 3px solid var(--c-primary, #3A2616);
    box-shadow: var(--shadow-md);
    padding: 24px;
    display: flex;
    gap: 20px;
    align-items: flex-start;
  }
  .kpi-icon {
    width: 48px; height: 48px;
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
    font: 600 11px/1.4 var(--font-body);
    color: var(--c-muted, #B97A3A);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }
  .kpi-value {
    font-family: var(--font-display);
    font-size: 32px; font-weight: 700; letter-spacing: -0.8px; line-height: 1.1;
    color: var(--c-ink, #3A2616);
    margin-bottom: 12px;
  }
  .kpi-foot {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    padding-top: 12px;
    border-top: 2px solid var(--c-hairline-soft, #FFD59A);
    font-size: 13px;
  }
  .kpi-foot-text { color: var(--c-muted, #D4A574); }
  .kpi-cta {
    color: var(--c-ink, #3A2616);
    font-weight: 600;
    text-decoration: none;
    font-size: 13px;
  }
  .kpi-cta:hover { text-decoration: underline; }

  .skeleton-card {
    height: 140px;
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

  /* ── Error & simulation ── */
  .error-banner {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 24px;
    border: 3px solid #EF4444;
    background: rgba(239,68,68,0.06);
    box-shadow: 4px 4px 0 rgba(239,68,68,0.2);
    margin-bottom: 32px;
    color: #EF4444;
  }
  .error-banner strong { display: block; color: #EF4444; }
  .error-banner p { margin: 4px 0 0; font-size: 14px; color: var(--c-body); }
  .error-banner > div { flex: 1; }

  /* ── Dashboard Grid ── */
  .dashboard-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: var(--s-xxl);
    align-items: start;
  }
  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
      gap: var(--s-xl);
    }
  }

  /* ── Table & Filter Desk ── */
  .leads-section {
    min-width: 0;
  }
  .section-head {
    margin-bottom: 24px;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 22px; font-weight: 600; letter-spacing: -0.4px;
    color: var(--c-ink);
    margin: 0 0 6px;
  }
  .section-sub { font-size: 14px; color: var(--c-muted); margin: 0; }

  .filters-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  @media (max-width: 768px) {
    .filters-row {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .search-box {
    flex: 1;
    max-width: 320px;
  }
  .search-input {
    width: 100%;
    height: 38px;
    box-shadow: 2px 2px 0 var(--c-primary);
  }

  /* Inline Cell Input */
  .cell-input {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: var(--s-xxs) var(--s-xs);
    margin: 0;
    width: 100%;
    height: auto;
    font-family: inherit;
    font-size: inherit;
    color: inherit;
    font-weight: inherit;
    border-radius: 0px;
    transition: background 0.15s, outline 0.15s;
  }
  .cell-input:not(:disabled):hover {
    background: rgba(247, 179, 90, 0.1);
    outline: 1px dashed var(--c-muted);
  }
  .cell-input:focus {
    background: var(--c-canvas);
    outline: 2px solid var(--c-primary);
    box-shadow: 2px 2px 0 var(--c-primary);
  }
  .cell-input:disabled {
    background: transparent;
    color: var(--c-body);
    cursor: default;
  }

  /* Action Buttons */
  .action-buttons {
    display: flex;
    gap: 8px;
  }
  .btn-approve {
    background: var(--c-success);
    border-color: var(--c-primary);
    box-shadow: 2px 2px 0 var(--c-primary);
  }
  .btn-approve:hover {
    background: #059669;
  }
  .btn-reject {
    color: var(--c-error);
    box-shadow: 2px 2px 0 var(--c-primary);
  }
  .btn-reject:hover {
    background: rgba(239, 68, 68, 0.08);
  }

  .status-confirmed {
    font-size: 13px;
    font-weight: 600;
  }
  .status-confirmed.success { color: var(--c-success); }
  .status-confirmed.error { color: var(--c-error); }

  .empty-td {
    padding: 48px !important;
    color: var(--c-muted);
    font-size: 15px;
  }

  /* Row Highlights */
  .prospect-row.approved td {
    background: rgba(52, 211, 153, 0.04);
  }
  .prospect-row.rejected td {
    background: rgba(239, 68, 68, 0.03);
    text-decoration: line-through;
    opacity: 0.7;
  }

  /* ── Sidebar Cards ── */
  .sidebar-info {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  .info-card {
    background: var(--c-surface-card);
    border: 3px solid var(--c-primary);
    box-shadow: var(--shadow-sm);
    padding: 24px;
  }
  .info-title {
    font-size: 16px;
    margin-bottom: 12px;
    color: var(--c-ink);
    border-bottom: 2px solid var(--c-hairline-soft);
    padding-bottom: 6px;
  }
  .info-desc {
    font-size: 14px;
    color: var(--c-body);
    line-height: 1.5;
    margin-bottom: 12px;
  }
  .info-steps {
    font-size: 13.5px;
    margin: 0;
    padding-left: 20px;
    color: var(--c-body);
    line-height: 1.6;
  }
  .info-steps li {
    margin-bottom: 8px;
  }

  .webhook-status-card {
    background: var(--c-canvas);
  }
  .webhook-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .webhook-item {
    padding: 10px 12px;
    background: var(--c-surface-soft);
    border: 2px solid var(--c-primary);
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .webhook-item.disabled {
    opacity: 0.6;
    border-style: dashed;
  }
  .webhook-url {
    font-size: 12px;
    word-break: break-all;
  }
  .webhook-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
  }
  .status-indicator {
    font-weight: 600;
  }
  .status-indicator.active { color: var(--c-success); }
  .status-indicator.disabled { color: var(--c-muted); }

  @media (max-width: 768px) {
    .page-header { flex-direction: column; align-items: stretch; }
    .kpi-grid { grid-template-columns: 1fr; }
  }
</style>
