import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography } from '@/theme/tokens';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

export interface StatItem {
    label: string;
    value: string;
    icon: React.ReactNode;
    trend?: '+' | '-' | null;
    trendValue?: string;
}

export interface StatsRowProps {
    items: StatItem[];
}

export const StatsRow: React.FC<StatsRowProps> = ({ items }) => {
    // Render up to 4 items
    const displayItems = items.slice(0, 4);

    return (
        <View style={styles.container}>
            {displayItems.map((item, index) => {
                const isPositive = item.trend === '+';
                const isNegative = item.trend === '-';

                return (
                    <View key={index} style={styles.statBox}>
                        <View style={styles.iconContainer}>
                            {item.icon}
                        </View>
                        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                            {item.value}
                        </Text>
                        <Text style={styles.label} numberOfLines={1} adjustsFontSizeToFit>
                            {item.label}
                        </Text>

                        {/* Trend Indicator (Optional) */}
                        {(isPositive || isNegative) && item.trendValue && (
                            <View style={styles.trendContainer}>
                                {isPositive ? (
                                    <TrendingUp color={Colors.success} size={12} strokeWidth={3} />
                                ) : (
                                    <TrendingDown color={Colors.error} size={12} strokeWidth={3} />
                                )}
                                <Text
                                    style={[
                                        styles.trendText,
                                        { color: isPositive ? Colors.success : Colors.error },
                                    ]}
                                >
                                    {item.trendValue}
                                </Text>
                            </View>
                        )}
                    </View>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        width: '100%',
        justifyContent: 'space-between',
    },
    statBox: {
        flex: 1,
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    iconContainer: {
        marginBottom: 8,
    },
    value: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 18,
        color: Colors.white,
        marginBottom: 4,
    },
    label: {
        fontFamily: Typography.fontBody,
        fontSize: 11,
        color: Colors.gray,
        marginBottom: 8,
    },
    trendContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 'auto', // Push to bottom if content grows differently
    },
    trendText: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 10,
    },
});
