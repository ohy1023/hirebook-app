import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import {useRouter} from 'expo-router';
import {useEffect, useState} from 'react';
import {useSQLiteContext} from 'expo-sqlite';

type Employer = {
    id: number;
    name: string;
    tel: string;
};

export default function EmployersScreen() {
    const db = useSQLiteContext();
    const router = useRouter();
    const [employers, setEmployers] = useState<Employer[]>([]);

    useEffect(() => {
        async function fetchEmployers() {
            const rows = await db.getAllAsync<Employer>('SELECT * FROM employers AS emp Order by emp.name');
            setEmployers(rows);
        }

        fetchEmployers();
    }, []);

    const renderItem = ({item}: { item: Employer }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/screens/employers/${item.id}`)}
        >
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.tel}>{item.tel}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <FlatList
                data={employers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
            />
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/screens/employers/add')}
            >
                <Text style={styles.addButtonText}>+ Add Employer</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#25292e', padding: 16},
    item: {
        padding: 16,
        backgroundColor: '#33373d',
        borderRadius: 8,
        marginBottom: 12,
    },
    name: {color: '#fff', fontSize: 16, fontWeight: '500'},
    tel: {color: '#aaa', fontSize: 14},
    addButton: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        backgroundColor: '#0a84ff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 24,
    },
    addButtonText: {color: '#fff', fontWeight: '600'},
});
