import {
  employerQueries,
  transactionQueries,
  workerQueries,
} from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Employer, Transaction, Worker } from '@/types';
import { formatPhoneNumber } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface TransactionWithDetails extends Transaction {
  worker?: Worker;
  employer?: Employer;
  category?: string;
}

export default function TransactionsScreen() {
  const { workerId } = useLocalSearchParams<{ workerId?: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [transactions, setTransactions] = useState<TransactionWithDetails[]>(
    []
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionWithDetails[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [startDate, setStartDate] = useState('2025-01-01');
  const [endDate, setEndDate] = useState('2025-12-31');
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [currentWorker, setCurrentWorker] = useState<Worker | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = useCallback(async () => {
    try {
      let transactionRows: Transaction[];

      // workerId가 있으면 해당 근로자의 거래만 가져오기
      if (workerId) {
        transactionRows = await transactionQueries.getByWorkerId(
          db,
          Number(workerId)
        );
      } else {
        // workerId가 없으면 모든 거래 가져오기
        transactionRows = await transactionQueries.getAll(db);
      }

      // 거래에 근로자와 고용주 정보 추가
      const transactionsWithDetails = await Promise.all(
        transactionRows.map(async (transaction) => {
          let worker: Worker | undefined;
          let employer: Employer | undefined;

          if (transaction.worker_id) {
            const workerData = await workerQueries.getById(
              db,
              transaction.worker_id
            );
            worker = workerData || undefined;
          }
          if (transaction.employer_id) {
            const employerData = await employerQueries.getById(
              db,
              transaction.employer_id
            );
            employer = employerData || undefined;
          }

          return {
            ...transaction,
            worker,
            employer,
          };
        })
      );

      setTransactions(transactionsWithDetails);
      setFilteredTransactions(transactionsWithDetails);

      // workerId가 있으면 해당 근로자 정보도 가져오기
      if (workerId) {
        const workerData = await workerQueries.getById(db, Number(workerId));
        setCurrentWorker(workerData || null);
      } else {
        setCurrentWorker(null);
      }
    } catch (error) {
      console.error('거래 기록 불러오기 실패:', error);
    }
  }, [db, workerId]);

  useFocusEffect(
    useCallback(() => {
      if (transactions.length === 0) {
        fetchTransactions();
      }
    }, [transactions.length, fetchTransactions])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  }, [fetchTransactions]);

  // 실시간 필터링
  const handleFilter = useCallback(
    (startDateFilter: string, endDateFilter: string) => {
      try {
        console.log(
          'handleFilter called with:',
          startDateFilter,
          endDateFilter
        );
        console.log('transactions length:', transactions.length);

        if (!transactions || transactions.length === 0) {
          setFilteredTransactions([]);
          return;
        }

        let filtered = transactions;

        // 날짜 필터링
        if (startDateFilter || endDateFilter) {
          filtered = filtered.filter((transaction) => {
            try {
              const transactionDate = new Date(transaction.date);
              const start = startDateFilter ? new Date(startDateFilter) : null;
              const end = endDateFilter ? new Date(endDateFilter) : null;

              if (start && end) {
                return transactionDate >= start && transactionDate <= end;
              } else if (start) {
                return transactionDate >= start;
              } else if (end) {
                return transactionDate <= end;
              }
              return true;
            } catch (error) {
              console.error('날짜 필터링 오류:', error);
              return true;
            }
          });
        }

        console.log('filtered length:', filtered.length);
        setFilteredTransactions(filtered);
      } catch (error) {
        console.error('handleFilter 오류:', error);
        setFilteredTransactions(transactions || []);
      }
    },
    [transactions]
  );

  // 초기 필터 적용
  useEffect(() => {
    if (transactions.length > 0) {
      setTimeout(() => {
        handleFilter('2025-01-01', '2025-12-31');
      }, 100);
    }
  }, [transactions, handleFilter]);

  const onChangeStartDate = (text: string) => {
    // 숫자만 허용
    const numbersOnly = text.replace(/[^\d]/g, '');

    // YYYY-MM-DD 형식으로 포맷팅
    let formatted = '';
    if (numbersOnly.length >= 1) {
      formatted = numbersOnly.substring(0, 4);
      if (numbersOnly.length >= 5) {
        formatted += '-' + numbersOnly.substring(4, 6);
        if (numbersOnly.length >= 7) {
          formatted += '-' + numbersOnly.substring(6, 8);
        }
      }
    }

    setStartDate(formatted);

    // 완전한 날짜 형식일 때만 필터링 적용
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(formatted)) {
      handleFilter(formatted, endDate);
    }
  };

  const onChangeEndDate = (text: string) => {
    // 숫자만 허용
    const numbersOnly = text.replace(/[^\d]/g, '');

    // YYYY-MM-DD 형식으로 포맷팅
    let formatted = '';
    if (numbersOnly.length >= 1) {
      formatted = numbersOnly.substring(0, 4);
      if (numbersOnly.length >= 5) {
        formatted += '-' + numbersOnly.substring(4, 6);
        if (numbersOnly.length >= 7) {
          formatted += '-' + numbersOnly.substring(6, 8);
        }
      }
    }

    setEndDate(formatted);

    // 완전한 날짜 형식일 때만 필터링 적용
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (dateRegex.test(formatted)) {
      handleFilter(startDate, formatted);
    }
  };

  const clearDateFilter = () => {
    setStartDate('2025-01-01');
    setEndDate('2025-12-31');
    setTimeout(() => {
      handleFilter('2025-01-01', '2025-12-31');
    }, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 정렬된 거래 목록 (메모이제이션)
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();

      // 날짜가 같으면 ID로 정렬 (일관된 순서 보장)
      if (dateA === dateB) {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return sortOrder === 'asc' ? idA - idB : idB - idA;
      }

      if (sortOrder === 'asc') {
        return dateA - dateB; // 오름차순 (오래된 것부터)
      } else {
        return dateB - dateA; // 내림차순 (최신 것부터)
      }
    });
  }, [filteredTransactions, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  // 총 수입, 총 지출, 합계 계산
  const calculateTotals = () => {
    console.log('filteredTransactions:', filteredTransactions.length);
    console.log('transactions:', transactions.length);

    // 거래 데이터 구조 확인
    if (filteredTransactions.length > 0) {
      console.log(
        'First transaction:',
        JSON.stringify(filteredTransactions[0], null, 2)
      );
    }

    const incomeTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === '수입'
    );
    const expenseTransactions = filteredTransactions.filter(
      (transaction) => transaction.type === '지출'
    );

    console.log('incomeTransactions:', incomeTransactions.length);
    console.log('expenseTransactions:', expenseTransactions.length);

    const totalIncome = incomeTransactions.reduce((sum, transaction) => {
      console.log(
        'income transaction amount:',
        transaction.amount,
        'type:',
        typeof transaction.amount
      );
      return sum + (transaction.amount || 0);
    }, 0);

    const totalExpense = expenseTransactions.reduce((sum, transaction) => {
      console.log(
        'expense transaction amount:',
        transaction.amount,
        'type:',
        typeof transaction.amount
      );
      return sum + (transaction.amount || 0);
    }, 0);

    const balance = totalIncome - totalExpense;

    console.log(
      'totalIncome:',
      totalIncome,
      'totalExpense:',
      totalExpense,
      'balance:',
      balance
    );

    return { totalIncome, totalExpense, balance };
  };

  const { totalIncome, totalExpense, balance } = calculateTotals();

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>
                {currentWorker
                  ? `${currentWorker.name} 거래 기록`
                  : '거래 기록'}
              </Text>
              {currentWorker && (
                <Text style={styles.headerSubtitle}>
                  {currentWorker.tel && formatPhoneNumber(currentWorker.tel)}
                </Text>
              )}
            </View>
            <View style={styles.headerSpacer} />
          </View>
        </View>

        {/* 날짜 필터 */}
        <View style={styles.dateFilterSection}>
          {/* 날짜 필터 토글 버튼 */}
          <TouchableOpacity
            style={styles.dateFilterToggle}
            onPress={() => setShowDateFilter(!showDateFilter)}
          >
            <Ionicons name="calendar" size={20} color={colors.textSecondary} />
            <Text style={styles.dateFilterText}>
              {startDate === '2025-01-01' && endDate === '2025-12-31'
                ? '2025년 전체'
                : '날짜 필터 적용됨'}
            </Text>
            <Ionicons
              name={showDateFilter ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          {/* 날짜 필터 입력창 */}
          {showDateFilter && (
            <View style={styles.dateFilterContainer}>
              <View style={styles.dateFilterHeader}>
                <View style={styles.dateFilterHeaderLeft}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.dateFilterHeaderText}>기간 설정</Text>
                </View>
                <View style={styles.dateFilterIndicator}>
                  <View
                    style={[
                      styles.indicatorDot,
                      {
                        backgroundColor: startDate
                          ? colors.success
                          : colors.gray,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.indicatorLine,
                      {
                        backgroundColor:
                          startDate && endDate ? colors.success : colors.gray,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.indicatorDot,
                      {
                        backgroundColor: endDate ? colors.success : colors.gray,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.dateInputRow}>
                <View style={styles.dateInputContainer}>
                  <View style={styles.dateInputLabelContainer}>
                    <Ionicons
                      name="play-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.dateLabel}>시작일</Text>
                  </View>
                  <TextInput
                    style={styles.dateInputWrapper}
                    value={startDate}
                    onChangeText={onChangeStartDate}
                    placeholder="2025-01-01"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      // 키보드 숨기기
                      if (startDate.length === 10) {
                        handleFilter(startDate, endDate);
                      }
                    }}
                  />
                </View>

                <View style={styles.dateArrowContainer}>
                  <Ionicons
                    name="arrow-forward"
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>

                <View style={styles.dateInputContainer}>
                  <View style={styles.dateInputLabelContainer}>
                    <Ionicons
                      name="stop-circle"
                      size={16}
                      color={colors.danger}
                    />
                    <Text style={styles.dateLabel}>종료일</Text>
                  </View>
                  <TextInput
                    style={styles.dateInputWrapper}
                    value={endDate}
                    onChangeText={onChangeEndDate}
                    placeholder="2025-12-31"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={10}
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      // 키보드 숨기기
                      if (endDate.length === 10) {
                        handleFilter(startDate, endDate);
                      }
                    }}
                  />
                </View>
              </View>

              {(startDate || endDate) && (
                <View style={styles.dateFilterActions}>
                  <View style={styles.dateFilterStatus}>
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={colors.success}
                    />
                    <Text style={styles.dateFilterStatusText}>
                      {startDate && endDate
                        ? `${startDate} ~ ${endDate} 기간 필터 적용됨`
                        : startDate
                        ? `${startDate} 이후 거래 표시`
                        : `${endDate} 이전 거래 표시`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.clearDateButton}
                    onPress={clearDateFilter}
                  >
                    <Ionicons name="refresh" size={16} color={colors.danger} />
                    <Text style={styles.clearDateText}>초기화</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 통계 섹션 */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <TouchableOpacity
              style={styles.summaryHeader}
              onPress={() => setShowStats(!showStats)}
            >
              <View style={styles.summaryHeaderLeft}>
                <Ionicons name="analytics" size={20} color={colors.primary} />
                <Text style={styles.summaryTitle}>거래 통계</Text>
              </View>
              <Ionicons
                name={showStats ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>

            {showStats && (
              <>
                {/* 통계 정보 */}
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <View style={styles.summaryItemHeader}>
                      <Ionicons
                        name="trending-up"
                        size={16}
                        color={colors.success}
                      />
                      <Text style={styles.summaryItemLabel}>총 수입</Text>
                    </View>
                    <Text
                      style={[
                        styles.summaryItemValue,
                        { color: colors.success },
                      ]}
                    >
                      +{totalIncome.toLocaleString()}원
                    </Text>
                  </View>

                  <View style={styles.summaryItem}>
                    <View style={styles.summaryItemHeader}>
                      <Ionicons
                        name="trending-down"
                        size={16}
                        color={colors.danger}
                      />
                      <Text style={styles.summaryItemLabel}>총 지출</Text>
                    </View>
                    <Text
                      style={[
                        styles.summaryItemValue,
                        { color: colors.danger },
                      ]}
                    >
                      -{totalExpense.toLocaleString()}원
                    </Text>
                  </View>
                </View>

                <View style={styles.summaryBalance}>
                  <View style={styles.summaryBalanceHeader}>
                    <Ionicons
                      name={balance >= 0 ? 'wallet' : 'warning'}
                      size={18}
                      color={balance >= 0 ? colors.success : colors.danger}
                    />
                    <Text style={styles.summaryBalanceLabel}>합계</Text>
                  </View>
                  <Text
                    style={[
                      styles.summaryBalanceValue,
                      { color: balance >= 0 ? colors.success : colors.danger },
                    ]}
                  >
                    {balance >= 0 ? '+' : ''}
                    {balance.toLocaleString()}원
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* 거래 기록 리스트 */}
        <View style={styles.transactionsListContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderTitle}>거래 기록</Text>
            <View style={styles.listHeaderRight}>
              <Text style={styles.listHeaderCount}>
                {filteredTransactions.length}건
              </Text>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={toggleSortOrder}
              >
                <Ionicons
                  name={sortOrder === 'asc' ? 'arrow-up' : 'arrow-down'}
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.sortButtonText}>
                  {sortOrder === 'asc' ? '오름차순' : '내림차순'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {sortedTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={styles.transactionItem}
                  onPress={() =>
                    router.push(`/transactions/${transaction.id}` as any)
                  }
                >
                  <View style={styles.transactionItemContent}>
                    <View style={styles.transactionIconContainer}>
                      <Ionicons
                        name={
                          transaction.type === '수입'
                            ? 'trending-up'
                            : 'trending-down'
                        }
                        size={20}
                        color={
                          transaction.type === '수입'
                            ? colors.success
                            : colors.danger
                        }
                      />
                    </View>

                    <View style={styles.transactionInfo}>
                      <View style={styles.transactionHeader}>
                        <Text style={styles.transactionType}>
                          {transaction.category
                            ? `${transaction.type} (${transaction.category})`
                            : transaction.type}
                        </Text>
                        <Text style={styles.transactionDate}>
                          {formatDate(transaction.date)}
                        </Text>
                      </View>

                      <View style={styles.transactionDetails}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                transaction.type === '수입'
                                  ? colors.success
                                  : colors.danger,
                            },
                          ]}
                        >
                          {transaction.type === '수입' ? '+' : '-'}
                          {transaction.amount.toLocaleString()}원
                        </Text>
                        {transaction.employer && (
                          <Text style={styles.transactionEmployer}>
                            {transaction.employer.name}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.transactionArrow}>
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textSecondary}
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={64} color={colors.gray} />
              <Text style={styles.emptyStateTitle}>거래 기록이 없습니다</Text>
              <Text style={styles.emptyStateSubtitle}>
                {startDate !== '2025-01-01' || endDate !== '2025-12-31'
                  ? '선택한 기간에 거래 기록이 없습니다'
                  : '아직 등록된 거래 기록이 없습니다'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  headerSpacer: {
    width: 40,
  },
  sectionHeader: {
    backgroundColor: colors.dark,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  dateFilterSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateFilterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateFilterText: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    marginLeft: 10,
  },
  dateFilterContainer: {
    marginTop: 12,
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 8,
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    gap: 6,
  },
  clearDateText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  dateFilterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateFilterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateFilterHeaderText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  dateFilterIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  indicatorLine: {
    width: 20,
    height: 2,
    borderRadius: 1,
  },
  dateInputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateInputWrapper: {
    backgroundColor: colors.dark,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
    color: colors.text,
    fontSize: 16,
    textAlign: 'center',
  },
  dateArrowContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  dateFilterActions: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dateFilterStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  dateFilterStatusText: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  // 통계 섹션 스타일
  summaryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  summaryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryBalance: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  summaryBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  summaryBalanceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  summaryBalanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  // 거래 기록 리스트 스타일
  transactionsListContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  listHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  listHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listHeaderCount: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  transactionItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionEmployer: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  transactionArrow: {
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
