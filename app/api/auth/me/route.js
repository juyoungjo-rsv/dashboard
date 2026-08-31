import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { getCurrentUser, getPartnerUser } from '../../../../lib/auth';
import { getEquippedForUser } from '../../../../lib/character';

export async function GET(request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const partner = await getPartnerUser(user.id);
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  async function wroteToday(userId) {
    const row = await db.get('SELECT 1 FROM diary_entries WHERE author_id = ? AND entry_date = ?', [userId, date]);
    return !!row;
  }

  return NextResponse.json({
    user: { ...user, wroteToday: await wroteToday(user.id), avatar: await getEquippedForUser(user.id) },
    partner: partner
      ? { ...partner, wroteToday: await wroteToday(partner.id), avatar: await getEquippedForUser(partner.id) }
      : null,
  });
}
