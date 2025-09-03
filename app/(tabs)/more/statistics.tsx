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
  type: 'income' | 'expense';
  amount: number;
  category: string;
  date: string;
  note?: string;
};

export default function StatisticsScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [categoryStats, setCategoryStats] = useState<{ [key: string]: number }>(
    {}
  );

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const rows = await db.getAllAsync<Transaction>(
        'SELECT * FROM transactions WHERE deleted = 0 ORDER BY date DESC'
      );
      setTransactions(rows);

      // 수입/지출 합계 계산
      let income = 0;
      let expense = 0;
      const categories: { [key: string]: number } = {};

      rows.forEach((transaction) => {
        if (transaction.type === 'income') {
          income += transaction.amount;
        } else {
          expense += transaction.amount;
        }

        // 카테고리별 통계
        if (categories[transaction.category]) {
          categories[transaction.category] += transaction.amount;
        } else {
          categories[transaction.category] = transaction.amount;
        }
      });

      setTotalIncome(income);
      setTotalExpense(expense);
      setCategoryStats(categories);
    } catch (error) {
      console.error('거래 내역 조회 실패:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: { [key: string]: string } = {
      식비: 'restaurant',
      교통비: 'car',
      쇼핑: 'bag',
      의료: 'medical',
      교육: 'school',
      엔터테인먼트: 'game-controller',
      주거: 'home',
      기타: 'ellipsis-horizontal',
    };
    return iconMap[category] || 'ellipsis-horizontal';
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: string } = {
      식비: '#FF6B6B',
      교통비: '#4ECDC4',
      쇼핑: '#45B7D1',
      의료: '#96CEB4',
      교육: '#FFEAA7',
      엔터테인먼트: '#DDA0DD',
      주거: '#98D8C8',
      기타: '#F7DC6F',
    };
    return colorMap[category] || '#999';
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

        {/* 월별 트렌드 */}
        <View style={styles.trendCard}>
          <Text style={styles.cardTitle}>월별 트렌드</Text>
          <View style={styles.trendPlaceholder}>
            <Ionicons name="bar-chart-outline" size={48} color="#666" />
            <Text style={styles.placeholderText}>차트 기능 준비 중</Text>
          </View>
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
