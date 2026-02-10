import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';
import { setSelectedShipment } from '../../../store/slices/mapSlice';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../../constants/theme';
import { ShipmentBottomSheet } from '../../../components/ui/ShipmentBottomSheet';
import { Shipment } from '../../../types';

export default function MapScreen() {
    const { shipmentId } = useLocalSearchParams<{ shipmentId?: string }>();
    const mapRef = useRef<MapView>(null);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const dispatch = useAppDispatch();

    const { shipments } = useAppSelector((state) => state.shipments);
    const { selectedShipmentId } = useAppSelector((state) => state.map);

    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [loading, setLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [selectedShipment, setSelectedShipmentData] = useState<Shipment | null>(null);

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
                        'Konum İzni',
                        'Haritada konumunuzu görebilmek için konum iznine ihtiyacımız var.',
                        [{ text: 'Tamam' }]
                    );
                }
            } catch (error) {
                console.error('Error getting location:', error);
            } finally {
                setLoading(false);
            }
            openers();
        })();

        async function openers() {
            dispatch(fetchShipments());
        }
    }, [dispatch]);

    // Handle shipment selection from map marker
    const handleMarkerPress = useCallback((shipment: Shipment) => {
        setSelectedShipmentData(shipment);
        dispatch(setSelectedShipment(shipment.id));
        bottomSheetRef.current?.present();
    }, [dispatch]);

    // Focus on selected shipment when URL param or state changes
    useEffect(() => {
        const idToFocus = shipmentId || selectedShipmentId;
        if (idToFocus && shipments.length > 0) {
            const shipment = shipments.find(s => s.id === idToFocus);
            if (shipment) {
                setSelectedShipmentData(shipment);
                bottomSheetRef.current?.present();

                if (mapRef.current) {
                    mapRef.current.animateToRegion({
                        latitude: shipment.pickupLocation.lat,
                        longitude: shipment.pickupLocation.lng,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }, 1000);
                }
            }
        }
    }, [shipmentId, selectedShipmentId, shipments]);

    const centerOnUser = useCallback(() => {
        if (location && mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    }, [location]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Harita yükleniyor...</Text>
            </View>
        );
    }

    const initialRegion: Region = {
        latitude: location?.coords.latitude || 41.0082,
        longitude: location?.coords.longitude || 28.9784,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                initialRegion={initialRegion}
                showsUserLocation={hasPermission}
                showsMyLocationButton={false}
                onPress={() => {
                    // Close bottom sheet when clicking empty map area
                    bottomSheetRef.current?.dismiss();
                }}
            >
                {shipments.map((shipment) => (
                    <Marker
                        key={shipment.id}
                        coordinate={{
                            latitude: shipment.pickupLocation.lat,
                            longitude: shipment.pickupLocation.lng,
                        }}
                        onPress={() => handleMarkerPress(shipment)}
                    >
                        <View style={[
                            styles.markerContainer,
                            selectedShipmentId === shipment.id && styles.selectedMarker
                        ]}>
                            <MaterialCommunityIcons
                                name="truck-delivery"
                                size={24}
                                color={selectedShipmentId === shipment.id ? Colors.white : Colors.primary}
                            />
                        </View>
                    </Marker>
                ))}
            </MapView>

            <TouchableOpacity
                style={[styles.myLocationButton, Shadows.sm]}
                onPress={centerOnUser}
            >
                <MaterialCommunityIcons name="crosshairs-gps" size={24} color={Colors.primary} />
            </TouchableOpacity>

            <ShipmentBottomSheet
                ref={bottomSheetRef}
                shipment={selectedShipment}
            />
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    loadingText: {
        marginTop: 12,
        fontSize: Typography.base,
        color: Colors.textSecondary,
    },
    markerContainer: {
        padding: 5,
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedMarker: {
        backgroundColor: Colors.primary,
        borderColor: Colors.white,
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 100, // Above bottom sheet when closed
        right: 20,
        backgroundColor: Colors.white,
        padding: 12,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
