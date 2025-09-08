import { migrateDbIfNeeded } from '@/db/db';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="hirebook.db" onInit={migrateDbIfNeeded}>
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
          name="(tabs)"
          options={{
            headerShown: false,
            // 탭 네비게이션에서 제스처 비활성화
            gestureEnabled: false,
          }}
        />
      </Stack>
    </SQLiteProvider>
  );
}
