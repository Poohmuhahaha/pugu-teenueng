<script lang="ts">
  import { onMount } from 'svelte';
  let password = '';
  let confirm = '';
  let token = '';
  let done = false;
  let loading = false;
  let err = '';

  onMount(() => {
    const sp = new URLSearchParams(window.location.search);
    token = sp.get('token') ?? '';
    if (!token) err = 'Missing or invalid reset token.';
  });

  async function submit() {
    err = '';
    if (password !== confirm) { err = 'Passwords do not match.'; return; }
    loading = true;
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) { err = await res.text(); return; }
      done = true;
    } finally { loading = false; }
  }
</script>

<div class="shell">
  <form class="card" on:submit|preventDefault={submit}>
    <h1>Set a new password</h1>
    {#if done}
      <p style="color: var(--accent-kpi, #879a77); font-size: 14px; font-weight: 600; margin: 0">Password updated. You can sign in now.</p>
      <a href="/login" class="primary" style="text-align: center; text-decoration: none; display: flex; align-items: center; justify-content: center;">Sign in</a>
    {:else}
      <label>New password (min 8)<input type="password" bind:value={password} required minlength="8" /></label>
      <label>Confirm<input type="password" bind:value={confirm} required minlength="8" /></label>
      {#if err}<p class="err">{err}</p>{/if}
      <button type="submit" disabled={loading || !token}>{loading ? 'Updating…' : 'Update password'}</button>
    {/if}
  </form>
</div>

<style>
  .shell { min-height: 100vh; display: grid; place-items: center; background: var(--bg); }
  .card { width: 100%; max-width: 360px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow); }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; color: var(--ink); letter-spacing: -0.02em; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); font-weight: 500; }
  input { height: 42px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--ink); font-size: 14px; transition: all 0.2s; }
  input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.15); }
  button, .primary { height: 42px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); background: var(--accent); color: #000000; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0 20px; transition: all 0.2s; }
  button:hover:not(:disabled), .primary:hover { background: #554940; color: #ffffff; border-color: transparent; }
  button:disabled { opacity: 0.6; cursor: progress; }
  .err { color: #dc2626; font-size: 13px; margin: 0; }
</style>
