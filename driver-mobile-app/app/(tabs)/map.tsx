import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchShipments } from '../../store/slices/shipmentsSlice';
import { setSelectedShipment, setMapRegion } from '../../store/slices/mapSlice';
import { COLORS } from '../../utils/constants';

export default function MapScreen() {
    const { shipmentId } = useLocalSearchParams<{ shipmentId?: string }>();
    const mapRef = useRef<MapView>(null);
    const dispatch = useAppDispatch();

    const { shipments } = useAppSelector((state) => state.shipments);
    const { selectedShipmentId } = useAppSelector((state) => state.map);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);

    // Request location permission and get current location
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                setHasPermission(status === 'granted');

                if (status === 'granted') {
                    const currentLocation = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High,
                    });
                    setLocation(currentLocation);
                } else {
                    Alert.alert(
                        'Konum İzni Gerekli',
                        'Haritayı kullanmak için konum izni vermeniz gerekiyor.',
                        [{ text: 'Tamam' }]
                    );
                }
            } catch (error) {
                console.error('Location error:', error);
                Alert.alert('Hata', 'Konum alınamadı');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    // Fetch shipments
    useEffect(() => {
        dispatch(fetchShipments());
    }, [dispatch]);

    // Handle shipmentId from navigation params
    useEffect(() => {
        if (shipmentId) {
            dispatch(setSelectedShipment(shipmentId));
        }
    }, [shipmentId, dispatch]);

    // Zoom to selected shipment or fit all markers
    useEffect(() => {
        if (!mapRef.current || !location) return;

        const activeShipments = shipments.filter(
            (s) => s.status === 'PENDING' || s.status === 'IN_TRANSIT'
        );

        if (selectedShipmentId) {
            const selectedShipment = shipments.find((s) => s.id === selectedShipmentId);
            if (selectedShipment?.pickupLocation && selectedShipment?.deliveryLocation) {
                const coordinates = [
                    {
                        latitude: selectedShipment.pickupLocation.lat || 0,
                        longitude: selectedShipment.pickupLocation.lng || 0,
                    },
                    {
                        latitude: selectedShipment.deliveryLocation.lat || 0,
                        longitude: selectedShipment.deliveryLocation.lng || 0,
                    },
                ];
                mapRef.current.fitToCoordinates(coordinates, {
                    edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                    animated: true,
                });
            }
        } else if (activeShipments.length > 0) {
            const coordinates = activeShipments.flatMap((s) => [
                {
                    latitude: s.pickupLocation?.lat || 0,
                    longitude: s.pickupLocation?.lng || 0,
                },
                {
                    latitude: s.deliveryLocation?.lat || 0,
                    longitude: s.deliveryLocation?.lng || 0,
                },
            ]);
            mapRef.current.fitToCoordinates(coordinates, {
                edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
                animated: true,
            });
        }
    }, [selectedShipmentId, shipments, location]);

    const handleCenterOnUser = () => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Harita yükleniyor...</Text>
            </View>
        );
    }

    if (!hasPermission) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="map-marker-off" size={64} color={COLORS.danger} />
                <Text style={styles.errorText}>Konum İzni Gerekli</Text>
                <Text style={styles.errorSubtext}>
                    Haritayı kullanmak için konum izni vermeniz gerekiyor
                </Text>
            </View>
        );
    }

    if (!location) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="map-marker-question" size={64} color={COLORS.warning} />
                <Text style={styles.errorText}>Konum Alınamadı</Text>
                <Text style={styles.errorSubtext}>Lütfen GPS'inizi açın</Text>
            </View>
        );
    }

    const initialRegion: Region = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    };

    const activeShipments = shipments.filter(
        (s) => s.status === 'PENDING' || s.status === 'IN_TRANSIT'
    );

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                initialRegion={initialRegion}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                showsScale
            >
                {/* Driver Location Marker */}
                <Marker
                    coordinate={{
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    }}
                    title="Konumunuz"
                    description="Mevcut konum"
                    pinColor={COLORS.primary}
                />

                {/* Shipment Markers */}
                {activeShipments.map((shipment) => (
                    <React.Fragment key={shipment.id}>
                        {/* Pickup Marker */}
                        {shipment.pickupLocation?.lat && shipment.pickupLocation?.lng && (
                            <Marker
                                coordinate={{
                                    latitude: shipment.pickupLocation.lat,
                                    longitude: shipment.pickupLocation.lng,
                                }}
                                title={`Alış: ${shipment.trackingNumber}`}
                                description={shipment.origin}
                                pinColor={COLORS.success}
                            />
                        )}

                        {/* Delivery Marker */}
                        {shipment.deliveryLocation?.lat && shipment.deliveryLocation?.lng && (
                            <Marker
                                coordinate={{
                                    latitude: shipment.deliveryLocation.lat,
                                    longitude: shipment.deliveryLocation.lng,
                                }}
                                title={`Teslim: ${shipment.trackingNumber}`}
                                description={shipment.destination}
                                pinColor={COLORS.danger}
                            />
                        )}
                    </React.Fragment>
                ))}
            </MapView>

            {/* Center on User Button */}
            <TouchableOpacity style={styles.centerButton} onPress={handleCenterOnUser}>
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color="white" />
            </TouchableOpacity>

            {/* Info Card */}
            <View style={styles.infoCard}>
                <View style={styles.legendRow}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                        <Text style={styles.legendText}>Konumunuz</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
                        <Text style={styles.legendText}>Alış</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
                        <Text style={styles.legendText}>Teslim</Text>
                    </View>
                </View>
                <Text style={styles.infoText}>
                    {activeShipments.length} aktif sevkiyat
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 24,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textLight,
    },
    errorText: {
        marginTop: 16,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },
    errorSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    centerButton: {
        position: 'absolute',
        bottom: 120,
        right: 16,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    infoCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 12,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.text,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
