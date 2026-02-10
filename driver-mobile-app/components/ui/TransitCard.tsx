import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, Shadows, BorderRadius, Spacing } from '../../constants/theme';

interface TransitCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    statusBorder?: string; // Color code for the left status border
    vibrant?: string;      // Background color for vibrant mode
    onPress?: () => void;
}

export const TransitCard: React.FC<TransitCardProps> = ({
    children,
    style,
    statusBorder,
    vibrant,
    onPress
}) => {
    const CardContent = (
        <View style={[
            styles.card,
            vibrant ? { backgroundColor: vibrant } : null,
            statusBorder ? { borderLeftWidth: 4, borderLeftColor: statusBorder } : null,
            style
        ]}>
            {children}
        </View>
    );

    if (onPress) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
                {CardContent}
            </TouchableOpacity>
        );
    }

    return CardContent;
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.sm,
        ...Shadows.md,
    },
});
