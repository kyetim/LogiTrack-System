import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchGeofenceEvents } from '../../../store/slices/geofencingSlice';
import { AvailabilityToggle } from '../../../components/availability/AvailabilityToggle';
import { updateAvailability } from '../../../store/slices/availabilitySlice';
import { PerformanceMetricCard } from '../../../components/profile/PerformanceMetricCard';
import { ActivityTimelineItem } from '../../../components/profile/ActivityTimelineItem';
import { TransitCard } from '../../../components/ui/TransitCard';
import { Colors, Spacing, Typography, BorderRadius, Shadows } from '../../../constants/theme';
import { AvailabilityStatus } from '../../../types';

export default function ProfileScreen() {
    const dispatch = useAppDispatch();
    const { events, isLoading: geofencingLoading } = useAppSelector((state) => state.geofencing);
    const { status, isUpdating } = useAppSelector((state) => state.availability);
    const driver = useAppSelector((state) => state.auth.driver);
    const user = useAppSelector((state) => state.auth.user);
    const shipments = useAppSelector((state) => state.shipments.shipments);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchGeofenceEvents(20));
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchGeofenceEvents(20));
        setRefreshing(false);
    };

    const handleStatusChange = (newStatus: AvailabilityStatus) => {
        dispatch(updateAvailability(newStatus));
    };

    // Calculate performance metrics from shipments
    const performanceMetrics = useMemo(() => {
        const deliveredShipments = shipments.filter(s => s.status === 'DELIVERED');
        const totalDeliveries = deliveredShipments.length;

        // Calculate on-time rate (placeholder logic - would need actual delivery time data)
        const onTimeRate = totalDeliveries > 0 ? 92 : 0; // Mock data

        // Calculate total distance (would need route data)
        const totalDistance = totalDeliveries * 45; // Mock: 45km average per delivery

        return {
            totalDeliveries,
            onTimeRate,
            totalDistance,
            rating: 4.8, // Mock rating until backend scoring is implemented
        };
    }, [shipments]);

    const displayName = user?.email?.split('@')[0] || 'Sürücü';

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={Colors.primary}
                />
            }
            bounces={true}
        >
            {/* Premium Header */}
            <LinearGradient
                colors={[Colors.gray900, '#0f172a']}
                style={styles.header}
            >
                <View style={styles.headerContent}>
                    <LinearGradient
                        colors={[Colors.primary, Colors.primaryDark]}
                        style={styles.avatar}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Text style={styles.avatarText}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    </LinearGradient>

                    <View style={styles.headerInfo}>
                        <Text style={styles.driverName}>{displayName}</Text>
                        <Text style={styles.driverTitle}>Professional Driver</Text>
                    </View>

                    <View style={styles.ratingBadge}>
                        <MaterialCommunityIcons name="star" size={16} color={Colors.warning} />
                        <Text style={styles.ratingText}>{performanceMetrics.rating}</Text>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Performance Overview */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📊 Performans Özeti</Text>
                    <PerformanceMetricCard
                        icon="package-variant-closed"
                        label="Toplam Teslimat"
                        value={performanceMetrics.totalDeliveries}
                        color={Colors.primary}
                    />
                    <PerformanceMetricCard
                        icon="clock-check-outline"
                        label="Zamanında Teslimat"
                        value={`${performanceMetrics.onTimeRate}%`}
                        subValue={`${Math.round(performanceMetrics.totalDeliveries * performanceMetrics.onTimeRate / 100)} / ${performanceMetrics.totalDeliveries} teslimat`}
                        color={Colors.success}
                    />
                    <PerformanceMetricCard
                        icon="map-marker-distance"
                        label="Toplam Mesafe"
                        value={`${performanceMetrics.totalDistance} km`}
                        color={Colors.info}
                    />
                </View>

                {/* Driver Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>👤 Sürücü Bilgileri</Text>
                    <TransitCard style={styles.infoCard}>
                        <InfoRow
                            icon="identifier"
                            label="Sürücü ID"
                            value={driver?.id?.substring(0, 8) || '-'}
                        />
                        <InfoRow
                            icon="card-account-details"
                            label="Ehliyet No"
                            value={driver?.licenseNumber || '-'}
                        />
                        <InfoRow
                            icon="car"
                            label="Araç"
                            value={driver?.vehicle?.plateNumber || 'Atanmamış'}
                            isLast
                        />
                    </TransitCard>
                </View>

                {/* Availability Status */}
                <View style={styles.section}>
                    <AvailabilityToggle
                        currentStatus={status}
                        onStatusChange={handleStatusChange}
                        disabled={isUpdating}
                    />
                </View>

                {/* Recent Activity Timeline */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📍 Son Aktiviteler</Text>

                    {geofencingLoading && events.length === 0 ? (
                        <View style={styles.centerContent}>
                            <ActivityIndicator color={Colors.primary} style={styles.loader} />
                        </View>
                    ) : events.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons
                                name="map-marker-outline"
                                size={64}
                                color={Colors.gray300}
                            />
                            <Text style={styles.emptyText}>Henüz bölge hareketi yok</Text>
                        </View>
                    ) : (
                        <View style={styles.timelineContainer}>
                            {events.slice(0, 10).map((event, index) => (
                                <ActivityTimelineItem
                                    key={event.id}
                                    event={event}
                                    isLast={index === Math.min(events.length - 1, 9)}
                                />
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}

interface InfoRowProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string;
    isLast?: boolean;
}

function InfoRow({ icon, label, value, isLast }: InfoRowProps) {
    return (
        <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
            <View style={styles.infoLeft}>
                <MaterialCommunityIcons name={icon} size={20} color={Colors.gray400} />
                <Text style={styles.infoLabel}>{label}</Text>
            </View>
            <Text style={styles.infoValue}>{value}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    contentContainer: {
        paddingBottom: Spacing.xxl,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 32,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.md,
    },
    avatarText: {
        fontSize: Typography.xxxl,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    headerInfo: {
        flex: 1,
        marginLeft: Spacing.lg,
    },
    driverName: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.white,
        marginBottom: 2,
    },
    driverTitle: {
        fontSize: Typography.sm,
        color: Colors.gray300,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    ratingText: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    content: {
        padding: Spacing.lg,
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.gray900,
        marginBottom: Spacing.md,
    },
    infoCard: {
        padding: 0,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
    },
    infoRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    infoLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    infoLabel: {
        fontSize: Typography.base,
        color: Colors.gray600,
    },
    infoValue: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.gray900,
    },
    timelineContainer: {
        marginTop: Spacing.sm,
    },
    centerContent: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    loader: {
        paddingVertical: Spacing.xl,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Spacing.xxxl,
    },
    emptyText: {
        fontSize: Typography.base,
        color: Colors.gray500,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});
