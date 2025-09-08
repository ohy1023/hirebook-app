import { StyleSheet } from 'react-native';

// 공통 색상
export const colors = {
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
};

// 공통 스타일
export const commonStyles = StyleSheet.create({
  // 컨테이너
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },

  // 카드
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // 섹션 제목
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
  },

  // 정보 행
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  // 정보 아이콘
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },

  // 정보 내용
  infoContent: {
    flex: 1,
  },

  // 정보 라벨
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 5,
  },

  // 정보 값
  infoValue: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 22,
  },

  // 액션 버튼
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 액션 버튼들
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  // 태그
  tag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // 모달
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 모달 내용
  modalContent: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
    position: 'relative',
  },

  // 모달 닫기 버튼
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 모달 공유 버튼
  modalShareButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 모달 이미지
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },

  // 드롭다운 메뉴
  menuModal: {
    margin: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },

  // 메뉴 컨테이너
  menuContainer: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 8,
    marginTop: 100,
    marginRight: 20,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 150,
  },

  // 메뉴 아이템
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },

  // 메뉴 아이템 텍스트
  menuItemText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
  },

  // 삭제 메뉴 아이템
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 16,
  },

  // 삭제 메뉴 아이템 텍스트
  deleteMenuItemText: {
    color: colors.danger,
  },

  // 플로팅 액션 버튼
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 10,
  },

  // 플로팅 액션 버튼 (주요)
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  // 헤더 내용
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },

  // 헤더 제목
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },

  // 메뉴 버튼
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 로딩 컨테이너
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // 로딩 텍스트
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
});

// SafeAreaView를 위한 동적 스타일 생성 함수
export const createSafeAreaStyle = (insets: any) => ({
  container: {
    ...commonStyles.container,
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  },
  fabContainer: {
    ...commonStyles.fabContainer,
    bottom: 100 + insets.bottom, // 탭바 높이 + 하단 safe area
  },
});
