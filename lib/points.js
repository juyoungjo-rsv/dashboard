export const POINTS = {
  DIARY_ENTRY: 10,
  COMMENT: 5,
  COMMENT_DAILY_CAP: 3,
  STREAK_MILESTONE_DAYS: 5,
  STREAK_BONUS: 30,
};

export function getBalance(db, userId) {
  const row = db.prepare('SELECT COALESCE(SUM(delta), 0) AS bal FROM points_ledger WHERE user_id = ?').get(userId);
  return row.bal;
}

export function addLedgerEntry(db, { userId, delta, reason, note = null, refType = null, refId = null }) {
  db.prepare(
    'INSERT INTO points_ledger (user_id, delta, reason, note, ref_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, delta, reason, note, refType, refId);
}

export function getRecentLedger(db, userId, limit = 20) {
  return db
    .prepare('SELECT * FROM points_ledger WHERE user_id = ? ORDER BY id DESC LIMIT ?')
    .all(userId, limit);
}

export function getStreak(db, userId) {
  return (
    db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId) || {
      user_id: userId,
      current_streak: 0,
      longest_streak: 0,
      last_entry_date: null,
    }
  );
}

function addDays(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Advances the per-user streak counter. Only moves the streak forward when
// the new entry_date is exactly one day after the last recorded one;
// backfilling an older date leaves the current streak untouched, and a gap
// resets it to 1.
export function recordEntryForStreak(db, userId, entryDateStr) {
  const existing = db.prepare('SELECT * FROM user_streaks WHERE user_id = ?').get(userId);

  if (!existing) {
    db.prepare(
      'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_entry_date) VALUES (?, 1, 1, ?)'
    ).run(userId, entryDateStr);
    return { currentStreak: 1, milestoneHit: false };
  }

  if (existing.last_entry_date && entryDateStr <= existing.last_entry_date) {
    return { currentStreak: existing.current_streak, milestoneHit: false };
  }

  const expectedNext = existing.last_entry_date ? addDays(existing.last_entry_date, 1) : entryDateStr;
  const newStreak = entryDateStr === expectedNext ? existing.current_streak + 1 : 1;
  const longest = Math.max(existing.longest_streak, newStreak);

  db.prepare(
    'UPDATE user_streaks SET current_streak = ?, longest_streak = ?, last_entry_date = ? WHERE user_id = ?'
  ).run(newStreak, longest, entryDateStr, userId);

  const milestoneHit = newStreak > 0 && newStreak % POINTS.STREAK_MILESTONE_DAYS === 0;
  return { currentStreak: newStreak, milestoneHit };
}

export function awardDiaryEntryPoints(db, userId, entryId, entryDateStr) {
  addLedgerEntry(db, {
    userId,
    delta: POINTS.DIARY_ENTRY,
    reason: 'diary_entry',
    note: '일기 작성',
    refType: 'diary_entry',
    refId: entryId,
  });

  const { currentStreak, milestoneHit } = recordEntryForStreak(db, userId, entryDateStr);

  let streakBonus = 0;
  if (milestoneHit) {
    streakBonus = POINTS.STREAK_BONUS;
    addLedgerEntry(db, {
      userId,
      delta: streakBonus,
      reason: 'streak_bonus',
      note: `${currentStreak}일 연속 작성 보너스`,
      refType: 'diary_entry',
      refId: entryId,
    });
  }

  return { earned: POINTS.DIARY_ENTRY, streakBonus, currentStreak };
}

// Comments earn points too, capped per day so the reward can't be farmed.
export function awardCommentPoints(db, userId, commentId) {
  const countRow = db
    .prepare(
      `SELECT COUNT(*) AS c FROM points_ledger WHERE user_id = ? AND reason = 'comment' AND date(created_at) = date('now')`
    )
    .get(userId);

  if (countRow.c >= POINTS.COMMENT_DAILY_CAP) {
    return { earned: 0, capped: true };
  }

  addLedgerEntry(db, {
    userId,
    delta: POINTS.COMMENT,
    reason: 'comment',
    note: '댓글 작성',
    refType: 'comment',
    refId: commentId,
  });

  return { earned: POINTS.COMMENT, capped: false };
}
