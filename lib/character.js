import { getDb } from './db';
import { getBalance } from './points';

export function listCharacterState(userId) {
  const db = getDb();
  const items = db.prepare('SELECT * FROM character_items ORDER BY category, cost').all();
  const ownedIds = new Set(
    db.prepare('SELECT item_id FROM user_items WHERE user_id = ?').all(userId).map((r) => r.item_id)
  );
  const equippedRows = db.prepare('SELECT category, item_id FROM user_equipped WHERE user_id = ?').all(userId);
  const equipped = {};
  for (const row of equippedRows) equipped[row.category] = row.item_id;

  return {
    balance: getBalance(db, userId),
    items: items.map((item) => ({ ...item, owned: ownedIds.has(item.id) })),
    equipped,
    equippedResolved: getEquippedForUser(userId),
  };
}

export function getEquippedForUser(userId) {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT ue.category, ci.key, ci.emoji, ci.color
       FROM user_equipped ue JOIN character_items ci ON ci.id = ue.item_id
       WHERE ue.user_id = ?`
    )
    .all(userId);
  const result = {};
  for (const row of rows) result[row.category] = { key: row.key, emoji: row.emoji, color: row.color };
  return result;
}

export function unlockItem(userId, itemId) {
  const db = getDb();
  const item = db.prepare('SELECT * FROM character_items WHERE id = ?').get(itemId);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const already = db.prepare('SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (already) throw new Error('ALREADY_OWNED');

  const balance = getBalance(db, userId);
  if (balance < item.cost) throw new Error('NOT_ENOUGH_POINTS');

  db.prepare('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)').run(userId, itemId);
  db.prepare(
    'INSERT INTO points_ledger (user_id, delta, reason, note, ref_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(userId, -item.cost, 'item_unlock', `${item.name} 잠금해제`, 'character_item', itemId);

  return item;
}

export function equipItem(userId, itemId) {
  const db = getDb();
  const item = db.prepare('SELECT * FROM character_items WHERE id = ?').get(itemId);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const owned = db.prepare('SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?').get(userId, itemId);
  if (!owned) throw new Error('NOT_OWNED');

  db.prepare(
    `INSERT INTO user_equipped (user_id, category, item_id) VALUES (?, ?, ?)
     ON CONFLICT(user_id, category) DO UPDATE SET item_id = excluded.item_id`
  ).run(userId, item.category, itemId);

  return item;
}
