import { Employer, Transaction, Worker } from '@/types';
import { getKoreanDateTime } from '@/utils/common';
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
      'INSERT INTO workers (name, tel, type, note, birth_year, gender, university, uni_postcode, uni_street, addr_postcode, addr_street, addr_extra, nationality, face, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
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
        getKoreanDateTime(),
        getKoreanDateTime(),
      ]
    ),

  // 근로자 수정
  update: (db: SQLiteDatabase, id: number, worker: Partial<Worker>) =>
    db.runAsync(
      'UPDATE workers SET name = ?, tel = ?, type = ?, note = ?, birth_year = ?, gender = ?, university = ?, uni_postcode = ?, uni_street = ?, addr_postcode = ?, addr_street = ?, addr_extra = ?, nationality = ?, face = ?, updated_date = ? WHERE id = ?',
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
        getKoreanDateTime(),
        id,
      ]
    ),

  // 근로자 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync(
      'UPDATE workers SET deleted = 1, updated_date = ? WHERE id = ?',
      [getKoreanDateTime(), id]
    ),
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
      'INSERT INTO employers (name, tel, type, note, addr_postcode, addr_street, addr_extra, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        employer.name,
        employer.tel || '',
        employer.type || '',
        employer.note || '',
        employer.addr_postcode || '',
        employer.addr_street || '',
        employer.addr_extra || '',
        getKoreanDateTime(),
        getKoreanDateTime(),
      ]
    ),

  // 고용주 수정
  update: (db: SQLiteDatabase, id: number, employer: Partial<Employer>) =>
    db.runAsync(
      'UPDATE employers SET name = ?, tel = ?, type = ?, note = ?, addr_postcode = ?, addr_street = ?, addr_extra = ?, updated_date = ? WHERE id = ?',
      [
        employer.name || '',
        employer.tel || '',
        employer.type || '',
        employer.note || '',
        employer.addr_postcode || '',
        employer.addr_street || '',
        employer.addr_extra || '',
        getKoreanDateTime(),
        id,
      ]
    ),

  // 고용주 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync(
      'UPDATE employers SET deleted = 1, updated_date = ? WHERE id = ?',
      [getKoreanDateTime(), id]
    ),
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
      'INSERT INTO transactions (worker_id, employer_id, amount, date, note, type, created_date, updated_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        transaction.worker_id || null,
        transaction.employer_id || null,
        transaction.amount,
        transaction.date,
        transaction.note || '',
        transaction.type,
        getKoreanDateTime(),
        getKoreanDateTime(),
      ]
    ),

  // 거래 수정
  update: (db: SQLiteDatabase, id: number, transaction: Partial<Transaction>) =>
    db.runAsync(
      'UPDATE transactions SET worker_id = ?, employer_id = ?, amount = ?, date = ?, note = ?, type = ?, updated_date = ? WHERE id = ?',
      [
        transaction.worker_id || null,
        transaction.employer_id || null,
        transaction.amount || 0,
        transaction.date || new Date().toISOString(),
        transaction.note || '',
        transaction.type || 'income',
        getKoreanDateTime(),
        id,
      ]
    ),

  // 거래 삭제 (소프트 삭제)
  delete: (db: SQLiteDatabase, id: number) =>
    db.runAsync(
      'UPDATE transactions SET deleted = 1, updated_date = ? WHERE id = ?',
      [getKoreanDateTime(), id]
    ),

  // 거래 상세 정보 조회 (관련 worker, employer 정보 포함)
  getByIdWithDetails: async (db: SQLiteDatabase, id: number) => {
    const transaction = await db.getFirstAsync(
      `SELECT * FROM transactions WHERE id = ? AND deleted = 0`,
      [id]
    );

    if (!transaction) return null;

    let worker = null;
    let employer = null;

    // 근로자 정보 조회
    if ((transaction as any).worker_id) {
      worker = await db.getFirstAsync(
        `SELECT id, name, tel, type, nationality, note FROM workers WHERE id = ? AND deleted = 0`,
        [(transaction as any).worker_id]
      );
    }

    // 고용주 정보 조회
    if ((transaction as any).employer_id) {
      employer = await db.getFirstAsync(
        `SELECT id, name, tel, type, note FROM employers WHERE id = ? AND deleted = 0`,
        [(transaction as any).employer_id]
      );
    }

    return {
      ...transaction,
      worker,
      employer,
    };
  },

  // 거래 삭제 (updated_date 포함)
  deleteWithTimestamp: (db: SQLiteDatabase, id: number) =>
    db.runAsync(
      'UPDATE transactions SET deleted = 1, updated_date = ? WHERE id = ?',
      [getKoreanDateTime(), id]
    ),

  // 고용주/근로자 검색 (필터링)
  searchEmployersWithFilters: async (
    db: SQLiteDatabase,
    filters: {
      name: string;
      tel: string;
      type: string;
    }
  ) => {
    let query = `
      SELECT id, name, tel, type
      FROM employers 
      WHERE deleted = 0
    `;
    const params: any[] = [];

    if (filters.name) {
      query += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }

    if (filters.tel) {
      query += ` AND tel LIKE ?`;
      params.push(`%${filters.tel}%`);
    }

    if (filters.type) {
      query += ` AND type LIKE ?`;
      params.push(`%${filters.type}%`);
    }

    query += ` ORDER BY name ASC LIMIT 50`;

    return await db.getAllAsync(query, params);
  },

  // 근로자 검색 (필터링)
  searchWorkersWithFilters: async (
    db: SQLiteDatabase,
    filters: {
      name: string;
      tel: string;
      type: string;
      nationality: string;
    }
  ) => {
    let query = `
      SELECT id, name, tel, type, nationality
      FROM workers 
      WHERE deleted = 0
    `;
    const params: any[] = [];

    if (filters.name) {
      query += ` AND name LIKE ?`;
      params.push(`%${filters.name}%`);
    }

    if (filters.tel) {
      query += ` AND tel LIKE ?`;
      params.push(`%${filters.tel}%`);
    }

    if (filters.type) {
      query += ` AND type LIKE ?`;
      params.push(`%${filters.type}%`);
    }

    if (filters.nationality) {
      query += ` AND nationality LIKE ?`;
      params.push(`%${filters.nationality}%`);
    }

    query += ` ORDER BY name ASC LIMIT 50`;

    return await db.getAllAsync(query, params);
  },

  // 거래 저장 (record 생성 포함)
  insertWithRecord: async (
    db: SQLiteDatabase,
    transaction: {
      amount: number;
      category: string;
      type: string;
      date: string;
      employerId: number | null;
      workerId: number | null;
      paymentType: string;
      note: string;
    }
  ) => {
    // 1. 먼저 해당 날짜의 record가 있는지 확인
    let recordId: number;
    const existingRecord = await db.getFirstAsync(
      `SELECT id FROM records WHERE date = ?`,
      [transaction.date]
    );

    if (existingRecord) {
      recordId = (existingRecord as any).id;
    } else {
      // 기존 record가 없으면 새로 생성
      const recordResult = await db.runAsync(
        `INSERT INTO records (date, created_date, updated_date) VALUES (?, ?, ?)`,
        [transaction.date, getKoreanDateTime(), getKoreanDateTime()]
      );
      recordId = recordResult.lastInsertRowId as number;
    }

    // 2. transaction 저장 (record_id 포함)
    const transactionResult = await db.runAsync(
      `INSERT INTO transactions (
        record_id, worker_id, employer_id, amount, date, category, type, payment_type, note, created_date, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        transaction.workerId,
        transaction.employerId,
        transaction.amount,
        transaction.date,
        transaction.category,
        transaction.type,
        transaction.paymentType,
        transaction.note,
        getKoreanDateTime(),
        getKoreanDateTime(),
      ]
    );

    return {
      recordId,
      transactionId: transactionResult.lastInsertRowId,
    };
  },

  // 거래 수정 (record 생성 포함)
  updateWithRecord: async (
    db: SQLiteDatabase,
    id: number,
    transaction: {
      amount: number;
      category: string;
      type: string;
      date: string;
      employerId: number | null;
      workerId: number | null;
      paymentType: string;
      note: string;
    }
  ) => {
    // 기존 거래 업데이트
    await db.runAsync(
      `UPDATE transactions SET
        worker_id = ?, employer_id = ?, amount = ?, date = ?, category = ?, type = ?, payment_type = ?, note = ?, updated_date = ?
        WHERE id = ?`,
      [
        transaction.workerId,
        transaction.employerId,
        transaction.amount,
        transaction.date,
        transaction.category,
        transaction.type,
        transaction.paymentType,
        transaction.note,
        getKoreanDateTime(),
        id,
      ]
    );

    // 1. 먼저 해당 날짜의 record가 있는지 확인
    let recordId: number;
    const existingRecord = await db.getFirstAsync(
      `SELECT id FROM records WHERE date = ?`,
      [transaction.date]
    );

    if (existingRecord) {
      recordId = (existingRecord as any).id;
    } else {
      // 기존 record가 없으면 새로 생성
      const recordResult = await db.runAsync(
        `INSERT INTO records (date, created_date, updated_date) VALUES (?, ?, ?)`,
        [transaction.date, getKoreanDateTime(), getKoreanDateTime()]
      );
      recordId = recordResult.lastInsertRowId as number;
    }

    // 2. transaction 저장 (record_id 포함)
    const transactionResult = await db.runAsync(
      `INSERT INTO transactions (
        record_id, worker_id, employer_id, amount, date, category, type, payment_type, note, created_date, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        transaction.workerId,
        transaction.employerId,
        transaction.amount,
        transaction.date,
        transaction.category,
        transaction.type,
        transaction.paymentType,
        transaction.note,
        getKoreanDateTime(),
        getKoreanDateTime(),
      ]
    );

    return {
      recordId,
      transactionId: transactionResult.lastInsertRowId,
    };
  },
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

  // 모든 거래 내역 조회 (통계용)
  getAllTransactions: (db: SQLiteDatabase) =>
    db.getAllAsync<Transaction>(
      'SELECT * FROM transactions WHERE deleted = 0 ORDER BY date DESC'
    ),

  // 근로자 목록 조회 (통계용)
  getWorkersForStats: (db: SQLiteDatabase) =>
    db.getAllAsync<Worker>('SELECT id, name FROM workers WHERE deleted = 0'),

  // 고용주 목록 조회 (통계용)
  getEmployersForStats: (db: SQLiteDatabase) =>
    db.getAllAsync<Employer>(
      'SELECT id, name FROM employers WHERE deleted = 0'
    ),
};

// 백업/복원 관련 쿼리
export const backupQueries = {
  // 모든 데이터 백업
  getAllData: async (db: SQLiteDatabase) => {
    const employers = await db.getAllAsync('SELECT * FROM employers');
    const workers = await db.getAllAsync('SELECT * FROM workers');
    const records = await db.getAllAsync('SELECT * FROM records');
    const transactions = await db.getAllAsync('SELECT * FROM transactions');

    return {
      employers,
      workers,
      records,
      transactions,
    };
  },

  // 모든 데이터 삭제
  deleteAllData: async (db: SQLiteDatabase) => {
    await db.runAsync('DELETE FROM transactions');
    await db.runAsync('DELETE FROM workers');
    await db.runAsync('DELETE FROM employers');
    await db.runAsync('DELETE FROM records');
  },

  // 고용주 데이터 복원
  restoreEmployers: async (db: SQLiteDatabase, employers: any[]) => {
    for (const employer of employers) {
      await db.runAsync(
        'INSERT INTO employers (id, name, tel, note, type, addr_postcode, addr_street, addr_extra, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          employer.id,
          employer.name,
          employer.tel,
          employer.note,
          employer.type,
          employer.addr_postcode,
          employer.addr_street,
          employer.addr_extra,
          employer.created_date,
          employer.updated_date,
          employer.deleted,
        ]
      );
    }
  },

  // 근로자 데이터 복원
  restoreWorkers: async (db: SQLiteDatabase, workers: any[]) => {
    for (const worker of workers) {
      await db.runAsync(
        'INSERT INTO workers (id, name, birth_year, tel, gender, type, note, university, uni_postcode, uni_street, addr_postcode, addr_street, addr_extra, nationality, face, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          worker.id,
          worker.name,
          worker.birth_year,
          worker.tel,
          worker.gender,
          worker.type,
          worker.note,
          worker.university,
          worker.uni_postcode,
          worker.uni_street,
          worker.addr_postcode,
          worker.addr_street,
          worker.addr_extra,
          worker.nationality,
          worker.face,
          worker.created_date,
          worker.updated_date,
          worker.deleted,
        ]
      );
    }
  },

  // 기록 데이터 복원
  restoreRecords: async (db: SQLiteDatabase, records: any[]) => {
    for (const record of records) {
      await db.runAsync(
        'INSERT INTO records (id, date, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?)',
        [
          record.id,
          record.date,
          record.created_date,
          record.updated_date,
          record.deleted,
        ]
      );
    }
  },

  // 거래 데이터 복원
  restoreTransactions: async (db: SQLiteDatabase, transactions: any[]) => {
    for (const transaction of transactions) {
      await db.runAsync(
        'INSERT INTO transactions (id, record_id, worker_id, employer_id, amount, date, category, type, payment_type, note, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          transaction.id,
          transaction.record_id,
          transaction.worker_id,
          transaction.employer_id,
          transaction.amount,
          transaction.date,
          transaction.category,
          transaction.type,
          transaction.payment_type,
          transaction.note,
          transaction.created_date,
          transaction.updated_date,
          transaction.deleted,
        ]
      );
    }
  },
};

// 휴지통 관련 쿼리
export const trashQueries = {
  // 삭제된 거래 내역 조회
  getDeletedTransactions: (db: SQLiteDatabase) =>
    db.getAllAsync<{
      id: number;
      type: string;
      amount: number;
      date: string;
      deleted_date: string;
    }>(
      'SELECT id, type, amount, date, updated_date as deleted_date FROM transactions WHERE deleted = 1 ORDER BY updated_date DESC'
    ),

  // 삭제된 고용주 조회
  getDeletedEmployers: (db: SQLiteDatabase) =>
    db.getAllAsync<{
      id: number;
      name: string;
      type: string;
      deleted_date: string;
    }>(
      'SELECT id, name, type, updated_date as deleted_date FROM employers WHERE deleted = 1 ORDER BY updated_date DESC'
    ),

  // 삭제된 근로자 조회
  getDeletedWorkers: (db: SQLiteDatabase) =>
    db.getAllAsync<{
      id: number;
      name: string;
      type: string;
      deleted_date: string;
    }>(
      'SELECT id, name, type, updated_date as deleted_date FROM workers WHERE deleted = 1 ORDER BY updated_date DESC'
    ),

  // 항목 복원
  restoreItem: (db: SQLiteDatabase, type: string, id: number) => {
    const now = getKoreanDateTime();

    if (type === 'employer') {
      return db.runAsync(
        'UPDATE employers SET deleted = 0, updated_date = ? WHERE id = ?',
        [now, id]
      );
    } else if (type === 'worker') {
      return db.runAsync(
        'UPDATE workers SET deleted = 0, updated_date = ? WHERE id = ?',
        [now, id]
      );
    } else if (type === 'transaction') {
      return db.runAsync(
        'UPDATE transactions SET deleted = 0, updated_date = ? WHERE id = ?',
        [now, id]
      );
    }
  },

  // 항목 영구 삭제
  permanentlyDeleteItem: (db: SQLiteDatabase, type: string, id: number) => {
    if (type === 'employer') {
      return db.runAsync('DELETE FROM employers WHERE id = ?', [id]);
    } else if (type === 'worker') {
      return db.runAsync('DELETE FROM workers WHERE id = ?', [id]);
    } else if (type === 'transaction') {
      return db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
    }
  },
};

// 거래 목록 조회 관련 쿼리
export const transactionListQueries = {
  // 월별 거래 목록 조회 (records와 transactions 조인)
  getMonthlyTransactionsWithRecords: async (
    db: SQLiteDatabase,
    year: number,
    month: number
  ) => {
    // records 테이블에서 해당 월의 레코드 조회
    const recordsResult = await db.getAllAsync(
      `SELECT 
        r.id as record_id,
        r.date,
        COUNT(t.id) as transaction_count,
        SUM(CASE WHEN t.type = '수입' THEN t.amount ELSE 0 END) as total_income,
        SUM(CASE WHEN t.type = '지출' THEN t.amount ELSE 0 END) as total_expense
      FROM records r
      LEFT JOIN transactions t ON r.id = t.record_id AND t.deleted = 0
      WHERE strftime('%Y', r.date) = ? AND strftime('%m', r.date) = ?
      GROUP BY r.id, r.date
      ORDER BY r.date DESC`,
      [year.toString(), month.toString()]
    );

    const transactionsWithDetails = [];

    for (const record of recordsResult as any[]) {
      const transactionsResult = await db.getAllAsync(
        `SELECT 
          t.*,
          w.name as worker_name,
          e.name as employer_name
        FROM transactions t
        LEFT JOIN workers w ON t.worker_id = w.id
        LEFT JOIN employers e ON t.employer_id = e.id
        WHERE t.record_id = ? AND t.deleted = 0
        ORDER BY t.created_date DESC`,
        [record.record_id]
      );

      transactionsWithDetails.push({
        ...record,
        transactions: transactionsResult,
      });
    }

    return transactionsWithDetails;
  },
};
