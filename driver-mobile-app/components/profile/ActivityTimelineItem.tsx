import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';
import { GeofenceEvent } from '../../types';

interface ActivityTimelineItemProps {
    event: GeofenceEvent;
    isLast?: boolean;
}

export function ActivityTimelineItem({ event, isLast }: ActivityTimelineItemProps) {
    const isEntry = event.eventType === 'ENTER';
    const iconName = isEntry ? 'map-marker-check' : 'map-marker-remove';
    const iconColor = isEntry ? Colors.success : Colors.warning;

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.timeline}>
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                    <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
                </View>
                {!isLast && <View style={styles.connector} />}
            </View>

            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {isEntry ? 'Bölgeye Giriş' : 'Bölgeden Çıkış'}
                    </Text>
                    <Text style={styles.time}>{formatTime(event.timestamp)}</Text>
                </View>
                <Text style={styles.location}>{event.geofence?.name || 'Bilinmeyen Bölge'}</Text>
                <Text style={styles.date}>{formatDate(event.timestamp)}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    timeline: {
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    connector: {
        width: 2,
        flex: 1,
        backgroundColor: Colors.gray200,
        marginTop: 4,
    },
    content: {
        flex: 1,
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: Typography.base,
        fontWeight: Typography.semibold,
        color: Colors.gray900,
    },
    time: {
        fontSize: Typography.xs,
        color: Colors.gray500,
    },
    location: {
        fontSize: Typography.sm,
        color: Colors.gray700,
        marginBottom: 2,
    },
    date: {
        fontSize: Typography.xs,
        color: Colors.gray400,
    },
});
