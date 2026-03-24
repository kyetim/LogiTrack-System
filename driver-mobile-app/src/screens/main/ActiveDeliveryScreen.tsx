import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Phone, MessageSquare, Package, AlertTriangle } from 'lucide-react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { Colors, Typography } from '@/theme/tokens';
import { mockActiveDelivery, mockDeliveries } from '@/data/mockData';
import { StatusBadge, MapPreview } from '@/components/shared';
import { AppButton } from '@/components/ui';

// Mock Navigator Types
import { MainStackParamList } from '@/navigation/MainNavigator';

type ScreenNavProp = NativeStackNavigationProp<MainStackParamList, 'ActiveDelivery'>;
type ScreenRouteProp = RouteProp<MainStackParamList, 'ActiveDelivery'>;

export const ActiveDeliveryScreen = () => {
    const navigation = useNavigation<ScreenNavProp>();
    const route = useRoute<ScreenRouteProp>();

    const [activeTab, setActiveTab] = useState<'detail' | 'notes'>('detail');
    const [callVisible, setCallVisible] = useState(false); // Used visually or later for modal

    // Fetch relevant delivery 
    const deliveryId = route.params?.id;
    const deliveryData = deliveryId
        ? mockDeliveries.find(d => d.id === deliveryId) || mockActiveDelivery
        : mockActiveDelivery;

    // Derived initials for avatar
    const getInitials = (name: string) => {
        return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity activeOpacity={0.8} onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Teslimat Detayı</Text>
                <View style={[styles.headerRight, { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }]}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('ReportIssue', { id: deliveryData.id })}
                        style={{ padding: 4 }}
                    >
                        <AlertTriangle color={Colors.error} size={22} />
                    </TouchableOpacity>
                    <StatusBadge status={deliveryData.status} size="sm" showDot />
                </View>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* ─── HARİTA ÖNİZLEME ─── */}
                <View style={styles.mapContainer}>
                    <MapPreview
                        height={180}
                        showRoute={true}
                        borderRadius={16}
                        pickupLat={(deliveryData as any).pickupLocation?.lat || 41.0082}
                        pickupLng={(deliveryData as any).pickupLocation?.lng || 28.9784}
                        deliveryLat={(deliveryData as any).deliveryLocation?.lat || 40.9822}
                        deliveryLng={(deliveryData as any).deliveryLocation?.lng || 29.0234}
                        onPress={() => (navigation as any).navigate('MainTabs', { screen: 'MapTab' })}
                    />
                    <View style={styles.mapInfoChip}>
                        <Text style={styles.mapInfoText}>
                            ~{deliveryData.estimatedTime} · {deliveryData.distance}
                        </Text>
                    </View>
                </View>

                {/* ─── TAB BAR ─── */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'detail' && styles.activeTabButton]}
                        onPress={() => setActiveTab('detail')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === 'detail' && styles.activeTabText]}>Detaylar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'notes' && styles.activeTabButton]}
                        onPress={() => setActiveTab('notes')}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.tabText, activeTab === 'notes' && styles.activeTabText]}>Notlar</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── TAB İÇERİKLERİ ─── */}
                {activeTab === 'detail' ? (
                    <View style={styles.tabContent}>

                        {/* MÜŞTERİ KARTI */}
                        <View style={styles.card}>
                            <View style={styles.customerRow}>
                                <View style={styles.customerAvatar}>
                                    <Text style={styles.customerInitials}>{getInitials(deliveryData.customerName)}</Text>
                                </View>
                                <View style={styles.customerInfo}>
                                    <Text style={styles.customerName}>{deliveryData.customerName}</Text>
                                    <Text style={styles.customerRole}>Teslimat Alıcısı</Text>
                                </View>
                                <View style={styles.actionButtons}>
                                    <TouchableOpacity activeOpacity={0.8} style={styles.iconButton} onPress={() => setCallVisible(true)}>
                                        <Phone color={Colors.white} size={20} />
                                    </TouchableOpacity>
                                    <TouchableOpacity activeOpacity={0.8} style={styles.iconButton}>
                                        <MessageSquare color={Colors.white} size={20} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>

                        {/* ROTA KARTI */}
                        <View style={styles.card}>
                            <View style={styles.routeSection}>
                                <View style={styles.routeTimeline}>
                                    <View style={styles.routeDotA} />
                                    <View style={styles.routeLine} />
                                    <View style={styles.routeDotB} />
                                </View>
                                <View style={styles.routeAddresses}>
                                    <View style={styles.addressBlock}>
                                        <Text style={styles.addressLabel}>Alış Noktası</Text>
                                        <Text style={styles.addressText}>{deliveryData.pickupAddress}</Text>
                                    </View>
                                    <View style={styles.addressSpacer} />
                                    <View style={styles.addressBlock}>
                                        <Text style={styles.addressLabel}>Teslimat Noktası</Text>
                                        <Text style={styles.addressText}>{deliveryData.deliveryAddress}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* PAKET BİLGİSİ */}
                        <View style={styles.card}>
                            <View style={styles.packageRow}>
                                <Package color={Colors.primary} size={24} />
                                <View style={styles.customerInfo}>
                                    <Text style={styles.packageTitle}>Standart Paket — Kutu</Text>
                                    <Text style={styles.packageSubtitle}>Ağırlık/Boyut bilgisi mevcut değil</Text>
                                </View>
                            </View>
                        </View>

                    </View>
                ) : (
                    <View style={styles.tabContent}>
                        {/* NOTLAR TAB INHALTI */}
                        <Text style={styles.notesTitle}>Kurye Notu</Text>
                        <Text style={styles.notesText}>
                            {deliveryData.notes ? deliveryData.notes : 'Bu gönderi için özel bir not bulunmuyor.'}
                        </Text>

                        <View style={styles.noteInputContainer}>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Buraya not ekle..."
                                placeholderTextColor={Colors.gray}
                                multiline
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                )}

                {/* Bottom Padding for scroll area */}
                <View style={styles.bottomSpacer} />

            </ScrollView>

            {/* ─── ALT EYLEM BUTONU (Sticky) ─── */}
            <View style={styles.bottomBar}>
                <AppButton
                    variant="primary"
                    fullWidth
                    title="Teslim Et → Fotoğraf & İmza"
                    onPress={() => navigation.navigate('ProofOfDelivery', { id: deliveryData.id })}
                />
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
    headerRight: {
        minWidth: 40,
        alignItems: 'flex-end',
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingTop: 16,
    },
    mapContainer: {
        paddingHorizontal: 16,
        marginBottom: 20,
        position: 'relative',
    },
    mapInfoChip: {
        position: 'absolute',
        top: 16, // Instead of centering, let's put it at the top to overlap the map nicely
        alignSelf: 'center',
        backgroundColor: Colors.card,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mapInfoText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 12,
        color: Colors.white,
    },
    tabContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTabButton: {
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.gray,
    },
    activeTabText: {
        color: Colors.primary,
    },
    tabContent: {
        paddingHorizontal: 16,
        gap: 16, // Spaces between cards
    },
    card: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    customerRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    customerAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 215, 0, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    customerInitials: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 14,
        color: Colors.primary,
    },
    customerInfo: {
        flex: 1,
    },
    customerName: {
        fontFamily: Typography.fontDisplay,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 2,
    },
    customerRole: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeSection: {
        flexDirection: 'row',
    },
    routeTimeline: {
        alignItems: 'center',
        marginRight: 16,
        marginTop: 4,
    },
    routeDotA: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        borderWidth: 3,
        borderColor: 'rgba(255, 215, 0, 0.2)',
    },
    routeLine: {
        width: 2,
        height: 40, // Adjust dynamically based on content length or keep fixed
        backgroundColor: Colors.grayDim,
        borderStyle: 'dotted', // Wait, React Native StyleSheet doesn't support borderStyle: dotted natively like this easily on a view. 
        // We simulate it via a dashed border or simple line.
        marginVertical: 4,
    },
    routeDotB: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.white,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    routeAddresses: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    addressBlock: {
        marginBottom: 16,
    },
    addressLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    addressText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.white,
        lineHeight: 20,
    },
    addressSpacer: {
        height: 16, // Creates the gap mapped to the timeline
    },
    packageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    packageTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
        marginBottom: 2,
    },
    packageSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    detailLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 4,
    },
    bottomSpacer: {
        height: 100,
    },
    notesTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.white,
        marginBottom: 8,
    },
    notesText: {
        fontFamily: Typography.fontBody,
        fontSize: 14,
        color: Colors.gray,
        fontStyle: 'italic',
        lineHeight: 22,
        backgroundColor: Colors.card,
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginBottom: 16,
    },
    noteInputContainer: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 4,
    },
    noteInput: {
        height: 100,
        padding: 12,
        color: Colors.white,
        fontFamily: Typography.fontBody,
        fontSize: 14,
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
        paddingBottom: 24, // extra padding for safe area logic
    },
});
