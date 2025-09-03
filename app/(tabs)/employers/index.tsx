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

  useFocusEffect(
    useCallback(() => {
      async function fetchEmployers() {
        const rows = await employerQueries.getAll(db);
        setEmployers(rows);
        setFilteredEmployers(rows);
      }
      fetchEmployers();
    }, [db])
  );

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
        <View style={styles.itemIcon}>
          <Ionicons name="business" size={24} color={colors.secondary} />
        </View>
        <View style={styles.itemTextContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tel}>{formatPhoneNumber(item.tel ?? '')}</Text>
          <Text style={styles.type}>{item.type}</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color={colors.gray} />
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.secondary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemTextContent: {
    flex: 1,
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
    color: colors.secondary,
    fontSize: 12,
    backgroundColor: colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
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
