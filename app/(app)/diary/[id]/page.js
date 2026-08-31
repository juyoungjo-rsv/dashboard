'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePoints, useToast } from '../../../../components/AppProviders';

function formatDate(entryDate) {
  const [y, m, d] = entryDate.split('-').map(Number);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dow = new Date(y, m - 1, d).getDay();
  return `${m}월 ${d}일 (${days[dow]})`;
}

function formatDateTime(iso) {
  const d = new Date(`${iso.replace(' ', 'T')}Z`);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function DiaryDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { refresh: refreshPoints } = usePoints();
  const showToast = useToast();

  const [entry, setEntry] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [entryRes, commentsRes] = await Promise.all([
      fetch(`/api/diary/${id}`),
      fetch(`/api/diary/${id}/comments`),
    ]);
    if (entryRes.ok) setEntry((await entryRes.json()).entry);
    if (commentsRes.ok) setComments((await commentsRes.json()).comments);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/diary/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || '댓글 작성에 실패했어요.');
        return;
      }
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
      refreshPoints();
      if (data.points?.earned) showToast(`+${data.points.earned}P 획득!`);
      else if (data.points?.capped) showToast('오늘 댓글 포인트는 다 받았어요. 댓글은 계속 남겨도 괜찮아요!');
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete() {
    if (!confirm('이 일기를 삭제할까요? 사진도 함께 삭제돼요.')) return;
    const res = await fetch(`/api/diary/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('삭제했어요.');
      router.push('/diary');
    }
  }

  if (loading) return <p className="spinner-text">불러오는 중…</p>;
  if (!entry) return <p className="empty-state">일기를 찾을 수 없어요.</p>;

  return (
    <div>
      <div className="card">
        <div className="diary-entry-head">
          <span className="diary-entry-avatar">{entry.isMine ? '🙋' : '👤'}</span>
          <span className="diary-entry-author">{entry.authorDisplayName}</span>
          {entry.mood && <span className="diary-entry-mood">{entry.mood}</span>}
          <span className="diary-entry-date">{formatDate(entry.entryDate)}</span>
        </div>
        <div className="diary-entry-content">{entry.content}</div>
        {entry.images.length > 0 && (
          <div className="diary-entry-images">
            {entry.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="일기 사진" style={{ width: 140, height: 140 }} />
            ))}
          </div>
        )}
        {entry.isMine && (
          <div className="diary-entry-footer">
            <button className="btn btn-ghost btn-small btn-danger" onClick={handleDelete}>
              삭제하기
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">💬 댓글 {comments.length}개</div>
        <div style={{ marginTop: 8 }}>
          {comments.length === 0 ? (
            <p className="empty-state" style={{ padding: '16px 0' }}>
              아직 댓글이 없어요. 첫 댓글을 남겨보세요!
            </p>
          ) : (
            comments.map((c) => (
              <div className="comment-item" key={c.id}>
                <span className="comment-avatar">{c.isMine ? '🙋' : '👤'}</span>
                <div className="comment-body">
                  <div className="comment-author">{c.authorDisplayName}</div>
                  <div className="comment-content">{c.content}</div>
                  <div className="comment-date">{formatDateTime(c.createdAt)}</div>
                </div>
              </div>
            ))
          )}
        </div>
        <form className="comment-form" onSubmit={handleCommentSubmit}>
          <input
            type="text"
            placeholder="따뜻한 댓글을 남겨보세요"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={500}
          />
          <button className="btn btn-primary btn-small" type="submit" disabled={posting || !commentText.trim()}>
            등록
          </button>
        </form>
      </div>
    </div>
  );
}
