import { error } from '@sveltejs/kit';
import { resolveActor } from '$lib/server/auth';
import { subscribe } from '$lib/server/sync';

/**
 * GET /api/v1/sync/stream — Server-Sent Events for live workspace events.
 *
 * Client opens an EventSource; server sends `data: <json>\n\n` whenever something
 * mutates in the same workspace. Keepalive ping every 30s.
 * Closes when the client disconnects (handled by AbortController).
 */
export async function GET(event) {
  const actor = await resolveActor(event);
  if (!actor.workspaceId) throw error(403, 'No workspace');

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder();
      const send = (data: unknown) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller may be closed
        }
      };

      send({ type: 'hello', workspaceId: actor.workspaceId, at: new Date().toISOString() });

      const unsubscribe = subscribe(actor.workspaceId, send);
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(keepalive);
        }
      }, 30_000);

      const abort = () => {
        clearInterval(keepalive);
        unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
      };
      event.request.signal.addEventListener('abort', abort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
