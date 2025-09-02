import { formatPhoneNumber } from '@/utils/format';
import Postcode from '@actbase/react-daum-postcode';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Modal from 'react-native-modal';

type Employer = {
  name: string;
  tel: string;
  note?: string;
  type?: string;
  addr_postcode?: string;
  addr_street?: string;
  addr_extra?: string;
};

export default function EditEmployerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [employer, setEmployer] = useState<Employer>({
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
      db.getFirstAsync<Employer>(
        'SELECT * FROM employers WHERE id = ?',
        Number(id)
      ).then((row) => {
        if (row) {
          setEmployer({
            name: row.name,
            tel: row.tel,
            note: row.note,
            type: row.type,
            addr_postcode: row.addr_postcode,
            addr_street: row.addr_street,
            addr_extra: row.addr_extra,
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
        await db.runAsync(
          `UPDATE employers SET
                        name = ?, tel = ?, note = ?, type = ?, addr_postcode = ?, addr_street = ?, addr_extra = ?, updated_date = CURRENT_TIMESTAMP
                     WHERE id = ?`,
          [
            employer.name,
            employer.tel,
            employer.note ?? null,
            employer.type ?? null,
            employer.addr_postcode ?? null,
            employer.addr_street ?? null,
            employer.addr_extra ?? null,
            Number(id),
          ]
        );
        Alert.alert('성공', '고용주 정보가 수정되었습니다.');
      } else {
        // 새로 추가 (optional)
        await db.runAsync(
          `INSERT INTO employers
                        (name, tel, note, type, addr_postcode, addr_street, addr_extra, deleted)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            employer.name,
            employer.tel,
            employer.note ?? null,
            employer.type ?? null,
            employer.addr_postcode ?? null,
            employer.addr_street ?? null,
            employer.addr_extra ?? null,
            0,
          ]
        );
        Alert.alert('성공', '고용주가 추가되었습니다.');
      }
      router.back();
    } catch (err) {
      console.error(err);
      Alert.alert('오류', '저장에 실패했습니다.');
    }
  };

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
        value={employer.name}
        onChangeText={(t) => handleChange('name', t)}
      />

      <Text style={styles.label}>
        전화번호 <Text style={styles.required}>*</Text>
      </Text>
      <TextInput
        style={styles.input}
        value={employer.tel}
        onChangeText={(t) => handleChange('tel', formatPhoneNumber(t))}
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>종류</Text>
      <TextInput
        style={styles.input}
        value={employer.type}
        onChangeText={(t) => handleChange('type', t)}
      />

      <Text style={styles.label}>추가 정보</Text>
      <TextInput
        style={[styles.input, styles.noteInput]}
        value={employer.note}
        onChangeText={(t) => handleChange('note', t)}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>주소</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <TextInput
          style={[styles.inputSmall, { flex: 1 }]}
          value={employer.addr_postcode}
          placeholder="우편번호"
          editable={false}
        />
        <TextInput
          style={[styles.inputSmall, { flex: 3 }]}
          value={employer.addr_street}
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

      <Text style={styles.label}>상세주소</Text>
      <TextInput
        style={styles.inputSmall}
        value={employer.addr_extra}
        onChangeText={(t) => handleChange('addr_extra', t)}
      />

      <Modal
        isVisible={isModalVisible}
        backdropOpacity={0.5} // 배경 어둡게
        animationIn="slideInUp" // 등장 애니메이션
        animationOut="slideOutDown" // 사라질 때 애니메이션
        style={styles.modalContainer} // 모달 위치 스타일
        onBackdropPress={() => setModalVisible(false)} // 배경 터치 시 닫기
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

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>{id ? '수정' : '저장'}</Text>
      </TouchableOpacity>
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
    flex: 1,
  },
  noteInput: { height: 110, fontSize: 16 },
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
  required: { color: 'red', fontWeight: '700' },
  modalContainer: {
    margin: 0, // 전체 화면 사용
    justifyContent: 'center', // 화면 중앙 정렬
    alignItems: 'center',
  },
  modalContent: {
    width: '90%', // 화면 너비 90%
    height: '70%', // 화면 높이 70%
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden', // Postcode 안쪽 둥글게 처리
  },
});
