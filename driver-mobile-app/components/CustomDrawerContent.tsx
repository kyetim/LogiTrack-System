import React from 'react';
import { View, Text, StyleSheet, Image, Switch, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState, useAppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { useRouter } from 'expo-router';
import { COLORS } from '../utils/constants';

// Transit Style Palette
const DRAWER_COLORS = {
    headerGradient: ['#007AFF', '#0055B3'] as const, // Bold Blue
    activeBackground: '#10B981', // Go Green (Active Item)
    inactiveText: '#333333',
    activeText: '#FFFFFF',
    statusOn: '#10B981',
    statusOff: '#EF4444',
};

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
    const { user, driver } = useSelector((state: RootState) => state.auth);
    const [isOnDuty, setIsOnDuty] = React.useState(driver?.status === 'ON_DUTY');
    const dispatch = useAppDispatch();
    const router = useRouter();

    const toggleStatus = () => {
        setIsOnDuty(!isOnDuty);
        // TODO: Call API to update status
    };

    const handleLogout = async () => {
        await dispatch(logout());
        router.replace('/(auth)/login');
    };

    return (
        <DrawerContentScrollView {...props} contentContainerStyle={styles.container}>
            {/* Header with Gradient */}
            <LinearGradient
                colors={DRAWER_COLORS.headerGradient}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.profileContainer}>
                    <View style={styles.avatarBorder}>
                        {driver?.profileImage ? (
                            <Image source={{ uri: driver.profileImage }} style={styles.avatar} />
                        ) : (
                            <MaterialCommunityIcons name="account" size={40} color="#007AFF" style={styles.avatarPlaceholder} />
                        )}
                    </View>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{driver?.firstName ? `${driver.firstName} ${driver.lastName}` : user?.email}</Text>
                        <Text style={styles.userRole}>Profesyonel Sürücü</Text>
                    </View>
                </View>

                {/* Status Toggle Card */}
                <View style={[styles.statusCard, { borderColor: isOnDuty ? DRAWER_COLORS.statusOn : DRAWER_COLORS.statusOff }]}>
                    <View>
                        <Text style={styles.statusLabel}>DURUM</Text>
                        <Text style={[styles.statusValue, { color: isOnDuty ? DRAWER_COLORS.statusOn : DRAWER_COLORS.statusOff }]}>
                            {isOnDuty ? 'GÖREVDE 🟢' : 'GÖREV DIŞI 🔴'}
                        </Text>
                    </View>
                    <Switch
                        value={isOnDuty}
                        onValueChange={toggleStatus}
                        trackColor={{ false: '#767577', true: '#81b0ff' }}
                        thumbColor={isOnDuty ? DRAWER_COLORS.statusOn : '#f4f3f4'}
                    />
                </View>
            </LinearGradient>

            {/* Menu Items */}
            <View style={styles.menuContainer}>
                <DrawerItemList {...props} />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <MaterialCommunityIcons name="logout" size={24} color="#EF4444" />
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
                <Text style={styles.versionText}>LogiTrack v2.0 (Transit UI)</Text>
            </View>
        </DrawerContentScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 20,
        borderBottomRightRadius: 30,
    },
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarBorder: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        backgroundColor: '#fff',
        borderRadius: 20,
        width: 56,
        height: 56,
        textAlign: 'center',
        textAlignVertical: 'center',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    userRole: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        borderLeftWidth: 5,
    },
    statusLabel: {
        fontSize: 10,
        color: '#666',
        fontWeight: 'bold',
        marginBottom: 2,
    },
    statusValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    menuContainer: {
        flex: 1,
        paddingTop: 20,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    logoutText: {
        color: '#EF4444', // Red
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    versionText: {
        color: '#ccc',
        fontSize: 10,
        textAlign: 'center',
    },
});
