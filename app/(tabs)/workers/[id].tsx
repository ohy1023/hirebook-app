import { formatPhoneNumber } from '@/utils/format';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  ScrollView,
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
    const postcode = worker.addr_postcode?.trim() ?? '';
    const base = [street, extra].filter(Boolean).join(' ');
    return postcode ? `(${postcode}) ${base}` : base;
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

  const handleEdit = () => {
    router.push(`/workers/edit?id=${id}` as any);
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

  const handleImagePress = () => {
    if (worker?.face) {
      setImageModalVisible(true);
    }
  };

  const handleCreateResume = () => {
    setResumeModalVisible(true);
  };

  const handleCaptureResume = async () => {
    if (!viewShotRef.current || !worker) return;

    try {
      const uri = await (viewShotRef.current as any).capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `${worker.name}의 이력서를 공유합니다`,
        });
      } else {
        Alert.alert('안내', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('이력서 캡처 오류:', error);
      Alert.alert('오류', '이력서 생성에 실패했습니다.');
    }
  };

  const handleShareResumeAsText = async () => {
    if (!worker) return;

    try {
      const resumeText = `📋 ${worker.name} 이력서
 
 👤 기본 정보
 • 이름: ${worker.name}
 • 전화번호: ${formatPhoneNumber(worker.tel)}
 • 직종: ${worker.type || '미입력'}
 ${worker.birth_year ? `• 출생연도: ${worker.birth_year}년` : ''}
 ${worker.gender ? `• 성별: ${worker.gender}` : ''}
 ${worker.nationality ? `• 국적: ${worker.nationality}` : ''}
 
 🏠 주소 정보
 • 주소: ${getAddressString()}
 
 🎓 대학 정보
 ${worker.university ? `• 대학명: ${worker.university}` : ''}
 ${worker.uni_street ? `• 대학주소: ${worker.uni_street}` : ''}
 
 📝 추가 정보
 ${worker.note ? worker.note : '• 추가 정보 없음'}
 
 📅 생성일: ${new Date().toLocaleDateString('ko-KR')}`.trim();

      if (await Sharing.isAvailableAsync()) {
        const fileName = `resume_${worker.id}_${Date.now()}.txt`;
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(tempPath, resumeText, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        await Sharing.shareAsync(tempPath, {
          mimeType: 'text/plain',
          dialogTitle: `${worker.name}의 이력서를 텍스트로 공유합니다`,
        });

        await FileSystem.deleteAsync(tempPath);
      } else {
        await Clipboard.setStringAsync(resumeText);
        Alert.alert(
          '복사 완료',
          `${worker.name}의 이력서가 클립보드에 복사되었습니다.`,
          [{ text: '확인', style: 'default' }]
        );
      }
    } catch (error) {
      console.error('이력서 텍스트 공유 오류:', error);
      Alert.alert('오류', '이력서 텍스트 공유에 실패했습니다.');
    }
  };

  const handleDownloadImage = async () => {
    if (!worker?.face) return;

    try {
      const fileName = `worker_${worker.id}_${Date.now()}.jpg`;

      if (worker.face.startsWith('file://')) {
        // 로컬 파일인 경우 공유
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(worker.face, {
            mimeType: 'image/jpeg',
            dialogTitle: `${worker.name}의 사진을 공유합니다`,
          });
        } else {
          Alert.alert('안내', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
        }
      } else {
        // 원격 이미지인 경우 임시 다운로드 후 공유
        const tempPath = `${FileSystem.cacheDirectory}${fileName}`;

        const downloadResult = await FileSystem.downloadAsync(
          worker.face,
          tempPath
        );

        if (!downloadResult || downloadResult.status !== 200) {
          throw new Error('다운로드 실패');
        }

        // 공유
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(tempPath, {
            mimeType: 'image/jpeg',
            dialogTitle: `${worker.name}의 사진을 공유합니다`,
          });
        } else {
          Alert.alert('안내', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
        }

        // 임시 파일 삭제
        await FileSystem.deleteAsync(tempPath);
      }
    } catch (error) {
      console.error('이미지 공유 오류:', error);
      Alert.alert('오류', '이미지 공유에 실패했습니다.');
    }
  };

  if (!worker) {
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
          <Text style={styles.title}>{worker.name}</Text>
          <View style={styles.inlineActions}>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleCreateResume}
            >
              <Text style={styles.smallButtonText}>📄 이력서</Text>
            </TouchableOpacity>
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

        <View style={styles.block}>
          <Text style={styles.label}>사진</Text>
          {worker.face ? (
            <TouchableOpacity onPress={handleImagePress}>
              <Image source={{ uri: worker.face }} style={styles.workerImage} />
            </TouchableOpacity>
          ) : (
            <View style={styles.workerImagePlaceholder}>
              <Text style={styles.workerImagePlaceholderText}>👤</Text>
            </View>
          )}
        </View>

        {worker.birth_year && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>출생연도</Text>
              <Text style={styles.text}>{worker.birth_year}년</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {worker.gender && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>성별</Text>
              <Text style={styles.text}>{worker.gender}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {worker.nationality && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>국적</Text>
              <Text style={styles.text}>{worker.nationality}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {worker.type && (
          <>
            <View style={styles.block}>
              <Text style={styles.label}>직종</Text>
              <Text style={styles.text}>{worker.type}</Text>
            </View>
            <View style={styles.divider} />
          </>
        )}

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
            {formatPhoneNumber(worker.tel)}
          </Text>
        </View>

        {worker.note ? (
          <View style={styles.block}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>추가 정보</Text>
              <View style={styles.inlineActions}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => {
                    Clipboard.setStringAsync(worker.note!);
                    Alert.alert(
                      '복사 완료',
                      '추가 정보가 클립보드에 복사되었습니다.'
                    );
                  }}
                >
                  <Text style={styles.smallButtonText}>복사</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.noteBox}>
              <ScrollView style={styles.noteScroll} nestedScrollEnabled>
                <Text style={styles.text}>{worker.note}</Text>
              </ScrollView>
            </View>
          </View>
        ) : null}
        {worker.note ? <View style={styles.divider} /> : null}

        {(worker.university || worker.uni_street) && (
          <>
            <View style={styles.block}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>대학 정보</Text>
                <View style={styles.inlineActions}>
                  {worker.uni_street && (
                    <TouchableOpacity
                      style={styles.smallButton}
                      onPress={() => {
                        Clipboard.setStringAsync(worker.uni_street!);
                        Alert.alert(
                          '복사 완료',
                          '대학 주소가 클립보드에 복사되었습니다.'
                        );
                      }}
                    >
                      <Text style={styles.smallButtonText}>복사</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              {worker.university && (
                <Text style={styles.text}>{worker.university}</Text>
              )}
              {worker.uni_street && (
                <Text style={styles.text}>{worker.uni_street}</Text>
              )}
            </View>
            <View style={styles.divider} />
          </>
        )}

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

      {/* 이미지 모달 */}
      <Modal
        isVisible={isImageModalVisible}
        backdropOpacity={0.9}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={styles.imageModalContainer}
        onBackdropPress={() => setImageModalVisible(false)}
      >
        <View style={styles.imageModalContent}>
          <Image
            source={{ uri: worker?.face }}
            style={styles.modalImage}
            resizeMode="contain"
          />
          <View style={styles.imageModalActions}>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleDownloadImage}
            >
              <Text style={styles.modalButtonText}>📤 공유</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setImageModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>✕ 닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 이력서 모달 */}
      <Modal
        isVisible={isResumeModalVisible}
        backdropOpacity={0.9}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={styles.resumeModalContainer}
        onBackdropPress={() => setResumeModalVisible(false)}
      >
        <View style={styles.resumeModalContent}>
          <ScrollView
            style={styles.resumeScrollContainer}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.resumeScrollContent}
          >
            <ViewShot
              ref={viewShotRef}
              style={styles.resumeContainer}
              options={{
                format: 'png',
                quality: 0.9,
              }}
            >
              <View style={styles.resumeHeader}>
                <Text style={styles.resumeTitle}>📋 {worker?.name} 이력서</Text>
                <Text style={styles.resumeSubtitle}>근로자 상세 정보</Text>
                <View style={styles.resumeImageContainer}>
                  {worker?.face ? (
                    <Image
                      source={{ uri: worker.face }}
                      style={styles.resumeImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.resumeImagePlaceholder}>
                      <Text style={styles.resumeImagePlaceholderText}>👤</Text>
                    </View>
                  )}
                </View>
              </View>

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
  text: {
    color: '#1c1c1e',
    fontSize: 18,
    flexShrink: 1,
  },
  label: { fontSize: 16, fontWeight: '700', color: '#6b7280', marginBottom: 8 },
  phone: { color: '#007AFF', textDecorationLine: 'underline' },
  row: { marginBottom: 20 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  block: { marginTop: 6, marginBottom: 20 },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  inlineActions: { flexDirection: 'row', gap: 8 },
  smallButton: {
    backgroundColor: '#9ca3af',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  primarySmall: { backgroundColor: '#0a84ff' },
  dangerSmall: { backgroundColor: '#ff3b30' },
  smallButtonText: { color: '#fff', fontWeight: '700', fontSize: 14 },
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
  infoItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
    paddingHorizontal: 4,
    maxWidth: '25%',
  },
  workerImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  workerImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workerImagePlaceholderText: {
    fontSize: 48,
    color: '#9ca3af',
  },
  imageModalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    width: '90%',
    height: '80%',
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
  imageModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  closeButton: {
    backgroundColor: '#ff3b30',
  },
  secondaryButton: {
    backgroundColor: '#34c759',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  // 이력서 모달 스타일
  resumeModalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resumeModalContent: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  resumeScrollContainer: {
    flex: 1,
    width: '100%',
  },
  resumeScrollContent: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  resumeContainer: {
    width: 350,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  resumeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111',
    marginBottom: 4,
  },
  resumeSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  resumeImageContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  resumeImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
  },
  resumeImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#007AFF',
    backgroundColor: '#f9fafb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeImagePlaceholderText: {
    fontSize: 32,
    color: '#007AFF',
  },
  resumeSection: {
    marginBottom: 20,
  },
  resumeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 12,
  },
  resumeRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  resumeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    width: 80,
    marginRight: 12,
  },
  resumeValue: {
    fontSize: 14,
    color: '#111',
    flex: 1,
    fontWeight: '500',
  },
  resumeNote: {
    fontSize: 14,
    color: '#111',
    lineHeight: 20,
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  resumeFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    alignItems: 'center',
  },
  resumeDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  resumeModalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    marginTop: 16,
  },
});
