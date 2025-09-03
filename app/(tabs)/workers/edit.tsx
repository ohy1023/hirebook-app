import { workerQueries } from '@/db/queries';
import { Worker } from '@/types';
import { formatPhoneNumber } from '@/utils/common';
import Postcode from '@actbase/react-daum-postcode';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

export default function EditWorkerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [worker, setWorker] = useState<Worker>({
    id: 0,
    name: '',
    tel: '',
    note: '',
    type: '',
    birth_year: undefined,
    gender: '',
    university: '',
    uni_postcode: '',
    uni_street: '',
    addr_postcode: '',
    addr_street: '',
    addr_extra: '',
    nationality: '',
    face: '',
  });

  const [isModalVisible, setModalVisible] = useState(false);
  const [isUniversityModalVisible, setUniversityModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 기존 근로자 정보 불러오기
  useEffect(() => {
    async function fetchWorker() {
      try {
        const row = await workerQueries.getById(db, Number(id));
        if (row) {
          setWorker(row);
          if (row.face) {
            setSelectedImage(row.face);
          }
        }
      } catch (error) {
        console.error('근로자 정보 불러오기 실패:', error);
        Alert.alert('오류', '근로자 정보를 불러올 수 없습니다.');
      }
    }
    fetchWorker();
  }, [id, db]);

  const handleChange = (key: keyof Worker, value: string) => {
    setWorker((prev) => ({ ...prev, [key]: value }));
  };

  const onChangeTel = (text: string) => {
    const raw = text.replace(/[^0-9]/g, '');
    setWorker((prev) => ({ ...prev, tel: raw }));
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!worker.name || !worker.tel) {
      Alert.alert('오류', '이름과 전화번호는 필수입니다.');
      return;
    }

    try {
      await workerQueries.update(db, Number(id), {
        name: worker.name,
        tel: worker.tel,
        note: worker.note || '',
        type: worker.type || '',
        birth_year: worker.birth_year || undefined,
        gender: worker.gender || '',
        university: worker.university || '',
        uni_postcode: worker.uni_postcode || '',
        uni_street: worker.uni_street || '',
        addr_postcode: worker.addr_postcode || '',
        addr_street: worker.addr_street || '',
        addr_extra: worker.addr_extra || '',
        nationality: worker.nationality || '',
        face: selectedImage || '',
      });

      Alert.alert('성공', '근로자 정보가 수정되었습니다.');
      router.back();
    } catch (_error) {
      console.error(_error);
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    Alert.alert('삭제 확인', '정말로 이 근로자를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await workerQueries.delete(db, Number(id));
            Alert.alert('삭제 완료', '근로자가 삭제되었습니다.');
            router.back();
          } catch (_error) {
            console.error(_error);
            Alert.alert('오류', '삭제 중 오류가 발생했습니다.');
          }
        },
      },
    ]);
  };

  const handleAddressSelect = (data: any) => {
    handleChange('addr_postcode', data.zonecode);
    handleChange('addr_street', data.address);
    handleChange('addr_extra', data.buildingName || '');
    setModalVisible(false);
  };

  const handleUniversityAddressSelect = (data: any) => {
    handleChange('uni_postcode', data.zonecode);
    handleChange('uni_street', data.address);
    // 빌딩이름이 있으면 대학명으로 설정, 없으면 주소에서 추출
    if (data.buildingName) {
      handleChange('university', data.buildingName);
    } else {
      // 주소에서 대학명 추출 (예: "서울특별시 강남구 테헤란로 152" -> "테헤란로")
      const addressParts = data.address.split(' ');
      const roadName = addressParts.find(
        (part: string) => part.includes('로') || part.includes('길')
      );
      if (roadName) {
        handleChange('university', roadName);
      } else {
        handleChange('university', data.address);
      }
    }
    setUniversityModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 사진 */}
        <View style={styles.imageSection}>
          <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
            {selectedImage ? (
              <Image
                source={{ uri: selectedImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera" size={32} color="#999" />
                <Text style={styles.imagePlaceholderText}>사진 변경</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 기본 정보 */}
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>기본 정보</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="이름"
              placeholderTextColor="#666"
              value={worker.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="call"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="전화번호"
              placeholderTextColor="#666"
              value={formatPhoneNumber(worker.tel)}
              onChangeText={onChangeTel}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="briefcase"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="직종"
              placeholderTextColor="#666"
              value={worker.type}
              onChangeText={(text) => handleChange('type', text)}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <Ionicons
                name="calendar"
                size={20}
                color="#999"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="출생연도"
                placeholderTextColor="#666"
                value={worker.birth_year?.toString() || ''}
                onChangeText={(text) => handleChange('birth_year', text)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TouchableOpacity
                style={styles.genderSelector}
                onPress={() => {
                  Alert.alert('성별 선택', '성별을 선택해주세요.', [
                    { text: '취소', style: 'cancel' },
                    {
                      text: '남성',
                      onPress: () => handleChange('gender', '남성'),
                    },
                    {
                      text: '여성',
                      onPress: () => handleChange('gender', '여성'),
                    },
                  ]);
                }}
              >
                <Text
                  style={[
                    styles.genderSelectorText,
                    worker.gender
                      ? styles.genderSelectedText
                      : styles.genderPlaceholderText,
                  ]}
                >
                  {worker.gender || '성별 선택'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="globe"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="국적"
              placeholderTextColor="#666"
              value={worker.nationality}
              onChangeText={(text) => handleChange('nationality', text)}
            />
          </View>
        </View>

        {/* 대학교 정보 */}
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>대학교 정보</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="school"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="대학교명 (주소 검색으로 자동 입력)"
              placeholderTextColor="#666"
              value={worker.university}
              onChangeText={(text) => handleChange('university', text)}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="location"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="대학교 우편번호"
              placeholderTextColor="#666"
              value={worker.uni_postcode}
              onChangeText={(text) => handleChange('uni_postcode', text)}
              editable={false}
            />
            <TouchableOpacity
              style={styles.addressButton}
              onPress={() => setUniversityModalVisible(true)}
            >
              <Text style={styles.addressButtonText}>주소 검색</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="map"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="대학교 주소"
              placeholderTextColor="#666"
              value={worker.uni_street}
              onChangeText={(text) => handleChange('uni_street', text)}
              editable={false}
            />
          </View>
        </View>

        {/* 주소 정보 */}
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>주소 정보</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="location"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="우편번호"
              placeholderTextColor="#666"
              value={worker.addr_postcode}
              onChangeText={(text) => handleChange('addr_postcode', text)}
              editable={false}
            />
            <TouchableOpacity
              style={styles.addressButton}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.addressButtonText}>주소 검색</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="map"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="기본주소"
              placeholderTextColor="#666"
              value={worker.addr_street}
              onChangeText={(text) => handleChange('addr_street', text)}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="home"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="상세주소"
              placeholderTextColor="#666"
              value={worker.addr_extra}
              onChangeText={(text) => handleChange('addr_extra', text)}
            />
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.inputGroup}>
          <Text style={styles.sectionTitle}>메모</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="document-text"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="추가 정보"
              placeholderTextColor="#666"
              value={worker.note}
              onChangeText={(text) => handleChange('note', text)}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>
      </ScrollView>

      {/* 하단 버튼들 */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>취소</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>저장</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>삭제</Text>
        </TouchableOpacity>
      </View>

      {/* 주소 검색 모달 */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Postcode
            style={styles.postcode}
            jsOptions={{ animation: false }}
            onSelected={handleAddressSelect}
            onError={(error) => {
              console.error(error);
              setModalVisible(false);
            }}
          />
        </View>
      </Modal>

      {/* 대학교 주소 검색 모달 */}
      <Modal
        isVisible={isUniversityModalVisible}
        onBackdropPress={() => setUniversityModalVisible(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <Postcode
            style={styles.postcode}
            jsOptions={{ animation: false }}
            onSelected={handleUniversityAddressSelect}
            onError={(error) => {
              console.error(error);
              setUniversityModalVisible(false);
            }}
          />
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
  imageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    fontSize: 12,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 15,
  },
  addressButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  addressButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#666',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '90%',
    height: '80%',
    overflow: 'hidden',
  },
  postcode: {
    flex: 1,
  },
  genderSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 50,
    flex: 1,
  },
  genderSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  genderPlaceholderText: {
    color: '#666',
  },
  genderSelectedText: {
    color: '#fff',
  },
});
