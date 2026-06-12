<script lang="ts">
  import { onMount } from 'svelte';
  import Pagination from '$lib/components/Pagination.svelte';
  import ConfirmModal from '$lib/components/ConfirmModal.svelte';

  interface Session {
    id: number;
    ua: string | null;
    ip: string | null;
    createdAt: string;
    lastSeenAt: string;
    revokedAt: string | null;
    current: boolean;
  }

  let sessions: Session[] = [];
  let currentPage = 1;
  const itemsPerPage = 12;
  $: totalPages = Math.ceil(sessions.length / itemsPerPage) || 1;
  $: paginatedSessions = sessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  $: if (currentPage > totalPages) currentPage = totalPages;

  let loading = true;
  let err = '';

  let modalState: { type: 'revoke' | 'revokeAll' | null; session?: Session } = { type: null };

  async function load() {
    loading = true;
    err = '';
    const res = await fetch('/api/v1/me/sessions');
    if (res.ok) sessions = (await res.json()).data;
    else err = await res.text();
    loading = false;
  }

  function revoke(s: Session) {
    if (s.current) { err = 'Use Sign out to end your current session.'; return; }
    modalState = { type: 'revoke', session: s };
  }

  function revokeAll() {
    modalState = { type: 'revokeAll' };
  }

  async function confirmModalAction() {
    if (modalState.type === 'revoke' && modalState.session) {
      const s = modalState.session;
      const res = await fetch(`/api/v1/me/sessions/${s.id}`, { method: 'DELETE' });
      if (res.ok) await load();
      else err = await res.text();
    } else if (modalState.type === 'revokeAll') {
      const res = await fetch('/api/v1/me/sessions/all', { method: 'POST' });
      if (res.ok) {
        const body = await res.json();
        err = `Revoked ${body.revoked} other session(s).`;
        await load();
      } else err = await res.text();
    }
    modalState = { type: null };
  }

  function shortUA(ua: string | null): string {
    if (!ua) return 'Unknown device';
    if (/Mobile/.test(ua)) return mobileTag(ua);
    if (/Chrome/.test(ua) && !/Edg/.test(ua)) return 'Chrome ' + browserVer(ua, /Chrome\/(\d+)/);
    if (/Edg/.test(ua)) return 'Edge ' + browserVer(ua, /Edg\/(\d+)/);
    if (/Firefox/.test(ua)) return 'Firefox ' + browserVer(ua, /Firefox\/(\d+)/);
    if (/Safari/.test(ua) && !/Chrome/.test(ua)) return 'Safari ' + browserVer(ua, /Version\/(\d+)/);
    return ua.slice(0, 40) + '…';
  }
  function mobileTag(ua: string): string {
    if (/iPhone/.test(ua)) return 'iPhone';
    if (/iPad/.test(ua)) return 'iPad';
    if (/Android/.test(ua)) return 'Android';
    return 'Mobile';
  }
  function browserVer(ua: string, re: RegExp): string {
    return ua.match(re)?.[1] ?? '';
  }

  onMount(load);
</script>

<div class="stack">
  <div class="h-row" style="justify-content: flex-end; margin-bottom: 8px;">
    <button class="btn btn-ghost" on:click={revokeAll}>Sign out everywhere else</button>
  </div>

  {#if err}<p style="color:#dc2626; font-size:13px; margin:0">{err}</p>{/if}

  {#if loading}
    <p style="color:var(--c-muted)">Loading…</p>
  {:else if sessions.length === 0}
    <p style="color:var(--c-muted)">No active sessions tracked yet.</p>
  {:else}
    <table class="t">
      <thead><tr><th>Device</th><th>IP</th><th>Last seen</th><th>Created</th><th>Status</th><th></th></tr></thead>
      <tbody>
        {#each paginatedSessions as s (s.id)}
          <tr style:opacity={s.revokedAt ? 0.5 : 1}>
            <td>
              {shortUA(s.ua)}
              {#if s.current}<span class="chip">this device</span>{/if}
            </td>
            <td style="font-size:12px; color:var(--c-muted)">{s.ip ?? '—'}</td>
            <td>{new Date(s.lastSeenAt).toLocaleString()}</td>
            <td>{new Date(s.createdAt).toLocaleDateString()}</td>
            <td style:color={s.revokedAt ? 'var(--c-muted)' : '#10b981'}>{s.revokedAt ? 'revoked' : 'active'}</td>
            <td>
              {#if !s.revokedAt && !s.current}
                <button class="link danger" on:click={() => revoke(s)}>Revoke</button>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <Pagination bind:currentPage {totalPages} />
  {/if}
</div>

<ConfirmModal 
  title={modalState.type === 'revoke' ? 'Revoke Session' : 'Sign Out Everywhere'}
  message={modalState.type === 'revoke' && modalState.session ? `Revoke session from <strong>${shortUA(modalState.session.ua)}</strong>?<br/>The other device will be signed out on its next request.` : 'Sign out every device except this one?'}
  confirmText="Sign Out"
  isOpen={modalState.type !== null}
  on:confirm={confirmModalAction}
  on:cancel={() => (modalState = { type: null })}
/>

<style>
  .chip { display: inline-block; margin-left: 8px; padding: 1px 8px; font-size: 10px; text-transform: uppercase; background: rgba(124,58,237,0.12); color: var(--c-ink); border-radius: 999px; letter-spacing: 0.06em; font-weight: 700; }
  .link { background: transparent; border: none; font-size: 12px; cursor: pointer; padding: 2px 6px; color: var(--c-ink); }
  .link.danger { color: #dc2626; }
  .link:hover { text-decoration: underline; }
</style>
