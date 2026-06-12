<script lang="ts">
  import { onMount } from 'svelte';

  interface Endpoint {
    path: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    description: string;
    auth: boolean;
  }

  const endpoints: Endpoint[] = [
    { path: '/api/health', method: 'GET', description: 'System health check & database ping', auth: false },
    { path: '/api/v1/docs', method: 'GET', description: 'OpenAPI 3.1 schema definition', auth: false },
    { path: '/api/v1/content-types', method: 'GET', description: 'List all CMS database schemas', auth: false },
    { path: '/api/v1/me', method: 'GET', description: 'Get active session actor details', auth: true },
    { path: '/api/v1/waitlist/join', method: 'POST', description: 'Submit lead email to waitlist', auth: false }
  ];

  let selectedEndpoint = endpoints[0];
  let responseData = '';
  let responseTime = 0;
  let responseStatus = 0;
  let responseLoading = false;

  let healthStatus = 'checking...';
  let dbStatus = 'checking...';
  let services = [
    { name: 'Admin Console', port: 5175, status: 'checking', url: 'http://localhost:5175' },
    { name: 'Web Portal', port: 5176, status: 'checking', url: 'http://localhost:5176' },
    { name: 'Landing Page', port: 5177, status: 'checking', url: 'http://localhost:5177' }
  ];

  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        healthStatus = 'online';
        dbStatus = data.db === 'connected' ? 'connected' : 'disconnected';
      } else {
        healthStatus = 'offline';
        dbStatus = 'disconnected';
      }
    } catch {
      healthStatus = 'offline';
      dbStatus = 'disconnected';
    }
  }

  async function checkServices() {
    for (let i = 0; i < services.length; i++) {
      try {
        await fetch(services[i].url, { mode: 'no-cors' });
        services[i].status = 'active';
      } catch {
        services[i].status = 'inactive';
      }
    }
    services = services;
  }

  async function testEndpoint() {
    responseLoading = true;
    responseData = '';
    const start = performance.now();
    try {
      let res;
      if (selectedEndpoint.method === 'GET') {
        res = await fetch(selectedEndpoint.path);
      } else {
        res = await fetch(selectedEndpoint.path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@questpage.app' })
        });
      }
      const end = performance.now();
      responseTime = Math.round(end - start);
      responseStatus = res.status;

      const text = await res.text();
      try {
        responseData = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        responseData = text;
      }
    } catch (err: unknown) {
      const end = performance.now();
      responseTime = Math.round(end - start);
      responseStatus = 500;
      responseData = String((err as Error).message ?? err);
    } finally {
      responseLoading = false;
    }
  }

  onMount(() => {
    checkHealth();
    checkServices();
    testEndpoint();
  });
</script>

<svelte:head>
  <title>QuestPage API Console</title>
</svelte:head>

<header class="top-nav">
  <div class="top-nav-inner">
    <a class="brand" href="/">
      <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
      <span>QuestPage</span>
      <span class="badge badge-blue" style="margin-left: 8px; font-size: 11px">API</span>
    </a>
    <div class="status">
      <span class="status-dot" class:online={healthStatus === 'online'}></span>
      <span class="status-text">API {healthStatus}</span>
    </div>
  </div>
</header>

<main>
  <div class="page-head">
    <div>
      <h1 class="page-title">API Console</h1>
      <p class="page-sub">Inspect endpoints, ping the database, and view connected services.</p>
    </div>
  </div>

  <div class="grid">
    <aside class="left-panel">
      <h2 class="block-title">System status</h2>
      <div class="card-soft stats-card">
        <div class="stat-row">
          <span class="muted">API engine</span>
          <span class="value" class:ok={healthStatus === 'online'} class:err={healthStatus === 'offline'}>{healthStatus}</span>
        </div>
        <div class="stat-row">
          <span class="muted">Database ping</span>
          <span class="value" class:ok={dbStatus === 'connected'} class:err={dbStatus !== 'connected'}>{dbStatus}</span>
        </div>
      </div>

      <h2 class="block-title mt-xl">Connected services</h2>
      <div class="app-list">
        {#each services as app}
          <a href={app.url} target="_blank" rel="noreferrer" class="app-item">
            <div>
              <div class="app-name">{app.name}</div>
              <div class="app-port">Port {app.port}</div>
            </div>
            <span class="badge {app.status === 'active' ? 'badge-success' : 'badge-muted'}">{app.status}</span>
          </a>
        {/each}
      </div>
    </aside>

    <section class="right-panel">
      <h2 class="block-title">Interactive endpoint tester</h2>

      <div class="field">
        <label class="field-label" for="endpoint-select">Endpoint</label>
        <select id="endpoint-select" bind:value={selectedEndpoint} on:change={testEndpoint}>
          {#each endpoints as ep}
            <option value={ep}>{ep.method} {ep.path} — {ep.description}</option>
          {/each}
        </select>
      </div>

      <div class="terminal mt-md">
        <div class="terminal-head">
          <div class="terminal-info">
            <span class="method-tag method-{selectedEndpoint.method}">{selectedEndpoint.method}</span>
            <code class="url-text">{selectedEndpoint.path}</code>
          </div>
          <button class="btn btn-sm" on:click={testEndpoint} disabled={responseLoading}>
            {responseLoading ? 'Sending…' : 'Send request'}
          </button>
        </div>

        {#if responseStatus > 0}
          <div class="terminal-meta">
            <span><span class="muted-soft">Status:</span> <strong class:ok={responseStatus < 400} class:err={responseStatus >= 400}>{responseStatus}</strong></span>
            <span><span class="muted-soft">Time:</span> <strong>{responseTime} ms</strong></span>
          </div>
        {/if}

        <div class="terminal-body">
          {#if responseLoading}
            <div class="loading">
              <span>Fetching response…</span>
            </div>
          {:else}
            <pre><code>{responseData || '// Click Send request to query'}</code></pre>
          {/if}
        </div>
      </div>
    </section>
  </div>
</main>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a class="brand" href="/">
        <img src="/logo.png" alt="QuestPage" class="brand-logo" style="height: 28px; width: auto; max-width: 100%; object-fit: contain;" />
        <span>QuestPage</span>
      </a>
      <p class="footer-tag">QuestPage AI Lead Generation Dashboard · API surface</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>API</h4>
        <a href="/api/v1/docs">OpenAPI v3</a>
        <a href="/api/health">JSON health</a>
      </div>
      <div class="footer-col">
        <h4>Apps</h4>
        <a href="http://localhost:5175">Admin</a>
        <a href="http://localhost:5176">Portal</a>
        <a href="http://localhost:5177">Landing Hall</a>
      </div>
      <div class="footer-col">
        <h4>Source</h4>
        <a href="https://github.com/Poohmuhahaha/questpage">GitHub</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">© {new Date().getFullYear()} QuestPage · All rights reserved</div>
</footer>

<style>
  /* ===== Cal.com-inspired design tokens ===== */
  :global(:root) {
    --c-primary: #3A2616;
    --c-primary-active: #B97A3A;
    --c-ink: #3A2616;
    --c-body: #3A2616;
    --c-muted: #B97A3A;
    --c-muted-soft: #B97A3A;
    --c-hairline: #B97A3A;
    --c-hairline-soft: #FFD59A;
    --c-canvas: #FFF2D9;
    --c-surface-soft: #FFD59A;
    --c-surface-card: #FFD59A;
    --c-surface-strong: #F7B35A;
    --c-surface-dark: #3A2616;
    --c-surface-dark-elev: #24170d;
    --c-on-dark: #FFF2D9;
    --c-on-dark-soft: #FFD59A;
    --c-brand-accent: #F7B35A;
    --c-success: #10b981;
    --c-warning: #f59e0b;
    --c-error: #ef4444;
    --c-badge-violet: #8b5cf6;
    --c-badge-orange: #fb923c;
    --c-badge-emerald: #34d399;
    --r-md: 0px;
    --r-lg: 0px;
    --r-pill: 0px;
    --s-xs: 8px;
    --s-sm: 12px;
    --s-md: 16px;
    --s-lg: 24px;
    --s-xl: 32px;
    --s-xxl: 48px;
    --shadow-sm: 2px 2px 0 0 var(--c-primary);
    --font-display: 'Times New Roman', Times, serif;
    --font-body: 'Times New Roman', Times, serif;
    --font-mono: 'Times New Roman', Times, serif;
  }
  :global(*) { box-sizing: border-box; }
  :global(html, body) { margin: 0; padding: 0; background: var(--c-canvas); color: var(--c-body); }
  :global(body) {
    font-family: var(--font-body);
    font-size: 16px; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
  }

  /* Top nav */
  .top-nav {
    position: sticky; top: 0; z-index: 100;
    background: var(--c-canvas);
    border-bottom: 3px solid var(--c-primary);
  }
  .top-nav-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 var(--s-xl); height: 64px;
  }
  .brand {
    display: inline-flex; align-items: center; gap: 8px;
    font: 600 20px/1 var(--font-display);
    letter-spacing: -0.04em;
    color: var(--c-ink);
    text-decoration: none;
  }
  .brand-dot { width: 10px; height: 10px; border-radius: 0px; background: var(--c-ink); }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    font: 600 12px/1.4 var(--font-body);
    border: 2px solid var(--c-primary);
    border-radius: 0px;
  }
  .badge-blue { background: rgba(59, 130, 246, 0.12); color: var(--c-brand-accent); }
  .badge-success { background: rgba(16, 185, 129, 0.15); color: var(--c-success); }
  .badge-muted { background: var(--c-surface-card); color: var(--c-muted); }

  .status {
    display: flex; align-items: center; gap: 8px;
    font: 500 13px/1.4 var(--font-body);
    color: var(--c-muted);
  }
  .status-dot {
    width: 8px; height: 8px; border-radius: 0px;
    background: var(--c-muted-soft);
    border: 1px solid var(--c-primary);
  }
  .status-dot.online {
    background: var(--c-success);
    box-shadow: none;
  }
  .status-text { text-transform: capitalize; }

  /* Page */
  main { max-width: 1400px; margin: 0 auto; padding: var(--s-xl) var(--s-xl) var(--s-xxl); }
  .page-head { display: flex; justify-content: space-between; align-items: flex-start; gap: var(--s-md); margin-bottom: var(--s-xl); }
  .page-title { font: 600 28px/1.2 var(--font-display); letter-spacing: -0.5px; color: var(--c-ink); }
  .page-sub { margin-top: 4px; color: var(--c-muted); font-size: 14px; }

  .grid { display: grid; grid-template-columns: 380px 1fr; gap: var(--s-xxl); }
  @media (max-width: 900px) { .grid { grid-template-columns: 1fr; gap: var(--s-xl); } }

  /* Spacing Utilities */
  .mt-md { margin-top: var(--s-xl) !important; }
  .mt-xl { margin-top: var(--s-xxl) !important; }

  .block-title {
    font: 600 11px/1.2 var(--font-body);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-muted);
    margin: 0 0 var(--s-md);
  }
  .card-soft {
    background: var(--c-surface-card);
    border: 3px solid var(--c-primary);
    border-radius: 0px;
    padding: var(--s-xl);
    box-shadow: var(--shadow-sm);
  }
  .stats-card { display: flex; flex-direction: column; }
  .stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 16px 0;
    font-size: 14px;
    border-bottom: 2px solid var(--c-hairline-soft);
  }
  .stat-row:last-child { border-bottom: none; }
  .value { font-weight: 600; text-transform: capitalize; color: var(--c-ink); }
  .ok { color: var(--c-success); }
  .err { color: var(--c-error); }
  .muted { color: var(--c-muted); }
  .muted-soft { color: var(--c-muted-soft); }

  .app-list { display: flex; flex-direction: column; gap: var(--s-md); }
  .app-item {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 0px;
    padding: var(--s-md) var(--s-lg);
    text-decoration: none;
    color: inherit;
    transition: border-color 0.15s, transform 0.05s, box-shadow 0.15s;
    box-shadow: 3px 3px 0 var(--c-primary);
  }
  .app-item:hover {
    border-color: var(--c-primary-active);
    transform: translate(-2px, -2px);
    box-shadow: 5px 5px 0 var(--c-primary);
    text-decoration: none;
  }
  .app-name { font: 600 15px/1.4 var(--font-body); color: var(--c-ink); }
  .app-port { font-size: 13px; color: var(--c-muted); margin-top: 2px; }

  .field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .field-label { font: 600 13px/1.4 var(--font-body); color: var(--c-muted); }
  select {
    width: 100%;
    height: 48px;
    padding: 0 16px;
    background: var(--c-canvas);
    color: var(--c-ink);
    border: 3px solid var(--c-primary);
    border-radius: 0px;
    font: 600 14px/1.4 var(--font-body);
    cursor: pointer;
    transition: border-color 0.15s;
    box-shadow: 3px 3px 0 var(--c-primary);
  }
  select:focus { outline: none; border-color: var(--c-ink); box-shadow: 3px 3px 0 var(--c-primary); }

  .btn {
    display: inline-flex; align-items: center; justify-content: center;
    height: 40px; padding: 0 20px;
    background: var(--c-primary);
    color: var(--c-on-dark);
    border: 3px solid var(--c-primary);
    border-radius: 0px;
    font: 600 14px/1 var(--font-body);
    cursor: pointer;
    box-shadow: 3px 3px 0 var(--c-primary);
    transition: background 0.1s, transform 0.05s, box-shadow 0.05s;
  }
  .btn:hover { background: var(--c-primary-active); }
  .btn:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 var(--c-primary);
  }
  .btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
  .btn-sm { height: 32px; padding: 0 14px; font-size: 12px; }

  /* Terminal block */
  .terminal {
    background: var(--c-surface-dark);
    color: var(--c-on-dark);
    border: 3px solid var(--c-primary);
    border-radius: 0px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  .terminal-head {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 20px;
    background: var(--c-surface-dark-elev);
    border-bottom: 2px solid rgba(255,255,255,0.06);
  }
  .terminal-head .btn {
    background: var(--c-canvas); color: var(--c-ink); border: 2px solid var(--c-primary); box-shadow: 2px 2px 0 var(--c-primary);
  }
  .terminal-head .btn:hover { background: #f0f0f0; }
  .terminal-head .btn:active { transform: translate(1px, 1px); box-shadow: 1px 1px 0 var(--c-primary); }
  .terminal-info { display: flex; align-items: center; gap: 12px; }
  .method-tag {
    font: 600 11px/1 var(--font-body);
    padding: 4px 8px;
    border-radius: 0px;
    border: 2px solid var(--c-primary);
    letter-spacing: 0.04em;
  }
  .method-GET { background: rgba(52, 211, 153, 0.2); color: var(--c-badge-emerald); }
  .method-POST { background: rgba(251, 146, 60, 0.2); color: var(--c-badge-orange); }
  .method-PUT { background: rgba(139, 92, 246, 0.2); color: var(--c-badge-violet); }
  .method-DELETE { background: rgba(239, 68, 68, 0.2); color: #f87171; }
  .url-text { font-family: var(--font-mono); font-size: 14px; color: var(--c-on-dark); }

  .terminal-meta {
    display: flex; gap: 24px;
    padding: 12px 20px;
    font-size: 13px;
    color: var(--c-on-dark-soft);
    border-bottom: 2px solid rgba(255,255,255,0.06);
  }
  .terminal-meta strong { color: var(--c-on-dark); font-weight: 600; }
  .terminal-meta strong.ok { color: var(--c-badge-emerald); }
  .terminal-meta strong.err { color: #f87171; }

  .terminal-body {
    padding: 24px;
    min-height: 280px;
    max-height: 520px;
    overflow: auto;
    font: 400 13px/1.6 var(--font-mono);
    color: #d4d4d8;
  }
  .terminal-body pre { margin: 0; white-space: pre-wrap; word-break: break-word; }
  .loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 64px 0; color: var(--c-on-dark-soft); }

  /* Footer */
  .site-footer {
    background: var(--c-surface-dark);
    color: var(--c-on-dark-soft);
    margin-top: var(--s-xxl);
  }
  .site-footer-inner {
    max-width: 1200px; margin: 0 auto;
    padding: 64px var(--s-xl) var(--s-xl);
    display: grid;
    grid-template-columns: 1.2fr 2fr;
    gap: var(--s-xxl);
  }
  .site-footer .brand, .site-footer .brand-dot { color: var(--c-on-dark); }
  .site-footer .brand-dot { background: var(--c-on-dark); }
  .footer-tag { margin-top: var(--s-sm); font-size: 14px; color: var(--c-on-dark-soft); max-width: 280px; }
  .footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--s-lg); }
  .footer-col h4 { font: 600 13px/1.4 var(--font-body); color: var(--c-on-dark); margin: 0 0 var(--s-md); }
  .footer-col a {
    display: block;
    color: var(--c-on-dark-soft);
    font-size: 14px;
    padding: 4px 0;
    text-decoration: none;
  }
  .footer-col a:hover { color: var(--c-on-dark); }
  .site-footer-bottom {
    max-width: 1200px; margin: 0 auto;
    padding: var(--s-lg) var(--s-xl);
    border-top: 1px solid var(--c-surface-dark-elev);
    text-align: center;
    font-size: 13px;
  }

  @media (max-width: 768px) {
    .top-nav-inner { padding: 0 var(--s-md); }
    main { padding: var(--s-md); }
    .site-footer-inner { grid-template-columns: 1fr; padding: 48px var(--s-md) var(--s-md); }
    .footer-cols { grid-template-columns: repeat(2, 1fr); }
  }
</style>
