import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Crown } from 'lucide-react-native';

import { Colors, Typography } from '@/theme/tokens';
import { StatsRow } from '@/components/shared';

// TODO: Import Redux when ready
// import { useAppDispatch, useAppSelector } from '@/store';
// import { fetchLeaderboard, fetchMyScore } from '@/store/slices/scoringSlice';

type PeriodType = 'weekly' | 'monthly' | 'allTime';

interface LeaderboardEntry {
    id: string;
    rank: number;
    name: string;
    rating: number;
    isMe?: boolean;
    avatarInitials: string;
}

const mockRankings: LeaderboardEntry[] = [
    { id: 'u1', rank: 1, name: 'Ali K.', rating: 4.98, avatarInitials: 'AK' },
    { id: 'u2', rank: 2, name: 'Zeynep T.', rating: 4.95, avatarInitials: 'ZT' },
    { id: 'u3', rank: 3, name: 'Mehmet S.', rating: 4.92, avatarInitials: 'MS' },
    { id: 'u4', rank: 4, name: 'Ahmet Yılmaz', rating: 4.80, isMe: true, avatarInitials: 'AY' },
    { id: 'u5', rank: 5, name: 'Fatma G.', rating: 4.75, avatarInitials: 'FG' },
    { id: 'u6', rank: 6, name: 'Veli C.', rating: 4.71, avatarInitials: 'VC' },
];

export const LeaderboardScreen = () => {
    const navigation = useNavigation();
    const [period, setPeriod] = useState<PeriodType>('weekly');

    // TODO: Redux dispatch
    // const dispatch = useAppDispatch();
    // useEffect(() => {
    //     dispatch(fetchLeaderboard({ period, limit: 10 }));
    //     dispatch(fetchMyScore());
    // }, [dispatch, period]);

    const podiumData = mockRankings.slice(0, 3);
    const listData = mockRankings.slice(3);
    const myRank = mockRankings.find(r => r.isMe);

    const renderPodiumItem = (entry: LeaderboardEntry | undefined, position: 1 | 2 | 3) => {
        if (!entry) return null;

        const isFirst = position === 1;
        const _height = position === 1 ? 110 : position === 2 ? 80 : 65;
        const _width = position === 1 ? 100 : 90;

        let circleColor = '#CD7F32'; // Bronze
        if (position === 1) circleColor = Colors.primary; // Gold
        if (position === 2) circleColor = '#C0C0C0'; // Silver

        return (
            <View style={[styles.podiumItem, { width: _width }]}>
                {isFirst && <Crown color={Colors.primary} size={24} style={styles.crownIcon} />}

                <View style={[
                    styles.podiumAvatar,
                    { borderColor: circleColor },
                    isFirst && styles.podiumAvatarGlow
                ]}>
                    <Text style={styles.podiumAvatarText}>{entry.avatarInitials}</Text>
                    <View style={[styles.rankBadge, { backgroundColor: circleColor }]}>
                        <Text style={styles.rankBadgeText}>{position}</Text>
                    </View>
                </View>

                <View style={[styles.podiumBar, { height: _height, backgroundColor: circleColor + '40', borderTopColor: circleColor }]}>
                    <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
                    <Text style={styles.podiumRating}>{entry.rating} ⭐</Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.8}>
                    <ChevronLeft color={Colors.white} size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Liderlik Tablosu</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                {/* Period Selector */}
                <View style={styles.periodSelector}>
                    <TouchableOpacity
                        style={[styles.periodChip, period === 'weekly' && styles.periodChipActive]}
                        onPress={() => setPeriod('weekly')}
                    >
                        <Text style={[styles.periodText, period === 'weekly' && styles.periodTextActive]}>Haftalık</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodChip, period === 'monthly' && styles.periodChipActive]}
                        onPress={() => setPeriod('monthly')}
                    >
                        <Text style={[styles.periodText, period === 'monthly' && styles.periodTextActive]}>Aylık</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.periodChip, period === 'allTime' && styles.periodChipActive]}
                        onPress={() => setPeriod('allTime')}
                    >
                        <Text style={[styles.periodText, period === 'allTime' && styles.periodTextActive]}>Tüm Zamanlar</Text>
                    </TouchableOpacity>
                </View>

                {/* Podium */}
                <View style={styles.podiumContainer}>
                    {renderPodiumItem(podiumData[1], 2)}
                    {renderPodiumItem(podiumData[0], 1)}
                    {renderPodiumItem(podiumData[2], 3)}
                </View>

                {/* Own Rank Banner */}
                {myRank && (
                    <View style={styles.myRankBanner}>
                        <View style={styles.myRankRow}>
                            <View>
                                <Text style={styles.myRankLabel}>Senin Sıran</Text>
                                <Text style={styles.myRankTitle}>#{myRank.rank} {myRank.name}</Text>
                            </View>
                            <View style={styles.myRankScoreBox}>
                                <Text style={styles.myRankScoreText}>{myRank.rating} ⭐</Text>
                            </View>
                        </View>
                        <Text style={styles.myRankSubtitle}>Bir üst sıraya 0.12 puan kaldı</Text>
                    </View>
                )}

                {/* Stats */}
                <View style={{ marginBottom: 24 }}>
                    <StatsRow
                        items={[
                            { label: 'Teslimat', value: '42', icon: <></> },
                            { label: 'Puan', value: '4.80', icon: <></> },
                            { label: 'Kazanç', value: '₺3.840', icon: <></> },
                            { label: 'Sıra', value: '#4', icon: <></> }
                        ]}
                    />
                </View>

                {/* List Ranking */}
                <View style={styles.listContainer}>
                    {listData.map((item) => (
                        <View key={item.id} style={[styles.listItem, item.isMe && styles.listItemMe]}>
                            <Text style={[styles.listRank, item.isMe && { color: Colors.primary }]}>#{item.rank}</Text>
                            <View style={[styles.listAvatar, item.isMe && { backgroundColor: Colors.primary + '20' }]}>
                                <Text style={[styles.listAvatarText, item.isMe && { color: Colors.primary }]}>
                                    {item.avatarInitials}
                                </Text>
                            </View>
                            <Text style={[styles.listName, item.isMe && { color: Colors.white }]}>{item.name}</Text>
                            <Text style={[styles.listRating, item.isMe && { color: Colors.primary }]}>{item.rating} ⭐</Text>
                        </View>
                    ))}
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
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 20,
        color: Colors.white,
    },
    scrollContent: {
        padding: 16,
    },
    periodSelector: {
        flexDirection: 'row',
        backgroundColor: '#1A1A1A',
        borderRadius: 12,
        padding: 4,
        marginBottom: 32,
    },
    periodChip: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8,
    },
    periodChipActive: {
        backgroundColor: '#2A2A2A',
    },
    periodText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 13,
        color: Colors.gray,
    },
    periodTextActive: {
        color: Colors.primary,
    },
    podiumContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginBottom: 32,
        gap: 8,
        height: 180, // give enough vertical space for the first place
    },
    podiumItem: {
        alignItems: 'center',
    },
    crownIcon: {
        position: 'absolute',
        top: -24,
        zIndex: 10,
    },
    podiumAvatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#242424',
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: -16, // pull the bar up
        zIndex: 2,
    },
    podiumAvatarGlow: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 10,
    },
    podiumAvatarText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 16,
        color: Colors.white,
    },
    rankBadge: {
        position: 'absolute',
        bottom: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.background,
    },
    rankBadgeText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 10,
        color: Colors.background,
    },
    podiumBar: {
        width: '100%',
        borderTopWidth: 2,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        paddingTop: 24,
        alignItems: 'center',
    },
    podiumName: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 12,
        color: Colors.white,
        marginBottom: 4,
        paddingHorizontal: 4,
        textAlign: 'center',
    },
    podiumRating: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.gray,
    },
    myRankBanner: {
        backgroundColor: 'rgba(255,215,0,0.08)',
        borderWidth: 1.5,
        borderColor: Colors.primary,
        borderRadius: 14,
        padding: 16,
        marginBottom: 24,
    },
    myRankRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    myRankLabel: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 12,
        color: Colors.gray,
        marginBottom: 4,
    },
    myRankTitle: {
        fontFamily: Typography.fontDisplay,
        fontSize: 18,
        color: Colors.primary,
    },
    myRankScoreBox: {
        backgroundColor: Colors.card,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    myRankScoreText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 14,
        color: Colors.primary,
    },
    myRankSubtitle: {
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: '#8A8A8A',
    },
    listContainer: {
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        paddingVertical: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    listItemMe: {
        backgroundColor: 'rgba(255,215,0,0.1)',
        borderLeftWidth: 3,
        borderLeftColor: Colors.primary,
        paddingLeft: 13, // Adjust for border
    },
    listRank: {
        fontFamily: Typography.fontDisplay,
        fontSize: 14,
        color: Colors.gray,
        width: 32,
    },
    listAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#242424',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    listAvatarText: {
        fontFamily: Typography.fontDisplay,
        fontSize: 12,
        color: Colors.gray,
    },
    listName: {
        flex: 1,
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.gray,
    },
    listRating: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 13,
        color: Colors.gray,
    },
});
