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

<div class="shell">
  <form class="card" on:submit|preventDefault={submit}>
    <h1>Reset your password</h1>
    {#if sent}
      <p style="color:#10b981; font-size:14px; margin:0">Sent. Check your inbox — link expires in 1 hour.</p>
      <a href="/login" class="back">← Back to sign in</a>
    {:else}
      <label>Email<input type="email" bind:value={email} required /></label>
      {#if err}<p class="err">{err}</p>{/if}
      <button type="submit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
      <p class="alt">Remembered? <a href="/login">Sign in</a></p>
    {/if}
  </form>
</div>

<style>
  .shell { min-height: 100vh; display: grid; place-items: center; background: #fafafa; }
  .card { width: 100%; max-width: 360px; padding: 32px; background: #fff; border: 1px solid #e5e5e5; border-radius: 16px; display: flex; flex-direction: column; gap: 14px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 4px; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #6b7280; }
  input { height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid #e5e5e5; font-size: 14px; }
  button { height: 42px; border-radius: 10px; border: none; background: #7c3aed; color: #fff; font-weight: 600; cursor: pointer; }
  button:disabled { opacity: 0.6; cursor: progress; }
  .err { color: #dc2626; font-size: 13px; margin: 0; }
  .alt { font-size: 13px; color: #6b7280; text-align: center; margin: 0; }
  .alt a { color: #7c3aed; font-weight: 600; }
  .back { font-size: 13px; text-decoration: none; color: #7c3aed; text-align: center; }
</style>
