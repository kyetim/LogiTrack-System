import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker, LatLng } from 'react-native-maps';
import { Colors, Typography } from '@/theme/tokens';

export interface CustomMarkerProps {
    type: 'driver' | 'pickup' | 'delivery' | 'job';
    coordinate: LatLng;
    label?: string;
    isActive?: boolean;
    onPress?: () => void;
}

export const CustomMarker: React.FC<CustomMarkerProps> = ({
    type,
    coordinate,
    label,
    isActive = false,
    onPress,
}) => {
    // Shared animations
    const pulseAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (type === 'driver' || isActive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(0);
            pulseAnim.stopAnimation();
        }
    }, [type, isActive]);

    const renderContent = () => {
        switch (type) {
            case 'driver': {
                const scale = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.2],
                });
                const opacity = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.4],
                });

                return (
                    <View style={styles.driverContainer} collapsable={false}>
                        <Animated.View
                            style={[
                                styles.driverPulseRing,
                                { transform: [{ scale }], opacity },
                            ]}
                        />
                        <View style={styles.driverInnerCircle} collapsable={false}>
                            <Text style={styles.iconText}>🚚</Text>
                        </View>
                    </View>
                );
            }

            case 'pickup': {
                const ringScale = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15],
                });
                const ringOpacity = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0],
                });

                return (
                    <View style={styles.pinContainer} collapsable={false}>
                        {isActive && (
                            <Animated.View
                                style={[
                                    styles.activeRing,
                                    { borderColor: Colors.primary, transform: [{ scale: ringScale }], opacity: ringOpacity },
                                ]}
                            />
                        )}
                        <View style={[styles.pickupCircle, isActive && styles.activeElevation]} collapsable={false}>
                            <Text style={styles.iconText}>↑</Text>
                        </View>
                        <View style={[styles.pickupTriangle, { borderTopColor: Colors.primary }]} />
                    </View>
                );
            }

            case 'delivery': {
                const ringScale = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15],
                });
                const ringOpacity = pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0],
                });

                return (
                    <View style={styles.pinContainer} collapsable={false}>
                        {isActive && (
                            <Animated.View
                                style={[
                                    styles.activeRing,
                                    { borderColor: Colors.primary, transform: [{ scale: ringScale }], opacity: ringOpacity },
                                ]}
                            />
                        )}
                        <View style={[styles.deliveryCircle, isActive && styles.activeElevation]} collapsable={false}>
                            <Text style={styles.iconTextDark}>⌂</Text>
                        </View>
                        <View style={[styles.pickupTriangle, { borderTopColor: Colors.white }]} />
                    </View>
                );
            }

            case 'job': {
                const isJobActive = isActive;
                return (
                    <View
                        collapsable={false}
                        style={[
                            styles.jobPill,
                            isJobActive && styles.jobPillActive,
                        ]}
                    >
                        <Text style={[styles.jobIconText, { color: isJobActive ? '#000' : Colors.primary }]}>💼</Text>
                        {label && (
                            <Text
                                style={[
                                    styles.jobLabel,
                                    { color: isJobActive ? '#000' : Colors.primary },
                                ]}
                            >
                                {label}
                            </Text>
                        )}
                    </View>
                );
            }

            default:
                return null;
        }
    };

    return (
        <Marker
            coordinate={coordinate}
            onPress={onPress}
            anchor={{ x: 0.5, y: type === 'job' ? 0.5 : 1 }}
            zIndex={isActive || type === 'driver' ? 999 : 1}
        >
            {renderContent()}
        </Marker>
    );
};

const styles = StyleSheet.create({
    // Driver styles
    driverContainer: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
    },
    driverPulseRing: {
        position: 'absolute',
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 3,
        borderColor: Colors.primary,
        backgroundColor: 'rgba(255,215,0,0.15)',
    },
    driverInnerCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },

    // Pin Wrapper
    pinContainer: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        width: 56,
        height: 72,
    },
    activeRing: {
        position: 'absolute',
        top: 12,
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
    },
    activeElevation: {
        transform: [{ scale: 1.05 }],
        elevation: 8,
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },

    // Pickup Style
    pickupCircle: {
        width: 40,
        height: 40,
        backgroundColor: Colors.primary,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 2,
    },
    pickupTriangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 6,
        borderRightWidth: 6,
        borderBottomWidth: 0,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        marginTop: -1, // slightly overlap to remove gap
        zIndex: 1,
    },

    // Delivery Style
    deliveryCircle: {
        width: 40,
        height: 40,
        backgroundColor: Colors.white,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        zIndex: 2,
    },

    // Job Pill
    jobPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#242424',
        borderWidth: 1,
        borderColor: Colors.primary,
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 10,
        gap: 4,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    jobPillActive: {
        backgroundColor: Colors.primary,
    },
    iconText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000',
        lineHeight: 20,
    },
    iconTextDark: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0D0D0D',
        lineHeight: 22,
    },
    jobIconText: {
        fontSize: 12,
    },
    jobLabel: {
        fontFamily: Typography.fontDisplay,
        fontSize: 11,
    },
});
