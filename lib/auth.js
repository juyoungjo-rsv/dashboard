import { cookies } from 'next/headers';
import { getDb } from './db';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, createSessionToken, verifySessionToken } from './session';

export async function getCurrentUser() {
  const store = cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);
  if (!session) return null;
  const db = getDb();
  const user = db
    .prepare('SELECT id, username, display_name AS displayName FROM users WHERE id = ?')
    .get(session.userId);
  return user || null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('UNAUTHORIZED');
    this.status = 401;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function setSessionCookie(userId) {
  const token = await createSessionToken(userId);
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie() {
  cookies().set(SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export function getPartnerUser(currentUserId) {
  const db = getDb();
  return (
    db
      .prepare('SELECT id, username, display_name AS displayName FROM users WHERE id != ? LIMIT 1')
      .get(currentUserId) || null
  );
}
