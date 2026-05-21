<script lang="ts">
  import { onMount } from 'svelte';

  interface Member { userId: number; role: string; name: string; email: string; }
  interface Me { workspace: { id: number; role: string }; workspaces: Array<{ id: number; name: string; slug: string; role: string }>; user: { id: number; email: string }; }

  let me: Me | null = null;
  let members: Member[] = [];
  let renameValue = '';
  let transferTarget = '';
  let err = '';
  let loading = true;
  let inviteEmail = '';
  let inviteRole: 'admin' | 'editor' | 'member' | 'viewer' = 'member';
  let inviting = false;
  let inviteMsg = '';

  async function load() {
    loading = true;
    const meRes = await fetch('/api/v1/me');
    if (meRes.ok) {
      const meBody = await meRes.json();
      me = {
        workspace: { id: meBody.actor?.workspaceId, role: meBody.actor?.role },
        workspaces: (meBody.memberships ?? []).map((m: { workspace: { id: number; name: string; slug: string }; role: string }) => ({ ...m.workspace, role: m.role })),
        user: meBody.user
      };
      const active = me.workspaces.find((w) => w.id === me!.workspace.id);
      renameValue = active?.name ?? '';
    }
    if (me) {
      const mRes = await fetch(`/api/v1/workspaces/${me.workspace.id}/members`);
      if (mRes.ok) members = (await mRes.json());
    }
    loading = false;
  }

  async function rename() {
    err = '';
    if (!me) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: renameValue }),
    });
    if (!res.ok) { err = await res.text(); return; }
    await load();
  }

  async function leave() {
    if (!me) return;
    if (!confirm('Leave this workspace? You\'ll lose access immediately.')) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}/leave`, { method: 'POST' });
    if (!res.ok) { err = await res.text(); return; }
    window.location.href = '/';
  }

  async function transfer() {
    if (!me || !transferTarget) return;
    if (!confirm(`Transfer ownership to user #${transferTarget}? You will be demoted to admin.`)) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(transferTarget) }),
    });
    if (!res.ok) { err = await res.text(); return; }
    await load();
  }

  async function invite() {
    if (!me || !inviteEmail.trim()) return;
    inviting = true;
    inviteMsg = '';
    err = '';
    try {
      const res = await fetch(`/api/v1/workspaces/${me.workspace.id}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (!res.ok) { err = await res.text(); return; }
      const body = await res.json();
      inviteMsg = body.status === 'invited'
        ? `Invite email sent to ${inviteEmail}. They will join after signing up.`
        : `${body.name ?? inviteEmail} added as ${body.role}.`;
      inviteEmail = '';
      await load();
    } finally { inviting = false; }
  }

  async function changeRole(m: Member, role: string) {
    if (!me) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}/members`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: m.userId, role }),
    });
    if (res.ok) await load();
    else err = await res.text();
  }

  async function removeMember(m: Member) {
    if (!me) return;
    if (!confirm(`Remove ${m.name} (${m.email}) from this workspace?`)) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}/members`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: m.userId }),
    });
    if (res.ok) await load();
    else err = await res.text();
  }

  async function destroyWorkspace() {
    if (!me) return;
    const active = me.workspaces.find((w) => w.id === me!.workspace.id);
    if (!confirm(`Permanently delete "${active?.name}"? Removes all entries, content types, webhooks, API keys, billing.`)) return;
    const res = await fetch(`/api/v1/workspaces/${me.workspace.id}`, { method: 'DELETE' });
    if (!res.ok) { err = await res.text(); return; }
    window.location.href = '/';
  }

  onMount(load);
</script>

<div class="stack">
  <h2 style="margin:0">Workspace settings</h2>

  {#if loading || !me}
    <p style="color:var(--muted)">Loading…</p>
  {:else}
    {@const isOwner = me.workspace.role === 'owner'}
    {@const isAdmin = isOwner || me.workspace.role === 'admin'}

    <div class="card stack">
      <div class="label">Rename workspace {isAdmin ? '' : '(admin only)'}</div>
      <div class="h-row">
        <input bind:value={renameValue} disabled={!isAdmin} style="flex:1" />
        <button class="btn" on:click={rename} disabled={!isAdmin}>Save</button>
      </div>
    </div>

    <div class="card stack">
      <div class="label">Members ({members.length})</div>

      {#if isAdmin}
        <div class="invite-row">
          <input bind:value={inviteEmail} type="email" placeholder="invite@example.com" style="flex:1" />
          <select bind:value={inviteRole}>
            <option value="viewer">viewer</option>
            <option value="member">member</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
          <button class="btn" on:click={invite} disabled={inviting || !inviteEmail.trim()}>{inviting ? '…' : 'Invite'}</button>
        </div>
        {#if inviteMsg}<p style="color:#10b981; font-size:13px; margin:4px 0">{inviteMsg}</p>{/if}
      {/if}

      <table class="t">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th>{#if isAdmin}<th></th>{/if}</tr></thead>
        <tbody>
          {#each members as m (m.userId)}
            <tr>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>
                {#if isAdmin && m.userId !== me.user.id}
                  <select value={m.role} on:change={(e) => changeRole(m, e.target.value)}>
                    <option value="viewer">viewer</option>
                    <option value="member">member</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                    {#if isOwner}<option value="owner">owner</option>{/if}
                  </select>
                {:else}{m.role}{/if}
              </td>
              {#if isAdmin}
                <td style="text-align:right">
                  {#if m.userId !== me.user.id}<button class="link danger" on:click={() => removeMember(m)}>Remove</button>{/if}
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if isOwner}
      <div class="card stack">
        <div class="label">Transfer ownership</div>
        <div style="font-size:12px; color:var(--muted)">After transfer you will become an admin. Enter the user id of an existing member.</div>
        <div class="h-row">
          <input bind:value={transferTarget} placeholder="user id" type="number" min="1" style="flex:1" />
          <button class="btn" on:click={transfer}>Transfer</button>
        </div>
      </div>
    {/if}

    <div class="card stack" style="border-color:#ef4444">
      <div class="label" style="color:#ef4444">Danger zone</div>
      <div class="h-row" style="justify-content: space-between">
        <div>
          <div style="font-weight:600">Leave workspace</div>
          <div style="font-size:12px; color:var(--muted)">Remove your membership. Sole owner cannot leave — transfer or delete.</div>
        </div>
        <button class="btn btn-ghost" on:click={leave}>Leave</button>
      </div>
      {#if isOwner}
        <div class="h-row" style="justify-content: space-between; margin-top:8px">
          <div>
            <div style="font-weight:600; color:#ef4444">Delete workspace</div>
            <div style="font-size:12px; color:var(--muted)">Permanent. Requires no other members.</div>
          </div>
          <button class="btn" style="background:#ef4444" on:click={destroyWorkspace}>Delete</button>
        </div>
      {/if}
    </div>

    {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
  {/if}
</div>

<style>
  .t { width:100%; border-collapse:collapse; }
  .t th { text-align:left; font-size:11px; text-transform:uppercase; color:var(--muted); padding:6px 0; border-bottom:1px solid var(--border); }
  .t td { padding:8px 0; font-size:13px; border-bottom:1px solid var(--border); }
  .t tr:last-child td { border-bottom: none; }
  .invite-row { display: flex; gap: 8px; align-items: center; padding-bottom: 8px; border-bottom: 1px dashed var(--border); margin-bottom: 8px; }
  .invite-row select { width: 110px; }
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--accent); }
  .link.danger { color: #dc2626; }
  .link:hover { text-decoration: underline; }
</style>
