import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
    await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS employers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      tel TEXT,
      note TEXT,
      addr_postcode TEXT,
      addr_si TEXT,
      addr_gu TEXT,
      addr_dong TEXT,
      addr_street TEXT,
      addr_extra TEXT
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
      uni_si TEXT,
      uni_gu TEXT,
      uni_dong TEXT,
      uni_street TEXT,
      uni_extra TEXT,
      addr_postcode TEXT,
      addr_si TEXT,
      addr_gu TEXT,
      addr_dong TEXT,
      addr_street TEXT,
      addr_extra TEXT,
      nationality TEXT,
      face TEXT,
      FOREIGN KEY(employerId) REFERENCES employers(id)
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
      FOREIGN KEY(workerId) REFERENCES workers(id),
      FOREIGN KEY(employerId) REFERENCES employers(id)
    );
  `);
}
