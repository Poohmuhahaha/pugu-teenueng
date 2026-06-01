<script lang="ts">
  import { onMount } from 'svelte';

  let userCode = '';
  let working = false;
  let result: 'idle' | 'approved' | 'denied' | 'error' = 'idle';
  let errorMsg = '';
  let signedIn = false;
  let checking = true;

  onMount(async () => {
    // Pre-fill from ?code=… so the CLI link lands here ready to go
    const sp = new URLSearchParams(window.location.search);
    userCode = sp.get('code') ?? '';

    // Verify we're authenticated. If not, send the user to /login and bounce back.
    try {
      const me = await fetch('/api/v1/me');
      signedIn = me.ok;
    } catch {
      signedIn = false;
    } finally {
      checking = false;
    }
  });

  async function submit(decision: 'approve' | 'deny') {
    if (!userCode.trim() || working) return;
    working = true;
    errorMsg = '';
    try {
      const res = await fetch('/api/auth/device/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_code: userCode.trim().toUpperCase(), decision }),
      });
      if (!res.ok) {
        errorMsg = (await res.text()) || `request failed (${res.status})`;
        result = 'error';
        return;
      }
      result = decision === 'approve' ? 'approved' : 'denied';
    } catch (e) {
      errorMsg = e instanceof Error ? e.message : String(e);
      result = 'error';
    } finally {
      working = false;
    }
  }

  function returnTo(): string {
    return encodeURIComponent(`/auth/device${userCode ? `?code=${userCode}` : ''}`);
  }
</script>

<svelte:head><title>Authorize Life Command · LifeOS</title></svelte:head>

<div class="device-shell">
  <div class="device-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      LifeOS
    </a>

    {#if checking}
      <h1>Loading…</h1>
    {:else if !signedIn}
      <h1>Sign in to continue</h1>
      <p class="sub">You need to be signed into LifeOS to authorize the CLI.</p>
      <a class="btn btn-block" href={`/login?return=${returnTo()}`}>Sign in</a>
    {:else if result === 'idle'}
      <h1>Authorize Life Command</h1>
      <p class="sub">
        Confirm the code shown in your terminal. Approving grants the CLI
        a session that's tied to <strong>your</strong> account.
      </p>

      <div class="field">
        <label class="field-label" for="user-code">Device code</label>
        <input
          id="user-code"
          class="user-code"
          bind:value={userCode}
          placeholder="ABCD-1234"
          autocomplete="off"
          spellcheck="false"
        />
      </div>

      {#if errorMsg}<p class="field-error">{errorMsg}</p>{/if}

      <div class="actions">
        <button class="btn btn-block" disabled={working || !userCode.trim()} on:click={() => submit('approve')}>
          {working ? 'Working…' : 'Approve'}
        </button>
        <button class="btn btn-secondary btn-block" disabled={working} on:click={() => submit('deny')}>
          Deny
        </button>
      </div>

      <p class="hint">
        Didn't run <code>life login --device</code>? Close this tab — nothing happens until you approve.
      </p>
    {:else if result === 'approved'}
      <h1>Approved</h1>
      <div class="badge badge-success" style="align-self:flex-start">
        Your terminal will pick up the session within a few seconds.
      </div>
      <p class="hint mt-md">You can close this tab.</p>
      <a class="btn btn-secondary btn-block mt-md" href="/">Back to LifeOS</a>
    {:else if result === 'denied'}
      <h1>Denied</h1>
      <p class="sub">The CLI request was denied. No session was issued.</p>
      <a class="btn btn-secondary btn-block" href="/">Back to LifeOS</a>
    {:else}
      <h1>Something went wrong</h1>
      <p class="field-error">{errorMsg}</p>
      <button class="btn btn-block" on:click={() => (result = 'idle')}>Try again</button>
    {/if}
  </div>
</div>

<style>
  .device-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: var(--c-canvas);
    padding: var(--s-xl);
  }
  .device-card {
    width: 100%;
    max-width: 440px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    gap: var(--s-md);
  }
  .auth-brand {
    display: inline-flex; align-items: center; gap: 8px;
    font: 600 20px/1 var(--font-display);
    letter-spacing: -0.04em;
    color: var(--c-ink);
    text-decoration: none;
    margin-bottom: var(--s-md);
  }
  .brand-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-ink); }
  h1 {
    font: 600 24px/1.2 var(--font-display);
    letter-spacing: -0.6px;
    margin: 0 0 var(--s-xs);
    color: var(--c-ink);
  }
  .sub { font-size: 14px; color: var(--c-muted); margin: 0 0 var(--s-md); }
  .user-code {
    font: 600 22px/1.2 var(--font-mono);
    letter-spacing: 0.18em;
    text-align: center;
    text-transform: uppercase;
    padding: 14px;
  }
  .actions { display: flex; flex-direction: column; gap: 8px; }
  .hint { font-size: 13px; color: var(--c-muted-soft); margin: var(--s-sm) 0 0; }
  .hint code { font-family: var(--font-mono); font-size: 12px; padding: 1px 6px; background: var(--c-surface-card); border-radius: 4px; }
</style>
