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
import { api } from '../../../services/api';
import { TouchableOpacity, Alert } from 'react-native';

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

    const handleContactAdmin = async () => {
        try {
            // 1. Get admins
            const admins = await api.getAdmins();
            if (admins.length === 0) {
                Alert.alert('Hata', 'Sistemde yönetici bulunamadı.');
                return;
            }

            // 2. Select first admin (for now - later can show list)
            const targetAdmin = admins[0];

            // 3. Navigate to chat
            router.push(`/conversation/${targetAdmin.id}` as any);
        } catch (error) {
            console.error('Failed to contact admin:', error);
            Alert.alert('Hata', 'Yönetici bilgisi alınamadı.');
        }
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

                    <TouchableOpacity
                        style={styles.contactAdminButton}
                        onPress={handleContactAdmin}
                    >
                        <MaterialCommunityIcons name="account-tie" size={24} color="white" />
                        <Text style={styles.contactAdminText}>Yöneticiyle İletişime Geç</Text>
                    </TouchableOpacity>
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
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <TouchableOpacity
                        onPress={handleContactAdmin}
                        style={styles.headerIconButton}
                    >
                        <MaterialCommunityIcons name="account-tie" size={24} color="white" />
                    </TouchableOpacity>
                    {unreadCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                    )}
                </View>
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
    headerIconButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
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
    contactAdminButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.xl,
        gap: 8,
        ...Shadows.md,
    },
    contactAdminText: {
        color: Colors.white,
        fontWeight: Typography.bold,
        fontSize: Typography.base,
    },
    listContent: {
        flexGrow: 1,
    },
});
