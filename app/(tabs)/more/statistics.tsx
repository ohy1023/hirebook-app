import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>(
    {}
  );
  const [workerStats, setWorkerStats] = useState<{ [key: string]: number }>({});
  const [employerStats, setEmployerStats] = useState<{ [key: string]: number }>(
    {}
  );
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyData[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // 거래 내역 조회
      const transactionRows = await db.getAllAsync<Transaction>(
        'SELECT * FROM transactions WHERE deleted = 0 ORDER BY date DESC'
      );
      setTransactions(transactionRows);

      // 근로자 목록 조회
      const workerRows = await db.getAllAsync<Worker>(
        'SELECT id, name FROM workers WHERE deleted = 0'
      );
      setWorkers(workerRows);

      // 고용주 목록 조회
      const employerRows = await db.getAllAsync<Employer>(
        'SELECT id, name FROM employers WHERE deleted = 0'
      );
      setEmployers(employerRows);

      calculateStatistics(transactionRows, workerRows, employerRows);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
    }
  };

  const calculateStatistics = (
    transactions: Transaction[],
    workerList: Worker[],
    employerList: Employer[]
  ) => {
    let income = 0;
    let expense = 0;
    const categories: { [key: string]: number } = {};
    const workerStats: { [key: string]: number } = {};
    const employerStats: { [key: string]: number } = {};
    const monthlyData: { [key: string]: MonthlyData } = {};

    transactions.forEach((transaction) => {
      if (transaction.type === '수입') {
        income += transaction.amount;
      } else {
        expense += transaction.amount;

        // 카테고리별 통계 (지출만)
        if (categories[transaction.category]) {
          categories[transaction.category] += transaction.amount;
        } else {
          categories[transaction.category] = transaction.amount;
        }
      }

      // 근로자별 통계 (지출만)
      if (transaction.type === '지출') {
        const worker = workerList.find((w) => w.id === transaction.worker_id);
        if (worker) {
          if (workerStats[worker.name]) {
            workerStats[worker.name] += transaction.amount;
          } else {
            workerStats[worker.name] = transaction.amount;
          }
        }
      }

      // 고용주별 통계 (지출만)
      if (transaction.type === '지출') {
        const employer = employerList.find(
          (e) => e.id === transaction.employer_id
        );
        if (employer) {
          if (employerStats[employer.name]) {
            employerStats[employer.name] += transaction.amount;
          } else {
            employerStats[employer.name] = transaction.amount;
          }
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
    setCategoryStats(categories);
    setWorkerStats(workerStats);
    setEmployerStats(employerStats);

    // 월별 데이터를 배열로 변환하고 정렬
    const sortedMonthlyData = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // 최근 6개월
    setMonthlyTrends(sortedMonthlyData);
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      소개비: 'handshake',
      책상비: 'desktop',
      환불: 'refresh',
      기타: 'ellipsis-horizontal',
    };
    return iconMap[category] || 'ellipsis-horizontal';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      소개비: '#FF6B6B',
      책상비: '#4ECDC4',
      환불: '#45B7D1',
      기타: '#F7DC6F',
    };
    return colorMap[category] || '#999';
  };

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

        {/* 카테고리별 통계 */}
        <View style={styles.categoryCard}>
          <Text style={styles.cardTitle}>카테고리별 지출</Text>
          {Object.entries(categoryStats)
            .filter(([_, amount]) => amount > 0)
            .sort(([_, a], [__, b]) => b - a)
            .map(([category, amount]) => (
              <View key={category} style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: getCategoryColor(category) + '20' },
                    ]}
                  >
                    <Ionicons
                      name={getCategoryIcon(category) as any}
                      size={20}
                      color={getCategoryColor(category)}
                    />
                  </View>
                  <Text style={styles.categoryName}>{category}</Text>
                </View>
                <Text style={styles.categoryAmount}>
                  {amount.toLocaleString()}원
                </Text>
              </View>
            ))}
        </View>

        {/* 근로자별 통계 */}
        {Object.keys(workerStats).length > 0 && (
          <View style={styles.categoryCard}>
            <Text style={styles.cardTitle}>근로자별 지출</Text>
            {Object.entries(workerStats)
              .filter(([_, amount]) => amount > 0)
              .sort(([_, a], [__, b]) => b - a)
              .map(([workerName, amount]) => (
                <View key={workerName} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: '#4ECDC420' },
                      ]}
                    >
                      <Ionicons name="person" size={20} color="#4ECDC4" />
                    </View>
                    <Text style={styles.categoryName}>{workerName}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>
                    {amount.toLocaleString()}원
                  </Text>
                </View>
              ))}
          </View>
        )}

        {/* 고용주별 통계 */}
        {Object.keys(employerStats).length > 0 && (
          <View style={styles.categoryCard}>
            <Text style={styles.cardTitle}>고용주별 지출</Text>
            {Object.entries(employerStats)
              .filter(([_, amount]) => amount > 0)
              .sort(([_, a], [__, b]) => b - a)
              .map(([employerName, amount]) => (
                <View key={employerName} style={styles.categoryItem}>
                  <View style={styles.categoryInfo}>
                    <View
                      style={[
                        styles.categoryIcon,
                        { backgroundColor: '#45B7D120' },
                      ]}
                    >
                      <Ionicons name="business" size={20} color="#45B7D1" />
                    </View>
                    <Text style={styles.categoryName}>{employerName}</Text>
                  </View>
                  <Text style={styles.categoryAmount}>
                    {amount.toLocaleString()}원
                  </Text>
                </View>
              ))}
          </View>
        )}

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
});
