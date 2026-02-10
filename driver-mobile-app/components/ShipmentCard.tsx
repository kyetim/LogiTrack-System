import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shipment } from '../types';
import { Colors, Typography, Spacing, BorderRadius } from '../constants/theme';
import StatusBadge from './StatusBadge';
import { TransitCard } from './ui/TransitCard';

interface ShipmentCardProps {
    shipment: Shipment;
    onPress: () => void;
}

export default function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
    // Format date to Turkish locale
    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusColor = (status: Shipment['status']) => {
        switch (status) {
            case 'PENDING': return Colors.warning;
            case 'IN_TRANSIT': return Colors.info;
            case 'DELIVERED': return Colors.success;
            case 'CANCELLED': return Colors.danger;
            default: return Colors.gray400;
        }
    };

    return (
        <TransitCard
            onPress={onPress}
            statusBorder={getStatusColor(shipment.status)}
            style={styles.card}
        >
            <View style={styles.header}>
                <View style={styles.trackingContainer}>
                    <Text style={styles.label}>TAKİP NO</Text>
                    <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
                </View>
                {shipment.sequence && (
                    <View style={styles.sequenceBadge}>
                        <Text style={styles.sequenceText}>#{shipment.sequence}</Text>
                    </View>
                )}
            </View>

            <View style={styles.addressSection}>
                <View style={styles.pathVisual}>
                    <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                    <View style={styles.line} />
                    <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                </View>
                <View style={styles.addressTextContainer}>
                    <Text style={styles.addressText} numberOfLines={1}>
                        {shipment.origin || 'Yükleme Noktası'}
                    </Text>
                    <View style={{ height: 16 }} />
                    <Text style={[styles.addressText, styles.destinationText]} numberOfLines={1}>
                        {shipment.destination || 'Teslim Noktası'}
                    </Text>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="calendar" size={14} color={Colors.gray400} />
                    <Text style={styles.infoText}>{formatDate(shipment.createdAt)}</Text>
                </View>
                <View style={styles.statusContainer}>
                    <StatusBadge status={shipment.status} />
                </View>
            </View>
        </TransitCard>
    );
}

const styles = StyleSheet.create({
    card: {
        marginBottom: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    trackingContainer: {
        gap: 2,
    },
    label: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.gray400,
        letterSpacing: 1,
    },
    trackingNumber: {
        fontSize: Typography.md,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    sequenceBadge: {
        backgroundColor: Colors.primary,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.md,
    },
    sequenceText: {
        color: Colors.white,
        fontSize: Typography.sm,
        fontWeight: Typography.bold,
    },
    addressSection: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    pathVisual: {
        alignItems: 'center',
        marginRight: Spacing.md,
        paddingTop: 6,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 1,
        height: 18,
        backgroundColor: Colors.gray200,
        marginVertical: 4,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressText: {
        fontSize: Typography.base,
        color: Colors.gray700,
        fontWeight: Typography.medium,
    },
    destinationText: {
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Colors.gray100,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    infoText: {
        fontSize: Typography.xs,
        color: Colors.gray500,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
});
