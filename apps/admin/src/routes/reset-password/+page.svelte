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

<svelte:head><title>Set new password — LifeOS Admin</title></svelte:head>

<div class="auth">
  <form class="auth-card stack" on:submit|preventDefault={submit}>
    <h1>Set a new password</h1>
    {#if done}
      <p style="color:#10b981; font-size:14px; margin:0">Password updated. You can sign in now.</p>
      <a href="/login" class="btn" style="text-align:center; text-decoration:none">Sign in</a>
    {:else}
      <label><span class="label">New password (min 8)</span><input type="password" bind:value={password} required minlength="8" autocomplete="new-password" /></label>
      <label><span class="label">Confirm</span><input type="password" bind:value={confirm} required minlength="8" autocomplete="new-password" /></label>
      {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
      <button type="submit" class="btn" disabled={loading || !token}>{loading ? 'Updating…' : 'Update password'}</button>
    {/if}
  </form>
</div>

<style>
  .auth { min-height: 100vh; display: grid; place-items: center; }
  .auth-card { width: 100%; max-width: 360px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  label { display: flex; flex-direction: column; gap: 6px; }
  input { width: 100%; height: 40px; padding: 0 12px; }
</style>
