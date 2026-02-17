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
import { TouchableOpacity, Alert, Modal } from 'react-native';

export default function MessagesScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { conversations, isLoading, error, unreadCount } = useAppSelector((state) => state.messages);
    const [refreshing, setRefreshing] = useState(false);
    const [showAdminSelector, setShowAdminSelector] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);

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

    const handleNewMessage = async () => {
        try {
            const adminList = await api.getAdmins();
            if (adminList.length === 0) {
                Alert.alert('Bilgi', 'Sistemde aktif admin bulunamadı.');
                return;
            }
            setAdmins(adminList);
            setShowAdminSelector(true);
        } catch (error) {
            console.error('Failed to fetch admins:', error);
            Alert.alert('Hata', 'Admin listesi yüklenemedi.');
        }
    };

    const handleSelectAdmin = (adminId: string) => {
        setShowAdminSelector(false);
        router.push(`/conversation/${adminId}` as any);
    };

    const handleDeleteConversation = (userId: string, userEmail: string) => {
        Alert.alert(
            'Konuşmayı Sil',
            `${userEmail} ile olan konuşmanızı silmek istediğinizden emin misiniz?`,
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Sil',
                    style: 'destructive',
                    onPress: () => {
                        // TODO: Backend endpoint eklenecek
                        Alert.alert('Bilgi', 'Konuşma silme özelliği yakında eklenecek');
                    },
                },
            ]
        );
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
                    <Text style={styles.emptySubtext}>Yönetici ile mesajlaşabilirsiniz</Text>

                    <TouchableOpacity
                        style={styles.contactAdminButton}
                        onPress={handleNewMessage}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
                        <Text style={styles.contactAdminText}>Yeni Mesaj</Text>
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
                        onPress={handleNewMessage}
                        style={styles.headerIconButton}
                    >
                        <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
                    </TouchableOpacity>
                    {unreadCount > 0 && (
                        <View style={styles.headerBadge}>
                            <Text style={styles.headerBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                        </View>
                    )}
                </View>
            </LinearGradient>

            {/* Admin Selector Modal */}
            <Modal
                visible={showAdminSelector}
                transparent
                animationType="fade"
                onRequestClose={() => setShowAdminSelector(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAdminSelector(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Kimle mesajlaşmak istersiniz?</Text>
                        {admins.map((admin) => (
                            <TouchableOpacity
                                key={admin.id}
                                style={styles.adminItem}
                                onPress={() => handleSelectAdmin(admin.id)}
                            >
                                <MaterialCommunityIcons name="account-tie" size={24} color={Colors.primary} />
                                <Text style={styles.adminName}>{admin.email}</Text>
                            </TouchableOpacity>
                        ))}
                        <TouchableOpacity
                            style={styles.modalCancelButton}
                            onPress={() => setShowAdminSelector(false)}
                        >
                            <Text style={styles.modalCancelText}>İptal</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <FlatList
                data={[...conversations].sort((a, b) =>
                    new Date(b.lastMessage?.createdAt || 0).getTime() -
                    new Date(a.lastMessage?.createdAt || 0).getTime()
                )}
                keyExtractor={(item) => item.user.id}
                renderItem={({ item }) => (
                    <ConversationCard
                        conversation={item}
                        onPress={() => handleConversationPress(item.user.id)}
                        onLongPress={() => handleDeleteConversation(item.user.id, item.user.email)}
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
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.gray900,
        marginBottom: 16,
    },
    adminItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: Colors.gray100,
        borderRadius: BorderRadius.lg,
        marginBottom: 12,
    },
    adminName: {
        fontSize: 16,
        color: Colors.gray900,
        marginLeft: 12,
    },
    modalCancelButton: {
        marginTop: 8,
        padding: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        color: Colors.gray500,
        fontWeight: '500',
    },
});
