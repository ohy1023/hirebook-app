import { ICON_NAMES } from '@/constants';
import { workerQueries } from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Worker } from '@/types';
import { formatPhoneNumber } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function WorkersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchTel, setSearchTel] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchNationality, setSearchNationality] = useState('');

  // FlatList 참조 추가
  const flatListRef = useRef<FlatList>(null);

  // 스크롤을 맨 위로 이동하는 함수
  const scrollToTop = useCallback(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  }, []);

  // 외부에서 호출할 수 있도록 함수를 전역으로 노출
  useFocusEffect(
    useCallback(() => {
      (global as any).scrollWorkersToTop = scrollToTop;

      return () => {
        delete (global as any).scrollWorkersToTop;
      };
    }, [scrollToTop])
  );

  const fetchWorkers = useCallback(async () => {
    const rows = await workerQueries.getAll(db);
    setWorkers(rows);
    setFilteredWorkers(rows);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      // 탭 간 이동 시에도 데이터 새로고침하여 최신 상태 유지
      fetchWorkers();
    }, [fetchWorkers])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWorkers();
    setRefreshing(false);
  }, [fetchWorkers]);

  // 실시간 필터링
  const handleFilter = (
    name: string,
    tel: string,
    type: string,
    nationality: string
  ) => {
    const filtered = workers.filter(
      (worker) =>
        (worker.name?.toLowerCase() ?? '').includes(name.toLowerCase()) &&
        (worker.tel ?? '').includes(tel) &&
        (worker.type?.toLowerCase() ?? '').includes(type.toLowerCase()) &&
        (nationality === '' ||
          (worker.nationality?.toLowerCase() ?? '').includes(
            nationality.toLowerCase()
          ))
    );
    setFilteredWorkers(filtered);
  };

  // 검색창 입력 핸들러
  const onChangeSearchName = (text: string) => {
    setSearchName(text);
    handleFilter(text, searchTel, searchType, searchNationality);
  };
  const onChangeSearchTel = (text: string) => {
    setSearchTel(text);
    handleFilter(searchName, text, searchType, searchNationality);
  };
  const onChangeSearchType = (text: string) => {
    setSearchType(text);
    handleFilter(searchName, searchTel, text, searchNationality);
  };
  const onChangeSearchNationality = (text: string) => {
    setSearchNationality(text);
    handleFilter(searchName, searchTel, searchType, text);
  };

  const renderItem = ({ item }: { item: Worker }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => router.push(`/workers/${item.id}` as any)}
    >
      <View style={styles.itemContent}>
        {item.face ? (
          <Image source={{ uri: item.face }} style={styles.itemImage} />
        ) : (
          <View style={styles.itemImagePlaceholder}>
            <Ionicons
              name={ICON_NAMES.person}
              size={24}
              color={colors.success}
            />
          </View>
        )}
        <View style={styles.itemTextContent}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.infoRow}>
            <Text style={styles.tel}>{formatPhoneNumber(item.tel ?? '')}</Text>
            {item.birth_year && (
              <Text style={styles.birthYear}>{item.birth_year}년</Text>
            )}
            {item.nationality && (
              <Text style={styles.nationality}>{item.nationality}</Text>
            )}
            {item.type && <Text style={styles.type}>{item.type}</Text>}
            {item.gender && (
              <Text
                style={[
                  styles.genderTag,
                  item.gender === '남성' ? styles.maleTag : styles.femaleTag,
                ]}
              >
                {item.gender}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>근로자 관리</Text>
      </View>

      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="search"
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
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="briefcase"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="직종 입력"
              placeholderTextColor={colors.textMuted}
              value={searchType}
              onChangeText={onChangeSearchType}
            />
          </View>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="globe"
              size={20}
              color={colors.textSecondary}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="국적 입력"
              placeholderTextColor={colors.textMuted}
              value={searchNationality}
              onChangeText={onChangeSearchNationality}
            />
          </View>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        ref={flatListRef}
        data={filteredWorkers}
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
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyText}>등록된 근로자가 없습니다</Text>
          </View>
        }
      />

      {/* 플로팅 액션 버튼 */}
      <View style={commonStyles.fabContainer}>
        <TouchableOpacity
          style={commonStyles.fabPrimary}
          onPress={() => router.push('/workers/add' as any)}
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
  searchContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.border,
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
    flexWrap: 'wrap',
  },
  birthYear: {
    color: colors.warning,
    fontSize: 12,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  nationality: {
    color: colors.info,
    fontSize: 12,
    backgroundColor: colors.info + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.info,
  },
  restoreButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  restoreButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 12,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  tel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 3,
  },
  type: {
    color: colors.success,
    fontSize: 12,
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.success,
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
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: colors.dark,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  genderTag: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  maleTag: {
    color: colors.secondary,
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  femaleTag: {
    color: '#FF69B4',
    backgroundColor: '#FF69B420',
    borderColor: '#FF69B4',
  },
});
