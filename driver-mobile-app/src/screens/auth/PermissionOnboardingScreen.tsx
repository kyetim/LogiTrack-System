import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { MapPin, Bell, ChevronRight, Check } from 'lucide-react-native';
import { Colors, Typography } from '@/theme/tokens';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PERMISSION_DONE_KEY = 'permissions_onboarded';

interface Props {
    onComplete: () => void;
}

export const PermissionOnboardingScreen: React.FC<Props> = ({ onComplete }) => {
    const [locationGranted, setLocationGranted] = useState(false);
    const [notifGranted, setNotifGranted] = useState(false);

    const requestLocation = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setLocationGranted(true);
        } else {
            Alert.alert(
                'Konum İzni Gerekli',
                'LogiTrack görev esnasında konumunuzu kullanmak istiyor. Ayarlardan izin verebilirsiniz.',
                [
                    { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                    { text: 'Şimdi Değil', style: 'cancel' },
                ]
            );
        }
    };

    const requestNotifications = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
            setNotifGranted(true);
        } else {
            Alert.alert(
                'Bildirim İzni',
                'Yeni görev atamalarını anlık olarak almak için bildirime izin verin.',
                [
                    { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                    { text: 'Şimdi Değil', style: 'cancel' },
                ]
            );
        }
    };

    const handleContinue = async () => {
        await AsyncStorage.setItem(PERMISSION_DONE_KEY, 'true');
        onComplete();
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Birkaç İzne{'\n'}İhtiyacımız Var</Text>
                <Text style={styles.subtitle}>
                    LogiTrack'in düzgün çalışması için aşağıdaki izinleri vermeniz önerilir.
                </Text>

                {/* Konum izni kartı */}
                <TouchableOpacity
                    style={[styles.permCard, locationGranted && styles.permCardGranted]}
                    onPress={requestLocation}
                    activeOpacity={0.8}
                    disabled={locationGranted}
                >
                    <View style={styles.permIcon}>
                        <MapPin color={locationGranted ? Colors.primary : Colors.gray} size={24} />
                    </View>
                    <View style={styles.permText}>
                        <Text style={styles.permTitle}>Konum Erişimi</Text>
                        <Text style={styles.permDesc}>Teslimat rotası ve görev eşleşmesi için gerekli</Text>
                    </View>
                    {locationGranted
                        ? <Check color={Colors.primary} size={20} />
                        : <ChevronRight color={Colors.gray} size={20} />}
                </TouchableOpacity>

                {/* Bildirim izni kartı */}
                <TouchableOpacity
                    style={[styles.permCard, notifGranted && styles.permCardGranted]}
                    onPress={requestNotifications}
                    activeOpacity={0.8}
                    disabled={notifGranted}
                >
                    <View style={styles.permIcon}>
                        <Bell color={notifGranted ? Colors.primary : Colors.gray} size={24} />
                    </View>
                    <View style={styles.permText}>
                        <Text style={styles.permTitle}>Bildirimler</Text>
                        <Text style={styles.permDesc}>Yeni görev ve mesaj bildirimleri için gerekli</Text>
                    </View>
                    {notifGranted
                        ? <Check color={Colors.primary} size={20} />
                        : <ChevronRight color={Colors.gray} size={20} />}
                </TouchableOpacity>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.continueBtn} onPress={handleContinue} activeOpacity={0.8}>
                    <Text style={styles.continueBtnText}>
                        {locationGranted ? 'Devam Et' : 'Şimdilik Atla'}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.skipNote}>
                    İzinleri daha sonra Ayarlar ekranından değiştirebilirsiniz.
                </Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { flex: 1, paddingHorizontal: 24, paddingTop: 48 },
    title: {
        fontFamily: Typography.fontDisplayBold, fontSize: 28,
        color: Colors.white, lineHeight: 36, marginBottom: 12,
    },
    subtitle: {
        fontFamily: Typography.fontBody, fontSize: 14,
        color: Colors.gray, lineHeight: 20, marginBottom: 40,
    },
    permCard: {
        flexDirection: 'row', alignItems: 'center', gap: 16,
        backgroundColor: '#1A1A1A', borderRadius: 16,
        padding: 20, marginBottom: 16,
        borderWidth: 1, borderColor: '#2A2A2A',
    },
    permCardGranted: {
        borderColor: Colors.primary,
        backgroundColor: 'rgba(255,215,0,0.05)',
    },
    permIcon: {
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: '#242424', justifyContent: 'center', alignItems: 'center',
    },
    permText: { flex: 1 },
    permTitle: {
        fontFamily: Typography.fontBodyMedium, fontSize: 15, color: Colors.white, marginBottom: 4,
    },
    permDesc: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.gray },
    footer: { paddingHorizontal: 24, paddingBottom: 32 },
    continueBtn: {
        backgroundColor: Colors.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginBottom: 12,
    },
    continueBtnText: {
        fontFamily: Typography.fontBodyMedium, fontSize: 16, color: '#000',
    },
    skipNote: {
        fontFamily: Typography.fontBody, fontSize: 12,
        color: Colors.gray, textAlign: 'center',
    },
});
