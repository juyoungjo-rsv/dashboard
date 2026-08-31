import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../lib/auth';
import { getBalance, getStreak, getRecentLedger, POINTS } from '../../../lib/points';

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    throw err;
  }

  const db = getDb();
  const balance = getBalance(db, user.id);
  const streak = getStreak(db, user.id);
  const ledger = getRecentLedger(db, user.id, 20).map((row) => ({
    id: row.id,
    delta: row.delta,
    reason: row.reason,
    note: row.note,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    balance,
    streak: {
      current: streak.current_streak,
      longest: streak.longest_streak,
      lastEntryDate: streak.last_entry_date,
      nextMilestoneIn: POINTS.STREAK_MILESTONE_DAYS - (streak.current_streak % POINTS.STREAK_MILESTONE_DAYS),
    },
    ledger,
    rules: POINTS,
  });
}
