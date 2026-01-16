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
import { useAppDispatch, useAppSelector } from '../../store';
import { fetchShipments } from '../../store/slices/shipmentsSlice';
import ShipmentCard from '../../components/ShipmentCard';
import { COLORS } from '../../utils/constants';

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
        // TODO: Navigate to shipment detail screen
        console.log('Navigate to shipment:', shipmentId);
    };

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
                data={shipments}
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
                            {shipments.length} sevkiyat
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
