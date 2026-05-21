import { createHash, randomBytes } from 'crypto';
import { db } from './db';

export type TokenKind = 'magic' | 'reset';

export interface IssuedToken {
  /** Raw token to send in email. Never stored. */
  raw: string;
  /** DB row id of the token. */
  id: number;
}

function hash(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

const TTL_MS: Record<TokenKind, number> = {
  magic: 15 * 60 * 1000,
  reset: 60 * 60 * 1000,
};

export async function issueToken(userId: number, kind: TokenKind): Promise<IssuedToken> {
  const raw = randomBytes(32).toString('base64url');
  const row = await db.authToken.create({
    data: {
      userId,
      kind,
      hash: hash(raw),
      expiresAt: new Date(Date.now() + TTL_MS[kind]),
    },
  });
  return { raw, id: row.id };
}

export async function consumeToken(rawToken: string, kind: TokenKind): Promise<number | null> {
  const row = await db.authToken.findUnique({ where: { hash: hash(rawToken) } });
  if (!row) return null;
  if (row.kind !== kind) return null;
  if (row.usedAt) return null;
  if (row.expiresAt < new Date()) return null;
  await db.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row.userId;
}
