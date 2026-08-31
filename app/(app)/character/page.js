'use client';

import { useCallback, useEffect, useState } from 'react';
import CharacterAvatar from '../../../components/CharacterAvatar';
import { usePoints, useToast } from '../../../components/AppProviders';

const CATEGORY_LABELS = {
  body: '몸 색깔',
  face: '표정',
  hat: '모자',
  accessory: '악세서리',
  outfit: '옷',
};
const CATEGORIES = ['body', 'face', 'hat', 'accessory', 'outfit'];

export default function CharacterPage() {
  const { refresh: refreshPoints } = usePoints();
  const showToast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('body');
  const [actioningId, setActioningId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/character')
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleItemClick(item) {
    if (actioningId) return;
    const isEquipped = data.equipped[item.category] === item.id;
    if (isEquipped) return;

    setActioningId(item.id);
    try {
      if (!item.owned) {
        const res = await fetch('/api/character/unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id }),
        });
        const result = await res.json();
        if (!res.ok) {
          showToast(result.error || '잠금해제에 실패했어요.');
          return;
        }
        showToast(`${item.name} 잠금해제! -${item.cost}P`);
      }

      const equipRes = await fetch('/api/character/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id }),
      });
      const equipResult = await equipRes.json();
      if (equipRes.ok) {
        setData(equipResult);
        refreshPoints();
      } else {
        showToast(equipResult.error || '착용에 실패했어요.');
      }
    } finally {
      setActioningId(null);
    }
  }

  if (loading || !data) return <p className="spinner-text">불러오는 중…</p>;

  const itemsInCategory = data.items.filter((i) => i.category === activeCategory);

  return (
    <div>
      <div className="card" style={{ textAlign: 'center' }}>
        <CharacterAvatar avatar={data.equippedResolved} />
        <p className="card-sub" style={{ marginTop: 14 }}>
          보유 포인트 {data.balance.toLocaleString()}P
        </p>
      </div>

      <div className="shop-tabs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            className={`shop-tab${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      <div className="shop-grid">
        {itemsInCategory.map((item) => {
          const isEquipped = data.equipped[item.category] === item.id;
          return (
            <div
              key={item.id}
              className={`shop-item${isEquipped ? ' equipped' : ''}`}
              onClick={() => handleItemClick(item)}
              style={{ opacity: actioningId && actioningId !== item.id ? 0.5 : 1 }}
            >
              {item.color ? (
                <div className="swatch" style={{ background: item.color }} />
              ) : (
                <div className="icon">{item.emoji || '—'}</div>
              )}
              <div className="name">{item.name}</div>
              {isEquipped ? (
                <span className="status-tag equipped">착용 중</span>
              ) : item.owned ? (
                <span className="status-tag owned">보유중</span>
              ) : (
                <div className="cost">{item.cost}P</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
