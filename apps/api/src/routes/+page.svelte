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
    { name: 'Web Workspace', port: 5176, status: 'checking', url: 'http://localhost:5176' },
    { name: 'Marketing Landing', port: 5177, status: 'checking', url: 'http://localhost:5177' }
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
        const res = await fetch(services[i].url, { mode: 'no-cors' });
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
          body: JSON.stringify({ email: 'test@lifeos.app' })
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
  <title>LifeOS API Console</title>
</svelte:head>

<header>
  <div class="brand">LifeOS <span>API</span></div>
  <div class="status-badge" class:online={healthStatus === 'online'}>
    <span class="pulse"></span>
    API {healthStatus.toUpperCase()}
  </div>
</header>

<main>
  <div class="grid">
    <div class="left-panel">
      <div class="section-title">System Status</div>
      <div class="stats-card">
        <div class="stat-row">
          <span class="label">API Engine</span>
          <span class="value success" class:error={healthStatus === 'offline'}>{healthStatus}</span>
        </div>
        <div class="stat-row">
          <span class="label">Database PING</span>
          <span class="value success" class:error={dbStatus !== 'connected'}>{dbStatus}</span>
        </div>
      </div>

      <div class="section-title" style="margin-top: 32px;">Workspace Applications</div>
      <div class="app-list">
        {#each services as app}
          <a href={app.url} target="_blank" rel="noreferrer" class="app-item">
            <div>
              <div class="app-name">{app.name}</div>
              <div class="app-port">Port {app.port}</div>
            </div>
            <span class="app-badge" class:active={app.status === 'active'}>
              {app.status}
            </span>
          </a>
        {/each}
      </div>
    </div>

    <div class="right-panel">
      <div class="section-title">Interactive API Tester</div>
      <div class="selector-card">
        <label for="endpoint-select" class="control-label">Select Endpoint</label>
        <select id="endpoint-select" bind:value={selectedEndpoint} on:change={testEndpoint}>
          {#each endpoints as ep}
            <option value={ep}>{ep.method} {ep.path} — {ep.description}</option>
          {/each}
        </select>
      </div>

      <div class="terminal-shell" style="margin-top: 24px;">
        <div class="terminal-header">
          <div class="terminal-info">
            <span class="method-tag method-{selectedEndpoint.method}">{selectedEndpoint.method}</span>
            <code class="url-text">{selectedEndpoint.path}</code>
          </div>
          <button class="send-btn" on:click={testEndpoint} disabled={responseLoading}>
            {responseLoading ? 'SENDING...' : 'SEND REQUEST'}
          </button>
        </div>

        <div class="terminal-details">
          {#if responseStatus > 0}
            <div class="stat-item">
              <span class="label">Status:</span>
              <span class="value" class:success={responseStatus < 400} class:error={responseStatus >= 400}>
                {responseStatus}
              </span>
            </div>
            <div class="stat-item">
              <span class="label">Time:</span>
              <span class="value">{responseTime} ms</span>
            </div>
          {/if}
        </div>

        <div class="terminal-body">
          {#if responseLoading}
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Fetching secure API response...</span>
            </div>
          {:else}
            <pre><code>{responseData || '// Click Send Request to query data'}</code></pre>
          {/if}
        </div>
      </div>
    </div>
  </div>
</main>

<footer>
  <span>© 2026 LifeOS · <a href="/api/v1/docs">OpenAPI v3 Docs</a> · <a href="/api/health">JSON Health</a></span>
</footer>

<style>
  :root {
    --bg: #ffffff;
    --ink: #000000;
    --accent: #c9ad93;
    --accent-rgb: 201, 173, 147;
    --success: #879a77;
    --error: #b36b53;
    --border: #73787c;
    --surface: #d7e5f0;
    --muted: #73787c;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg: #000000;
      --ink: #d7e5f0;
      --accent: #c9ad93;
      --accent-rgb: 201, 173, 147;
      --success: #879a77;
      --error: #b36b53;
      --border: #73787c;
      --surface: #554940;
      --muted: #c5c6c7;
    }
  }

  :global(html, body) { margin: 0; padding: 0; background: var(--bg); color: var(--ink); }
  :global(body) {
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    line-height: 1.6;
    transition: background 0.3s, color 0.3s;
  }

  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 32px; border-bottom: 1px solid rgba(var(--accent-rgb), 0.15);
    background: rgba(0, 0, 0, 0.2); backdrop-filter: blur(16px);
  }
  .brand {
    font-weight: 800; letter-spacing: -0.03em; font-size: 20px;
    color: var(--accent);
  }
  .brand span {
    font-size: 11px; background: rgba(var(--accent-rgb), 0.15);
    padding: 2px 8px; border-radius: 20px; vertical-align: middle;
    margin-left: 6px; font-weight: 700; color: var(--accent);
  }
  .status-badge {
    display: flex; align-items: center; gap: 8px; font-size: 11px;
    font-weight: 800; background: rgba(var(--accent-rgb), 0.1);
    color: var(--accent); padding: 6px 12px; border-radius: 20px;
    border: 1px solid rgba(var(--accent-rgb), 0.15);
  }
  .status-badge.online {
    background: rgba(135, 154, 119, 0.1); color: var(--success);
    border-color: rgba(135, 154, 119, 0.2);
  }
  .pulse {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
  }
  .status-badge.online .pulse {
    background: var(--success); box-shadow: 0 0 6px var(--success);
  }

  main { max-width: 1200px; margin: 40px auto; padding: 0 32px 80px; }
  .grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; }

  @media (max-width: 900px) {
    .grid { grid-template-columns: 1fr; }
  }

  .section-title {
    font-size: 11px; font-weight: 800; text-transform: uppercase;
    color: var(--accent); letter-spacing: 0.08em; margin-bottom: 12px;
  }

  .stats-card {
    background: var(--surface); border: 1px solid rgba(var(--accent-rgb), 0.15);
    border-radius: 12px; padding: 18px;
  }
  .stat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 0; border-bottom: 1px solid rgba(115, 120, 124, 0.15);
  }
  .stat-row:last-child { border-bottom: none; }
  .stat-row .label { font-size: 12px; color: var(--muted); }
  .stat-row .value { font-size: 13px; font-weight: 700; text-transform: capitalize; }
  .value.success { color: var(--success); }
  .value.error { color: var(--error); }

  .app-list { display: flex; flex-direction: column; gap: 10px; }
  .app-item {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(var(--accent-rgb), 0.04); border: 1px solid rgba(115, 120, 124, 0.15);
    border-radius: 12px; padding: 14px 18px; text-decoration: none; color: inherit;
    transition: all 0.2s;
  }
  .app-item:hover {
    border-color: var(--accent); background: rgba(var(--accent-rgb), 0.08);
  }
  .app-name { font-size: 14px; font-weight: 700; }
  .app-port { font-size: 11px; color: var(--muted); }
  .app-badge {
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    padding: 3px 8px; border-radius: 6px; background: rgba(115, 120, 124, 0.12);
    color: var(--muted);
  }
  .app-badge.active {
    background: rgba(135, 154, 119, 0.15); color: var(--success);
  }

  .selector-card {
    display: flex; flex-direction: column; gap: 8px;
  }
  .control-label { font-size: 12px; font-weight: 700; color: var(--muted); }
  select {
    height: 44px; padding: 0 12px; border-radius: 8px;
    border: 1px solid rgba(115, 120, 124, 0.2);
    background: var(--surface); color: var(--ink);
    font-size: 14px; outline: none; transition: border 0.2s;
    font-family: inherit;
  }
  select:focus { border-color: var(--accent); }

  .terminal-shell {
    background: #000000; border: 1px solid rgba(var(--accent-rgb), 0.2);
    border-radius: 12px; overflow: hidden; display: flex; flex-direction: column;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .terminal-header {
    display: flex; justify-content: space-between; align-items: center;
    background: rgba(255,255,255,0.03); padding: 12px 18px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .terminal-info { display: flex; align-items: center; gap: 12px; }
  .method-tag {
    font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;
  }
  .method-GET { background: rgba(135, 154, 119, 0.2); color: var(--success); }
  .method-POST { background: rgba(201, 173, 147, 0.2); color: var(--accent); }
  .url-text { font-size: 13px; color: #fff; font-family: monospace; }
  .send-btn {
    height: 32px; padding: 0 14px; background: var(--accent);
    color: #000000; border: none; border-radius: 6px; font-size: 11px;
    font-weight: 800; cursor: pointer; transition: all 0.2s;
    font-family: inherit;
  }
  .send-btn:hover:not(:disabled) { background: #fff; }
  .send-btn:disabled { opacity: 0.6; cursor: progress; }

  .terminal-details {
    display: flex; gap: 20px; background: rgba(255,255,255,0.01);
    padding: 8px 18px; border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .terminal-details .stat-item { font-size: 12px; display: flex; gap: 6px; }
  .terminal-details .label { color: #73787c; }
  .terminal-details .value { font-weight: 700; color: #fff; }
  .terminal-details .value.success { color: var(--success); }
  .terminal-details .value.error { color: var(--error); }

  .terminal-body {
    padding: 18px; min-height: 280px; max-height: 480px; overflow: auto;
    font-family: monospace; font-size: 13px; background: #000000; color: #c5c6c7;
  }
  pre { margin: 0; white-space: pre-wrap; }
  code { font-family: inherit; }

  .loading-state {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 12px; height: 200px; color: var(--muted);
  }
  .spinner {
    width: 24px; height: 24px; border: 2px solid rgba(201, 173, 147, 0.2);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  footer { text-align: center; padding: 48px; font-size: 13px; color: var(--muted); border-top: 1px solid rgba(var(--accent-rgb), 0.15); }
  footer a { color: var(--ink); text-decoration: none; transition: color 0.2s; font-weight: 600; margin: 0 10px; }
  footer a:hover { color: var(--accent); }
</style>
