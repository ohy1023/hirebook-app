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
  worker_id?: number;
  employer_id?: number;
  amount: number;
  date: string;
  note?: string;
  type: 'income' | 'expense';
  deleted?: number;
};
