import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { error, type RequestEvent } from '@sveltejs/kit';
import { db } from './db';
import type { Role } from '@lifeos/core';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'dev-only-secret-change-me-32-chars');
export const COOKIE_NAME = process.env.COOKIE_NAME ?? 'lifeos_session';
export const ACTIVE_WS_COOKIE = process.env.ACTIVE_WS_COOKIE ?? 'lifeos_workspace';

export interface SessionPayload {
  uid: number;
  name: string;
  email: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET, { algorithms: ['HS256'] });
    return { uid: payload.uid as number, name: payload.name as string, email: payload.email as string };
  } catch {
    return null;
  }
}

export const COOKIE_OPTIONS = {
  path: '/',
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 60 * 60 * 24 * 30,
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function authenticate(email: string, password: string) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return user;
}

/**
 * Resolve actor (user OR API key) from request, plus workspace + role.
 * - Authorization: Bearer <jwt> → user session
 * - X-API-Key: <lk_prefix.secret> → API key (workspace-scoped)
 * - Cookie session also accepted
 */
export interface Actor {
  kind: 'user' | 'apikey';
  userId: number;
  workspaceId: number;
  role: Role;
  apiKeyId?: number;
}

const ROLE_RANK: Record<Role, number> = { viewer: 0, member: 1, editor: 2, admin: 3, owner: 4 };
export function requireRole(role: Role, required: Role): void {
  if (ROLE_RANK[role] < ROLE_RANK[required]) throw error(403, `Requires ${required} or higher`);
}

export async function resolveActor(event: RequestEvent, workspaceSlug?: string): Promise<Actor> {
  // 1) API key
  const apiKey = event.request.headers.get('x-api-key');
  if (apiKey) return await resolveByApiKey(apiKey, workspaceSlug);

  // 2) Bearer JWT
  const authz = event.request.headers.get('authorization');
  if (authz?.startsWith('Bearer ')) {
    const session = await verifySession(authz.slice(7).trim());
    if (session) return await resolveBySession(session.uid, workspaceSlug);
  }

  // 3) Cookie session
  const cookieTok = event.cookies.get(COOKIE_NAME);
  if (cookieTok) {
    const session = await verifySession(cookieTok);
    if (session) {
      const activeWs = event.cookies.get(ACTIVE_WS_COOKIE);
      const activeWsId = activeWs ? parseInt(activeWs, 10) : null;
      return await resolveBySession(session.uid, workspaceSlug, Number.isFinite(activeWsId) ? activeWsId : null);
    }
  }

  throw error(401, 'Unauthorized');
}

async function resolveByApiKey(raw: string, workspaceSlug?: string): Promise<Actor> {
  if (!raw.startsWith('lk_') || !raw.includes('.')) throw error(401, 'Invalid API key format');
  const [prefix, secret] = raw.split('.');
  const key = await db.apiKey.findUnique({
    where: { prefix },
    include: { workspace: true },
  });
  if (!key || key.revokedAt || (key.expiresAt && key.expiresAt < new Date())) {
    throw error(401, 'API key invalid or expired');
  }
  if (workspaceSlug && key.workspace.slug !== workspaceSlug) {
    throw error(403, 'API key not valid for this workspace');
  }
  const ok = await bcrypt.compare(secret, key.hash);
  if (!ok) throw error(401, 'API key invalid');

  // Update lastUsedAt fire-and-forget
  db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

  return {
    kind: 'apikey',
    userId: key.userId,
    workspaceId: key.workspaceId,
    role: key.role as Role,
    apiKeyId: key.id,
  };
}

async function resolveBySession(userId: number, workspaceSlug?: string, activeWorkspaceId?: number | null): Promise<Actor> {
  let member = null as Awaited<ReturnType<typeof db.workspaceMember.findFirst>> | null;

  if (workspaceSlug) {
    member = await db.workspaceMember.findFirst({
      where: { userId, workspace: { slug: workspaceSlug } },
      include: { workspace: true },
    });
  } else if (activeWorkspaceId) {
    member = await db.workspaceMember.findFirst({
      where: { userId, workspaceId: activeWorkspaceId },
      include: { workspace: true },
    });
  }

  // Fallback to first workspace (joined date asc) when no slug/active id, or none found
  if (!member) {
    member = await db.workspaceMember.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { workspace: true },
    });
  }

  if (!member) throw error(403, 'No workspace access');
  return {
    kind: 'user',
    userId,
    workspaceId: member.workspaceId,
    role: member.role as Role,
  };
}

export function generateApiKey(): { full: string; prefix: string; secret: string } {
  // Use crypto.randomBytes for cryptographically strong entropy.
  // Storage format unchanged: prefix indexed for lookup, secret bcrypt-hashed.
  const prefix = 'lk_' + randomBytes(6).toString('hex');
  const secret = randomBytes(24).toString('hex');
  return { full: `${prefix}.${secret}`, prefix, secret };
}
