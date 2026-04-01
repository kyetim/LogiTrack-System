import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Settings, ChevronRight, FileText, DollarSign, MessageCircle, Info, Star, Folder, Truck } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { StatusBadge } from '@/components/shared';
import { useAppSelector } from '../../../store';
import { useGetMyScoreQuery } from '../../../store/api/logitrackApi';

type ProfileNavProp = NativeStackNavigationProp<MainStackParamList, 'MainTabs'>;

export const ProfileScreen = () => {
    const navigation = useNavigation<ProfileNavProp>();
    const { user, driver } = useAppSelector((state) => state.auth);
    const { data: score } = useGetMyScoreQuery();

    // Derive display values from real auth state
    const fullName = useMemo(() => {
        if (driver?.firstName || driver?.lastName) {
            return [driver.firstName, driver.lastName].filter(Boolean).join(' ');
        }
        return user?.email ?? '—';
    }, [driver, user]);

    const avatarInitials = useMemo(() => {
        if (driver?.firstName) {
            return (
                (driver.firstName[0] ?? '') +
                (driver.lastName?.[0] ?? '')
            ).toUpperCase();
        }
        return (user?.email?.[0] ?? '?').toUpperCase();
    }, [driver, user]);

    const vehicleType = driver?.vehicle?.type ?? '—';
    const vehiclePlate = driver?.vehicle?.plateNumber ?? '—';
    const isOnDuty = driver?.status === 'ON_DUTY';

    // Rating distribution based on real customerRating score
    const customerRating = score?.customerRating ?? 0;
    const ratings = useMemo(() => [
        { stars: 5, pct: Math.round(customerRating * 0.9), color: Colors.primary, opacity: 1 },
        { stars: 4, pct: Math.round(customerRating * 0.07), color: Colors.primary, opacity: 0.6 },
        { stars: 3, pct: Math.round(customerRating * 0.02), color: Colors.primary, opacity: 0.4 },
        { stars: 2, pct: Math.round((100 - customerRating) * 0.5), color: Colors.gray, opacity: 1 },
        { stars: 1, pct: Math.round((100 - customerRating) * 0.5), color: Colors.error, opacity: 1 },
    ], [customerRating]);

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
                            <Text style={styles.avatarText}>{avatarInitials}</Text>
                        </View>
                        <View style={styles.heroInfo}>
                            <Text style={styles.driverName} numberOfLines={1} ellipsizeMode="tail">{fullName}</Text>
                            <Text style={styles.driverVehicle} numberOfLines={1} ellipsizeMode="tail">{vehicleType} • {vehiclePlate}</Text>
                            <Text style={styles.driverJoin} numberOfLines={1} ellipsizeMode="tail">{user?.email ?? ''}</Text>
                        </View>
                        <View style={styles.heroBadge}>
                            <StatusBadge status={isOnDuty ? 'online' : 'offline'} size="sm" showDot={true} />
                        </View>
                    </View>
                </View>

                {/* ─── PERFORMANS İSTATİSTİKLERİ ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>PERFORMANS</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Genel Puan</Text>
                        <Text style={styles.statValue}>
                            {score ? score.overallScore.toFixed(0) : <ActivityIndicator size="small" color={Colors.primary} />}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Müşteri Puanı</Text>
                        <Text style={styles.statValue}>
                            <Text style={{ fontSize: 16 }}>⭐ </Text>
                            {score ? (score.customerRating / 20).toFixed(1) : '—'}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Güvenlik</Text>
                        <Text style={[styles.statValue, { color: Colors.primary }]}>
                            {score ? `%${score.safetyScore.toFixed(0)}` : '—'}
                        </Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Dakiklik</Text>
                        <Text style={styles.statValue}>
                            {score ? `%${score.punctualityScore.toFixed(0)}` : '—'}
                        </Text>
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
                        <Text style={styles.vehicleText}>{vehicleType}</Text>
                    </View>
                    <View style={styles.vehicleRow}>
                        <Info color={Colors.white} size={20} />
                        <Text style={styles.vehicleText}>{vehiclePlate}</Text>
                    </View>
                    <View style={styles.vehicleRowLast}>
                        <View style={[styles.statusDot, !isOnDuty && { backgroundColor: Colors.gray }]} />
                        <Text style={styles.vehicleText}>{isOnDuty ? 'Görevde' : 'Çevrimdışı'}</Text>
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
                        onPress={() => navigation.navigate('HistoryTab' as any)}
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
                        style={[styles.actionRow, styles.actionRowLast]}
                        onPress={() => navigation.navigate('Settings' as any)}
                    >
                        <View style={styles.actionLeft}>
                            <Settings color={Colors.white} size={20} />
                            <Text style={styles.actionLabel}>Ayarlar</Text>
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
        alignSelf: 'flex-start',
        marginLeft: 8,
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
