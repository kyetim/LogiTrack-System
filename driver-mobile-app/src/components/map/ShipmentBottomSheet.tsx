import React, { useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    PanResponder,
    Dimensions,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, Phone, MessageSquare, Clock, Package, Navigation, AlertCircle } from 'lucide-react-native';
import { Colors, Typography, Spacing } from '@/theme/tokens';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { Delivery, AvailableJob } from '@/types';

export interface ShipmentBottomSheetProps {
    delivery: Delivery | AvailableJob | null;
    type: 'active' | 'job';
    isVisible: boolean;
    onClose: () => void;
    onPrimaryAction: () => void;
    onSecondaryAction?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_SHEET_MAX_HEIGHT = 400; // Adjusted for content height

export const ShipmentBottomSheet: React.FC<ShipmentBottomSheetProps> = ({
    delivery,
    type,
    isVisible,
    onClose,
    onPrimaryAction,
    onSecondaryAction,
}) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(BOTTOM_SHEET_MAX_HEIGHT)).current;

    // Handle open/close animation
    useEffect(() => {
        Animated.spring(translateY, {
            toValue: isVisible ? 0 : BOTTOM_SHEET_MAX_HEIGHT,
            useNativeDriver: true,
            bounciness: 0,
            speed: 14,
        }).start();
    }, [isVisible, translateY]);

    // Handle drag to close
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: (_, gestureState) => {
                // Ensure drag starts vertically downward
                return gestureState.dy > 5 && Math.abs(gestureState.dx) < 20;
            },
            onPanResponderMove: (_, gestureState) => {
                if (gestureState.dy > 0) {
                    translateY.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (_, gestureState) => {
                if (gestureState.dy > 80 || gestureState.vy > 0.5) {
                    onClose();
                } else {
                    // Snap back to top
                    Animated.spring(translateY, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    if (!delivery) return null;

    const isActiveDelivery = type === 'active' && 'status' in delivery;
    const isAvailableJob = type === 'job' && 'expiresIn' in delivery;

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY }] },
                { paddingBottom: Math.max(insets.bottom, 24) }
            ]}
        >
            <View {...panResponder.panHandlers} style={styles.dragArea}>
                <View style={styles.dragHandle} />
            </View>

            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <Text style={styles.customerName} numberOfLines={1}>
                        {delivery.customerName}
                    </Text>
                    {isActiveDelivery && (
                        <StatusBadge status={(delivery as Delivery).status} />
                    )}
                    {isAvailableJob && (
                        <Text style={styles.priceText}>₺{(delivery as AvailableJob).price}</Text>
                    )}
                </View>

                {/* Address Section */}
                <View style={styles.addressContainer}>
                    <MapPin size={16} color={Colors.gray} />
                    <Text style={styles.addressText} numberOfLines={2}>
                        {delivery.deliveryAddress}
                    </Text>
                </View>

                {/* Available Job specifics */}
                {isAvailableJob && (
                    <View style={styles.jobSpecs}>
                        <View style={styles.distanceChip}>
                            <Navigation size={12} color={Colors.gray} />
                            <Text style={styles.chipText}>Alım: {(delivery as AvailableJob).pickupDistance}</Text>
                        </View>
                        {(delivery as AvailableJob).expiresIn && (
                            <View style={[
                                styles.distanceChip,
                                (delivery as AvailableJob).expiresIn! <= 60 && styles.chipWarning
                            ]}>
                                <Clock size={12} color={(delivery as AvailableJob).expiresIn! <= 60 ? Colors.error : Colors.gray} />
                                <Text style={[
                                    styles.chipText,
                                    (delivery as AvailableJob).expiresIn! <= 60 && { color: Colors.error }
                                ]}>
                                    Kalan: {(delivery as AvailableJob).expiresIn} dk
                                </Text>
                            </View>
                        )}
                    </View>
                )}


                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>
                            {isActiveDelivery ? 'Mesafe' : 'Teslimat'}
                        </Text>
                        <Text style={styles.statValue}>
                            {isActiveDelivery
                                ? (delivery as Delivery).distance
                                : (delivery as AvailableJob).distance}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>Süre</Text>
                        <Text style={styles.statValue}>
                            {isActiveDelivery
                                ? (delivery as Delivery).estimatedTime
                                : (delivery as AvailableJob).estimatedTime}
                        </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>
                            {isActiveDelivery ? 'Ücret' : 'Tür'}
                        </Text>
                        <Text style={styles.statValue}>
                            {isActiveDelivery
                                ? `₺${(delivery as Delivery).price}`
                                : (delivery as AvailableJob).packageType}
                        </Text>
                    </View>
                </View>

                {/* Contact Row (Active Delivery only) */}
                {isActiveDelivery && (
                    <View style={styles.contactRow}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {delivery.customerName.charAt(0)}
                            </Text>
                        </View>
                        <View style={styles.contactInfo}>
                            <Text style={styles.contactName}>{delivery.customerName}</Text>
                        </View>
                        <View style={styles.actionButtonsRow}>
                            <TouchableOpacity style={styles.iconButton}>
                                <MessageSquare size={20} color={Colors.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.iconButton}>
                                <Phone size={20} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Bottom Actions */}
                <View style={styles.actionsContainer}>
                    {type === 'active' ? (
                        <>
                            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onSecondaryAction}>
                                <AlertCircle size={18} color={Colors.gray} />
                                <Text style={styles.btnOutlineText}>Sorun Bildir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onPrimaryAction}>
                                <Text style={styles.btnPrimaryText}>Devam Et</Text>
                                <Navigation size={18} color="#000" />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={onSecondaryAction}>
                                <Text style={styles.btnOutlineText}>Detay</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onPrimaryAction}>
                                <Text style={styles.btnPrimaryText}>Hemen Al</Text>
                                <Package size={18} color="#000" />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1A1A1A',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 20,
        zIndex: 1000,
    },
    dragArea: {
        width: '100%',
        paddingTop: 12,
        paddingBottom: 4,
        alignItems: 'center',
    },
    dragHandle: {
        width: 40,
        height: 4,
        backgroundColor: '#3A3A3A',
        borderRadius: 2,
    },
    content: {
        paddingHorizontal: Spacing[4],
        paddingTop: Spacing[3],
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing[1],
    },
    customerName: {
        flex: 1,
        fontSize: 18,
        fontFamily: Typography.fontDisplay,
        color: Colors.white,
        marginRight: Spacing[3],
    },
    priceText: {
        fontSize: 18,
        fontFamily: Typography.fontDisplay,
        color: Colors.primary,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing[3],
        paddingRight: Spacing[4],
    },
    addressText: {
        flex: 1,
        marginLeft: 6,
        fontSize: 13,
        fontFamily: Typography.fontBody,
        color: Colors.gray,
        lineHeight: 18,
    },
    jobSpecs: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing[2],
    },
    distanceChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    chipWarning: {
        borderWidth: 1,
        borderColor: Colors.error,
        backgroundColor: 'rgba(255, 82, 82, 0.1)',
    },
    chipText: {
        fontSize: 12,
        fontFamily: Typography.fontBodyMedium,
        color: Colors.gray,
    },
    statsRow: {
        flexDirection: 'row',
        backgroundColor: '#242424',
        borderRadius: 16,
        paddingVertical: Spacing[3],
        paddingHorizontal: Spacing[1],
        marginBottom: Spacing[4],
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontFamily: Typography.fontBody,
        color: Colors.gray,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 14,
        fontFamily: Typography.fontDisplay,
        color: Colors.primary,
    },
    statDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#3A3A3A',
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        borderRadius: 16,
        padding: Spacing[1],
        marginBottom: Spacing[4],
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,215,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing[1],
    },
    avatarText: {
        fontSize: 16,
        fontFamily: Typography.fontDisplay,
        color: Colors.primary,
    },
    contactInfo: {
        flex: 1,
    },
    contactName: {
        fontSize: 14,
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.white,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: Spacing[1],
    },
    iconButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2A2A2A',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: Spacing[1],
    },
    btn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    btnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#3A3A3A',
    },
    btnPrimary: {
        backgroundColor: Colors.primary,
        flex: 2,
    },
    btnOutlineText: {
        color: Colors.gray,
        fontSize: 14,
        fontFamily: Typography.fontBodySemiBold,
    },
    btnPrimaryText: {
        color: '#000',
        fontSize: 14,
        fontFamily: Typography.fontBodySemiBold,
    },
});
