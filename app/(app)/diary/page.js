'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePoints, useToast } from '../../../components/AppProviders';

const MOODS = ['😞', '😐', '🙂', '😄', '🤩'];
const MAX_IMAGES = 4;

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDate(entryDate) {
  const [y, m, d] = entryDate.split('-').map(Number);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dow = new Date(y, m - 1, d).getDay();
  return `${m}월 ${d}일 (${days[dow]})`;
}

export default function DiaryPage() {
  const { refresh: refreshPoints } = usePoints();
  const showToast = useToast();

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [mood, setMood] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const loadEntries = useCallback(() => {
    setLoading(true);
    fetch('/api/diary')
      .then((res) => res.json())
      .then((data) => setEntries(data.entries || []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    setImages((prev) => {
      const next = [...prev, ...files.map((file) => ({ file, url: URL.createObjectURL(file) }))];
      if (next.length > MAX_IMAGES) {
        showToast(`이미지는 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`);
        return next.slice(0, MAX_IMAGES);
      }
      return next;
    });
  }

  function removeImage(idx) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[idx].url);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!content.trim()) {
      setError('일기 내용을 입력해주세요.');
      return;
    }
    setError('');
    setSubmitting(true);

    const formData = new FormData();
    formData.append('entryDate', todayStr());
    formData.append('content', content.trim());
    formData.append('mood', mood);
    images.forEach((img) => formData.append('images', img.file));

    try {
      const res = await fetch('/api/diary', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || '저장에 실패했어요.');
        return;
      }

      images.forEach((img) => URL.revokeObjectURL(img.url));
      setContent('');
      setMood('');
      setImages([]);
      setComposeOpen(false);
      loadEntries();
      refreshPoints();

      const p = data.points;
      if (p?.earned) {
        showToast(p.streakBonus ? `+${p.earned}P 획득! 🔥 연속 보너스 +${p.streakBonus}P` : `+${p.earned}P 획득!`);
      } else {
        showToast('저장했어요 ✓');
      }
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="card">
        {!composeOpen ? (
          <button className="btn btn-primary" onClick={() => setComposeOpen(true)}>
            ✏️ 오늘의 일기 쓰기
          </button>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="card-title" style={{ marginBottom: 12 }}>
              {formatDate(todayStr())} 일기
            </div>
            <div className="mood-picker">
              {MOODS.map((m) => (
                <span
                  key={m}
                  className={`mood-opt${mood === m ? ' picked' : ''}`}
                  onClick={() => setMood(mood === m ? '' : m)}
                >
                  {m}
                </span>
              ))}
            </div>
            <div className="field">
              <textarea
                placeholder="오늘 하루 어땠나요?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
              />
            </div>
            <div className="image-picker">
              {images.map((img, idx) => (
                <div className="image-thumb" key={img.url}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt="첨부 이미지" />
                  <button type="button" className="remove-btn" onClick={() => removeImage(idx)}>
                    ×
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" className="image-add-btn" onClick={() => fileInputRef.current?.click()}>
                  +
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={handleFiles}
              />
            </div>
            {error && <p className="error-text">{error}</p>}
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1 }}
                onClick={() => {
                  setComposeOpen(false);
                  setError('');
                }}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={submitting}>
                {submitting ? '저장 중…' : '저장하기'}
              </button>
            </div>
          </form>
        )}
      </div>

      {loading ? (
        <p className="spinner-text">불러오는 중…</p>
      ) : entries.length === 0 ? (
        <p className="empty-state">아직 쓰여진 일기가 없어요.
          <br />첫 일기를 남겨보세요!</p>
      ) : (
        entries.map((entry) => (
          <Link href={`/diary/${entry.id}`} key={entry.id} className="card diary-entry-card" style={{ display: 'block' }}>
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
                  <img key={img.id} src={img.url} alt="일기 사진" />
                ))}
              </div>
            )}
            <div className="diary-entry-footer">
              <span>💬 댓글 {entry.commentCount}개</span>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
