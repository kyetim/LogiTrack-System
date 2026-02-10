import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GeofenceEvent } from '../../types';

interface GeofenceEventCardProps {
    event: GeofenceEvent;
}

export function GeofenceEventCard({ event }: GeofenceEventCardProps) {
    const isEnterEvent = event.eventType === 'ENTER';

    const formatTime = (date: string): string => {
        return new Date(date).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: 'short',
        });
    };

    return (
        <View style={styles.container}>
            {/* Event Type Icon */}
            <View
                style={[
                    styles.iconContainer,
                    isEnterEvent ? styles.enterIcon : styles.exitIcon,
                ]}
            >
                <Ionicons
                    name={isEnterEvent ? 'enter-outline' : 'exit-outline'}
                    size={24}
                    color="#FFFFFF"
                />
            </View>

            {/* Event Info */}
            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.eventType}>
                        {isEnterEvent ? 'Bölgeye Giriş' : 'Bölgeden Çıkış'}
                    </Text>
                    <Text style={styles.time}>{formatTime(event.timestamp)}</Text>
                </View>

                <Text style={styles.geofenceName} numberOfLines={1}>
                    {event.geofence?.name || 'Bilinmeyen Bölge'}
                </Text>

                <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={14} color="#8E8E93" />
                    <Text style={styles.geofenceType}>
                        {getGeofenceTypeLabel(event.geofence?.type || 'UNKNOWN')}
                    </Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.date}>{formatDate(event.timestamp)}</Text>
                </View>
            </View>
        </View>
    );
}

function getGeofenceTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        WAREHOUSE: 'Depo',
        CUSTOMER_LOCATION: 'Müşteri',
        RESTRICTED_AREA: 'Kısıtlı Bölge',
        PREFERRED_ZONE: 'Tercih Edilen Bölge',
    };
    return labels[type] || type;
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: '#007AFF',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    enterIcon: {
        backgroundColor: '#34C759',
    },
    exitIcon: {
        backgroundColor: '#FF9500',
    },
    infoContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventType: {
        fontSize: 15,
        fontWeight: '600',
        color: '#000000',
    },
    time: {
        fontSize: 14,
        color: '#8E8E93',
    },
    geofenceName: {
        fontSize: 14,
        color: '#000000',
        marginBottom: 6,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    geofenceType: {
        fontSize: 12,
        color: '#8E8E93',
    },
    separator: {
        fontSize: 12,
        color: '#8E8E93',
        marginHorizontal: 4,
    },
    date: {
        fontSize: 12,
        color: '#8E8E93',
    },
});
