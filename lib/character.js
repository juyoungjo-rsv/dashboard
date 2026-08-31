import { db } from './db';
import { getBalance } from './points';

export async function listCharacterState(userId) {
  const items = await db.all('SELECT * FROM character_items ORDER BY category, cost');
  const ownedRows = await db.all('SELECT item_id FROM user_items WHERE user_id = ?', [userId]);
  const ownedIds = new Set(ownedRows.map((r) => r.item_id));
  const equippedRows = await db.all('SELECT category, item_id FROM user_equipped WHERE user_id = ?', [userId]);
  const equipped = {};
  for (const row of equippedRows) equipped[row.category] = row.item_id;

  return {
    balance: await getBalance(userId),
    items: items.map((item) => ({ ...item, owned: ownedIds.has(item.id) })),
    equipped,
    equippedResolved: await getEquippedForUser(userId),
  };
}

export async function getEquippedForUser(userId) {
  const rows = await db.all(
    `SELECT ue.category, ci.key, ci.emoji, ci.color
     FROM user_equipped ue JOIN character_items ci ON ci.id = ue.item_id
     WHERE ue.user_id = ?`,
    [userId]
  );
  const result = {};
  for (const row of rows) result[row.category] = { key: row.key, emoji: row.emoji, color: row.color };
  return result;
}

export async function unlockItem(userId, itemId) {
  const item = await db.get('SELECT * FROM character_items WHERE id = ?', [itemId]);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const already = await db.get('SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?', [userId, itemId]);
  if (already) throw new Error('ALREADY_OWNED');

  const balance = await getBalance(userId);
  if (balance < item.cost) throw new Error('NOT_ENOUGH_POINTS');

  await db.run('INSERT INTO user_items (user_id, item_id) VALUES (?, ?)', [userId, itemId]);
  await db.run(
    'INSERT INTO points_ledger (user_id, delta, reason, note, ref_type, ref_id) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, -item.cost, 'item_unlock', `${item.name} 잠금해제`, 'character_item', itemId]
  );

  return item;
}

export async function equipItem(userId, itemId) {
  const item = await db.get('SELECT * FROM character_items WHERE id = ?', [itemId]);
  if (!item) throw new Error('ITEM_NOT_FOUND');

  const owned = await db.get('SELECT 1 FROM user_items WHERE user_id = ? AND item_id = ?', [userId, itemId]);
  if (!owned) throw new Error('NOT_OWNED');

  await db.run(
    `INSERT INTO user_equipped (user_id, category, item_id) VALUES (?, ?, ?)
     ON CONFLICT(user_id, category) DO UPDATE SET item_id = excluded.item_id`,
    [userId, item.category, itemId]
  );

  return item;
}
