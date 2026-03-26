import React, { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MessageCircle, Plus, X } from 'lucide-react-native';
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from '@gorhom/bottom-sheet';

import { useAppDispatch, useAppSelector } from '../../../store';
import { fetchConversations } from '../../../store/slices/messagesSlice';
import { websocketService } from '../../../services/websocket';
import { api } from '../../../services/api';
import { Colors, Typography, Radius, Shadows } from '../../theme/tokens';
import { MainStackParamList } from '../../navigation/MainNavigator';
import { Conversation, User } from '../../../types';

type ConversationsNavProp = NativeStackNavigationProp<MainStackParamList>;

export const ConversationsScreen = () => {
    const navigation = useNavigation<ConversationsNavProp>();
    const dispatch = useAppDispatch();
    const { conversations, isLoading } = useAppSelector((state) => state.messages);

    // New Message Bottom Sheet State
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);
    const snapPoints = useMemo(() => ['50%', '75%'], []);
    const [admins, setAdmins] = useState<User[]>([]);
    const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

    const loadConversations = useCallback(() => {
        dispatch(fetchConversations());
    }, [dispatch]);

    useFocusEffect(
        useCallback(() => {
            loadConversations();

            const handleNewMessage = () => {
                dispatch(fetchConversations());
            };
            websocketService.onNewMessage(handleNewMessage);

            return () => {
                websocketService.offNewMessage(handleNewMessage);
            };
        }, [loadConversations, dispatch])
    );

    const handleOpenNewMessage = async () => {
        bottomSheetModalRef.current?.present();
        if (admins.length === 0) {
            setIsLoadingAdmins(true);
            try {
                const data = await api.getAdmins();
                setAdmins(data);
            } catch (error) {
                console.log('Error fetching admins:', error);
            } finally {
                setIsLoadingAdmins(false);
            }
        }
    };

    const handleSelectAdmin = (admin: User) => {
        bottomSheetModalRef.current?.close();
        navigation.navigate('ConversationDetail', {
            userId: admin.id,
            email: admin.email,
        });
    };

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
                            {item.user.firstName ? `${item.user.firstName} ${item.user.lastName || ''}` : item.user.email}
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
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <MessageCircle color={Colors.surface} size={48} style={{ marginBottom: 16 }} />
                            <Text style={styles.emptyText}>Henüz mesaj yok</Text>
                            <Text style={styles.emptySubText}>
                                Yeni bir mesaj başlatmak için aşağıdaki butonu kullanın.
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                activeOpacity={0.8}
                onPress={handleOpenNewMessage}
            >
                <Plus color={Colors.background} size={28} />
            </TouchableOpacity>

            {/* Bottom Sheet for Selecting Admins */}
            <BottomSheetModal
                ref={bottomSheetModalRef}
                index={0}
                snapPoints={snapPoints}
                backgroundStyle={{ backgroundColor: Colors.surface }}
                handleIndicatorStyle={{ backgroundColor: Colors.gray }}
                backdropComponent={(props) => (
                    <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
                )}
            >
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>Mesaj Başlat</Text>
                    <TouchableOpacity onPress={() => bottomSheetModalRef.current?.close()}>
                        <X color={Colors.white} size={24} />
                    </TouchableOpacity>
                </View>

                {isLoadingAdmins ? (
                    <View style={styles.sheetCenter}>
                        <ActivityIndicator color={Colors.primary} />
                    </View>
                ) : admins.length === 0 ? (
                    <View style={styles.sheetCenter}>
                        <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text>
                    </View>
                ) : (
                    <BottomSheetFlatList
                        data={admins}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.adminRow}
                                onPress={() => handleSelectAdmin(item)}
                            >
                                <View style={[styles.avatar, { width: 40, height: 40, borderRadius: 20 }]}>
                                    <Text style={[styles.avatarText, { fontSize: 14 }]}>
                                        {getInitials(item.email)}
                                    </Text>
                                </View>
                                <View style={styles.adminContent}>
                                    <Text style={styles.adminName}>
                                        {item.firstName ? `${item.firstName} ${item.lastName || ''}` : item.email}
                                    </Text>
                                    <Text style={styles.adminRole}>
                                        {item.role === 'ADMIN' ? 'Yönetici' : 'Dispeçer'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </BottomSheetModal>
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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
    emptyText: { fontFamily: Typography.fontBodyMedium, fontSize: 16, color: Colors.white, marginBottom: 8 },
    emptySubText: { fontFamily: Typography.fontBody, fontSize: 14, color: Colors.gray, textAlign: 'center' },
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
        fontSize: 15,
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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.primaryGlow
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    sheetTitle: {
        fontFamily: Typography.fontDisplayBold,
        fontSize: 18,
        color: Colors.white,
    },
    sheetCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    adminRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: '#2A2A2A',
    },
    adminContent: {
        flex: 1,
    },
    adminName: {
        fontFamily: Typography.fontBodyMedium,
        fontSize: 15,
        color: Colors.white,
        marginBottom: 2,
    },
    adminRole: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    }
});

