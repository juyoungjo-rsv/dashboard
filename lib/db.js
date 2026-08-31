import path from 'node:path';
import fs from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { CHARACTER_ITEMS } from './characterItems';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'dashboard.db');
export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

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
  file_name TEXT NOT NULL,
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

let db;

export function getDb() {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  seedCharacterItems(db);
  seedUsers(db);
  return db;
}

function seedCharacterItems(db) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO character_items (key, category, name, emoji, color, cost) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const item of CHARACTER_ITEMS) {
    insert.run(item.key, item.category, item.name, item.emoji ?? null, item.color ?? null, item.cost);
  }
}

export function grantDefaultItemsAndEquip(db, userId) {
  const defaults = db.prepare('SELECT * FROM character_items WHERE cost = 0').all();
  const grant = db.prepare('INSERT OR IGNORE INTO user_items (user_id, item_id) VALUES (?, ?)');
  const equip = db.prepare(
    `INSERT INTO user_equipped (user_id, category, item_id) VALUES (?, ?, ?)
     ON CONFLICT(user_id, category) DO UPDATE SET item_id = excluded.item_id`
  );
  for (const item of defaults) {
    grant.run(userId, item.id);
    equip.run(userId, item.category, item.id);
  }
}

function seedUsers(db) {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
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

  const insertUser = db.prepare(
    'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
  );

  for (const seed of seeds) {
    const hash = bcrypt.hashSync(seed.password, 10);
    const info = insertUser.run(seed.username, hash, seed.displayName);
    grantDefaultItemsAndEquip(db, Number(info.lastInsertRowid));
  }

  if (!process.env.USER1_PASSWORD || !process.env.USER2_PASSWORD) {
    console.warn(
      '[dashboard] USER1_PASSWORD / USER2_PASSWORD 환경변수가 없어 기본 비밀번호(changeme123)로 계정을 생성했습니다. .env.local에서 반드시 변경하세요.'
    );
  }
}
