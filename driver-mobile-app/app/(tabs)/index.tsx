import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store';
import { COLORS } from '../../utils/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { startTracking, stopTracking, setConnected, setError } from '../../store/slices/locationSlice';
import { setUseMQTT } from '../../store/slices/configSlice';
import websocketService from '../../services/websocket';
import { startLocationTracking, stopLocationTracking } from '../../services/locationTracking';

export default function DashboardScreen() {
    const dispatch = useAppDispatch();
    const { user, driver } = useAppSelector((state) => state.auth);
    const { isTracking, currentLocation, isConnected, lastUpdate } = useAppSelector((state) => state.location);
    const { shipments } = useAppSelector((state) => state.shipments);
    const { useMQTT } = useAppSelector((state) => state.config);

    // Connect WebSocket on mount
    useEffect(() => {
        const connectWebSocket = async () => {
            const connected = await websocketService.connect();
            dispatch(setConnected(connected));
        };

        connectWebSocket();

        return () => {
            websocketService.disconnect();
        };
    }, [dispatch]);

    const todayShipments = shipments.filter(s =>
        new Date(s.createdAt).toDateString() === new Date().toDateString()
    );

    const pendingShipments = shipments.filter(s => s.status === 'PENDING');
    const inTransitShipments = shipments.filter(s => s.status === 'IN_TRANSIT');
    const deliveredToday = shipments.filter(s =>
        s.status === 'DELIVERED' &&
        new Date(s.updatedAt).toDateString() === new Date().toDateString()
    );

    const handleToggleTracking = async () => {
        if (isTracking) {
            // Stop tracking
            const stopped = await stopLocationTracking();
            if (stopped) {
                dispatch(stopTracking());
            } else {
                Alert.alert('Hata', 'Takip durdurulamadı');
            }
        } else {
            // Start tracking
            if (!isConnected) {
                Alert.alert(
                    'Bağlantı Hatası',
                    'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.',
                    [{ text: 'Tamam' }]
                );
                return;
            }

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
        if (!lastUpdate) return 'Henüz güncelleme yok';

        const now = new Date();
        const diff = Math.floor((now.getTime() - new Date(lastUpdate).getTime()) / 1000);

        if (diff < 60) return `${diff} saniye önce`;
        if (diff < 3600) return `${Math.floor(diff / 60)} dakika önce`;
        return `${Math.floor(diff / 3600)} saat önce`;
    };

    const handleToggleMQTT = () => {
        dispatch(setUseMQTT(!useMQTT));
        Alert.alert(
            'Protocol Değiştirildi',
            `${!useMQTT ? 'MQTT' : 'WebSocket'} protokolüne geçildi. Değişikliğin uygulanması için tracking'i durdurup tekrar başlatın.`,
            [{ text: 'Tamam' }]
        );
    };

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Merhaba,</Text>
                    <Text style={styles.driverName}>{driver?.user?.email || user?.email}</Text>
                </View>
                <View style={styles.statusBadge}>
                    <View style={[styles.statusDot, { backgroundColor: driver?.status === 'ON_DUTY' ? COLORS.success : COLORS.textLight }]} />
                    <Text style={styles.statusText}>
                        {driver?.status === 'ON_DUTY' ? 'Görevde' : 'Görev Dışı'}
                    </Text>
                </View>
            </View>

            {/* GPS Tracking Card */}
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primary} />
                    <Text style={styles.cardTitle}>Konum Paylaşımı</Text>
                    <View style={[styles.connectionBadge, { backgroundColor: isConnected ? COLORS.success : COLORS.danger }]}>
                        <Text style={styles.connectionText}>{isConnected ? 'Bağlı' : 'Bağlantı Yok'}</Text>
                    </View>
                </View>
                <View style={styles.trackingInfo}>
                    <Text style={styles.trackingStatus}>
                        {isTracking ? '🟢 Aktif' : '🔴 Pasif'}
                    </Text>
                    {lastUpdate && (
                        <Text style={styles.lastUpdate}>
                            Son güncelleme: {getLastUpdateText()}
                        </Text>
                    )}
                    {currentLocation && (
                        <Text style={styles.coordinates}>
                            {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </Text>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.trackingButton, isTracking && styles.trackingButtonActive]}
                    onPress={handleToggleTracking}
                >
                    <Text style={styles.trackingButtonText}>
                        {isTracking ? 'Takibi Durdur' : 'Takibi Başlat'}
                    </Text>
                </TouchableOpacity>

                {/* MQTT Protocol Toggle */}
                <View style={styles.protocolToggle}>
                    <View style={styles.protocolInfo}>
                        <MaterialCommunityIcons
                            name={useMQTT ? "access-point" : "wifi"}
                            size={20}
                            color={COLORS.textLight}
                        />
                        <Text style={styles.protocolText}>
                            Protocol: {useMQTT ? 'MQTT' : 'WebSocket'}
                        </Text>
                    </View>
                    <Switch
                        value={useMQTT}
                        onValueChange={handleToggleMQTT}
                        disabled={isTracking}
                    />
                </View>
                {isTracking && (
                    <Text style={styles.protocolWarning}>
                        ⚠️ Tracking'i durdurup tekrar başlatın
                    </Text>
                )}
            </View>

            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
                    <MaterialCommunityIcons name="package-variant" size={32} color={COLORS.primary} />
                    <Text style={styles.statNumber}>{todayShipments.length}</Text>
                    <Text style={styles.statLabel}>Bugünkü Sevkiyatlar</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
                    <MaterialCommunityIcons name="clock-outline" size={32} color={COLORS.warning} />
                    <Text style={styles.statNumber}>{pendingShipments.length}</Text>
                    <Text style={styles.statLabel}>Bekleyen</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
                    <MaterialCommunityIcons name="truck-delivery" size={32} color={COLORS.primary} />
                    <Text style={styles.statNumber}>{inTransitShipments.length}</Text>
                    <Text style={styles.statLabel}>Yolda</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: COLORS.success + '15' }]}>
                    <MaterialCommunityIcons name="check-circle" size={32} color={COLORS.success} />
                    <Text style={styles.statNumber}>{deliveredToday.length}</Text>
                    <Text style={styles.statLabel}>Teslim Edildi</Text>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Hızlı İşlemler</Text>
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialCommunityIcons name="qrcode-scan" size={24} color={COLORS.primary} />
                        <Text style={styles.actionText}>QR Tara</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} />
                        <Text style={styles.actionText}>Fotoğraf</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialCommunityIcons name="draw" size={24} color={COLORS.primary} />
                        <Text style={styles.actionText}>İmza</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionButton}>
                        <MaterialCommunityIcons name="phone" size={24} color={COLORS.primary} />
                        <Text style={styles.actionText}>İletişim</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    greeting: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    driverName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 4,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.text,
        fontWeight: '600',
    },
    card: {
        backgroundColor: 'white',
        margin: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.text,
        marginLeft: 8,
        flex: 1,
    },
    connectionBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    connectionText: {
        fontSize: 10,
        color: 'white',
        fontWeight: '600',
    },
    trackingInfo: {
        marginBottom: 12,
    },
    trackingStatus: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    lastUpdate: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    coordinates: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    trackingButton: {
        backgroundColor: COLORS.primary,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    trackingButtonActive: {
        backgroundColor: COLORS.danger,
    },
    trackingButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    protocolToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    protocolInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    protocolText: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: '500',
    },
    protocolWarning: {
        fontSize: 12,
        color: COLORS.warning,
        marginTop: 8,
        textAlign: 'center',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 8,
    },
    statCard: {
        width: '47%',
        margin: '1.5%',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.text,
        marginTop: 8,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginTop: 4,
        textAlign: 'center',
    },
    quickActions: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 12,
    },
    actionButton: {
        alignItems: 'center',
    },
    actionText: {
        fontSize: 12,
        color: COLORS.text,
        marginTop: 4,
    },
});
