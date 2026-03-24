import React, { useCallback, useMemo, forwardRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import {
    BottomSheetModal,
    BottomSheetView,
    BottomSheetBackdrop,
    BottomSheetBackdropProps
} from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Shipment } from '../../types';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import StatusBadge from '../StatusBadge';
import { useRouter } from 'expo-router';
import { API_URL, STORAGE_KEYS } from '../../utils/constants';

interface ShipmentBottomSheetProps {
    shipment: Shipment | null;
    onClose?: () => void;
}

export const ShipmentBottomSheet = forwardRef<BottomSheetModal, ShipmentBottomSheetProps>(
    ({ shipment, onClose }, ref) => {
        const router = useRouter();
        const [isDownloading, setIsDownloading] = useState(false);

        // variables
        const snapPoints = useMemo(() => ['50%', '65%'], []);

        // callbacks
        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    opacity={0.5}
                />
            ),
            []
        );

        const handleCall = () => {
            if (shipment?.customerPhone) {
                Linking.openURL(`tel:${shipment.customerPhone}`);
            }
        };

        const handleViewDetails = () => {
            if (shipment) {
                router.push(`/(drawer)/(tabs)/shipments/${shipment.id}`);
            }
        };

        const handleViewWaybill = async () => {
            if (!shipment) return;

            try {
                setIsDownloading(true);

                const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
                if (!token) {
                    Alert.alert('Hata', 'Oturum süreniz dolmuş.');
                    return;
                }

                let downloadUrl = `${API_URL}/shipments/${shipment.id}/waybill`;
                let fileName = `waybill-${shipment.trackingNumber}.pdf`;

                if (shipment.waybillUrl) {
                    const baseUrl = API_URL.replace('/api', '');
                    const urlParts = shipment.waybillUrl.split('/');
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
                        `İrsaliye indirilemedi (Hata: ${downloadRes.status}). Lütfen tekrar deneyin.`
                    );
                    return;
                }

                if (!(await Sharing.isAvailableAsync())) {
                    Alert.alert('Hata', 'Paylaşım bu cihazda desteklenmiyor');
                    return;
                }

                await Sharing.shareAsync(fileUri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `İrsaliye - ${shipment.trackingNumber}`,
                    UTI: 'com.adobe.pdf',
                });

            } catch (error) {
                console.error('Waybill error:', error);
                const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
                Alert.alert('Hata', `İrsaliye açılırken bir sorun oluştu:\n${errorMessage}`);
            } finally {
                setIsDownloading(false);
            }
        };

        if (!shipment) return null;

        return (
            <BottomSheetModal
                ref={ref}
                index={0}
                snapPoints={snapPoints}
                backdropComponent={renderBackdrop}
                enablePanDownToClose
                onDismiss={onClose}
                backgroundStyle={styles.background}
                handleIndicatorStyle={styles.indicator}
            >
                <BottomSheetView style={styles.contentContainer}>
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.label}>TAKİP NO</Text>
                            <Text style={styles.trackingNumber}>{shipment.trackingNumber}</Text>
                        </View>
                        <StatusBadge status={shipment.status} />
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.addressSection}>
                        <View style={styles.pathVisual}>
                            <View style={[styles.dot, { backgroundColor: Colors.success }]} />
                            <View style={styles.line} />
                            <View style={[styles.dot, { backgroundColor: Colors.danger }]} />
                        </View>
                        <View style={styles.addressTextContainer}>
                            <View>
                                <Text style={styles.addressLabel}>ALIM</Text>
                                <Text style={styles.addressText} numberOfLines={1}>{shipment.origin}</Text>
                            </View>
                            <View style={{ height: 20 }} />
                            <View>
                                <Text style={styles.addressLabel}>TESLİM</Text>
                                <Text style={[styles.addressText, styles.bold]} numberOfLines={1}>{shipment.destination}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.secondaryButton, { flex: 0.8 }]}
                            onPress={handleCall}
                            disabled={!shipment.customerPhone}
                        >
                            <MaterialCommunityIcons
                                name="phone"
                                size={20}
                                color={shipment.customerPhone ? Colors.primary : Colors.gray400}
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryButton, { flex: 0.8 }]}
                            onPress={handleViewWaybill}
                            disabled={isDownloading}
                        >
                            {isDownloading ? (
                                <ActivityIndicator size="small" color={Colors.primary} />
                            ) : (
                                <MaterialCommunityIcons name="file-document-outline" size={20} color={Colors.primary} />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.primaryButton} onPress={handleViewDetails}>
                            <Text style={styles.primaryButtonText}>Detay</Text>
                            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                        </TouchableOpacity>
                    </View>
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    background: {
        borderRadius: 32,
        backgroundColor: Colors.white,
    },
    indicator: {
        backgroundColor: Colors.gray200,
        width: 40,
    },
    contentContainer: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
        marginTop: Spacing.sm,
    },
    label: {
        fontSize: Typography.xs,
        fontWeight: Typography.bold,
        color: Colors.gray400,
        letterSpacing: 1,
        marginBottom: 2,
    },
    trackingNumber: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray100,
        marginBottom: Spacing.lg,
    },
    addressSection: {
        flexDirection: 'row',
        marginBottom: Spacing.xl,
    },
    pathVisual: {
        alignItems: 'center',
        marginRight: Spacing.lg,
        paddingTop: 4,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    line: {
        width: 2,
        height: 48,
        backgroundColor: Colors.gray100,
        marginVertical: 4,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: 10,
        color: Colors.gray400,
        marginBottom: 2,
    },
    addressText: {
        fontSize: Typography.base,
        color: Colors.gray800,
        fontWeight: Typography.medium,
    },
    bold: {
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    primaryButton: {
        flex: 2,
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: Colors.white,
        fontWeight: Typography.bold,
        fontSize: Typography.md,
    },
    secondaryButton: {
        flex: 1,
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: Colors.gray200,
        paddingVertical: 14,
        borderRadius: BorderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    secondaryButtonText: {
        color: Colors.primary,
        fontWeight: Typography.bold,
        fontSize: Typography.md,
    },
});
