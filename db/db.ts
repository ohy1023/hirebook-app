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
      employerId INTEGER,
      name TEXT,
      age INTEGER,
      tel TEXT,
      gender TEXT,
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
      workerId INTEGER,
      employerId INTEGER,
      date TEXT,
      baseSalary INTEGER,
      commission INTEGER,
      netSalary INTEGER,
      status TEXT,
      note TEXT,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_date TEXT DEFAULT CURRENT_TIMESTAMP,
      deleted INTEGER DEFAULT 0
    );
  `);
}
