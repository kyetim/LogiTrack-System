import React, { useState } from 'react';
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
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography, Radius } from '@/theme/tokens';
import { mockDriver } from '@/data/mockData';
import { AppButton } from '@/components/ui';

type SettingsNavProp = NativeStackNavigationProp<MainStackParamList, 'Settings'>;

export const SettingsScreen = () => {
    const navigation = useNavigation<any>();

    // State Requirements
    const [notifications, setNotifications] = useState(true);
    const [locationTracking, setLocationTracking] = useState(true);
    const [language, setLanguage] = useState<'tr' | 'en'>('tr');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const darkMode = true; // Always true per instructions

    const handleClearCache = () => {
        Alert.alert(
            "Önbelleği Temizle",
            "Uygulama önbelleğini temizlemek istiyor musunuz?",
            [
                { text: "İptal", style: 'cancel' },
                {
                    text: "Temizle",
                    style: 'default',
                    onPress: () => Alert.alert("Önbellek", "Temizlendi ✓")
                }
            ]
        );
    };

    const handleLanguageChange = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['İptal', 'Türkçe', 'English'],
                    cancelButtonIndex: 0,
                },
                (buttonIndex) => {
                    if (buttonIndex === 1) setLanguage('tr');
                    if (buttonIndex === 2) setLanguage('en');
                }
            );
        } else {
            // Basic fallback for Android, though prompt doesn't strictly dictate ActionSheet type,
            // standard Alert can simulate it
            Alert.alert(
                "Dil Seçin",
                "",
                [
                    { text: "Türkçe", onPress: () => setLanguage('tr') },
                    { text: "English", onPress: () => setLanguage('en') },
                    { text: "İptal", style: 'cancel' }
                ]
            );
        }
    };

    const handleLogout = () => {
        Alert.alert(
            "Çıkış Yap",
            "Emin misiniz?",
            [
                { text: "Hayır", style: 'cancel' },
                {
                    text: "Evet",
                    style: 'destructive',
                    onPress: () => {
                        // Normally would dispatch(clearAuth())
                        // Here we just route to Auth index (mock route via replace)
                        navigation.replace('/(auth)');
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Hesap Silindi",
            "Hesabınız başarıyla silinmiştir.",
            [{ text: "Tamam", onPress: () => navigation.replace('index') }]
        );
    };

    const RowItem = ({
        label,
        value,
        onPress,
        isDestructive = false,
        isLast = false,
        rightElement
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
            <Text style={[styles.rowLabel, isDestructive && { color: Colors.error }]}>
                {label}
            </Text>
            <View style={styles.rowRight}>
                {value && <Text style={styles.rowValue}>{value}</Text>}
                {rightElement ? rightElement : (
                    onPress && <ChevronRight color={isDestructive ? Colors.error : Colors.gray} size={18} />
                )}
            </View>
        </TouchableOpacity>
    );

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

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── HESAP BİLGİLERİ ─── */}
                <Text style={styles.sectionTitle}>HESAP</Text>
                <View style={styles.cardGroup}>
                    <RowItem label="Ad Soyad" value={mockDriver.fullName} onPress={() => { }} />
                    <RowItem label="E-posta" value={mockDriver.email} onPress={() => { }} />
                    <RowItem label="Telefon" value={mockDriver.phone} onPress={() => { }} />
                    <RowItem label="Şifre Değiştir" onPress={() => { }} isDestructive isLast />
                </View>

                {/* ─── BİLDİRİMLER & GİZLİLİK ─── */}
                <Text style={styles.sectionTitle}>BİLDİRİMLER & GİZLİLİK</Text>
                <View style={styles.cardGroup}>
                    <RowItem
                        label="Anlık Bildirimler"
                        rightElement={
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
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
                                onValueChange={setLocationTracking}
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
                        value="v1.0.0 (Build 42)"
                        rightElement={<View />}
                    />
                    <RowItem
                        label="Önbelleği Temizle"
                        value="24.3 MB"
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
                    <TouchableOpacity
                        style={styles.logoutBtn}
                        activeOpacity={0.8}
                        onPress={handleLogout}
                    >
                        <Text style={styles.logoutBtnText}>Çıkış Yap</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.deleteLink}
                        onPress={() => setShowDeleteConfirm(true)}
                    >
                        <Text style={styles.deleteLinkText}>Hesabı Sil</Text>
                    </TouchableOpacity>

                    {showDeleteConfirm && (
                        <View style={styles.deleteWarningCard}>
                            <Text style={styles.deleteWarningTitle}>Bu işlem geri alınamaz.</Text>
                            <Text style={styles.deleteWarningText}>Tüm teslimat geçmişiniz ve bilgileriniz sistemden kalıcı olarak silinecektir.</Text>
                            <View style={styles.deleteWarningActions}>
                                <TouchableOpacity
                                    style={styles.cancelDeleteBtn}
                                    onPress={() => setShowDeleteConfirm(false)}
                                >
                                    <Text style={styles.cancelDeleteText}>Vazgeç</Text>
                                </TouchableOpacity>
                                <View style={{ width: 12 }} />
                                <TouchableOpacity
                                    style={styles.confirmDeleteBtn}
                                    onPress={handleDeleteAccount}
                                >
                                    <Text style={styles.confirmDeleteText}>Hesabı Sil</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        paddingBottom: 60,
    },
    sectionTitle: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: '#555555',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        paddingHorizontal: 16,
        marginBottom: 8,
        marginTop: 24,
    },
    cardGroup: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1A1A',
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#242424',
    },
    rowLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
    },
    rowRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    rowValue: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
    },
    chipText: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.gray,
    },
    dangerZone: {
        marginTop: 12,
    },
    logoutBtn: {
        width: '100%',
        paddingVertical: 14,
        borderWidth: 1.5,
        borderColor: Colors.error,
        borderRadius: Radius.pill,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    logoutBtnText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 15,
        color: Colors.error,
    },
    deleteLink: {
        padding: 8,
        alignItems: 'center',
    },
    deleteLinkText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.error,
        textDecorationLine: 'underline',
    },
    deleteWarningCard: {
        marginTop: 24,
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255, 82, 82, 0.3)',
        borderRadius: 16,
        padding: 16,
    },
    deleteWarningTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 15,
        color: Colors.error,
        marginBottom: 8,
    },
    deleteWarningText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 18,
        marginBottom: 16,
    },
    deleteWarningActions: {
        flexDirection: 'row',
    },
    cancelDeleteBtn: {
        flex: 1,
        backgroundColor: '#1A1A1A',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelDeleteText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
    },
    confirmDeleteBtn: {
        flex: 1,
        backgroundColor: Colors.error,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    confirmDeleteText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
    },
});
