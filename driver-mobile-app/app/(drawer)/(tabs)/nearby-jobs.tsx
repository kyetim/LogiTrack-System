import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { api } from '../../../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { Shipment } from '../../../types';

// Extended shipment with distance for nearby jobs
interface NearbyShipment extends Shipment {
    distance_meters?: number;
}

export default function NearbyJobsScreen() {
    const [nearbyShipments, setNearbyShipments] = useState<NearbyShipment[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasLocationPermission, setHasLocationPermission] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

    const driver = useSelector((state: RootState) => state.auth.driver);

    useEffect(() => {
        checkLocationPermission();
    }, []);

    useEffect(() => {
        if (hasLocationPermission) {
            loadNearbyJobs();
        }
    }, [hasLocationPermission]);

    const checkLocationPermission = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
            setHasLocationPermission(true);
            // Get current location and update backend
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ lat: latitude, lng: longitude });

            // Update driver location on backend
            try {
                await api.updateMyLocation(latitude, longitude);
            } catch (error) {
                console.error('Failed to update location:', error);
            }
        } else {
            Alert.alert(
                'Konum İzni Gerekli',
                'Yakındaki işleri görebilmek için konum izni vermelisiniz.',
                [{ text: 'Tamam' }]
            );
        }
    };

    const loadNearbyJobs = async () => {
        setIsLoading(true);
        try {
            const shipments = await api.getNearbyShipments(50); // 50km radius
            setNearbyShipments(shipments);
        } catch (error: any) {
            console.error('Failed to load nearby jobs:', error);
            Alert.alert('Hata', 'Yakındaki işler yüklenemedi.');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNearbyJobs();
        setRefreshing(false);
    };

    const formatDistance = (meters?: number) => {
        if (!meters) return '-';
        if (meters < 1000) {
            return `${Math.round(meters)}m`;
        }
        return `${(meters / 1000).toFixed(1)}km`;
    };

    const handleJobPress = (shipment: NearbyShipment) => {
        router.push(`/(drawer)/(tabs)/shipments/${shipment.id}` as any);
    };

    const renderShipmentItem = ({ item }: { item: NearbyShipment }) => (
        <TouchableOpacity
            style={styles.shipmentCard}
            onPress={() => handleJobPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.headerLeft}>
                    <Ionicons name="location" size={20} color="#4CAF50" />
                    <Text style={styles.trackingNumber}>{item.trackingNumber}</Text>
                </View>
                <View style={styles.distanceBadge}>
                    <Ionicons name="navigate" size={14} color="#fff" />
                    <Text style={styles.distanceText}>{formatDistance(item.distance_meters)}</Text>
                </View>
            </View>

            <View style={styles.routeInfo}>
                <View style={styles.routeRow}>
                    <Ionicons name="arrow-up-circle" size={16} color="#666" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {item.origin}
                    </Text>
                </View>
                <View style={styles.routeDivider} />
                <View style={styles.routeRow}>
                    <Ionicons name="arrow-down-circle" size={16} color="#666" />
                    <Text style={styles.routeText} numberOfLines={1}>
                        {item.destination}
                    </Text>
                </View>
            </View>

            <View style={styles.cardFooter}>
                <Text style={styles.statusText}>Durum: {item.status}</Text>
                <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
        </TouchableOpacity>
    );

    if (!hasLocationPermission) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="location-outline" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Konum izni gerekli</Text>
                <TouchableOpacity style={styles.permissionButton} onPress={checkLocationPermission}>
                    <Text style={styles.permissionButtonText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (isLoading && !refreshing) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>Yakındaki işler yükleniyor...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="location" size={24} color="#4CAF50" />
                <Text style={styles.headerTitle}>Yakındaki İşler</Text>
            </View>

            {currentLocation && (
                <View style={styles.locationInfo}>
                    <Ionicons name="navigate-circle" size={20} color="#4CAF50" />
                    <Text style={styles.locationText}>
                        Konumunuz: {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
                    </Text>
                </View>
            )}

            <FlatList
                data={nearbyShipments}
                renderItem={renderShipmentItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search-outline" size={64} color="#ccc" />
                        <Text style={styles.emptyText}>Yakınınızda iş bulunamadı</Text>
                        <Text style={styles.emptySubtext}>(50km yarıçapında)</Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        gap: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#333',
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#E8F5E9',
        gap: 8,
    },
    locationText: {
        fontSize: 13,
        color: '#2E7D32',
        flex: 1,
    },
    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    shipmentCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trackingNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#333',
    },
    distanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        gap: 4,
    },
    distanceText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#fff',
    },
    routeInfo: {
        marginVertical: 8,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    routeText: {
        fontSize: 14,
        color: '#555',
        flex: 1,
    },
    routeDivider: {
        width: 1,
        height: 16,
        backgroundColor: '#ddd',
        marginLeft: 8,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    statusText: {
        fontSize: 13,
        color: '#666',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 13,
        color: '#bbb',
        marginTop: 4,
    },
    loadingText: {
        fontSize: 14,
        color: '#666',
        marginTop: 12,
    },
    permissionButton: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        marginTop: 16,
    },
    permissionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
