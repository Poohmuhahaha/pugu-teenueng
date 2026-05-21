<script lang="ts">
  import { onMount } from 'svelte';

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
      workspaces = body.memberships.map((m: { workspace: { id: number; name: string; slug: string }; role: string }) => ({
        id: m.workspace.id, name: m.workspace.name, slug: m.workspace.slug, role: m.role,
      }));
      activeId = body.actor.workspaceId ?? null;
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
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    {#if open}
      <div class="menu" role="menu">
        {#each workspaces as w (w.id)}
          <button class="item" class:active={w.id === activeId} on:click={() => switchTo(w.id)}>
            <span>{w.name}</span><span class="role">{w.role}</span>
          </button>
        {/each}
        <div class="divider"></div>
        {#if creating}
          <form on:submit|preventDefault={create} class="new-form">
            <input bind:value={newName} placeholder="New workspace name" autofocus />
            <button type="submit">Create</button>
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
  .ws-btn { display: flex; align-items: center; gap: 8px; padding: 6px 10px; border-radius: 8px; background: var(--bg); border: 1px solid var(--border); color: var(--ink); font-size: 13px; font-weight: 600; cursor: pointer; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); }
  .name { max-width: 160px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .menu { position: absolute; top: calc(100% + 4px); left: 0; min-width: 240px; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12); padding: 6px; z-index: 50; }
  .item { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 8px 10px; background: transparent; border: none; border-radius: 6px; color: var(--ink); font-size: 13px; cursor: pointer; text-align: left; }
  .item:hover { background: var(--surface); }
  .item.active { background: rgba(124,58,237,0.08); color: var(--accent); font-weight: 600; }
  .role { font-size: 10px; text-transform: uppercase; color: var(--muted); letter-spacing: 0.06em; }
  .divider { height: 1px; background: var(--border); margin: 4px 0; }
  .new-form { display: flex; gap: 6px; padding: 6px 4px; }
  .new-form input { flex: 1; height: 32px; padding: 0 10px; border-radius: 6px; border: 1px solid var(--border); font-size: 13px; }
  .new-form button { height: 32px; padding: 0 12px; border-radius: 6px; border: none; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
</style>
