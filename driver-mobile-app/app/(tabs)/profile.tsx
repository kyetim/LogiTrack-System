import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { logout } from '../../store/slices/authSlice';
import { COLORS } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { user, driver } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        Alert.alert(
            'Çıkış Yap',
            'Çıkış yapmak istediğinize emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Çıkış Yap',
                    style: 'destructive',
                    onPress: async () => {
                        await dispatch(logout());
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <MaterialCommunityIcons name="account" size={48} color={COLORS.primary} />
                </View>
                <Text style={styles.email}>{user?.email}</Text>
                <Text style={styles.role}>{user?.role}</Text>
            </View>

            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="card-account-details" size={24} color={COLORS.textLight} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Ehliyet No</Text>
                        <Text style={styles.infoValue}>{driver?.licenseNumber || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="phone" size={24} color={COLORS.textLight} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Telefon</Text>
                        <Text style={styles.infoValue}>{driver?.phoneNumber || 'N/A'}</Text>
                    </View>
                </View>

                <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="car" size={24} color={COLORS.textLight} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoLabel}>Araç</Text>
                        <Text style={styles.infoValue}>{driver?.vehicle?.plateNumber || 'Atanmamış'}</Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <MaterialCommunityIcons name="logout" size={24} color="white" />
                <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        backgroundColor: 'white',
        padding: 32,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: COLORS.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    email: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    role: {
        fontSize: 14,
        color: COLORS.textLight,
        textTransform: 'uppercase',
    },
    infoCard: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    infoText: {
        marginLeft: 16,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        backgroundColor: COLORS.danger,
        margin: 16,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoutText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
