import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { requireUser, UnauthorizedError } from '../../../../../lib/auth';
import { awardCommentPoints } from '../../../../../lib/points';

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

  const entry = await db.get('SELECT id FROM diary_entries WHERE id = ?', [params.id]);
  if (!entry) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });

  const rows = await db.all(
    `SELECT c.*, u.display_name FROM comments c
     JOIN users u ON u.id = c.author_id
     WHERE c.entry_id = ? ORDER BY c.id ASC`,
    [params.id]
  );

  const comments = rows.map((c) => ({
    id: c.id,
    authorId: c.author_id,
    authorDisplayName: c.display_name,
    content: c.content,
    createdAt: c.created_at,
    isMine: c.author_id === user.id,
  }));

  return NextResponse.json({ comments });
}

export async function POST(request, { params }) {
  const user = await authOr401();
  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });

  const entry = await db.get('SELECT id FROM diary_entries WHERE id = ?', [params.id]);
  if (!entry) return NextResponse.json({ error: '일기를 찾을 수 없습니다.' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if (!content) return NextResponse.json({ error: '댓글 내용을 입력해주세요.' }, { status: 400 });
  if (content.length > 500) return NextResponse.json({ error: '댓글은 500자 이내로 작성해주세요.' }, { status: 400 });

  const { lastInsertRowid: commentId } = await db.run(
    'INSERT INTO comments (entry_id, author_id, content) VALUES (?, ?, ?)',
    [entry.id, user.id, content]
  );

  const pointsInfo = await awardCommentPoints(user.id, commentId);

  const row = await db.get(
    'SELECT c.*, u.display_name FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = ?',
    [commentId]
  );

  return NextResponse.json(
    {
      comment: {
        id: row.id,
        authorId: row.author_id,
        authorDisplayName: row.display_name,
        content: row.content,
        createdAt: row.created_at,
        isMine: true,
      },
      points: pointsInfo,
    },
    { status: 201 }
  );
}
