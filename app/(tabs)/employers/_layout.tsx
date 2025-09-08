import { Stack } from 'expo-router';

export default function EmployersLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="transaction-detail" />
    </Stack>
  );
}
