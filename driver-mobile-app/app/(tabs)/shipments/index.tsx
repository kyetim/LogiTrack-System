import React, { useEffect } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    Text,
    ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchShipments } from '../../../store/slices/shipmentsSlice';
import ShipmentCard from '../../../components/ShipmentCard';
import { COLORS } from '../../../utils/constants';

export default function ShipmentsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { shipments, isLoading, error } = useAppSelector((state) => state.shipments);

    useEffect(() => {
        // Load shipments on mount
        dispatch(fetchShipments());
    }, []);

    const handleRefresh = () => {
        dispatch(fetchShipments());
    };

    const handleShipmentPress = (shipmentId: string) => {
        router.push(`/shipments/${shipmentId}`);
    };

    // Sort shipments by sequence and status
    const sortedShipments = React.useMemo(() => {
        return [...shipments].sort((a, b) => {
            // Status priority: PENDING > IN_TRANSIT > PICKED_UP > DELIVERED > CANCELLED
            const statusOrder: Record<string, number> = {
                'PENDING': 0,
                'IN_TRANSIT': 1,
                'PICKED_UP': 2,
                'DELIVERED': 3,
                'CANCELLED': 4,
            };

            const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            if (statusDiff !== 0) return statusDiff;

            // Then sort by sequence (ascending)
            if (a.sequence && b.sequence) return a.sequence - b.sequence;
            if (a.sequence) return -1; // a has sequence, prioritize
            if (b.sequence) return 1;  // b has sequence, prioritize

            return 0;
        });
    }, [shipments]);

    // Loading state
    if (isLoading && shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Sevkiyatlar yükleniyor...</Text>
            </View>
        );
    }

    // Error state
    if (error && shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="alert-circle-outline"
                    size={64}
                    color={COLORS.danger}
                />
                <Text style={styles.errorTitle}>Bir hata oluştu</Text>
                <Text style={styles.errorMessage}>{error}</Text>
            </View>
        );
    }

    // Empty state
    if (shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons
                    name="package-variant-closed"
                    size={64}
                    color={COLORS.textLight}
                />
                <Text style={styles.emptyTitle}>Henüz sevkiyat yok</Text>
                <Text style={styles.emptyMessage}>
                    Size atanan sevkiyatlar burada görünecek
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={sortedShipments}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ShipmentCard
                        shipment={item}
                        onPress={() => handleShipmentPress(item.id)}
                    />
                )}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isLoading}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sevkiyatlarım</Text>
                        <Text style={styles.headerSubtitle}>
                            {sortedShipments.length} sevkiyat
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: COLORS.background,
    },
    listContent: {
        paddingVertical: 16,
    },
    header: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textLight,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textLight,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.danger,
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: 14,
        color: COLORS.textLight,
        textAlign: 'center',
    },
});
