import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LeaderboardEntry } from '../../types';

interface LeaderboardCardProps {
    entry: LeaderboardEntry;
    onPress?: () => void;
    isCurrentUser?: boolean;
}

export function LeaderboardCard({
    entry,
    onPress,
    isCurrentUser = false,
}: LeaderboardCardProps) {
    const getRankColor = (rank: number): string => {
        if (rank === 1) return '#FFD700'; // Gold
        if (rank === 2) return '#C0C0C0'; // Silver
        if (rank === 3) return '#CD7F32'; // Bronze
        return '#8E8E93';
    };

    const getRankEmoji = (rank: number): string => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isCurrentUser && styles.currentUserContainer,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            {/* Rank */}
            <View style={styles.rankContainer}>
                <Text
                    style={[
                        styles.rankNumber,
                        { color: getRankColor(entry.rank) },
                    ]}
                >
                    {entry.rank}
                </Text>
                {getRankEmoji(entry.rank) && (
                    <Text style={styles.rankEmoji}>{getRankEmoji(entry.rank)}</Text>
                )}
            </View>

            {/* Driver Info */}
            <View style={styles.infoContainer}>
                <Text
                    style={[
                        styles.driverName,
                        isCurrentUser && styles.currentUserName,
                    ]}
                    numberOfLines={1}
                >
                    {entry.driver.user.email}
                    {isCurrentUser && ' (Sen)'}
                </Text>
                <Text style={styles.vehicleInfo} numberOfLines={1}>
                    {entry.driver.vehicle?.plateNumber || 'Araç atanmamış'}
                </Text>
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
                <Text style={styles.scoreValue}>{entry.score.overallScore}</Text>
                <View style={styles.scoreBar}>
                    <View
                        style={[
                            styles.scoreBarFill,
                            { width: `${entry.score.overallScore}%` },
                        ]}
                    />
                </View>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E5EA',
    },
    currentUserContainer: {
        backgroundColor: '#F0F8FF',
        borderLeftWidth: 4,
        borderLeftColor: '#007AFF',
    },
    rankContainer: {
        width: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNumber: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    rankEmoji: {
        fontSize: 20,
        marginTop: 4,
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    currentUserName: {
        color: '#007AFF',
    },
    vehicleInfo: {
        fontSize: 14,
        color: '#8E8E93',
    },
    scoreContainer: {
        alignItems: 'flex-end',
        minWidth: 60,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007AFF',
        marginBottom: 4,
    },
    scoreBar: {
        width: 60,
        height: 4,
        backgroundColor: '#E5E5EA',
        borderRadius: 2,
        overflow: 'hidden',
    },
    scoreBarFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 2,
    },
});
