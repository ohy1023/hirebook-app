import { formatPhoneNumber } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
interface Transaction {
  id: number;
  record_id: number;
  worker_id: number | null;
  employer_id: number | null;
  amount: number;
  date: string;
  category: string;
  type: string;
  payment_type: string;
  note?: string;
  created_date: string;
  updated_date: string;
  deleted: number;
  description?: string;
}

interface Worker {
  id: number;
  name: string;
  tel: string;
  type?: string;
  nationality?: string;
  note?: string;
}

interface Employer {
  id: number;
  name: string;
  tel: string;
  type?: string;
  note?: string;
}

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const db = useSQLiteContext();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTransactionDetail = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        // 거래 정보 조회
        const transactionResult = await db.getFirstAsync(
          `SELECT * FROM transactions WHERE id = ? AND deleted = 0`,
          [id as string]
        );

        if (transactionResult) {
          setTransaction(transactionResult as Transaction);

          // 근로자 정보 조회
          if ((transactionResult as any).worker_id) {
            const workerResult = await db.getFirstAsync(
              `SELECT id, name, tel, type, nationality, note FROM workers WHERE id = ? AND deleted = 0`,
              [(transactionResult as any).worker_id]
            );
            setWorker(workerResult as Worker);
          }

          // 고용주 정보 조회
          if ((transactionResult as any).employer_id) {
            const employerResult = await db.getFirstAsync(
              `SELECT id, name, tel, type, note FROM employers WHERE id = ? AND deleted = 0`,
              [(transactionResult as any).employer_id]
            );
            setEmployer(employerResult as Employer);
          }
        }
      } catch (error) {
        console.error('거래 상세 정보 로드 실패:', error);
        Alert.alert('오류', '거래 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id, db]
  );

  useEffect(() => {
    if (id) {
      loadTransactionDetail();
    }
  }, [id, loadTransactionDetail]);

  // 화면이 포커스될 때마다 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      if (id) {
        loadTransactionDetail();
      }
    }, [id, loadTransactionDetail])
  );

  const onRefresh = useCallback(() => {
    loadTransactionDetail(true);
  }, [loadTransactionDetail]);

  const handleEdit = () => {
    if (transaction) {
      router.push(`/transactions/edit?id=${transaction.id}`);
    }
  };

  const handleDelete = () => {
    Alert.alert('거래 삭제', '이 거래를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync(
              'UPDATE transactions SET deleted = 1, updated_date = datetime("now") WHERE id = ?',
              [id as string]
            );
            Alert.alert('성공', '거래가 삭제되었습니다.');
            router.back();
          } catch (error) {
            console.error('거래 삭제 실패:', error);
            Alert.alert('오류', '거래 삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={64} color="#666" />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#FF6B6B" />
          <Text style={styles.errorText}>거래 정보를 찾을 수 없습니다</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>거래 상세</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF3B30"
            colors={['#FF3B30']}
          />
        }
      >
        {/* 거래 요약 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>거래 금액</Text>
            <Text
              style={[
                styles.amountValue,
                transaction.type === '수입' && styles.incomeAmount,
                transaction.type === '지출' && styles.expenseAmount,
              ]}
            >
              {transaction.type === '수입' ? '+' : '-'}
              {formatCurrency(Math.abs(transaction.amount))}
            </Text>
            <Text style={styles.transactionType}>{transaction.type}</Text>
          </View>

          <View style={styles.categorySection}>
            <Text style={styles.categoryLabel}>카테고리</Text>
            <Text style={styles.categoryValue}>{transaction.category}</Text>
          </View>
        </View>

        {/* 거래 정보 */}
        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>거래 정보</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>거래 날짜</Text>
            <Text style={styles.infoValue}>
              {format(new Date(transaction.date), 'yyyy년 MM월 dd일 EEEE', {
                locale: ko,
              })}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>결제 방식</Text>
            <Text style={styles.infoValue}>{transaction.payment_type}</Text>
          </View>

          {transaction.note && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>메모</Text>
              <Text style={styles.infoValue}>{transaction.note}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>생성일</Text>
            <Text style={styles.infoValue}>
              {format(
                new Date(transaction.created_date),
                'yyyy년 MM월 dd일 HH:mm',
                {
                  locale: ko,
                }
              )}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>수정일</Text>
            <Text style={styles.infoValue}>
              {format(
                new Date(transaction.updated_date),
                'yyyy년 MM월 dd일 HH:mm',
                {
                  locale: ko,
                }
              )}
            </Text>
          </View>

          {transaction.note && (
            <View style={styles.noteSection}>
              <Text style={styles.infoLabel}>추가 정보</Text>
              <Text style={styles.noteText}>{transaction.note}</Text>
            </View>
          )}
        </View>

        {/* 관련자 정보 */}
        {worker && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>근로자 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름</Text>
              <Text style={styles.infoValue}>{worker.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>연락처</Text>
              <Text style={styles.infoValue}>
                {formatPhoneNumber(worker.tel)}
              </Text>
            </View>

            {worker.type && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>직종</Text>
                <Text style={styles.infoValue}>{worker.type}</Text>
              </View>
            )}

            {worker.nationality && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>국적</Text>
                <Text style={styles.infoValue}>{worker.nationality}</Text>
              </View>
            )}

            {worker.note && (
              <View style={styles.noteSection}>
                <Text style={styles.infoLabel}>추가 정보</Text>
                <Text style={styles.noteText}>{worker.note}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.viewDetailButton}
              onPress={() => router.push(`/workers/${worker.id}`)}
            >
              <Text style={styles.viewDetailButtonText}>근로자 상세 보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}

        {employer && (
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>고용주 정보</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>이름</Text>
              <Text style={styles.infoValue}>{employer.name}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>연락처</Text>
              <Text style={styles.infoValue}>
                {formatPhoneNumber(employer.tel)}
              </Text>
            </View>

            {employer.type && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>업종</Text>
                <Text style={styles.infoValue}>{employer.type}</Text>
              </View>
            )}

            {employer.note && (
              <View style={styles.noteSection}>
                <Text style={styles.infoLabel}>메모</Text>
                <Text style={styles.noteText}>{employer.note}</Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.viewDetailButton}
              onPress={() => router.push(`/employers/${employer.id}`)}
            >
              <Text style={styles.viewDetailButtonText}>고용주 상세 보기</Text>
              <Ionicons name="chevron-forward" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerActions: {
    flexDirection: 'row',
    gap: 15,
  },
  actionButton: {
    padding: 5,
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
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  incomeAmount: {
    color: '#4CAF50',
  },
  expenseAmount: {
    color: '#FF6B6B',
  },
  transactionType: {
    fontSize: 18,
    color: '#8E8E93',
  },
  categorySection: {
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  categoryValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoValue: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'right',
    flex: 1,
  },
  infoValueLeft: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'left',
    flex: 1,
    marginLeft: 10,
  },
  noteSection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  noteText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  viewDetailButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginTop: 16,
  },
  viewDetailButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginTop: 16,
  },
});
