import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Conversation } from '../../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

interface ConversationCardProps {
    conversation: Conversation;
    onPress: () => void;
}

export function ConversationCard({ conversation, onPress }: ConversationCardProps) {
    const { user, lastMessage, unreadCount } = conversation;
    const hasUnread = unreadCount > 0;

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.avatarContainer}>
                <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.avatar}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.avatarText}>
                        {user.email.charAt(0).toUpperCase()}
                    </Text>
                </LinearGradient>
                {/* Online indicator - can be enabled when we have online status */}
                {/* <View style={styles.onlineIndicator} /> */}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.header}>
                    <Text
                        style={[styles.name, hasUnread && styles.nameUnread]}
                        numberOfLines={1}
                    >
                        {user.email}
                    </Text>
                    <Text style={styles.timestamp}>
                        {formatTimestamp(lastMessage.createdAt)}
                    </Text>
                </View>

                <View style={styles.messageRow}>
                    <Text
                        style={[
                            styles.lastMessage,
                            hasUnread && styles.unreadMessage
                        ]}
                        numberOfLines={2}
                    >
                        {lastMessage.content}
                    </Text>
                    {hasUnread && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Text>
                        </View>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );
}

function formatTimestamp(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins}d`;
    if (diffHours < 24) return `${diffHours}s`;
    if (diffDays < 7) return `${diffDays}g`;

    return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
    });
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        padding: Spacing.lg,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray100,
    },
    avatarContainer: {
        marginRight: Spacing.md,
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.sm,
    },
    avatarText: {
        color: Colors.white,
        fontSize: Typography.xl,
        fontWeight: Typography.bold,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.success,
        borderWidth: 2,
        borderColor: Colors.white,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    name: {
        flex: 1,
        fontSize: Typography.md,
        fontWeight: Typography.semibold,
        color: Colors.gray700,
    },
    nameUnread: {
        fontWeight: Typography.bold,
        color: Colors.gray900,
    },
    timestamp: {
        fontSize: Typography.xs,
        color: Colors.gray400,
        marginLeft: Spacing.sm,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        flex: 1,
        fontSize: Typography.sm,
        color: Colors.gray500,
        lineHeight: 18,
    },
    unreadMessage: {
        fontWeight: Typography.semibold,
        color: Colors.gray800,
    },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
        minWidth: 22,
        height: 22,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: Spacing.sm,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: Typography.bold,
    },
});
