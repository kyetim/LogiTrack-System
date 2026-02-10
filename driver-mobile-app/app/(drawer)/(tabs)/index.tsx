import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSelector, useAppDispatch } from '../../../store';
import { COLORS } from '../../../utils/constants';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../../constants/theme';
import { setConnected, setError, startTracking, stopTracking } from '../../../store/slices/locationSlice';
import { startLocationTracking, stopLocationTracking } from '../../../services/locationTracking';
import { TransitCard } from '../../../components/ui/TransitCard';
import { StatBlock } from '../../../components/ui/StatBlock';

export default function DashboardScreen() {
    const dispatch = useAppDispatch();
    const { user, driver } = useAppSelector((state) => state.auth);
    const { isTracking, currentLocation, isConnected, lastUpdate } = useAppSelector((state) => state.location);
    const { shipments } = useAppSelector((state) => state.shipments);

    const todayShipments = shipments.filter(s =>
        new Date(s.createdAt).toDateString() === new Date().toDateString()
    );

    const pendingShipments = shipments.filter(s => s.status === 'PENDING');
    const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT');
    const deliveredToday = shipments.filter(s =>
        s.status === 'DELIVERED' &&
        new Date(s.updatedAt).toDateString() === new Date().toDateString()
    );

    // Find next delivery (lowest sequence among PENDING/IN_TRANSIT)
    const nextDelivery = [...pendingShipments, ...inTransitShipments]
        .filter(s => s.sequence)
        .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))[0];

    const handleToggleTracking = async () => {
        if (isTracking) {
            const stopped = await stopLocationTracking();
            if (stopped) {
                dispatch(stopTracking());
            } else {
                Alert.alert('Hata', 'Takip durdurulamadı');
            }
        } else {
            const started = await startLocationTracking();
            if (started) {
                dispatch(startTracking());
            } else {
                Alert.alert(
                    'İzin Gerekli',
                    'GPS takibi için konum izni gerekiyor. Lütfen ayarlardan konum iznini açın.',
                    [{ text: 'Tamam' }]
                );
            }
        }
    };

    const getLastUpdateText = () => {
        if (!lastUpdate) return 'Güncelleme bekleniyor';
        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / 1000);
        if (diff < 60) return `${diff} sn önce`;
        if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
        return `${Math.floor(diff / 3600)} sa önce`;
    };

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* 1. Header with Gradient */}
            <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <View style={styles.headerTop}>
                    <View>
                        <Text style={styles.greeting}>İyi günler,</Text>
                        <Text style={styles.driverName}>{user?.email?.split('@')[0] || 'Sürücü'}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBadge}>
                        <View style={[styles.statusDot, { backgroundColor: isTracking ? Colors.success : Colors.danger }]} />
                        <Text style={styles.statusBadgeText}>
                            {isTracking ? 'AKTİF' : 'PASİF'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 2. Quick Stat Row Overlay */}
                <View style={styles.headerStats}>
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>{todayShipments.length}</Text>
                        <Text style={styles.headerStatLabel}>BUGÜN</Text>
                    </View>
                    <View style={styles.headerStatDivider} />
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>4.8</Text>
                        <Text style={styles.headerStatLabel}>PUAN</Text>
                    </View>
                    <View style={styles.headerStatDivider} />
                    <View style={styles.headerStatItem}>
                        <Text style={styles.headerStatValue}>12k</Text>
                        <Text style={styles.headerStatLabel}>KM</Text>
                    </View>
                </View>
            </LinearGradient>

            {/* 3. Next Delivery Hero Area */}
            <View style={styles.content}>
                {nextDelivery ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sıradaki Teslimat</Text>
                        <TransitCard
                            statusBorder={Colors.success}
                            style={styles.nextDeliveryCard}
                            onPress={() => Alert.alert('Detay', 'Sevkiyat detayına gidiliyor...')}
                        >
                            <View style={styles.nextDeliveryHeader}>
                                <View style={styles.sequenceIcon}>
                                    <Text style={styles.sequenceText}>{nextDelivery.sequence}</Text>
                                </View>
                                <View>
                                    <Text style={styles.trackingNo}>{nextDelivery.trackingNumber}</Text>
                                    <Text style={styles.urgentLabel}>EKSPRES TESLİMAT</Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.gray400} style={{ marginLeft: 'auto' }} />
                            </View>

                            <View style={styles.deliveryPath}>
                                <View style={styles.pathIconContainer}>
                                    <MaterialCommunityIcons name="circle-outline" size={16} color={Colors.success} />
                                    <View style={styles.pathLine} />
                                    <MaterialCommunityIcons name="map-marker" size={18} color={Colors.danger} />
                                </View>
                                <View style={styles.pathTextContainer}>
                                    <Text style={styles.pathPoint} numberOfLines={1}>{nextDelivery.origin}</Text>
                                    <View style={{ height: 20 }} />
                                    <Text style={[styles.pathPoint, styles.pathPointEnd]} numberOfLines={2}>
                                        {nextDelivery.destination}
                                    </Text>
                                </View>
                            </View>
                        </TransitCard>
                    </View>
                ) : (
                    <TransitCard style={styles.emptyCard}>
                        <MaterialCommunityIcons name="package-variant" size={48} color={Colors.gray300} />
                        <Text style={styles.emptyText}>Bekleyen aktif sevkiyatınız bulunmuyor.</Text>
                    </TransitCard>
                )}

                {/* 4. Location Tracking Control */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Konum Servisleri</Text>
                    <TransitCard style={styles.trackingCard}>
                        <View style={styles.trackingRow}>
                            <View style={[styles.iconBox, { backgroundColor: isTracking ? Colors.success + '20' : Colors.gray100 }]}>
                                <MaterialCommunityIcons
                                    name={isTracking ? "crosshairs-gps" : "crosshairs-off"}
                                    size={28}
                                    color={isTracking ? Colors.success : Colors.gray400}
                                />
                            </View>
                            <View style={styles.trackingTextContainer}>
                                <Text style={styles.trackingTitle}>
                                    Canlı Takip {isTracking ? 'Açık' : 'Kapalı'}
                                </Text>
                                <Text style={styles.trackingSubtitle}>
                                    {isTracking ? `Son Sinyal: ${getLastUpdateText()}` : 'Bağlantı pasif durumda'}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={[styles.toggleButton, isTracking ? styles.toggleActive : styles.toggleInactive]}
                                onPress={handleToggleTracking}
                            >
                                <Text style={styles.toggleButtonText}>
                                    {isTracking ? 'DURDUR' : 'BAŞLAT'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </TransitCard>
                </View>

                {/* 5. Stats Grid */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Bugün Özeti</Text>
                    <View style={styles.statsGrid}>
                        <StatBlock
                            icon="clock-fast"
                            value={pendingShipments.length}
                            label="BEKLEYEN"
                            color={Colors.warning}
                        />
                        <View style={{ width: Spacing.md }} />
                        <StatBlock
                            icon="truck-delivery"
                            value={deliveredToday.length}
                            label="TESLİM"
                            color={Colors.success}
                        />
                    </View>
                </View>

                {/* 6. Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
                    <View style={styles.actionsGrid}>
                        {[
                            { icon: 'qrcode-scan', label: 'Barkod Okut', color: '#6366f1' },
                            { icon: 'message-text', label: 'Destek', color: '#ec4899' },
                            { icon: 'file-document', label: 'Evraklar', color: '#06b6d4' },
                            { icon: 'phone', label: 'Merkez', color: '#10b981' }
                        ].map((action, idx) => (
                            <TouchableOpacity key={idx} style={styles.actionItem}>
                                <View style={[styles.actionIcon, { backgroundColor: action.color + '15' }]}>
                                    <MaterialCommunityIcons name={action.icon as any} size={24} color={action.color} />
                                </View>
                                <Text style={styles.actionLabel}>{action.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ height: Spacing.xxl }} />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: Spacing.md,
        borderBottomLeftRadius: BorderRadius.xxl,
        borderBottomRightRadius: BorderRadius.xxl,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: Typography.base,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: Typography.medium,
    },
    driverName: {
        fontSize: Typography.xl,
        color: Colors.white,
        fontWeight: Typography.bold,
        marginTop: 2,
        textTransform: 'capitalize',
    },
    profileBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusBadgeText: {
        color: Colors.white,
        fontSize: 10,
        fontWeight: Typography.bold,
        letterSpacing: 1,
    },
    headerStats: {
        flexDirection: 'row',
        backgroundColor: Colors.white,
        marginTop: 25,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        ...Shadows.md,
    },
    headerStatItem: {
        flex: 1,
        alignItems: 'center',
    },
    headerStatValue: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    headerStatLabel: {
        fontSize: 10,
        color: Colors.gray500,
        fontWeight: Typography.semibold,
        marginTop: 2,
    },
    headerStatDivider: {
        width: 1,
        height: '60%',
        backgroundColor: Colors.gray200,
        alignSelf: 'center',
    },
    content: {
        marginTop: -10,
    },
    section: {
        marginTop: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.gray900,
        marginLeft: Spacing.md,
        marginBottom: Spacing.sm,
        letterSpacing: 0.5,
    },
    nextDeliveryCard: {
        marginVertical: 0,
        padding: Spacing.lg,
    },
    nextDeliveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    sequenceIcon: {
        width: 40,
        height: 40,
        backgroundColor: Colors.success,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    sequenceText: {
        color: Colors.white,
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
    },
    trackingNo: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    urgentLabel: {
        fontSize: 10,
        color: Colors.danger,
        fontWeight: Typography.bold,
        marginTop: 2,
    },
    deliveryPath: {
        flexDirection: 'row',
    },
    pathIconContainer: {
        alignItems: 'center',
        marginRight: Spacing.md,
        paddingTop: 2,
    },
    pathLine: {
        width: 1,
        height: 30,
        backgroundColor: Colors.gray200,
        marginVertical: 4,
    },
    pathTextContainer: {
        flex: 1,
    },
    pathPoint: {
        fontSize: Typography.base,
        color: Colors.gray800,
        fontWeight: Typography.medium,
    },
    pathPointEnd: {
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    emptyCard: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 15,
        color: Colors.gray500,
        textAlign: 'center',
        fontSize: Typography.base,
    },
    trackingCard: {
        marginVertical: 0,
    },
    trackingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    trackingTextContainer: {
        flex: 1,
    },
    trackingTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    trackingSubtitle: {
        fontSize: Typography.sm,
        color: Colors.gray500,
        marginTop: 2,
    },
    toggleButton: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    toggleActive: {
        backgroundColor: Colors.danger,
    },
    toggleInactive: {
        backgroundColor: Colors.success,
    },
    toggleButtonText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: Typography.bold,
    },
    statsGrid: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: Spacing.sm,
    },
    actionItem: {
        width: '25%',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    actionIcon: {
        width: 55,
        height: 55,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 11,
        color: Colors.gray700,
        fontWeight: Typography.medium,
    },
});
