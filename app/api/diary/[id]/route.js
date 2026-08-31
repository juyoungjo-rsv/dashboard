import { NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../../lib/auth';
import { getEquippedForUser } from '../../../../lib/character';
import { deleteUploadedImage } from '../../../../lib/uploads';

function serializeEntry(db, row, currentUserId) {
  const images = db
    .prepare('SELECT id, file_name FROM diary_images WHERE entry_id = ? ORDER BY id')
    .all(row.id)
    .map((img) => ({ id: img.id, url: `/api/uploads/${img.file_name}` }));

  return {
    id: row.id,
    authorId: row.author_id,
    authorDisplayName: row.display_name,
    authorAvatar: getEquippedForUser(row.author_id),
    entryDate: row.entry_date,
    content: row.content,
    mood: row.mood,
    images,
    isMine: row.author_id === currentUserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function loadEntry(db, id) {
  return db
    .prepare(`SELECT e.*, u.display_name FROM diary_entries e JOIN users u ON u.id = e.author_id WHERE e.id = ?`)
    .get(id);
}

async function authOr401() {
  try {
    return await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return null;
    throw err;
  }
}

export async function GET(_request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const db = getDb();
  const row = loadEntry(db, params.id);
  if (!row) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });

  return NextResponse.json({ entry: serializeEntry(db, row, user.id) });
}

export async function PATCH(request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const db = getDb();
  const row = loadEntry(db, params.id);
  if (!row) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });
  if (row.author_id !== user.id) {
    return NextResponse.json({ error: '본인의 일기만 수정할 수 있어요.' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : row.content;
  const mood = typeof body.mood === 'string' ? body.mood.trim() || null : row.mood;

  if (!content) {
    return NextResponse.json({ error: '일기 내용을 입력해주세요.' }, { status: 400 });
  }

  db.prepare("UPDATE diary_entries SET content = ?, mood = ?, updated_at = datetime('now') WHERE id = ?").run(
    content,
    mood,
    row.id
  );

  if (Array.isArray(body.removeImageIds)) {
    const selectImage = db.prepare('SELECT id, file_name FROM diary_images WHERE id = ? AND entry_id = ?');
    const deleteImage = db.prepare('DELETE FROM diary_images WHERE id = ?');
    for (const rawId of body.removeImageIds) {
      const imageId = Number(rawId);
      if (!Number.isInteger(imageId)) continue;
      const img = selectImage.get(imageId, row.id);
      if (!img) continue;
      await deleteUploadedImage(img.file_name);
      deleteImage.run(img.id);
    }
  }

  const updated = loadEntry(db, row.id);
  return NextResponse.json({ entry: serializeEntry(db, updated, user.id) });
}

export async function DELETE(_request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const db = getDb();
  const row = loadEntry(db, params.id);
  if (!row) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });
  if (row.author_id !== user.id) {
    return NextResponse.json({ error: '본인의 일기만 삭제할 수 있어요.' }, { status: 403 });
  }

  const images = db.prepare('SELECT file_name FROM diary_images WHERE entry_id = ?').all(row.id);
  for (const img of images) await deleteUploadedImage(img.file_name);

  db.prepare('DELETE FROM diary_entries WHERE id = ?').run(row.id);

  return NextResponse.json({ ok: true });
}
