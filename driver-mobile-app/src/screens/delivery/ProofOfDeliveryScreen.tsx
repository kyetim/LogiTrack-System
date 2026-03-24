import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { mockActiveDelivery } from '@/data/mockData';
import { AppButton } from '@/components/ui';
import { StepIndicator, PhotoCapture, SignaturePad } from '@/components/shared';

// Setup types for navigation
type ProofOfDeliveryNavProp = NativeStackNavigationProp<MainStackParamList, 'ProofOfDelivery'>;
type ProofOfDeliveryRouteProp = RouteProp<MainStackParamList, 'ProofOfDelivery'>;

export const ProofOfDeliveryScreen = () => {
    const navigation = useNavigation<ProofOfDeliveryNavProp>();

    // Cast the route to assume params may exist, even if MainStackParamList typing says undefined
    const route = useRoute<any>();
    const deliveryId = route.params?.id || mockActiveDelivery.id;
    const shortId = deliveryId.substring(deliveryId.length - 6);

    // State
    const [currentStep, setCurrentStep] = useState<0 | 1 | 2>(0); // 0: Photo, 1: Sub, 2: Submit
    const [photos, setPhotos] = useState<string[]>([]);
    const [hasSignature, setHasSignature] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const scrollRef = useRef<ScrollView>(null);

    const handleStepChange = (step: 0 | 1 | 2) => {
        setCurrentStep(step);
        scrollRef.current?.scrollTo({ y: 0, animated: true });
    };

    // Step 0: Photo logic
    const renderStep0 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>📷 Teslimat Fotoğrafı</Text>
                <Text style={styles.cardSubtitle}>
                    Paketi teslim ettiğinizi belgeleyen en az 1 fotoğraf çekin.
                </Text>
            </View>

            <PhotoCapture photos={photos} onPhotosChange={setPhotos} maxPhotos={3} />

            <Text style={styles.hintText}>
                💡 İpucu: Paketi kapı önünde veya alıcıyla birlikte fotoğraflayın.
            </Text>
        </View>
    );

    // Step 1: Signature logic
    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>✍️ Alıcı İmzası</Text>
                <Text style={styles.cardSubtitle}>
                    Alıcıdan aşağıdaki alana imzalamasını isteyin.
                </Text>
            </View>

            <View style={styles.customerInfoRow}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {mockActiveDelivery.customerName.charAt(0)}
                    </Text>
                </View>
                <Text style={styles.customerName}>{mockActiveDelivery.customerName}</Text>
            </View>

            <SignaturePad
                onSignatureChange={setHasSignature}
                onClear={() => setHasSignature(false)}
                height={220}
            />
        </View>
    );

    // Step 2: Summary logic
    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>✅ Teslimat Özeti</Text>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>📷 Fotoğraflar</Text>
                    <Text style={[styles.summaryValue, { color: Colors.success }]}>
                        {photos.length} adet eklendi ✓
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>✍️ İmza</Text>
                    <Text style={[styles.summaryValue, { color: hasSignature ? Colors.success : Colors.error }]}>
                        {hasSignature ? 'Alındı ✓' : 'Eksik ✗'}
                    </Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>📍 Konum</Text>
                    <Text style={styles.summaryValueDim}>Otomatik alınacak</Text>
                </View>

                <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>🕐 Zaman</Text>
                    <Text style={styles.summaryValue}>{new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>

                <View style={styles.separator} />

                <Text style={styles.deliveryDetailLabel}>Alıcı</Text>
                <Text style={styles.deliveryDetailText}>{mockActiveDelivery.customerName}</Text>

                <Text style={styles.deliveryDetailLabel}>Adres</Text>
                <Text style={styles.deliveryDetailText}>{mockActiveDelivery.deliveryAddress}</Text>

                <View style={styles.priceContainer}>
                    <Text style={styles.deliveryDetailLabel}>Kazanç</Text>
                    <Text style={styles.priceText}>{mockActiveDelivery.price}</Text>
                </View>
            </View>
        </View>
    );

    // Submit Action
    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            // Ideally navigate to 'CompleteDelivery' but since it might not be scaffolded yet:
            Alert.alert(
                'Teslimat Başarılı ✓',
                'Paket başarıyla teslim edildi olarak işaretlendi!',
                [{ text: 'Tamam', onPress: () => navigation.navigate('MainTabs' as any) }]
            );
        }, 2000);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.keyAView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* ─── HEADER ─── */}
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => navigation.goBack()}
                            style={styles.backBtn}
                        >
                            <ChevronLeft color={Colors.white} size={28} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Teslimat Kanıtı</Text>
                    </View>
                    <Text style={styles.headerIdText}>#{shortId}</Text>
                </View>

                {/* ─── SCROLL AREA ─── */}
                <ScrollView
                    ref={scrollRef}
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Step Indicator */}
                    <StepIndicator
                        steps={['Fotoğraf', 'İmza', 'Gönder']}
                        currentStep={currentStep}
                    />

                    {/* Content Views */}
                    <View style={styles.contentWrapper}>
                        {currentStep === 0 && renderStep0()}
                        {currentStep === 1 && renderStep1()}
                        {currentStep === 2 && renderStep2()}
                    </View>
                </ScrollView>

                {/* ─── STICKY BOTTOM ACTIONS ─── */}
                <View style={styles.bottomBar}>
                    {currentStep === 0 && (
                        <AppButton
                            variant="primary"
                            title="İmzaya Geç →"
                            onPress={() => handleStepChange(1)}
                            disabled={photos.length === 0}
                        />
                    )}

                    {currentStep === 1 && (
                        <View style={styles.btnRow}>
                            <View style={styles.flex1}>
                                <AppButton
                                    variant="outline"
                                    title="← Geri"
                                    onPress={() => handleStepChange(0)}
                                />
                            </View>
                            <View style={styles.spacer} />
                            <View style={styles.flex2}>
                                <AppButton
                                    variant="primary"
                                    title="Özete Geç →"
                                    onPress={() => handleStepChange(2)}
                                    disabled={!hasSignature}
                                />
                            </View>
                        </View>
                    )}

                    {currentStep === 2 && (
                        <View style={styles.btnRow}>
                            <View style={styles.flex1}>
                                <AppButton
                                    variant="outline"
                                    title="← Düzenle"
                                    onPress={() => handleStepChange(1)}
                                    disabled={isSubmitting}
                                />
                            </View>
                            <View style={styles.spacer} />
                            <View style={styles.flex2}>
                                <AppButton
                                    variant="primary"
                                    title="Teslimi Onayla ✓"
                                    onPress={handleSubmit}
                                    disabled={isSubmitting}
                                    loading={isSubmitting}
                                />
                            </View>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    keyAView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.background,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        marginRight: 12,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.white,
    },
    headerIdText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    contentWrapper: {
        paddingHorizontal: 16,
        marginTop: 16,
    },
    stepContainer: {
        flex: 1,
    },
    cardHeader: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        marginBottom: 20,
    },
    cardTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 6,
    },
    cardSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 20,
    },
    hintText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: '#555',
        fontStyle: 'italic',
        marginTop: 20,
        textAlign: 'center',
        paddingHorizontal: 16,
    },
    customerInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: '#1A1A1A',
        padding: 12,
        borderRadius: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#3A3A3A',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.white,
    },
    customerName: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 15,
        color: Colors.white,
    },
    summaryCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 20,
    },
    summaryTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.white,
        marginBottom: 20,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    summaryLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
    },
    summaryValue: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: Colors.white,
    },
    summaryValueDim: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
    },
    separator: {
        height: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 16,
    },
    deliveryDetailLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 4,
    },
    deliveryDetailText: {
        fontFamily: Typography.fontBody,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 16,
    },
    priceContainer: {
        marginTop: 8,
    },
    priceText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.primary,
    },
    bottomBar: {
        backgroundColor: '#0D0D0D',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
        padding: 16,
    },
    fullWidthBtn: {
        width: '100%',
    },
    btnRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    flex1: {
        flex: 1,
    },
    flex2: {
        flex: 2,
    },
    spacer: {
        width: 12,
    },
});
