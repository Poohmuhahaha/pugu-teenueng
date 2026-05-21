<script lang="ts">
  let email = '';
  let sent = false;
  let loading = false;
  let err = '';

  async function submit() {
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { err = await res.text(); return; }
      sent = true;
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Reset password — LifeOS Admin</title></svelte:head>

<div class="auth">
  <form class="auth-card stack" on:submit|preventDefault={submit}>
    <h1>Reset your password</h1>
    {#if sent}
      <p style="color:#10b981; font-size:14px; margin:0">
        If <strong>{email}</strong> is registered, we sent a reset link. Check your inbox.
      </p>
      <p style="font-size:12px; color:var(--muted); margin:0">Link expires in 1 hour.</p>
      <a href="/login" class="btn btn-ghost" style="text-align:center; text-decoration:none">Back to sign in</a>
    {:else}
      <p style="color:var(--muted); font-size:13px; margin:0">Enter your email — we'll send a one-time reset link.</p>
      <label><span class="label">Email</span><input type="email" bind:value={email} required autocomplete="email" /></label>
      {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
      <button type="submit" class="btn" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
      <p style="font-size:13px; text-align:center; margin:0; color:var(--muted)">Remembered? <a href="/login" style="color:var(--accent)">Sign in</a></p>
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
