import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { getCurrentUser, getPartnerUser } from '../../../../lib/auth';
import { getEquippedForUser } from '../../../../lib/character';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const partner = getPartnerUser(user.id);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const db = getDb();
  const wroteToday = (userId) =>
    !!db.prepare('SELECT 1 FROM diary_entries WHERE author_id = ? AND entry_date = ?').get(userId, date);

  return NextResponse.json({
    user: { ...user, wroteToday: wroteToday(user.id), avatar: getEquippedForUser(user.id) },
    partner: partner
      ? { ...partner, wroteToday: wroteToday(partner.id), avatar: getEquippedForUser(partner.id) }
      : null,
  });
}
