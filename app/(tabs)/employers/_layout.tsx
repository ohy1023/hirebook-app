import { Stack } from "expo-router";

export default function EmployersLayout() {
    return (
        <Stack>
            <Stack.Screen name="index" options={{ headerTitle: "고용주 목록" }} />
            <Stack.Screen name="add" options={{ headerTitle: "고용주 추가" }} />
            <Stack.Screen name="[id]" options={{ headerTitle: "고용주 상세" }} />
        </Stack>
    );
}
