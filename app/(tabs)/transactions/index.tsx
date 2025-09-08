import { Record } from '@/types';
import { changeMonth, formatCurrency, getMonthYear } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function TransactionsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());
  const [tempMonth, setTempMonth] = useState(new Date().getMonth() + 1);

  const scrollViewRef = useRef<ScrollView>(null);

  // 거래 데이터 로드 함수
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);

      // 현재 선택된 월의 records와 해당 record의 transactions를 조회
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // records 테이블에서 해당 월의 레코드 조회
      const recordsResult = await db.getAllAsync(
        `
        SELECT 
          r.id,
          r.date,
          r.created_date,
          r.updated_date,
          r.deleted
        FROM records r
        WHERE r.deleted = 0 
        AND strftime('%Y-%m', r.date) = ?
        ORDER BY r.date DESC
      `,
        [`${currentYear}-${String(currentMonth).padStart(2, '0')}`]
      );

      // 각 record에 대한 transactions 조회
      const recordsWithTransactions: Record[] = [];

      for (const record of recordsResult as any[]) {
        const transactionsResult = await db.getAllAsync(
          `
          SELECT 
            t.id,
            t.record_id,
            t.worker_id,
            t.employer_id,
            t.amount,
            t.date,
            t.category,
            t.type,
            t.payment_type,
            t.created_date,
            t.updated_date,
            t.deleted
          FROM transactions t
          WHERE t.deleted = 0 AND t.record_id = ?
          ORDER BY t.created_date ASC
        `,
          [record.id]
        );

        // transaction이 있는 record만 추가
        if (transactionsResult.length > 0) {
          recordsWithTransactions.push({
            id: record.id,
            date: record.date,
            created_date: record.created_date,
            updated_date: record.updated_date,
            deleted: record.deleted,
            transactions: transactionsResult.map((t: any) => ({
              id: t.id,
              record_id: t.record_id,
              worker_id: t.worker_id,
              employer_id: t.employer_id,
              amount: t.amount,
              date: t.date,
              category: t.category,
              type: t.type,
              payment_type: t.payment_type,
              created_date: t.created_date,
              updated_date: t.updated_date,
              deleted: t.deleted,
            })),
          });
        }
      }

      setRecords(recordsWithTransactions);
    } catch (error) {
      console.error('거래 데이터 로드 중 오류:', error);
      // 오류 발생 시 빈 배열로 설정
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [db, currentDate]);

  // 화면에 포커스될 때마다 데이터 새로고침 (스크롤 위치는 유지)
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
      // 스크롤 위치 초기화는 제거하여 사용자 경험 개선
    }, [loadTransactions])
  );

  // currentDate가 변경될 때마다 데이터 로드
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const totalIncome = records.reduce(
    (sum, record) =>
      sum +
      (record.transactions?.reduce(
        (tSum, t) => (t.type === '수입' ? tSum + Math.abs(t.amount) : tSum),
        0
      ) ?? 0),
    0
  );
  const totalExpense = records.reduce(
    (sum, record) =>
      sum +
      (record.transactions?.reduce(
        (tSum, t) => (t.type === '지출' ? tSum + Math.abs(t.amount) : tSum),
        0
      ) ?? 0),
    0
  );
  const total = totalIncome - totalExpense;

  const handleChangeMonth = (direction: 'prev' | 'next') => {
    const newDate = changeMonth(currentDate, direction);
    setCurrentDate(newDate);
  };

  const openDatePicker = () => {
    setTempYear(currentDate.getFullYear());
    setTempMonth(currentDate.getMonth() + 1);
    setIsDatePickerVisible(true);
  };

  const confirmDateChange = () => {
    const newDate = new Date(tempYear, tempMonth - 1, 1);
    setCurrentDate(newDate);
    setIsDatePickerVisible(false);
  };

  // 스크롤 위치를 맨 위로 초기화하는 함수
  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  // 외부에서 호출할 수 있도록 함수를 전역으로 노출
  useFocusEffect(
    useCallback(() => {
      // 전역 함수로 등록 (탭 레이아웃에서 호출할 수 있도록)
      (global as any).scrollTransactionsToTop = scrollToTop;

      return () => {
        // 정리
        delete (global as any).scrollTransactionsToTop;
      };
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>고용 장부</Text>
      </View>

      {/* 날짜 네비게이션 */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => handleChangeMonth('prev')}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={openDatePicker}
          style={styles.currentMonthButton}
        >
          <Text style={styles.currentMonth}>{getMonthYear(currentDate)}</Text>
          <Ionicons
            name="chevron-down"
            size={16}
            color="#fff"
            style={styles.dropdownIcon}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleChangeMonth('next')}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 월별 요약 */}
      <View style={styles.monthlySummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>수입</Text>
          <Text style={styles.summaryIncome}>
            {formatCurrency(totalIncome)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>지출</Text>
          <Text style={styles.summaryExpense}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>합계</Text>
          <Text
            style={[styles.summaryTotal, total < 0 && styles.negativeTotal]}
          >
            {total < 0 ? '-' : ''}
            {formatCurrency(Math.abs(total))}
          </Text>
        </View>
      </View>

      {/* 거래 내역 */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.transactionsContainer}
        showsVerticalScrollIndicator={false}
        // 성능 최적화
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadTransactions}
            tintColor="#FF3B30"
            colors={['#FF3B30']}
          />
        }
      >
        {loading && records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="refresh" size={64} color="#666" />
            <Text style={styles.emptyText}>데이터를 불러오는 중...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="document-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>거래 내역이 없습니다</Text>
            <Text style={styles.emptySubText}>새로운 거래를 추가해보세요</Text>
          </View>
        ) : (
          records.map((record, index) => {
            const dayName = format(new Date(record.date), 'EEEE', {
              locale: ko,
            });
            const dayIncome =
              record.transactions?.reduce(
                (sum, t) =>
                  t.type === '수입' ? sum + Math.abs(t.amount) : sum,
                0
              ) ?? 0;
            const dayExpense =
              record.transactions?.reduce(
                (sum, t) =>
                  t.type === '지출' ? sum + Math.abs(t.amount) : sum,
                0
              ) ?? 0;

            return (
              <View key={index} style={styles.transactionDay}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayText}>
                    {format(new Date(record.date), 'dd', { locale: ko })}
                  </Text>
                  <Text style={styles.dayName}>{dayName}</Text>
                </View>

                <View style={styles.daySummary}>
                  <Text style={styles.daySummaryText}>
                    수입: {formatCurrency(dayIncome)}
                  </Text>
                  <Text style={styles.daySummaryText}>
                    지출: {formatCurrency(dayExpense)}
                  </Text>
                </View>

                {record.transactions?.map((transaction, itemIndex) => (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.transactionItem}
                    onPress={() =>
                      router.push(`/transactions/${transaction.id}` as any)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={styles.itemLeft}>
                      <View style={styles.itemIcon}>
                        <Ionicons
                          name={
                            transaction.type === '지출'
                              ? 'remove-circle'
                              : transaction.type === '수입'
                              ? 'add-circle'
                              : 'refresh-circle'
                          }
                          size={24}
                          color={
                            transaction.type === '지출'
                              ? '#FF6B6B'
                              : transaction.type === '수입'
                              ? '#4CAF50'
                              : '#2196F3'
                          }
                        />
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemCategory}>
                          {transaction.category}
                        </Text>
                        <Text style={styles.itemPayment}>
                          {transaction.type} • {transaction.payment_type}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.itemRight}>
                      <Text
                        style={[
                          styles.itemAmount,
                          transaction.type === '수입' &&
                            styles.itemAmountIncome,
                          transaction.type === '지출' &&
                            styles.itemAmountExpense,
                        ]}
                      >
                        {transaction.type === '수입' ? '+' : '-'}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color="#8E8E93"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fabPrimary}
          onPress={() => router.push('/transactions/add')}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 날짜 선택 모달 */}
      <Modal
        visible={isDatePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDatePickerVisible(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>날짜 선택</Text>
              <TouchableOpacity onPress={() => setIsDatePickerVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerContainer}>
              {/* 연도 선택 */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>연도</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setTempYear(tempYear - 1)}
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{tempYear}년</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setTempYear(tempYear + 1)}
                  >
                    <Ionicons name="add" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 월 선택 */}
              <View style={styles.pickerSection}>
                <Text style={styles.pickerLabel}>월</Text>
                <View style={styles.pickerRow}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() =>
                      setTempMonth(tempMonth > 1 ? tempMonth - 1 : 12)
                    }
                  >
                    <Ionicons name="remove" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{tempMonth}월</Text>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() =>
                      setTempMonth(tempMonth < 12 ? tempMonth + 1 : 1)
                    }
                  >
                    <Ionicons name="add" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsDatePickerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDateChange}
              >
                <Text style={styles.confirmButtonText}>확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  dateNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 20,
  },
  currentMonth: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  currentMonthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
  },
  dropdownIcon: {
    marginLeft: 8,
  },

  monthlySummary: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  summaryIncome: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryExpense: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryTotal: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  negativeTotal: {
    color: '#FF3B30',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    color: '#666',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
  },
  transactionDay: {
    marginBottom: 25,
  },

  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  dayName: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 14,
    color: '#999',
  },
  daySummary: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 15,
  },
  daySummaryText: {
    color: '#999',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
  },
  itemCategory: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  itemPayment: {
    color: '#666',
    fontSize: 12,
  },
  itemAmount: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  itemAmountIncome: {
    color: '#4CAF50',
  },
  itemAmountExpense: {
    color: '#FF3B30',
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    gap: 15,
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  pickerSection: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    color: '#999',
    marginBottom: 10,
    textAlign: 'center',
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
