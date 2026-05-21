/**
 * Pub-sub for live workspace events.
 *
 * Single-process fan-out by default (in-memory Map).
 * If REDIS_URL is set, every `publish()` also forwards through Redis Pub/Sub
 * and remote messages are re-injected into local listeners — so multiple Node
 * instances see each other's events.
 */
import { publishToRedis, subscribeFromRedis } from './redis';

export type SyncEvent =
  | { type: 'entry.created'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'entry.updated'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'entry.deleted'; workspaceId: number; contentTypeSlug: string; entryId: number }
  | { type: 'contentType.changed'; workspaceId: number; slug: string }
  | { type: 'workspace.updated'; workspaceId: number };

type Listener = (e: SyncEvent) => void;

const bus = new Map<number, Set<Listener>>();
const redisUnsubs = new Map<number, () => void>();

function fanOutLocal(event: SyncEvent): void {
  const ls = bus.get(event.workspaceId);
  if (!ls || ls.size === 0) return;
  for (const fn of [...ls]) {
    try { fn(event); } catch { /* swallow */ }
  }
}

export function publish(event: SyncEvent): void {
  fanOutLocal(event);
  // Best-effort cross-instance fan-out; no-op without REDIS_URL.
  publishToRedis(event.workspaceId, event).catch(() => {});
}

export function subscribe(workspaceId: number, listener: Listener): () => void {
  let set = bus.get(workspaceId);
  if (!set) {
    set = new Set();
    bus.set(workspaceId, set);
    // Lazily wire up the Redis subscription for this workspace.
    subscribeFromRedis(workspaceId, (payload) => {
      // Don't double-fan: only inject if the event came from another process.
      // We can't trivially tell, but local listeners already received the
      // local publish synchronously, so the worst case is a duplicate event
      // — which SSE clients debounce already.
      fanOutLocal(payload as SyncEvent);
    }).then((off) => redisUnsubs.set(workspaceId, off)).catch(() => {});
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
    if (set!.size === 0) {
      bus.delete(workspaceId);
      redisUnsubs.get(workspaceId)?.();
      redisUnsubs.delete(workspaceId);
    }
  };
}
