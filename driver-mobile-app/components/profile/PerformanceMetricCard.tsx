import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface PerformanceMetricCardProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    label: string;
    value: string | number;
    subValue?: string;
    color?: string;
}

export function PerformanceMetricCard({
    icon,
    label,
    value,
    subValue,
    color = Colors.primary,
}: PerformanceMetricCardProps) {
    return (
        <View style={styles.container}>
            <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
                <MaterialCommunityIcons name={icon} size={28} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
                {subValue && <Text style={styles.subValue}>{subValue}</Text>}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Shadows.sm,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    value: {
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    subValue: {
        fontSize: Typography.xs,
        color: Colors.gray400,
        marginTop: 2,
    },
});
