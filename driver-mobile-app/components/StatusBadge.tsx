import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

interface StatusBadgeProps {
    status: 'PENDING' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
}

const STATUS_CONFIG = {
    PENDING: {
        label: 'Bekliyor',
        color: COLORS.warning,
        bgColor: COLORS.warning + '20',
    },
    PICKED_UP: {
        label: 'Alındı',
        color: COLORS.info,
        bgColor: COLORS.info + '20',
    },
    IN_TRANSIT: {
        label: 'Yolda',
        color: COLORS.primary,
        bgColor: COLORS.primary + '20',
    },
    DELIVERED: {
        label: 'Teslim Edildi',
        color: COLORS.success,
        bgColor: COLORS.success + '20',
    },
    CANCELLED: {
        label: 'İptal',
        color: COLORS.danger,
        bgColor: COLORS.danger + '20',
    },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
            <Text style={[styles.text, { color: config.color }]}>
                {config.label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    text: {
        fontSize: 12,
        fontWeight: '600',
    },
});
