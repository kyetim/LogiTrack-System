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
import { useAppDispatch, useAppSelector } from '../../../../store';
import { fetchShipments } from '../../../../store/slices/shipmentsSlice';
import ShipmentCard from '../../../../components/ShipmentCard';
import { Colors, Typography, Spacing } from '../../../../constants/theme';

export default function ShipmentsScreen() {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { shipments, isLoading, error } = useAppSelector((state) => state.shipments);

    useEffect(() => {
        dispatch(fetchShipments());
    }, []);

    const handleRefresh = () => {
        dispatch(fetchShipments());
    };

    const handleShipmentPress = (shipmentId: string) => {
        router.push(`/shipments/${shipmentId}`);
    };

    const sortedShipments = React.useMemo(() => {
        return [...shipments].sort((a, b) => {
            const statusOrder: Record<string, number> = {
                'PENDING': 0,
                'IN_TRANSIT': 1,
                'PICKED_UP': 2,
                'DELIVERED': 3,
                'CANCELLED': 4,
            };

            const statusDiff = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
            if (statusDiff !== 0) return statusDiff;

            if (a.sequence && b.sequence) return a.sequence - b.sequence;
            if (a.sequence) return -1;
            if (b.sequence) return 1;

            return 0;
        });
    }, [shipments]);

    if (isLoading && shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Sevkiyatlar yükleniyor...</Text>
            </View>
        );
    }

    if (error && shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={64} color={Colors.danger} />
                <Text style={styles.errorTitle}>Bir hata oluştu</Text>
                <Text style={styles.errorMessage}>{error}</Text>
            </View>
        );
    }

    if (shipments.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="package-variant-closed" size={64} color={Colors.gray400} />
                <Text style={styles.emptyTitle}>Henüz sevkiyat yok</Text>
                <Text style={styles.emptyMessage}>Size atanan sevkiyatlar burada görünecek</Text>
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
                        colors={[Colors.primary]}
                        tintColor={Colors.primary}
                    />
                }
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Sevkiyatlarım</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{sortedShipments.length} AKTİF</Text>
                        </View>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        backgroundColor: Colors.surface,
    },
    listContent: {
        paddingVertical: Spacing.md,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        paddingTop: Spacing.sm,
    },
    headerTitle: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    badge: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: Colors.primary,
        letterSpacing: 0.5,
    },
    loadingText: {
        marginTop: 16,
        fontSize: Typography.base,
        color: Colors.gray500,
    },
    emptyTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.gray900,
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: Typography.base,
        color: Colors.gray500,
        textAlign: 'center',
    },
    errorTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.danger,
        marginTop: 16,
        marginBottom: 8,
    },
    errorMessage: {
        fontSize: Typography.base,
        color: Colors.gray500,
        textAlign: 'center',
    },
});
