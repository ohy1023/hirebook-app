import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { Tabs } from 'expo-router';
import { useCallback, useRef } from 'react';

const today = format(new Date(), 'M.d.');

export default function TabLayout() {
  const lastTabPressTime = useRef<number>(0);
  const lastTabName = useRef<string>('');

  // 탭 더블 탭 핸들러
  const handleTabPress = useCallback((tabName: string) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastTabPressTime.current;

    // 같은 탭을 500ms 이내에 두 번 누른 경우
    if (lastTabName.current === tabName && timeDiff < 500) {
      if (tabName === 'employers') {
        // 고용주 탭 더블 탭 시 스크롤을 맨 위로 이동
        const scrollFunction = (global as any).scrollEmployersToTop;
        if (scrollFunction) {
          scrollFunction();
        }
      } else if (tabName === 'workers') {
        // 근로자 탭 더블 탭 시 스크롤을 맨 위로 이동
        const scrollFunction = (global as any).scrollWorkersToTop;
        if (scrollFunction) {
          scrollFunction();
        }
      }
    }

    lastTabPressTime.current = currentTime;
    lastTabName.current = tabName;
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF3B30',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#000',
          borderTopWidth: 1,
          borderTopColor: '#333',
          paddingBottom: 5,
          paddingTop: 0,
          height: 80, // 탭바 높이 증가
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        // 탭 이동 시 성능 최적화
        lazy: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: '고용 장부',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar-sharp' : 'calendar-outline'}
              color={color}
              size={24}
            />
          ),
          tabBarLabel: today,
        }}
      />
      <Tabs.Screen
        name="employers"
        options={{
          title: '고용주 관리', // 헤더에 표시되는 이름
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'people-sharp' : 'people-outline'}
              color={color}
              size={24}
            />
          ),
          tabBarLabel: '고용주', // 바텀 탭에 표시되는 이름
        }}
        listeners={{
          tabPress: () => handleTabPress('employers'),
        }}
      />
      <Tabs.Screen
        name="workers"
        options={{
          title: '근로자 관리', // 헤더에 표시되는 이름
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person-sharp' : 'person-outline'}
              color={color}
              size={24}
            />
          ),
          tabBarLabel: '근로자', // 바텀 탭에 표시되는 이름
        }}
        listeners={{
          tabPress: () => handleTabPress('workers'),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: '더보기',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={
                focused ? 'ellipsis-horizontal' : 'ellipsis-horizontal-outline'
              }
              color={color}
              size={24}
            />
          ),
          tabBarLabel: '더보기',
        }}
      />
    </Tabs>
  );
}
