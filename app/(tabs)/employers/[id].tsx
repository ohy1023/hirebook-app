import { formatPhoneNumber } from '@/utils/format';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Employer = {
  id: number;
  name: string;
  tel: string;
  type: string;
  note: string;
  addr_postcode: string;
  addr_street: string;
  addr_extra: string;
};

export default function EmployerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);

  useEffect(() => {
    async function fetchEmployer() {
      const row = await db.getFirstAsync<Employer>(
        'SELECT * FROM employers WHERE id = ?',
        Number(id)
      );
      setEmployer(row);
    }
    fetchEmployer();
  }, [id, db]);

  const getAddressString = () => {
    if (!employer) return '';
    const street = employer.addr_street?.trim() ?? '';
    const extra = employer.addr_extra?.trim() ?? '';
    const postcode = employer.addr_postcode?.trim() ?? '';
    const base = [street, extra].filter(Boolean).join(' ');
    return postcode ? `(${postcode}) ${base}` : base;
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', '정말 이 고용주를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync('UPDATE employers SET deleted = 1 WHERE id = ?', [
              Number(id),
            ]);
            Alert.alert('삭제 완료', '고용주가 삭제되었습니다.');
            router.back();
          } catch (err) {
            console.error(err);
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push(`/employers/edit?id=${id}`);
  };

  const handleCall = () => {
    if (employer?.tel) {
      Linking.openURL(`tel:${employer.tel}`);
    }
  };

  const handleCopyAddress = async () => {
    const text = getAddressString();
    if (!text) {
      Alert.alert('안내', '복사할 주소가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '주소가 클립보드에 복사되었습니다.');
  };

  const handleCopyPhone = async () => {
    const text = employer?.tel ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 전화번호가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '전화번호가 클립보드에 복사되었습니다.');
  };

  if (!employer) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 0 }}>
      {/* 정보 카드 */}
      <View style={styles.card}>
        {/* 타이틀 + 액션 */}
        <View style={styles.rowBetween}>
          <Text style={styles.title}>{employer.name}</Text>
          <View style={styles.divider} />
          <View style={styles.inlineActions}>
            <TouchableOpacity
              style={[styles.smallButton, styles.primarySmall]}
              onPress={handleEdit}
            >
              <Text style={styles.smallButtonText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.smallButton, styles.dangerSmall]}
              onPress={handleDelete}
            >
              <Text style={styles.smallButtonText}>삭제</Text>
            </TouchableOpacity>
          </View>
        </View>

        {employer.type ? (
          <View style={styles.block}>
            <Text style={styles.label}>종류</Text>
            <Text style={styles.text}>{employer.type}</Text>
          </View>
        ) : null}
        <View style={styles.divider} />

        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>전화번호</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={handleCopyPhone}
              >
                <Text style={styles.smallButtonText}>복사</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.smallButton, styles.primarySmall]}
                onPress={handleCall}
              >
                <Text style={styles.smallButtonText}>전화하기</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.text, styles.phone]}>
            {formatPhoneNumber(employer.tel)}
          </Text>
        </View>
        <View style={styles.divider} />
        {employer.note ? (
          <View style={styles.block}>
            <Text style={styles.label}>추가 정보</Text>
            <View style={styles.noteBox}>
              <ScrollView style={styles.noteScroll} nestedScrollEnabled>
                <Text style={styles.text}>{employer.note}</Text>
              </ScrollView>
            </View>
          </View>
        ) : null}
        {employer.note ? <View style={styles.divider} /> : null}

        <View style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.label}>주소</Text>
            <View style={styles.inlineActions}>
              <TouchableOpacity
                style={styles.smallButton}
                onPress={handleCopyAddress}
              >
                <Text style={styles.smallButtonText}>복사</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.text}>{getAddressString()}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 0,
    padding: 24,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
  },
  text: { color: '#1c1c1e', fontSize: 18 },
  label: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  phone: { color: '#007AFF', textDecorationLine: 'underline' },
  row: { marginBottom: 20 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  block: { marginTop: 6, marginBottom: 20 },
  inlineActions: { flexDirection: 'row', gap: 8 },
  smallButton: {
    backgroundColor: '#9ca3af',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  primarySmall: { backgroundColor: '#0a84ff' },
  smallButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  noteBox: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  noteScroll: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  headerAction: {
    backgroundColor: '#0a84ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  headerActionDanger: { backgroundColor: '#ff3b30' },
  headerActionText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  dangerSmall: { backgroundColor: '#ff3b30' },
});
