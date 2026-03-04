import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Settings, ChevronRight, FileText, DollarSign, MessageCircle, Info, Star, Folder, Trophy, Truck } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { mockDriver, mockTodayStats } from '@/data/mockData';
import { StatusBadge } from '@/components/shared';

type ProfileNavProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

export const ProfileScreen = () => {
    const navigation = useNavigation<ProfileNavProp>();

    // Mock progress calculations for the Rating Distribution
    const ratings = [
        { stars: 5, pct: 72, color: Colors.primary, opacity: 1 },
        { stars: 4, pct: 18, color: Colors.primary, opacity: 0.6 },
        { stars: 3, pct: 7, color: Colors.primary, opacity: 0.4 },
        { stars: 2, pct: 2, color: Colors.gray, opacity: 1 },
        { stars: 1, pct: 1, color: Colors.error, opacity: 1 },
    ];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profilim</Text>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('Settings' as any)}
                    style={styles.settingsBtn}
                >
                    <Settings color={Colors.white} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── PROFİL HERO ─── */}
                <View style={styles.heroContainer}>
                    <View style={styles.heroInner}>
                        <View style={styles.avatarContainer}>
                            <Text style={styles.avatarText}>{mockDriver.avatarInitials}</Text>
                        </View>
                        <View style={styles.heroInfo}>
                            <Text style={styles.driverName}>{mockDriver.fullName}</Text>
                            <Text style={styles.driverVehicle}>{mockDriver.vehicleType} • {mockDriver.vehiclePlate}</Text>
                            <Text style={styles.driverJoin}>Üye: {mockDriver.joinDate}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <StatusBadge status={mockDriver.isOnline ? 'online' : 'offline'} size="sm" showDot={true} />
                        </View>
                    </View>
                </View>

                {/* ─── PERFORMANS İSTATİSTİKLERİ ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>PERFORMANS</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Toplam Teslimat</Text>
                        <Text style={styles.statValue}>{mockDriver.totalDeliveries}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Puan Ortalaması</Text>
                        <Text style={styles.statValue}>
                            <Text style={{ fontSize: 16 }}>⭐ </Text>
                            {mockDriver.rating.toFixed(1)}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Bu Ay Kazanç</Text>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>₺8.420</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Tamamlama Oranı</Text>
                        <Text style={styles.statValue}>%96.3</Text>
                    </View>
                </View>

                {/* ─── PUAN DAĞILIMI ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>DEĞERLENDİRMELER</Text>
                </View>

                <View style={styles.ratingCard}>
                    {ratings.map((item, index) => (
                        <View key={`rating-${item.stars}`} style={styles.ratingRow}>
                            <View style={styles.ratingStarBox}>
                                <Text style={styles.ratingStarText}>{item.stars}</Text>
                                <Star color="#8A8A8A" size={12} fill="#8A8A8A" style={{ marginLeft: 2 }} />
                            </View>

                            <View style={styles.ratingBarTrack}>
                                <View
                                    style={[
                                        styles.ratingBarFill,
                                        {
                                            width: `${item.pct}%`,
                                            backgroundColor: item.color,
                                            opacity: item.opacity
                                        }
                                    ]}
                                />
                            </View>

                            <Text style={styles.ratingPctText}>%{item.pct}</Text>
                        </View>
                    ))}
                </View>

                {/* ─── ARAÇ BİLGİSİ ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>ARAÇ BİLGİSİ</Text>
                </View>

                <View style={styles.vehicleCard}>
                    <View style={styles.vehicleRow}>
                        <Truck color={Colors.white} size={20} />
                        <Text style={styles.vehicleText}>{mockDriver.vehicleType}</Text>
                    </View>
                    <View style={styles.vehicleRow}>
                        <Info color={Colors.white} size={20} />
                        <Text style={styles.vehicleText}>{mockDriver.vehiclePlate}</Text>
                    </View>
                    <View style={styles.vehicleRowLast}>
                        <View style={styles.statusDot} />
                        <Text style={styles.vehicleText}>Aktif</Text>
                    </View>
                </View>

                {/* ─── HIZLI EYLEMLER ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>HIZLI EYLEMLER</Text>
                </View>

                <View style={styles.actionsList}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('DeliveryList' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <FileText color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Teslimat Geçmişim</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Earnings' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <DollarSign color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Kazanç Detayı</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>

                    {/* YENİ EKLENEN: Belgelerim */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Documents' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <Folder color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Belgelerim</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Support' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <MessageCircle color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Destek</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.actionRow}
                        onPress={() => navigation.navigate('Settings' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <Settings color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Ayarlar</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>

                    {/* YENİ EKLENEN: Liderlik Tablosu */}
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.actionRow, styles.actionRowLast]}
                        onPress={() => navigation.navigate('Leaderboard' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <Trophy color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Liderlik Tablosu</Text>
                        </View>
                        <ChevronRight color="#555" size={20} />
                    </TouchableOpacity>
                </View>

                {/* Bottom Padding */}
                <View style={{ height: 80 }} />
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
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 22,
        color: Colors.white,
        fontWeight: '800', // Ensuring extra bold appearance fallback
    },
    settingsBtn: {
        padding: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
    },
    heroContainer: {
        backgroundColor: '#1A1A1A', // Base color before gradient representation
        borderRadius: 20,
        marginBottom: 24,
        overflow: 'hidden',
    },
    heroInner: {
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)', // Light overlay simulating a subtile gradient
    },
    avatarContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#242424',
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 24,
        color: Colors.primary,
        fontWeight: '800',
    },
    heroInfo: {
        flex: 1,
    },
    driverName: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.white,
        fontWeight: '800',
        marginBottom: 4,
    },
    driverVehicle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 4,
    },
    driverJoin: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: '#666',
    },
    heroBadge: {
        position: 'absolute',
        top: 24,
        right: 24,
    },
    sectionHeader: {
        marginBottom: 12,
        marginTop: 8,
    },
    sectionLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 24,
    },
    statBox: {
        width: '48%',
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 16,
    },
    statLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 8,
    },
    statValue: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.white,
        fontWeight: '700',
    },
    ratingCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    ratingStarBox: {
        width: 28,
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingStarText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.white,
    },
    ratingBarTrack: {
        flex: 1,
        height: 6,
        backgroundColor: '#2A2A2A',
        borderRadius: 3,
        marginHorizontal: 12,
        overflow: 'hidden',
    },
    ratingBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    ratingPctText: {
        width: 34,
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        textAlign: 'right',
    },
    vehicleCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
    },
    vehicleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    vehicleRowLast: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    vehicleText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        marginLeft: 12,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.success,
        marginLeft: 6,
        marginRight: 6,
    },
    actionsList: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        overflow: 'hidden',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#242424',
    },
    actionRowLast: {
        borderBottomWidth: 0,
    },
    actionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
        marginLeft: 16,
    },
});
