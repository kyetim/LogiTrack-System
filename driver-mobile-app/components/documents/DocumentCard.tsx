import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '../../types';

interface DocumentCardProps {
    document: Document;
    onPress?: () => void;
    onDelete?: () => void;
}

export function DocumentCard({ document, onPress, onDelete }: DocumentCardProps) {
    const isExpiring = document.expiryDate
        ? new Date(document.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : false;

    const isExpired = document.expiryDate
        ? new Date(document.expiryDate) < new Date()
        : false;

    const getDocumentIcon = (type: string): string => {
        if (!type) return 'document-outline';
        switch (type.toUpperCase()) {
            case 'LICENSE':
                return 'card-outline';
            case 'INSURANCE':
                return 'shield-checkmark-outline';
            case 'REGISTRATION':
                return 'document-text-outline';
            case 'INSPECTION':
                return 'checkmark-done-outline';
            default:
                return 'document-outline';
        }
    };

    const getDocumentLabel = (type: string): string => {
        const labels: Record<string, string> = {
            LICENSE: 'Sürücü Belgesi',
            INSURANCE: 'Sigorta',
            REGISTRATION: 'Ruhsat',
            INSPECTION: 'Muayene',
            ID_CARD: 'Kimlik',
            MEDICAL: 'Sağlık Raporu',
        };
        if (!type) return 'Bilinmeyen Belge';
        return labels[type.toUpperCase()] || type;
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const formatDate = (date: string): string => {
        return new Date(date).toLocaleDateString('tr-TR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isExpired && styles.expiredContainer,
                isExpiring && !isExpired && styles.expiringContainer,
            ]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.iconContainer}>
                <Ionicons
                    name={getDocumentIcon(document.documentType) as any}
                    size={32}
                    color={isExpired ? '#FF3B30' : isExpiring ? '#FF9500' : '#007AFF'}
                />
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.documentType} numberOfLines={1}>
                        {document.displayName || document.fileName}
                    </Text>
                    {document.verified && (
                        <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                            <Text style={styles.verifiedText}>Onaylı</Text>
                        </View>
                    )}
                </View>

                {document.documentType && (
                    <Text style={styles.typeLabel} numberOfLines={1}>
                        {getDocumentLabel(document.documentType)}
                    </Text>
                )}

                <View style={styles.metaRow}>
                    <Text style={styles.fileSize}>{formatFileSize(document.fileSize)}</Text>
                    <Text style={styles.separator}>•</Text>
                    <Text style={styles.uploadDate}>
                        {formatDate(document.uploadedAt)}
                    </Text>
                </View>

                {document.expiryDate && (
                    <View style={styles.expiryRow}>
                        <Ionicons
                            name="calendar-outline"
                            size={14}
                            color={isExpired ? '#FF3B30' : isExpiring ? '#FF9500' : '#8E8E93'}
                        />
                        <Text
                            style={[
                                styles.expiryDate,
                                isExpired && styles.expiredText,
                                isExpiring && !isExpired && styles.expiringText,
                            ]}
                        >
                            {isExpired ? 'Süresi doldu: ' : 'Geçerlilik: '}
                            {formatDate(document.expiryDate)}
                        </Text>
                    </View>
                )}
            </View>

            {onDelete && (
                <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    expiredContainer: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF3B30',
    },
    expiringContainer: {
        borderLeftWidth: 4,
        borderLeftColor: '#FF9500',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F2F2F7',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    documentType: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        flex: 1,
    },
    typeLabel: {
        fontSize: 12,
        color: '#8E8E93',
        marginBottom: 4,
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
    },
    verifiedText: {
        fontSize: 12,
        color: '#34C759',
        fontWeight: '500',
    },
    fileName: {
        fontSize: 14,
        color: '#8E8E93',
        marginBottom: 4,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    fileSize: {
        fontSize: 12,
        color: '#8E8E93',
    },
    separator: {
        fontSize: 12,
        color: '#8E8E93',
        marginHorizontal: 8,
    },
    uploadDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    expiryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    expiryDate: {
        fontSize: 12,
        color: '#8E8E93',
    },
    expiredText: {
        color: '#FF3B30',
        fontWeight: '600',
    },
    expiringText: {
        color: '#FF9500',
        fontWeight: '500',
    },
    deleteButton: {
        padding: 8,
        marginLeft: 8,
    },
});
