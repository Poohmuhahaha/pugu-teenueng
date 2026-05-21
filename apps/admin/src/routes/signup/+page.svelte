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
      if (!res.ok) { err = (await res.text()) || 'Signup failed'; return; }
      window.location.href = '/';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Create account — LifeOS Admin</title></svelte:head>

<div class="auth">
  <form class="auth-card stack" on:submit|preventDefault={submit}>
    <h1>Create your workspace</h1>
    <label><span class="label">Name</span><input bind:value={name} required autocomplete="name" /></label>
    <label><span class="label">Email</span><input type="email" bind:value={email} required autocomplete="email" /></label>
    <label><span class="label">Password (min 8)</span><input type="password" bind:value={password} required minlength="8" autocomplete="new-password" /></label>
    {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
    <button type="submit" class="btn" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
    <p style="font-size:13px; text-align:center; margin:0; color:var(--muted)">Have an account? <a href="/login" style="color:var(--accent)">Sign in</a></p>
  </form>
</div>

<style>
  .auth { min-height: 100vh; display: grid; place-items: center; }
  .auth-card { width: 100%; max-width: 360px; padding: 32px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; }
  label { display: flex; flex-direction: column; gap: 6px; }
  input { width: 100%; height: 40px; padding: 0 12px; }
</style>
