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
  .shell { min-height: 100vh; display: grid; place-items: center; background: var(--bg); }
  .card { width: 100%; max-width: 360px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow); }
  h1 { font-size: 22px; font-weight: 800; margin: 0 0 4px; color: var(--ink); letter-spacing: -0.02em; }
  label { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--muted); font-weight: 500; }
  input { height: 42px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--ink); font-size: 14px; transition: all 0.2s; }
  input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(var(--accent-rgb), 0.15); }
  button { height: 42px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.05); background: var(--accent); color: #000000; font-weight: 700; cursor: pointer; transition: all 0.2s; }
  button:hover:not(:disabled) { background: #554940; color: #ffffff; border-color: transparent; }
  button:disabled { opacity: 0.6; cursor: progress; }
  .err { color: #dc2626; font-size: 13px; margin: 0; }
  .alt { font-size: 13px; color: var(--muted); text-align: center; margin: 0; }
  .alt a { color: var(--accent); font-weight: 600; text-decoration: none; }
  .alt a:hover { text-decoration: underline; }
</style>
