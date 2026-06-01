<script lang="ts">
  import { springPress } from "@lifeos/ui/motion";
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

<svelte:head><title>Reset password · LifeOS Admin</title></svelte:head>

<div class="auth-shell">
  <div class="auth-card">
    <a class="auth-brand" href="/">
      <span class="brand-dot"></span>
      LifeOS Admin
    </a>
    <h1>Reset your password</h1>
    <p class="auth-sub">Enter your email — we'll send a one-time reset link.</p>

    {#if sent}
      <div class="badge badge-success" style="align-self: flex-start">
        If <strong style="color: inherit; margin: 0 4px">{email}</strong> is registered, we sent a reset link.
      </div>
      <p class="field-hint mt-xs">Link expires in 1 hour.</p>
      <a href="/login" class="btn btn-secondary btn-block mt-md">Back to sign in</a>
    {:else}
      <form on:submit|preventDefault={submit}>
        <div class="field">
          <label class="field-label" for="email">Email</label>
          <input id="email" type="email" bind:value={email} required autocomplete="email" />
        </div>
        {#if err}<p class="field-error">{err}</p>{/if}
        <button type="submit" class="btn btn-block" use:springPress disabled={loading}>{loading ? 'Sending…' : 'Send reset link'}</button>
      </form>
      <p class="auth-foot">Remembered? <a href="/login">Sign in</a></p>
    {/if}
  </div>
</div>
