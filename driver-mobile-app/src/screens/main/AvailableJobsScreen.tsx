import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Package, Clock, Navigation } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { mockAvailableJobs } from '@/data/mockData';
import { AppButton } from '@/components/ui';

type SortType = 'distance' | 'price' | 'time';

import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { TabParamList } from '@/navigation/TabNavigator';

type ScreenNavProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'JobsTab'>,
    NativeStackNavigationProp<MainStackParamList>
>;

export const AvailableJobsScreen = () => {
    const navigation = useNavigation<ScreenNavProp>();

    // State
    const [sortBy, setSortBy] = useState<SortType>('distance');
    const [jobs, setJobs] = useState(mockAvailableJobs);
    const [refreshing, setRefreshing] = useState(false);

    // ─── EFFECTS ───
    useEffect(() => {
        const timer = setInterval(() => {
            setJobs(prevJobs => {
                return prevJobs
                    .map(j => ({ ...j, expiresIn: j.expiresIn - 1 }))
                    .filter(j => j.expiresIn > 0);
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    // ─── ACTIONS ───
    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            // Restore mocked original state and give them random new times for effect
            const refreshedJobs = mockAvailableJobs.map(j => ({ ...j, expiresIn: j.expiresIn + Math.floor(Math.random() * 60) }));
            setJobs(refreshedJobs);
            setRefreshing(false);
        }, 1000);
    }, []);

    const handleAcceptJob = (jobId: string, customerName: string) => {
        Alert.alert(
            "İşi Kabul Et",
            `${customerName} müşterisine ait teslimatı almak istediğinize emin misiniz?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Evet, Al",
                    style: "default",
                    onPress: () => {
                        // Remove accepted job locally
                        setJobs(prev => prev.filter(j => j.id !== jobId));
                        // In real app: API call here then navigate to ActiveDelivery
                    }
                }
            ]
        );
    };

    // ─── DERIVED DATA ───
    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => {
            if (sortBy === 'price') {
                const priceA = parseInt(a.price.replace('₺', ''), 10);
                const priceB = parseInt(b.price.replace('₺', ''), 10);
                return priceB - priceA; // High to low
            }
            if (sortBy === 'distance') {
                const distA = parseFloat(a.pickupDistance.replace(' km', ''));
                const distB = parseFloat(b.pickupDistance.replace(' km', ''));
                return distA - distB; // Low to high
            }
            if (sortBy === 'time') {
                const timeA = parseInt(a.estimatedTime.replace(' dk', ''), 10);
                const timeB = parseInt(b.estimatedTime.replace(' dk', ''), 10);
                return timeA - timeB; // Low to high
            }
            return 0;
        });
    }, [jobs, sortBy]);

    // ─── RENDER HELPERS ───
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Müsait İşler</Text>
                <View style={styles.headerSubRow}>
                    <Text style={styles.jobCountText}>{jobs.length} iş mevcut</Text>
                    <View style={styles.locationChip}>
                        <MapPin color={Colors.primary} size={12} />
                        <Text style={styles.locationText}>Kadıköy, İstanbul</Text>
                    </View>
                </View>
            </View>

            {/* ─── SIRALAMA ÇİPLERİ ─── */}
            <View style={styles.filterSection}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScroll}
                >
                    {(['distance', 'price', 'time'] as SortType[]).map((sortOpt) => {
                        const isActive = sortBy === sortOpt;
                        const label = sortOpt === 'distance' ? 'Mesafe' : (sortOpt === 'price' ? 'Ücret' : 'Süre');

                        return (
                            <TouchableOpacity
                                key={sortOpt}
                                activeOpacity={0.8}
                                onPress={() => setSortBy(sortOpt)}
                                style={[styles.filterChip, isActive && styles.activeFilterChip]}
                            >
                                <Text style={[styles.filterText, isActive && styles.activeFilterText]}>
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* ─── İŞ KARTLARI LİSTESİ ─── */}
            <FlatList
                data={sortedJobs}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                getItemLayout={(data, index) => ({
                    length: 180,
                    offset: 180 * index,
                    index,
                })}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]} // Android
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Package color={Colors.grayDim} size={48} />
                        <Text style={styles.emptyTitle}>Şu an müsait iş yok</Text>
                        <Text style={styles.emptySubtitle}>Bölgene yeni işler düştüğünde burada görünecek.</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    const isUrgent = item.expiresIn <= 60;

                    return (
                        <View style={[styles.jobCard, isUrgent && styles.jobCardUrgent]}>

                            {/* Üst satır */}
                            <View style={styles.cardHeader}>
                                <Text style={styles.customerName}>{item.customerName}</Text>
                                <Text style={styles.jobPrice}>{item.price}</Text>
                            </View>

                            {/* Rota satırı (kompakt) */}
                            <View style={styles.compactRoute}>
                                <Text style={styles.routeText} numberOfLines={1}>{item.pickupAddress.split(',')[0]}</Text>
                                <View style={styles.routeDistanceChip}>
                                    <Text style={styles.routeDistanceText}>{item.distance}</Text>
                                </View>
                                <Text style={styles.routeText} numberOfLines={1}>{item.deliveryAddress.split(',')[0]}</Text>
                            </View>

                            {/* Bilgi satırı */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoChip}>
                                    <Navigation color={Colors.primary} size={12} />
                                    <Text style={styles.infoChipText}>{item.pickupDistance} uzakta</Text>
                                </View>
                                <View style={styles.infoChip}>
                                    <Clock color={Colors.gray} size={12} />
                                    <Text style={styles.infoChipText}>{item.estimatedTime}</Text>
                                </View>
                                <View style={styles.infoChip}>
                                    <Package color={Colors.gray} size={12} />
                                    <Text style={styles.infoChipText}>{item.packageType}</Text>
                                </View>
                            </View>

                            {/* Geri sayım satırı */}
                            <View style={styles.countdownRow}>
                                {isUrgent ? (
                                    <Text style={[styles.countdownText, { color: Colors.error }]}>
                                        ⚡ Son {item.expiresIn} saniye!
                                    </Text>
                                ) : (
                                    <Text style={[styles.countdownText, { color: Colors.gray }]}>
                                        ⏳ {formatTime(item.expiresIn)} kaldı
                                    </Text>
                                )}
                            </View>

                            {/* Alt Eylem Butonları */}
                            <View style={styles.actionRow}>
                                <View style={styles.jobInfoLeft}>
                                    <AppButton
                                        variant="outline"
                                        title="Detay"
                                        size="sm"
                                        fullWidth
                                        onPress={() => navigation.navigate('JobDetail', { id: item.id })}
                                    />
                                </View>
                                <View style={styles.jobInfoRight}>
                                    <AppButton
                                        variant="primary"
                                        title="Hemen Al"
                                        size="sm"
                                        fullWidth
                                        onPress={() => handleAcceptJob(item.id, item.customerName)}
                                    />
                                </View>
                            </View>
                        </View>
                    );
                }}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 20,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 22,
        color: Colors.white,
        marginBottom: 8,
    },
    headerSubRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    jobCountText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    locationChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    locationText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.white,
    },
    jobMetaIcon: {
        marginRight: 4,
    },
    jobInfoLeft: {
        flex: 1,
        marginRight: 8,
    },
    jobInfoRight: {
        flex: 2,
    },
    filterSection: {
        marginBottom: 16,
    },
    filterScroll: {
        paddingHorizontal: 16,
        gap: 8,
    },
    filterChip: {
        backgroundColor: Colors.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeFilterChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    activeFilterText: {
        fontFamily: Typography.fontDisplay,
        color: '#000',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    jobCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    jobCardUrgent: {
        borderColor: Colors.error,
        backgroundColor: 'rgba(255, 82, 82, 0.03)', // Subtle red tint
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    customerName: {
        fontFamily: Typography.fontDisplay,
        fontSize: 15,
        color: Colors.white,
    },
    jobPrice: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.primary,
    },
    compactRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        backgroundColor: Colors.background, // Nested darker background
        padding: 8,
        borderRadius: 8,
    },
    routeText: {
        flex: 1,
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.white,
        textAlign: 'center',
    },
    routeDistanceChip: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginHorizontal: 8,
    },
    routeDistanceText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
    },
    infoRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    infoChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    infoChipText: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.gray,
    },
    countdownRow: {
        marginBottom: 16,
        alignItems: 'center',
    },
    countdownText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 64,
    },
    emptyTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        textAlign: 'center',
        paddingHorizontal: 32,
    },
});
