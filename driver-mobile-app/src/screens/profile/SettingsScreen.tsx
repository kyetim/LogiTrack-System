import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Linking,
    ActionSheetIOS,
    Platform,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { logout, clearAuth } from '../../../store/slices/authSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';

import { Colors, Typography, Radius } from '@/theme/tokens';
import { api } from '../../../services/api';
import { changePasswordSchema } from '../../../utils/validators';
import { useFormValidation } from '../../hooks/useFormValidation';
import { parseApiError } from '../../../utils/apiError';

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();
    const router = useRouter();
    const dispatch = useAppDispatch();

    // ── Auth / Profile data from Redux ──────────────────────────
    const { user, driver } = useAppSelector((state) => state.auth);
    const { status: availabilityStatus } = useAppSelector((state: any) => state.availability);

    const fullName = [driver?.firstName, driver?.lastName].filter(Boolean).join(' ') || user?.email || '';
    const email = user?.email || '';
    const phone = (driver as any)?.phoneNumber || (user as any)?.phoneNumber || '';

    // ── App version ─────────────────────────────────────────────
    const appVersion = Constants.expoConfig?.version || '1.0.0';
    const buildNumber = (Constants.expoConfig?.ios as any)?.buildNumber
        || (Constants.expoConfig?.android as any)?.versionCode
        || '1';

    // ── Toggle states ────────────────────────────────────────────
    const [notifications, setNotifications] = useState(false);
    const [locationTracking, setLocationTracking] = useState(false);
    const [language, setLanguage] = useState<'tr' | 'en'>('tr');
    const darkMode = true; // Always dark per design

    // ── Password Change Modal ─────────────────────────────────────
    const [showChangePassword, setShowChangePassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const { errors: pwErrors, validate: validatePw, clearAllErrors: clearPwErrors } =
        useFormValidation(changePasswordSchema);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // ── Sync location tracking with availability ─────────────────
    useEffect(() => {
        setLocationTracking(availabilityStatus !== 'OFF_DUTY');
    }, [availabilityStatus]);

    // ── Load notification permission status ───────────────────────
    useEffect(() => {
        const checkNotificationStatus = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            setNotifications(status === 'granted');
        };
        checkNotificationStatus();
    }, []);

    // ── Load persisted language ───────────────────────────────────
    useEffect(() => {
        AsyncStorage.getItem('app_language').then(lang => {
            if (lang === 'tr' || lang === 'en') setLanguage(lang);
        });
    }, []);

    // ── Handlers ─────────────────────────────────────────────────

    const handleNotificationToggle = async (value: boolean) => {
        if (value) {
            const { status } = await Notifications.requestPermissionsAsync();
            setNotifications(status === 'granted');
            if (status !== 'granted') {
                Alert.alert('İzin Gerekli', 'Bildirimler için ayarlardan izin verin.', [
                    { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                    { text: 'İptal', style: 'cancel' },
                ]);
            }
        } else {
            Alert.alert(
                'Bildirimleri Kapat',
                'Bildirimleri telefon ayarlarından kapatabilirsiniz.',
                [
                    { text: 'Ayarlara Git', onPress: () => Linking.openSettings() },
                    { text: 'İptal', style: 'cancel' },
                ],
            );
        }
    };

    const handleLocationToggle = (value: boolean) => {
        setLocationTracking(value);
        if (!value) {
            Alert.alert(
                'Konum Takibini Durdur',
                'Konumunu kapatmak için ana ekrandan "Çevrimdışı" yap.',
                [{ text: 'Tamam' }],
            );
        }
    };

    const handleLanguageChange = () => {
        const saveLanguage = async (lang: 'tr' | 'en') => {
            setLanguage(lang);
            await AsyncStorage.setItem('app_language', lang);
            Alert.alert('Dil Değiştirildi', 'Değişiklik bir sonraki açılışta geçerli olacak.');
        };

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options: ['İptal', 'Türkçe', 'English'], cancelButtonIndex: 0 },
                (buttonIndex) => {
                    if (buttonIndex === 1) saveLanguage('tr');
                    if (buttonIndex === 2) saveLanguage('en');
                },
            );
        } else {
            Alert.alert('Dil Seçin', '', [
                { text: 'Türkçe', onPress: () => saveLanguage('tr') },
                { text: 'English', onPress: () => saveLanguage('en') },
                { text: 'İptal', style: 'cancel' },
            ]);
        }
    };

    const handleChangePassword = async () => {
        // Zod ile doğrula — changePasswordSchema ile tutarlı kurallar
        if (!validatePw({ currentPassword, newPassword, confirmNewPassword: confirmPassword })) {
            const first = Object.values(pwErrors)[0];
            if (first) Alert.alert('Hata', first);
            return;
        }

        try {
            setIsChangingPassword(true);
            await api.changePassword(currentPassword, newPassword);
            setShowChangePassword(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            clearPwErrors();
            Alert.alert('Başarılı', 'Şifreniz başarıyla değiştirildi.');
        } catch (error: unknown) {
            const { message } = parseApiError(error);
            Alert.alert('Hata', message);
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleClearCache = () => {
        Alert.alert('Önbelleği Temizle', 'Uygulama önbelleğini temizlemek istiyor musunuz?', [
            { text: 'İptal', style: 'cancel' },
            {
                text: 'Temizle',
                style: 'default',
                onPress: async () => {
                    try {
                        const keysToRemove = ['cached_shipments', 'cached_location', 'app_cache'];
                        await AsyncStorage.multiRemove(keysToRemove);
                        Alert.alert('Önbellek', 'Temizlendi ✓');
                    } catch {
                        Alert.alert('Hata', 'Temizleme sırasında sorun oluştu.');
                    }
                },
            },
        ]);
    };

    const handleLogout = () => {
        Alert.alert('Çıkış Yap', 'Emin misiniz?', [
            { text: 'Hayır', style: 'cancel' },
            {
                text: 'Evet',
                style: 'destructive',
                onPress: async () => {
                    try { await dispatch(logout()).unwrap(); } catch { /* ignore */ }
                    dispatch(clearAuth());
                    router.replace('/(auth)');
                },
            },
        ]);
    };

    const handleDeleteAccount = async () => {
        try {
            await api.deleteAccount();
            try { await dispatch(logout()).unwrap(); } catch { /* ignore */ }
            dispatch(clearAuth());
            router.replace('/(auth)');
        } catch {
            Alert.alert('Hata', 'Hesap silinirken bir sorun oluştu.');
        }
    };

    // ── Reusable Row ─────────────────────────────────────────────

    const RowItem = ({
        label, value, onPress, isDestructive = false, isLast = false, rightElement,
    }: {
        label: string;
        value?: string;
        onPress?: () => void;
        isDestructive?: boolean;
        isLast?: boolean;
        rightElement?: React.ReactNode;
    }) => (
        <TouchableOpacity
            activeOpacity={onPress ? 0.7 : 1}
            onPress={onPress}
            disabled={!onPress}
            style={[styles.row, !isLast && styles.rowBorder]}
        >
            <Text style={[styles.rowLabel, isDestructive && { color: Colors.error }]}>{label}</Text>
            <View style={styles.rowRight}>
                {value && <Text style={styles.rowValue}>{value}</Text>}
                {rightElement ? rightElement : (
                    onPress && <ChevronRight color={isDestructive ? Colors.error : Colors.gray} size={18} />
                )}
            </View>
        </TouchableOpacity>
    );

    // ── Render ────────────────────────────────────────────────────

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Ayarlar</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── HESAP BİLGİLERİ ─── */}
                <Text style={styles.sectionTitle}>HESAP</Text>
                <View style={styles.cardGroup}>
                    <RowItem label="Ad Soyad" value={fullName || '—'} />
                    <RowItem label="E-posta" value={email || '—'} />
                    <RowItem label="Telefon" value={phone || '—'} />
                    <RowItem
                        label="Şifre Değiştir"
                        onPress={() => setShowChangePassword(true)}
                        isDestructive
                        isLast
                    />
                </View>

                {/* ─── BİLDİRİMLER & GİZLİLİK ─── */}
                <Text style={styles.sectionTitle}>BİLDİRİMLER & GİZLİLİK</Text>
                <View style={styles.cardGroup}>
                    <RowItem
                        label="Anlık Bildirimler"
                        rightElement={
                            <Switch
                                value={notifications}
                                onValueChange={handleNotificationToggle}
                                trackColor={{ false: '#3A3A3A', true: 'rgba(255, 215, 0, 0.3)' }}
                                thumbColor={notifications ? Colors.primary : '#f4f3f4'}
                            />
                        }
                    />
                    <RowItem
                        label="Konum Takibi"
                        rightElement={
                            <Switch
                                value={locationTracking}
                                onValueChange={handleLocationToggle}
                                trackColor={{ false: '#3A3A3A', true: 'rgba(255, 215, 0, 0.3)' }}
                                thumbColor={locationTracking ? Colors.primary : '#f4f3f4'}
                            />
                        }
                    />
                    <RowItem
                        label="Karanlık Mod"
                        isLast
                        rightElement={
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Text style={styles.chipText}>(Varsayılan)</Text>
                                <Switch
                                    value={darkMode}
                                    disabled={true}
                                    trackColor={{ false: '#3A3A3A', true: 'rgba(255, 215, 0, 0.3)' }}
                                    thumbColor={Colors.primary}
                                />
                            </View>
                        }
                    />
                </View>

                {/* ─── UYGULAMA ─── */}
                <Text style={styles.sectionTitle}>UYGULAMA</Text>
                <View style={styles.cardGroup}>
                    <RowItem
                        label="Dil"
                        value={language === 'tr' ? 'Türkçe' : 'English'}
                        onPress={handleLanguageChange}
                    />
                    <RowItem
                        label="Versiyon"
                        value={`v${appVersion} (Build ${buildNumber})`}
                        rightElement={<View />}
                    />
                    <RowItem
                        label="Önbelleği Temizle"
                        value="↺ Temizle"
                        onPress={handleClearCache}
                        isLast
                        rightElement={<ChevronRight color={Colors.primary} size={18} />}
                    />
                </View>

                {/* ─── DESTEK & YASAL ─── */}
                <Text style={styles.sectionTitle}>DESTEK & YASAL</Text>
                <View style={styles.cardGroup}>
                    <RowItem label="Yardım Merkezi" onPress={() => navigation.navigate('Support')} />
                    <RowItem label="Gizlilik Politikası" onPress={() => Linking.openURL('https://example.com/privacy')} />
                    <RowItem label="Kullanım Koşulları" onPress={() => Linking.openURL('https://example.com/terms')} />
                    <RowItem label="Bize Puan Ver" onPress={() => Linking.openURL('market://details?id=com.logitrack')} isLast />
                </View>

                {/* ─── TEHLİKELİ BÖLGE ─── */}
                <Text style={[styles.sectionTitle, { color: Colors.error }]}>TEHLİKELİ BÖLGE</Text>
                <View style={styles.dangerZone}>
                    <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.8} onPress={handleLogout}>
                        <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteLink} onPress={() => setShowDeleteConfirm(true)}>
                        <Text style={styles.deleteLinkText}>Hesabı Sil</Text>
                    </TouchableOpacity>
                    {showDeleteConfirm && (
                        <View style={styles.deleteWarningCard}>
                            <Text style={styles.deleteWarningTitle}>Bu işlem geri alınamaz.</Text>
                            <Text style={styles.deleteWarningText}>
                                Tüm teslimat geçmişiniz ve bilgileriniz sistemden kalıcı olarak silinecektir.
                            </Text>
                            <View style={styles.deleteWarningActions}>
                                <TouchableOpacity style={styles.cancelDeleteBtn} onPress={() => setShowDeleteConfirm(false)}>
                                    <Text style={styles.cancelDeleteText}>Vazgeç</Text>
                                </TouchableOpacity>
                                <View style={{ width: 12 }} />
                                <TouchableOpacity style={styles.confirmDeleteBtn} onPress={handleDeleteAccount}>
                                    <Text style={styles.confirmDeleteText}>Hesabı Sil</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* ─── ŞİFRE DEĞİŞTİR MODAL ─── */}
            <Modal
                visible={showChangePassword}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => { setShowChangePassword(false); clearPwErrors(); }}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Şifre Değiştir</Text>
                        <TouchableOpacity onPress={() => { setShowChangePassword(false); clearPwErrors(); }}>
                            <Text style={styles.modalClose}>İptal</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Mevcut Şifre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Mevcut Şifre</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showCurrent}
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                placeholder="Mevcut şifreniz"
                                placeholderTextColor="#555"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn}>
                                {showCurrent
                                    ? <EyeOff size={18} color={Colors.gray} />
                                    : <Eye size={18} color={Colors.gray} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Yeni Şifre */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Yeni Şifre (min 8 karakter)</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showNew}
                                value={newPassword}
                                onChangeText={setNewPassword}
                                placeholder="Yeni şifreniz"
                                placeholderTextColor="#555"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowNew(v => !v)} style={styles.eyeBtn}>
                                {showNew
                                    ? <EyeOff size={18} color={Colors.gray} />
                                    : <Eye size={18} color={Colors.gray} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Yeni Şifre Tekrar */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Yeni Şifre Tekrar</Text>
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                secureTextEntry={!showConfirm}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                placeholder="Yeni şifrenizi tekrar girin"
                                placeholderTextColor="#555"
                                autoCapitalize="none"
                            />
                            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn}>
                                {showConfirm
                                    ? <EyeOff size={18} color={Colors.gray} />
                                    : <Eye size={18} color={Colors.gray} />
                                }
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.changePasswordBtn, isChangingPassword && { opacity: 0.6 }]}
                        onPress={handleChangePassword}
                        disabled={isChangingPassword}
                    >
                        {isChangingPassword
                            ? <ActivityIndicator color="#000" />
                            : <Text style={styles.changePasswordBtnText}>Değiştir</Text>
                        }
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontFamily: Typography.fontDisplayBold, fontSize: 16, color: Colors.white },
    scrollView: { flex: 1 },
    scrollContent: { paddingVertical: 16, paddingHorizontal: 16, paddingBottom: 60 },
    sectionTitle: {
        fontFamily: Typography.fontBodyMedium, fontSize: 11, color: '#555555',
        textTransform: 'uppercase', letterSpacing: 0.5,
        paddingHorizontal: 16, marginBottom: 8, marginTop: 24,
    },
    cardGroup: { backgroundColor: '#1A1A1A', borderRadius: 14, overflow: 'hidden' },
    row: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        padding: 16, backgroundColor: '#1A1A1A',
    },
    rowBorder: { borderBottomWidth: 1, borderBottomColor: '#242424' },
    rowLabel: { fontFamily: Typography.fontBodyMedium, fontSize: 14, color: Colors.white },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowValue: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray },
    chipText: { fontFamily: Typography.fontBody, fontSize: 11, color: Colors.gray },
    dangerZone: { marginTop: 12 },
    logoutBtn: {
        width: '100%', paddingVertical: 14, borderWidth: 1.5, borderColor: Colors.error,
        borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginBottom: 24,
    },
    logoutBtnText: { fontFamily: Typography.fontBodyMedium, fontSize: 15, color: Colors.error },
    deleteLink: { padding: 8, alignItems: 'center' },
    deleteLinkText: { fontFamily: Typography.fontBody, fontSize: 12, color: Colors.error, textDecorationLine: 'underline' },
    deleteWarningCard: {
        marginTop: 24, backgroundColor: 'rgba(255, 82, 82, 0.1)',
        borderWidth: 1, borderColor: 'rgba(255, 82, 82, 0.3)', borderRadius: 16, padding: 16,
    },
    deleteWarningTitle: { fontFamily: Typography.fontDisplayBold, fontSize: 15, color: Colors.error, marginBottom: 8 },
    deleteWarningText: { fontFamily: Typography.fontBody, fontSize: 13, color: Colors.gray, lineHeight: 18, marginBottom: 16 },
    deleteWarningActions: { flexDirection: 'row' },
    cancelDeleteBtn: { flex: 1, backgroundColor: '#1A1A1A', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    cancelDeleteText: { fontFamily: Typography.fontBodyMedium, fontSize: 14, color: Colors.white },
    confirmDeleteBtn: { flex: 1, backgroundColor: Colors.error, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
    confirmDeleteText: { fontFamily: Typography.fontBodyMedium, fontSize: 14, color: Colors.white },

    // Modal styles
    modalContainer: { flex: 1, backgroundColor: Colors.background, padding: 24 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
    modalTitle: { fontFamily: Typography.fontDisplayBold, fontSize: 20, color: Colors.white },
    modalClose: { fontFamily: Typography.fontBodyMedium, fontSize: 15, color: Colors.primary },
    inputGroup: { marginBottom: 20 },
    inputLabel: { fontFamily: Typography.fontBodyMedium, fontSize: 12, color: Colors.gray, marginBottom: 8 },
    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#1A1A1A', borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A',
    },
    input: {
        flex: 1, paddingHorizontal: 16, paddingVertical: 14,
        fontFamily: Typography.fontBody, fontSize: 15, color: Colors.white,
    },
    eyeBtn: { paddingHorizontal: 14, paddingVertical: 14 },
    changePasswordBtn: {
        backgroundColor: Colors.primary, borderRadius: 14,
        paddingVertical: 16, alignItems: 'center', marginTop: 8,
    },
    changePasswordBtnText: { fontFamily: Typography.fontBodySemiBold, fontSize: 16, color: '#000' },
});
