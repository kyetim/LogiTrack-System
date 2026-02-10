import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

interface StatBlockProps {
    icon: keyof typeof MaterialCommunityIcons.glyphMap;
    value: string | number;
    label: string;
    color: string;
}

export const StatBlock: React.FC<StatBlockProps> = ({ icon, value, label, color }) => {
    return (
        <View style={[styles.container, { backgroundColor: color + '15' }]}>
            <MaterialCommunityIcons name={icon} size={32} color={color} />
            <Text style={[styles.value, { color: Colors.gray900 }]}>
                {value}
            </Text>
            <Text style={styles.label}>
                {label}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
    },
    value: {
        fontSize: Typography.xxl,
        fontWeight: Typography.bold,
        marginTop: Spacing.sm,
    },
    label: {
        fontSize: Typography.xs,
        color: Colors.gray500,
        marginTop: Spacing.xs,
        textAlign: 'center',
        textTransform: 'uppercase',
        fontWeight: Typography.semibold,
    },
});
