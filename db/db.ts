import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      tel TEXT,
      note TEXT,
      type TEXT,
      addr_postcode TEXT,
      addr_street TEXT,
      addr_extra TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      birth_year INTEGER,
      tel TEXT,
      gender TEXT,
      type TEXT,
      note TEXT,
      university TEXT,
      uni_postcode TEXT,
      uni_street TEXT,
      addr_postcode TEXT,
      addr_street TEXT,
      addr_extra TEXT,
      nationality TEXT,
      face TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0
    );

  CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    created_date TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    record_id INTEGER, -- FK
    worker_id INTEGER,
    employer_id INTEGER,
    amount INTEGER,
    date TEXT,
    category TEXT,
    type TEXT,
    payment_type TEXT,
    created_date TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
    deleted INTEGER DEFAULT 0,
    FOREIGN KEY (record_id) REFERENCES records (id)
  );
  `);
}
