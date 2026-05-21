/**
 * Client-side wrapper around the SSE sync stream.
 * Usage:
 *   import { onSyncEvent } from '$lib/sync';
 *   const off = onSyncEvent((e) => {
 *     if (e.type === 'entry.updated') invalidate(`/api/v1/${e.contentTypeSlug}`);
 *   });
 *   onDestroy(off);
 */

export type SyncEvent =
  | { type: 'entry.created'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'entry.updated'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'entry.deleted'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'contentType.changed'; workspaceId: number; slug: string }
  | { type: 'workspace.updated'; workspaceId: number }
  | { type: 'hello'; workspaceId: number; at: string };

type Listener = (e: SyncEvent) => void;

let source: EventSource | null = null;
const listeners = new Set<Listener>();

function ensure() {
  if (source || typeof window === 'undefined') return;
  source = new EventSource('/api/v1/sync/stream');
  source.onmessage = (msg) => {
    try {
      const event = JSON.parse(msg.data) as SyncEvent;
      for (const fn of listeners) fn(event);
    } catch {
      // ignore malformed
    }
  };
  source.onerror = () => {
    // Browser auto-reconnects; we just log
    if (typeof console !== 'undefined') console.warn('[sync] reconnecting…');
  };
}

export function onSyncEvent(fn: Listener): () => void {
  ensure();
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0) {
      source?.close();
      source = null;
    }
  };
}
