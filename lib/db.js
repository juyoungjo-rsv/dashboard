import path from 'node:path';
import fs from 'node:fs';
import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';
import { CHARACTER_ITEMS } from './characterItems';

// In production this points at a Turso (libSQL) database via
// TURSO_DATABASE_URL / TURSO_AUTH_TOKEN, which keeps diary entries safe
// across deploys on hosts with no persistent disk (e.g. Vercel). With no
// env vars set it falls back to a local SQLite file so `npm run dev` works
// out of the box without any account.
const DATA_DIR = path.join(process.cwd(), 'data');
const LOCAL_DB_PATH = path.join(DATA_DIR, 'dashboard.db');

let client;
let readyPromise;

function getClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    } else {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      client = createClient({ url: `file:${LOCAL_DB_PATH}` });
    }
  }
  return client;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS diary_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER NOT NULL REFERENCES users(id),
  entry_date TEXT NOT NULL,
  content TEXT NOT NULL,
  mood TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(author_id, entry_date)
);

CREATE TABLE IF NOT EXISTS diary_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  blob_pathname TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_id INTEGER NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS points_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  note TEXT,
  ref_type TEXT,
  ref_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS user_streaks (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date TEXT
);

CREATE TABLE IF NOT EXISTS character_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  emoji TEXT,
  color TEXT,
  cost INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_items (
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_id INTEGER NOT NULL REFERENCES character_items(id),
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS user_equipped (
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  item_id INTEGER,
  PRIMARY KEY (user_id, category)
);
`;

// Raw helpers with no auto-init, used only while seeding (calling the
// public db.* helpers here would deadlock on readyPromise awaiting itself).
async function rawRun(sql, args = []) {
  const res = await getClient().execute({ sql, args });
  return { lastInsertRowid: Number(res.lastInsertRowid), changes: res.rowsAffected };
}
async function rawAll(sql, args = []) {
  const res = await getClient().execute({ sql, args });
  return res.rows;
}
async function rawGet(sql, args = []) {
  const rows = await rawAll(sql, args);
  return rows[0];
}

export async function ready() {
  if (!readyPromise) readyPromise = init();
  return readyPromise;
}

// Thin async helpers so call sites read like the familiar
// db.get/all/run(sql, params) shape instead of client.execute({sql, args}).
// Each call makes sure the schema/seed data exists first.
export const db = {
  async get(sql, args = []) {
    await ready();
    return rawGet(sql, args);
  },
  async all(sql, args = []) {
    await ready();
    return rawAll(sql, args);
  },
  async run(sql, args = []) {
    await ready();
    return rawRun(sql, args);
  },
};

async function init() {
  await getClient().executeMultiple(SCHEMA);
  await seedCharacterItems();
  await seedUsers();
}

async function seedCharacterItems() {
  for (const item of CHARACTER_ITEMS) {
    await rawRun(
      'INSERT OR IGNORE INTO character_items (key, category, name, emoji, color, cost) VALUES (?, ?, ?, ?, ?, ?)',
      [item.key, item.category, item.name, item.emoji ?? null, item.color ?? null, item.cost]
    );
  }
}

// Exported for reuse when a brand new account is ever created after seeding
// (not currently exposed via any route, but kept alongside seedUsers()).
export async function grantDefaultItemsAndEquip(userId) {
  const defaults = await rawAll('SELECT * FROM character_items WHERE cost = 0');
  for (const item of defaults) {
    await rawRun('INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)', [userId, item.id]);
    await rawRun(
      `INSERT INTO user_equipped (user_id, category, item_id) VALUES (?, ?, ?)
       ON CONFLICT(user_id, category) DO UPDATE SET item_id = excluded.item_id`,
      [userId, item.category, item.id]
    );
  }
}

async function seedUsers() {
  const { c: count } = await rawGet('SELECT COUNT(*) AS c FROM users');
  if (count > 0) return;

  const seeds = [
    {
      username: process.env.USER1_USERNAME || 'unni',
      password: process.env.USER1_PASSWORD || 'changeme123',
      displayName: process.env.USER1_DISPLAY_NAME || '언니',
    },
    {
      username: process.env.USER2_USERNAME || 'dongsaeng',
      password: process.env.USER2_PASSWORD || 'changeme123',
      displayName: process.env.USER2_DISPLAY_NAME || '동생',
    },
  ];

  for (const seed of seeds) {
    const hash = bcrypt.hashSync(seed.password, 10);
    const { lastInsertRowid } = await rawRun(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
      [seed.username, hash, seed.displayName]
    );
    await grantDefaultItemsAndEquip(lastInsertRowid);
  }

  if (!process.env.USER1_PASSWORD || !process.env.USER2_PASSWORD) {
    console.warn(
      '[dashboard] USER1_PASSWORD / USER2_PASSWORD 환경변수가 없어 기본 비밀번호(changeme123)로 계정을 생성했습니다. .env.local에서 반드시 변경하세요.'
    );
  }
}
