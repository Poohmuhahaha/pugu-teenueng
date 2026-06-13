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
  let newWorkspaceName = '';
  let creating = false;
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

  async function createWorkspace() {
    if (!newWorkspaceName.trim()) return;
    creating = true;
    err = '';
    try {
      const res = await fetch(`/api/v1/workspaces`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName.trim() }),
      });
      if (!res.ok) {
        err = await res.text();
        return;
      }
      const ws = await res.json();
      // Switch to the new workspace automatically
      await switchWorkspace(ws.id);
    } finally {
      creating = false;
    }
  }

  async function switchWorkspace(workspaceId: number) {
    const res = await fetch(`/api/v1/workspaces/${workspaceId}/switch`, { method: 'POST' });
    if (res.ok) {
      window.location.href = '/';
    } else {
      err = await res.text();
    }
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

<div class="stack" style="max-width: 900px; margin: 0 auto; padding-top: 20px;">
  <div class="workspace-header">
    <h2 class="workspace-title">Workspace Settings</h2>
    <p style="color: var(--c-muted); margin-top: 8px;">Manage your workspace preferences, members, and billing.</p>
  </div>

  {#if loading || !me}
    <div style="display: flex; justify-content: center; padding: 40px;">
      <div class="spinner"></div>
      <p style="color:var(--c-muted); margin-left: 12px;">Loading settings…</p>
    </div>
  {:else}
    {@const isOwner = me.workspace.role === 'owner'}
    {@const isAdmin = isOwner || me.workspace.role === 'admin'}

    <div class="setting-section">
      <div class="section-label">Create New Workspace</div>
      <div class="section-desc">Create a brand new workspace to organize a different set of databases and entries.</div>
      <div class="h-row" style="gap: 12px; margin-top: 16px;">
        <input bind:value={newWorkspaceName} class="input-styled" placeholder="New workspace name" />
        <button class="btn-primary" on:click={createWorkspace} disabled={creating || !newWorkspaceName.trim()}>{creating ? 'Creating...' : 'Create Workspace'}</button>
      </div>
    </div>

    <div class="setting-section">
      <div class="section-label">Workspace Name {isAdmin ? '' : '(Read Only)'}</div>
      <div class="section-desc">Update your workspace's display name. This will be visible to all members.</div>
      <div class="h-row" style="gap: 12px;">
        <input bind:value={renameValue} disabled={!isAdmin} class="input-styled" placeholder="Enter workspace name" />
        <button class="btn-primary" on:click={rename} disabled={!isAdmin}>Save Changes</button>
      </div>
    </div>

    <div class="setting-section">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
        <div class="section-label" style="margin: 0;">Members <span style="background: var(--c-surface-soft); padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 8px; border: 1px solid var(--c-hairline);">{members.length}</span></div>
      </div>
      <div class="section-desc">Manage who has access to this workspace and their permission levels.</div>

      {#if isAdmin}
        <div class="invite-row">
          <input bind:value={inviteEmail} type="email" placeholder="Email address to invite" class="input-styled" />
          <select bind:value={inviteRole} class="select-role">
            <option value="viewer">Viewer</option>
            <option value="member">Member</option>
            <option value="editor">Editor</option>
            <option value="admin">Admin</option>
          </select>
          <button class="btn-primary" style="padding: 10px 16px;" on:click={invite} disabled={inviting || !inviteEmail.trim()}>{inviting ? 'Sending...' : 'Invite Member'}</button>
        </div>
        {#if inviteMsg}<p style="color:#10b981; font-size:14px; margin-top:-8px; margin-bottom:16px; padding: 8px; background: rgba(16, 185, 129, 0.1); border-radius: 6px;">{inviteMsg}</p>{/if}
      {/if}

      <div style="overflow-x: auto; border: 3px solid var(--c-primary); border-radius: 4px; box-shadow: 6px 6px 0 var(--c-primary); background: var(--c-canvas);">
        <table class="table-styled">
          <thead><tr><th>User</th><th>Role</th>{#if isAdmin}<th style="text-align: right;">Action</th>{/if}</tr></thead>
          <tbody>
            {#each paginatedMembers as m (m.userId)}
              <tr>
                <td>
                  <div style="font-weight: 600; color: var(--c-ink);">{m.name || 'Pending User'}</div>
                  <div style="font-size: 13px; color: var(--c-muted);">{m.email}</div>
                </td>
                <td>
                  {#if isAdmin && m.userId !== me.user.id}
                    <select value={m.role} on:change={(e) => changeRole(m, e.currentTarget.value)} class="select-role">
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="editor">Editor</option>
                      <option value="admin">Admin</option>
                    </select>
                  {:else}
                    <span style="padding: 4px 8px; background: var(--c-surface-soft); border-radius: 4px; font-size: 13px; border: 1px solid var(--c-hairline); text-transform: capitalize;">{m.role}</span>
                  {/if}
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
      <div style="margin-top: 16px;">
        <Pagination bind:currentPage {totalPages} />
      </div>
    </div>

    {#if isOwner}
      <div class="setting-section">
        <div class="section-label">Transfer Ownership</div>
        <div class="section-desc">Transfer your workspace ownership to another member. You will be demoted to an admin role.</div>
        <div class="h-row" style="gap: 12px;">
          <select bind:value={transferTarget} class="input-styled" style="max-width: 300px;">
            <option value="" disabled>Select a member to transfer to...</option>
            {#each members.filter(m => m.userId !== me.user.id) as m}
              <option value={m.userId}>{m.name || m.email}</option>
            {/each}
          </select>
          <button class="btn-primary" style="background: var(--c-primary);" on:click={transfer} disabled={!transferTarget}>Transfer Ownership</button>
        </div>
      </div>
    {/if}

    <div class="setting-section danger-zone">
      <div class="section-label">Danger Zone</div>
      <div class="section-desc">Irreversible actions that affect your access and the workspace's data.</div>
      
      <div class="danger-item">
        <div>
          <div class="danger-item-title" style="color: var(--c-ink);">Leave Workspace</div>
          <div class="danger-item-desc">Remove your access to this workspace. Owners cannot leave until they transfer ownership.</div>
        </div>
        <button class="btn-danger" on:click={leave} disabled={isOwner && members.length > 1}>Leave</button>
      </div>

      {#if isOwner}
        <div class="danger-item">
          <div>
            <div class="danger-item-title">Delete Workspace</div>
            <div class="danger-item-desc">Permanently delete this workspace and all its data. This action cannot be undone.</div>
          </div>
          <button class="btn-danger" on:click={destroyWorkspace}>Delete Workspace</button>
        </div>
      {/if}
    </div>

    {#if err}
      <div style="background: rgba(220, 38, 38, 0.1); border: 1px solid rgba(220, 38, 38, 0.3); color: #dc2626; padding: 12px; border-radius: 8px; margin-top: 16px;">
        <strong>Error:</strong> {err}
      </div>
    {/if}
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
  .workspace-header {
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .workspace-title {
    font-size: 28px;
    font-weight: 700;
    letter-spacing: -0.5px;
    color: var(--c-primary);
  }
  .setting-section {
    background: var(--c-canvas);
    border: 3px solid var(--c-primary);
    border-radius: 4px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 6px 6px 0 var(--c-primary);
    transition: transform 0.1s, box-shadow 0.1s;
  }
  .setting-section:hover {
    transform: translate(-2px, -2px);
    box-shadow: 8px 8px 0 var(--c-primary);
  }
  .section-label {
    font-size: 16px;
    font-weight: 600;
    color: var(--c-ink);
    margin-bottom: 4px;
  }
  .section-desc {
    font-size: 14px;
    color: var(--c-muted);
    margin-bottom: 16px;
  }
  .input-styled {
    flex: 1;
    max-width: 400px;
    padding: 10px 14px;
    border-radius: 4px;
    border: 2px solid var(--c-ink);
    background: var(--c-surface-soft);
    transition: border-color 0.1s, box-shadow 0.1s;
  }
  .input-styled:focus {
    border-color: var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
    outline: none;
  }
  .btn-primary {
    background: var(--c-primary);
    color: white;
    padding: 10px 20px;
    border-radius: 4px;
    font-weight: 600;
    border: 2px solid var(--c-primary);
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: 4px 4px 0 var(--c-primary);
  }
  .btn-primary:hover {
    filter: brightness(1.1);
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 var(--c-primary);
  }
  .btn-primary:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 var(--c-primary);
  }
  .invite-row { 
    display: flex; gap: 12px; align-items: center; padding: 16px; 
    background: var(--c-surface-soft); border-radius: 4px; 
    border: 3px solid var(--c-primary); margin-bottom: 16px; 
    box-shadow: 4px 4px 0 var(--c-primary);
  }
  .invite-row select { 
    width: 120px; padding: 10px; border-radius: 4px; border: 2px solid var(--c-ink); outline: none;
  }
  .invite-row select:focus {
    border-color: var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
  }
  .table-styled {
    width: 100%;
    border-collapse: collapse;
  }
  .table-styled th {
    text-align: left;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--c-muted);
    border-bottom: 1px solid var(--c-hairline);
  }
  .table-styled td {
    padding: 16px;
    border-bottom: 1px solid var(--c-hairline-soft);
    font-size: 14px;
  }
  .table-styled tr:hover td {
    background: var(--c-surface-soft);
  }
  .select-role {
    padding: 6px 10px;
    border-radius: 4px;
    border: 2px solid var(--c-ink);
    background: var(--c-canvas);
    outline: none;
  }
  .select-role:focus {
    border-color: var(--c-primary);
    box-shadow: 4px 4px 0 var(--c-primary);
  }
  .link { background: transparent; border: none; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 4px; font-weight: 600; transition: background 0.2s; }
  .link.danger { color: #dc2626; }
  .link.danger:hover { background: rgba(220, 38, 38, 0.1); }
  .danger-zone {
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .danger-zone .section-label {
    color: #ef4444;
  }
  .danger-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: rgba(239, 68, 68, 0.03);
    border-radius: 4px;
    border: 3px solid #ef4444;
    box-shadow: 4px 4px 0 #ef4444;
    margin-bottom: 12px;
  }
  .danger-item-title {
    font-weight: 600;
    font-size: 15px;
    color: #ef4444;
  }
  .danger-item-desc {
    font-size: 13px;
    color: var(--c-muted);
    margin-top: 4px;
  }
  .btn-danger {
    background: #ef4444;
    color: white;
    padding: 10px 16px;
    border-radius: 4px;
    font-weight: 600;
    border: 2px solid #b91c1c;
    cursor: pointer;
    transition: transform 0.1s, box-shadow 0.1s;
    box-shadow: 4px 4px 0 #b91c1c;
  }
  .btn-danger:hover {
    background: #dc2626;
    transform: translate(-1px, -1px);
    box-shadow: 5px 5px 0 #b91c1c;
  }
  .btn-danger:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0 #b91c1c;
  }
</style>
