import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function MoreScreen() {
  const router = useRouter();
  const db = useSQLiteContext();
  const [isBackingUp, setIsBackingUp] = useState(false);

  const handleTrash = () => {
    router.push('/more/trash');
  };

  const handleBackup = async () => {
    if (isBackingUp) return;

    setIsBackingUp(true);
    try {
      // 고용주 데이터 백업
      const employers = await db.getAllAsync(
        'SELECT * FROM employers WHERE deleted = 0'
      );

      // 근로자 데이터 백업
      const workers = await db.getAllAsync(
        'SELECT * FROM workers WHERE deleted = 0'
      );

      // 가계부 거래 내역 백업
      const transactions = await db.getAllAsync(
        'SELECT * FROM transactions WHERE deleted = 0'
      );

      const backupData = {
        timestamp: new Date().toISOString(),
        employers,
        workers,
        transactions,
      };

      const backupJson = JSON.stringify(backupData, null, 2);
      const fileName = `hirebook_backup_${
        new Date().toISOString().split('T')[0]
      }.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, backupJson);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: '고용장부 백업 파일 공유',
        });
      } else {
        Alert.alert('백업 완료', `백업 파일이 생성되었습니다: ${fileName}`);
      }
    } catch (error) {
      console.error('백업 오류:', error);
      Alert.alert('오류', '백업 중 오류가 발생했습니다.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestore = () => {
    Alert.alert('복원', '백업 파일에서 데이터를 복원하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '복원',
        onPress: () => {
          // TODO: 파일 선택 및 복원 로직 구현
          Alert.alert('안내', '복원 기능은 준비 중입니다.');
        },
      },
    ]);
  };

  const handleAbout = () => {
    Alert.alert('정보', 'Hirebook 앱 v1.0.0\n\n개발자: 오형상');
  };

  const handleStatistics = () => {
    router.push('/more/statistics');
  };

  const menuItems = [
    {
      icon: 'bar-chart',
      title: '통계',
      subtitle: '수입/지출 통계 및 분석',
      onPress: handleStatistics,
      color: '#AF52DE',
    },
    {
      icon: 'cloud-upload',
      title: '백업',
      subtitle: '데이터 백업 및 공유',
      onPress: handleBackup,
      color: '#34C759',
      loading: isBackingUp,
    },
    {
      icon: 'cloud-download',
      title: '복원',
      subtitle: '백업 파일에서 데이터 복원',
      onPress: handleRestore,
      color: '#007AFF',
    },
    {
      icon: 'trash',
      title: '휴지통',
      subtitle: '삭제된 데이터 관리',
      onPress: handleTrash,
      color: '#FF3B30',
    },
    {
      icon: 'information-circle',
      title: '정보',
      subtitle: '앱 정보 및 버전',
      onPress: handleAbout,
      color: '#AF52DE',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>더보기</Text>
        <Text style={styles.headerSubtitle}>앱 설정 및 관리</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
            disabled={item.loading}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}
            >
              <Ionicons name={item.icon as any} size={24} color={item.color} />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <View style={styles.menuArrow}>
              {item.loading ? (
                <Ionicons name="hourglass" size={20} color="#666" />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="#666" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  menuIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  menuSubtitle: {
    color: '#999',
    fontSize: 14,
  },
  menuArrow: {
    marginLeft: 10,
  },
});
