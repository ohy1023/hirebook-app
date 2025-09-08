import { Employer, Transaction, Worker } from '@/types';
import { SQLiteDatabase } from 'expo-sqlite';

// Worker 관련 쿼리
export const workerQueries = {
  // 근로자 조회
  getById: (db: SQLiteDatabase, id: number) =>
    db.getFirstAsync<Worker>('SELECT * FROM workers WHERE id = ?', [id]),

  // 근로자 목록 조회 (삭제되지 않은 것만)
  getAll: (db: SQLiteDatabase) =>
    db.getAllAsync<Worker>(
      'SELECT * FROM workers WHERE deleted = 0 ORDER BY name'
    ),

  // 근로자 검색
  search: (db: SQLiteDatabase, searchTerm: string) =>
    db.getAllAsync<Worker>(
      'SELECT * FROM workers WHERE deleted = 0 AND (name LIKE ? OR type LIKE ? OR note LIKE ?) ORDER BY name',
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    ),

  // 근로자 추가
  insert: (db: SQLiteDatabase, worker: Omit<Worker, 'id'>) =>
    db.runAsync(
      'INSERT INTO workers (name, tel, type, note, birth_year, gender, university, uni_postcode, uni_street, addr_postcode, addr_street, addr_extra, nationality, face) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        worker.name,
        worker.tel,
        worker.type || '',
        worker.note || '',
        worker.birth_year || null,
        worker.gender || '',
        worker.university || '',
        worker.uni_postcode || '',
        worker.uni_street || '',
        worker.addr_postcode || '',
        worker.addr_street || '',
        worker.addr_extra || '',
        worker.nationality || '',
        worker.face || '',
      ]
    ),

  // 근로자 수정
  update: (db: SQLiteDatabase, id: number, worker: Partial<Worker>) =>
    db.runAsync(
      'UPDATE workers SET name = ?, tel = ?, type = ?, note = ?, birth_year = ?, gender = ?, university = ?, uni_postcode = ?, uni_street = ?, addr_postcode = ?, addr_street = ?, addr_extra = ?, nationality = ?, face = ? WHERE id = ?',
      [
        worker.name || '',
        worker.tel || '',
        worker.type || '',
        worker.note || '',
        worker.birth_year || null,
        worker.gender || '',
        worker.university || '',
        worker.uni_postcode || '',
        worker.uni_street || '',
        worker.addr_postcode || '',
        worker.addr_street || '',
        worker.addr_extra || '',
        worker.nationality || '',
        worker.face || '',
        id,
      ]
    ),

  // 근로자 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync('UPDATE workers SET deleted = 1 WHERE id = ?', [id]),
};

// Employer 관련 쿼리
export const employerQueries = {
  // 고용주 조회
  getById: (db: SQLiteDatabase, id: number) =>
    db.getFirstAsync<Employer>('SELECT * FROM employers WHERE id = ?', [id]),

  // 고용주 목록 조회 (삭제되지 않은 것만)
  getAll: (db: SQLiteDatabase) =>
    db.getAllAsync<Employer>(
      'SELECT * FROM employers WHERE deleted = 0 ORDER BY name'
    ),

  // 고용주 검색
  search: (db: SQLiteDatabase, searchTerm: string) =>
    db.getAllAsync<Employer>(
      'SELECT * FROM employers WHERE deleted = 0 AND (name LIKE ? OR type LIKE ? OR note LIKE ?) ORDER BY name',
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    ),

  // 고용주 추가
  insert: (db: SQLiteDatabase, employer: Omit<Employer, 'id'>) =>
    db.runAsync(
      'INSERT INTO employers (name, tel, type, note, addr_postcode, addr_street, addr_extra) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        employer.name,
        employer.tel || '',
        employer.type || '',
        employer.note || '',
        employer.addr_postcode || '',
        employer.addr_street || '',
        employer.addr_extra || '',
      ]
    ),

  // 고용주 수정
  update: (db: SQLiteDatabase, id: number, employer: Partial<Employer>) =>
    db.runAsync(
      'UPDATE employers SET name = ?, tel = ?, type = ?, note = ?, addr_postcode = ?, addr_street = ?, addr_extra = ? WHERE id = ?',
      [
        employer.name || '',
        employer.tel || '',
        employer.type || '',
        employer.note || '',
        employer.addr_postcode || '',
        employer.addr_street || '',
        employer.addr_extra || '',
        id,
      ]
    ),

  // 고용주 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync('UPDATE employers SET deleted = 1 WHERE id = ?', [id]),
};

// Transaction 관련 쿼리
export const transactionQueries = {
  // 거래 조회
  getById: (db: SQLiteDatabase, id: number) =>
    db.getFirstAsync<Transaction>('SELECT * FROM transactions WHERE id = ?', [
      id,
    ]),

  // 근로자별 거래 목록 조회
  getByWorkerId: (db: SQLiteDatabase, workerId: number) =>
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE worker_id = ? AND deleted = 0 ORDER BY created_date DESC',
      [workerId]
    ),

  // 고용주별 거래 목록 조회
  getByEmployerId: (db: SQLiteDatabase, employerId: number) =>
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE employer_id = ? AND deleted = 0 ORDER BY created_date DESC',
      [employerId]
    ),

  // 전체 거래 목록 조회
  getAll: (db: SQLiteDatabase) =>
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE deleted = 0 ORDER BY created_date DESC'
    ),

  // 월별 거래 목록 조회
  getMonthlyTransactions: (db: SQLiteDatabase, year: number, month: number) =>
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE strftime("%Y", date) = ? AND strftime("%m", date) = ? AND deleted = 0 ORDER BY created_date ASC',
      [year.toString(), month.toString()]
    ),

  // 거래 추가
  insert: (db: SQLiteDatabase, transaction: Omit<Transaction, 'id'>) =>
    db.runAsync(
      'INSERT INTO transactions (worker_id, employer_id, amount, date, note, type) VALUES (?, ?, ?, ?, ?, ?)',
      [
        transaction.worker_id || null,
        transaction.employer_id || null,
        transaction.amount,
        transaction.date,
        transaction.note || '',
        transaction.type,
      ]
    ),

  // 거래 수정
  update: (db: SQLiteDatabase, id: number, transaction: Partial<Transaction>) =>
    db.runAsync(
      'UPDATE transactions SET worker_id = ?, employer_id = ?, amount = ?, date = ?, note = ?, type = ? WHERE id = ?',
      [
        transaction.worker_id || null,
        transaction.employer_id || null,
        transaction.amount || 0,
        transaction.date || new Date().toISOString(),
        transaction.note || '',
        transaction.type || 'income',
        id,
      ]
    ),

  // 거래 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync('UPDATE transactions SET deleted = 1 WHERE id = ?', [id]),
};

// 통계 관련 쿼리
export const statisticsQueries = {
  // 총 수입
  getTotalIncome: (db: SQLiteDatabase) =>
    db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "수입" AND deleted = 0'
    ),

  // 총 지출
  getTotalExpense: (db: SQLiteDatabase) =>
    db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "지출" AND deleted = 0'
    ),

  getTotalRefund: (db: SQLiteDatabase) =>
    db.getFirstAsync<{ total: number }>(
      'SELECT SUM(amount) as total FROM transactions WHERE type = "refund" AND deleted = 0'
    ),

  // 월별 통계
  getMonthlyStats: (db: SQLiteDatabase, year: number) =>
    db.getAllAsync<{ month: number; income: number; expense: number }>(
      `SELECT 
        CAST(strftime('%m', date) AS INTEGER) as month,
        SUM(CASE WHEN type = '수입' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type = '지출' THEN amount ELSE 0 END) as expense
       FROM transactions 
       WHERE strftime('%Y', date) = ? AND deleted = 0
       GROUP BY month
       ORDER BY month`,
      [year.toString()]
    ),
};
