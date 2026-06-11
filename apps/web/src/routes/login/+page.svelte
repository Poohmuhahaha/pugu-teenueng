<script lang="ts">
  export let params: any = undefined;
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
      if (!res.ok) { err = await res.text(); return; }
      const sp = new URLSearchParams(window.location.search);
      const ret = sp.get('return');
      // Only honor relative returns so we can't be tricked into bouncing to evil.com.
      window.location.href = ret && ret.startsWith('/') && !ret.startsWith('//') ? ret : '/';
    } finally { loading = false; }
  }
</script>

<svelte:head><title>Sign in · QuestPage</title></svelte:head>

<div class="auth-shell">
  <div class="auth-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      QuestPage
    </a>
    <h1>Sign in</h1>
    <p class="auth-sub">Welcome back. Enter your credentials to continue.</p>

    <form on:submit|preventDefault={submit}>
      <div class="field">
        <label class="field-label" for="email">Email</label>
        <input id="email" type="email" bind:value={email} required autocomplete="email" />
      </div>
      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input id="password" type="password" bind:value={password} required autocomplete="current-password" />
      </div>
      {#if err}<p class="field-error">{err}</p>{/if}
      <button type="submit" class="btn btn-block" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
    </form>

    <p class="auth-foot">
      New here? <a href="/signup">Create an account</a> · <a href="/forgot">Forgot password?</a>
    </p>
  </div>
</div>
