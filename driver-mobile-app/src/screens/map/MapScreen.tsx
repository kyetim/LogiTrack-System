import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    useColorScheme, Linking, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MapView, { PROVIDER_GOOGLE, Polyline, Camera } from 'react-native-maps';
import {
    MapPin, Navigation, Crosshair, Layers,
    Box as Cube, Map as Map2D, ExternalLink,
    ChevronRight, Clock, Minus as Ruler,
} from 'lucide-react-native';

import { CustomMarker, RoutePolyline, ShipmentBottomSheet } from '@/components/map';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import {
    DARK_MAP_STYLE, LIGHT_MAP_STYLE,
    MAP_INITIAL_REGION,
    MOCK_PICKUP_COORD, MOCK_DELIVERY_COORD, MOCK_ROUTE_COORDS,
} from '@/constants/mapStyles';
import { Colors, Typography, Spacing, Radius } from '@/theme/tokens';
import { useAppSelector, useAppDispatch } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';
import { Delivery, AvailableJob } from '@/types';

export const MapScreen = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const colorScheme = useColorScheme(); // 'light' | 'dark' — dark/light mode ready

    // Map refs & state
    const mapRef = useRef<MapView>(null);
    const [is3D, setIs3D] = useState(false);
    const [mapMode, setMapMode] = useState<'driver' | 'overview'>('driver');
    const [showJobPins, setShowJobPins] = useState(true);

    // Bottom sheet state
    const [selectedItem, setSelectedItem] = useState<Delivery | AvailableJob | null>(null);
    const [bottomSheetType, setBottomSheetType] = useState<'active' | 'job'>('active');
    const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);

    // Navigation step state (mock — gerçek Directions API entegrasyonuna hazır)
    const [currentNavStep] = useState('Düz devam et — 350 m');

    // Location hook
    const { foregroundPermissionGranted, startTracking } = useDriverLocation();

    // Redux
    const { shipments } = useAppSelector((state) => state.shipments);
    const { currentLocation } = useAppSelector((state) => state.location);
    // Online durumu — iki kaynaktan birleştir:
    // 1. availabilitySlice: toggle ile aktif olarak set edildi
    // 2. auth.driver.status: uygulama kapanıp açıldığında loadStoredAuth ile gelir (persist yok)
    const availabilityStatus = useAppSelector((state: any) => state.availability.status);
    const driverStatus = useAppSelector((state: any) => state.auth.driver?.status);
    const isOnline = availabilityStatus !== 'OFF_DUTY' || driverStatus === 'ON_DUTY';

    // Aktif teslimatı bul
    const activeDelivery = shipments?.find(s => ['IN_TRANSIT', 'PICKED_UP'].includes(s.status));

    useEffect(() => {
        dispatch(fetchShipments());
    }, [dispatch]);

    // Map style: dark/light mode'a göre otomatik geçiş
    const mapStyle = colorScheme === 'dark' ? DARK_MAP_STYLE : LIGHT_MAP_STYLE;

    // 3D toggle
    const toggle3D = useCallback(() => {
        const next = !is3D;
        setIs3D(next);
        mapRef.current?.animateCamera(
            { pitch: next ? 55 : 0, altitude: next ? 400 : 1000 },
            { duration: 600 }
        );
    }, [is3D]);

    // Center on current location
    const handleCenter = () => {
        if (!currentLocation) return;
        mapRef.current?.animateCamera({
            center: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
            pitch: is3D ? 55 : 0,
            zoom: 16,
        }, { duration: 800 });
    };

    // Open in external Google Maps
    const openInGoogleMaps = () => {
        if (!currentLocation) return;
        const url = Platform.select({
            ios: `maps://app?daddr=${MOCK_DELIVERY_COORD.latitude},${MOCK_DELIVERY_COORD.longitude}`,
            android: `google.navigation:q=${MOCK_DELIVERY_COORD.latitude},${MOCK_DELIVERY_COORD.longitude}`,
        });
        if (url) Linking.openURL(url);
    };

    const initialCamera: Camera = {
        center: {
            latitude: currentLocation?.latitude ?? MAP_INITIAL_REGION.latitude,
            longitude: currentLocation?.longitude ?? MAP_INITIAL_REGION.longitude,
        },
        pitch: 0,
        heading: 0,
        altitude: 1000,
        zoom: 14,
    };

    // Permission screen — online ise izin zaten alınmış, hook state'i mount'ta sıfırlansa da engelleme
    if (!foregroundPermissionGranted && !isOnline) {
        const isDark = colorScheme === 'dark';
        return (
            <View style={[styles.permissionContainer, isDark && styles.permissionDark]}>
                <View style={styles.permissionContent}>
                    <View style={styles.permissionIconWrap}>
                        <MapPin size={42} color={Colors.primary} />
                    </View>
                    <Text style={[styles.permissionTitle, isDark ? { color: Colors.white } : { color: '#0F172A' }]}>
                        Konum İzni Gerekli
                    </Text>
                    <Text style={[styles.permissionText, isDark ? { color: Colors.gray } : { color: '#64748B' }]}>
                        Uygulamayı kullanabilmek ve harita üzerinde rotanızı görebilmek için konum erişimine izin vermeniz gerekmektedir.
                    </Text>
                </View>
                <View style={[styles.permissionFooter, { paddingBottom: Math.max(insets.bottom, 24) }]}>
                    <TouchableOpacity style={styles.permissionBtn} onPress={startTracking} activeOpacity={0.8}>
                        <Text style={styles.permissionBtnText}>Konum İzni Ver</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* ─── MAP ──────────────────────────────────────── */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                customMapStyle={mapStyle}
                initialCamera={initialCamera}
                showsUserLocation={true}
                showsCompass={false}
                showsMyLocationButton={false}
                showsTraffic={false}
                showsBuildings={true}      // 3D bina desteği
                pitchEnabled={true}        // 3D için şart
                rotateEnabled={true}
                onPress={() => setIsBottomSheetVisible(false)}
            >
                {!currentLocation && (
                    <CustomMarker type="driver" coordinate={MAP_INITIAL_REGION} />
                )}

                {/* Active Delivery Route */}
                <CustomMarker type="pickup" coordinate={MOCK_PICKUP_COORD} isActive />
                <CustomMarker type="delivery" coordinate={MOCK_DELIVERY_COORD} isActive />
                <RoutePolyline coordinates={MOCK_ROUTE_COORDS} variant="active" />

                {/* Job pins from Redux */}
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
                                const job: AvailableJob = {
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
                                    expiresIn: 45,
                                };
                                setSelectedItem(job);
                                setBottomSheetType('job');
                                setIsBottomSheetVisible(true);
                            }}
                        />
                    );
                })}
            </MapView>

            {/* ─── FLOATING OVERLAY ─────────────────────────── */}
            <View
                style={[styles.overlay, { paddingTop: Math.max(insets.top, 16) }]}
                pointerEvents="box-none"
            >
                {/* ── TOP PANEL: Aktif Sipariş Bilgisi ── */}
                <View style={styles.topPanel} pointerEvents="box-none">
                    {/* Sol: Sipariş Kartı */}
                    {activeDelivery ? (
                        <TouchableOpacity
                            style={styles.orderCard}
                            onPress={() => {
                                navigation.navigate('ActiveDelivery', { id: activeDelivery.id });
                            }}
                        >
                            <View style={styles.orderCardInner}>
                                <View style={styles.orderDot} />
                                <View style={styles.orderTextWrap}>
                                    <Text style={styles.orderCustomer} numberOfLines={1}>
                                        Aktif Yük: {activeDelivery.trackingNumber}
                                    </Text>
                                    <Text style={styles.orderAddress} numberOfLines={1}>
                                        {activeDelivery.destination}
                                    </Text>
                                </View>
                                <ChevronRight size={16} color={Colors.gray} />
                            </View>
                        </TouchableOpacity>
                    ) : (
                        <View style={[styles.orderCard, { padding: 12, justifyContent: 'center' }]}>
                            <Text style={[styles.orderCustomer, { color: Colors.gray }]}>Aktif Sefer Yok</Text>
                        </View>
                    )}

                    {/* Sağ: Aksiyon Butonları */}
                    <View style={styles.actionCol}>
                        <TouchableOpacity style={styles.circleBtn} onPress={handleCenter}>
                            <Crosshair size={20} color={Colors.white} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.circleBtn, is3D && styles.circleBtnActive]}
                            onPress={toggle3D}
                        >
                            <Text style={[styles.btn3DText, is3D && styles.btn3DTextActive]}>
                                {is3D ? '3D' : '2D'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.circleBtn, !showJobPins && styles.circleBtnDim]}
                            onPress={() => setShowJobPins(!showJobPins)}
                        >
                            <Layers size={20} color={showJobPins ? Colors.white : Colors.gray} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── NAV STEP BAR (Navigasyon Adımı) ── */}
                {activeDelivery && (
                    <View style={styles.navStepBar} pointerEvents="none">
                        <Navigation size={16} color={Colors.primary} />
                        <Text style={styles.navStepText} numberOfLines={1}>
                            Varış: {(activeDelivery as any).estimatedArrival ? new Date((activeDelivery as any).estimatedArrival).toLocaleTimeString() : 'Bilinmeyen Zaman'}
                        </Text>
                        <TouchableOpacity style={styles.externalBtn} onPress={openInGoogleMaps}>
                            <ExternalLink size={14} color={Colors.gray} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* ── BOTTOM INFO BAR (ETA + Teslim Ettim) ── */}
                {activeDelivery && (
                    <View
                        style={[
                            styles.bottomPanelContainer,
                            colorScheme === 'dark' && { backgroundColor: Colors.surface, shadowColor: '#000' },
                            { paddingBottom: Math.max(insets.bottom, 24) },
                        ]}
                        pointerEvents="box-none"
                    >
                        <View style={styles.etaRow}>
                            <View style={styles.etaItem}>
                                <Clock size={16} color={Colors.primary} />
                                <Text style={[styles.etaValue, colorScheme === 'dark' && { color: Colors.white }]}>Haraket Halinde</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.deliverBtn}
                            onPress={() => navigation.navigate('ActiveDelivery', { id: activeDelivery.id })}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.deliverBtnText}>→ Sefer Detaylarına Git</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* ─── BOTTOM SHEET ─────────────────────────── */}
            <ShipmentBottomSheet
                delivery={selectedItem}
                type={bottomSheetType}
                isVisible={isBottomSheetVisible}
                onClose={() => setIsBottomSheetVisible(false)}
                onPrimaryAction={() => {
                    setIsBottomSheetVisible(false);
                    navigation.navigate(
                        bottomSheetType === 'active' ? 'ActiveDelivery' : 'JobDetail',
                        bottomSheetType === 'job' ? { id: selectedItem?.id } : undefined,
                    );
                }}
                onSecondaryAction={() => {
                    setIsBottomSheetVisible(false);
                    navigation.navigate(
                        bottomSheetType === 'active' ? 'ReportIssue' : 'JobDetail',
                        { id: selectedItem?.id },
                    );
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    // Permission
    permissionContainer: {
        flex: 1, backgroundColor: '#FFFFFF',
        justifyContent: 'space-between',
    },
    permissionDark: { backgroundColor: Colors.background },
    permissionContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    permissionFooter: {
        paddingHorizontal: 24,
        paddingTop: 16,
    },
    permissionIconWrap: {
        width: 96, height: 96, borderRadius: 48,
        backgroundColor: 'rgba(255,215,0,0.15)',
        justifyContent: 'center', alignItems: 'center',
        marginBottom: 32,
    },
    permissionTitle: {
        fontFamily: Typography.fontDisplayBold, fontSize: 26,
        marginBottom: 12, textAlign: 'center',
    },
    permissionText: {
        fontFamily: Typography.fontBody, fontSize: 15,
        textAlign: 'center', lineHeight: 22,
    },
    permissionBtn: {
        backgroundColor: Colors.primary, borderRadius: 16,
        paddingVertical: 18, alignItems: 'center',
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
    },
    permissionBtnText: {
        fontFamily: Typography.fontBodySemiBold, fontSize: 16, color: '#000',
    },

    // Overlay wrapper
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        paddingHorizontal: 12,
    },

    // Top Panel
    topPanel: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 10,
    },
    orderCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 8,
    },
    orderCardInner: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, gap: 10,
    },
    orderDot: {
        width: 10, height: 10, borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    orderTextWrap: { flex: 1 },
    orderCustomer: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13, color: '#0F172A',
    },
    orderAddress: {
        fontFamily: Typography.fontBody,
        fontSize: 11, color: '#64748B', marginTop: 1,
    },

    // Action buttons column
    actionCol: { gap: 8 },
    circleBtn: {
        width: 42, height: 42, borderRadius: 21,
        backgroundColor: 'rgba(13,13,13,0.88)',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25, shadowRadius: 6, elevation: 6,
    },
    circleBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    circleBtnDim: { opacity: 0.5 },
    btn3DText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 12, color: Colors.white,
    },
    btn3DTextActive: { color: '#000' },

    // Nav Step Bar
    navStepBar: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.97)',
        borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14,
        gap: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
        marginBottom: 0,
    },
    navStepText: {
        flex: 1, fontFamily: Typography.fontBodyMedium,
        fontSize: 13, color: '#1E293B',
    },
    externalBtn: {
        width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    },

    // Bottom Panel Container
    bottomPanelContainer: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 24,
        paddingTop: 24,
        gap: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
    },
    etaRow: {
        flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', gap: 32,
        marginBottom: 4,
    },
    etaItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    etaValue: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 18, color: '#0F172A',
    },
    etaSep: { width: 1, height: 24, backgroundColor: '#E2E8F0' },
    deliverBtn: {
        backgroundColor: Colors.primary, borderRadius: 16,
        paddingVertical: 18, alignItems: 'center',
    },
    deliverBtnText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 16, color: '#000',
    },
});
