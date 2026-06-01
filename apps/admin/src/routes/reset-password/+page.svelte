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

<svelte:head><title>Set new password · LifeOS Admin</title></svelte:head>

<div class="auth-shell">
  <div class="auth-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      LifeOS Admin
    </a>
    <h1>Set a new password</h1>
    <p class="auth-sub">Choose something memorable. Minimum 8 characters.</p>

    {#if done}
      <div class="badge badge-success" style="align-self: flex-start">Password updated. You can sign in now.</div>
      <a href="/login" class="btn btn-block mt-md">Sign in</a>
    {:else}
      <form on:submit|preventDefault={submit}>
        <div class="field">
          <label class="field-label" for="pw">New password</label>
          <input id="pw" type="password" bind:value={password} required minlength="8" autocomplete="new-password" />
        </div>
        <div class="field">
          <label class="field-label" for="confirm">Confirm</label>
          <input id="confirm" type="password" bind:value={confirm} required minlength="8" autocomplete="new-password" />
        </div>
        {#if err}<p class="field-error">{err}</p>{/if}
        <button type="submit" class="btn btn-block" disabled={loading || !token}>{loading ? 'Updating…' : 'Update password'}</button>
      </form>
    {/if}
  </div>
</div>
