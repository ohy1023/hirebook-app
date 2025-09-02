import {Tabs} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {format} from 'date-fns';

const today = format(new Date(), 'M.d.');

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#007AFF', // 활성 아이콘 색상 (파랑)
                tabBarStyle: {backgroundColor: '#fff'}, // 탭 바 배경 흰색
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '고용 장부', // 오늘 날짜로 탭 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'calendar-sharp' : 'calendar-outline'} color={color} size={24}/>
                    ),
                    tabBarLabel: today, // 바텀 탭에 표시되는 이름
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    title: '통계', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'bar-chart-sharp' : 'bar-chart-outline'} color={color} size={24}/>
                    ),
                    tabBarLabel: '통계', // 바텀 탭에 표시되는 이름
                }}
            />
            <Tabs.Screen
                name="employers"
                options={{
                    title: '고용주 관리', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'people-sharp' : 'people-outline'} color={color} size={24}/>
                    ),
                    tabBarLabel: '고용주', // 바텀 탭에 표시되는 이름
                }}
            />
            <Tabs.Screen
                name="workers"
                options={{
                    title: '근로자 관리', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'person-sharp' : 'person-outline'} color={color} size={24}/>
                    ),
                    tabBarLabel: '근로자', // 바텀 탭에 표시되는 이름
                }}
            />
        </Tabs>
    );
}
