import {
  employerQueries,
  transactionQueries,
  workerQueries,
} from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Employer, Transaction, Worker } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Stop,
} from 'react-native-svg';

interface TransactionWithDetails extends Transaction {
  worker?: Worker;
  employer?: Employer;
}

export default function EmployerTransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [transaction, setTransaction] = useState<TransactionWithDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTransaction() {
      try {
        const transactionData = await transactionQueries.getById(
          db,
          Number(id)
        );
        if (!transactionData) {
          Alert.alert('오류', '거래 기록을 찾을 수 없습니다.');
          router.back();
          return;
        }

        let worker: Worker | undefined;
        let employer: Employer | undefined;

        if (transactionData.worker_id) {
          const workerData = await workerQueries.getById(
            db,
            transactionData.worker_id
          );
          worker = workerData || undefined;
        }
        if (transactionData.employer_id) {
          const employerData = await employerQueries.getById(
            db,
            transactionData.employer_id
          );
          employer = employerData || undefined;
        }

        setTransaction({
          ...transactionData,
          worker: worker || undefined,
          employer: employer || undefined,
        });
      } catch (error) {
        Alert.alert('오류', '거래 기록을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    fetchTransaction();
  }, [id, db, router]);

  const formatAmount = (amount: number, type: string) => {
    const formattedAmount = amount.toLocaleString();
    return type === '수입' ? `+${formattedAmount}원` : `-${formattedAmount}원`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    });
  };

  const getTransactionIcon = (type: string) => {
    return type === '수입' ? 'trending-up' : 'trending-down';
  };

  const getTransactionColor = (type: string) => {
    return type === '수입' ? colors.success : colors.danger;
  };

  const getTransactionTypeText = (type: string) => {
    return type === '수입' ? '수입' : '지출';
  };

  // 돈 흐름 다이어그램 컴포넌트
  const MoneyFlowDiagram = ({
    isIncome,
    color,
    amount,
  }: {
    isIncome: boolean;
    color: string;
    amount: number;
  }) => {
    const width = 320;
    const height = 100;

    if (isIncome) {
      // 수입: 오른쪽에서 왼쪽으로 돈이 들어오는 흐름
      const path = `M ${width - 40} 20 Q ${width / 2} 50 ${width / 2} 80 Q ${
        width / 2
      } 50 40 20`;
      return (
        <View style={styles.moneyFlowContainer}>
          <Svg width={width} height={height} style={styles.svgContainer}>
            {/* 배경 그라데이션 효과 */}
            <Defs>
              <LinearGradient
                id="incomeGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <Stop offset="50%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>

            {/* 메인 흐름 경로 */}
            <Path
              d={path}
              stroke={color}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10,5"
            />

            {/* 돈 아이콘들 */}
            <Circle cx="40" cy="20" r="8" fill={color} />
            <Circle cx="80" cy="35" r="5" fill={color} opacity="0.8" />
            <Circle cx="120" cy="50" r="4" fill={color} opacity="0.6" />
            <Circle cx="160" cy="65" r="5" fill={color} opacity="0.8" />
            <Circle cx="200" cy="50" r="4" fill={color} opacity="0.6" />
            <Circle cx="240" cy="35" r="5" fill={color} opacity="0.8" />
            <Circle cx={width - 40} cy="20" r="8" fill={color} />

            {/* 화살표 */}
            <Path
              d="M 35 15 L 40 20 L 35 25"
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          {/* 금액 표시 */}
          <View style={[styles.amountBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.amountBadgeText, { color }]}>
              +{amount.toLocaleString()}원
            </Text>
          </View>
        </View>
      );
    } else {
      // 지출: 왼쪽에서 오른쪽으로 돈이 나가는 흐름
      const path = `M 40 20 Q ${width / 2} 50 ${width / 2} 80 Q ${
        width / 2
      } 50 ${width - 40} 20`;
      return (
        <View style={styles.moneyFlowContainer}>
          <Svg width={width} height={height} style={styles.svgContainer}>
            {/* 배경 그라데이션 효과 */}
            <Defs>
              <LinearGradient
                id="expenseGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <Stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <Stop offset="50%" stopColor={color} stopOpacity="0.4" />
                <Stop offset="100%" stopColor={color} stopOpacity="0.2" />
              </LinearGradient>
            </Defs>

            {/* 메인 흐름 경로 */}
            <Path
              d={path}
              stroke={color}
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="10,5"
            />

            {/* 돈 아이콘들 */}
            <Circle cx="40" cy="20" r="8" fill={color} />
            <Circle cx="80" cy="35" r="5" fill={color} opacity="0.8" />
            <Circle cx="120" cy="50" r="4" fill={color} opacity="0.6" />
            <Circle cx="160" cy="65" r="5" fill={color} opacity="0.8" />
            <Circle cx="200" cy="50" r="4" fill={color} opacity="0.6" />
            <Circle cx="240" cy="35" r="5" fill={color} opacity="0.8" />
            <Circle cx={width - 40} cy="20" r="8" fill={color} />

            {/* 화살표 */}
            <Path
              d={`M ${width - 35} 15 L ${width - 40} 20 L ${width - 35} 25`}
              stroke={color}
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          {/* 금액 표시 */}
          <View style={[styles.amountBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.amountBadgeText, { color }]}>
              -{amount.toLocaleString()}원
            </Text>
          </View>
        </View>
      );
    }
  };

  const handleEdit = () => {
    router.push(`/transactions/edit/${id}` as any);
  };

  const handleDelete = async () => {
    Alert.alert('삭제 확인', '정말로 이 거래 기록을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionQueries.delete(db, Number(id));
            Alert.alert('삭제 완료', '거래 기록이 삭제되었습니다.');
            router.back();
          } catch (error) {
            Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!transaction) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>거래 기록을 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래 상세</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* 돈 흐름 다이어그램 */}
        <View style={styles.flowDiagramSection}>
          <MoneyFlowDiagram
            isIncome={transaction.type === '수입'}
            color={getTransactionColor(transaction.type)}
            amount={transaction.amount}
          />
        </View>

        {/* 거래 정보 카드 */}
        <View style={styles.transactionCard}>
          <View style={styles.amountSection}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={getTransactionIcon(transaction.type)}
                size={32}
                color={getTransactionColor(transaction.type)}
              />
            </View>
            <View style={styles.amountInfo}>
              <Text
                style={[
                  styles.amount,
                  { color: getTransactionColor(transaction.type) },
                ]}
              >
                {formatAmount(transaction.amount, transaction.type)}
              </Text>
              <Text style={styles.transactionType}>
                {getTransactionTypeText(transaction.type)}
              </Text>
            </View>
          </View>

          <View style={styles.dateSection}>
            <Text style={styles.dateLabel}>거래일</Text>
            <Text style={styles.date}>{formatDate(transaction.date)}</Text>
          </View>
        </View>

        {/* 관련자 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>관련자 정보</Text>

          {transaction.worker && (
            <TouchableOpacity
              style={styles.personCard}
              onPress={() =>
                router.push(`/workers/${transaction.worker?.id}` as any)
              }
            >
              <View style={styles.personIcon}>
                <Ionicons name="person" size={20} color={colors.success} />
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>근로자</Text>
                <Text style={styles.personName}>{transaction.worker.name}</Text>
                {transaction.worker.tel && (
                  <Text style={styles.personDetail}>
                    {transaction.worker.tel}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          {transaction.employer && (
            <TouchableOpacity
              style={styles.personCard}
              onPress={() =>
                router.push(`/employers/${transaction.employer?.id}` as any)
              }
            >
              <View style={styles.personIcon}>
                <Ionicons name="business" size={20} color={colors.primary} />
              </View>
              <View style={styles.personInfo}>
                <Text style={styles.personLabel}>고용주</Text>
                <Text style={styles.personName}>
                  {transaction.employer.name}
                </Text>
                {transaction.employer.tel && (
                  <Text style={styles.personDetail}>
                    {transaction.employer.tel}
                  </Text>
                )}
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* 메모 */}
        {transaction.note && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>{transaction.note}</Text>
            </View>
          </View>
        )}

        {/* 거래 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>거래 정보</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>거래 ID</Text>
              <Text style={styles.infoValue}>#{transaction.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>거래 유형</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: getTransactionColor(transaction.type) },
                ]}
              >
                {getTransactionTypeText(transaction.type)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>금액</Text>
              <Text
                style={[
                  styles.infoValue,
                  { color: getTransactionColor(transaction.type) },
                ]}
              >
                {transaction.amount.toLocaleString()}원
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼들 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
          <Ionicons name="create" size={20} color={colors.text} />
          <Text style={styles.editButtonText}>수정</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color={colors.text} />
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.danger,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  transactionCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 20,
  },
  amountInfo: {
    flex: 1,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  dateSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 20,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  date: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  personCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  personInfo: {
    flex: 1,
  },
  personLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  personName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  personDetail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  noteCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  infoCard: {
    backgroundColor: colors.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  // 돈 흐름 다이어그램 스타일
  flowDiagramSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  moneyFlowContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  svgContainer: {
    alignSelf: 'center',
  },
  amountBadge: {
    position: 'absolute',
    top: 10,
    right: 15,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amountBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});
