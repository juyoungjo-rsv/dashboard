import { NextResponse } from 'next/server';
import { db } from '../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../lib/auth';
import { awardDiaryEntryPoints } from '../../../lib/points';
import { getEquippedForUser } from '../../../lib/character';
import { saveUploadedImage, UploadError, MAX_IMAGES_PER_ENTRY } from '../../../lib/uploads';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

async function serializeEntry(row, currentUserId) {
  const imageRows = await db.all('SELECT id, url FROM diary_images WHERE entry_id = ? ORDER BY id', [row.id]);
  const commentCountRow = await db.get('SELECT COUNT(*) AS c FROM comments WHERE entry_id = ?', [row.id]);
  const authorAvatar = await getEquippedForUser(row.author_id);

  return {
    id: row.id,
    authorId: row.author_id,
    authorDisplayName: row.display_name,
    authorAvatar,
    entryDate: row.entry_date,
    content: row.content,
    mood: row.mood,
    images: imageRows.map((img) => ({ id: img.id, url: img.url })),
    commentCount: commentCountRow.c,
    isMine: row.author_id === currentUserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function authOr401() {
  try {
    return await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return null;
    throw err;
  }
}

export async function GET(request) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const beforeId = Number(searchParams.get('before')) || null;
  const limit = Math.min(50, Number(searchParams.get('limit')) || 20);

  const rows = beforeId
    ? await db.all(
        `SELECT e.*, u.display_name FROM diary_entries e
         JOIN users u ON u.id = e.author_id
         WHERE e.id < ?
         ORDER BY e.entry_date DESC, e.id DESC LIMIT ?`,
        [beforeId, limit]
      )
    : await db.all(
        `SELECT e.*, u.display_name FROM diary_entries e
         JOIN users u ON u.id = e.author_id
         ORDER BY e.entry_date DESC, e.id DESC LIMIT ?`,
        [limit]
      );

  const entries = [];
  for (const row of rows) entries.push(await serializeEntry(row, user.id));
  return NextResponse.json({ entries });
}

export async function POST(request) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

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

  const existing = await db.get('SELECT * FROM diary_entries WHERE author_id = ? AND entry_date = ?', [
    user.id,
    entryDate,
  ]);

  let savedImages = [];
  try {
    for (const file of files) {
      savedImages.push(await saveUploadedImage(file));
    }
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: 400 });
    throw err;
  }

  let entryId;
  let pointsInfo = { earned: 0, streakBonus: 0, currentStreak: null };

  if (existing) {
    const existingImageCountRow = await db.get('SELECT COUNT(*) AS c FROM diary_images WHERE entry_id = ?', [
      existing.id,
    ]);
    if (existingImageCountRow.c + savedImages.length > MAX_IMAGES_PER_ENTRY) {
      return NextResponse.json(
        { error: `이미지는 한 일기당 최대 ${MAX_IMAGES_PER_ENTRY}장까지 가능해요.` },
        { status: 400 }
      );
    }
    await db.run("UPDATE diary_entries SET content = ?, mood = ?, updated_at = datetime('now') WHERE id = ?", [
      content,
      mood,
      existing.id,
    ]);
    entryId = existing.id;
  } else {
    const { lastInsertRowid } = await db.run(
      'INSERT INTO diary_entries (author_id, entry_date, content, mood) VALUES (?, ?, ?, ?)',
      [user.id, entryDate, content, mood]
    );
    entryId = lastInsertRowid;
    pointsInfo = await awardDiaryEntryPoints(user.id, entryId, entryDate);
  }

  for (const img of savedImages) {
    await db.run('INSERT INTO diary_images (entry_id, url, blob_pathname) VALUES (?, ?, ?)', [
      entryId,
      img.url,
      img.pathname,
    ]);
  }

  const row = await db.get(
    'SELECT e.*, u.display_name FROM diary_entries e JOIN users u ON u.id = e.author_id WHERE e.id = ?',
    [entryId]
  );

  return NextResponse.json(
    { entry: await serializeEntry(row, user.id), points: pointsInfo },
    { status: 201 }
  );
}
