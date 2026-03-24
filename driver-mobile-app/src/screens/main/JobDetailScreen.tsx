import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, MessageSquare, Package, Weight, Maximize, AlertTriangle } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { mockAvailableJobs } from '@/data/mockData';
import { MapPreview, StatusBadge } from '@/components/shared';
import { AppButton, AppInput } from '@/components/ui';

import { MainStackParamList } from '@/navigation/MainNavigator';

type ScreenNavProp = NativeStackNavigationProp<MainStackParamList, 'JobDetail'>;
type ScreenRouteProp = RouteProp<MainStackParamList, 'JobDetail'>;

export const JobDetailScreen = () => {
    const navigation = useNavigation<ScreenNavProp>();
    const route = useRoute<ScreenRouteProp>();
    const jobId = route.params?.id;

    // Bulunan işi al, yoksa ilkini göster fallback olarak
    const jobData = mockAvailableJobs.find(j => j.id === jobId) || mockAvailableJobs[0];

    // State
    const [bidMode, setBidMode] = useState(false);
    const [bidAmount, setBidAmount] = useState('');
    const [accepted, setAccepted] = useState(false);
    const [countdown, setCountdown] = useState(jobData.expiresIn);

    const bidHeightAnim = useRef(new Animated.Value(0)).current;

    // Geri sayım
    useEffect(() => {
        if (countdown <= 0) {
            if (!accepted) {
                Alert.alert("Süre Doldu", "Bu iş için verilen süre dolduğu için artık kabul edilemez.", [
                    { text: "Tamam", onPress: () => navigation.goBack() }
                ]);
            }
            return;
        }

        const timer = setInterval(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [countdown, accepted, navigation]);

    // Format zaman makrosu
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    // Teklif modu animasyonu
    useEffect(() => {
        Animated.spring(bidHeightAnim, {
            toValue: bidMode ? 1 : 0,
            useNativeDriver: false,
            friction: 8,
            tension: 50,
        }).start();
    }, [bidMode, bidHeightAnim]);

    const bidContainerHeight = bidHeightAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 100] // Estimated height for the input area
    });

    const isUrgent = countdown <= 60;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>İş Detayı</Text>

                <View style={[
                    styles.countdownChip,
                    isUrgent && styles.countdownUrgent
                ]}>
                    <Text style={styles.countdownText}>
                        {formatTime(countdown)}
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── FİYAT HERO KARTI ─── */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroPrice}>{jobData.price}</Text>
                    <Text style={styles.heroSubText}>{jobData.distance} · {jobData.estimatedTime}</Text>
                    <View style={styles.badgeWrapper}>
                        <StatusBadge status="pending" size="sm" showDot={false} />
                    </View>
                </View>

                {/* ─── ROTA KARTI ─── */}
                <View style={styles.card}>
                    <MapPreview
                        height={160}
                        showRoute={true}
                        borderRadius={12}
                        pickupLat={(jobData as any).pickupLocation?.lat || 41.0082}
                        pickupLng={(jobData as any).pickupLocation?.lng || 28.9784}
                        deliveryLat={(jobData as any).deliveryLocation?.lat || 40.9822}
                        deliveryLng={(jobData as any).deliveryLocation?.lng || 29.0234}
                        onPress={() => (navigation as any).navigate('MainTabs', { screen: 'MapTab' })}
                    />
                    <View style={styles.routeDetails}>
                        <View style={styles.routeRow}>
                            <View style={styles.routeDotA} />
                            <View style={styles.routeTextContainer}>
                                <Text style={styles.routeLabelA}>ALIŞ</Text>
                                <Text style={styles.routeAddress}>{jobData.pickupAddress}</Text>
                            </View>
                        </View>

                        <View style={styles.routeDistanceContainer}>
                            <View style={styles.routeVerticalLine} />
                            <Text style={styles.routeDistanceText}>↓ {jobData.distance}</Text>
                        </View>

                        <View style={styles.routeRow}>
                            <View style={styles.routeDotB} />
                            <View style={styles.routeTextContainer}>
                                <Text style={styles.routeLabelB}>TESLİMAT</Text>
                                <Text style={styles.routeAddress}>{jobData.deliveryAddress}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── GÖNDERİCİ BİLGİSİ ─── */}
                <View style={styles.card}>
                    <View style={styles.senderHeader}>
                        <Text style={styles.sectionLabel}>GÖNDERİCİ</Text>
                    </View>
                    <View style={styles.senderRow}>
                        <Text style={styles.senderName}>{jobData.customerName}</Text>
                        <AppButton
                            variant="outline"
                            size="sm"
                            title="Mesajlaş"
                            onPress={() => { }}
                        />
                    </View>
                </View>

                {/* ─── PAKET DETAYI ─── */}
                <View style={styles.card}>
                    <Text style={[styles.sectionLabel, { marginBottom: 16 }]}>PAKET DETAYI</Text>

                    <View style={styles.gridContainer}>
                        <View style={styles.gridItem}>
                            <Package color={Colors.gray} size={20} />
                            <View style={styles.gridTextContainer}>
                                <Text style={styles.gridLabel}>Paket Tipi</Text>
                                <Text style={styles.gridValue}>{jobData.packageType}</Text>
                            </View>
                        </View>
                        <View style={styles.gridItem}>
                            <Weight color={Colors.gray} size={20} />
                            <View style={styles.gridTextContainer}>
                                <Text style={styles.gridLabel}>Ağırlık tahmini</Text>
                                <Text style={styles.gridValue}>~5 kg</Text>
                            </View>
                        </View>
                        <View style={[styles.gridItem, { marginTop: 16 }]}>
                            <Maximize color={Colors.gray} size={20} />
                            <View style={styles.gridTextContainer}>
                                <Text style={styles.gridLabel}>Boyut</Text>
                                <Text style={styles.gridValue}>Orta (40x30cm)</Text>
                            </View>
                        </View>
                        <View style={[styles.gridItem, { marginTop: 16 }]}>
                            <AlertTriangle color={jobData.packageType === 'fragile' ? Colors.error : Colors.gray} size={20} />
                            <View style={styles.gridTextContainer}>
                                <Text style={styles.gridLabel}>Kırılgan mı?</Text>
                                <View style={styles.fragileBadge}>
                                    <Text style={styles.fragileText}>
                                        {jobData.packageType === 'fragile' ? 'Evet' : 'Hayır'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Bottom Padding for scroll area */}
                <View style={styles.bottomSpacer} />

            </ScrollView>

            {/* ─── STICKY ALT BUTONLAR ─── */}
            <View style={styles.bottomBar}>

                {/* TEKLİF MODU ALANI */}
                <Animated.View style={[styles.bidContainer, { height: bidContainerHeight, opacity: bidHeightAnim }]}>
                    <Text style={styles.bidLabel}>Teklifiniz (₺)</Text>
                    <View style={styles.bidInputWrapper}>
                        <AppInput
                            label=""
                            icon={<Text style={styles.currencyPrefix}>₺</Text>}
                            value={bidAmount}
                            onChangeText={setBidAmount}
                            placeholder="Miktar girin"
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.bidActions}>
                        <TouchableOpacity activeOpacity={0.8} style={styles.bidCancelBtn} onPress={() => setBidMode(false)}>
                            <Text style={styles.bidCancelText}>İptal</Text>
                        </TouchableOpacity>
                        <View style={styles.flex1}>
                            <AppButton
                                variant="primary"
                                size="sm"
                                title="Teklif Gönder"
                                onPress={() => { setBidMode(false); setAccepted(true); }}
                            />
                        </View>
                    </View>
                </Animated.View>

                {/* NORMAL BUTONLAR */}
                {!bidMode && (
                    <View style={styles.actionRow}>
                        {accepted ? (
                            <AppButton
                                variant="primary"
                                fullWidth
                                title="Teslimatı Başlat →"
                                onPress={() => navigation.navigate('ActiveDelivery', {})}
                            />
                        ) : (
                            <>
                                <View style={styles.bidActionLeft}>
                                    <AppButton
                                        variant="outline"
                                        title="Teklif Ver"
                                        fullWidth
                                        onPress={() => setBidMode(true)}
                                    />
                                </View>
                                <View style={styles.bidActionRight}>
                                    <AppButton
                                        variant="primary"
                                        title="Hemen Kabul Et"
                                        fullWidth
                                        onPress={() => {
                                            Alert.alert("İşi Kabul Et", "Bu işi almak istediğinize emin misiniz?", [
                                                { text: "İptal", style: 'cancel' },
                                                { text: "Evet, Al", style: 'default', onPress: () => setAccepted(true) }
                                            ]);
                                        }}
                                    />
                                </View>
                            </>
                        )}
                    </View>
                )}
            </View>

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.background,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    countdownChip: {
        backgroundColor: Colors.card,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    countdownText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
        color: Colors.white,
    },
    countdownUrgent: {
        backgroundColor: Colors.error,
        borderColor: Colors.error,
    },
    actionText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 15,
        color: '#000',
    },
    bottomSpacer: {
        height: 120,
    },
    currencyPrefix: {
        color: Colors.gray,
        fontSize: 16,
    },
    flex1: {
        flex: 1,
    },
    bidActionLeft: {
        flex: 1,
        marginRight: 8,
    },
    bidActionRight: {
        flex: 2,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 8,
    },
    heroCard: {
        marginHorizontal: 16,
        marginBottom: 16,
        padding: 24,
        borderRadius: 20,
        backgroundColor: Colors.card, // Fallback
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.border,
        // React Native doesn't support linear-gradient natively without expo-linear-gradient
        // Using a solid dark color that matches the user's intent 
    },
    heroPrice: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 48,
        color: Colors.primary,
        marginBottom: 8,
    },
    heroSubText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        marginBottom: 16,
    },
    badgeWrapper: {
        alignItems: 'center',
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    routeDetails: {
        marginTop: 16,
    },
    routeRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    routeTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    routeDotA: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
    },
    routeLabelA: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.primary,
        marginBottom: 2,
    },
    routeAddress: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
    },
    routeDistanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
    },
    routeVerticalLine: {
        width: 2,
        height: 24,
        backgroundColor: Colors.grayDim,
        marginLeft: 4,
        marginRight: 16,
    },
    routeDistanceText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
    },
    routeDotB: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.white,
    },
    routeLabelB: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.white,
        marginBottom: 2,
    },
    sectionLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
    },
    senderHeader: {
        marginBottom: 8,
    },
    senderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    senderName: {
        fontFamily: Typography.fontDisplay,
        fontSize: 15,
        color: Colors.white,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    gridItem: {
        width: '50%',
        flexDirection: 'row',
        alignItems: 'center',
    },
    gridTextContainer: {
        marginLeft: 12,
    },
    gridLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 2,
    },
    gridValue: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
    },
    fragileBadge: {
        backgroundColor: Colors.surface,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    fragileText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.white,
    },
    bottomBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        padding: 16,
        paddingBottom: 24, // accommodate safe area natively if simple layout
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bidContainer: {
        overflow: 'hidden',
    },
    bidLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 8,
    },
    bidInputWrapper: {
        marginBottom: 12,
    },
    bidActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bidCancelBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    bidCancelText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.gray,
    }
});
