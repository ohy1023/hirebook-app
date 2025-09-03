import { formatPhoneNumber } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
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
  gender?: string;
};

export default function WorkersScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);

  const [searchName, setSearchName] = useState('');
  const [searchTel, setSearchTel] = useState('');
  const [searchType, setSearchType] = useState('');
  const [searchNationality, setSearchNationality] = useState('');

  useFocusEffect(
    useCallback(() => {
      async function fetchWorkers() {
        const rows = await db.getAllAsync<Worker>(
          'SELECT * FROM workers WHERE deleted = 0 ORDER BY name'
        );
        setWorkers(rows);
        setFilteredWorkers(rows);
      }
      fetchWorkers();
    }, [db])
  );

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
            <Ionicons name="person" size={24} color="#34C759" />
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="briefcase"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="직종 입력"
              placeholderTextColor="#666"
              value={searchType}
              onChangeText={onChangeSearchType}
            />
          </View>
          <View style={styles.searchInputContainer}>
            <Ionicons
              name="globe"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="국적 입력"
              placeholderTextColor="#666"
              value={searchNationality}
              onChangeText={onChangeSearchNationality}
            />
          </View>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.divider} />

      <FlatList
        data={filteredWorkers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#666" />
          </View>
        }
      />

      {/* 플로팅 액션 버튼 */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => router.push('/workers/add' as any)}
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
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
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
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  itemImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#34C75920',
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
    color: '#FF9500',
    fontSize: 12,
    backgroundColor: '#FF950020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  nationality: {
    color: '#AF52DE',
    fontSize: 12,
    backgroundColor: '#AF52DE20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#AF52DE',
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
    color: '#34C759',
    fontSize: 12,
    backgroundColor: '#34C75920',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#34C759',
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
  genderTag: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  maleTag: {
    color: '#007AFF',
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  femaleTag: {
    color: '#FF69B4',
    backgroundColor: '#FF69B420',
    borderColor: '#FF69B4',
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
