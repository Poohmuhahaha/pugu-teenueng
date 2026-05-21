<script lang="ts">
  let name = '';
  let email = '';
  let password = '';
  let err = '';
  let loading = false;

  async function submit() {
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) { err = await res.text(); return; }
      window.location.href = '/';
    } finally { loading = false; }
  }
</script>

<div class="shell">
  <form class="card" on:submit|preventDefault={submit}>
    <h1>Create your workspace</h1>
    <label>Name<input bind:value={name} required /></label>
    <label>Email<input type="email" bind:value={email} required /></label>
    <label>Password (min 8)<input type="password" bind:value={password} required minlength="8" /></label>
    {#if err}<p class="err">{err}</p>{/if}
    <button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
    <p class="alt">Have an account? <a href="/login">Sign in</a></p>
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
</style>
