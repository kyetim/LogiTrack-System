import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, MapPinOff, PhoneOff, PackageX, AlertTriangle, ShieldOff, UserX, Truck, MoreHorizontal, CheckCircle2 } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { mockActiveDelivery, issueCategories } from '@/data/mockData';
import { IssueCategory } from '@/types';
import { AppButton } from '@/components/ui';
import { PhotoCapture } from '@/components/shared';

type ReportIssueNavProp = NativeStackNavigationProp<MainStackParamList, 'ReportIssue'>;

// Helpler to map string icon names to Lucide icons dynamically since they're dynamic config
const getIconComponent = (iconName: string, color: string, size: number) => {
    switch (iconName) {
        case 'map-off': return <MapPinOff color={color} size={size} />;
        case 'phone-off': return <PhoneOff color={color} size={size} />;
        case 'package-x': return <PackageX color={color} size={size} />;
        case 'alert-triangle': return <AlertTriangle color={color} size={size} />;
        case 'shield-off': return <ShieldOff color={color} size={size} />;
        case 'user-x': return <UserX color={color} size={size} />;
        case 'truck': return <Truck color={color} size={size} />;
        case 'more-horizontal': return <MoreHorizontal color={color} size={size} />;
        default: return <AlertTriangle color={color} size={size} />;
    }
};

export const ReportIssueScreen = () => {
    const navigation = useNavigation<ReportIssueNavProp>();

    // State
    const [selectedCategory, setSelectedCategory] = useState<IssueCategory | null>(null);
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [isFocused, setIsFocused] = useState(false); // For TextInput border

    const shortId = mockActiveDelivery.id.substring(mockActiveDelivery.id.length - 6);

    const handleSubmit = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            setSubmitted(true);
        }, 1800);
    };

    const navigateHome = () => {
        navigation.replace('MainTabs' as any);
    };

    if (submitted) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.successContainer}>
                    <CheckCircle2 color={Colors.success} size={64} style={{ marginBottom: 24 }} />
                    <Text style={styles.successTitle}>Sorun bildiriminiz iletildi.</Text>
                    <Text style={styles.successSubtitle}>Destek ekibimiz en kısa sürede sizinle iletişime geçecek.</Text>

                    <View style={{ width: '100%', marginTop: 32 }}>
                        <AppButton
                            variant="outline"
                            fullWidth
                            title="Ana Sayfaya Dön"
                            onPress={navigateHome}
                        />
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.flex1}
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
                        <Text style={styles.headerTitle}>Sorun Bildir</Text>
                    </View>
                    <View style={styles.headerChip}>
                        <Text style={styles.headerChipText}>#{shortId}</Text>
                    </View>
                </View>

                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

                    {/* ─── TESLİMAT BİLGİSİ ─── */}
                    <View style={styles.infoCard}>
                        <Text style={styles.infoText} numberOfLines={1}>
                            <Text style={styles.infoBold}>{mockActiveDelivery.customerName}</Text>
                            {' → '}
                            {mockActiveDelivery.deliveryAddress}
                        </Text>
                    </View>

                    {/* ─── KATEGORİ SEÇİMİ ─── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>SORUN KATEGORİSİ</Text>
                        <Text style={styles.sectionRequired}>* Zorunlu</Text>
                    </View>

                    <View style={styles.gridContainer}>
                        {issueCategories.map(cat => {
                            const isSelected = selectedCategory?.id === cat.id;
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    activeOpacity={0.8}
                                    style={[
                                        styles.categoryBtn,
                                        isSelected && styles.categoryBtnSelected
                                    ]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    {getIconComponent(cat.icon, isSelected ? Colors.primary : '#555', 20)}
                                    <Text style={[styles.categoryLabel, isSelected && { color: Colors.primary }]}>
                                        {cat.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* ─── AÇIKLAMA ─── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>AÇIKLAMA</Text>
                    </View>

                    <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
                        <TextInput
                            style={styles.textInput}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            placeholder="Sorunu detaylı açıklayın... (opsiyonel)"
                            placeholderTextColor="#444"
                            maxLength={500}
                            value={description}
                            onChangeText={setDescription}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                        />
                        <Text style={styles.charCount}>{description.length}/500</Text>
                    </View>

                    {/* ─── FOTOĞRAF EKLEMESİ (OPSİYONEL) ─── */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionLabel}>FOTOĞRAF EKLE</Text>
                        <Text style={styles.sectionOptional}>(Opsiyonel)</Text>
                    </View>

                    <PhotoCapture
                        photos={photos}
                        onPhotosChange={setPhotos}
                        maxPhotos={2}
                    />

                </ScrollView>

                {/* ─── BOTTOM ACTION ─── */}
                <View style={styles.bottomBar}>
                    <AppButton
                        variant="primary"
                        fullWidth
                        title="Sorunu Bildir"
                        onPress={handleSubmit}
                        disabled={selectedCategory === null || isSubmitting}
                        loading={isSubmitting}
                    />
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
    flex1: {
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
    headerChip: {
        backgroundColor: '#242424',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    headerChipText: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },
    infoCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 12,
        marginTop: 16,
        marginBottom: 24,
    },
    infoText: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    infoBold: {
        fontFamily: Typography.fontBodySemiBold,
        color: Colors.white,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        marginTop: 24,
    },
    sectionLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
    },
    sectionRequired: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.error,
    },
    sectionOptional: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    categoryBtn: {
        width: '48%', // Approx 2 columns
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderRadius: 12,
        padding: 14,
        gap: 8,
    },
    categoryBtnSelected: {
        backgroundColor: 'rgba(255,215,0,0.12)',
        borderColor: Colors.primary,
        borderWidth: 1.5,
    },
    categoryLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.white,
    },
    inputContainer: {
        backgroundColor: '#1A1A1A',
        borderWidth: 1,
        borderColor: '#2A2A2A',
        borderRadius: 14,
        padding: 14,
    },
    inputContainerFocused: {
        borderColor: Colors.primary,
    },
    textInput: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        height: 100, // Roughly 4 lines
        padding: 0,
    },
    charCount: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: '#555',
        textAlign: 'right',
        marginTop: 8,
    },
    bottomBar: {
        padding: 16,
        backgroundColor: '#0D0D0D',
        borderTopWidth: 1,
        borderTopColor: '#1A1A1A',
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    successTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.white,
        marginBottom: 8,
        textAlign: 'center',
    },
    successSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        textAlign: 'center',
        lineHeight: 22,
    },
});
