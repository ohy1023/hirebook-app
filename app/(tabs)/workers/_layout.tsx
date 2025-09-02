import { Stack } from 'expo-router';

export default function EmployersLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerTitle: '근로자 목록' }} />
      <Stack.Screen name="add" options={{ headerTitle: '근로자 추가' }} />
      <Stack.Screen name="edit" options={{ headerTitle: '근로자 수정' }} />
      <Stack.Screen name="[id]" options={{ headerTitle: '근로자 상세' }} />
    </Stack>
  );
}
