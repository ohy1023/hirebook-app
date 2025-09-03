import { Employer, Worker } from '@/types';

// 주소 문자열 생성 (postcode 제외)
export const getAddressString = (street?: string, extra?: string): string => {
  const streetStr = street?.trim() ?? '';
  const extraStr = extra?.trim() ?? '';
  return [streetStr, extraStr].filter(Boolean).join(' ');
};

// 근로자 주소 문자열 생성
export const getWorkerAddressString = (worker: Worker | null): string => {
  if (!worker) return '';
  return getAddressString(worker.addr_street, worker.addr_extra);
};

// 고용주 주소 문자열 생성
export const getEmployerAddressString = (employer: Employer | null): string => {
  if (!employer) return '';
  return getAddressString(employer.addr_street, employer.addr_extra);
};

// 날짜 포맷팅
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ko-KR');
};

// 금액 포맷팅
export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR').format(amount);
};

// 전화번호 포맷팅 (기존 format.ts와 동일)
export const formatPhoneNumber = (phone: string | undefined): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }
  return phone;
};

// 성별 태그 스타일
export const getGenderTagStyle = (gender: string) => {
  if (gender === '남성') {
    return { color: '#007AFF', backgroundColor: '#007AFF20' };
  } else if (gender === '여성') {
    return { color: '#FF69B4', backgroundColor: '#FF69B420' };
  }
  return { color: '#666', backgroundColor: '#66620' };
};

// 직종 태그 스타일
export const getTypeTagStyle = (type: string) => {
  return { color: '#34C759', backgroundColor: '#34C75920' };
};

// 출생연도 태그 스타일
export const getBirthYearTagStyle = (birthYear: number) => {
  return { color: '#FF9500', backgroundColor: '#FF950020' };
};

// 국적 태그 스타일
export const getNationalityTagStyle = (nationality: string) => {
  return { color: '#AF52DE', backgroundColor: '#AF52DE20' };
};
