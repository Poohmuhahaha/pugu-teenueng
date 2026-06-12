<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

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

  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(members.length / itemsPerPage) || 1;
  $: paginatedMembers = members.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let modalState: { action: 'leave' | 'transfer' | 'remove' | 'delete' | null, member?: Member } = { action: null };

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

  async function confirmModalAction() {
    if (modalState.action === 'leave') {
      const res = await fetch(`/api/v1/workspaces/${me?.workspace.id}/leave`, { method: 'POST' });
      if (!res.ok) { err = await res.text(); } else { window.location.href = '/'; }
    } else if (modalState.action === 'transfer') {
      const res = await fetch(`/api/v1/workspaces/${me?.workspace.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parseInt(transferTarget) }),
      });
      if (!res.ok) { err = await res.text(); } else { await load(); }
    } else if (modalState.action === 'remove' && modalState.member) {
      const res = await fetch(`/api/v1/workspaces/${me?.workspace.id}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: modalState.member.userId }),
      });
      if (res.ok) await load(); else err = await res.text();
    } else if (modalState.action === 'delete') {
      const res = await fetch(`/api/v1/workspaces/${me?.workspace.id}`, { method: 'DELETE' });
      if (!res.ok) { err = await res.text(); } else { window.location.href = '/'; }
    }
    modalState = { action: null };
  }

  async function leave() {
    if (!me) return;
    modalState = { action: 'leave' };
  }

  async function transfer() {
    if (!me || !transferTarget) return;
    modalState = { action: 'transfer' };
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
    modalState = { action: 'remove', member: m };
  }

  async function destroyWorkspace() {
    if (!me) return;
    modalState = { action: 'delete' };
  }

  onMount(load);
</script>

<div class="stack">
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
    <h2>Workspace Settings</h2>
  </div>

  {#if loading || !me}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else}
    {@const isOwner = me.workspace.role === 'owner'}
    {@const isAdmin = isOwner || me.workspace.role === 'admin'}

    <div class="stack">
      <div>
        <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none;">Rename workspace {isAdmin ? '' : '(admin only)'}</div>
        <div style="font-size:13px; color:var(--c-muted); margin-bottom: 12px;">Update your workspace's display name.</div>
      </div>
      <div class="h-row">
        <input bind:value={renameValue} disabled={!isAdmin} style="flex:1; max-width: 400px;" />
        <button class="btn" on:click={rename} disabled={!isAdmin}>Save</button>
      </div>
    </div>

    <hr class="divider" />

    <div class="stack">
      <div style="display: flex; align-items: center; justify-content: space-between;">
        <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none; margin: 0;">Members ({members.length})</div>
      </div>
      <div style="font-size:13px; color:var(--c-muted); margin-bottom: 4px;">Manage who has access to this workspace.</div>

      {#if isAdmin}
        <div class="invite-row" style="background: var(--c-surface-soft); padding: 12px; border-radius: 4px; border: 1px solid var(--c-hairline); margin-bottom: 16px;">
          <input bind:value={inviteEmail} type="email" placeholder="invite@example.com" style="flex:1" />
          <select bind:value={inviteRole}>
            <option value="viewer">viewer</option>
            <option value="member">member</option>
            <option value="editor">editor</option>
            <option value="admin">admin</option>
          </select>
          <button class="btn" on:click={invite} disabled={inviting || !inviteEmail.trim()}>{inviting ? '…' : 'Invite'}</button>
        </div>
        {#if inviteMsg}<p style="color:#10b981; font-size:13px; margin-top:-8px; margin-bottom:8px;">{inviteMsg}</p>{/if}
      {/if}

      <table class="t">
        <thead><tr><th>Name</th><th>Email</th><th>Role</th>{#if isAdmin}<th></th>{/if}</tr></thead>
        <tbody>
          {#each paginatedMembers as m (m.userId)}
            <tr>
              <td>{m.name}</td>
              <td>{m.email}</td>
              <td>
                {#if isAdmin && m.userId !== me.user.id}
                  <select value={m.role} on:change={(e) => changeRole(m, e.currentTarget.value)}>
                    <option value="viewer">viewer</option>
                    <option value="member">member</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
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
      <Pagination bind:currentPage {totalPages} />
    </div>

    {#if isOwner}
      <hr class="divider" />
      <div class="stack">
        <div>
          <div class="label" style="font-size: 14px; font-weight: 600; color: var(--c-ink); text-transform: none;">Transfer ownership</div>
          <div style="font-size:13px; color:var(--c-muted); margin-bottom: 12px;">Transfer your workspace ownership to another member. You will become an admin.</div>
        </div>
        <div class="h-row">
          <select bind:value={transferTarget} style="flex:1; max-width: 250px;">
            <option value="" disabled>Select a member...</option>
            {#each members.filter(m => m.userId !== me.user.id) as m}
              <option value={m.userId}>{m.name || m.email}</option>
            {/each}
          </select>
          <button class="btn" on:click={transfer} disabled={!transferTarget}>Transfer</button>
        </div>
      </div>
    {/if}

    <hr class="divider" />

    <div class="stack">
      <div class="label" style="font-size: 14px; font-weight: 600; color: #ef4444; text-transform: none; margin-bottom: 8px;">Danger zone</div>
      
      <div class="h-row" style="justify-content: space-between; background: rgba(239, 68, 68, 0.04); padding: 16px; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px;">
        <div>
          <div style="font-weight:600; font-size: 14px;">Leave workspace</div>
          <div style="font-size:13px; color:var(--c-muted); margin-top: 2px;">Remove your access to this workspace. Owners cannot leave until they transfer ownership.</div>
        </div>
        <button class="btn btn-ghost" on:click={leave} style="color: #ef4444; font-weight: 600;">Leave Workspace</button>
      </div>

      {#if isOwner}
        <div class="h-row" style="justify-content: space-between; background: rgba(239, 68, 68, 0.04); padding: 16px; border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 4px; margin-top: 4px;">
          <div>
            <div style="font-weight:600; font-size: 14px; color:#ef4444">Delete workspace</div>
            <div style="font-size:13px; color:var(--c-muted); margin-top: 2px;">Permanently delete this workspace and all its data. This cannot be undone.</div>
          </div>
          <button class="btn" style="background:#ef4444; color: white; border-color: #ef4444;" on:click={destroyWorkspace}>Delete Workspace</button>
        </div>
      {/if}
    </div>

    {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}
  {/if}
</div>

<ConfirmModal 
  title={
    modalState.action === 'leave' ? 'Leave Workspace' :
    modalState.action === 'transfer' ? 'Transfer Ownership' :
    modalState.action === 'remove' ? 'Remove Member' :
    modalState.action === 'delete' ? 'Delete Workspace' : ''
  }
  message={
    modalState.action === 'leave' ? 'Leave this workspace? You\'ll lose access immediately.' :
    modalState.action === 'transfer' ? `Transfer ownership to user #${transferTarget}? You will be demoted to admin.` :
    modalState.action === 'remove' ? `Remove ${modalState.member?.name} (${modalState.member?.email}) from this workspace?` :
    modalState.action === 'delete' ? `Permanently delete "${me?.workspaces.find((w) => w.id === me?.workspace.id)?.name}"? Removes all entries, content types, webhooks, API keys, billing.` : ''
  }
  confirmText={modalState.action === 'delete' || modalState.action === 'remove' || modalState.action === 'leave' ? 'Confirm' : 'Transfer'}
  isOpen={modalState.action !== null}
  on:confirm={confirmModalAction}
  on:cancel={() => (modalState = { action: null })}
/>

<style>
  .invite-row { display: flex; gap: 8px; align-items: center; padding-bottom: 8px; border-bottom: 1px dashed var(--c-hairline); margin-bottom: 8px; }
  .invite-row select { width: 110px; }
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--c-ink); font-weight: 600; }
  .link.danger { color: #dc2626; }
  .link:hover { text-decoration: underline; }
</style>
