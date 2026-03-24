import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DriverScore } from '../../types';

interface ScoreCardProps {
    score: DriverScore;
    showRank?: boolean;
}

export function ScoreCard({ score, showRank = false }: ScoreCardProps) {
    const getScoreColor = (value: number): string => {
        if (value >= 80) return '#34C759';
        if (value >= 60) return '#FF9500';
        return '#FF3B30';
    };

    const getScoreLabel = (value: number): string => {
        if (value >= 90) return 'Mükemmel';
        if (value >= 80) return 'Çok İyi';
        if (value >= 70) return 'İyi';
        if (value >= 60) return 'Orta';
        return 'Geliştirilmeli';
    };

    return (
        <View style={styles.container}>
            {/* Overall Score Circle */}
            <View style={styles.scoreCircleContainer}>
                <View
                    style={[
                        styles.scoreCircle,
                        { borderColor: getScoreColor(score.overallScore) },
                    ]}
                >
                    <Text style={styles.scoreValue}>{score.overallScore}</Text>
                    <Text style={styles.scoreLabel}>Genel Puan</Text>
                </View>
                {showRank && score.rank && (
                    <View style={styles.rankBadge}>
                        <Text style={styles.rankText}>#{score.rank}</Text>
                    </View>
                )}
            </View>

            {/* Score Breakdown */}
            <View style={styles.metricsContainer}>
                <ScoreMetric
                    label="Güvenlik"
                    value={score.safetyScore}
                    icon="🛡️"
                />
                <ScoreMetric
                    label="Dakiklik"
                    value={score.punctualityScore}
                    icon="⏱️"
                />
                <ScoreMetric
                    label="Yakıt Verimliliği"
                    value={score.fuelEfficiency}
                    icon="⛽"
                />
                <ScoreMetric
                    label="Müşteri Memnuniyeti"
                    value={score.customerRating}
                    icon="⭐"
                />
            </View>

            {/* Status Label */}
            <View style={styles.statusContainer}>
                <Text
                    style={[
                        styles.statusText,
                        { color: getScoreColor(score.overallScore) },
                    ]}
                >
                    {getScoreLabel(score.overallScore)}
                </Text>
            </View>
        </View>
    );
}

interface ScoreMetricProps {
    label: string;
    value: number;
    icon: string;
}

function ScoreMetric({ label, value, icon }: ScoreMetricProps) {
    return (
        <View style={styles.metric}>
            <Text style={styles.metricIcon}>{icon}</Text>
            <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>{label}</Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${value}%` },
                        ]}
                    />
                </View>
                <Text style={styles.metricValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreCircleContainer: {
        alignItems: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    scoreCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F2F2F7',
    },
    scoreValue: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#000000',
    },
    scoreLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginTop: 4,
    },
    rankBadge: {
        position: 'absolute',
        top: 0,
        right: 80,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    rankText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    metricsContainer: {
        marginBottom: 16,
    },
    metric: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    metricIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    metricInfo: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 6,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E5E5EA',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#007AFF',
        borderRadius: 3,
    },
    metricValue: {
        fontSize: 12,
        color: '#8E8E93',
        textAlign: 'right',
    },
    statusContainer: {
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E5EA',
    },
    statusText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
