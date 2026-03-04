import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Typography } from '@/theme/tokens';
import { StatusBadge } from './StatusBadge';
import { DeliveryStatus } from '@/types';
import { Box, FileText, Component, GripHorizontal, MapPin, Clock } from 'lucide-react-native';

export interface DeliveryCardProps {
    id: string;
    customerName: string;
    pickupAddress: string;
    deliveryAddress: string;
    distance: string;
    estimatedTime: string;
    price: string;
    status: DeliveryStatus;
    packageType: 'standard' | 'fragile' | 'heavy' | 'document';
    date?: string;
    onPress: () => void;
}

export const DeliveryCard = memo<DeliveryCardProps>(({
    id,
    customerName,
    pickupAddress,
    deliveryAddress,
    distance,
    estimatedTime,
    price,
    status,
    packageType,
    date,
    onPress,
}) => {
    const renderPackageIcon = () => {
        const size = 16;
        const color = Colors.gray;
        switch (packageType) {
            case 'fragile': return <Component color={color} size={size} />;
            case 'heavy': return <GripHorizontal color={color} size={size} />;
            case 'document': return <FileText color={color} size={size} />;
            case 'standard':
            default: return <Box color={color} size={size} />;
        }
    };

    return (
        <TouchableOpacity
            style={styles.container}
            activeOpacity={0.8}
            onPress={onPress}
        >
            {/* Header Row */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    {renderPackageIcon()}
                    <Text style={styles.customerName}>{customerName}</Text>
                </View>
                <StatusBadge status={status} size="sm" showDot={true} />
            </View>

            {/* Date line (optional) */}
            {date && <Text style={styles.dateText}>{date} • #{id}</Text>}

            {/* Route Row */}
            <View style={styles.routeContainer}>
                <View style={styles.routeTimeline}>
                    <View style={styles.routeDotA} />
                    <View style={styles.routeLine} />
                    <View style={styles.routeDotB} />
                </View>
                <View style={styles.routeAddresses}>
                    <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
                        {pickupAddress}
                    </Text>
                    <View style={styles.addressSpacer} />
                    <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="tail">
                        {deliveryAddress}
                    </Text>
                </View>
            </View>

            {/* Bottom Info Row */}
            <View style={styles.footerRow}>
                <View style={styles.footerChips}>
                    <View style={styles.chip}>
                        <MapPin color={Colors.primary} size={14} />
                        <Text style={styles.chipText}>{distance}</Text>
                    </View>
                    <View style={styles.chip}>
                        <Clock color={Colors.gray} size={14} />
                        <Text style={styles.chipText}>{estimatedTime}</Text>
                    </View>
                </View>
                <Text style={styles.price}>{price}</Text>
            </View>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    customerName: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
    },
    dateText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 12,
    },
    routeContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    routeTimeline: {
        alignItems: 'center',
        marginRight: 12,
        marginTop: 4,
        height: 36, // Fixed height to bound the dashed line
    },
    routeDotA: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.primary,
    },
    routeLine: {
        flex: 1,
        width: 1,
        borderStyle: 'dashed',
        borderWidth: 1,
        borderColor: Colors.grayDim,
        marginVertical: 4,
        borderRadius: 1,
    },
    routeDotB: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.white,
    },
    routeAddresses: {
        flex: 1,
        justifyContent: 'space-between',
        height: 44, // Taller to align with dot A and B
    },
    addressText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    addressSpacer: {
        flex: 1,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 12,
    },
    footerChips: {
        flexDirection: 'row',
        gap: 16,
    },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    chipText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    price: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.primary,
    },
});
DeliveryCard.displayName = 'DeliveryCard';
