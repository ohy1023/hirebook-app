import Ionicons from '@expo/vector-icons/Ionicons';
import { format } from 'date-fns';
import { Tabs } from 'expo-router';

const today = format(new Date(), 'M.d.');

export default function TabLayout() {
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
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
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
