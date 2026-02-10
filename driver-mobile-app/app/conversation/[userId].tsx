import React, { useEffect, useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    Text,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchMessages,
    sendMessage,
    markConversationAsRead,
} from '../../store/slices/messagesSlice';
import { ChatBubble } from '../../components/chat/ChatBubble';
import { ChatInput } from '../../components/chat/ChatInput';
import { websocketService } from '../../services/websocket';
import { Colors } from '../../constants/theme';
import type { RootState } from '../../types';

export default function ConversationScreen() {
    const { userId } = useLocalSearchParams();
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { currentMessages, conversations, isLoading, error } = useAppSelector(
        (state: RootState) => state.messages
    );
    const currentUser = useAppSelector((state: RootState) => state.auth.user);

    // Get conversation details for header
    // Get conversation details for header
    const conversation = conversations.find(c => c.user.id === userId);

    // Try to get user info from messages if conversation is not found
    const otherUser = currentMessages.length > 0
        ? (currentMessages[0].senderId === userId ? currentMessages[0].sender : currentMessages[0].recipient)
        : null;

    const recipientName = conversation
        ? (conversation.user.email || 'Sohbet')
        : (otherUser ? (otherUser.email || 'Sohbet') : 'Sohbet');

    // Reverse messages for inverted FlatList (Newest at bottom visually, so first in data)
    // Backend returns Oldest -> Newest.
    // Inverted List expects Newest -> Oldest (Index 0 is bottom).
    // So we need to reverse the array.
    const messages = [...currentMessages].reverse();
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (userId) {
            dispatch(fetchMessages(userId as string));
            dispatch(markConversationAsRead(userId as string));

            // Listen for new messages
            const handleNewMessage = (message: any) => {
                if (message.senderId === userId || message.recipientId === userId) {
                    dispatch(fetchMessages(userId as string));
                }
            };

            websocketService.onNewMessage(handleNewMessage);

            return () => {
                websocketService.removeAllListeners();
            };
        }
    }, [userId, dispatch]);

    const handleSend = async (content: string) => {
        if (!userId) return;

        setIsSending(true);
        try {
            await dispatch(
                sendMessage({
                    recipientId: userId as string,
                    content,
                })
            ).unwrap();

            // Send via WebSocket for real-time delivery
            websocketService.sendMessage(userId as string, content);
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = () => {
        if (userId) {
            websocketService.typing(userId as string);
        }
    };

    const handleStopTyping = () => {
        if (userId) {
            websocketService.stopTyping(userId as string);
        }
    };

    if (isLoading && messages.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>❌ {error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{recipientName}</Text>
                    {conversation?.lastMessage && (
                        <Text style={styles.headerSubtitle}>
                            {conversation.user.role === 'ADMIN' ? 'Yönetici' : 'Sürücü'}
                        </Text>
                    )}
                </View>
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            >
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <ChatBubble
                            message={item}
                            isCurrentUser={item.senderId === currentUser?.id}
                        />
                    )}
                    inverted
                    contentContainerStyle={styles.messagesList}
                />

                <ChatInput
                    onSend={handleSend}
                    onTyping={handleTyping}
                    onStopTyping={handleStopTyping}
                    disabled={isSending}
                />
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    keyboardContainer: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
        backgroundColor: Colors.background,
        zIndex: 10,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.gray900,
    },
    headerSubtitle: {
        fontSize: 12,
        color: Colors.gray500,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    errorText: {
        fontSize: 16,
        color: Colors.danger,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});
