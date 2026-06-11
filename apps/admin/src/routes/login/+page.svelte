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

<svelte:head><title>Sign in · QuestPage Admin</title></svelte:head>

<div class="auth-shell">
  <div class="auth-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      QuestPage Admin
    </a>
    <h1>Sign in</h1>
    <p class="auth-sub">Manage quest types, entries, Workspace Seals, and more.</p>

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

    <div class="divider-or"><span>OR</span></div>
    <a href="/api/auth/google/start" class="btn btn-secondary btn-block">Continue with Google</a>

    <p class="auth-foot">
      New? <a href="/signup">Create an account</a> · <a href="/forgot">Forgot?</a>
    </p>
  </div>
</div>

<style>
  .divider-or {
    display: flex; align-items: center;
    margin: var(--s-md) 0;
    color: var(--c-muted-soft);
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.08em;
  }
  .divider-or::before, .divider-or::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--c-hairline);
  }
  .divider-or span { padding: 0 var(--s-sm); }
</style>
