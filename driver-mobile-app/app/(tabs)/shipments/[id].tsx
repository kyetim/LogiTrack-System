import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchShipment, updateShipmentStatus } from '../../../store/slices/shipmentsSlice';
import { COLORS } from '../../../utils/constants';
import StatusBadge from '../../../components/StatusBadge';

export default function ShipmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { currentShipment, isLoading, error } = useAppSelector((state) => state.shipments);

    useEffect(() => {
        if (id) {
            dispatch(fetchShipment(id));
        }
    }, [id, dispatch]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCallCustomer = (phone: string) => {
        Linking.openURL(`tel:${phone}`);
    };

    const handleShowOnMap = () => {
        if (!currentShipment) return;
        router.push({
            pathname: '/(tabs)/map',
            params: { shipmentId: currentShipment.id },
        });
    };

    const handleUpdateStatus = () => {
        if (!currentShipment) return;

        let nextStatus: any = null;
        let statusText = '';

        if (currentShipment.status === 'PENDING') {
            nextStatus = 'IN_TRANSIT';
            statusText = 'Yolda';
        } else if (currentShipment.status === 'IN_TRANSIT') {
            nextStatus = 'DELIVERED';
            statusText = 'Teslim Edildi';
        }

        if (!nextStatus) {
            Alert.alert('Bilgi', 'Bu sevkiyatın durumu güncellenemez');
            return;
        }

        Alert.alert(
            'Durum Güncelle',
            `Sevkiyat durumunu "${statusText}" olarak güncellemek istediğinize emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Güncelle',
                    onPress: async () => {
                        try {
                            await dispatch(
                                updateShipmentStatus({ id: currentShipment.id, status: nextStatus })
                            ).unwrap();
                            Alert.alert('Başarılı', 'Sevkiyat durumu güncellendi');
                        } catch (error) {
                            Alert.alert('Hata', 'Durum güncellenemedi');
                        }
                    },
                },
            ]
        );
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Sevkiyat yükleniyor...</Text>
            </View>
        );
    }

    if (error || !currentShipment) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={COLORS.danger} />
                <Text style={styles.errorText}>Sevkiyat bulunamadı</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Text style={styles.retryButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const canUpdateStatus =
        currentShipment.status === 'PENDING' || currentShipment.status === 'IN_TRANSIT';

    return (
        <ScrollView style={styles.container}>
            {/* Header Card */}
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.trackingNumber}>{currentShipment.trackingNumber}</Text>
                    <StatusBadge status={currentShipment.status} />
                </View>
            </View>

            {/* Addresses Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Adresler</Text>

                {/* Pickup */}
                <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                        name="map-marker-up"
                        size={24}
                        color={COLORS.success}
                    />
                    <View style={styles.addressContent}>
                        <Text style={styles.addressLabel}>Alış Noktası</Text>
                        <Text style={styles.addressText}>{currentShipment.origin}</Text>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Delivery */}
                <View style={styles.addressRow}>
                    <MaterialCommunityIcons
                        name="map-marker-down"
                        size={24}
                        color={COLORS.danger}
                    />
                    <View style={styles.addressContent}>
                        <Text style={styles.addressLabel}>Teslim Noktası</Text>
                        <Text style={styles.addressText}>{currentShipment.destination}</Text>
                    </View>
                </View>
            </View>

            {/* Customer Info Card (if available) */}
            {(currentShipment.customerName || currentShipment.customerPhone) && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Müşteri Bilgileri</Text>

                    {currentShipment.customerName && (
                        <View style={styles.infoRow}>
                            <MaterialCommunityIcons
                                name="account"
                                size={20}
                                color={COLORS.textLight}
                            />
                            <Text style={styles.infoText}>{currentShipment.customerName}</Text>
                        </View>
                    )}

                    {currentShipment.customerPhone && (
                        <TouchableOpacity
                            style={styles.infoRow}
                            onPress={() => handleCallCustomer(currentShipment.customerPhone!)}
                        >
                            <MaterialCommunityIcons
                                name="phone"
                                size={20}
                                color={COLORS.primary}
                            />
                            <Text style={[styles.infoText, styles.phoneText]}>
                                {currentShipment.customerPhone}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Time Info Card */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Zaman Bilgileri</Text>

                <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                        name="calendar-plus"
                        size={20}
                        color={COLORS.textLight}
                    />
                    <View>
                        <Text style={styles.infoLabel}>Oluşturulma</Text>
                        <Text style={styles.infoText}>{formatDate(currentShipment.createdAt)}</Text>
                    </View>
                </View>

                {currentShipment.updatedAt && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons
                            name="calendar-edit"
                            size={20}
                            color={COLORS.textLight}
                        />
                        <View>
                            <Text style={styles.infoLabel}>Son Güncelleme</Text>
                            <Text style={styles.infoText}>
                                {formatDate(currentShipment.updatedAt)}
                            </Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Notes (if available) */}
            {currentShipment.notes && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Notlar</Text>
                    <Text style={styles.notesText}>{currentShipment.notes}</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.primaryButton} onPress={handleShowOnMap}>
                    <MaterialCommunityIcons name="map" size={20} color="white" />
                    <Text style={styles.primaryButtonText}>Haritada Göster</Text>
                </TouchableOpacity>

                {canUpdateStatus && (
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleUpdateStatus}>
                        <MaterialCommunityIcons name="update" size={20} color={COLORS.primary} />
                        <Text style={styles.secondaryButtonText}>Durumu Güncelle</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
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
        backgroundColor: COLORS.background,
        padding: 20,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.textLight,
    },
    errorText: {
        marginTop: 16,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    trackingNumber: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 16,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    addressContent: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 4,
    },
    addressText: {
        fontSize: 15,
        color: COLORS.text,
        lineHeight: 22,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginVertical: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 12,
        color: COLORS.textLight,
        marginBottom: 2,
    },
    infoText: {
        fontSize: 15,
        color: COLORS.text,
    },
    phoneText: {
        color: COLORS.primary,
        textDecorationLine: 'underline',
    },
    notesText: {
        fontSize: 14,
        color: COLORS.text,
        lineHeight: 20,
    },
    actionsContainer: {
        marginHorizontal: 16,
        marginTop: 16,
        gap: 12,
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 8,
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        paddingVertical: 14,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        gap: 8,
    },
    secondaryButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 32,
    },
});
