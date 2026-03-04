import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronLeft, Gift, CreditCard } from 'lucide-react-native';

import { MainStackParamList } from '@/navigation/MainNavigator';
import { Colors, Typography } from '@/theme/tokens';
import { mockEarningsHistory } from '@/data/mockData';
import { AppButton } from '@/components/ui';

type EarningsNavProp = NativeStackNavigationProp<MainStackParamList, 'Earnings'>;

export const EarningsScreen = () => {
    // Navigation is casted since 'Earnings' will be added to MainNavigator later
    const navigation = useNavigation<any>();

    const [selectedWeek, setSelectedWeek] = useState<'this' | 'last'>('this');

    const historyData = selectedWeek === 'this' ? mockEarningsHistory.thisWeek : mockEarningsHistory.lastWeek;

    // Calculate max earnings for the chart to be relative
    const maxEarnings = Math.max(...historyData.days.map(d => d.earnings));

    // Calculations
    const bonusSum = mockEarningsHistory.bonuses.reduce((sum, b) => sum + b.amount, 0);
    // Realistically bonuses are only counted once or separate per week, 
    // but applying to 'total' here to match the mockup instructions.
    const deliverySum = historyData.total - bonusSum;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* ─── HEADER ─── */}
            <View style={styles.header}>
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                >
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kazanç Detayı</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── HAFTA SEÇİCİ ─── */}
                <View style={styles.weekSelector}>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.weekChip, selectedWeek === 'this' && styles.weekChipActive]}
                        onPress={() => setSelectedWeek('this')}
                    >
                        <Text style={[styles.weekChipText, selectedWeek === 'this' && styles.weekChipTextActive]}>
                            Bu Hafta
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        style={[styles.weekChip, selectedWeek === 'last' && styles.weekChipActive]}
                        onPress={() => setSelectedWeek('last')}
                    >
                        <Text style={[styles.weekChipText, selectedWeek === 'last' && styles.weekChipTextActive]}>
                            Geçen Hafta
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* ─── TOPLAM KAZANÇ HERO ─── */}
                <View style={styles.heroCard}>
                    <Text style={styles.heroLabel}>Toplam Kazanç</Text>
                    <Text style={styles.heroTotal}>₺{historyData.total}</Text>
                    <Text style={[
                        styles.heroTrend,
                        { color: selectedWeek === 'this' ? Colors.success : Colors.error }
                    ]}>
                        {selectedWeek === 'this' ? '+%12 geçen haftaya göre' : 'Bu haftaya göre -%12'}
                    </Text>
                </View>

                {/* ─── GÜNLÜK BAR CHART ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>GÜNLÜK DAĞILIM</Text>
                </View>

                <View style={styles.chartCard}>
                    <View style={styles.chartContainer}>
                        {historyData.days.map((day, index) => {
                            // Calculate proportional height, fallback to 2 for empty days to show a sliver
                            const barHeight = day.earnings > 0
                                ? (day.earnings / maxEarnings) * 100
                                : 2;

                            return (
                                <View key={`day-${index}`} style={styles.chartCol}>
                                    <View style={styles.chartBarWrapper}>
                                        <Text style={styles.chartBarValue}>
                                            {day.earnings > 0 ? `₺${day.earnings}` : ''}
                                        </Text>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                { height: barHeight },
                                                day.earnings === 0 && { backgroundColor: '#1A1A1A' } // Dimming empty days
                                            ]}
                                        />
                                    </View>
                                    <Text style={styles.chartDayText}>{day.day}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* ─── BONUS KAZANÇLAR ─── */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionLabel}>BONUS & PRİMLER</Text>
                </View>

                {mockEarningsHistory.bonuses.map((bonus, index) => (
                    <View key={`bonus-${index}`} style={styles.bonusRow}>
                        <View style={styles.bonusLeft}>
                            <Gift color={Colors.primary} size={20} />
                            <Text style={styles.bonusLabel}>{bonus.label}</Text>
                        </View>
                        <Text style={styles.bonusAmount}>₺{bonus.amount}</Text>
                    </View>
                ))}

                {/* ─── TOPLAM HESAP ─── */}
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Teslimat Kazancı</Text>
                        <Text style={styles.summaryValue}>₺{deliverySum}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Bonus Kazançlar</Text>
                        <Text style={[styles.summaryValue, { color: Colors.success }]}>₺{bonusSum}</Text>
                    </View>

                    <View style={styles.separator} />

                    <View style={styles.summaryRow}>
                        <Text style={styles.generalTotalLabel}>Genel Toplam</Text>
                        <Text style={styles.generalTotalValue}>₺{historyData.total}</Text>
                    </View>
                </View>

                {/* ─── ÖDEME BİLGİSİ ─── */}
                <View style={styles.paymentCard}>
                    <View style={styles.paymentInfoRow}>
                        <CreditCard color={Colors.white} size={24} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.paymentTitle}>Sonraki Ödeme: Cuma, 06 Haziran</Text>
                            <Text style={styles.paymentSubtitle}>Ödeme hesabınıza otomatik aktarılacak.</Text>
                        </View>
                    </View>
                    <View style={{ marginTop: 16 }}>
                        <AppButton
                            variant="outline"
                            size="sm"
                            title="Banka Hesabını Güncelle"
                            onPress={() => { }} // Stub since it isn't specified in the prompt
                        />
                    </View>
                </View>

            </ScrollView>
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
        paddingTop: 12,
        paddingBottom: 16,
    },
    backBtn: {
        padding: 4,
    },
    headerTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.white,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    weekSelector: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 4,
        marginBottom: 24,
    },
    weekChip: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    weekChipActive: {
        backgroundColor: Colors.primary,
    },
    weekChipText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: Colors.gray,
    },
    weekChipTextActive: {
        fontFamily: Typography.fontDisplayBold,
        color: Colors.background,
    },
    heroCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    heroLabel: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        marginBottom: 8,
    },
    heroTotal: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 44,
        color: Colors.primary,
        fontWeight: '800',
        marginBottom: 8,
    },
    heroTrend: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
    },
    sectionHeader: {
        marginBottom: 12,
        marginTop: 8,
    },
    sectionLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 11,
        color: Colors.gray,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    chartCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        padding: 16,
        paddingTop: 24, // Space for the top labels
        marginBottom: 24,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 140, // Base height container
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    chartCol: {
        flex: 1,
        alignItems: 'center',
    },
    chartBarWrapper: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 120, // Max bar bound
    },
    chartBarValue: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 10,
        color: Colors.primary,
        marginBottom: 6,
        height: 14,
    },
    chartBar: {
        width: 16,
        backgroundColor: Colors.primary,
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    chartDayText: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.gray,
        marginTop: 8,
    },
    bonusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
    },
    bonusLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    bonusLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
    },
    bonusAmount: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 15,
        color: Colors.primary,
    },
    summaryContainer: {
        marginTop: 24,
        paddingHorizontal: 8,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    separator: {
        height: 1,
        backgroundColor: '#2A2A2A',
        marginVertical: 12,
    },
    generalTotalLabel: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 16,
        color: Colors.white,
    },
    generalTotalValue: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 20,
        color: Colors.primary,
        fontWeight: '800',
    },
    paymentCard: {
        backgroundColor: '#1A1A1A',
        borderRadius: 14,
        padding: 16,
    },
    paymentInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    paymentTitle: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: Colors.white,
        marginBottom: 4,
    },
    paymentSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
        lineHeight: 18,
    },
});
