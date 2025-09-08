import { ICON_NAMES } from '@/constants';
import { employerQueries } from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Employer } from '@/types';
import { formatPhoneNumber } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
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

  // 업종별 태그 색상 반환 함수
  const getTypeTagStyle = (type: string) => {
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

  useFocusEffect(
    useCallback(() => {
      async function fetchEmployers() {
        // 이미 데이터가 있고 탭 이동만 한 경우 새로 로드하지 않음
        if (employers.length === 0) {
          const rows = await employerQueries.getAll(db);
          setEmployers(rows);
          setFilteredEmployers(rows);
        }
      }
      fetchEmployers();
    }, [db, employers.length])
  );

  // 새로고침 함수
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const rows = await employerQueries.getAll(db);
      setEmployers(rows);
      setFilteredEmployers(rows);
    } catch (error) {
    } finally {
      setRefreshing(false);
    }
  }, [db]);

  // 실시간 필터링
  const handleFilter = (name: string, tel: string, type: string) => {
    const filtered = employers.filter(
      (emp) =>
        (emp.name?.toLowerCase() ?? '').includes(name.toLowerCase()) &&
        (emp.tel ?? '').includes(tel) &&
        (emp.type?.toLowerCase() ?? '').includes(type.toLowerCase())
    );
    setFilteredEmployers(filtered);
  };

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

      {/* 검색창 */}
      <View style={styles.searchContainer}>
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
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        data={filteredEmployers}
        keyExtractor={(item) => (item.id ?? 0).toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
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
