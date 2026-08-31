'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import CharacterAvatar from '../../../components/CharacterAvatar';
import { usePoints } from '../../../components/AppProviders';

const STREAK_RING_CIRC = 2 * Math.PI * 25;

export default function DashboardPage() {
  const { balance, streak } = usePoints();
  const [me, setMe] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate()
    ).padStart(2, '0')}`;

    fetch(`/api/auth/me?date=${dateStr}`)
      .then((res) => res.json())
      .then((data) => {
        setMe(data.user);
        setPartner(data.partner);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="spinner-text">불러오는 중…</p>;

  const currentStreak = streak?.current ?? 0;
  const progressInCycle = currentStreak % 5 || (currentStreak > 0 ? 5 : 0);
  const ringPct = (progressInCycle / 5) * 100;

  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <CharacterAvatar avatar={me?.avatar} />
        <p style={{ fontSize: 13, fontWeight: 600, marginTop: 14 }}>{me?.displayName}</p>
        <p className="card-sub">보유 포인트 {balance === null ? '···' : `${balance.toLocaleString()}P`}</p>
        <Link href="/character" className="btn btn-secondary btn-small" style={{ marginTop: 12 }}>
          🧸 캐릭터 꾸미러 가기
        </Link>
      </div>

      <div className="card">
        <div className="card-title">🔥 연속 작성</div>
        <div className="streak-row" style={{ marginTop: 14 }}>
          <div className="streak-ring-wrap">
            <svg width="64" height="64" viewBox="0 0 64 64">
              <circle className="ring-bg" cx="32" cy="32" r="25" />
              <circle
                className="ring-fill"
                cx="32"
                cy="32"
                r="25"
                strokeDasharray={STREAK_RING_CIRC}
                strokeDashoffset={STREAK_RING_CIRC - (STREAK_RING_CIRC * ringPct) / 100}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '32px 32px' }}
              />
            </svg>
            <div className="streak-ring-label">{currentStreak}</div>
          </div>
          <div className="streak-info">
            <div className="big">{currentStreak}일 연속 작성 중</div>
            <div className="desc">
              {streak?.nextMilestoneIn != null
                ? `${streak.nextMilestoneIn}일 더 쓰면 +30P 보너스!`
                : '오늘부터 일기를 써서 스트릭을 시작해봐요'}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">📓 오늘의 교환일기</div>
        <div style={{ marginTop: 10 }}>
          <StatusRow label={`${me?.displayName || '나'} (나)`} done={!!me?.wroteToday} />
          {partner && <StatusRow label={partner.displayName} done={!!partner.wroteToday} />}
        </div>
        <Link href="/diary" className="btn btn-primary" style={{ marginTop: 14 }}>
          {me?.wroteToday ? '일기 보러 가기' : '오늘 일기 쓰기'}
        </Link>
      </div>
    </div>
  );
}

function StatusRow({ label, done }) {
  return (
    <div className="status-row">
      <span className={`status-dot${done ? ' done' : ''}`} />
      <span className="name">{label}</span>
      <span className="state">{done ? '작성 완료 ✓' : '아직이에요'}</span>
    </div>
  );
}
