import React, { useEffect, useRef, memo } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/theme/tokens';
import { DeliveryStatus } from '@/types';

export type BadgeSize = 'sm' | 'md';

interface StatusBadgeProps {
    status: DeliveryStatus;
    size?: BadgeSize;
    showDot?: boolean;
}

const statusConfig: Record<DeliveryStatus, { bg: string; text: string; dot: string; pulse: boolean; label: string }> = {
    active: { bg: 'rgba(255,215,0,0.12)', text: '#FFD700', dot: '#FFD700', pulse: false, label: 'Aktif' },
    completed: { bg: 'rgba(76,175,80,0.12)', text: '#4CAF50', dot: '#4CAF50', pulse: false, label: 'Tamamlandı' },
    pending: { bg: 'rgba(255,152,0,0.12)', text: '#FF9800', dot: '#FF9800', pulse: true, label: 'Bekliyor' },
    cancelled: { bg: 'rgba(255,82,82,0.12)', text: '#FF5252', dot: '#FF5252', pulse: false, label: 'İptal' },
    online: { bg: 'rgba(76,175,80,0.12)', text: '#4CAF50', dot: '#4CAF50', pulse: true, label: 'Çevrimiçi' },
    offline: { bg: 'rgba(138,138,138,0.12)', text: '#8A8A8A', dot: '#8A8A8A', pulse: false, label: 'Çevrimdışı' },
    delivering: { bg: 'rgba(255,215,0,0.12)', text: '#FFD700', dot: '#FFD700', pulse: true, label: 'Teslimatta' },
};

export const StatusBadge = memo<StatusBadgeProps>(({ status, size = 'md', showDot = true }) => {
    const config = statusConfig[status];
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (config.pulse) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0.3,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [config.pulse, pulseAnim]);

    // Handle Sizes
    const isSm = size === 'sm';
    const paddingHorizontal = isSm ? 8 : 12;
    const paddingVertical = isSm ? 4 : 6;
    const fontSize = isSm ? 10 : 12;
    const dotSize = isSm ? 5 : 7;
    const borderRadius = 20;

    return (
        <View style={[styles.container, { backgroundColor: config.bg, paddingHorizontal, paddingVertical, borderRadius }]}>
            {showDot && (
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            backgroundColor: config.dot,
                            width: dotSize,
                            height: dotSize,
                            borderRadius: dotSize / 2,
                            opacity: pulseAnim,
                        },
                    ]}
                />
            )}
            <Text style={[styles.text, { color: config.text, fontSize }]}>{config.label}</Text>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    dot: {
        marginRight: 6,
    },
    text: {
        fontFamily: Typography.fontBodySemiBold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
});

StatusBadge.displayName = 'StatusBadge';
