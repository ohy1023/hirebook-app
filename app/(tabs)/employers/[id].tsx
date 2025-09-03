import { formatPhoneNumber } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

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
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
    return [street, extra].filter(Boolean).join(' ');
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

  const handleCopyMemo = async () => {
    const text = employer?.note ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 메모가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '메모가 클립보드에 복사되었습니다.');
  };

  const handleShare = async () => {
    if (!employer) return;

    try {
      const shareText = `고용주 정보

 👤 기본 정보
- 회사명: ${employer.name}
- 업종: ${employer.type || '미입력'}
- 전화번호: ${formatPhoneNumber(employer.tel)}

🏠 주소 정보
- 주소: ${getAddressString() || '미입력'}

📝 추가 정보
- 메모: ${employer.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(shareText);
      Alert.alert('복사 완료', '고용주 정보가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '고용주 정보 복사에 실패했습니다.');
    }
  };

  const handleRecord = () => {
    if (!employer) return;

    // 고용주와의 거래 기록 화면으로 이동
    router.push(`/employers/${employer.id}/records`);
  };

  if (!employer) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>고용주 정보</Text>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setIsMenuVisible(true)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 기본 정보 카드 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.avatarContainer}>
              <Ionicons name="business" size={32} color="#007AFF" />
            </View>
            <View style={styles.basicInfo}>
              <Text style={styles.name}>{employer.name}</Text>
              {employer.type && (
                <Text style={styles.type}>{employer.type}</Text>
              )}
            </View>
          </View>
        </View>

        {/* 연락처 정보 */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>연락처</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call" size={20} color="#34C759" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>전화번호</Text>
              <Text style={styles.infoValue}>
                {formatPhoneNumber(employer.tel)}
              </Text>
            </View>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCall}
              >
                <Ionicons name="call" size={20} color="#007AFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyPhone}
              >
                <Ionicons name="copy" size={20} color="#FF9500" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 주소 정보 */}
        {employer.addr_street && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>주소</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="location" size={20} color="#FF3B30" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>주소</Text>
                <Text style={styles.infoValue}>{getAddressString()}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyAddress}
              >
                <Ionicons name="copy" size={20} color="#FF9500" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 메모 정보 */}
        {employer.note && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>메모</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="document-text" size={20} color="#AF52DE" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{employer.note}</Text>
              </View>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyMemo}
              >
                <Ionicons name="copy" size={20} color="#FF9500" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 드롭다운 메뉴 모달 */}
      <Modal
        isVisible={isMenuVisible}
        onBackdropPress={() => setIsMenuVisible(false)}
        style={styles.menuModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleEdit();
            }}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
            <Text style={styles.menuItemText}>수정</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleRecord();
            }}
          >
            <Ionicons name="document-text" size={20} color="#34C759" />
            <Text style={styles.menuItemText}>거래 기록</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleShare();
            }}
          >
            <Ionicons name="share" size={20} color="#FF9500" />
            <Text style={styles.menuItemText}>공유</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuItem, styles.deleteMenuItem]}
            onPress={() => {
              setIsMenuVisible(false);
              handleDelete();
            }}
          >
            <Ionicons name="trash" size={20} color="#FF3B30" />
            <Text style={[styles.menuItemText, styles.deleteMenuItemText]}>
              삭제
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  basicInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  type: {
    color: '#007AFF',
    fontSize: 14,
    backgroundColor: '#007AFF20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuModal: {
    margin: 0,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 8,
    marginTop: 100,
    marginRight: 20,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 150,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 12,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginTop: 4,
    paddingTop: 16,
  },
  deleteMenuItemText: {
    color: '#FF3B30',
  },
});
