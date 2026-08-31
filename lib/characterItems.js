// Static catalog of character customization items. Seeded into the
// `character_items` table on first run (matched by `key`, so editing this
// file later and restarting the app adds new items without touching data
// that's already been earned).
//
// category: 'body' | 'face' | 'hat' | 'accessory' | 'outfit'
// - body/outfit items carry a `color` (rendered as a CSS background color)
// - face/hat/accessory items carry an `emoji` (or text glyph) drawn on top
// cost 0 items are granted to every user automatically on signup.

export const CHARACTER_ITEMS = [
  // ── 몸 색깔 ──
  { key: 'body_mint', category: 'body', name: '민트', color: '#cde8d8', cost: 0 },
  { key: 'body_peach', category: 'body', name: '피치', color: '#f7d9c4', cost: 20 },
  { key: 'body_lavender', category: 'body', name: '라벤더', color: '#dcd3f0', cost: 20 },
  { key: 'body_sky', category: 'body', name: '하늘', color: '#cfe3f5', cost: 30 },
  { key: 'body_blush', category: 'body', name: '블러쉬', color: '#f5d0da', cost: 30 },
  { key: 'body_lemon', category: 'body', name: '레몬', color: '#f5edc0', cost: 40 },

  // ── 표정 ──
  { key: 'face_default', category: 'face', name: '기본', emoji: '⌒ ⌒', cost: 0 },
  { key: 'face_happy', category: 'face', name: '해맑음', emoji: '^ ▽ ^', cost: 15 },
  { key: 'face_wink', category: 'face', name: '윙크', emoji: '^ _ -', cost: 15 },
  { key: 'face_star', category: 'face', name: '반짝반짝', emoji: '★ ˕ ★', cost: 25 },
  { key: 'face_cat', category: 'face', name: '고양이', emoji: '=^･^=', cost: 35 },
  { key: 'face_heart', category: 'face', name: '하트눈', emoji: '♥ ‿ ♥', cost: 40 },

  // ── 모자 ──
  { key: 'hat_none', category: 'hat', name: '없음', emoji: '', cost: 0 },
  { key: 'hat_ribbon', category: 'hat', name: '리본', emoji: '🎀', cost: 20 },
  { key: 'hat_cap', category: 'hat', name: '캡모자', emoji: '🧢', cost: 25 },
  { key: 'hat_flower', category: 'hat', name: '꽃관', emoji: '🌼', cost: 30 },
  { key: 'hat_tophat', category: 'hat', name: '실크햇', emoji: '🎩', cost: 35 },
  { key: 'hat_crown', category: 'hat', name: '왕관', emoji: '👑', cost: 50 },

  // ── 악세서리 ──
  { key: 'acc_none', category: 'accessory', name: '없음', emoji: '', cost: 0 },
  { key: 'acc_star', category: 'accessory', name: '별', emoji: '⭐', cost: 15 },
  { key: 'acc_heart', category: 'accessory', name: '하트', emoji: '💖', cost: 15 },
  { key: 'acc_candy', category: 'accessory', name: '사탕', emoji: '🍭', cost: 20 },
  { key: 'acc_flower', category: 'accessory', name: '꽃', emoji: '🌸', cost: 20 },
  { key: 'acc_butterfly', category: 'accessory', name: '나비', emoji: '🦋', cost: 25 },

  // ── 옷 색깔 ──
  { key: 'outfit_basic', category: 'outfit', name: '기본', color: '#e0e0e0', cost: 0 },
  { key: 'outfit_red', category: 'outfit', name: '코랄', color: '#e8a0a0', cost: 20 },
  { key: 'outfit_blue', category: 'outfit', name: '블루', color: '#a0c4e8', cost: 20 },
  { key: 'outfit_yellow', category: 'outfit', name: '옐로우', color: '#e8d9a0', cost: 25 },
  { key: 'outfit_green', category: 'outfit', name: '그린', color: '#a0e8b8', cost: 25 },
  { key: 'outfit_purple', category: 'outfit', name: '퍼플', color: '#c9a0e8', cost: 30 },
];

export const CATEGORIES = ['body', 'face', 'hat', 'accessory', 'outfit'];
