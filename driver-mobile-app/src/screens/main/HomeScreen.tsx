import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Package } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Config
import { Colors, Typography } from '@/theme/tokens';
import { mockDriver, mockTodayStats, mockActiveDelivery, mockDeliveries, mockAvailableJobs } from '@/data/mockData';

// Shared Components
import { StatusBadge, DeliveryCard, StatsRow } from '@/components/shared';
import { AppButton } from '@/components/ui';

// Location Hook
import { useDriverLocation } from '@/hooks/useDriverLocation';

// Assume these routes exist in upcoming router setup
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { TabParamList } from '@/navigation/TabNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'HomeTab'>,
    NativeStackNavigationProp<MainStackParamList>
>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { startTracking, stopTracking } = useDriverLocation();

    const [isOnline, setIsOnline] = useState(mockDriver.isOnline);
    const [greeting, setGreeting] = useState('Günaydın');

    // Switch Animation setup
    const toggleAnim = React.useRef(new Animated.Value(isOnline ? 1 : 0)).current;

    useEffect(() => {
        // Set dynamic greeting based on hour
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Günaydın');
        else if (hour >= 12 && hour < 18) setGreeting('İyi Günler');
        else setGreeting('İyi Akşamlar');
    }, []);

    const handleToggleStatus = async () => {
        const nextState = !isOnline;
        setIsOnline(nextState);

        // Trigger location tracking
        if (nextState) {
            await startTracking();
        } else {
            await stopTracking();
        }

        Animated.spring(toggleAnim, {
            toValue: nextState ? 1 : 0,
            useNativeDriver: false,
            bounciness: 0,
            speed: 20,
        }).start();
    };

    // Interpolations for custom sliding switch
    const knobPosition = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    const formatCountdown = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{mockDriver.avatarInitials}</Text>
                        </View>
                        <View>
                            <Text style={styles.greetingText}>{greeting},</Text>
                            <Text style={styles.nameText}>{mockDriver.fullName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
                        <Bell color={Colors.gray} size={24} />
                        <View style={styles.bellBadge} />
                    </TouchableOpacity>
                </View>

                {/* ─── ONLINE/OFFLINE KART ─── */}
                <View style={[styles.statusCard, {
                    backgroundColor: isOnline ? Colors.primaryDim : Colors.surface,
                    borderColor: isOnline ? Colors.primary : Colors.border
                }]}>
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusLabel}>DURUM</Text>
                        <Text style={styles.statusValue}>{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
                        <Text style={styles.statusSubtext}>
                            {isOnline ? `Bugün: ₺${mockTodayStats.earnings}` : 'Görünür değilsin'}
                        </Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.9} onPress={handleToggleStatus} style={styles.switchTrack}>
                        <Animated.View style={[
                            styles.switchKnob,
                            {
                                transform: [{ translateX: knobPosition }],
                                backgroundColor: isOnline ? Colors.primary : Colors.border
                            }
                        ]} />
                    </TouchableOpacity>
                </View>

                {/* ─── BUGÜNKÜ İSTATİSTİKLER ─── */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bugünkü Özet</Text>
                    <StatsRow items={[
                        { label: 'Kazanç', value: `₺${mockTodayStats.earnings}`, icon: <Package color={Colors.primary} size={20} />, trend: '+', trendValue: mockTodayStats.earningsTrend },
                        { label: 'Teslimat', value: mockTodayStats.deliveries.toString(), icon: <Package color={Colors.primary} size={20} />, trend: '+', trendValue: mockTodayStats.deliveriesTrend },
                        { label: 'Saat', value: `${mockTodayStats.hoursOnline}s`, icon: <Package color={Colors.primary} size={20} /> },
                        { label: 'Puan', value: `${mockTodayStats.rating}★`, icon: <Package color={Colors.primary} size={20} /> },
                    ]} />
                </View>

                {/* ─── AKTİF TESLİMAT BANNER ─── */}
                <View style={[styles.section, { marginTop: 12 }]}>
                    {mockActiveDelivery ? (
                        <View style={styles.activeDeliveryCard}>
                            <View style={styles.activeHeader}>
                                <Text style={styles.activeHeaderTitle}>Aktif Teslimat</Text>
                                <StatusBadge status={mockActiveDelivery.status} size="sm" showDot />
                            </View>
                            <Text style={styles.activeCustomer}>{mockActiveDelivery.customerName}</Text>
                            <Text style={styles.activeRoute} numberOfLines={1} ellipsizeMode="tail">
                                {mockActiveDelivery.pickupAddress.split(',')[0]} → {mockActiveDelivery.deliveryAddress.split(',')[0]}
                            </Text>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${(mockActiveDelivery.progress || 0) * 100}%` }]} />
                                </View>
                                <Text style={styles.progressText}>
                                    %{(mockActiveDelivery.progress || 0) * 100} Tamamlandı · {mockActiveDelivery.estimatedTime} kaldı
                                </Text>
                            </View>

                            <AppButton
                                variant="primary"
                                size="sm"
                                title="Devam Et"
                                onPress={() => navigation.navigate('ActiveDelivery', {})}
                            />
                        </View>
                    ) : (
                        <View style={styles.activeDeliveryCard}>
                            <Text style={styles.emptyStateText}>Aktif teslimat yok</Text>
                        </View>
                    )}
                </View>

                {/* ─── YAKINDAKİ İŞLER ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Yakınındaki İşler</Text>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('JobsTab')}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobsScroll}>
                        {mockAvailableJobs.slice(0, 3).map((job) => (
                            <View key={job.id} style={styles.jobCard}>
                                <Package color={Colors.primary} size={20} style={styles.jobIcon} />
                                <Text style={styles.jobPrice}>{job.price}</Text>
                                <Text style={styles.jobDistance}>{job.distance} mesafe</Text>
                                <Text style={[styles.jobCountdown, { color: job.expiresIn < 60 ? Colors.error : Colors.warning }]}>
                                    {formatCountdown(job.expiresIn)}
                                </Text>
                                <View style={styles.jobFooter}>
                                    <AppButton variant="outline" size="sm" title="Al" fullWidth onPress={() => { }} />
                                </View>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* ─── LİDERLİK DURUMU WIDGET'I ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Liderlik Durumu</Text>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('Leaderboard' as any)}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.leaderboardWidget}>
                        <View style={styles.leaderboardLeft}>
                            <Text style={styles.leaderboardRankText}>#4</Text>
                            <Text style={styles.leaderboardPeriodText}>Bu Hafta</Text>
                        </View>

                        <View style={styles.leaderboardDivider} />

                        <View style={styles.leaderboardRight}>
                            <Text style={styles.leaderboardItemText}>1. Ali K.    4.98 ⭐</Text>
                            <Text style={styles.leaderboardItemText}>2. Zeynep T. 4.95 ⭐</Text>
                            <Text style={styles.leaderboardItemText}>3. Mehmet S. 4.92 ⭐</Text>
                            <View style={styles.leaderboardMyRankBox}>
                                <Text style={styles.leaderboardMyRankText}>4. Sen   4.80 ⭐</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── SON TESLİMATLAR ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Son Teslimatlar</Text>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('HistoryTab')}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>
                    {mockDeliveries.slice(0, 3).map(delivery => (
                        <DeliveryCard
                            key={delivery.id}
                            {...delivery}
                            onPress={() => navigation.navigate('ActiveDelivery', { id: delivery.id })}
                        />
                    ))}
                </View>

                {/* Bottom Padding for scroll area */}
                <View style={styles.bottomSpacer} />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.primary,
    },
    greetingText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    nameText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    bellButton: {
        position: 'relative',
        padding: 4,
    },
    bellBadge: {
        position: 'absolute',
        top: 4,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    statusCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusLeft: {
        gap: 4,
    },
    statusLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
    },
    statusValue: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    statusSubtext: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    switchTrack: {
        width: 44,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    switchKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
        marginBottom: 12,
    },
    seeAllText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.primary,
    },
    activeDeliveryCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeHeaderTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 13,
        color: Colors.gray,
    },
    activeCustomer: {
        fontFamily: Typography.fontDisplay,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 4,
    },
    activeRoute: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 16,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    cardTime: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
    },
    jobIcon: {
        marginBottom: 8,
    },
    jobFooter: {
        marginTop: 'auto',
        paddingTop: 12,
    },
    bottomSpacer: {
        height: 80,
    },
    progressText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    emptyStateText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        paddingVertical: 20,
    },
    jobsScroll: {
        gap: 12,
    },
    jobCard: {
        width: 160,
        backgroundColor: Colors.card,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    jobPrice: {
        fontFamily: Typography.fontDisplay,
        fontSize: 18,
        color: Colors.primary,
        marginBottom: 4,
    },
    jobDistance: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 8,
    },
    jobCountdown: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 12,
    },
    leaderboardWidget: {
        backgroundColor: '#242424',
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        flexDirection: 'row',
        alignItems: 'center',
    },
    leaderboardLeft: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 80,
    },
    leaderboardRankText: {
        fontFamily: Typography.fontDisplay,
        fontWeight: '800',
        fontSize: 36,
        color: Colors.primary,
    },
    leaderboardPeriodText: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: '#8A8A8A',
        marginTop: 4,
    },
    leaderboardDivider: {
        width: 1,
        height: 48,
        backgroundColor: '#2A2A2A',
        marginHorizontal: 16,
    },
    leaderboardRight: {
        flex: 1,
        justifyContent: 'center',
    },
    leaderboardItemText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: '#8A8A8A',
        marginBottom: 2,
    },
    leaderboardMyRankBox: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,215,0,0.2)',
        borderRadius: 8,
        paddingVertical: 4,
        paddingHorizontal: 8,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    leaderboardMyRankText: {
        fontFamily: Typography.fontBody,
        fontWeight: '500',
        fontSize: 12,
        color: Colors.primary,
    },
});
