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
      <p style="color:#10b981; font-size:14px; margin:0">Password updated. You can sign in now.</p>
      <a href="/login" class="primary" style="text-align:center; text-decoration:none">Sign in</a>
    {:else}
      <label>New password (min 8)<input type="password" bind:value={password} required minlength="8" /></label>
      <label>Confirm<input type="password" bind:value={confirm} required minlength="8" /></label>
      {#if err}<p class="err">{err}</p>{/if}
      <button type="submit" disabled={loading || !token}>{loading ? 'Updating…' : 'Update password'}</button>
    {/if}
  </form>
</div>

<style>
  .shell { min-height: 100vh; display: grid; place-items: center; background: #fafafa; }
  .card { width: 100%; max-width: 360px; padding: 32px; background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; display: flex; flex-direction: column; gap: 14px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #6b7280; }
  input { height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid #e5e5e5; font-size: 14px; }
  button, .primary { height: 42px; border-radius: 10px; border: none; background: #7c3aed; color: #fff; font-weight: 600; cursor: pointer; padding: 0 20px; }
  button:disabled { opacity: 0.6; cursor: progress; }
  .err { color: #dc2626; font-size: 13px; margin: 0; }
</style>
