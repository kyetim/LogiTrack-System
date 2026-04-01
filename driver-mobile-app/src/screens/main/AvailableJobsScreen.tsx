import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, StyleSheet, RefreshControl, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Package, Clock, Navigation, Truck } from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { api } from '../../../services/api';
import { AppButton } from '@/components/ui';
import { useAppDispatch } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';

type SortType = 'distance' | 'date';

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
    const dispatch = useAppDispatch();

    // State
    const [sortBy, setSortBy] = useState<SortType>('distance');
    const [jobs, setJobs] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const loadJobs = async () => {
        try {
            const data = await api.getNearbyShipments(100); // 100km radius
            setJobs(data);
        } catch (error) {
            console.error('Failed to load nearby shipments', error);
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadJobs();
        }, [])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadJobs();
    }, []);

    const handleAcceptJob = (jobId: string, trackingNumber: string) => {
        Alert.alert(
            "Seferi Üstlen",
            `${trackingNumber} numaralı yükü almak istediğinize emin misiniz?`,
            [
                { text: "İptal", style: "cancel" },
                {
                    text: "Evet, Üstlen",
                    style: "default",
                    onPress: async () => {
                        try {
                            await api.acceptShipment(jobId);
                            // Refresh assigned shipments in Redux
                            await dispatch(fetchShipments()).unwrap();
                            // Navigate to active delivery list
                            setJobs(prev => prev.filter(j => j.id !== jobId));
                            navigation.navigate('HomeTab');
                        } catch (error: any) {
                            Alert.alert('Hata', error.response?.data?.message || 'Sefer alınamadı.');
                        }
                    }
                }
            ]
        );
    };

    // ─── DERIVED DATA ───
    const sortedJobs = useMemo(() => {
        return [...jobs].sort((a, b) => {
            if (sortBy === 'distance') {
                return (a.distance_meters || 0) - (b.distance_meters || 0); // Low to high
            }
            if (sortBy === 'date') {
                const dateA = new Date(a.createdAt).getTime();
                const dateB = new Date(b.createdAt).getTime();
                return dateB - dateA; // Newest first
            }
            return 0;
        });
    }, [jobs, sortBy]);

    const formatDistance = (meters?: number) => {
        if (!meters) return 'Bilinmiyor';
        return meters > 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`;
    };

    if (initialLoading) {
        return (
            <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Müsait Yükler</Text>
                <View style={styles.headerSubRow}>
                    <Text style={styles.jobCountText}>{jobs.length} yük mevcut</Text>
                    <View style={styles.locationChip}>
                        <Truck color={Colors.primary} size={14} />
                        <Text style={styles.locationText}>Lojistik Ağı</Text>
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
                    {(['distance', 'date'] as SortType[]).map((sortOpt) => {
                        const isActive = sortBy === sortOpt;
                        const label = sortOpt === 'distance' ? 'En Yakın' : 'En Yeni';

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
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={Colors.primary}
                        colors={[Colors.primary]}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Package color={Colors.grayDim} size={48} />
                        <Text style={styles.emptyTitle}>Yakınınızda müsait yük yok</Text>
                        <Text style={styles.emptySubtitle}>Bölgene yeni seferler düştüğünde burada listelenecektir.</Text>
                    </View>
                }
                renderItem={({ item }) => {
                    return (
                        <View style={styles.jobCard}>

                            {/* Üst satır */}
                            <View style={styles.cardHeader}>
                                <Text style={styles.customerName}>Takip No: {item.trackingNumber}</Text>
                                <Text style={styles.jobPrice}>Sözleşmeli</Text>
                            </View>

                            {/* Rota satırı (kompakt) */}
                            <View style={styles.compactRoute}>
                                <Text style={styles.routeText} numberOfLines={1}>{item.origin.split(',')[0]}</Text>
                                <View style={styles.routeDistanceChip}>
                                    <Text style={styles.routeDistanceText}>→</Text>
                                </View>
                                <Text style={styles.routeText} numberOfLines={1}>{item.destination.split(',')[0]}</Text>
                            </View>

                            {/* Bilgi satırı */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoChip}>
                                    <Navigation color={Colors.primary} size={12} />
                                    <Text style={styles.infoChipText}>Alım Noktası: {formatDistance(item.distance_meters)}</Text>
                                </View>
                                <View style={styles.infoChip}>
                                    <Clock color={Colors.gray} size={12} />
                                    <Text style={styles.infoChipText}>
                                        {item.estimatedArrival ? new Date(item.estimatedArrival).toLocaleDateString() : 'Belirtilmedi'}
                                    </Text>
                                </View>
                            </View>

                            {/* Alt Eylem Butonları */}
                            <View style={styles.actionRow}>
                                <View style={styles.jobInfoLeft}>
                                    <AppButton
                                        variant="outline"
                                        title="Sefer Detayı"
                                        size="sm"
                                        fullWidth
                                        onPress={() => navigation.navigate('JobDetail', { id: item.id })}
                                    />
                                </View>
                                <View style={styles.jobInfoRight}>
                                    <AppButton
                                        variant="primary"
                                        title="Seferi Üstlen"
                                        size="sm"
                                        fullWidth
                                        onPress={() => handleAcceptJob(item.id, item.trackingNumber)}
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
