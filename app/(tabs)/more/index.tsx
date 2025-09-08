import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MoreScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);

  // 마지막 백업 날짜 확인
  useEffect(() => {
    checkLastBackupDate();
  }, []);

  const checkLastBackupDate = async () => {
    try {
      const backupDir = FileSystem.documentDirectory + 'backups/';
      const dirInfo = await FileSystem.getInfoAsync(backupDir);

      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(backupDir);
        const backupFiles = files.filter((file) => file.endsWith('.json'));

        if (backupFiles.length > 0) {
          // 가장 최근 백업 파일 찾기
          const latestFile = backupFiles.sort().pop();
          if (latestFile) {
            const fileInfo = await FileSystem.getInfoAsync(
              backupDir + latestFile
            );
            if (fileInfo.exists && fileInfo.modificationTime) {
              setLastBackupDate(
                new Date(fileInfo.modificationTime * 1000).toLocaleDateString(
                  'ko-KR'
                )
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('백업 날짜 확인 오류:', error);
    }
  };

  const handleTrash = () => {
    router.push('/more/trash');
  };

  const createBackupDirectory = async () => {
    const backupDir = FileSystem.documentDirectory + 'backups/';
    const dirInfo = await FileSystem.getInfoAsync(backupDir);

    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
    }

    return backupDir;
  };

  const handleBackup = async () => {
    if (isBackingUp) return;

    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      // 백업 디렉토리 생성
      const backupDir = await createBackupDirectory();

      setBackupProgress(10);

      // 고용주 데이터 백업
      const employers = await db.getAllAsync('SELECT * FROM employers');
      setBackupProgress(30);

      // 근로자 데이터 백업
      const workers = await db.getAllAsync('SELECT * FROM workers');
      setBackupProgress(50);

      // 기록 데이터 백업
      const records = await db.getAllAsync('SELECT * FROM records');
      setBackupProgress(60);

      // 거래 내역 백업
      const transactions = await db.getAllAsync('SELECT * FROM transactions');
      setBackupProgress(70);

      // 앱 설정 및 메타데이터
      const appInfo = {
        version: '1.0.0',
        backupDate: new Date().toISOString(),
        totalRecords: {
          employers: employers.length,
          workers: workers.length,
          records: records.length,
          transactions: transactions.length,
        },
      };

      const backupData = {
        ...appInfo,
        employers,
        workers,
        records,
        transactions,
      };

      setBackupProgress(80);

      const backupJson = JSON.stringify(backupData, null, 2);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `hirebook_backup_${timestamp}.json`;
      const fileUri = backupDir + fileName;

      await FileSystem.writeAsStringAsync(fileUri, backupJson);
      setBackupProgress(90);

      // 백업 완료 후 마지막 백업 날짜 업데이트
      setLastBackupDate(new Date().toLocaleDateString('ko-KR'));
      setBackupProgress(100);

      // 백업 파일 공유
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '고용장부 백업 파일 공유',
          UTI: 'public.json',
        });
      } else {
        Alert.alert(
          '백업 완료',
          `백업 파일이 생성되었습니다.\n\n파일명: ${fileName}\n위치: ${backupDir}\n\n총 ${employers.length}명의 고용주, ${workers.length}명의 근로자, ${records.length}건의 기록, ${transactions.length}건의 거래내역이 백업되었습니다.`
        );
      }
    } catch (error) {
      console.error('백업 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      Alert.alert(
        '백업 오류',
        '백업 중 오류가 발생했습니다.\n\n오류 내용: ' + errorMessage
      );
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const validateBackupData = (data: any) => {
    // 필수 필드 확인
    if (
      !data.employers ||
      !data.workers ||
      !data.records ||
      !data.transactions
    ) {
      return { isValid: false, error: '필수 데이터가 누락되었습니다.' };
    }

    // 데이터 타입 확인
    if (
      !Array.isArray(data.employers) ||
      !Array.isArray(data.workers) ||
      !Array.isArray(data.records) ||
      !Array.isArray(data.transactions)
    ) {
      return { isValid: false, error: '데이터 형식이 올바르지 않습니다.' };
    }

    // 데이터 무결성 확인 - 실제 테이블 구조에 맞게 수정
    const requiredEmployerFields = [
      'id',
      'name',
      'tel',
      'note',
      'type',
      'addr_postcode',
      'addr_street',
      'addr_extra',
      'created_date',
      'updated_date',
      'deleted',
    ];

    const requiredWorkerFields = [
      'id',
      'name',
      'birth_year',
      'tel',
      'gender',
      'type',
      'note',
      'university',
      'uni_postcode',
      'uni_street',
      'addr_postcode',
      'addr_street',
      'addr_extra',
      'nationality',
      'face',
      'created_date',
      'updated_date',
      'deleted',
    ];

    const requiredRecordFields = [
      'id',
      'date',
      'created_date',
      'updated_date',
      'deleted',
    ];

    const requiredTransactionFields = [
      'id',
      'record_id',
      'worker_id',
      'employer_id',
      'amount',
      'date',
      'category',
      'type',
      'payment_type',
      'note',
      'created_date',
      'updated_date',
      'deleted',
    ];

    for (const employer of data.employers) {
      for (const field of requiredEmployerFields) {
        if (!(field in employer)) {
          return {
            isValid: false,
            error: `고용주 데이터에 필수 필드 '${field}'가 누락되었습니다.`,
          };
        }
      }
    }

    for (const worker of data.workers) {
      for (const field of requiredWorkerFields) {
        if (!(field in worker)) {
          return {
            isValid: false,
            error: `근로자 데이터에 필수 필드 '${field}'가 누락되었습니다.`,
          };
        }
      }
    }

    for (const record of data.records) {
      for (const field of requiredRecordFields) {
        if (!(field in record)) {
          return {
            isValid: false,
            error: `기록 데이터에 필수 필드 '${field}'가 누락되었습니다.`,
          };
        }
      }
    }

    for (const transaction of data.transactions) {
      for (const field of requiredTransactionFields) {
        if (!(field in transaction)) {
          return {
            isValid: false,
            error: `거래내역 데이터에 필수 필드 '${field}'가 누락되었습니다.`,
          };
        }
      }
    }

    return { isValid: true, error: null };
  };

  const handleRestore = async () => {
    if (isRestoring) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const fileUri = result.assets[0].uri;
      const fileName = result.assets[0].name;

      Alert.alert(
        '복원 확인',
        `백업 파일 "${fileName}"에서 데이터를 복원하시겠습니까?\n\n⚠️ 주의: 기존 데이터는 모두 삭제됩니다.\n\n복원을 진행하기 전에 현재 데이터를 백업하는 것을 권장합니다.`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '복원 진행',
            style: 'destructive',
            onPress: async () => {
              await performRestore(fileUri);
            },
          },
        ]
      );
    } catch (error) {
      console.error('파일 선택 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      Alert.alert(
        '오류',
        '파일을 선택할 수 없습니다.\n\n오류 내용: ' + errorMessage
      );
    }
  };

  const performRestore = async (fileUri: string) => {
    setIsRestoring(true);
    setRestoreProgress(0);

    try {
      setRestoreProgress(10);

      const fileContent = await FileSystem.readAsStringAsync(fileUri);
      const backupData = JSON.parse(fileContent);

      setRestoreProgress(20);

      // 백업 데이터 유효성 검사
      const validation = validateBackupData(backupData);
      if (!validation.isValid) {
        throw new Error(
          validation.error || '백업 데이터 유효성 검사에 실패했습니다.'
        );
      }

      setRestoreProgress(30);

      // 복원 전 최종 확인
      const finalConfirm = await new Promise<boolean>((resolve) => {
        Alert.alert(
          '최종 확인',
          `다음 데이터를 복원합니다:\n\n` +
            `• 고용주: ${backupData.employers.length}명\n` +
            `• 근로자: ${backupData.workers.length}명\n` +
            `• 기록: ${backupData.records.length}건\n` +
            `• 거래내역: ${backupData.transactions.length}건\n\n` +
            `정말로 복원을 진행하시겠습니까?`,
          [
            { text: '취소', onPress: () => resolve(false) },
            {
              text: '복원',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ]
        );
      });

      if (!finalConfirm) {
        setIsRestoring(false);
        setRestoreProgress(0);
        return;
      }

      setRestoreProgress(40);

      // 트랜잭션 시작
      await db.runAsync('BEGIN TRANSACTION');

      try {
        setRestoreProgress(50);

        // 기존 데이터 삭제
        await db.runAsync('DELETE FROM transactions');
        await db.runAsync('DELETE FROM workers');
        await db.runAsync('DELETE FROM employers');
        await db.runAsync('DELETE FROM records'); // 기록 데이터 삭제

        setRestoreProgress(60);

        // 백업 데이터 복원
        for (const employer of backupData.employers) {
          await db.runAsync(
            'INSERT INTO employers (id, name, tel, note, type, addr_postcode, addr_street, addr_extra, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              employer.id,
              employer.name,
              employer.tel,
              employer.note,
              employer.type,
              employer.addr_postcode,
              employer.addr_street,
              employer.addr_extra,
              employer.created_date,
              employer.updated_date,
              employer.deleted,
            ]
          );
        }

        setRestoreProgress(70);

        for (const worker of backupData.workers) {
          await db.runAsync(
            'INSERT INTO workers (id, name, birth_year, tel, gender, type, note, university, uni_postcode, uni_street, addr_postcode, addr_street, addr_extra, nationality, face, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              worker.id,
              worker.name,
              worker.birth_year,
              worker.tel,
              worker.gender,
              worker.type,
              worker.note,
              worker.university,
              worker.uni_postcode,
              worker.uni_street,
              worker.addr_postcode,
              worker.addr_street,
              worker.addr_extra,
              worker.nationality,
              worker.face,
              worker.created_date,
              worker.updated_date,
              worker.deleted,
            ]
          );
        }

        setRestoreProgress(80);

        for (const record of backupData.records) {
          await db.runAsync(
            'INSERT INTO records (id, date, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?)',
            [
              record.id,
              record.date,
              record.created_date,
              record.updated_date,
              record.deleted,
            ]
          );
        }

        setRestoreProgress(90);

        for (const transaction of backupData.transactions) {
          await db.runAsync(
            'INSERT INTO transactions (id, record_id, worker_id, employer_id, amount, date, category, type, payment_type, created_date, updated_date, deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
              transaction.id,
              transaction.record_id,
              transaction.worker_id,
              transaction.employer_id,
              transaction.amount,
              transaction.date,
              transaction.category,
              transaction.type,
              transaction.payment_type,
              transaction.created_date,
              transaction.updated_date,
              transaction.deleted,
            ]
          );
        }

        setRestoreProgress(100);

        // 트랜잭션 커밋
        await db.runAsync('COMMIT');

        Alert.alert(
          '복원 완료',
          `데이터가 성공적으로 복원되었습니다!\n\n` +
            `• 고용주: ${backupData.employers.length}명\n` +
            `• 근로자: ${backupData.workers.length}명\n` +
            `• 기록: ${backupData.records.length}건\n` +
            `• 거래내역: ${backupData.transactions.length}건\n\n` +
            `백업 날짜: ${
              backupData.backupDate
                ? new Date(backupData.backupDate).toLocaleDateString('ko-KR')
                : '알 수 없음'
            }`
        );
      } catch (error) {
        await db.runAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('복원 오류:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : '알 수 없는 오류가 발생했습니다.';
      Alert.alert(
        '복원 오류',
        '복원 중 오류가 발생했습니다.\n\n오류 내용: ' + errorMessage
      );
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const handleAbout = () => {
    Alert.alert('정보', 'Hirebook 앱 v1.0.0\n\n개발자: 오형상\n');
  };

  const handleStatistics = () => {
    router.push('/more/statistics');
  };

  const menuItems = [
    {
      icon: 'bar-chart',
      title: '통계',
      subtitle: '수입/지출 통계 및 분석',
      onPress: handleStatistics,
      color: '#AF52DE',
    },
    {
      icon: 'cloud-upload',
      title: '백업',
      subtitle: lastBackupDate
        ? `마지막 백업: ${lastBackupDate}`
        : '데이터 백업 및 공유',
      onPress: handleBackup,
      color: '#34C759',
      loading: isBackingUp,
      progress: backupProgress,
    },
    {
      icon: 'cloud-download',
      title: '복원',
      subtitle: '백업 파일에서 데이터 복원',
      onPress: handleRestore,
      color: '#007AFF',
      loading: isRestoring,
      progress: restoreProgress,
    },

    {
      icon: 'trash',
      title: '휴지통',
      subtitle: '삭제된 데이터 관리',
      onPress: handleTrash,
      color: '#FF3B30',
    },
    {
      icon: 'information-circle',
      title: '정보',
      subtitle: '앱 정보 및 버전',
      onPress: handleAbout,
      color: '#AF52DE',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>더보기</Text>
        <Text style={styles.headerSubtitle}>앱 설정 및 관리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            disabled={item.loading}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}
            >
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>

              {/* 진행률 표시 */}
              {item.loading && item.progress !== undefined && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${item.progress}%` },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{item.progress}%</Text>
                </View>
              )}
            </View>
            <View style={styles.menuArrow}>
              {item.loading ? (
                <ActivityIndicator size="small" color={item.color} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#666" />
              )}
            </View>
          </TouchableOpacity>
        ))}
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
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  menuSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  menuArrow: {
    marginLeft: 10,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 2,
  },
  progressText: {
    color: '#999',
    fontSize: 12,
    minWidth: 30,
    textAlign: 'right',
  },
});
