import { formatPhoneNumber } from '@/utils/format';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  FlatList,
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
      <View>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.tel}>{formatPhoneNumber(item.tel ?? '')}</Text>
        <Text style={styles.type}>{item.type}</Text>
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
    <View style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="이름 입력"
          placeholderTextColor="#888" // 회색으로 표시
          value={searchName}
          onChangeText={onChangeSearchName}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="전화번호 입력"
          placeholderTextColor="#888"
          value={searchTel}
          onChangeText={onChangeSearchTel}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="종류 입력"
          placeholderTextColor="#888"
          value={searchType}
          onChangeText={onChangeSearchType}
        />
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        data={filteredEmployers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {showDeleted
              ? '삭제된 고용주가 없습니다.'
              : '등록된 고용주가 없습니다.'}
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/employers/edit')}
      >
        <Text style={styles.addButtonText}>+ 고용주 추가</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.trashButton}
        onPress={() => setShowDeleted((prev) => !prev)}
        accessibilityLabel="휴지통 토글"
      >
        <Text style={styles.trashButtonText}>
          {showDeleted ? '📋 목록' : '🗑️ 휴지통'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  searchContainer: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 8,
  },
  item: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  restoreButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  restoreButtonText: { color: '#fff', fontWeight: '600' },
  name: { color: '#000', fontSize: 16, fontWeight: '500' },
  tel: { color: '#555', fontSize: 14, marginTop: 2 },
  type: { color: '#888', fontSize: 14, marginTop: 2 },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 50,
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    backgroundColor: '#0a84ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  trashButton: {
    position: 'absolute',
    left: 16,
    bottom: 16,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  trashButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
