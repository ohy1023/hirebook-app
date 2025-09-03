import { ALERT_MESSAGES, ICON_NAMES, MENU_ITEMS } from '@/constants';
import { workerQueries } from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Worker } from '@/types';
import {
  formatPhoneNumber,
  getGenderTagStyle,
  getWorkerAddressString,
} from '@/utils/common';
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
      const row = await workerQueries.getById(db, Number(id));
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
          const row = await workerQueries.getById(db, Number(id));
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

  const handleDelete = () => {
    Alert.alert('삭제 확인', ALERT_MESSAGES.DELETE_CONFIRM, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await workerQueries.delete(db, Number(id));
            Alert.alert('삭제 완료', ALERT_MESSAGES.DELETE_SUCCESS);
            router.back();
          } catch (err) {
            console.error(err);
            Alert.alert('오류', ALERT_MESSAGES.DELETE_FAILED);
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
    const text = getWorkerAddressString(worker);
    if (!text) {
      Alert.alert('안내', '복사할 주소가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  const handleCopyPhone = async () => {
    const text = worker?.tel ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 전화번호가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
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
- 주소: ${getWorkerAddressString(worker) || '미입력'}

추가 정보
- 메모: ${worker.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(resumeText);
      Alert.alert('복사 완료', '이력서가 클립보드에 복사되었습니다.');
    } catch (_error) {
      console.error('이력서 복사 실패:', _error);
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
    } catch (_error) {
      console.error('프로필 이미지 공유 실패:', _error);
      Alert.alert('오류', ALERT_MESSAGES.SHARE_FAILED);
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
    } catch (_error) {
      console.error('이력서 이미지 생성 실패:', _error);
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
- 주소: ${getWorkerAddressString(worker) || '미입력'}

🎓 대학 정보
- 대학명: ${worker.university || '미입력'}
- 대학주소: ${worker.uni_street || '미입력'}

📝 추가 정보
- 메모: ${worker.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(resumeText);
      Alert.alert('복사 완료', '이력서가 클립보드에 복사되었습니다.');
    } catch (_error) {
      console.error('이력서 복사 실패:', _error);
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
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  const handleCopyMemo = async () => {
    const text = worker?.note ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 메모가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  if (!worker) {
    return (
      <SafeAreaView style={commonStyles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
        <View style={commonStyles.loadingContainer}>
          <Text style={commonStyles.loadingText}>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <View style={commonStyles.header}>
          <View style={commonStyles.headerContent}>
            <Text style={commonStyles.headerTitle}>근로자 정보</Text>
            <TouchableOpacity
              style={commonStyles.menuButton}
              onPress={() => setIsMenuVisible(true)}
            >
              <Ionicons
                name={ICON_NAMES.ellipsis}
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* 기본 정보 카드 */}
        <View style={commonStyles.card}>
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
                <Ionicons
                  name={ICON_NAMES.person}
                  size={32}
                  color={colors.success}
                />
              </View>
            )}
            <View style={styles.basicInfo}>
              <Text style={styles.name}>{worker.name}</Text>
              <View style={styles.infoTags}>
                {worker.type && (
                  <Text
                    style={[
                      styles.typeTag,
                      {
                        color: colors.success,
                        backgroundColor: colors.success + '20',
                      },
                    ]}
                  >
                    {worker.type}
                  </Text>
                )}
                {worker.birth_year && (
                  <Text
                    style={[
                      styles.birthYearTag,
                      {
                        color: colors.warning,
                        backgroundColor: colors.warning + '20',
                      },
                    ]}
                  >
                    {worker.birth_year}년
                  </Text>
                )}
                {worker.gender && (
                  <Text
                    style={[styles.genderTag, getGenderTagStyle(worker.gender)]}
                  >
                    {worker.gender}
                  </Text>
                )}
                {worker.nationality && (
                  <Text
                    style={[
                      styles.nationalityTag,
                      {
                        color: colors.info,
                        backgroundColor: colors.info + '20',
                      },
                    ]}
                  >
                    {worker.nationality}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 연락처 정보 */}
        <View style={commonStyles.card}>
          <Text style={commonStyles.sectionTitle}>연락처</Text>
          <View style={commonStyles.infoRow}>
            <View style={commonStyles.infoIcon}>
              <Ionicons
                name={ICON_NAMES.call}
                size={20}
                color={colors.success}
              />
            </View>
            <View style={commonStyles.infoContent}>
              <Text style={commonStyles.infoLabel}>전화번호</Text>
              <Text style={commonStyles.infoValue}>
                {formatPhoneNumber(worker.tel)}
              </Text>
            </View>
            <View style={commonStyles.actionButtons}>
              <TouchableOpacity
                style={commonStyles.actionButton}
                onPress={handleCall}
              >
                <Ionicons
                  name={ICON_NAMES.call}
                  size={20}
                  color={colors.secondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={commonStyles.actionButton}
                onPress={handleCopyPhone}
              >
                <Ionicons name="copy" size={20} color={colors.warning} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 대학교 정보 */}
        {worker.university && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>대학교 정보</Text>
            <View style={commonStyles.infoRow}>
              <View style={commonStyles.infoIcon}>
                <Ionicons
                  name={ICON_NAMES.school}
                  size={20}
                  color={colors.info}
                />
              </View>
              <View style={commonStyles.infoContent}>
                <Text style={commonStyles.infoLabel}>대학교명</Text>
                <Text style={commonStyles.infoValue}>{worker.university}</Text>
              </View>
            </View>
            {worker.uni_street && (
              <View style={commonStyles.infoRow}>
                <View style={commonStyles.infoIcon}>
                  <Ionicons
                    name={ICON_NAMES.location}
                    size={20}
                    color={colors.danger}
                  />
                </View>
                <View style={commonStyles.infoContent}>
                  <Text style={commonStyles.infoLabel}>대학교 주소</Text>
                  <Text style={commonStyles.infoValue}>
                    {worker.uni_street}
                  </Text>
                </View>
                <TouchableOpacity
                  style={commonStyles.actionButton}
                  onPress={handleCopyUniversityAddress}
                >
                  <Ionicons name="copy" size={20} color={colors.warning} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 주소 정보 */}
        {worker.addr_street && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>주소</Text>
            <View style={commonStyles.infoRow}>
              <View style={commonStyles.infoIcon}>
                <Ionicons
                  name={ICON_NAMES.location}
                  size={20}
                  color={colors.danger}
                />
              </View>
              <View style={commonStyles.infoContent}>
                <Text style={commonStyles.infoLabel}>주소</Text>
                <Text style={commonStyles.infoValue}>
                  {getWorkerAddressString(worker)}
                </Text>
              </View>
              <TouchableOpacity
                style={commonStyles.actionButton}
                onPress={handleCopyAddress}
              >
                <Ionicons name="copy" size={20} color={colors.warning} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 메모 정보 */}
        {worker.note && (
          <View style={commonStyles.card}>
            <Text style={commonStyles.sectionTitle}>메모</Text>
            <View style={commonStyles.infoRow}>
              <View style={commonStyles.infoIcon}>
                <Ionicons
                  name={ICON_NAMES.document}
                  size={20}
                  color={colors.info}
                />
              </View>
              <View style={commonStyles.infoContent}>
                <Text style={commonStyles.infoValue}>{worker.note}</Text>
              </View>
              <TouchableOpacity
                style={commonStyles.actionButton}
                onPress={handleCopyMemo}
              >
                <Ionicons name="copy" size={20} color={colors.warning} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 드롭다운 메뉴 모달 */}
      <Modal
        isVisible={isMenuVisible}
        onBackdropPress={() => setIsMenuVisible(false)}
        style={commonStyles.menuModal}
        animationIn="fadeIn"
        animationOut="fadeOut"
      >
        <View style={commonStyles.menuContainer}>
          <TouchableOpacity
            style={commonStyles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleEdit();
            }}
          >
            <Ionicons
              name={ICON_NAMES.edit}
              size={20}
              color={colors.secondary}
            />
            <Text style={commonStyles.menuItemText}>{MENU_ITEMS.EDIT}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={commonStyles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleRecord();
            }}
          >
            <Ionicons
              name={ICON_NAMES.record}
              size={20}
              color={colors.success}
            />
            <Text style={commonStyles.menuItemText}>
              {MENU_ITEMS.TRANSACTION_RECORD}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={commonStyles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              setResumeModalVisible(true);
            }}
          >
            <Ionicons
              name={ICON_NAMES.resume}
              size={20}
              color={colors.warning}
            />
            <Text style={commonStyles.menuItemText}>{MENU_ITEMS.RESUME}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[commonStyles.menuItem, commonStyles.deleteMenuItem]}
            onPress={() => {
              setIsMenuVisible(false);
              handleDelete();
            }}
          >
            <Ionicons
              name={ICON_NAMES.delete}
              size={20}
              color={colors.danger}
            />
            <Text
              style={[
                commonStyles.menuItemText,
                commonStyles.deleteMenuItemText,
              ]}
            >
              {MENU_ITEMS.DELETE}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 프로필 사진 모달 */}
      <Modal
        isVisible={isImageModalVisible}
        onBackdropPress={() => setImageModalVisible(false)}
        style={commonStyles.modal}
      >
        <View style={commonStyles.modalContent}>
          <TouchableOpacity
            style={commonStyles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Ionicons name={ICON_NAMES.close} size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={commonStyles.modalShareButton}
            onPress={handleShareImage}
          >
            <Ionicons name={ICON_NAMES.share} size={24} color={colors.text} />
          </TouchableOpacity>
          <Image
            source={{ uri: worker.face }}
            style={commonStyles.modalImage}
          />
        </View>
      </Modal>

      {/* 이력서 모달 */}
      <Modal
        isVisible={isResumeModalVisible}
        onBackdropPress={() => setResumeModalVisible(false)}
        style={commonStyles.modal}
      >
        <View style={styles.resumeModalContent}>
          <TouchableOpacity
            style={commonStyles.modalCloseButton}
            onPress={() => setResumeModalVisible(false)}
          >
            <Ionicons name={ICON_NAMES.close} size={24} color={colors.text} />
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
                  <Text style={styles.resumeValue}>
                    {getWorkerAddressString(worker)}
                  </Text>
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
                    <Text style={styles.resumeValue}>
                      {getWorkerAddressString(worker)}
                    </Text>
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
            <Text style={styles.resumeText}>
              • 주소: {getWorkerAddressString(worker)}
            </Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
    borderColor: colors.border,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.success + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basicInfo: {
    flex: 1,
  },
  name: {
    color: colors.text,
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
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  birthYearTag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genderTag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nationalityTag: {
    fontSize: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
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
    backgroundColor: colors.light,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    width: 350,
    minHeight: 500,
  },
  resumeTitle: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resumeSection: {
    marginBottom: 20,
  },
  resumeSectionTitle: {
    color: colors.gray,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  resumeText: {
    color: colors.dark,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 5,
  },
  resumeDate: {
    color: colors.gray,
    fontSize: 14,
    textAlign: 'right',
    marginTop: 20,
  },
  resumeModalContent: {
    backgroundColor: colors.dark,
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
  resumeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  resumeLabel: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: '600',
    width: 80,
    marginRight: 10,
  },
  resumeValue: {
    color: colors.dark,
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  resumeNote: {
    color: colors.dark,
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
    backgroundColor: colors.warning,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  closeButton: {
    backgroundColor: colors.gray,
  },
});
