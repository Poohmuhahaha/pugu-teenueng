<script lang="ts">
  let email = '';
  let password = '';
  let err = '';
  let loading = false;

  async function submit() {
    err = '';
    loading = true;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { err = (await res.text()) || 'Login failed'; return; }
      window.location.href = '/';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Sign in — LifeOS Admin</title></svelte:head>

<div class="auth">
  <form class="auth-card stack" on:submit|preventDefault={submit}>
    <h1>Sign in</h1>
    <label><span class="label">Email</span>
      <input type="email" bind:value={email} required autocomplete="email" />
    </label>
    <label><span class="label">Password</span>
      <input type="password" bind:value={password} required autocomplete="current-password" />
    </label>
    {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
    <button type="submit" class="btn" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    <div style="display:flex; align-items:center; gap:10px; color:var(--muted); font-size:11px"><div style="flex:1; height:1px; background:var(--border)"></div>OR<div style="flex:1; height:1px; background:var(--border)"></div></div>
    <a href="/api/auth/google/start" class="btn btn-ghost" style="text-align:center; text-decoration:none">Continue with Google</a>
    <p style="font-size:13px; text-align:center; margin:0; color:var(--muted)">
      New? <a href="/signup" style="color:var(--accent)">Create an account</a>
      · Forgot? <a href="/forgot" style="color:var(--accent)">Reset password</a>
    </p>
  </form>
</div>

<style>
  .auth { min-height: 100vh; display: grid; place-items: center; }
  .auth-card { width: 100%; max-width: 360px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  label { display: flex; flex-direction: column; gap: 6px; }
  input { width: 100%; height: 40px; padding: 0 12px; }
</style>
