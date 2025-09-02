import {View, Text, StyleSheet} from 'react-native';
import {useLocalSearchParams} from 'expo-router';
import {useEffect, useState} from 'react';
import {useSQLiteContext} from 'expo-sqlite';

type Employer = {
    id: number;
    name: string;
    tel: string;
    note: string;
    addr_postcode: string;
    addr_si: string;
    addr_gu: string;
    addr_dong: string;
    addr_street: string;
    addr_extra: string;
};

export default function EmployerDetailScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const db = useSQLiteContext();
    const [employer, setEmployer] = useState<Employer | null>(null);

    useEffect(() => {
        async function fetchEmployer() {
            const row = await db.getFirstAsync<Employer>(
                'SELECT * FROM employers WHERE id = ?',
                Number(id)
            );
            setEmployer(row);
        }

        fetchEmployer();
    }, [id]);

    if (!employer) {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Name: {employer.name}</Text>
            <Text style={styles.text}>Tel: {employer.tel}</Text>
            <Text style={styles.text}>Note: {employer.note}</Text>
            <Text
                style={styles.text}>Address: {`${employer.addr_si} ${employer.addr_gu} ${employer.addr_dong} ${employer.addr_street}`}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {flex: 1, backgroundColor: '#25292e', padding: 16},
    text: {color: '#fff', fontSize: 16, marginBottom: 8},
});
