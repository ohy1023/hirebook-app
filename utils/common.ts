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

// 출생연도 태그 스타일
export const getBirthYearTagStyle = (birthYear: number) => {
  return { color: '#FF9500', backgroundColor: '#FF950020' };
};

// 국적 태그 스타일
export const getNationalityTagStyle = (nationality: string) => {
  return { color: '#AF52DE', backgroundColor: '#AF52DE20' };
};

// 업종별 태그 색상 반환 함수 (통일된 버전)
export const getTypeTagStyle = (type: string) => {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('식당') || typeLower.includes('카페')) {
    return {
      backgroundColor: '#FF6B6B' + '20',
      borderColor: '#FF6B6B',
      color: '#FF6B6B',
    };
  } else if (
    typeLower.includes('가정집') ||
    typeLower.includes('집') ||
    typeLower.includes('청소')
  ) {
    return {
      backgroundColor: '#4ECDC4' + '20',
      borderColor: '#4ECDC4',
      color: '#4ECDC4',
    };
  } else if (
    typeLower.includes('사무실') ||
    typeLower.includes('회사') ||
    typeLower.includes('오피스')
  ) {
    return {
      backgroundColor: '#45B7D1' + '20',
      borderColor: '#45B7D1',
      color: '#45B7D1',
    };
  } else if (
    typeLower.includes('공장') ||
    typeLower.includes('공사') ||
    typeLower.includes('현장')
  ) {
    return {
      backgroundColor: '#FFA726' + '20',
      borderColor: '#FFA726',
      color: '#FFA726',
    };
  } else {
    // 기본 색상
    return {
      backgroundColor: '#007AFF' + '20',
      borderColor: '#007AFF',
      color: '#007AFF',
    };
  }
};

// 거래 관련 유틸리티 함수들
export const formatTransactionAmount = (amount: number, type: string) => {
  const formattedAmount = amount.toLocaleString();
  return type === '수입' ? `+${formattedAmount}원` : `-${formattedAmount}원`;
};

export const getTransactionIcon = (type: string) => {
  return type === '수입' ? 'trending-up' : 'trending-down';
};

export const getTransactionColor = (type: string) => {
  return type === '수입' ? '#34C759' : '#FF3B30';
};

export const getTransactionTypeText = (type: string) => {
  return type === '수입' ? '수입' : '지출';
};

// 휴지통 관련 유틸리티 함수들
export const getTypeIcon = (type: string) => {
  switch (type) {
    case 'employer':
      return 'business';
    case 'worker':
      return 'person';
    case 'transaction':
      return 'card';
    default:
      return 'help-circle';
  }
};

export const getTypeColor = (type: string) => {
  switch (type) {
    case 'employer':
      return '#007AFF';
    case 'worker':
      return '#34C759';
    case 'transaction':
      return '#FF9500';
    default:
      return '#8E8E93';
  }
};

export const getTypeLabel = (type: string) => {
  switch (type) {
    case 'employer':
      return '고용주';
    case 'worker':
      return '근로자';
    case 'transaction':
      return '거래';
    default:
      return '알 수 없음';
  }
};

// 통계 관련 유틸리티 함수들
export const formatMonth = (monthStr: string) => {
  const [year, month] = monthStr.split('-');
  return `${year}년 ${parseInt(month)}월`;
};

export const formatCurrency = (amount: number) => {
  return amount.toLocaleString('ko-KR') + '원';
};

// 날짜 관련 유틸리티 함수들
export const getMonthYear = (date: Date) => {
  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
};

export const changeMonth = (currentDate: Date, direction: 'prev' | 'next') => {
  const newDate = new Date(currentDate);
  if (direction === 'prev') {
    newDate.setMonth(newDate.getMonth() - 1);
  } else {
    newDate.setMonth(newDate.getMonth() + 1);
  }
  return newDate;
};

// 한국 시간대 (UTC+9) 시간 포맷팅 함수
export const getKoreanDateTime = (): string => {
  const now = new Date();
  // 한국 시간대(UTC+9)로 변환
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  // 시간대 정보를 +09:00으로 명시적으로 표시
  return koreanTime.toISOString().replace('Z', '+09:00');
};
