import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Config
import { Colors, Typography } from '@/theme/tokens';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';
import { updateAvailability } from '../../../store/slices/availabilitySlice';

// Shared Components
import { StatusBadge, DeliveryCard } from '@/components/shared';
import { AppButton } from '@/components/ui';

// Location Hook
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { useLocationWatchdog } from '@/hooks/useLocationWatchdog';

// Assume these routes exist in upcoming router setup
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainStackParamList } from '@/navigation/MainNavigator';
import { TabParamList } from '@/navigation/TabNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
    BottomTabNavigationProp<TabParamList, 'HomeTab'>,
    NativeStackNavigationProp<MainStackParamList>
>;

export const HomeScreen = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { startTracking, stopTracking } = useDriverLocation();

    const { status: availabilityStatus, isUpdating } = useAppSelector((state: any) => state.availability);
    const [isOnline, setIsOnline] = useState(false);
    const [greeting, setGreeting] = useState('Günaydın');

    useEffect(() => {
        // Set dynamic greeting based on hour
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) setGreeting('Günaydın');
        else if (hour >= 12 && hour < 18) setGreeting('İyi Günler');
        else setGreeting('İyi Akşamlar');
    }, []);

    const dispatch = useAppDispatch();
    const user = useAppSelector((state) => state.auth.user);
    const driver = useAppSelector((state) => state.auth.driver);
    const { shipments, isLoading: shipmentsLoading } = useAppSelector((state) => state.shipments);
    const unreadCount = useAppSelector((state) => state.messages.unreadCount);

    // İki kaynaktan isOnline türet: toggle state + DB'den gelen driver.status
    const driverStatus = (driver as any)?.status as string | undefined;
    const isOnlineForWatchdog = availabilityStatus !== 'OFF_DUTY' || driverStatus === 'ON_DUTY';

    // Konum kaybı watchdog — online iken izin ve stale konŭmu izler
    useLocationWatchdog(isOnlineForWatchdog);

    const displayName = driver?.firstName
        ? `${driver.firstName} ${driver.lastName || ''}`.trim()
        : user?.email?.split('@')[0] || 'Sürücü';
    const initials = displayName.substring(0, 2).toUpperCase();

    const activeDelivery = shipments.find(
        (s) => s.status === 'IN_TRANSIT' || s.status === 'PICKED_UP'
    ) || null;

    const recentDeliveries = shipments
        .filter((s) => s.status === 'DELIVERED')
        .slice(0, 3);

    const getDeliveryStatus = (status: string): any => {
        switch (status) {
            case 'PENDING': return 'pending';
            case 'PICKED_UP': return 'active';
            case 'IN_TRANSIT': return 'delivering';
            case 'DELIVERED': return 'completed';
            case 'CANCELLED': return 'cancelled';
            default: return 'pending';
        }
    };

    // Switch Animation setup
    const toggleAnim = React.useRef(new Animated.Value(isOnline ? 1 : 0)).current;
    const hasInitializedRef = React.useRef(false);

    // Redux'tan gelen driver status'a göre başlangıç online durumunu ayarla
    useEffect(() => {
        if (availabilityStatus && availabilityStatus !== 'OFF_DUTY') {
            setIsOnline(true);
            Animated.spring(toggleAnim, {
                toValue: 1,
                useNativeDriver: false,
                bounciness: 0,
                speed: 20,
            }).start();

            // Başlangıçta eğer toggle açık geliyorsa takibi başlat (Sorun 2)
            if (!hasInitializedRef.current) {
                startTracking();
                hasInitializedRef.current = true;
            }
        } else if (availabilityStatus === 'OFF_DUTY') {
            setIsOnline(false);
            Animated.spring(toggleAnim, {
                toValue: 0,
                useNativeDriver: false,
                bounciness: 0,
                speed: 20,
            }).start();

            if (!hasInitializedRef.current) {
                stopTracking();
                hasInitializedRef.current = true;
            }
        }
    }, [availabilityStatus, startTracking, stopTracking, toggleAnim]);

    useEffect(() => {
        dispatch(fetchShipments());
    }, [dispatch]);

    const handleToggleStatus = async () => {
        if (isUpdating) return; // API isteği sürerken tekrar basılmasın
        const nextState = !isOnline;
        setIsOnline(nextState);

        // GPS tracking
        if (nextState) {
            await startTracking();
        } else {
            await stopTracking();
        }

        // Backend'e durum bildir
        const backendStatus = nextState ? 'AVAILABLE' : 'OFF_DUTY';
        dispatch(updateAvailability(backendStatus));

        Animated.spring(toggleAnim, {
            toValue: nextState ? 1 : 0,
            useNativeDriver: false,
            bounciness: 0,
            speed: 20,
        }).start();
    };

    // Interpolations for custom sliding switch
    const knobPosition = toggleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22],
    });

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{initials}</Text>
                        </View>
                        <View>
                            <Text style={styles.greetingText}>{greeting},</Text>
                            <Text style={styles.nameText}>{displayName}</Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.bellButton} activeOpacity={0.8}>
                        <Bell color={Colors.gray} size={24} />
                        {unreadCount > 0 && <View style={styles.bellBadge} />}
                    </TouchableOpacity>
                </View>

                {/* ─── ONLINE/OFFLINE KART ─── */}
                <View style={[styles.statusCard, {
                    backgroundColor: isOnline ? Colors.primaryDim : Colors.surface,
                    borderColor: isOnline ? Colors.primary : Colors.border
                }]}>
                    <View style={styles.statusLeft}>
                        <Text style={styles.statusLabel}>DURUM</Text>
                        <Text style={styles.statusValue}>{isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</Text>
                        <Text style={styles.statusSubtext}>
                            {isOnline ? `Bugün: ₺0` : 'Görünür değilsin'}
                        </Text>
                    </View>
                    <TouchableOpacity activeOpacity={0.9} onPress={handleToggleStatus} disabled={isUpdating} style={[styles.switchTrack, { opacity: isUpdating ? 0.5 : 1 }]}>
                        <Animated.View style={[
                            styles.switchKnob,
                            {
                                transform: [{ translateX: knobPosition }],
                                backgroundColor: isOnline ? Colors.primary : Colors.border
                            }
                        ]} />
                    </TouchableOpacity>
                </View>

                {/* ─── AKTİF TESLİMAT BANNER ─── */}
                <View style={[styles.section, { marginTop: 12 }]}>
                    {activeDelivery ? (
                        <View style={styles.activeDeliveryCard}>
                            <View style={styles.activeHeader}>
                                <Text style={styles.activeHeaderTitle}>Aktif Sefer</Text>
                                <StatusBadge status={getDeliveryStatus(activeDelivery.status)} size="sm" showDot />
                            </View>
                            <Text style={styles.activeCustomer}>{activeDelivery.customerName || 'Bilinmeyen Müşteri'}</Text>
                            <Text style={styles.activeRoute} numberOfLines={1} ellipsizeMode="tail">
                                {activeDelivery.pickupLocation?.address?.split(',')[0]} → {activeDelivery.deliveryLocation?.address?.split(',')[0]}
                            </Text>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressBarBg}>
                                    <View style={[styles.progressBarFill, { width: `${(activeDelivery.status === 'IN_TRANSIT' ? 0.7 : 0.3) * 100}%` }]} />
                                </View>
                                <Text style={styles.progressText}>
                                    %{(activeDelivery.status === 'IN_TRANSIT' ? 70 : 30)} Tamamlandı · Yakında hedefte
                                </Text>
                            </View>

                            <AppButton
                                variant="primary"
                                size="sm"
                                title="Devam Et"
                                onPress={() => navigation.navigate('ActiveDelivery', { id: activeDelivery.id })}
                            />
                        </View>
                    ) : (
                        <View style={styles.activeDeliveryCard}>
                            <Text style={styles.emptyStateText}>Aktif sefer yok</Text>
                        </View>
                    )}
                </View>

                {/* ─── SON TESLİMATLAR ─── */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Son Seferler</Text>
                        <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.navigate('HistoryTab')}>
                            <Text style={styles.seeAllText}>Tümünü Gör</Text>
                        </TouchableOpacity>
                    </View>
                    {recentDeliveries.map(delivery => (
                        <DeliveryCard
                            key={delivery.id}
                            id={delivery.id}
                            customerName={delivery.customerName || 'Bilinmeyen Müşteri'}
                            pickupAddress={delivery.pickupLocation?.address || delivery.origin}
                            deliveryAddress={delivery.deliveryLocation?.address || delivery.destination}
                            distance={"Bilinmiyor"}
                            estimatedTime={"Tamamlandı"}
                            price={"-"}
                            status={getDeliveryStatus(delivery.status)}
                            packageType={"standard"}
                            date={delivery.updatedAt ? new Date(delivery.updatedAt).toLocaleDateString('tr-TR') : undefined}
                            onPress={() => navigation.navigate('ActiveDelivery', { id: delivery.id })}
                        />
                    ))}
                </View>

                {/* Bottom Padding for scroll area */}
                <View style={styles.bottomSpacer} />

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.card,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.primary,
    },
    greetingText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    nameText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    bellButton: {
        position: 'relative',
        padding: 4,
    },
    bellBadge: {
        position: 'absolute',
        top: 4,
        right: 6,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.background,
    },
    statusCard: {
        borderWidth: 1,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    statusLeft: {
        gap: 4,
    },
    statusLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
    },
    statusValue: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    statusSubtext: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    switchTrack: {
        width: 44,
        height: 24,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    switchKnob: {
        width: 20,
        height: 20,
        borderRadius: 10,
    },
    section: {
        marginBottom: 28,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
        marginBottom: 12,
    },
    seeAllText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.primary,
    },
    activeDeliveryCard: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    activeHeaderTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 13,
        color: Colors.gray,
    },
    activeCustomer: {
        fontFamily: Typography.fontDisplay,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 4,
    },
    activeRoute: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 16,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBarBg: {
        height: 4,
        backgroundColor: Colors.border,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 4,
    },
    bottomSpacer: {
        height: 80,
    },
    progressText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    emptyStateText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        paddingVertical: 20,
    },
});
