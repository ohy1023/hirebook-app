import { Stack } from 'expo-router';

export default function MoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 뒤로가기 동작 개선
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        // 스택 네비게이션 최적화
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          // 메인 화면에서는 제스처 비활성화
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="statistics"
        options={{
          gestureEnabled: true,
        }}
      />
      <Stack.Screen
        name="trash"
        options={{
          gestureEnabled: true,
        }}
      />
    </Stack>
  );
}
