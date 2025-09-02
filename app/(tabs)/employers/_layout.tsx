import { Stack } from 'expo-router';

export default function EmployersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: '고용주 목록' }} />
      <Stack.Screen name="edit" options={{ headerTitle: '고용주 추가/수정' }} />
      <Stack.Screen name="[id]" options={{ headerTitle: '고용주 상세' }} />
    </Stack>
  );
}
