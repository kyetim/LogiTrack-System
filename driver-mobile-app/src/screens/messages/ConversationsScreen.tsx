import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchConversations } from '../../../store/slices/messagesSlice';
import { websocketService } from '../../../services/websocket';
import { Colors, Typography } from '../../theme/tokens';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Conversation } from '../../../types';

type ConversationsNavProp = NativeStackNavigationProp<MainStackParamList>;

export const ConversationsScreen = () => {
    const navigation = useNavigation<ConversationsNavProp>();
    const dispatch = useAppDispatch();
    const { conversations, isLoading } = useAppSelector((state) => state.messages);

    const loadConversations = useCallback(() => {
        dispatch(fetchConversations());
    }, [dispatch]);

    useEffect(() => {
        loadConversations();

        const handleNewMessage = () => {
            dispatch(fetchConversations());
        };
        websocketService.onNewMessage(handleNewMessage);

        return () => {
            websocketService.offNewMessage(handleNewMessage);
        };
    }, [loadConversations]);

    const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

    const formatTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        if (diffMins < 1) return 'Şimdi';
        if (diffMins < 60) return `${diffMins}d`;
        if (diffHours < 24) return `${diffHours}s`;
        if (diffDays < 7) return `${diffDays}g`;
        return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
    };

    const renderItem = ({ item }: { item: Conversation }) => {
        const hasUnread = item.unreadCount > 0;
        return (
            <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() =>
                    navigation.navigate('ConversationDetail', {
                        userId: item.user.id,
                        email: item.user.email,
                    })
                }
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{getInitials(item.user.email)}</Text>
                </View>
                <View style={styles.content}>
                    <View style={styles.rowTop}>
                        <Text style={[styles.email, hasUnread && styles.emailBold]} numberOfLines={1}>
                            {item.user.email}
                        </Text>
                        <Text style={styles.time}>
                            {item.lastMessage?.createdAt ? formatTime(item.lastMessage.createdAt) : ''}
                        </Text>
                    </View>
                    <View style={styles.rowBottom}>
                        <Text style={[styles.lastMsg, hasUnread && styles.lastMsgBold]} numberOfLines={1}>
                            {item.lastMessage?.content || ''}
                        </Text>
                        {hasUnread && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>
                                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Mesajlar</Text>
            </View>
            {isLoading && conversations.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) => item.user.id}
                    renderItem={renderItem}
                    onRefresh={loadConversations}
                    refreshing={isLoading}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
    },
    title: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 22,
        color: Colors.white,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
    emptyText: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 16,
        color: Colors.background,
    },
    content: { flex: 1 },
    rowTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    email: {
        flex: 1,
        fontFamily: Typography.fontBodyMedium,
        fontSize: 14,
        color: Colors.white,
        marginRight: 8,
    },
    emailBold: { fontFamily: Typography.fontBodySemiBold },
    time: { fontFamily: Typography.fontBody, fontSize: 11, color: Colors.gray },
    rowBottom: { flexDirection: 'row', alignItems: 'center' },
    lastMsg: {
        flex: 1,
        fontFamily: Typography.fontBody,
        fontSize: 13,
        color: Colors.gray,
    },
    lastMsgBold: { fontFamily: Typography.fontBodyMedium, color: Colors.white },
    badge: {
        backgroundColor: Colors.primary,
        borderRadius: 99,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
    badgeText: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 10,
        color: Colors.background,
    },
});
