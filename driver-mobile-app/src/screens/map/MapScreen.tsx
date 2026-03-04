import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Crosshair, Layers } from 'lucide-react-native';

import {
    CustomMarker,
    RoutePolyline,
    ShipmentBottomSheet
} from '@/components/map';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import {
    DARK_MAP_STYLE,
    MAP_INITIAL_REGION,
    MOCK_PICKUP_COORD,
    MOCK_DELIVERY_COORD,
    MOCK_ROUTE_COORDS
} from '@/constants/mapStyles';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { useAppSelector, useAppDispatch } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';
import { Delivery, AvailableJob } from '@/types';

export const MapScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();

    // Map State
    const mapRef = useRef<MapView>(null);
    const [mapMode, setMapMode] = useState<'driver' | 'overview'>('driver');
    const [showJobPins, setShowJobPins] = useState(true);

    // Bottom Sheet State
    const [selectedItem, setSelectedItem] = useState<Delivery | AvailableJob | null>(null);
    const [bottomSheetType, setBottomSheetType] = useState<'active' | 'job'>('active');
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    // Location Hook
    const { backgroundPermissionGranted, startTracking } = useDriverLocation();

    // Redux Data
    const { shipments } = useAppSelector((state) => state.shipments);

    useEffect(() => {
        dispatch(fetchShipments());
    }, [dispatch]);

    // Handle initial permissions if not granted
    if (!backgroundPermissionGranted) {
        return (
            <View style={styles.permissionContainer}>
                <MapPin size={64} color={Colors.primary} style={styles.permissionIcon} />
                <Text style={styles.permissionTitle}>Konum İzni Gerekli</Text>
                <Text style={styles.permissionText}>
                    Harita üzerinde işleri ve rotanızı görmek için konum iznine ihtiyacımız var.
                </Text>
                <TouchableOpacity style={styles.permissionBtn} onPress={startTracking}>
                    <Text style={styles.permissionBtnText}>İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleCenterLocation = () => {
        if (mapRef.current) {
            // For now centering to initial region; real driver location will be used later
            mapRef.current.animateToRegion(MAP_INITIAL_REGION, 1000);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={DARK_MAP_STYLE}
                initialRegion={MAP_INITIAL_REGION}
                showsUserLocation={false}
                showsCompass={false}
                showsMyLocationButton={false}
                showsTraffic={false}
                pitchEnabled={false}
                onPress={() => setIsBottomSheetVisible(false)}
            >
                {/* Simulated Driver Location */}
                <CustomMarker type="driver" coordinate={MAP_INITIAL_REGION} />

                {/* Active Delivery Route Mock */}
                <CustomMarker type="pickup" coordinate={MOCK_PICKUP_COORD} isActive={bottomSheetType === 'active'} />
                <CustomMarker type="delivery" coordinate={MOCK_DELIVERY_COORD} isActive={bottomSheetType === 'active'} />
                <RoutePolyline coordinates={MOCK_ROUTE_COORDS} variant="active" />

                {/* Job Pins from Redux */}
                {showJobPins && shipments?.map((s) => {
                    if (!s.pickupLocation?.lat || !s.pickupLocation?.lng) return null;
                    return (
                        <CustomMarker
                            key={s.id}
                            type="job"
                            label={`₺${(s as any).amount || (s as any).price || '0'}`}
                            coordinate={{
                                latitude: s.pickupLocation.lat,
                                longitude: s.pickupLocation.lng,
                            }}
                            onPress={() => {
                                // Transform shipment to match AvailableJob structure for the bottom sheet
                                const transformedJob: AvailableJob = {
                                    id: s.id,
                                    customerName: s.customerName || 'Bilinmeyen Müşteri',
                                    deliveryAddress: (s as any).deliveryAddress || 'Bilinmeyen Adres',
                                    pickupDistance: 'Yakın',
                                    distance: (s as any).distance || '0 km',
                                    estimatedTime: (s as any).estimatedTime || '0 dk',
                                    price: (s as any).amount || (s as any).price || 0,
                                    packageType: (s as any).type || 'standard',
                                    pickupAddress: (s as any).pickupAddress || 'Bilinmeyen Alım Yeri',
                                    postedTime: (s as any).createdAt || new Date().toISOString(),
                                    expiresIn: 45 // mock expiry
                                };
                                setSelectedItem(transformedJob);
                                setBottomSheetType('job');
                                setIsBottomSheetVisible(true);
                            }}
                        />
                    );
                })}
            </MapView>

            {/* Floating UI OVERLAY */}
            <View style={[styles.floatingOverlay, { paddingTop: Math.max(insets.top, 20) }]} pointerEvents="box-none">

                {/* Top Row: Mode Toggle & Actions */}
                <View style={styles.topRow} pointerEvents="box-none">

                    {/* Left: Map Mode Toggle */}
                    <View style={styles.modeToggleContainer}>
                        <TouchableOpacity
                            style={[styles.modeChip, mapMode === 'driver' && styles.modeChipActive]}
                            onPress={() => setMapMode('driver')}
                        >
                            <Text style={[styles.modeChipText, mapMode === 'driver' && styles.modeChipTextActive]}>Sürücü</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeChip, mapMode === 'overview' && styles.modeChipActive]}
                            onPress={() => setMapMode('overview')}
                        >
                            <Text style={[styles.modeChipText, mapMode === 'overview' && styles.modeChipTextActive]}>Genel</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Right: Action Buttons */}
                    <View style={styles.actionButtonsCol}>
                        <TouchableOpacity style={styles.circleBtn} onPress={handleCenterLocation}>
                            <Crosshair size={22} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.circleBtn, !showJobPins && styles.circleBtnInactive]}
                            onPress={() => setShowJobPins(!showJobPins)}
                        >
                            <Layers size={22} color={showJobPins ? Colors.primary : Colors.gray} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bottom Center: Active Delivery Mini Banner */}
                {!isBottomSheetVisible && (
                    <View style={styles.bottomBannerContainer} pointerEvents="box-none">
                        <TouchableOpacity
                            style={styles.activeDeliveryBanner}
                            onPress={() => {
                                // Mock Active Delivery
                                setSelectedItem({
                                    id: 'dlv_01',
                                    status: 'active',
                                    pickupAddress: 'Depo A',
                                    deliveryAddress: 'Kadıköy Merkez',
                                    customerName: 'Ahmet Yılmaz',
                                    distance: '4.2 km',
                                    estimatedTime: '18 dk',
                                    price: '125',
                                    packageType: 'standard',
                                    date: new Date().toISOString()
                                } as Delivery);
                                setBottomSheetType('active');
                                setIsBottomSheetVisible(true);
                            }}
                        >
                            <Navigation size={16} color={Colors.primary} style={{ marginRight: 8 }} />
                            <Text style={styles.activeDeliveryText}>Aktif Teslimat · 4.2 km · 18 dk</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Bottom Sheet */}
            <ShipmentBottomSheet
                delivery={selectedItem}
                type={bottomSheetType}
                isVisible={isBottomSheetVisible}
                onClose={() => setIsBottomSheetVisible(false)}
                onPrimaryAction={() => {
                    setIsBottomSheetVisible(false);
                    if (bottomSheetType === 'active') {
                        navigation.navigate('ActiveDelivery');
                    } else {
                        navigation.navigate('JobDetail', { id: selectedItem?.id });
                    }
                }}
                onSecondaryAction={() => {
                    setIsBottomSheetVisible(false);
                    if (bottomSheetType === 'active') {
                        navigation.navigate('ReportIssue');
                    } else {
                        navigation.navigate('JobDetail', { id: selectedItem?.id });
                    }
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    map: {
        flex: 1,
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing[4],
    },
    permissionIcon: {
        marginBottom: Spacing[3],
    },
    permissionTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 22,
        color: Colors.white,
        marginBottom: Spacing[1],
        textAlign: 'center',
    },
    permissionText: {
        fontFamily: Typography.fontBody,
        fontSize: 15,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: Spacing[4],
        lineHeight: 22,
    },
    permissionBtn: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing[4],
        paddingVertical: 14,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    permissionBtnText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 16,
        color: '#000',
    },
    floatingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: Spacing[2],
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    modeToggleContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(13,13,13,0.9)',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#2A2A2A',
        padding: 4,
    },
    modeChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
    },
    modeChipActive: {
        backgroundColor: Colors.primary,
    },
    modeChipText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
        color: Colors.gray,
    },
    modeChipTextActive: {
        color: '#000',
    },
    actionButtonsCol: {
        gap: 12,
    },
    circleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(13,13,13,0.9)',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    circleBtnInactive: {
        opacity: 0.6,
    },
    bottomBannerContainer: {
        position: 'absolute',
        bottom: 110, // above bottom tabs
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    activeDeliveryBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(13,13,13,0.95)',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 16,
        paddingHorizontal: Spacing[3],
        paddingVertical: 12,
        elevation: 8,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    activeDeliveryText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 13,
        color: Colors.primary,
    },
});
