import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Transaction = {
  id: number;
  record_id: number;
  worker_id: number;
  employer_id: number;
  amount: number;
  category: string;
  type: '수입' | '지출';
  date: string;
  payment_type: string;
  created_date: string;
  updated_date: string;
  deleted: number;
};

type Worker = {
  id: number;
  name: string;
};

type Employer = {
  id: number;
  name: string;
};

type MonthlyData = {
  month: string;
  income: number;
  expense: number;
};

export default function StatisticsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);
  const [frequencyStats, setFrequencyStats] = useState<{
    [key: string]: number;
  }>({});
  const [refundStats, setRefundStats] = useState<{
    [key: string]: { count: number; amount: number };
  }>({});
  const [frequencyTab, setFrequencyTab] = useState<'worker' | 'employer'>(
    'worker'
  );
  const [refundTab, setRefundTab] = useState<'worker' | 'employer'>('worker');
  const [showAllRefunds, setShowAllRefunds] = useState(false);

  const calculateStatistics = useCallback(
    (
      transactions: Transaction[],
      workerList: Worker[],
      employerList: Employer[]
    ) => {
      let income = 0;
      let expense = 0;
      const frequencyStats: { [key: string]: number } = {};
      const refundStats: { [key: string]: { count: number; amount: number } } =
        {};
      const monthlyData: { [key: string]: MonthlyData } = {};

      transactions.forEach((transaction) => {
        if (transaction.type === '수입') {
          income += transaction.amount;
        } else {
          expense += transaction.amount;
        }

        // 거래 빈도 통계 (모든 거래)
        const worker = workerList.find((w) => w.id === transaction.worker_id);
        const employer = employerList.find(
          (e) => e.id === transaction.employer_id
        );

        if (worker) {
          const key = `근로자_${worker.name}`;
          frequencyStats[key] = (frequencyStats[key] || 0) + 1;
        }

        if (employer) {
          const key = `고용주_${employer.name}`;
          frequencyStats[key] = (frequencyStats[key] || 0) + 1;
        }

        // 환불 통계 (환불 카테고리인 경우)
        if (transaction.category === '환불') {
          if (worker) {
            const key = `근로자_${worker.name}`;
            if (!refundStats[key]) {
              refundStats[key] = { count: 0, amount: 0 };
            }
            refundStats[key].count += 1;
            refundStats[key].amount += transaction.amount;
          }

          if (employer) {
            const key = `고용주_${employer.name}`;
            if (!refundStats[key]) {
              refundStats[key] = { count: 0, amount: 0 };
            }
            refundStats[key].count += 1;
            refundStats[key].amount += transaction.amount;
          }
        }

        // 월별 트렌드
        const month = transaction.date.substring(0, 7); // YYYY-MM 형식
        if (!monthlyData[month]) {
          monthlyData[month] = { month, income: 0, expense: 0 };
        }
        if (transaction.type === '수입') {
          monthlyData[month].income += transaction.amount;
        } else {
          monthlyData[month].expense += transaction.amount;
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      setFrequencyStats(frequencyStats);
      setRefundStats(refundStats);

      // 월별 데이터를 배열로 변환하고 정렬
      const sortedMonthlyData = Object.values(monthlyData)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // 최근 6개월
      setMonthlyTrends(sortedMonthlyData);
    },
    []
  );

  const fetchData = useCallback(async () => {
    try {
      // 거래 내역 조회
      const transactionRows = await db.getAllAsync<Transaction>(
        'SELECT * FROM transactions WHERE deleted = 0 ORDER BY date DESC'
      );

      // 근로자 목록 조회
      const workerRows = await db.getAllAsync<Worker>(
        'SELECT id, name FROM workers WHERE deleted = 0'
      );

      // 고용주 목록 조회
      const employerRows = await db.getAllAsync<Employer>(
        'SELECT id, name FROM employers WHERE deleted = 0'
      );

      calculateStatistics(transactionRows, workerRows, employerRows);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  }, [db, calculateStatistics]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    return `${year}년 ${parseInt(month)}월`;
  };

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
        <Text style={styles.headerTitle}>통계</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 전체 요약 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>전체 요약</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 수입</Text>
              <Text style={[styles.summaryAmount, { color: '#34C759' }]}>
                +{totalIncome.toLocaleString()}원
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>총 지출</Text>
              <Text style={[styles.summaryAmount, { color: '#FF3B30' }]}>
                -{totalExpense.toLocaleString()}원
              </Text>
            </View>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>잔액</Text>
            <Text
              style={[
                styles.summaryAmount,
                {
                  color:
                    totalIncome - totalExpense >= 0 ? '#34C759' : '#FF3B30',
                },
              ]}
            >
              {(totalIncome - totalExpense).toLocaleString()}원
            </Text>
          </View>
        </View>

        {/* 거래 빈도 TOP 5 */}
        <View style={styles.categoryCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>거래 빈도 TOP 5</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  frequencyTab === 'worker' && styles.activeTab,
                ]}
                onPress={() => setFrequencyTab('worker')}
              >
                <Text
                  style={[
                    styles.tabText,
                    frequencyTab === 'worker' && styles.activeTabText,
                  ]}
                >
                  근로자
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  frequencyTab === 'employer' && styles.activeTab,
                ]}
                onPress={() => setFrequencyTab('employer')}
              >
                <Text
                  style={[
                    styles.tabText,
                    frequencyTab === 'employer' && styles.activeTabText,
                  ]}
                >
                  고용주
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {Object.keys(frequencyStats).length > 0 ? (
            Object.entries(frequencyStats)
              .filter(([key, _]) => {
                const [type] = key.split('_');
                if (frequencyTab === 'worker') return type === '근로자';
                if (frequencyTab === 'employer') return type === '고용주';
                return false;
              })
              .sort(([_, a], [__, b]) => b - a)
              .slice(0, 5)
              .map(([key, count], index) => {
                const [type, name] = key.split('_');
                return (
                  <View key={key} style={styles.categoryItem}>
                    <View style={styles.categoryInfo}>
                      <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>{index + 1}</Text>
                      </View>
                      <View
                        style={[
                          styles.categoryIcon,
                          {
                            backgroundColor:
                              type === '근로자' ? '#4ECDC420' : '#45B7D120',
                          },
                        ]}
                      >
                        <Ionicons
                          name={type === '근로자' ? 'person' : 'business'}
                          size={20}
                          color={type === '근로자' ? '#4ECDC4' : '#45B7D1'}
                        />
                      </View>
                      <Text style={styles.categoryName}>{name}</Text>
                      <Text style={styles.typeLabel}>({type})</Text>
                    </View>
                    <Text style={styles.categoryAmount}>{count}회</Text>
                  </View>
                );
              })
          ) : (
            <View style={styles.trendPlaceholder}>
              <Ionicons name="bar-chart-outline" size={48} color="#666" />
              <Text style={styles.placeholderText}>거래 내역이 없습니다</Text>
            </View>
          )}
        </View>

        {/* 환불 통계 */}
        <View style={styles.categoryCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>환불 통계</Text>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, refundTab === 'worker' && styles.activeTab]}
                onPress={() => {
                  setRefundTab('worker');
                  setShowAllRefunds(false);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    refundTab === 'worker' && styles.activeTabText,
                  ]}
                >
                  근로자
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  refundTab === 'employer' && styles.activeTab,
                ]}
                onPress={() => {
                  setRefundTab('employer');
                  setShowAllRefunds(false);
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    refundTab === 'employer' && styles.activeTabText,
                  ]}
                >
                  고용주
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {Object.keys(refundStats).length > 0 ? (
            <>
              {Object.entries(refundStats)
                .filter(([key, data]) => {
                  const [type] = key.split('_');
                  if (refundTab === 'worker')
                    return type === '근로자' && data.amount > 0;
                  if (refundTab === 'employer')
                    return type === '고용주' && data.amount > 0;
                  return false;
                })
                .sort(([_, a], [__, b]) => b.amount - a.amount)
                .slice(0, showAllRefunds ? undefined : 5)
                .map(([key, data]) => {
                  const [type, name] = key.split('_');
                  return (
                    <View key={key} style={styles.categoryItem}>
                      <View style={styles.categoryInfo}>
                        <View
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: '#FF6B6B20' },
                          ]}
                        >
                          <Ionicons
                            name={type === '근로자' ? 'person' : 'business'}
                            size={20}
                            color="#FF6B6B"
                          />
                        </View>
                        <Text style={styles.categoryName}>{name}</Text>
                        <Text style={styles.typeLabel}>({type})</Text>
                      </View>
                      <View style={styles.refundInfo}>
                        <Text
                          style={[styles.refundCount, { color: '#FF6B6B' }]}
                        >
                          {data.count}회
                        </Text>
                        <Text
                          style={[styles.categoryAmount, { color: '#FF6B6B' }]}
                        >
                          -{data.amount.toLocaleString()}원
                        </Text>
                      </View>
                    </View>
                  );
                })}
              {Object.entries(refundStats).filter(([key, data]) => {
                const [type] = key.split('_');
                if (refundTab === 'worker')
                  return type === '근로자' && data.amount > 0;
                if (refundTab === 'employer')
                  return type === '고용주' && data.amount > 0;
                return false;
              }).length > 5 && (
                <TouchableOpacity
                  style={styles.showMoreButton}
                  onPress={() => setShowAllRefunds(!showAllRefunds)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllRefunds ? '접기' : '더보기'}
                  </Text>
                  <Ionicons
                    name={showAllRefunds ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <View style={styles.trendPlaceholder}>
              <Ionicons name="refresh-outline" size={48} color="#666" />
              <Text style={styles.placeholderText}>환불 내역이 없습니다</Text>
            </View>
          )}
        </View>

        {/* 월별 트렌드 */}
        <View style={styles.trendCard}>
          <Text style={styles.cardTitle}>월별 트렌드</Text>
          {monthlyTrends.length > 0 ? (
            monthlyTrends.map((monthData) => (
              <View key={monthData.month} style={styles.monthlyItem}>
                <Text style={styles.monthLabel}>
                  {formatMonth(monthData.month)}
                </Text>
                <View style={styles.monthlyStats}>
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyLabel}>수입</Text>
                    <Text style={[styles.monthlyAmount, { color: '#34C759' }]}>
                      +{monthData.income.toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.monthlyStat}>
                    <Text style={styles.monthlyLabel}>지출</Text>
                    <Text style={[styles.monthlyAmount, { color: '#FF3B30' }]}>
                      -{monthData.expense.toLocaleString()}원
                    </Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.trendPlaceholder}>
              <Ionicons name="bar-chart-outline" size={48} color="#666" />
              <Text style={styles.placeholderText}>거래 내역이 없습니다</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryItem: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  categoryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    color: '#fff',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  trendCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  monthlyItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthlyStat: {
    flex: 1,
  },
  monthlyLabel: {
    fontSize: 14,
    color: '#999',
    marginBottom: 5,
  },
  monthlyAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: '#333',
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    minWidth: 50,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  activeTabText: {
    color: '#fff',
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  typeLabel: {
    fontSize: 12,
    color: '#999',
    marginLeft: 4,
  },
  refundInfo: {
    alignItems: 'flex-end',
  },
  refundCount: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  showMoreText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
});
