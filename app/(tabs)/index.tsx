import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function RecordScreen() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // 샘플 데이터
  const transactions = [
    {
      date: '2025-09-02',
      day: '화요일',
      income: 0,
      expense: 85,
      items: [
        {
          icon: 'shirt',
          category: '패션/미용',
          payment: '현금',
          amount: 85,
          details: '',
        }
      ]
    },
    {
      date: '2025-09-01',
      day: '월요일',
      income: 0,
      expense: 200000,
      items: [
        {
          icon: 'restaurant',
          category: '식비',
          payment: '현금',
          amount: 200000,
          details: '김현식',
        }
      ]
    }
  ];

  const totalIncome = transactions.reduce((sum, t) => sum + t.income, 0);
  const totalExpense = transactions.reduce((sum, t) => sum + t.expense, 0);
  const total = totalIncome - totalExpense;

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('ko-KR') + '원';
  };

  const getMonthYear = (date: Date) => {
    return format(date, 'yyyy년 M월', { locale: ko });
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>가계부</Text>
        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="star-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="filter" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 날짜 네비게이션 */}
      <View style={styles.dateNavigation}>
        <TouchableOpacity onPress={() => changeMonth('prev')}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.currentMonth}>{getMonthYear(currentDate)}</Text>
        <TouchableOpacity onPress={() => changeMonth('next')}>
          <Ionicons name="chevron-forward" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity style={[styles.tab, styles.activeTab]}>
          <Text style={[styles.tabText, styles.activeTabText]}>일일</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>달력</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>월별</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>요약</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab}>
          <Text style={styles.tabText}>메모</Text>
        </TouchableOpacity>
      </View>

      {/* 월별 요약 */}
      <View style={styles.monthlySummary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>수입</Text>
          <Text style={styles.summaryIncome}>{formatCurrency(totalIncome)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>지출</Text>
          <Text style={styles.summaryExpense}>{formatCurrency(totalExpense)}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>합계</Text>
          <Text style={[styles.summaryTotal, total < 0 && styles.negativeTotal]}>
            {total < 0 ? '-' : ''}{formatCurrency(Math.abs(total))}
          </Text>
        </View>
      </View>

      {/* 거래 내역 */}
      <ScrollView style={styles.transactionsContainer} showsVerticalScrollIndicator={false}>
        {transactions.map((transaction, index) => (
          <View key={index} style={styles.transactionDay}>
            <View style={styles.dayHeader}>
              <Text style={styles.dayText}>
                {format(new Date(transaction.date), 'dd', { locale: ko })}
              </Text>
              <Text style={styles.dayName}>{transaction.day}</Text>
            </View>
            
            <View style={styles.daySummary}>
              <Text style={styles.daySummaryText}>
                수입: {formatCurrency(transaction.income)}
              </Text>
              <Text style={styles.daySummaryText}>
                지출: {formatCurrency(transaction.expense)}
              </Text>
            </View>

            {transaction.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.transactionItem}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={item.icon === 'shirt' ? '#FFD700' : '#FF6B6B'} 
                    />
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    {item.details ? (
                      <Text style={styles.itemDetails}>{item.details}</Text>
                    ) : null}
                    <Text style={styles.itemPayment}>{item.payment}</Text>
                  </View>
                </View>
                <Text style={styles.itemAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* 플로팅 액션 버튼 */}
      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary}>
          <Ionicons name="documents" size={24} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fabPrimary}>
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
  headerIcons: {
    flexDirection: 'row',
    gap: 15,
  },
  iconButton: {
    padding: 5,
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
  tabNavigation: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF3B30',
  },
  tabText: {
    color: '#999',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
    fontWeight: '600',
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
    color: '#007AFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryExpense: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryTotal: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  negativeTotal: {
    color: '#FF3B30',
  },
  transactionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  itemDetails: {
    color: '#999',
    fontSize: 14,
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
  fabContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    gap: 15,
  },
  fabSecondary: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
