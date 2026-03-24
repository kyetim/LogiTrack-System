import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ActivityIndicator,
    Platform,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../../store';
import {
    fetchMessages,
    sendMessage,
    markConversationAsRead,
    fetchUnreadCount,
    fetchConversations,
} from '../../../store/slices/messagesSlice';
import { ChatBubble } from '../../../components/chat/ChatBubble';
import { ChatInput } from '../../../components/chat/ChatInput';
import { websocketService } from '../../../services/websocket';
import { Colors, Typography } from '../../theme/tokens';
import { MainStackParamList } from '../../navigation/MainNavigator';

type RouteType = RouteProp<MainStackParamList, 'ConversationDetail'>;

export const ConversationDetailScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteType>();
    const { userId, email } = route.params;
    const dispatch = useAppDispatch();
    const flatListRef = useRef<FlatList>(null);

    const { currentMessages, isLoading } = useAppSelector((state) => state.messages);
    const currentUser = useAppSelector((state) => state.auth.user);

    const messages = [...currentMessages].reverse();

    useEffect(() => {
        dispatch(fetchMessages(userId));
        dispatch(markConversationAsRead(userId)).then(() => {
            dispatch(fetchUnreadCount());
        });

        const handleNewMessage = (message: any) => {
            if (message.senderId === userId || message.recipientId === userId) {
                dispatch(fetchMessages(userId));
                dispatch(fetchConversations());
                dispatch(markConversationAsRead(userId)).then(() => {
                    dispatch(fetchUnreadCount());
                });
            }
        };

        websocketService.onNewMessage(handleNewMessage);

        return () => {
            websocketService.offNewMessage(handleNewMessage);
        };
    }, [userId, dispatch]);

    const handleSend = async (content: string) => {
        try {
            await dispatch(sendMessage({ recipientId: userId, content })).unwrap();
            websocketService.sendMessage(userId, content);
        } catch (error) {
            console.error('Mesaj gönderilemedi:', error);
        }
    };

    const handleTyping = () => websocketService.typing(userId);
    const handleStopTyping = () => websocketService.stopTyping(userId);

    if (isLoading && messages.length === 0) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={Colors.white} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle} numberOfLines={1}>{email}</Text>
                    <Text style={styles.headerSub}>
                        {currentMessages[0]?.sender?.role === 'ADMIN' ? 'Yönetici' : 'Sürücü'}
                    </Text>
                </View>
            </View>

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ChatBubble
                        message={item}
                        isCurrentUser={item.senderId === currentUser?.id}
                    />
                )}
                inverted
                contentContainerStyle={styles.list}
            />

            <ChatInput
                onSend={handleSend}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surface,
        backgroundColor: Colors.background,
    },
    backBtn: { padding: 8, marginRight: 8 },
    headerInfo: { flex: 1 },
    headerTitle: {
        fontFamily: Typography.fontBodySemiBold,
        fontSize: 16,
        color: Colors.white,
    },
    headerSub: {
        fontFamily: Typography.fontBody,
        fontSize: 12,
        color: Colors.gray,
    },
    list: { paddingHorizontal: 12, paddingVertical: 16 },
});
