import {Tabs} from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import {format} from 'date-fns';

const today = format(new Date(), 'M.d.');

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: '#007AFF', // 활성 아이콘 색상 (파랑)
                headerStyle: {backgroundColor: '#fff'}, // 헤더 배경 흰색
                headerShadowVisible: true, // 그림자 보이기
                headerTintColor: '#000', // 헤더 글씨 검정
                tabBarStyle: {backgroundColor: '#fff'}, // 탭 바 배경 흰색
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    tabBarLabel: today, // 바텀 탭에 표시되는 이름
                    title: '고용 장부', // 오늘 날짜로 탭 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'calendar-sharp' : 'calendar-outline'} color={color} size={24}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="statistics"
                options={{
                    tabBarLabel: '통계', // 바텀 탭에 표시되는 이름
                    title: '통계', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'bar-chart-sharp' : 'bar-chart-outline'} color={color} size={24}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="employers"
                options={{
                    tabBarLabel: '고용주', // 바텀 탭에 표시되는 이름
                    title: '고용주 관리', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'people-sharp' : 'people-outline'} color={color} size={24}/>
                    ),
                }}
            />
            <Tabs.Screen
                name="workers"
                options={{
                    tabBarLabel: '작업자', // 바텀 탭에 표시되는 이름
                    title: '작업자 관리', // 헤더에 표시되는 이름
                    tabBarIcon: ({color, focused}) => (
                        <Ionicons name={focused ? 'person-sharp' : 'person-outline'} color={color} size={24}/>
                    ),
                }}
            />
        </Tabs>
    );
}
