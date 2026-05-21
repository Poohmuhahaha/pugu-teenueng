<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';

  const ROLES = ['owner', 'admin', 'editor', 'member', 'viewer'] as const;
  const ACTIONS = ['read', 'create', 'update', 'delete'] as const;
  type Role = typeof ROLES[number];
  type Action = typeof ACTIONS[number];

  let perms: Record<Role, Set<Action>> = {
    owner: new Set(['read', 'create', 'update', 'delete']),
    admin: new Set(['read', 'create', 'update', 'delete']),
    editor: new Set(['read', 'create', 'update']),
    member: new Set(['read']),
    viewer: new Set(['read']),
  };
  let typeName = '';
  let loading = true;
  let saving = false;
  let saved = false;

  $: ctId = parseInt($page.params.id);

  async function load() {
    loading = true;
    const [t, p] = await Promise.all([
      fetch('/api/v1/content-types').then((r) => r.json()),
      fetch(`/api/v1/content-types/${ctId}/permissions`).then((r) => r.json()),
    ]);
    const found = (t.data as Array<{ id: number; name: string }>).find((x) => x.id === ctId);
    typeName = found?.name ?? '';

    if ((p.data as Array<{ role: Role; actions: Action[] }>).length > 0) {
      perms = Object.fromEntries(ROLES.map((r) => [r, new Set<Action>()])) as Record<Role, Set<Action>>;
      for (const row of p.data) {
        perms[row.role] = new Set(row.actions);
      }
    }
    loading = false;
  }

  function toggle(role: Role, action: Action) {
    const set = new Set(perms[role]);
    if (set.has(action)) set.delete(action); else set.add(action);
    perms[role] = set;
    perms = perms; // trigger reactivity
  }

  async function save() {
    saving = true;
    saved = false;
    const payload = ROLES.map((role) => ({ role, actions: [...perms[role]] }));
    const res = await fetch(`/api/v1/content-types/${ctId}/permissions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    saving = false;
    if (res.ok) {
      saved = true;
      setTimeout(() => (saved = false), 2000);
    }
  }

  onMount(load);
</script>

<div class="stack">
  <a href="/" style="color:var(--muted); font-size:13px; text-decoration:none">← Content Types</a>
  <h2 style="margin:0">Permissions — {typeName}</h2>
  <p style="color:var(--muted); font-size:13px; margin:0">Check a cell to grant that role the action on this content type. Falls back to workspace role defaults if all rows are empty.</p>

  {#if loading}
    <p style="color:var(--muted)">Loading…</p>
  {:else}
    <div class="card">
      <table class="matrix">
        <thead>
          <tr>
            <th>Role</th>
            {#each ACTIONS as a}<th>{a}</th>{/each}
          </tr>
        </thead>
        <tbody>
          {#each ROLES as r}
            <tr>
              <td style="font-weight:600; text-transform:capitalize">{r}</td>
              {#each ACTIONS as a}
                <td style="text-align:center">
                  <input type="checkbox" checked={perms[r].has(a)} on:change={() => toggle(r, a)} />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="h-row">
      <button class="btn" on:click={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      {#if saved}<span style="color:#10b981; font-size:13px">Saved ✓</span>{/if}
    </div>
  {/if}
</div>

<style>
  .matrix { width: 100%; border-collapse: collapse; }
  .matrix th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--muted); padding: 10px 12px; border-bottom: 1px solid var(--border); }
  .matrix td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid var(--border); }
  .matrix tr:last-child td { border-bottom: none; }
</style>
