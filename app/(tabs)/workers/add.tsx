import { formatPhoneNumber } from '@/utils/format';
import Postcode from '@actbase/react-daum-postcode';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

// 타입 정의
type Worker = {
  name: string;
  tel: string;
  note?: string;
  type?: string;
  birth_year?: number;
  gender?: string;
  university?: string;
  uni_postcode?: string;
  uni_street?: string;
  addr_postcode?: string;
  addr_street?: string;
  addr_extra?: string;
  nationality?: string;
  face?: string;
};

export default function AddWorkerScreen() {
  const navigation = useNavigation();
  const db = useSQLiteContext();
  const router = useRouter();

  const [worker, setWorker] = useState<Worker>({
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
      const now = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO workers
                 (name, tel, note, type, birth_year, gender, university, uni_postcode, uni_street, addr_postcode, addr_street, addr_extra, nationality, face, deleted, created_date, updated_date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          worker.name,
          worker.tel,
          worker.note || '',
          worker.type || '',
          worker.birth_year || null,
          worker.gender || '',
          worker.university || '',
          worker.uni_postcode || '',
          worker.uni_street || '',
          worker.addr_postcode || '',
          worker.addr_street || '',
          worker.addr_extra || '',
          worker.nationality || '',
          selectedImage || '',
          0,
          now,
          now,
        ]
      );
      Alert.alert('성공', '근로자가 추가되었습니다.');
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '근로자 추가에 실패했습니다.');
    }
  };

  // Daum Postcode 선택
  const handleAddressSelect = (data: any) => {
    handleChange('addr_postcode', data.zonecode);
    handleChange('addr_street', data.address);
    handleChange('addr_extra', data.buildingName || '');
    setModalVisible(false);
  };

  // 대학 주소 선택
  const handleUniversityAddressSelect = (data: any) => {
    handleChange('uni_postcode', data.zonecode);
    handleChange('uni_street', data.address);
    handleChange('university', data.buildingName || '');
    setUniversityModalVisible(false);
  };

  useEffect(() => {
    navigation.setOptions({ headerTitle: '근로자 추가' });
  }, [navigation]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <Text style={styles.label}>
        이름 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={worker.name}
        onChangeText={(t) => handleChange('name', t)}
        placeholder="예: Cristiano Ronaldo"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>사진</Text>
      <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
        {selectedImage ? (
          <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷 사진 선택</Text>
          </View>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>직종</Text>
      <TextInput
        style={styles.input}
        value={worker.type}
        onChangeText={(t) => handleChange('type', t)}
        placeholder="예: 서빙, 가정부 등"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>출생연도</Text>
      <TextInput
        style={styles.input}
        value={worker.birth_year?.toString() || ''}
        onChangeText={(t) => {
          const birth_year = t ? parseInt(t) : undefined;
          setWorker((prev) => ({ ...prev, birth_year }));
        }}
        keyboardType="numeric"
        placeholder="예: 1983"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>성별</Text>
      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={[
            styles.genderOption,
            worker.gender === '남성' && styles.genderOptionSelected,
          ]}
          onPress={() => handleChange('gender', '남성')}
        >
          <Text
            style={[
              styles.genderOptionText,
              worker.gender === '남성' && styles.genderOptionTextSelected,
            ]}
          >
            남성
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.genderOption,
            worker.gender === '여성' && styles.genderOptionSelected,
          ]}
          onPress={() => handleChange('gender', '여성')}
        >
          <Text
            style={[
              styles.genderOptionText,
              worker.gender === '여성' && styles.genderOptionTextSelected,
            ]}
          >
            여성
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>국적</Text>
      <TextInput
        style={styles.input}
        value={worker.nationality}
        onChangeText={(t) => handleChange('nationality', t)}
        placeholder="예: 한국, 중국, 베트남"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>
        전화번호 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={formatPhoneNumber(worker.tel)}
        onChangeText={onChangeTel}
        keyboardType="phone-pad"
        placeholder="-(하이픈) 없이 입력하세요."
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>추가 정보</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={worker.note}
        onChangeText={(t) => handleChange('note', t)}
        multiline
        scrollEnabled={true}
        textAlignVertical="top"
      />

      <Text style={styles.label}>대학 정보</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[styles.inputSmall, { flex: 1 }]}
          value={worker.uni_postcode}
          placeholder="우편번호"
          editable={false}
        />
        <TextInput
          style={[styles.inputSmall, { flex: 3 }]}
          value={worker.uni_street}
          placeholder="대학 주소"
          editable={false}
        />
        <TouchableOpacity
          style={styles.addressButton}
          onPress={() => setUniversityModalVisible(true)}
        >
          <Text style={styles.addressButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.inputSmall}
        value={worker.university}
        onChangeText={(t) => handleChange('university', t)}
        placeholder="예: 공주대학교"
        placeholderTextColor="#888"
      />

      <Text style={styles.label}>거주지 정보</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[styles.inputSmall, { flex: 1 }]}
          value={worker.addr_postcode}
          placeholder="우편번호"
          editable={false}
        />
        <TextInput
          style={[styles.inputSmall, { flex: 3 }]}
          value={worker.addr_street}
          placeholder="도로명 주소"
          editable={false}
        />
        <TouchableOpacity
          style={styles.addressButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addressButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.inputSmall}
        value={worker.addr_extra}
        onChangeText={(t) => handleChange('addr_extra', t)}
      />

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>저장</Text>
      </TouchableOpacity>

      <Modal
        isVisible={isModalVisible}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalContainer}
        onBackdropPress={() => setModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Postcode
            style={{ flex: 1 }}
            jsOptions={{ animation: true, hideMapBtn: true }}
            onSelected={handleAddressSelect}
            onError={() => {
              Alert.alert('오류', '주소 검색에 실패했습니다.');
            }}
          />
        </View>
      </Modal>

      <Modal
        isVisible={isUniversityModalVisible}
        backdropOpacity={0.5}
        animationIn="slideInUp"
        animationOut="slideOutDown"
        style={styles.modalContainer}
        onBackdropPress={() => setUniversityModalVisible(false)}
      >
        <View style={styles.modalContent}>
          <Postcode
            style={{ flex: 1 }}
            jsOptions={{ animation: true, hideMapBtn: true }}
            onSelected={handleUniversityAddressSelect}
            onError={() => {
              Alert.alert('오류', '대학 주소 검색에 실패했습니다.');
            }}
          />
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  label: { color: '#000', marginBottom: 4, marginTop: 12, fontSize: 18 },
  input: {
    backgroundColor: '#f0f0f0',
    color: '#000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  inputSmall: {
    backgroundColor: '#f0f0f0',
    color: '#000',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  addressButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
  },
  addressButtonText: { color: '#fff', fontWeight: '600' },
  noteInput: {
    height: 110,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  required: {
    color: 'red',
    fontWeight: '700',
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    height: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  selectedImage: {
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  genderOptionTextSelected: {
    color: '#fff',
  },
});
