'use client';

import { usePathname } from 'next/navigation';
import { usePoints } from './AppProviders';

const TITLES = {
  '/dashboard': { title: '홈', sub: '오늘 하루도 기록해봐요' },
  '/diary': { title: '교환일기', sub: '' },
  '/character': { title: '캐릭터 꾸미기', sub: '' },
};

function matchTitle(pathname) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith('/diary/')) return { title: '일기', sub: '' };
  return { title: '우리 둘의 비밀일기', sub: '' };
}

export default function Header() {
  const pathname = usePathname();
  const { balance } = usePoints();
  const { title, sub } = matchTitle(pathname);

  return (
    <header className="app-header">
      <div>
        <h1>{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      <div className="points-badge">
        <span className="coin">🪙</span>
        <span>{balance === null ? '···' : `${balance.toLocaleString()}P`}</span>
      </div>
    </header>
  );
}
