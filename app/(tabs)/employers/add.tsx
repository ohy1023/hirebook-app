import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { useState, useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import axios from 'axios';

// 타입 정의
type Employer = {
    name: string;
    tel: string;
    note?: string;
    addr_si?: string;
    addr_gu?: string;
    addr_dong?: string;
    addr_street?: string;
    addr_extra?: string;
};

const formatPhoneNumber = (input: string) => {
    // 숫자만 남기기
    const numbers = input.replace(/[^0-9]/g, '');

    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
};

export default function AddEmployerScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        navigation.setOptions({ headerTitle: '고용주 추가' });
    }, [navigation]);
    const db = useSQLiteContext();
    const router = useRouter();

    const [employer, setEmployer] = useState<Employer>({
        name: '',
        tel: '',
        note: '',
        addr_si: '',
        addr_gu: '',
        addr_dong: '',
        addr_street: '',
        addr_extra: '',
    });

    const handleChange = (key: keyof Employer, value: string) => {
        setEmployer(prev => ({ ...prev, [key]: value }));
    };

    // Kakao 주소 API 사용
    const handleAddressSearch = async () => {
        if (!employer.addr_si) return;
        try {
            const query = `${employer.addr_si} ${employer.addr_gu} ${employer.addr_dong}`;
            const res = await axios.get('https://dapi.kakao.com/v2/local/search/address.json', {
                params: { query },
                headers: { Authorization: `KakaoAK ${process.env.KAKAO_API_KEY}` },
            });
            const first = res.data.documents[0]?.address;
            if (first) {
                handleChange('addr_si', first.region_1depth_name);
                handleChange('addr_gu', first.region_2depth_name);
                handleChange('addr_dong', first.region_3depth_name);
                handleChange('addr_street', first.road_name);
                handleChange('addr_extra', first.building_name || '');
            }
        } catch (err) {
            console.error(err);
            Alert.alert('오류', '주소를 가져오는데 실패했습니다.');
        }
    };

    const handleSave = async () => {
        if (!employer.name || !employer.tel) {
            Alert.alert('오류', '이름과 전화번호는 필수입니다.');
            return;
        }
        try {
            await db.runAsync(
                `INSERT INTO employers
                     (name, tel, note, addr_si, addr_gu, addr_dong, addr_street, addr_extra)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    employer.name,
                    employer.tel,
                    employer.note,
                    employer.addr_si,
                    employer.addr_gu,
                    employer.addr_dong,
                    employer.addr_street,
                    employer.addr_extra,
                ]
            );
            Alert.alert('성공', '고용주가 추가되었습니다.');
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert('오류', '고용주 추가에 실패했습니다.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={styles.label}>이름</Text>
            <TextInput style={styles.input} value={employer.name} onChangeText={t => handleChange('name', t)} />

            <Text style={styles.label}>전화번호</Text>
            <TextInput
                style={styles.input}
                value={employer.tel}
                onChangeText={t => handleChange('tel', formatPhoneNumber(t))}
                keyboardType="phone-pad"
            />

            <Text style={styles.label}>비고</Text>
            <TextInput
                style={[styles.input, styles.noteInput]}
                value={employer.note}
                onChangeText={t => handleChange('note', t)}
                multiline
                textAlignVertical="top"
            />

            <Text style={styles.label}>주소 - 시/구/동</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                <TextInput style={styles.inputSmall} placeholder="시" value={employer.addr_si} onChangeText={t => handleChange('addr_si', t)} />
                <TextInput style={styles.inputSmall} placeholder="구" value={employer.addr_gu} onChangeText={t => handleChange('addr_gu', t)} />
                <TextInput style={styles.inputSmall} placeholder="동" value={employer.addr_dong} onChangeText={t => handleChange('addr_dong', t)} />
                <TouchableOpacity style={styles.addressButton} onPress={handleAddressSearch}>
                    <Text style={styles.addressButtonText}>검색</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>도로명</Text>
            <TextInput style={styles.input} value={employer.addr_street} onChangeText={t => handleChange('addr_street', t)} />

            <Text style={styles.label}>상세주소</Text>
            <TextInput style={styles.input} value={employer.addr_extra} onChangeText={t => handleChange('addr_extra', t)} />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>저장</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', padding: 16 },
    label: { color: '#000', marginBottom: 4, marginTop: 12 },
    input: { backgroundColor: '#f0f0f0', color: '#000', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
    inputSmall: { backgroundColor: '#f0f0f0', color: '#000', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, flex: 1 },
    saveButton: { marginTop: 24, backgroundColor: '#007AFF', paddingVertical: 14, borderRadius: 24, alignItems: 'center' },
    saveButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
    addressButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, borderRadius: 12, justifyContent: 'center' },
    addressButtonText: { color: '#fff', fontWeight: '600' },
    noteInput: {
        height: 100,
    },
});
