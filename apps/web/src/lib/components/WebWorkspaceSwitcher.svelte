<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  interface Workspace { id: number; name: string; slug: string; role: string; }

  let workspaces: Workspace[] = [];
  let activeId: number | null = null;
  let open = false;
  let creating = false;
  let newName = '';

  async function load() {
    const meRes = await fetch('/api/v1/me');
    if (meRes.ok) {
      const body = await meRes.json();
      workspaces = (body.memberships ?? []).map((m: { workspace: { id: number; name: string; slug: string }; role: string }) => ({
        id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role,
      }));
      activeId = body.actor?.workspaceId ?? null;
    }
  }

  async function switchTo(id: number) {
    open = false;
    await fetch(`/api/v1/workspaces/${id}/switch`, { method: 'POST' });
    location.reload();
  }

  async function create() {
    if (!newName.trim()) return;
    const res = await fetch('/api/v1/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const ws = await res.json();
      await switchTo(ws.id);
    }
  }

  $: active = workspaces.find((w) => w.id === activeId) ?? null;

  onMount(load);
</script>

{#if workspaces.length > 0}
  <div class="ws" class:open>
    <button class="ws-btn" on:click={() => (open = !open)} aria-expanded={open}>
      <span class="dot"></span>
      <span class="name">{active?.name ?? 'Choose'}</span>
      <svg
        class="chev"
        class:open
        width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
      ><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    {#if open}
      <div
        class="menu"
        role="menu"
        in:fly={{ y: -6, duration: 180, easing: quintOut }}
        out:fade={{ duration: 100 }}
      >
        {#each workspaces as w (w.id)}
          <button class="item" class:active={w.id === activeId} on:click={() => switchTo(w.id)}>
            <span>{w.name}</span><span class="role">{w.role}</span>
          </button>
        {/each}
        <div class="divider"></div>
        {#if creating}
          <form on:submit|preventDefault={create} class="new-form">
            <!-- svelte-ignore a11y-autofocus -->
            <input bind:value={newName} placeholder="New workspace name" autofocus />
            <button type="submit" class="btn btn-sm">Create</button>
          </form>
        {:else}
          <button class="item" on:click={() => (creating = true)}><span>+ New workspace</span></button>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .ws { position: relative; }
  .ws-btn {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 12px;
    border-radius: var(--r-md);
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    color: var(--c-ink);
    font: 500 13px/1.4 var(--font-body);
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
  }
  .ws-btn:hover { border-color: var(--c-ink); background: var(--c-surface-soft); }
  .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--c-brand-accent); }
  .chev { transition: transform 0.18s ease; }
  .chev.open { transform: rotate(180deg); }
  .name { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
  .menu {
    position: absolute; top: calc(100% + 6px); left: 0;
    min-width: 240px;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow-md);
    padding: 6px;
    z-index: 50;
  }
  .item {
    display: flex; align-items: center; justify-content: space-between;
    width: 100%; padding: 8px 12px;
    background: transparent;
    border: none;
    border-radius: var(--r-md);
    color: var(--c-ink);
    font: 500 13px/1.4 var(--font-body);
    cursor: pointer; text-align: left;
    transition: background 0.15s;
  }
  .item:hover { background: var(--c-surface-soft); }
  .item.active { background: var(--c-surface-card); font-weight: 600; }
  .role { font-size: 11px; font-weight: 500; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .divider { height: 1px; background: var(--c-hairline-soft); margin: 6px 0; }
  .new-form { display: flex; gap: 6px; padding: 6px 4px; }
  .new-form input { flex: 1; height: 32px; padding: 0 10px; font-size: 13px; border-radius: var(--r-md); }
</style>
