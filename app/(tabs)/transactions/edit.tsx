import { formatPhoneNumber } from '@/utils/common';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function EditTransactionScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState({
    amount: '',
    category: '',
    type: '수입', // 기본값: 수입
    date: new Date().toISOString().split('T')[0], // 오늘 날짜
    employerId: null as number | null,
    workerId: null as number | null,
    paymentType: '현금', // 기본값: 현금
    note: '', // 메모 항목 추가
  });

  // 선택된 고용주/근로자 정보를 저장하는 상태
  const [selectedPerson, setSelectedPerson] = useState<{
    id: number;
    name: string;
    type: string;
    tel?: string;
    nationality?: string;
  } | null>(null);

  const [isDateModalVisible, setDateModalVisible] = useState(false);
  const [isCalculatorVisible, setCalculatorVisible] = useState(false);
  const [isSearchModalVisible, setSearchModalVisible] = useState(false);
  const [isDetailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState<any>(null);
  const [detailModalSearchType, setDetailModalSearchType] = useState<
    'employer' | 'worker'
  >('employer');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [calculatorValue, setCalculatorValue] = useState('');
  const [calculatorExpression, setCalculatorExpression] = useState('');
  const [searchType, setSearchType] = useState<'employer' | 'worker'>(
    'employer'
  );
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // 업종별 태그 색상 반환 함수
  const getTypeTagStyle = (type: string) => {
    const typeLower = type.toLowerCase();

    if (typeLower.includes('식당') || typeLower.includes('카페')) {
      return {
        backgroundColor: '#FF6B6B' + '20',
        borderColor: '#FF6B6B',
        color: '#FF6B6B',
      };
    } else if (
      typeLower.includes('가정집') ||
      typeLower.includes('집') ||
      typeLower.includes('청소')
    ) {
      return {
        backgroundColor: '#4ECDC4' + '20',
        borderColor: '#4ECDC4',
        color: '#4ECDC4',
      };
    } else if (
      typeLower.includes('사무실') ||
      typeLower.includes('회사') ||
      typeLower.includes('오피스')
    ) {
      return {
        backgroundColor: '#45B7D1' + '20',
        borderColor: '#45B7D1',
        color: '#45B7D1',
      };
    } else if (
      typeLower.includes('공장') ||
      typeLower.includes('공사') ||
      typeLower.includes('현장')
    ) {
      return {
        backgroundColor: '#FFA726' + '20',
        borderColor: '#FFA726',
        color: '#FFA726',
      };
    } else {
      // 기본 색상
      return {
        backgroundColor: '#007AFF' + '20',
        borderColor: '#007AFF',
        color: '#007AFF',
      };
    }
  };

  // 검색 필터 상태
  const [employerFilters, setEmployerFilters] = useState({
    name: '',
    tel: '',
    type: '',
  });
  const [workerFilters, setWorkerFilters] = useState({
    name: '',
    tel: '',
    type: '',
    nationality: '',
  });

  // 기존 거래 데이터 로드
  useEffect(() => {
    const loadTransaction = async () => {
      if (!id) {
        setIsLoading(false);
        return;
      }

      try {
        const transactionData = await db.getFirstAsync(
          `
          SELECT t.*, e.name as employer_name, e.tel as employer_tel, e.type as employer_type,
                 w.name as worker_name, w.tel as worker_tel, w.type as worker_type, w.nationality as worker_nationality
          FROM transactions t
          LEFT JOIN employers e ON t.employer_id = e.id
          LEFT JOIN workers w ON t.worker_id = w.id
          WHERE t.id = ? AND t.deleted = 0
        `,
          [id]
        );

        if (transactionData) {
          const data = transactionData as any;
          setTransaction({
            amount: data.amount?.toString() || '',
            category: data.category || '',
            type: data.type || '수입',
            date: data.date || new Date().toISOString().split('T')[0],
            employerId: data.employer_id || null,
            workerId: data.worker_id || null,
            paymentType: data.payment_type || '현금',
            note: data.note || '',
          });

          // 선택된 고용주/근로자 정보 설정
          if (data.employer_id) {
            setSelectedPerson({
              id: data.employer_id,
              name: data.employer_name || '',
              type: data.employer_type || '',
              tel: data.employer_tel || '',
            });
            setSearchType('employer');
          } else if (data.worker_id) {
            setSelectedPerson({
              id: data.worker_id,
              name: data.worker_name || '',
              type: data.worker_type || '',
              tel: data.worker_tel || '',
              nationality: data.worker_nationality || '',
            });
            setSearchType('worker');
          }
        }
      } catch (error) {
        Alert.alert('오류', '거래 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [id, db]);

  const handleChange = (key: string, value: string) => {
    setTransaction((prev) => ({ ...prev, [key]: value }));
  };

  const handlePaymentTypeChange = (paymentType: string) => {
    setTransaction((prev) => ({ ...prev, paymentType }));
  };

  // 필터 변경 시 실시간 검색 실행
  const handleFilterChange = (
    type: 'employer' | 'worker',
    field: string,
    value: string
  ) => {
    if (type === 'employer') {
      const newFilters = { ...employerFilters, [field]: value };
      setEmployerFilters(newFilters);

      // 새로운 필터 값으로 즉시 검색 실행
      if (searchType === 'employer') {
        searchEmployersWithFilters(newFilters);
      }
    } else {
      const newFilters = { ...workerFilters, [field]: value };
      setWorkerFilters(newFilters);

      // 새로운 필터 값으로 즉시 검색 실행
      if (searchType === 'worker') {
        searchWorkersWithFilters(newFilters);
      }
    }
  };

  // 고용주 검색 함수 (필터 파라미터 직접 받음)
  const searchEmployersWithFilters = async (
    filters: typeof employerFilters
  ) => {
    try {
      let query = `
        SELECT id, name, tel, type
        FROM employers 
        WHERE deleted = 0
      `;
      const params: string[] = [];

      if (filters.name) {
        query += ` AND name LIKE ?`;
        params.push(`%${filters.name}%`);
      }
      if (filters.tel) {
        // 전화번호에서 하이픈 제거 후 검색
        const cleanTel = filters.tel.replace(/-/g, '');
        query += ` AND REPLACE(tel, '-', '') LIKE ?`;
        params.push(`%${cleanTel}%`);
      }
      if (filters.type) {
        query += ` AND type LIKE ?`;
        params.push(`%${filters.type}%`);
      }

      query += ` ORDER BY name ASC LIMIT 50`;

      const result = await db.getAllAsync(query, params);
      setSearchResults(result as any[]);
    } catch (error) {
      setSearchResults([]);
    }
  };

  // 근로자 검색 함수 (필터 파라미터 직접 받음)
  const searchWorkersWithFilters = async (filters: typeof workerFilters) => {
    try {
      let query = `
        SELECT id, name, tel, type, nationality
        FROM workers 
        WHERE deleted = 0
      `;
      const params: string[] = [];

      if (filters.name) {
        query += ` AND name LIKE ?`;
        params.push(`%${filters.name}%`);
      }
      if (filters.tel) {
        // 전화번호에서 하이픈 제거 후 검색
        const cleanTel = filters.tel.replace(/-/g, '');
        query += ` AND REPLACE(tel, '-', '') LIKE ?`;
        params.push(`%${cleanTel}%`);
      }
      if (filters.type) {
        query += ` AND type LIKE ?`;
        params.push(`%${filters.type}%`);
      }
      if (filters.nationality) {
        query += ` AND nationality LIKE ?`;
        params.push(`%${filters.nationality}%`);
      }

      query += ` ORDER BY name ASC LIMIT 50`;

      const result = await db.getAllAsync(query, params);
      setSearchResults(result as any[]);
    } catch (error) {
      setSearchResults([]);
    }
  };

  const handleSave = async () => {
    if (!transaction.amount || !transaction.category) {
      Alert.alert('오류', '금액과 카테고리를 입력해주세요.');
      return;
    }

    const amount = parseFloat(transaction.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('오류', '올바른 금액을 입력해주세요.');
      return;
    }

    try {
      if (id) {
        // 기존 거래 업데이트
        await db.runAsync(
          `
          UPDATE transactions SET
            worker_id = ?,
            employer_id = ?,
            amount = ?,
            date = ?,
            category = ?,
            type = ?,
            payment_type = ?,
            note = ?,
            updated_date = datetime('now')
          WHERE id = ?
        `,
          [
            transaction.workerId,
            transaction.employerId,
            amount,
            transaction.date,
            transaction.category,
            transaction.type,
            transaction.paymentType,
            transaction.note,
            id,
          ]
        );

        Alert.alert('성공', '거래가 수정되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              router.back();
            },
          },
        ]);
      } else {
        // 새 거래 추가
        // 1. 먼저 해당 날짜의 record가 있는지 확인
        let recordId: number;
        const existingRecord = await db.getFirstAsync(
          `
          SELECT id FROM records 
          WHERE date = ? AND deleted = 0
        `,
          [transaction.date]
        );

        if (existingRecord && (existingRecord as any).id) {
          // 기존 record가 있으면 해당 record의 ID 사용
          recordId = (existingRecord as any).id;
        } else {
          // 기존 record가 없으면 새로 생성
          const recordResult = await db.runAsync(
            `
            INSERT INTO records (date, created_date, updated_date)
            VALUES (?, datetime('now'), datetime('now'))
          `,
            [transaction.date]
          );

          recordId = recordResult.lastInsertRowId as number;
        }

        // 2. transaction 저장 (record_id 포함)
        const transactionResult = await db.runAsync(
          `
           INSERT INTO transactions (
             record_id,
             worker_id, 
             employer_id, 
             amount, 
             date, 
             category, 
             type, 
             payment_type, 
             note,
             created_date, 
             updated_date
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
         `,
          [
            recordId,
            transaction.workerId,
            transaction.employerId,
            amount,
            transaction.date,
            transaction.category,
            transaction.type,
            transaction.paymentType,
            transaction.note,
          ]
        );

        Alert.alert('성공', '거래가 추가되었습니다.', [
          {
            text: '확인',
            onPress: () => {
              router.back();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('오류', '거래 저장 중 오류가 발생했습니다.');
    }
  };

  const selectType = (type: string) => {
    setTransaction((prev) => ({
      ...prev,
      type,
      // 거래 유형이 변경되면 카테고리 초기화
      category: '',
    }));
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래 편집</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>거래 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>거래 편집</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 날짜 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>날짜</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setDateModalVisible(true)}
            >
              <Text style={styles.dateText}>{transaction.date}</Text>
              <Ionicons name="calendar" size={20} color="#666" />
            </TouchableOpacity>
          </View>

          {/* 거래 유형 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>거래 유형</Text>
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  transaction.type === '수입' && styles.typeOptionActive,
                ]}
                onPress={() => selectType('수입')}
              >
                <Ionicons
                  name="add-circle"
                  size={24}
                  color={transaction.type === '수입' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.typeText,
                    transaction.type === '수입' && styles.typeTextActive,
                  ]}
                >
                  수입
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeOption,
                  transaction.type === '지출' && styles.typeOptionActive,
                ]}
                onPress={() => selectType('지출')}
              >
                <Ionicons
                  name="remove-circle"
                  size={24}
                  color={transaction.type === '지출' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.typeText,
                    transaction.type === '지출' && styles.typeTextActive,
                  ]}
                >
                  지출
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 카테고리 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>카테고리</Text>
            <View style={styles.categorySelector}>
              {/* 수입일 때만 소개비 표시 */}
              {transaction.type === '수입' && (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    transaction.category === '소개비' &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => handleChange('category', '소개비')}
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={transaction.category === '소개비' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      transaction.category === '소개비' &&
                        styles.categoryTextActive,
                    ]}
                  >
                    소개비
                  </Text>
                </TouchableOpacity>
              )}

              {/* 지출일 때만 환불 표시 */}
              {transaction.type === '지출' && (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    transaction.category === '환불' &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => handleChange('category', '환불')}
                >
                  <Ionicons
                    name="refresh-circle"
                    size={24}
                    color={transaction.category === '환불' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      transaction.category === '환불' &&
                        styles.categoryTextActive,
                    ]}
                  >
                    환불
                  </Text>
                </TouchableOpacity>
              )}

              {/* 지출일 때만 책상비 표시 */}
              {transaction.type === '지출' && (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    transaction.category === '책상비' &&
                      styles.categoryOptionActive,
                  ]}
                  onPress={() => handleChange('category', '책상비')}
                >
                  <Ionicons
                    name="business"
                    size={24}
                    color={transaction.category === '책상비' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.categoryText,
                      transaction.category === '책상비' &&
                        styles.categoryTextActive,
                    ]}
                  >
                    책상비
                  </Text>
                </TouchableOpacity>
              )}

              {/* 항상 기타 표시 */}
              <TouchableOpacity
                style={[
                  styles.categoryOption,
                  transaction.category === '기타' &&
                    styles.categoryOptionActive,
                ]}
                onPress={() => handleChange('category', '기타')}
              >
                <Ionicons
                  name="ellipsis-horizontal"
                  size={24}
                  color={transaction.category === '기타' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.categoryText,
                    transaction.category === '기타' &&
                      styles.categoryTextActive,
                  ]}
                >
                  기타
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 금액 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>금액</Text>
            <TouchableOpacity
              style={styles.amountContainer}
              onPress={() => setCalculatorVisible(true)}
            >
              <Text style={styles.currencySymbol}>₩</Text>
              <Text style={styles.amountDisplay}>
                {(transaction.amount || '0').replace(
                  /\B(?=(\d{3})+(?!\d))/g,
                  ','
                )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 결제 수단 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>결제 수단</Text>
            <View style={styles.paymentSelector}>
              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  transaction.paymentType === '현금' &&
                    styles.paymentOptionActive,
                ]}
                onPress={() => handlePaymentTypeChange('현금')}
              >
                <Ionicons
                  name="cash"
                  size={24}
                  color={transaction.paymentType === '현금' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.paymentText,
                    transaction.paymentType === '현금' &&
                      styles.paymentTextActive,
                  ]}
                >
                  현금
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.paymentOption,
                  transaction.paymentType === '이체' &&
                    styles.paymentOptionActive,
                ]}
                onPress={() => handlePaymentTypeChange('이체')}
              >
                <Ionicons
                  name="phone-portrait"
                  size={24}
                  color={transaction.paymentType === '이체' ? '#fff' : '#666'}
                />
                <Text
                  style={[
                    styles.typeText,
                    transaction.paymentType === '이체' && styles.typeTextActive,
                  ]}
                >
                  이체
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 메모 입력 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>메모 (선택사항)</Text>
            <TextInput
              style={styles.memoInput}
              placeholder="메모를 입력하세요"
              placeholderTextColor="#666"
              value={transaction.note}
              onChangeText={(text) => handleChange('note', text)}
              multiline={true}
              textAlignVertical="top"
            />
          </View>

          {/* 고용주/근로자 선택 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>고용주/근로자 (선택사항)</Text>
            <View style={styles.personSelector}>
              <TouchableOpacity
                style={styles.personTypeButton}
                onPress={() => {
                  // 이미 선택된 상태라면 선택 해제 확인 알림
                  if (selectedPerson && transaction.employerId) {
                    Alert.alert(
                      '선택 해제',
                      '선택된 고용주를 해제하시겠습니까?',
                      [
                        {
                          text: '취소',
                          style: 'cancel',
                        },
                        {
                          text: '해제',
                          style: 'destructive',
                          onPress: () => {
                            setTransaction((prev) => ({
                              ...prev,
                              employerId: null,
                              workerId: null,
                            }));
                            setSelectedPerson(null);
                          },
                        },
                      ]
                    );
                    return;
                  }

                  // 근로자가 선택된 상태라면 먼저 해제
                  if (selectedPerson && transaction.workerId) {
                    Alert.alert(
                      '선택 해제',
                      '고용주를 선택하기 위해 근로자 선택을 해제하시겠습니까?',
                      [
                        {
                          text: '취소',
                          style: 'cancel',
                        },
                        {
                          text: '해제',
                          style: 'destructive',
                          onPress: () => {
                            setTransaction((prev) => ({
                              ...prev,
                              employerId: null,
                              workerId: null,
                            }));
                            setSelectedPerson(null);

                            // 해제 후 고용주 검색 모달 열기
                            setSearchType('employer');
                            setEmployerFilters({ name: '', tel: '', type: '' });
                            setWorkerFilters({
                              name: '',
                              tel: '',
                              type: '',
                              nationality: '',
                            });
                            setSearchResults([]);
                            setSelectedItemId(null);
                            setSearchModalVisible(true);

                            setTimeout(() => {
                              searchEmployersWithFilters({
                                name: '',
                                tel: '',
                                type: '',
                              });
                            }, 100);
                          },
                        },
                      ]
                    );
                    return;
                  }

                  setSearchType('employer');
                  // 검색 모달 열 때 필터 초기화
                  setEmployerFilters({ name: '', tel: '', type: '' });
                  setWorkerFilters({
                    name: '',
                    tel: '',
                    type: '',
                    nationality: '',
                  });
                  setSearchResults([]);
                  setSelectedItemId(null); // 선택 상태 초기화
                  setSearchModalVisible(true);

                  // 모달이 열린 후 초기 검색 실행
                  setTimeout(() => {
                    searchEmployersWithFilters({
                      name: '',
                      tel: '',
                      type: '',
                    });
                  }, 100);
                }}
              >
                <Text style={styles.personTypeText}>고용주</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.personTypeButton}
                onPress={() => {
                  // 이미 선택된 상태라면 선택 해제 확인 알림
                  if (selectedPerson && transaction.workerId) {
                    Alert.alert(
                      '선택 해제',
                      '선택된 근로자를 해제하시겠습니까?',
                      [
                        {
                          text: '취소',
                          style: 'cancel',
                        },
                        {
                          text: '해제',
                          style: 'destructive',
                          onPress: () => {
                            setTransaction((prev) => ({
                              ...prev,
                              employerId: null,
                              workerId: null,
                            }));
                            setSelectedPerson(null);
                          },
                        },
                      ]
                    );
                    return;
                  }

                  // 고용주가 선택된 상태라면 먼저 해제
                  if (selectedPerson && transaction.employerId) {
                    Alert.alert(
                      '선택 해제',
                      '근로자를 선택하기 위해 고용주 선택을 해제하시겠습니까?',
                      [
                        {
                          text: '취소',
                          style: 'cancel',
                        },
                        {
                          text: '해제',
                          style: 'destructive',
                          onPress: () => {
                            setTransaction((prev) => ({
                              ...prev,
                              employerId: null,
                              workerId: null,
                            }));
                            setSelectedPerson(null);

                            // 해제 후 근로자 검색 모달 열기
                            setSearchType('worker');
                            setEmployerFilters({ name: '', tel: '', type: '' });
                            setWorkerFilters({
                              name: '',
                              tel: '',
                              type: '',
                              nationality: '',
                            });
                            setSearchResults([]);
                            setSelectedItemId(null);
                            setSearchModalVisible(true);

                            setTimeout(() => {
                              searchWorkersWithFilters({
                                name: '',
                                tel: '',
                                type: '',
                                nationality: '',
                              });
                            }, 100);
                          },
                        },
                      ]
                    );
                    return;
                  }

                  setSearchType('worker');
                  // 검색 모달 열 때 필터 초기화
                  setEmployerFilters({ name: '', tel: '', type: '' });
                  setWorkerFilters({
                    name: '',
                    tel: '',
                    type: '',
                    nationality: '',
                  });
                  setSearchResults([]);
                  setSelectedItemId(null); // 선택 상태 초기화
                  setSearchModalVisible(true);

                  // 모달이 열린 후 초기 검색 실행
                  setTimeout(() => {
                    searchWorkersWithFilters({
                      name: '',
                      tel: '',
                      type: '',
                      nationality: '',
                    });
                  }, 100);
                }}
              >
                <Text style={styles.personTypeText}>근로자</Text>
              </TouchableOpacity>
            </View>

            {/* 선택된 고용주/근로자 표시 */}
            {selectedPerson && (
              <View style={styles.selectedPersonInfo}>
                <Text style={styles.selectedPersonLabel}>
                  선택된 {searchType === 'employer' ? '고용주' : '근로자'}:
                </Text>
                <Text style={styles.selectedPersonValue}>
                  {selectedPerson.name}
                  {selectedPerson.type && ` (${selectedPerson.type})`}
                </Text>
                {selectedPerson.tel && (
                  <Text style={styles.selectedPersonTel}>
                    📞 {formatPhoneNumber(selectedPerson.tel)}
                  </Text>
                )}
                {searchType === 'worker' && selectedPerson.nationality && (
                  <Text style={styles.selectedPersonTel}>
                    🌍 {selectedPerson.nationality}
                  </Text>
                )}
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => {
                    setTransaction((prev) => ({
                      ...prev,
                      employerId: null,
                      workerId: null,
                    }));
                    setSelectedPerson(null);
                  }}
                >
                  <Ionicons name="close-circle" size={20} color="#FF3B30" />
                  <Text style={styles.clearSelectionText}>선택 해제</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        {/* 하단 버튼 */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>저장</Text>
          </TouchableOpacity>
        </View>

        {/* 날짜 선택 모달 */}
        <Modal
          visible={isDateModalVisible}
          onRequestClose={() => setDateModalVisible(false)}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDateModalVisible(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>날짜 선택</Text>
                <TouchableOpacity onPress={() => setDateModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.calendarContainer}>
                {/* 월 네비게이션 */}
                <View style={styles.calendarNavigation}>
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const prevMonth = new Date(currentCalendarDate);
                      prevMonth.setMonth(prevMonth.getMonth() - 1);
                      setCurrentCalendarDate(prevMonth);
                    }}
                  >
                    <Ionicons name="chevron-back" size={20} color="#666" />
                  </TouchableOpacity>
                  <Text style={styles.calendarMonthTitle}>
                    {currentCalendarDate.getFullYear()}년{' '}
                    {currentCalendarDate.getMonth() + 1}월
                  </Text>
                  <TouchableOpacity
                    style={styles.calendarNavButton}
                    onPress={() => {
                      const nextMonth = new Date(currentCalendarDate);
                      nextMonth.setMonth(nextMonth.getMonth() + 1);
                      setCurrentCalendarDate(nextMonth);
                    }}
                  >
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarGrid}>
                  {(() => {
                    const today = new Date();
                    const currentMonth = currentCalendarDate.getMonth();
                    const currentYear = currentCalendarDate.getFullYear();
                    const firstDay = new Date(currentYear, currentMonth, 1);
                    const startDate = new Date(firstDay);
                    startDate.setDate(startDate.getDate() - firstDay.getDay());

                    const calendarDays = [];
                    for (let i = 0; i < 42; i++) {
                      const date = new Date(startDate);
                      date.setDate(startDate.getDate() + i);
                      calendarDays.push(date);
                    }

                    return (
                      <>
                        {/* 요일 헤더 */}
                        <View style={styles.calendarHeader}>
                          {['일', '월', '화', '수', '목', '금', '토'].map(
                            (day) => (
                              <Text key={day} style={styles.calendarDayHeader}>
                                {day}
                              </Text>
                            )
                          )}
                        </View>

                        {/* 날짜 그리드 */}
                        <View style={styles.calendarDays}>
                          {calendarDays.map((date, index) => {
                            const isCurrentMonth =
                              date.getMonth() === currentMonth;
                            const isToday =
                              date.toDateString() === today.toDateString();
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(
                              2,
                              '0'
                            );
                            const day = String(date.getDate()).padStart(2, '0');
                            const dateString = `${year}-${month}-${day}`;
                            const isSelected = dateString === transaction.date;

                            return (
                              <TouchableOpacity
                                key={index}
                                style={[
                                  styles.calendarDay,
                                  isCurrentMonth &&
                                    styles.calendarDayCurrentMonth,
                                  isToday && styles.calendarDayToday,
                                  isSelected && styles.calendarDaySelected,
                                ]}
                                onPress={() => {
                                  if (isCurrentMonth) {
                                    const year = date.getFullYear();
                                    const month = String(
                                      date.getMonth() + 1
                                    ).padStart(2, '0');
                                    const day = String(date.getDate()).padStart(
                                      2,
                                      '0'
                                    );
                                    const dateString = `${year}-${month}-${day}`;
                                    handleChange('date', dateString);
                                    setDateModalVisible(false);
                                  }
                                }}
                              >
                                <Text
                                  style={[
                                    styles.calendarDayText,
                                    isCurrentMonth &&
                                      styles.calendarDayTextCurrentMonth,
                                    isToday && styles.calendarDayTextToday,
                                    isSelected &&
                                      styles.calendarDayTextSelected,
                                  ]}
                                >
                                  {date.getDate()}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </>
                    );
                  })()}
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 계산기 모달 */}
        <Modal
          visible={isCalculatorVisible}
          onRequestClose={() => setCalculatorVisible(false)}
          transparent={true}
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setCalculatorVisible(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>금액 입력</Text>
                <TouchableOpacity onPress={() => setCalculatorVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
              <View style={styles.calculatorDisplay}>
                <Text style={styles.calculatorExpression}>
                  {calculatorExpression || '0'}
                </Text>
                <Text style={styles.calculatorValue}>
                  ₩{' '}
                  {(calculatorValue || '0').replace(
                    /\B(?=(\d{3})+(?!\d))/g,
                    ','
                  )}
                </Text>
              </View>
              <View style={styles.calculatorButtons}>
                {[
                  ['C', '±', '%', '÷'],
                  ['7', '8', '9', '×'],
                  ['4', '5', '6', '-'],
                  ['1', '2', '3', '+'],
                  ['0', '000', '.', '='],
                ].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.calculatorRow}>
                    {row.map((button, buttonIndex) => {
                      if (button === '')
                        return (
                          <View
                            key={buttonIndex}
                            style={styles.calculatorButton}
                          />
                        );

                      return (
                        <TouchableOpacity
                          key={button}
                          style={[
                            styles.calculatorButton,
                            (button === '=' ||
                              button === '÷' ||
                              button === '×' ||
                              button === '-' ||
                              button === '+') &&
                              styles.calculatorButtonOperator,
                            button === 'C' && styles.calculatorButtonClear,
                            button === '=' && styles.calculatorButtonConfirm,
                          ]}
                          onPress={() => {
                            if (button === 'C') {
                              setCalculatorValue('');
                              setCalculatorExpression('');
                            } else if (button === '±') {
                              if (calculatorValue && calculatorValue !== '0') {
                                setCalculatorValue(
                                  calculatorValue.startsWith('-')
                                    ? calculatorValue.slice(1)
                                    : '-' + calculatorValue
                                );
                              }
                            } else if (button === '%') {
                              if (calculatorValue) {
                                const num = parseFloat(calculatorValue);
                                if (!isNaN(num)) {
                                  const result = (num / 100).toString();
                                  setCalculatorValue(result);
                                  setCalculatorExpression(result);
                                }
                              }
                            } else if (button === '=') {
                              try {
                                const expression =
                                  calculatorExpression + calculatorValue;
                                const result = eval(expression);
                                if (!isNaN(result)) {
                                  const resultStr = result.toString();
                                  setCalculatorValue(resultStr);
                                  setCalculatorExpression(resultStr);
                                }
                              } catch (_error) {
                                // 계산 오류 무시
                              }
                            } else if (['÷', '×', '-', '+'].includes(button)) {
                              const operator =
                                button === '÷'
                                  ? '/'
                                  : button === '×'
                                  ? '*'
                                  : button;
                              if (calculatorValue) {
                                setCalculatorExpression(
                                  calculatorExpression +
                                    calculatorValue +
                                    operator
                                );
                                setCalculatorValue('');
                              }
                            } else if (button === '000') {
                              if (calculatorValue && calculatorValue !== '0') {
                                setCalculatorValue(calculatorValue + '000');
                              } else {
                                setCalculatorValue('1000');
                              }
                            } else if (button === '.') {
                              if (
                                calculatorValue &&
                                !calculatorValue.includes('.')
                              ) {
                                setCalculatorValue(calculatorValue + '.');
                              }
                            } else {
                              setCalculatorValue((prev) => prev + button);
                            }
                          }}
                        >
                          <Text
                            style={[
                              styles.calculatorButtonText,
                              (button === '=' ||
                                button === '÷' ||
                                button === '×' ||
                                button === '-' ||
                                button === '+') &&
                                styles.calculatorButtonTextOperator,
                              button === 'C' &&
                                styles.calculatorButtonTextClear,
                              button === '=' &&
                                styles.calculatorButtonTextConfirm,
                            ]}
                          >
                            {button === '÷'
                              ? '÷'
                              : button === '×'
                              ? '×'
                              : button}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}

                {/* 확인 버튼 */}
                <View style={styles.calculatorRow}>
                  <TouchableOpacity
                    style={[
                      styles.calculatorButton,
                      styles.calculatorButtonConfirm,
                    ]}
                    onPress={() => {
                      if (calculatorValue) {
                        handleChange('amount', calculatorValue);
                        setCalculatorVisible(false);
                      }
                    }}
                  >
                    <Text style={styles.calculatorButtonTextConfirm}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* 고용주/근로자 선택 모달 */}
        <Modal
          visible={isSearchModalVisible}
          onRequestClose={() => setSearchModalVisible(false)}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              {/* 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {searchType === 'employer' ? '고용주 선택' : '근로자 선택'}
                </Text>
                <TouchableOpacity onPress={() => setSearchModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* 검색 필터 */}
              <View style={styles.searchFilters}>
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="이름으로 검색"
                    placeholderTextColor="#666"
                    value={
                      searchType === 'employer'
                        ? employerFilters.name
                        : workerFilters.name
                    }
                    onChangeText={(text) =>
                      handleFilterChange(searchType, 'name', text)
                    }
                  />
                </View>

                <View style={styles.searchInputContainer}>
                  <Ionicons name="call" size={20} color="#666" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="전화번호로 검색"
                    placeholderTextColor="#666"
                    keyboardType="phone-pad"
                    value={
                      searchType === 'employer'
                        ? employerFilters.tel
                        : workerFilters.tel
                    }
                    onChangeText={(text) =>
                      handleFilterChange(searchType, 'tel', text)
                    }
                  />
                </View>

                {searchType === 'employer' ? (
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="briefcase" size={20} color="#666" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="업종으로 검색"
                      placeholderTextColor="#666"
                      value={employerFilters.type}
                      onChangeText={(text) =>
                        handleFilterChange('employer', 'type', text)
                      }
                    />
                  </View>
                ) : (
                  <View style={styles.searchInputContainer}>
                    <Ionicons name="briefcase" size={20} color="#666" />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="직종으로 검색"
                      placeholderTextColor="#666"
                      value={workerFilters.type}
                      onChangeText={(text) =>
                        handleFilterChange('worker', 'type', text)
                      }
                    />
                  </View>
                )}
              </View>

              {/* 검색 결과 목록 */}
              <View style={styles.searchResultsContainer}>
                {searchResults.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons
                      name={
                        searchType === 'employer'
                          ? 'business-outline'
                          : 'people-outline'
                      }
                      size={64}
                      color="#666"
                    />
                    <Text style={styles.emptyText}>
                      {searchType === 'employer'
                        ? '등록된 고용주가 없습니다'
                        : '등록된 근로자가 없습니다'}
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled={true}
                  >
                    {searchResults.map((item) => (
                      <View key={item.id} style={styles.searchResultItem}>
                        {/* 체크박스 */}
                        <TouchableOpacity
                          style={styles.checkboxContainer}
                          onPress={() => {
                            // 선택 상태 토글
                            if (selectedItemId === item.id) {
                              setSelectedItemId(null); // 선택 해제
                            } else {
                              setSelectedItemId(item.id); // 선택
                            }
                          }}
                        >
                          <View
                            style={[
                              styles.checkbox,
                              selectedItemId === item.id &&
                                styles.checkboxSelected,
                            ]}
                          >
                            {selectedItemId === item.id && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="#fff"
                              />
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* 아이템 정보 */}
                        <TouchableOpacity
                          style={styles.itemInfoContainer}
                          onPress={() => {
                            // 상세보기 모달 열기
                            setSelectedDetailItem(item);
                            setDetailModalSearchType(searchType);
                            setDetailModalVisible(true);
                          }}
                        >
                          <View style={styles.resultItemHeader}>
                            <Text style={styles.resultItemName}>
                              {item.name}
                            </Text>
                            {item.type && (
                              <Text
                                style={[
                                  styles.resultItemType,
                                  getTypeTagStyle(item.type),
                                ]}
                              >
                                {item.type}
                              </Text>
                            )}
                          </View>
                          {item.tel && (
                            <Text style={styles.resultItemTel}>
                              📞 {formatPhoneNumber(item.tel)}
                            </Text>
                          )}
                          {searchType === 'worker' && item.nationality && (
                            <Text style={styles.resultItemTel}>
                              🌍 {item.nationality}
                            </Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}

                    {/* 최종선택 버튼 */}
                    {selectedItemId && (
                      <TouchableOpacity
                        style={styles.finalSelectButton}
                        onPress={() => {
                          const selectedItem = searchResults.find(
                            (item) => item.id === selectedItemId
                          );
                          if (selectedItem) {
                            if (searchType === 'employer') {
                              // 고용주 선택 시
                              setTransaction((prev) => ({
                                ...prev,
                                employerId: selectedItem.id,
                                workerId: null, // 근로자 선택 해제
                              }));
                              setSelectedPerson({
                                id: selectedItem.id,
                                name: selectedItem.name,
                                type: selectedItem.type || '',
                                tel: selectedItem.tel,
                              });
                            } else {
                              // 근로자 선택 시
                              setTransaction((prev) => ({
                                ...prev,
                                workerId: selectedItem.id,
                                employerId: null, // 고용주 선택 해제
                              }));
                              setSelectedPerson({
                                id: selectedItem.id,
                                name: selectedItem.name,
                                type: selectedItem.type || '',
                                tel: selectedItem.tel,
                                nationality: selectedItem.nationality,
                              });
                            }
                            setSearchModalVisible(false);
                            setSelectedItemId(null); // 선택 상태 초기화
                          }
                        }}
                      >
                        <Text style={styles.finalSelectButtonText}>
                          선택하기
                        </Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>

        {/* 상세보기 모달 */}
        <Modal
          visible={isDetailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {/* 헤더 */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {detailModalSearchType === 'employer'
                    ? '고용주 상세정보'
                    : '근로자 상세정보'}
                </Text>
                <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              {/* 상세 정보 */}
              <ScrollView style={{ flex: 1 }}>
                {selectedDetailItem && (
                  <View style={styles.detailContent}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>이름</Text>
                      <Text style={styles.detailValue}>
                        {selectedDetailItem.name}
                      </Text>
                    </View>

                    {selectedDetailItem.type && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>
                          {detailModalSearchType === 'employer'
                            ? '업종'
                            : '직종'}
                        </Text>
                        <Text style={styles.detailValue}>
                          {selectedDetailItem.type}
                        </Text>
                      </View>
                    )}

                    {selectedDetailItem.tel && (
                      <View style={styles.detailSection}>
                        <Text style={styles.detailLabel}>전화번호</Text>
                        <Text style={styles.detailValue}>
                          {formatPhoneNumber(selectedDetailItem.tel)}
                        </Text>
                      </View>
                    )}

                    {detailModalSearchType === 'worker' &&
                      selectedDetailItem.nationality && (
                        <View style={styles.detailSection}>
                          <Text style={styles.detailLabel}>국적</Text>
                          <Text style={styles.detailValue}>
                            {selectedDetailItem.nationality}
                          </Text>
                        </View>
                      )}
                  </View>
                )}
              </ScrollView>

              {/* 선택 버튼 */}
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => {
                  if (selectedDetailItem) {
                    if (detailModalSearchType === 'employer') {
                      // 고용주 선택 시
                      setTransaction((prev) => ({
                        ...prev,
                        employerId: selectedDetailItem.id,
                        workerId: null, // 근로자 선택 해제
                      }));
                      setSelectedPerson({
                        id: selectedDetailItem.id,
                        name: selectedDetailItem.name,
                        type: selectedDetailItem.type || '',
                        tel: selectedDetailItem.tel,
                      });
                    } else {
                      // 근로자 선택 시
                      setTransaction((prev) => ({
                        ...prev,
                        workerId: selectedDetailItem.id,
                        employerId: null, // 고용주 선택 해제
                      }));
                      setSelectedPerson({
                        id: selectedDetailItem.id,
                        name: selectedDetailItem.name,
                        type: selectedDetailItem.type || '',
                        tel: selectedDetailItem.tel,
                        nationality: selectedDetailItem.nationality,
                      });
                    }
                    setDetailModalVisible(false);
                    setSearchModalVisible(false);
                    setSelectedItemId(null); // 선택 상태 초기화
                  }
                }}
              >
                <Text style={styles.selectButtonText}>선택하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
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
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  typeOptionActive: {
    backgroundColor: '#FF3B30',
  },
  typeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  typeTextActive: {
    color: '#fff',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 10,
  },
  amountDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  memoInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    color: '#fff',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateInput: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontSize: 16,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    width: '95%',
    height: '90%',
    padding: 20,
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  calendarNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  calendarNavButton: {
    padding: 10,
  },
  calendarMonthTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  calendarGrid: {
    width: '100%',
    paddingHorizontal: 10,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  calendarDayHeader: {
    width: '14.28%',
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    paddingVertical: 8,
  },
  calendarDays: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarDayCurrentMonth: {
    backgroundColor: '#333',
    borderRadius: 4,
  },
  calendarDayToday: {
    backgroundColor: '#FF3B30',
    borderRadius: 4,
  },
  calendarDaySelected: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  calendarDayText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarDayTextCurrentMonth: {
    color: '#fff',
  },
  calendarDayTextToday: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calendarDayTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  calculatorDisplay: {
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  calculatorValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  calculatorButtons: {
    gap: 10,
  },
  calculatorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  calculatorButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculatorButtonClear: {
    backgroundColor: '#FF6B6B',
  },
  calculatorButtonConfirm: {
    backgroundColor: '#4CAF50',
  },
  calculatorButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  calculatorButtonTextClear: {
    color: '#fff',
  },
  calculatorButtonTextConfirm: {
    color: '#fff',
  },
  personSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    gap: 4,
    marginBottom: 15,
  },
  personTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  personTypeButtonActive: {
    backgroundColor: '#FF3B30',
  },
  personTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  personTypeTextActive: {
    color: '#fff',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    gap: 10,
  },

  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },

  searchExecuteButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  searchResults: {
    maxHeight: 300,
  },
  searchResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  searchResultName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchResultType: {
    color: '#666',
    fontSize: 14,
  },
  // 검색 필터 스타일
  searchFilters: {
    marginBottom: 20,
    gap: 10,
    flexShrink: 0,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#555',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },
  filterInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  // 검색 결과 스타일
  resultItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultItemType: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resultTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  resultItemDetails: {
    gap: 4,
  },
  resultDetailText: {
    color: '#999',
    fontSize: 14,
  },
  // 실시간 검색 안내 스타일
  searchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  searchInfoText: {
    color: '#666',
    fontSize: 14,
  },
  // 검색 모달 콘텐츠 스타일
  searchModalContent: {
    flex: 1,
  },
  // 검색 결과 컨테이너 스타일
  searchResultsContainer: {
    flex: 1,
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  checkboxContainer: {
    padding: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    borderWidth: 2,
    borderColor: '#666',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#FF3B30',
    borderColor: '#FF3B30',
  },
  itemInfoContainer: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  resultItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultItemTel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  finalSelectButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 15,
    marginHorizontal: 20,
  },
  finalSelectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // 상세보기 모달 스타일
  detailContent: {
    flex: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  detailValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calculatorExpression: {
    color: '#999',
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'right',
  },
  calculatorButtonOperator: {
    backgroundColor: '#FF9500',
  },
  calculatorButtonTextOperator: {
    color: '#fff',
  },
  memoActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10,
  },
  memoActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  memoActionText: {
    color: '#666',
    fontSize: 14,
  },
  paymentSelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  paymentOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  paymentOptionActive: {
    backgroundColor: '#FF3B30',
  },
  paymentText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  paymentTextActive: {
    color: '#fff',
  },
  categorySelector: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  categoryOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  categoryOptionActive: {
    backgroundColor: '#FF3B30',
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
  },
  // 선택된 고용주/근로자 정보 스타일
  selectedPersonInfo: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectedPersonLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  selectedPersonValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectedPersonTel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  clearSelectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  clearSelectionText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
