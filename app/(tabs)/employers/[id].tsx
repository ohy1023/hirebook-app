import { ALERT_MESSAGES, ICON_NAMES, MENU_ITEMS } from '@/constants';
import { employerQueries } from '@/db/queries';
import { colors, commonStyles } from '@/styles/common';
import { Employer } from '@/types';
import { formatPhoneNumber, getEmployerAddressString } from '@/utils/common';
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

export default function EmployerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  useEffect(() => {
    async function fetchEmployer() {
      const row = await employerQueries.getById(db, Number(id));
      setEmployer(row);
    }
    fetchEmployer();
  }, [id, db]);

  const handleDelete = () => {
    Alert.alert('삭제 확인', ALERT_MESSAGES.DELETE_CONFIRM, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await employerQueries.delete(db, Number(id));
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

  const handleEdit = () => {
    router.push(`/employers/edit?id=${id}`);
  };

  const handleCall = () => {
    if (employer?.tel) {
      Linking.openURL(`tel:${employer.tel}`);
    }
  };

  const handleCopyAddress = async () => {
    const text = getEmployerAddressString(employer);
    if (!text) {
      Alert.alert('안내', '복사할 주소가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  const handleCopyPhone = async () => {
    const text = employer?.tel ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 전화번호가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  const handleCopyMemo = async () => {
    const text = employer?.note ?? '';
    if (!text) {
      Alert.alert('안내', '복사할 메모가 없습니다.');
      return;
    }
    await Clipboard.setStringAsync(text);
    Alert.alert('복사 완료', ALERT_MESSAGES.COPY_SUCCESS);
  };

  const handleShare = async () => {
    if (!employer) return;

    try {
      const shareText = `고용주 정보

이름: ${employer.name}
전화번호: ${employer.tel ? formatPhoneNumber(employer.tel) : '미입력'}
주소: ${getEmployerAddressString(employer)}
메모: ${employer.note || '미입력'}

생성일: ${new Date().toLocaleDateString('ko-KR')}`;

      await Clipboard.setStringAsync(shareText);
      Alert.alert('복사 완료', '고용주 정보가 클립보드에 복사되었습니다.');
    } catch (_error) {
      console.error('공유 실패:', _error);
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  const handleRecord = () => {
    if (!employer) return;
    router.push(`/employers/${employer.id}/records`);
  };

  if (!employer) {
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
            <Text style={commonStyles.headerTitle}>고용주 정보</Text>
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
          <Text style={commonStyles.sectionTitle}>기본 정보</Text>
          <View style={commonStyles.infoRow}>
            <View style={commonStyles.infoIcon}>
              <Ionicons
                name={ICON_NAMES.person}
                size={20}
                color={colors.success}
              />
            </View>
            <View style={commonStyles.infoContent}>
              <Text style={commonStyles.infoLabel}>이름</Text>
              <Text style={commonStyles.infoValue}>{employer.name}</Text>
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
                {employer.tel ? formatPhoneNumber(employer.tel) : '미입력'}
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

        {/* 주소 정보 */}
        {employer.addr_street && (
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
                  {getEmployerAddressString(employer)}
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
        {employer.note && (
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
                <Text style={commonStyles.infoValue}>{employer.note}</Text>
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
            <Text style={commonStyles.menuItemText}>{MENU_ITEMS.RECORD}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={commonStyles.menuItem}
            onPress={() => {
              setIsMenuVisible(false);
              handleShare();
            }}
          >
            <Ionicons
              name={ICON_NAMES.share}
              size={20}
              color={colors.warning}
            />
            <Text style={commonStyles.menuItemText}>{MENU_ITEMS.SHARE}</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
});
