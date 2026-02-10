import React, { useEffect, useState } from 'react';
import {
    View,
    ScrollView,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchLeaderboard, fetchMyScore } from '../../../store/slices/scoringSlice';
import { ScoreCard } from '../../../components/scoring/ScoreCard';
import { LeaderboardCard } from '../../../components/scoring/LeaderboardCard';
import { Colors, Spacing, Typography } from '../../../constants/theme';

export default function LeaderboardScreen() {
    const dispatch = useAppDispatch();
    const { leaderboard, myScore, isLoading, error } = useAppSelector((state) => state.scoring);
    const currentUser = useAppSelector((state) => state.auth.user);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        dispatch(fetchLeaderboard(10));
        dispatch(fetchMyScore());
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            dispatch(fetchLeaderboard(10)),
            dispatch(fetchMyScore()),
        ]);
        setRefreshing(false);
    };

    if (isLoading && !myScore && leaderboard.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    tintColor={Colors.primary}
                />
            }
        >
            {/* My Score Section */}
            {myScore && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Senin Skorun</Text>
                    <ScoreCard score={myScore} showRank />
                </View>
            )}

            {/* Leaderboard Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🏆 Liderlik Tablosu</Text>
                {leaderboard.length === 0 ? (
                    <Text style={styles.emptyText}>Henüz liderlik verisi yok</Text>
                ) : (
                    <View style={styles.leaderboardContainer}>
                        {leaderboard.map((entry) => (
                            <LeaderboardCard
                                key={entry.driverId}
                                entry={entry}
                                isCurrentUser={entry.driverId === currentUser?.id}
                            />
                        ))}
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    contentContainer: {
        padding: Spacing.lg,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    section: {
        marginBottom: Spacing.xxl,
    },
    sectionTitle: {
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.textPrimary,
        marginBottom: Spacing.md,
    },
    leaderboardContainer: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        overflow: 'hidden',
    },
    errorText: {
        fontSize: Typography.md,
        color: Colors.danger,
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyText: {
        fontSize: Typography.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingVertical: Spacing.xxl,
    },
});
