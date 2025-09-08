import { trashQueries } from '@/db/queries';
import { DeletedItem } from '@/types';
import { getTypeColor, getTypeIcon, getTypeLabel } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TrashScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [deletedItems, setDeletedItems] = useState<DeletedItem[]>([]);
  const [activeTab, setActiveTab] = useState<
    'transaction' | 'employer' | 'worker'
  >('transaction');

  useEffect(() => {
    fetchDeletedItems();
  }, []);

  const fetchDeletedItems = useCallback(async () => {
    try {
      const items: DeletedItem[] = [];

      // 삭제된 거래 내역 조회
      const deletedTransactions = await trashQueries.getDeletedTransactions(db);

      deletedTransactions.forEach((transaction) => {
        items.push({
          id: transaction.id,
          name: `${
            transaction.type === 'income' ? '수입' : '지출'
          } - ${transaction.amount?.toLocaleString()}원`,
          type: 'transaction',
          deletedDate: transaction.deleted_date,
          originalData: transaction,
        });
      });

      // 삭제된 고용주 조회
      const deletedEmployers = await trashQueries.getDeletedEmployers(db);

      deletedEmployers.forEach((employer) => {
        items.push({
          id: employer.id,
          name: employer.name || '이름 없음',
          type: 'employer',
          deletedDate: employer.deleted_date,
          originalData: employer,
        });
      });

      // 삭제된 근로자 조회
      const deletedWorkers = await trashQueries.getDeletedWorkers(db);

      deletedWorkers.forEach((worker) => {
        items.push({
          id: worker.id,
          name: worker.name || '이름 없음',
          type: 'worker',
          deletedDate: worker.deleted_date,
          originalData: worker,
        });
      });

      setDeletedItems(items);
    } catch (error) {
      console.error('삭제된 항목 조회 실패:', error);
    }
  }, [db]);

  const handleRestore = async (item: DeletedItem) => {
    try {
      const now = new Date().toISOString();

      await trashQueries.restoreItem(db, item.type, item.id);

      Alert.alert('복구 완료', '항목이 복구되었습니다.');
      fetchDeletedItems();
    } catch (error) {
      console.error('복구 실패:', error);
      Alert.alert('오류', '복구 중 오류가 발생했습니다.');
    }
  };

  const handlePermanentDelete = (item: DeletedItem) => {
    Alert.alert(
      '영구 삭제',
      '이 항목을 영구적으로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await trashQueries.permanentlyDeleteItem(db, item.type, item.id);

              Alert.alert('삭제 완료', '항목이 영구적으로 삭제되었습니다.');
              fetchDeletedItems();
            } catch (error) {
              console.error('영구 삭제 실패:', error);
              Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const getFilteredItems = () => {
    return deletedItems.filter((item) => item.type === activeTab);
  };

  const renderItem = ({ item }: { item: DeletedItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemHeader}>
        <View style={styles.itemType}>
          <View
            style={[
              styles.typeIcon,
              { backgroundColor: getTypeColor(item.type) + '20' },
            ]}
          >
            <Ionicons
              name={getTypeIcon(item.type) as any}
              size={16}
              color={getTypeColor(item.type)}
            />
          </View>
          <Text style={[styles.typeLabel, { color: getTypeColor(item.type) }]}>
            {getTypeLabel(item.type)}
          </Text>
        </View>
        <Text style={styles.deletedDate}>
          {new Date(item.deletedDate).toLocaleDateString('ko-KR')}
        </Text>
      </View>

      <Text style={styles.itemName}>{item.name}</Text>

      <View style={styles.itemActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.restoreButton]}
          onPress={() => handleRestore(item)}
        >
          <Ionicons name="refresh" size={16} color="#34C759" />
          <Text style={styles.restoreButtonText}>복구</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handlePermanentDelete(item)}
        >
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={styles.deleteButtonText}>영구삭제</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filteredItems = getFilteredItems();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>휴지통</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'transaction' && styles.activeTab,
            ]}
            onPress={() => setActiveTab('transaction')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'transaction' && styles.activeTabText,
              ]}
            >
              거래 (
              {
                deletedItems.filter((item) => item.type === 'transaction')
                  .length
              }
              )
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'employer' && styles.activeTab]}
            onPress={() => setActiveTab('employer')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'employer' && styles.activeTabText,
              ]}
            >
              고용주 (
              {deletedItems.filter((item) => item.type === 'employer').length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, activeTab === 'worker' && styles.activeTab]}
            onPress={() => setActiveTab('worker')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'worker' && styles.activeTabText,
              ]}
            >
              근로자 (
              {deletedItems.filter((item) => item.type === 'worker').length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 삭제된 항목 목록 */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => `${item.type}-${item.id}`}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="trash-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>
              {activeTab === 'transaction'
                ? '휴지통이 비어있습니다.'
                : `삭제된 ${getTypeLabel(activeTab)}가 없습니다.`}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 34,
  },
  tabContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
  },
  activeTab: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  itemCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  deletedDate: {
    color: '#666',
    fontSize: 12,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: 'center',
  },
  restoreButton: {
    backgroundColor: '#34C75920',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  restoreButtonText: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  deleteButton: {
    backgroundColor: '#FF3B3020',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
  },
});
