import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AvailabilityStatus } from '../../types';

interface AvailabilityToggleProps {
    currentStatus: AvailabilityStatus;
    onStatusChange: (status: AvailabilityStatus) => void;
    disabled?: boolean;
}

export function AvailabilityToggle({
    currentStatus,
    onStatusChange,
    disabled = false,
}: AvailabilityToggleProps) {
    const statuses: { value: AvailabilityStatus; label: string; color: string; icon: string }[] = [
        { value: 'AVAILABLE', label: 'Müsait', color: '#34C759', icon: '✓' },
        { value: 'ON_DUTY', label: 'Görevde', color: '#FF9500', icon: '⚡' },
        { value: 'OFF_DUTY', label: 'Görev Dışı', color: '#8E8E93', icon: '○' },
    ];

    return (
        <View style={styles.container}>
            <Text style={styles.label}>Durum</Text>

            <View style={styles.toggleContainer}>
                {statuses.map((status) => (
                    <TouchableOpacity
                        key={status.value}
                        style={[
                            styles.button,
                            currentStatus === status.value && styles.buttonActive,
                            currentStatus === status.value && { borderColor: status.color },
                        ]}
                        onPress={() => onStatusChange(status.value)}
                        disabled={disabled}
                    >
                        <Text style={styles.icon}>{status.icon}</Text>
                        <Text
                            style={[
                                styles.buttonText,
                                currentStatus === status.value && styles.buttonTextActive,
                                currentStatus === status.value && { color: status.color },
                            ]}
                        >
                            {status.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Status Description */}
            <View style={styles.descriptionContainer}>
                {currentStatus === 'AVAILABLE' && (
                    <Text style={styles.description}>
                        📍 Yeni görevlere hazırsınız. Sevkiyat alabilirsiniz.
                    </Text>
                )}
                {currentStatus === 'ON_DUTY' && (
                    <Text style={styles.description}>
                        🚛 Görevdesiniz ancak yeni sevkiyat alamazsınız.
                    </Text>
                )}
                {currentStatus === 'OFF_DUTY' && (
                    <Text style={styles.description}>
                        💤 Görev dışısınız. Yeni sevkiyat alamazsınız.
                    </Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 12,
    },
    toggleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    buttonActive: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
    },
    icon: {
        fontSize: 16,
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#8E8E93',
    },
    buttonTextActive: {
        fontWeight: '600',
    },
    descriptionContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#F2F2F7',
        borderRadius: 8,
    },
    description: {
        fontSize: 14,
        color: '#000000',
        lineHeight: 20,
    },
});
