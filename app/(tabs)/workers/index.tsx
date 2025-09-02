import { formatPhoneNumber } from '@/utils/format';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Worker = {
  id: number;
  name?: string;
  tel?: string;
  type?: string;
  birth_year?: number;
  nationality?: string;
  face?: string;
};

export default function WorkersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);

  const [searchName, setSearchName] = useState('');
  const [searchTel, setSearchTel] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchBirthYearFrom, setSearchBirthYearFrom] = useState('');
  const [searchBirthYearTo, setSearchBirthYearTo] = useState('');
  const [searchNationality, setSearchNationality] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  useFocusEffect(
    useCallback(() => {
      async function fetchWorkers() {
        const rows = await db.getAllAsync<Worker>(
          'SELECT * FROM workers WHERE deleted = ? ORDER BY name',
          showDeleted ? 1 : 0
        );
        setWorkers(rows);
        setFilteredWorkers(rows);
      }
      fetchWorkers();
    }, [db, showDeleted])
  );

  // 실시간 필터링
  const handleFilter = (
    name: string,
    tel: string,
    type: string,
    birthYearFrom: string,
    birthYearTo: string,
    nationality: string
  ) => {
    const filtered = workers.filter(
      (worker) =>
        (worker.name?.toLowerCase() ?? '').includes(name.toLowerCase()) &&
        (worker.tel ?? '').includes(tel) &&
        (worker.type?.toLowerCase() ?? '').includes(type.toLowerCase()) &&
        (birthYearFrom === '' ||
          birthYearTo === '' ||
          (worker.birth_year &&
            worker.birth_year >= parseInt(birthYearFrom) &&
            worker.birth_year <= parseInt(birthYearTo))) &&
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
    handleFilter(
      text,
      searchTel,
      searchType,
      searchBirthYearFrom,
      searchBirthYearTo,
      searchNationality
    );
  };
  const onChangeSearchTel = (text: string) => {
    setSearchTel(text);
    handleFilter(
      searchName,
      text,
      searchType,
      searchBirthYearFrom,
      searchBirthYearTo,
      searchNationality
    );
  };
  const onChangeSearchType = (text: string) => {
    setSearchType(text);
    handleFilter(
      searchName,
      searchTel,
      text,
      searchBirthYearFrom,
      searchBirthYearTo,
      searchNationality
    );
  };
  const onChangeSearchBirthYearFrom = (text: string) => {
    setSearchBirthYearFrom(text);
    handleFilter(
      searchName,
      searchTel,
      searchType,
      text,
      searchBirthYearTo,
      searchNationality
    );
  };
  const onChangeSearchBirthYearTo = (text: string) => {
    setSearchBirthYearTo(text);
    handleFilter(
      searchName,
      searchTel,
      searchType,
      searchBirthYearFrom,
      text,
      searchNationality
    );
  };
  const onChangeSearchNationality = (text: string) => {
    setSearchNationality(text);
    handleFilter(
      searchName,
      searchTel,
      searchType,
      searchBirthYearFrom,
      searchBirthYearTo,
      text
    );
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
            <Text style={styles.itemImagePlaceholderText}>👤</Text>
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
          </View>
        </View>
        {showDeleted && (
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={async () => {
              const now = new Date().toISOString();
              await db.runAsync(
                'UPDATE workers SET deleted = 0, updated_date = ? WHERE id = ?',
                [now, item.id]
              );
              const rows = await db.getAllAsync<Worker>(
                'SELECT * FROM workers WHERE deleted = 1 ORDER BY name'
              );
              setWorkers(rows);
              setFilteredWorkers(rows);
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
          placeholderTextColor="#888"
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
          placeholder="직종 입력"
          placeholderTextColor="#888"
          value={searchType}
          onChangeText={onChangeSearchType}
        />
      </View>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="출생연도 시작"
          placeholderTextColor="#888"
          value={searchBirthYearFrom}
          onChangeText={onChangeSearchBirthYearFrom}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="출생연도 끝"
          placeholderTextColor="#888"
          value={searchBirthYearTo}
          onChangeText={onChangeSearchBirthYearTo}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="국적 입력"
          placeholderTextColor="#888"
          value={searchNationality}
          onChangeText={onChangeSearchNationality}
        />
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {showDeleted
              ? '삭제된 근로자가 없습니다.'
              : '등록된 근로자가 없습니다.'}
          </Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/workers/add' as any)}
      >
        <Text style={styles.addButtonText}>+ 근로자 추가</Text>
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
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemImagePlaceholderText: {
    fontSize: 24,
    color: '#999',
  },
  itemTextContent: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    flexWrap: 'wrap',
  },
  birthYear: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
    overflow: 'hidden',
  },
  nationality: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#e8f4fd',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
    overflow: 'hidden',
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
  type: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 80,
    overflow: 'hidden',
  },
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
