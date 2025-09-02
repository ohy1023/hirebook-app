import { SQLiteProvider } from 'expo-sqlite';
import { Stack } from 'expo-router';
import { migrateDbIfNeeded } from '@/db/db';

export default function RootLayout() {

    return (
        <SQLiteProvider databaseName="hirebook.db" onInit={migrateDbIfNeeded}>
            <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>
        </SQLiteProvider>
    );
}
