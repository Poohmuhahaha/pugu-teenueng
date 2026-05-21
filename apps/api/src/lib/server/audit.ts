import { db } from './db';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuditWrite {
  event: Pick<RequestEvent, 'request' | 'getClientAddress'> & { locals?: { user?: { id: number } | null } };
  workspaceId?: number | null;
  userId?: number | null;
  action: string;
  entity: string;
  entityId?: number | null;
  diff?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget audit log entry. Never throws.
 * Captures IP + UA from the request.
 */
export function writeAudit(opts: AuditWrite): void {
  const ua = opts.event.request.headers.get('user-agent') ?? null;
  let ip: string | null = null;
  try {
    ip = opts.event.getClientAddress();
  } catch {
    // not always available (e.g. inside cron worker)
  }
  db.auditLog
    .create({
      data: {
        workspaceId: opts.workspaceId ?? null,
        userId: opts.userId ?? opts.event.locals?.user?.id ?? null,
        action: opts.action,
        entity: opts.entity,
        entityId: opts.entityId ?? null,
        diff: opts.diff ?? null,
        ip,
        ua,
      },
    })
    .catch(() => {
      // never block the request thread on audit
    });
}
