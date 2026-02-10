import React, { useEffect, useState } from 'react';
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
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../../store';
import { fetchShipment, updateShipmentStatus } from '../../../../store/slices/shipmentsSlice';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../../constants/theme';
import StatusBadge from '../../../../components/StatusBadge';
import { TransitCard } from '../../../../components/ui/TransitCard';
import { LinearGradient } from 'expo-linear-gradient';
import { API_URL, STORAGE_KEYS } from '../../../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ShipmentDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { currentShipment, isLoading, error } = useAppSelector((state) => state.shipments);
    const [isDownloadingWaybill, setIsDownloadingWaybill] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            if (id) {
                dispatch(fetchShipment(id));
            }
        }, [id, dispatch])
    );

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
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
            pathname: '/(drawer)/(tabs)/map',
            params: { shipmentId: currentShipment.id },
        });
    };

    const handleViewWaybill = async () => {
        if (!currentShipment) return;

        try {
            setIsDownloadingWaybill(true);

            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (!token) {
                Alert.alert('Hata', 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
                return;
            }

            let downloadUrl = `${API_URL}/shipments/${currentShipment.id}/waybill`;
            let fileName = `waybill-${currentShipment.trackingNumber}.pdf`;

            if (currentShipment.waybillUrl) {
                const baseUrl = API_URL.replace('/api', '');
                const urlParts = currentShipment.waybillUrl.split('/');
                const filename = urlParts.pop();
                const folder = urlParts.pop();

                if (filename && folder) {
                    downloadUrl = `${baseUrl}/file-upload/${folder}/${filename}`;
                    fileName = filename;
                }
            }

            const fileUri = FileSystem.cacheDirectory + fileName;

            const downloadRes = await FileSystem.downloadAsync(
                downloadUrl,
                fileUri,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (downloadRes.status !== 200) {
                Alert.alert(
                    'Hata',
                    `İrsaliye indirilemedi (Hata: ${downloadRes.status}). Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.`
                );
                return;
            }

            if (!(await Sharing.isAvailableAsync())) {
                Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor');
                return;
            }

            // On iOS: Share menu shows preview + sharing options
            // On Android: User selects PDF viewer app
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/pdf',
                dialogTitle: `İrsaliye - ${currentShipment.trackingNumber}`,
                UTI: 'com.adobe.pdf',
            });

        } catch (error) {
            console.error('Waybill error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
            Alert.alert('Hata', `İrsaliye açılırken bir sorun oluştu:\n${errorMessage}`);
        } finally {
            setIsDownloadingWaybill(false);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Sevkiyat yükleniyor...</Text>
            </View>
        );
    }

    if (error || !currentShipment) {
        return (
            <View style={styles.centerContainer}>
                <MaterialCommunityIcons name="alert-circle" size={64} color={Colors.danger} />
                <Text style={styles.errorText}>Sevkiyat bulunamadı</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
                    <Text style={styles.retryButtonText}>Geri Dön</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} bounces={false}>
            {/* Header Section */}
            <LinearGradient
                colors={[Colors.gray900, '#0f172a']}
                style={styles.headerGradient}
            >
                <View style={styles.headerContent}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
                    </TouchableOpacity>
                    <View style={styles.headerInfo}>
                        <Text style={styles.headerLabel}>TAKİP NUMARASI</Text>
                        <Text style={styles.headerTracking}>{currentShipment.trackingNumber}</Text>
                    </View>
                    <StatusBadge status={currentShipment.status} />
                </View>
            </LinearGradient>

            <View style={styles.content}>
                {/* Route Card */}
                <TransitCard style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Güzergah Bilgisi</Text>
                    <View style={styles.addressRow}>
                        <View style={styles.pathVisual}>
                            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                        </View>
                        <View style={styles.addressTextContainer}>
                            <View>
                                <Text style={styles.addressLabel}>ALIM NOKTASI</Text>
                                <Text style={styles.addressValue}>{currentShipment.origin}</Text>
                            </View>
                            <View style={{ height: 24 }} />
                            <View>
                                <Text style={styles.addressLabel}>TESLİMAT NOKTASI</Text>
                                <Text style={[styles.addressValue, styles.boldText]}>{currentShipment.destination}</Text>
                            </View>
                        </View>
                    </View>
                </TransitCard>

                {/* Customer Card */}
                {(currentShipment.customerName || currentShipment.customerPhone) && (
                    <TransitCard style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Müşteri Detayları</Text>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBox}>
                                <MaterialCommunityIcons name="account" size={20} color={Colors.gray500} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Müşteri Adı</Text>
                                <Text style={styles.infoValue}>{currentShipment.customerName || 'Belirtilmemiş'}</Text>
                            </View>
                        </View>
                        {currentShipment.customerPhone && (
                            <TouchableOpacity
                                style={styles.infoRow}
                                onPress={() => handleCallCustomer(currentShipment.customerPhone!)}
                            >
                                <View style={[styles.infoIconBox, { backgroundColor: Colors.primary + '15' }]}>
                                    <MaterialCommunityIcons name="phone" size={20} color={Colors.primary} />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>Telefon</Text>
                                    <Text style={[styles.infoValue, { color: Colors.primary }]}>{currentShipment.customerPhone}</Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    </TransitCard>
                )}

                {/* Time Info Card */}
                <TransitCard style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Zaman Çizelgesi</Text>
                    <View style={styles.infoRow}>
                        <View style={styles.infoIconBox}>
                            <MaterialCommunityIcons name="clock-outline" size={20} color={Colors.gray500} />
                        </View>
                        <View>
                            <Text style={styles.infoLabel}>Oluşturulma</Text>
                            <Text style={styles.infoValue}>{formatDate(currentShipment.createdAt)}</Text>
                        </View>
                    </View>
                    {currentShipment.updatedAt && (
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconBox}>
                                <MaterialCommunityIcons name="update" size={20} color={Colors.gray500} />
                            </View>
                            <View>
                                <Text style={styles.infoLabel}>Son Güncelleme</Text>
                                <Text style={styles.infoValue}>{formatDate(currentShipment.updatedAt)}</Text>
                            </View>
                        </View>
                    )}
                </TransitCard>

                {/* Notes Card */}
                {currentShipment.notes && (
                    <TransitCard style={styles.sectionCard}>
                        <Text style={styles.sectionTitle}>Sürücü Notları</Text>
                        <Text style={styles.notesText}>{currentShipment.notes}</Text>
                    </TransitCard>
                )}

                {/* Action Buttons */}
                <View style={styles.actions}>
                    {/* PENDING: Show Accept/Start button */}
                    {currentShipment.status === 'PENDING' && (
                        <TouchableOpacity
                            style={styles.deliveryButton}
                            onPress={() => {
                                Alert.alert(
                                    'Teslimatı Kabul Et',
                                    'Bu sevkiyatı kabul edip "Yolda" olarak başlatmak istiyor musunuz?',
                                    [
                                        { text: 'İptal', style: 'cancel' },
                                        {
                                            text: 'Kabul Et',
                                            onPress: async () => {
                                                try {
                                                    await dispatch(
                                                        updateShipmentStatus({ id: currentShipment.id, status: 'IN_TRANSIT' })
                                                    ).unwrap();
                                                    Alert.alert('Başarılı', 'Sevkiyat "Yolda" olarak güncellendi');
                                                    dispatch(fetchShipment(currentShipment.id));
                                                } catch (error) {
                                                    Alert.alert('Hata', 'Durum güncellenemedi');
                                                }
                                            }
                                        }
                                    ]
                                );
                            }}
                        >
                            <MaterialCommunityIcons name="truck-fast" size={24} color="white" />
                            <Text style={styles.deliveryButtonText}>Teslimatı Başlat</Text>
                        </TouchableOpacity>
                    )}

                    {/* IN_TRANSIT: Show Complete Delivery button */}
                    {currentShipment.status === 'IN_TRANSIT' && (
                        <TouchableOpacity
                            style={styles.deliveryButton}
                            onPress={() => {
                                router.push(`/(drawer)/(tabs)/shipments/${currentShipment.id}/delivery-proof`);
                            }}
                        >
                            <MaterialCommunityIcons name="check-circle" size={24} color="white" />
                            <Text style={styles.deliveryButtonText}>Teslimatı Tamamla</Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.secondaryActions}>
                        <TouchableOpacity style={styles.secondaryButton} onPress={handleShowOnMap}>
                            <MaterialCommunityIcons name="map-marker-radius" size={20} color={Colors.primary} />
                            <Text style={styles.secondaryButtonText}>Harita</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={handleViewWaybill}
                            disabled={isDownloadingWaybill}
                        >
                            {isDownloadingWaybill ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <MaterialCommunityIcons name="file-document-outline" size={20} color={Colors.primary} />
                            )}
                            <Text style={styles.secondaryButtonText}>İrsaliye</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
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
        backgroundColor: Colors.surface,
        padding: 20,
    },
    headerGradient: {
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
    },
    headerLabel: {
        fontSize: 10,
        fontWeight: Typography.bold,
        color: 'rgba(255, 255, 255, 0.5)',
        letterSpacing: 1,
    },
    headerTracking: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    content: {
        paddingHorizontal: Spacing.lg,
        marginTop: -20,
    },
    sectionCard: {
        marginBottom: Spacing.md,
        padding: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.base,
        fontWeight: Typography.bold,
        color: Colors.gray900,
        marginBottom: Spacing.lg,
    },
    addressRow: {
        flexDirection: 'row',
    },
    pathVisual: {
        alignItems: 'center',
        marginRight: Spacing.lg,
        paddingTop: 4,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    line: {
        width: 1,
        height: 40,
        backgroundColor: Colors.gray100,
        marginVertical: 4,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        color: Colors.gray400,
        marginBottom: 4,
    },
    addressValue: {
        fontSize: Typography.base,
        color: Colors.gray700,
    },
    boldText: {
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.gray100,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 10,
        color: Colors.gray400,
    },
    infoValue: {
        fontSize: Typography.base,
        color: Colors.gray800,
        fontWeight: Typography.medium,
    },
    notesText: {
        fontSize: Typography.base,
        color: Colors.gray700,
        lineHeight: 22,
    },
    actions: {
        marginTop: Spacing.lg,
        gap: Spacing.md,
    },
    deliveryButton: {
        flexDirection: 'row',
        backgroundColor: Colors.success,
        paddingVertical: 18,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
        ...Shadows.md,
    },
    deliveryButtonText: {
        color: Colors.white,
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
    },
    secondaryActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.white,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.gray100,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontSize: Typography.base,
        fontWeight: Typography.bold,
    },
    loadingText: {
        marginTop: 16,
        fontSize: Typography.base,
        color: Colors.gray500,
    },
    errorText: {
        marginTop: 16,
        fontSize: Typography.base,
        color: Colors.gray900,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 20,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
    },
    retryButtonText: {
        color: 'white',
        fontSize: Typography.base,
        fontWeight: Typography.bold,
    },
    bottomSpacer: {
        height: 60,
    },
});
