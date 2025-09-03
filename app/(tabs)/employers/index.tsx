import { formatPhoneNumber } from '@/utils/format';
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

type Employer = {
  id: number;
  name?: string;
  tel?: string;
  type?: string;
};

export default function EmployersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [employers, setEmployers] = useState<Employer[]>([]);
  const [filteredEmployers, setFilteredEmployers] = useState<Employer[]>([]);

  const [searchName, setSearchName] = useState('');
  const [searchTel, setSearchTel] = useState('');
  const [searchType, setSearchType] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchEmployers() {
        const rows = await db.getAllAsync<Employer>(
          'SELECT * FROM employers WHERE deleted = ? ORDER BY name',
          showDeleted ? 1 : 0
        );
        setEmployers(rows);
        setFilteredEmployers(rows);
      }
      fetchEmployers();
    }, [db, showDeleted])
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
          <Ionicons name="business" size={24} color="#007AFF" />
        </View>
        <View style={styles.itemTextContent}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.tel}>{formatPhoneNumber(item.tel ?? '')}</Text>
          <Text style={styles.type}>{item.type}</Text>
        </View>
        {showDeleted && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={async () => {
              const now = new Date().toISOString();
              await db.runAsync(
                'UPDATE employers SET deleted = 0, updated_date = ? WHERE id = ?',
                [now, item.id]
              );
              const rows = await db.getAllAsync<Employer>(
                'SELECT * FROM employers WHERE deleted = 1 ORDER BY name'
              );
              setEmployers(rows);
              setFilteredEmployers(rows);
            }}
          >
            <Text style={styles.restoreButtonText}>복구</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="이름 입력"
            placeholderTextColor="#666"
            value={searchName}
            onChangeText={onChangeSearchName}
          />
        </View>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="call"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="전화번호 입력"
            placeholderTextColor="#666"
            value={searchTel}
            onChangeText={onChangeSearchTel}
            keyboardType="phone-pad"
          />
        </View>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="briefcase"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="종류 입력"
            placeholderTextColor="#666"
            value={searchType}
            onChangeText={onChangeSearchType}
          />
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        data={filteredEmployers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>
              {showDeleted
                ? '삭제된 고용주가 없습니다.'
                : '등록된 고용주가 없습니다.'}
            </Text>
          </View>
        }
      />

      {/* 플로팅 액션 버튼 */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => router.push('/employers/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 15,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  item: {
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemTextContent: {
    flex: 1,
  },
  restoreButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  restoreButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  name: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  tel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 3,
  },
  type: {
    color: '#007AFF',
    fontSize: 12,
    backgroundColor: '#007AFF20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20,
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 10,
  },
  fabPrimary: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 8,
  },
});
