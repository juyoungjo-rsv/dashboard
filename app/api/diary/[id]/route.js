import { NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../../lib/auth';
import { getEquippedForUser } from '../../../../lib/character';
import { deleteUploadedImage } from '../../../../lib/uploads';

async function serializeEntry(row, currentUserId) {
  const imageRows = await db.all('SELECT id, url FROM diary_images WHERE entry_id = ? ORDER BY id', [row.id]);
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
    isMine: row.author_id === currentUserId,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function loadEntry(id) {
  return db.get('SELECT e.*, u.display_name FROM diary_entries e JOIN users u ON u.id = e.author_id WHERE e.id = ?', [
    id,
  ]);
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

  const row = await loadEntry(params.id);
  if (!row) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });

  return NextResponse.json({ entry: await serializeEntry(row, user.id) });
}

export async function PATCH(request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const row = await loadEntry(params.id);
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

  await db.run("UPDATE diary_entries SET content = ?, mood = ?, updated_at = datetime('now') WHERE id = ?", [
    content,
    mood,
    row.id,
  ]);

  if (Array.isArray(body.removeImageIds)) {
    for (const rawId of body.removeImageIds) {
      const imageId = Number(rawId);
      if (!Number.isInteger(imageId)) continue;
      const img = await db.get('SELECT id, url FROM diary_images WHERE id = ? AND entry_id = ?', [imageId, row.id]);
      if (!img) continue;
      await deleteUploadedImage(img.url);
      await db.run('DELETE FROM diary_images WHERE id = ?', [img.id]);
    }
  }

  const updated = await loadEntry(row.id);
  return NextResponse.json({ entry: await serializeEntry(updated, user.id) });
}

export async function DELETE(_request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const row = await loadEntry(params.id);
  if (!row) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });
  if (row.author_id !== user.id) {
    return NextResponse.json({ error: '본인의 일기만 삭제할 수 있어요.' }, { status: 403 });
  }

  const images = await db.all('SELECT url FROM diary_images WHERE entry_id = ?', [row.id]);
  for (const img of images) await deleteUploadedImage(img.url);

  // Delete child rows explicitly rather than relying on ON DELETE CASCADE,
  // since it needs `PRAGMA foreign_keys = ON` per-connection and that isn't
  // guaranteed across every libSQL connection (local file vs. Turso).
  await db.run('DELETE FROM diary_images WHERE entry_id = ?', [row.id]);
  await db.run('DELETE FROM comments WHERE entry_id = ?', [row.id]);
  await db.run('DELETE FROM diary_entries WHERE id = ?', [row.id]);

  return NextResponse.json({ ok: true });
}
