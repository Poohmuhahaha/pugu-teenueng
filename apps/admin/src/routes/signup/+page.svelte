<script lang="ts">
  export let params: any = undefined;
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

<svelte:head><title>Create account · QuestPage Admin</title></svelte:head>

<div class="auth-shell">
  <div class="auth-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      QuestPage Admin
    </a>
    <h1>Create your Dashboard</h1>
    <p class="auth-sub">Get started with the QuestPage Admin console.</p>

    <form on:submit|preventDefault={submit}>
      <div class="field">
        <label class="field-label" for="name">Name</label>
        <input id="name" bind:value={name} required autocomplete="name" />
      </div>
      <div class="field">
        <label class="field-label" for="email">Email</label>
        <input id="email" type="email" bind:value={email} required autocomplete="email" />
      </div>
      <div class="field">
        <label class="field-label" for="password">Password</label>
        <input id="password" type="password" bind:value={password} required minlength="8" autocomplete="new-password" />
        <span class="field-hint">At least 8 characters.</span>
      </div>
      {#if err}<p class="field-error">{err}</p>{/if}
      <button type="submit" class="btn btn-block" disabled={loading}>{loading ? 'Creating…' : 'Create account'}</button>
    </form>

    <p class="auth-foot">Have an account? <a href="/login">Sign in</a></p>
  </div>
</div>
