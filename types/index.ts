export type Worker = {
  id?: number;
  name: string;
  tel: string;
  type?: string;
  note?: string;
  birth_year?: number;
  gender?: string;
  university?: string;
  uni_postcode?: string;
  uni_street?: string;
  addr_postcode?: string;
  addr_street?: string;
  addr_extra?: string;
  nationality?: string;
  face?: string;
  deleted?: number;
};

export type Employer = {
  id?: number;
  name: string;
  tel?: string;
  type?: string;
  note?: string;
  addr_postcode?: string;
  addr_street?: string;
  addr_extra?: string;
  deleted?: number;
};

export type Transaction = {
  id?: number;
  record_id?: number;
  worker_id?: number;
  employer_id?: number;
  amount: number;
  date: string;
  category?: string;
  note?: string;
  type: '수입' | '지출';
  payment_type?: string;
  created_date?: string;
  updated_date?: string;
  deleted?: number;
};

export type TransactionWithDetails = Transaction & {
  worker?: Worker;
  employer?: Employer;
  category?: string;
};

export type Record = {
  id: number;
  date: string;
  created_date: string;
  updated_date: string;
  deleted: number;
  transactions?: Transaction[];
};

export type DeletedItem = {
  id: number;
  name: string;
  type: 'employer' | 'worker' | 'transaction';
  deletedDate: string;
  originalData: any;
};

export type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

export type FilterType = {
  name: string;
  tel: string;
  type: string;
  nationality?: string;
};
