import { ICON_NAMES } from '@/constants';
import { employerQueries } from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Employer } from '@/types';
import { formatPhoneNumber, getTypeTagStyle } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EmployersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [employers, setEmployers] = useState<Employer[]>([]);
  const [filteredEmployers, setFilteredEmployers] = useState<Employer[]>([]);

  const [searchName, setSearchName] = useState('');
  const [searchTel, setSearchTel] = useState('');
  const [searchType, setSearchType] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // FlatList 참조 추가
  const flatListRef = useRef<FlatList>(null);

  // 스크롤을 맨 위로 이동하는 함수
  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // 실시간 필터링
  const handleFilter = useCallback(
    (name: string, tel: string, type: string) => {
      const filtered = employers.filter(
        (emp) =>
          (emp.name?.toLowerCase() ?? '').includes(name.toLowerCase()) &&
          (emp.tel ?? '').includes(tel) &&
          (emp.type?.toLowerCase() ?? '').includes(type.toLowerCase())
      );
      setFilteredEmployers(filtered);
    },
    [employers]
  );

  // 외부에서 호출할 수 있도록 함수를 전역으로 노출
  useFocusEffect(
    useCallback(() => {
      // 전역 함수로 등록 (탭 레이아웃에서 호출할 수 있도록)
      (global as any).scrollEmployersToTop = scrollToTop;

      return () => {
        // 정리
        delete (global as any).scrollEmployersToTop;
      };
    }, [scrollToTop])
  );

  useFocusEffect(
    useCallback(() => {
      async function fetchEmployers() {
        // 탭 간 이동 시에도 데이터 새로고침하여 최신 상태 유지
        const rows = await employerQueries.getAll(db);
        setEmployers(rows);
        // 현재 필터링 조건을 유지하면서 필터링 적용
        handleFilter(searchName, searchTel, searchType);
      }
      fetchEmployers();
    }, [db, searchName, searchTel, searchType, handleFilter])
  );

  // 새로고침 함수
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const rows = await employerQueries.getAll(db);
      setEmployers(rows);
      setFilteredEmployers(rows);
    } catch {
    } finally {
      setRefreshing(false);
    }
  }, [db]);

  // 검색창 입력 핸들러
  const onChangeSearchName = (text: string) => {
    setSearchName(text);
    handleFilter(text, searchTel, searchType);
  };
  const onChangeSearchTel = (text: string) => {
    setSearchTel(text);
    handleFilter(searchName, text, searchType);
  };
  const onChangeSearchType = (text: string) => {
    setSearchType(text);
    handleFilter(searchName, searchTel, text);
  };

  // 필터링 초기화 함수
  const resetFilters = () => {
    setSearchName('');
    setSearchTel('');
    setSearchType('');
    setFilteredEmployers(employers);
  };

  const renderItem = ({ item }: { item: Employer }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(`/employers/${item.id}`)}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemTextContent}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{item.name}</Text>
            {item.type && (
              <Text style={[styles.type, getTypeTagStyle(item.type)]}>
                {item.type}
              </Text>
            )}
          </View>
          <Text style={styles.tel}>{formatPhoneNumber(item.tel ?? '')}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>고용주 관리</Text>
      </View>

      {/* 필터링 섹션 */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={styles.filterHeader}
          onPress={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <View style={styles.filterHeaderLeft}>
            <Ionicons name="search" size={20} color={colors.textSecondary} />
            <Text style={styles.filterHeaderText}>필터링</Text>
            {(searchName || searchTel || searchType) && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>
                  {[searchName, searchTel, searchType].filter(Boolean).length}
                </Text>
              </View>
            )}
          </View>
          <Ionicons
            name={isFilterExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {isFilterExpanded && (
          <View style={styles.filterContent}>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="person"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="이름 입력"
                placeholderTextColor={colors.textMuted}
                value={searchName}
                onChangeText={onChangeSearchName}
              />
            </View>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name={ICON_NAMES.call}
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="전화번호 입력"
                placeholderTextColor={colors.textMuted}
                value={searchTel}
                onChangeText={onChangeSearchTel}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.searchInputContainer}>
              <Ionicons
                name="briefcase"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="업종 입력"
                placeholderTextColor={colors.textMuted}
                value={searchType}
                onChangeText={onChangeSearchType}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.resetButton,
                !searchName &&
                  !searchTel &&
                  !searchType &&
                  styles.resetButtonDisabled,
              ]}
              onPress={resetFilters}
              disabled={!searchName && !searchTel && !searchType}
            >
              <Ionicons
                name="refresh"
                size={16}
                color={
                  !searchName && !searchTel && !searchType
                    ? colors.textMuted
                    : colors.primary
                }
              />
              <Text
                style={[
                  styles.resetButtonText,
                  !searchName &&
                    !searchTel &&
                    !searchType &&
                    styles.resetButtonTextDisabled,
                ]}
              >
                초기화
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        ref={flatListRef}
        data={filteredEmployers}
        keyExtractor={(item) => (item.id ?? 0).toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        // 성능 최적화
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 95, // 아이템 높이 + 마진
          offset: 95 * index,
          index,
        })}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF3B30"
            colors={['#FF3B30']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>등록된 고용주가 없습니다</Text>
          </View>
        }
      />

      {/* 플로팅 액션 버튼 */}
      <View style={commonStyles.fabContainer}>
        <TouchableOpacity
          style={commonStyles.fabPrimary}
          onPress={() => router.push('/employers/add')}
        >
          <Ionicons name={ICON_NAMES.add} size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  filterSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.darkGray,
  },
  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterHeaderText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterContent: {
    padding: 15,
    gap: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resetButtonDisabled: {
    borderColor: colors.textMuted,
  },
  resetButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButtonTextDisabled: {
    color: colors.textMuted,
  },
  searchContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  item: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  itemTextContent: {
    flex: 1,
    width: '100%',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 8,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  tel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 3,
  },
  type: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
});
