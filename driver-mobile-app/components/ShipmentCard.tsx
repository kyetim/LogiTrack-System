import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Shipment } from '../types';
import { COLORS } from '../utils/constants';
import StatusBadge from './StatusBadge';

interface ShipmentCardProps {
    shipment: Shipment;
    onPress: () => void;
}

export default function ShipmentCard({ shipment, onPress }: ShipmentCardProps) {
    // Format date to Turkish locale
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Shorten address for display
    const shortenAddress = (address: string, maxLength = 40) => {
        if (address.length <= maxLength) return address;
        return address.substring(0, maxLength) + '...';
    };

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <MaterialCommunityIcons
                        name="package-variant"
                        size={20}
                        color={COLORS.primary}
                    />
                    <Text style={styles.trackingNumber}>
                        {shipment.trackingNumber}
                    </Text>
                    {/* Sequence Badge */}
                    {shipment.sequence && (
                        <View style={styles.sequenceBadge}>
                            <Text style={styles.sequenceText}>#{shipment.sequence}</Text>
                        </View>
                    )}
                </View>
                <StatusBadge status={shipment.status} />
            </View>

            {/* Addresses */}
            <View style={styles.addresses}>
                {/* Pickup */}
                <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                        name="map-marker-up"
                        size={18}
                        color={COLORS.success}
                    />
                    <View style={styles.addressText}>
                        <Text style={styles.addressLabel}>Alış</Text>
                        <Text style={styles.addressValue} numberOfLines={1}>
                            {shortenAddress(shipment.origin || 'Bilinmiyor')}
                        </Text>
                    </View>
                </View>

                {/* Delivery */}
                <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                        name="map-marker-down"
                        size={18}
                        color={COLORS.danger}
                    />
                    <View style={styles.addressText}>
                        <Text style={styles.addressLabel}>Teslim</Text>
                        <Text style={styles.addressValue} numberOfLines={1}>
                            {shortenAddress(shipment.destination || 'Bilinmiyor')}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.date}>
                    {formatDate(shipment.createdAt)}
                </Text>
                <MaterialCommunityIcons
                    name="chevron-right"
                    size={20}
                    color={COLORS.textLight}
                />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    trackingNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
    },
    addresses: {
        gap: 12,
        marginBottom: 12,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    addressText: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 11,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    addressValue: {
        fontSize: 14,
        color: COLORS.text,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    date: {
        fontSize: 12,
        color: COLORS.textLight,
    },
    sequenceBadge: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginLeft: 4,
    },
    sequenceText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
