import { employerQueries } from '@/db/queries';
import { Employer } from '@/types';
import { formatPhoneNumber } from '@/utils/common';
import Postcode from '@actbase/react-daum-postcode';
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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

export default function EditEmployerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [employer, setEmployer] = useState<Omit<Employer, 'id'>>({
    name: '',
    tel: '',
    note: '',
    type: '',
    addr_postcode: '',
    addr_street: '',
    addr_extra: '',
  });

  useEffect(() => {
    if (id) {
      // 기존 데이터 가져오기
      employerQueries.getById(db, Number(id)).then((row) => {
        if (row) {
          setEmployer({
            name: row.name || '',
            tel: row.tel || '',
            note: row.note || '',
            type: row.type || '',
            addr_postcode: row.addr_postcode || '',
            addr_street: row.addr_street || '',
            addr_extra: row.addr_extra || '',
          });
        }
      });
    }
  }, [id, db]);

  const handleAddressSelect = (data: any) => {
    handleChange('addr_postcode', data.zonecode);
    handleChange('addr_street', data.address);
    handleChange('addr_extra', data.buildingName || '');
    setModalVisible(false);
  };

  const [isModalVisible, setModalVisible] = useState(false);

  const handleChange = (key: keyof Employer, value: string) => {
    setEmployer((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!employer.name || !employer.tel) {
      Alert.alert('오류', '이름과 전화번호는 필수입니다.');
      return;
    }

    try {
      if (id) {
        // 업데이트
        await employerQueries.update(db, Number(id), {
          name: employer.name,
          tel: employer.tel,
          note: employer.note ?? '',
          type: employer.type ?? '',
          addr_postcode: employer.addr_postcode ?? '',
          addr_street: employer.addr_street ?? '',
          addr_extra: employer.addr_extra ?? '',
        });
      } else {
        // 새로 추가
        await employerQueries.insert(db, {
          name: employer.name,
          tel: employer.tel,
          note: employer.note ?? '',
          type: employer.type ?? '',
          addr_postcode: employer.addr_postcode ?? '',
          addr_street: employer.addr_street ?? '',
          addr_extra: employer.addr_extra ?? '',
        });
      }
      router.back();
    } catch (_error) {
      console.error(_error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 이름 입력 */}
        <View style={styles.inputGroup}>
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
              value={employer.name}
              onChangeText={(text) => handleChange('name', text)}
            />
          </View>
        </View>

        {/* 전화번호 입력 */}
        <View style={styles.inputGroup}>
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
              value={formatPhoneNumber(employer.tel)}
              onChangeText={(text) => {
                const raw = text.replace(/[^0-9]/g, '');
                handleChange('tel', raw);
              }}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* 종류 입력 */}
        <View style={styles.inputGroup}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="briefcase"
              size={20}
              color="#999"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="종류 (식당, 가정집)"
              placeholderTextColor="#666"
              value={employer.type}
              onChangeText={(text) => handleChange('type', text)}
            />
          </View>
        </View>

        {/* 메모 입력 */}
        <View style={styles.inputGroup}>
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
              value={employer.note}
              onChangeText={(text) => handleChange('note', text)}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* 주소 입력 */}
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
              value={employer.addr_postcode}
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
              value={employer.addr_street}
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
              value={employer.addr_extra}
              onChangeText={(text) => handleChange('addr_extra', text)}
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
  inputGroup: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
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
});
