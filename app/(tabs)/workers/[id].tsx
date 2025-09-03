import { formatPhoneNumber } from '@/utils/format';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
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
import ViewShot from 'react-native-view-shot';

type Worker = {
  id: number;
  name: string;
  tel: string;
  type: string;
  note: string;
  birth_year?: number;
  gender?: string;
  university?: string;
  uni_postcode?: string;
  uni_street?: string;
  addr_postcode: string;
  addr_street: string;
  addr_extra: string;
  nationality?: string;
  face?: string;
};

export default function WorkerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isImageModalVisible, setImageModalVisible] = useState(false);
  const [isResumeModalVisible, setResumeModalVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);

  // 초기 로딩
  useEffect(() => {
    async function fetchWorker() {
      const row = await db.getFirstAsync<Worker>(
        'SELECT * FROM workers WHERE id = ?',
        Number(id)
      );
      setWorker(row);
    }
    fetchWorker();
  }, [id, db]);

  // 화면 포커스 시 데이터 새로고침
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      async function refreshWorker() {
        try {
          const row = await db.getFirstAsync<Worker>(
            'SELECT * FROM workers WHERE id = ?',
            Number(id)
          );
          if (isMounted) {
            setWorker(row);
          }
        } catch (error) {
          console.error('근로자 정보 새로고침 실패:', error);
        }
      }

      refreshWorker();

      return () => {
        isMounted = false;
      };
    }, [id, db])
  );

  const getAddressString = () => {
    if (!worker) return '';
    const street = worker.addr_street?.trim() ?? '';
    const extra = worker.addr_extra?.trim() ?? '';
    return [street, extra].filter(Boolean).join(' ');
  };

  const handleDelete = () => {
    Alert.alert('삭제 확인', '정말 이 근로자를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await db.runAsync('UPDATE workers SET deleted = 1 WHERE id = ?', [
              Number(id),
            ]);
            Alert.alert('삭제 완료', '근로자가 삭제되었습니다.');
            router.back();
          } catch (err) {
            console.error(err);
            Alert.alert('오류', '삭제에 실패했습니다.');
          }
        },
      },
    ]);
  };

  const handleRecord = () => {
    if (!worker) return;

    // 근로자와의 거래 기록 화면으로 이동
    router.push(`/workers/${worker.id}/records`);
  };

  const handleEdit = () => {
    router.push(`/workers/edit?id=${id}`);
  };

  const handleCall = () => {
    if (worker?.tel) {
      Linking.openURL(`tel:${worker.tel}`);
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
    const text = worker?.tel ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 전화번호가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '전화번호가 클립보드에 복사되었습니다.');
  };

  const handleCopyResume = async () => {
    if (!worker) return;

    try {
      const resumeText = `근로자 이력서

기본 정보
- 이름: ${worker.name}
- 전화번호: ${formatPhoneNumber(worker.tel)}
- 직종: ${worker.type || '미입력'}
- 출생연도: ${worker.birth_year || '미입력'}
- 성별: ${worker.gender || '미입력'}
- 국적: ${worker.nationality || '미입력'}

대학교 정보
- 대학교명: ${worker.university || '미입력'}
- 대학교 주소: ${worker.uni_street || '미입력'}

주소 정보
- 주소: ${getAddressString() || '미입력'}

추가 정보
- 메모: ${worker.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(resumeText);
      Alert.alert('복사 완료', '이력서가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '이력서 복사에 실패했습니다.');
    }
  };

  const handleShareImage = async () => {
    if (!worker?.face) {
      Alert.alert('안내', '공유할 이미지가 없습니다.');
      return;
    }

    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(worker.face, {
          mimeType: 'image/jpeg',
          dialogTitle: '프로필 사진 공유',
        });
      } else {
        Alert.alert('안내', '공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      Alert.alert('오류', '이미지 공유에 실패했습니다.');
    }
  };

  const handleGenerateResumeImage = async () => {
    if (!worker || !viewShotRef.current) return;

    try {
      const uri = await (viewShotRef.current as any).capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '이력서 이미지 공유',
        });
      } else {
        Alert.alert('안내', '공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('이력서 이미지 생성 실패:', error);
      Alert.alert('오류', '이력서 이미지 생성에 실패했습니다.');
    }
  };

  const handleCaptureResume = async () => {
    if (!worker || !viewShotRef.current) return;

    try {
      const uri = await (viewShotRef.current as any).capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '이력서 이미지 공유',
        });
      } else {
        Alert.alert('안내', '공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('이력서 이미지 생성 실패:', error);
      Alert.alert('오류', '이력서 이미지 생성에 실패했습니다.');
    }
  };

  const handleShareResumeAsText = async () => {
    if (!worker) return;

    try {
      const resumeText = `근로자 이력서

👤 기본 정보
- 이름: ${worker.name}
- 전화번호: ${formatPhoneNumber(worker.tel)}
- 직종: ${worker.type || '미입력'}
- 출생연도: ${worker.birth_year || '미입력'}
- 성별: ${worker.gender || '미입력'}
- 국적: ${worker.nationality || '미입력'}

🏠 주소 정보
- 주소: ${getAddressString() || '미입력'}

🎓 대학 정보
- 대학명: ${worker.university || '미입력'}
- 대학주소: ${worker.uni_street || '미입력'}

📝 추가 정보
- 메모: ${worker.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(resumeText);
      Alert.alert('복사 완료', '이력서가 클립보드에 복사되었습니다.');
    } catch (error) {
      Alert.alert('오류', '이력서 복사에 실패했습니다.');
    }
  };

  const handleCopyUniversityAddress = async () => {
    const text = worker?.uni_street ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 대학교 주소가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '대학교 주소가 클립보드에 복사되었습니다.');
  };

  const handleCopyMemo = async () => {
    const text = worker?.note ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 메모가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', '메모가 클립보드에 복사되었습니다.');
  };

  if (!worker) {
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
            <Text style={styles.headerTitle}>근로자 정보</Text>
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
            {worker.face ? (
              <TouchableOpacity onPress={() => setImageModalVisible(true)}>
                <Image
                  source={{ uri: worker.face }}
                  style={styles.profileImage}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Ionicons name="person" size={32} color="#34C759" />
              </View>
            )}
            <View style={styles.basicInfo}>
              <Text style={styles.name}>{worker.name}</Text>
              <View style={styles.infoTags}>
                {worker.type && (
                  <Text style={styles.typeTag}>{worker.type}</Text>
                )}
                {worker.birth_year && (
                  <Text style={styles.birthYearTag}>{worker.birth_year}년</Text>
                )}
                {worker.gender && (
                  <Text style={styles.genderTag}>{worker.gender}</Text>
                )}
                {worker.nationality && (
                  <Text style={styles.nationalityTag}>
                    {worker.nationality}
                  </Text>
                )}
              </View>
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
                {formatPhoneNumber(worker.tel)}
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

        {/* 대학교 정보 */}
        {worker.university && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>대학교 정보</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="school" size={20} color="#AF52DE" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>대학교명</Text>
                <Text style={styles.infoValue}>{worker.university}</Text>
              </View>
            </View>
            {worker.uni_street && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Ionicons name="location" size={20} color="#FF3B30" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>대학교 주소</Text>
                  <Text style={styles.infoValue}>{worker.uni_street}</Text>
                </View>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleCopyUniversityAddress}
                >
                  <Ionicons name="copy" size={20} color="#FF9500" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 주소 정보 */}
        {worker.addr_street && (
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
        {worker.note && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>메모</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="document-text" size={20} color="#AF52DE" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{worker.note}</Text>
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
              setResumeModalVisible(true);
            }}
          >
            <Ionicons name="document" size={20} color="#FF9500" />
            <Text style={styles.menuItemText}>이력서</Text>
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

      {/* 프로필 사진 모달 */}
      <Modal
        isVisible={isImageModalVisible}
        onBackdropPress={() => setImageModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalShareButton}
            onPress={handleShareImage}
          >
            <Ionicons name="share" size={24} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: worker.face }} style={styles.modalImage} />
        </View>
      </Modal>

      {/* 이력서 모달 */}
      <Modal
        isVisible={isResumeModalVisible}
        onBackdropPress={() => setResumeModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.resumeModalContent}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setResumeModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          <ScrollView
            style={styles.resumeModalScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resumeContent}>
              <Text style={styles.resumeTitle}>근로자 이력서</Text>

              <View style={styles.resumeSection}>
                <Text style={styles.resumeSectionTitle}>👤 기본 정보</Text>
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeLabel}>이름:</Text>
                  <Text style={styles.resumeValue}>{worker?.name}</Text>
                </View>
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeLabel}>전화번호:</Text>
                  <Text style={styles.resumeValue}>
                    {worker?.tel ? formatPhoneNumber(worker.tel) : '미입력'}
                  </Text>
                </View>
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeLabel}>직종:</Text>
                  <Text style={styles.resumeValue}>
                    {worker?.type || '미입력'}
                  </Text>
                </View>
                {worker?.birth_year && (
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>출생연도:</Text>
                    <Text style={styles.resumeValue}>
                      {worker.birth_year}년
                    </Text>
                  </View>
                )}
                {worker?.gender && (
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>성별:</Text>
                    <Text style={styles.resumeValue}>{worker.gender}</Text>
                  </View>
                )}
                {worker?.nationality && (
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>국적:</Text>
                    <Text style={styles.resumeValue}>{worker.nationality}</Text>
                  </View>
                )}
              </View>

              <View style={styles.resumeSection}>
                <Text style={styles.resumeSectionTitle}>🏠 주소 정보</Text>
                <View style={styles.resumeRow}>
                  <Text style={styles.resumeLabel}>주소:</Text>
                  <Text style={styles.resumeValue}>{getAddressString()}</Text>
                </View>
              </View>

              {(worker?.university || worker?.uni_street) && (
                <View style={styles.resumeSection}>
                  <Text style={styles.resumeSectionTitle}>🎓 대학 정보</Text>
                  {worker?.university && (
                    <View style={styles.resumeRow}>
                      <Text style={styles.resumeLabel}>대학명:</Text>
                      <Text style={styles.resumeValue}>
                        {worker.university}
                      </Text>
                    </View>
                  )}
                  {worker?.uni_street && (
                    <View style={styles.resumeRow}>
                      <Text style={styles.resumeLabel}>대학주소:</Text>
                      <Text style={styles.resumeValue}>
                        {worker.uni_street}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {worker?.note && (
                <View style={styles.resumeSection}>
                  <Text style={styles.resumeSectionTitle}>📝 추가 정보</Text>
                  <Text style={styles.resumeNote}>{worker.note}</Text>
                </View>
              )}

              <View style={styles.resumeFooter}>
                <Text style={styles.resumeDate}>
                  생성일: {new Date().toLocaleDateString('ko-KR')}
                </Text>
              </View>
            </View>

            {/* 이미지 캡처용 ViewShot */}
            <ViewShot
              ref={viewShotRef}
              style={styles.resumeViewShot}
              options={{ format: 'png', quality: 0.9 }}
            >
              <View style={styles.resumeContent}>
                <Text style={styles.resumeTitle}>근로자 이력서</Text>

                <View style={styles.resumeSection}>
                  <Text style={styles.resumeSectionTitle}>👤 기본 정보</Text>
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>이름:</Text>
                    <Text style={styles.resumeValue}>{worker?.name}</Text>
                  </View>
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>전화번호:</Text>
                    <Text style={styles.resumeValue}>
                      {worker?.tel ? formatPhoneNumber(worker.tel) : '미입력'}
                    </Text>
                  </View>
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>직종:</Text>
                    <Text style={styles.resumeValue}>
                      {worker?.type || '미입력'}
                    </Text>
                  </View>
                  {worker?.birth_year && (
                    <View style={styles.resumeRow}>
                      <Text style={styles.resumeLabel}>출생연도:</Text>
                      <Text style={styles.resumeValue}>
                        {worker.birth_year}년
                      </Text>
                    </View>
                  )}
                  {worker?.gender && (
                    <View style={styles.resumeRow}>
                      <Text style={styles.resumeLabel}>성별:</Text>
                      <Text style={styles.resumeValue}>{worker.gender}</Text>
                    </View>
                  )}
                  {worker?.nationality && (
                    <View style={styles.resumeRow}>
                      <Text style={styles.resumeLabel}>국적:</Text>
                      <Text style={styles.resumeValue}>
                        {worker.nationality}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.resumeSection}>
                  <Text style={styles.resumeSectionTitle}>🏠 주소 정보</Text>
                  <View style={styles.resumeRow}>
                    <Text style={styles.resumeLabel}>주소:</Text>
                    <Text style={styles.resumeValue}>{getAddressString()}</Text>
                  </View>
                </View>

                {(worker?.university || worker?.uni_street) && (
                  <View style={styles.resumeSection}>
                    <Text style={styles.resumeSectionTitle}>🎓 대학 정보</Text>
                    {worker?.university && (
                      <View style={styles.resumeRow}>
                        <Text style={styles.resumeLabel}>대학명:</Text>
                        <Text style={styles.resumeValue}>
                          {worker.university}
                        </Text>
                      </View>
                    )}
                    {worker?.uni_street && (
                      <View style={styles.resumeRow}>
                        <Text style={styles.resumeLabel}>대학주소:</Text>
                        <Text style={styles.resumeValue}>
                          {worker.uni_street}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {worker?.note && (
                  <View style={styles.resumeSection}>
                    <Text style={styles.resumeSectionTitle}>📝 추가 정보</Text>
                    <Text style={styles.resumeNote}>{worker.note}</Text>
                  </View>
                )}

                <View style={styles.resumeFooter}>
                  <Text style={styles.resumeDate}>
                    생성일: {new Date().toLocaleDateString('ko-KR')}
                  </Text>
                </View>
              </View>
            </ViewShot>
          </ScrollView>

          <View style={styles.resumeModalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleCaptureResume}
            >
              <Text style={styles.modalButtonText}>🖼️ 이미지</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.secondaryButton]}
              onPress={handleShareResumeAsText}
            >
              <Text style={styles.modalButtonText}>📝 텍스트</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setResumeModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>✕ 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 이력서 이미지 생성용 ViewShot (화면에 보이지 않음) */}
      <ViewShot
        ref={viewShotRef}
        style={styles.resumeViewShot}
        options={{ format: 'png', quality: 0.9 }}
      >
        <View style={styles.resumeContent}>
          <Text style={styles.resumeTitle}>근로자 이력서</Text>

          <View style={styles.resumeSection}>
            <Text style={styles.resumeSectionTitle}>👤 기본 정보</Text>
            <Text style={styles.resumeText}>• 이름: {worker.name}</Text>
            <Text style={styles.resumeText}>
              • 전화번호: {formatPhoneNumber(worker.tel)}
            </Text>
            <Text style={styles.resumeText}>
              • 직종: {worker.type || '미입력'}
            </Text>
            {worker.birth_year && (
              <Text style={styles.resumeText}>
                • 출생연도: {worker.birth_year}년
              </Text>
            )}
            {worker.gender && (
              <Text style={styles.resumeText}>• 성별: {worker.gender}</Text>
            )}
            {worker.nationality && (
              <Text style={styles.resumeText}>
                • 국적: {worker.nationality}
              </Text>
            )}
          </View>

          <View style={styles.resumeSection}>
            <Text style={styles.resumeSectionTitle}>🏠 주소 정보</Text>
            <Text style={styles.resumeText}>• 주소: {getAddressString()}</Text>
          </View>

          {(worker.university || worker.uni_street) && (
            <View style={styles.resumeSection}>
              <Text style={styles.resumeSectionTitle}>🎓 대학 정보</Text>
              {worker.university && (
                <Text style={styles.resumeText}>
                  • 대학명: {worker.university}
                </Text>
              )}
              {worker.uni_street && (
                <Text style={styles.resumeText}>
                  • 대학주소: {worker.uni_street}
                </Text>
              )}
            </View>
          )}

          {worker.note && (
            <View style={styles.resumeSection}>
              <Text style={styles.resumeSectionTitle}>📝 추가 정보</Text>
              <Text style={styles.resumeText}>• 메모: {worker.note}</Text>
            </View>
          )}

          <Text style={styles.resumeDate}>
            생성일: {new Date().toLocaleDateString('ko-KR')}
          </Text>
        </View>
      </ViewShot>
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
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#333',
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#34C75920',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  infoTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeTag: {
    color: '#34C759',
    fontSize: 12,
    backgroundColor: '#34C75920',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  birthYearTag: {
    color: '#FF9500',
    fontSize: 12,
    backgroundColor: '#FF950020',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderTag: {
    color: '#007AFF',
    fontSize: 12,
    backgroundColor: '#007AFF20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nationalityTag: {
    color: '#AF52DE',
    fontSize: 12,
    backgroundColor: '#AF52DE20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    marginBottom: 15,
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
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  resumeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modal: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#000',
    borderRadius: 12,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalShareButton: {
    position: 'absolute',
    top: 15,
    left: 15,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  resumeViewShot: {
    position: 'absolute',
    top: -1000, // 화면 밖으로 이동
    left: 0,
    width: 350,
    height: 600,
    opacity: 1, // 완전히 보이도록 설정
    zIndex: 1, // 다른 요소들 앞에 배치
  },
  resumeContent: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    width: 350,
    minHeight: 500,
  },
  resumeTitle: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resumeSection: {
    marginBottom: 20,
  },
  resumeSectionTitle: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resumeText: {
    color: '#000',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
  },
  resumeDate: {
    color: '#666',
    fontSize: 14,
    textAlign: 'right',
    marginTop: 20,
  },
  resumeModalContent: {
    backgroundColor: '#000',
    borderRadius: 12,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
    position: 'relative',
  },
  resumeModalScroll: {
    flex: 1,
    paddingBottom: 20,
  },
  resumeShareButton: {
    backgroundColor: '#FF9500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    gap: 8,
    marginTop: 20,
  },
  resumeShareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resumeLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    width: 80,
    marginRight: 10,
  },
  resumeValue: {
    color: '#000',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  resumeNote: {
    color: '#000',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },
  resumeFooter: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  resumeModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    backgroundColor: '#FF9500',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#007AFF',
  },
  closeButton: {
    backgroundColor: '#666',
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
