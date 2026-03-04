import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Colors, Typography } from '@/theme/tokens';
import { Map as MapIcon } from 'lucide-react-native';

import { CustomMarker } from '../map/CustomMarker';
import { RoutePolyline } from '../map/RoutePolyline';
import { DARK_MAP_STYLE, MAP_INITIAL_REGION } from '@/constants/mapStyles';

export interface MapPreviewProps {
    pickupLat?: number;
    pickupLng?: number;
    deliveryLat?: number;
    deliveryLng?: number;
    height?: number;
    borderRadius?: number;
    showRoute?: boolean;
    onPress?: () => void;
}

export const MapPreview: React.FC<MapPreviewProps> = ({
    pickupLat,
    pickupLng,
    deliveryLat,
    deliveryLng,
    height = 140,
    borderRadius = 12,
    showRoute = true,
    onPress,
}) => {
    const hasCoordinates = pickupLat && pickupLng && deliveryLat && deliveryLng;
    const initialRegion = hasCoordinates ? {
        // center between pickup and delivery
        latitude: (pickupLat + deliveryLat) / 2,
        longitude: (pickupLng + deliveryLng) / 2,
        latitudeDelta: Math.abs(pickupLat - deliveryLat) * 2 || 0.05,
        longitudeDelta: Math.abs(pickupLng - deliveryLng) * 2 || 0.05,
    } : MAP_INITIAL_REGION;

    const content = (
        <View style={[styles.container, { height, borderRadius, overflow: 'hidden' }]}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={initialRegion}
                liteMode={Platform.OS === 'android'}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
            >
                {hasCoordinates && (
                    <>
                        <CustomMarker
                            type="pickup"
                            coordinate={{ latitude: pickupLat!, longitude: pickupLng! }}
                        />
                        <CustomMarker
                            type="delivery"
                            coordinate={{ latitude: deliveryLat!, longitude: deliveryLng! }}
                        />
                        {showRoute && (
                            <RoutePolyline
                                variant="preview"
                                coordinates={[
                                    { latitude: pickupLat!, longitude: pickupLng! },
                                    { latitude: deliveryLat!, longitude: deliveryLng! }
                                ]}
                            />
                        )}
                    </>
                )}
            </MapView>

            {/* Clickable Overlay if onPress is provided */}
            {onPress && (
                <View style={styles.overlayArea}>
                    {/* Bottom Right Floating Chip */}
                    <View style={styles.chipContainer}>
                        <MapIcon color={Colors.primary} size={12} strokeWidth={2.5} />
                        <Text style={styles.chipText}>Haritayı Aç</Text>
                    </View>
                </View>
            )}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ borderRadius, overflow: 'hidden' }}>
                {content}
            </TouchableOpacity>
        );
    }

    return content;
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#1A1A1A',
        width: '100%',
        position: 'relative',
    },
    overlayArea: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)', // Hafif karartma
    },
    chipContainer: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: Colors.card,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    chipText: {
        color: Colors.primary,
        fontSize: 10,
        fontFamily: Typography.fontBodySemiBold,
        textTransform: 'uppercase',
    },
});
