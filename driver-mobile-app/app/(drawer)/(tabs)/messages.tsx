import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Text,
    RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchConversations } from '../../../store/slices/messagesSlice';
import { ConversationCard } from '../../../components/chat/ConversationCard';
import { websocketService } from '../../../services/websocket';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../../constants/theme';
import { useRouter } from 'expo-router';

export default function MessagesScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { conversations, isLoading, error, unreadCount } = useAppSelector((state) => state.messages);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        // Load conversations
        dispatch(fetchConversations());

        // Connect WebSocket
        websocketService.connect();

        return () => {
            websocketService.disconnect();
        };
    }, [dispatch]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await dispatch(fetchConversations());
        setRefreshing(false);
    };

    const handleConversationPress = (userId: string) => {
        router.push(`/conversation/${userId}` as any);
    };

    if (isLoading && conversations.length === 0) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.gray900, '#0f172a']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                </LinearGradient>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Mesajlar yükleniyor...</Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.gray900, '#0f172a']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                </LinearGradient>
                <View style={styles.centerContent}>
                    <MaterialCommunityIcons name="alert-circle" size={64} color={Colors.danger} />
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </View>
        );
    }

    if (conversations.length === 0) {
        return (
            <View style={styles.container}>
                <LinearGradient
                    colors={[Colors.gray900, '#0f172a']}
                    style={styles.header}
                >
                    <Text style={styles.headerTitle}>Mesajlar</Text>
                </LinearGradient>
                <View style={styles.centerContent}>
                    <MaterialCommunityIcons name="message-text-outline" size={80} color={Colors.gray300} />
                    <Text style={styles.emptyTitle}>Henüz mesajınız yok</Text>
                    <Text style={styles.emptySubtext}>Yönetici veya diğer kullanıcılar ile mesajlaşabilirsiniz</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[Colors.gray900, '#0f172a']}
                style={styles.header}
            >
                <Text style={styles.headerTitle}>Mesajlar</Text>
                {unreadCount > 0 && (
                    <View style={styles.headerBadge}>
                        <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                    </View>
                )}
            </LinearGradient>

            <FlatList
                data={conversations}
                keyExtractor={(item) => item.user.id}
                renderItem={({ item }) => (
                    <ConversationCard
                        conversation={item}
                        onPress={() => handleConversationPress(item.user.id)}
                    />
                )}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.primary}
                    />
                }
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.surface,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 24,
        paddingHorizontal: Spacing.xl,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: Typography.xxl,
        fontWeight: Typography.bold,
        color: Colors.white,
    },
    headerBadge: {
        backgroundColor: Colors.danger,
        borderRadius: BorderRadius.full,
        minWidth: 28,
        height: 28,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerBadgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: Typography.bold,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    loadingText: {
        marginTop: Spacing.lg,
        fontSize: Typography.base,
        color: Colors.gray500,
    },
    errorText: {
        marginTop: Spacing.lg,
        fontSize: Typography.base,
        color: Colors.danger,
        textAlign: 'center',
    },
    emptyTitle: {
        marginTop: Spacing.xl,
        fontSize: Typography.lg,
        fontWeight: Typography.bold,
        color: Colors.gray900,
        textAlign: 'center',
    },
    emptySubtext: {
        marginTop: Spacing.sm,
        fontSize: Typography.sm,
        color: Colors.gray500,
        textAlign: 'center',
        maxWidth: 280,
    },
    listContent: {
        flexGrow: 1,
    },
});
