// 성별 옵션
export const GENDER_OPTIONS = ['남성', '여성'] as const;

// 거래 타입
export const TRANSACTION_TYPES = ['income', 'expense'] as const;

// 거래 타입 라벨
export const TRANSACTION_TYPE_LABELS = {
  income: '수입',
  expense: '지출',
} as const;

// 아이콘 이름
export const ICON_NAMES = {
  // 기본 아이콘
  person: 'person',
  call: 'call',
  location: 'location',
  school: 'school',
  document: 'document-text',
  pencil: 'pencil',
  trash: 'trash',
  share: 'share',
  close: 'close',
  add: 'add',
  ellipsis: 'ellipsis-vertical',

  // 액션 아이콘
  edit: 'pencil',
  delete: 'trash',
  copy: 'copy',
  record: 'document-text',
  resume: 'document',
} as const;

// 색상
export const COLORS = {
  primary: '#FF3B30',
  secondary: '#007AFF',
  success: '#34C759',
  warning: '#FF9500',
  danger: '#FF3B30',
  info: '#AF52DE',
  light: '#fff',
  dark: '#000',
  gray: '#666',
  darkGray: '#333',
  cardBg: '#1C1C1E',
  border: '#333',
  text: '#fff',
  textSecondary: '#999',
  textMuted: '#666',
} as const;

// 데이터베이스 테이블명
export const TABLE_NAMES = {
  WORKERS: 'workers',
  EMPLOYERS: 'employers',
  TRANSACTIONS: 'transactions',
} as const;

// 페이지 제목
export const PAGE_TITLES = {
  WORKERS: '근로자',
  EMPLOYERS: '고용주',
  TRANSACTIONS: '거래',
  STATISTICS: '통계',
  MORE: '더보기',
} as const;

// 메뉴 아이템
export const MENU_ITEMS = {
  EDIT: '수정',
  DELETE: '삭제',
  SHARE: '공유',
  RECORD: '기록',
  RESUME: '이력서',
  TRANSACTION_RECORD: '거래 기록',
} as const;

// 알림 메시지
export const ALERT_MESSAGES = {
  DELETE_CONFIRM: '정말 삭제하시겠습니까?',
  DELETE_SUCCESS: '삭제가 완료되었습니다.',
  DELETE_FAILED: '삭제에 실패했습니다.',
  COPY_SUCCESS: '클립보드에 복사되었습니다.',
  COPY_FAILED: '복사에 실패했습니다.',
  SHARE_FAILED: '공유에 실패했습니다.',
  NO_DATA: '데이터가 없습니다.',
} as const;

// 기본값
export const DEFAULT_VALUES = {
  WORKER: {
    type: '미입력',
    birth_year: '미입력',
    gender: '미입력',
    nationality: '미입력',
    note: '미입력',
  },
  EMPLOYER: {
    note: '미입력',
  },
} as const;
