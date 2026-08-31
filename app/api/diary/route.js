import { NextResponse } from 'next/server';
import { getDb } from '../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../lib/auth';
import { awardDiaryEntryPoints } from '../../../lib/points';
import { getEquippedForUser } from '../../../lib/character';
import { saveUploadedImage, UploadError, MAX_IMAGES_PER_ENTRY } from '../../../lib/uploads';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function serializeEntry(db, row, currentUserId) {
  const images = db
    .prepare('SELECT id, file_name FROM diary_images WHERE entry_id = ? ORDER BY id')
    .all(row.id)
    .map((img) => ({ id: img.id, url: `/api/uploads/${img.file_name}` }));

  const commentCount = db.prepare('SELECT COUNT(*) AS c FROM comments WHERE entry_id = ?').get(row.id).c;

  return {
    id: row.id,
    authorId: row.author_id,
    authorDisplayName: row.display_name,
    authorAvatar: getEquippedForUser(row.author_id),
    entryDate: row.entry_date,
    content: row.content,
    mood: row.mood,
    images,
    commentCount,
    isMine: row.author_id === currentUserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    throw err;
  }

  const { searchParams } = new URL(request.url);
  const beforeId = Number(searchParams.get('before')) || null;
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

  const db = getDb();
  const rows = beforeId
    ? db
        .prepare(
          `SELECT e.*, u.display_name FROM diary_entries e
           JOIN users u ON u.id = e.author_id
           WHERE e.id < ?
           ORDER BY e.entry_date DESC, e.id DESC LIMIT ?`
        )
        .all(beforeId, limit)
    : db
        .prepare(
          `SELECT e.*, u.display_name FROM diary_entries e
           JOIN users u ON u.id = e.author_id
           ORDER BY e.entry_date DESC, e.id DESC LIMIT ?`
        )
        .all(limit);

  const entries = rows.map((row) => serializeEntry(db, row, user.id));
  return NextResponse.json({ entries });
}

export async function POST(request) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    throw err;
  }

  const formData = await request.formData();
  const entryDate = String(formData.get('entryDate') || '').trim();
  const content = String(formData.get('content') || '').trim();
  const mood = String(formData.get('mood') || '').trim() || null;
  const files = formData.getAll('images').filter((f) => f instanceof Blob && f.size > 0);

  if (!DATE_RE.test(entryDate)) {
    return NextResponse.json({ error: '날짜 형식이 올바르지 않습니다.' }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: '일기 내용을 입력해주세요.' }, { status: 400 });
  }
  if (files.length > MAX_IMAGES_PER_ENTRY) {
    return NextResponse.json({ error: `이미지는 최대 ${MAX_IMAGES_PER_ENTRY}장까지 첨부할 수 있어요.` }, { status: 400 });
  }

  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM diary_entries WHERE author_id = ? AND entry_date = ?')
    .get(user.id, entryDate);

  let savedFileNames = [];
  try {
    for (const file of files) {
      savedFileNames.push(await saveUploadedImage(file));
    }
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  let entryId;
  let pointsInfo = { earned: 0, streakBonus: 0, currentStreak: null };

  if (existing) {
    const existingImageCount = db
      .prepare('SELECT COUNT(*) AS c FROM diary_images WHERE entry_id = ?')
      .get(existing.id).c;
    if (existingImageCount + savedFileNames.length > MAX_IMAGES_PER_ENTRY) {
      return NextResponse.json(
        { error: `이미지는 한 일기당 최대 ${MAX_IMAGES_PER_ENTRY}장까지 가능해요.` },
        { status: 400 }
      );
    }
    db.prepare("UPDATE diary_entries SET content = ?, mood = ?, updated_at = datetime('now') WHERE id = ?").run(
      content,
      mood,
      existing.id
    );
    entryId = existing.id;
  } else {
    const info = db
      .prepare('INSERT INTO diary_entries (author_id, entry_date, content, mood) VALUES (?, ?, ?, ?)')
      .run(user.id, entryDate, content, mood);
    entryId = Number(info.lastInsertRowid);
    pointsInfo = awardDiaryEntryPoints(db, user.id, entryId, entryDate);
  }

  const insertImage = db.prepare('INSERT INTO diary_images (entry_id, file_name) VALUES (?, ?)');
  for (const fileName of savedFileNames) insertImage.run(entryId, fileName);

  const row = db
    .prepare(
      `SELECT e.*, u.display_name FROM diary_entries e JOIN users u ON u.id = e.author_id WHERE e.id = ?`
    )
    .get(entryId);

  return NextResponse.json({ entry: serializeEntry(db, row, user.id), points: pointsInfo }, { status: 201 });
}
