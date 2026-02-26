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
    TextInput,
    Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAppDispatch, useAppSelector } from '../../store';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchMyTicket,
    sendSupportMessage,
    closeMyTicket,
} from '../../store/slices/supportSlice';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

export default function SupportScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { currentTicket, messages, isLoading, isSending, error } = useAppSelector(
        (state) => state.support
    );
    const currentUser = useAppSelector((state) => state.auth.user);
    const [messageText, setMessageText] = useState('');

    useEffect(() => {
        dispatch(fetchMyTicket());
    }, [dispatch]);

    const handleSend = async () => {
        if (!messageText.trim()) return;

        try {
            await dispatch(sendSupportMessage({ content: messageText.trim() })).unwrap();
            setMessageText('');
        } catch (error) {
            console.error('Failed to send message:', error);
            Alert.alert('Hata', 'Mesaj gönderilemedi');
        }
    };

    const handleClose = () => {
        Alert.alert(
            'Ticket Kapat',
            'Desteğiniz tamamlandı mı? Ticket kapatılacak.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Kapat',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(closeMyTicket()).unwrap();
                            Alert.alert('Başarılı', 'Destek talebi kapatıldı');
                            router.back();
                        } catch (error) {
                            Alert.alert('Hata', 'Ticket kapatılamadı');
                        }
                    },
                },
            ]
        );
    };

    const renderMessage = ({ item }: { item: any }) => {
        const isMe = item.senderId === currentUser?.id;
        const isSystem = item.isSystemMessage;

        if (isSystem) {
            return (
                <View style={styles.systemMessage}>
                    <Ionicons name="information-circle" size={16} color={Colors.gray500} />
                    <Text style={styles.systemMessageText}>{item.content}</Text>
                </View>
            );
        }

        return (
            <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
                <View style={styles.messageHeader}>
                    <Text style={styles.senderName}>
                        {isMe ? 'Ben' : item.sender?.email || 'Destek'}
                    </Text>
                    <Text style={styles.messageTime}>
                        {new Date(item.createdAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </Text>
                </View>
                <Text style={[styles.messageContent, isMe ? styles.myMessageText : styles.theirMessageText]}>
                    {item.content}
                </Text>
            </View>
        );
    };

    const getStatusBadge = () => {
        if (!currentTicket) return null;

        const statusColors: Record<string, string> = {
            OPEN: Colors.warning,
            ASSIGNED: Colors.primary,
            WAITING_REPLY: Colors.warning,
            IN_PROGRESS: Colors.info,
            RESOLVED: Colors.success,
            CLOSED: Colors.gray500,
        };

        const statusLabels: Record<string, string> = {
            OPEN: 'Açık',
            ASSIGNED: 'Atandı',
            WAITING_REPLY: 'Cevap Bekleniyor',
            IN_PROGRESS: 'Devam Ediyor',
            RESOLVED: 'Çözüldü',
            CLOSED: 'Kapalı',
        };

        return (
            <View style={[styles.statusBadge, { backgroundColor: statusColors[currentTicket.status] }]}>
                <Text style={styles.statusBadgeText}>{statusLabels[currentTicket.status]}</Text>
            </View>
        );
    };

    if (isLoading && !currentTicket) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>Destek talebi yükleniyor...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle" size={64} color={Colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => dispatch(fetchMyTicket())}
                >
                    <Text style={styles.retryButtonText}>Tekrar Dene</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={Colors.gray900} />
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>Merkez Destek</Text>
                    {currentTicket && (
                        <Text style={styles.headerSubtitle}>
                            Ticket #{currentTicket.ticketNumber}
                        </Text>
                    )}
                </View>
                {getStatusBadge()}
            </View>

            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <FlatList
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    inverted
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={64} color={Colors.gray300} />
                            <Text style={styles.emptyText}>
                                Henüz mesaj yok. İlk mesajınızı gönderin.
                            </Text>
                        </View>
                    }
                />

                {/* Input Area */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Mesajınızı yazın..."
                        placeholderTextColor={Colors.gray400}
                        value={messageText}
                        onChangeText={setMessageText}
                        multiline
                        maxLength={500}
                        editable={currentTicket?.status !== 'CLOSED'}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            (!messageText.trim() || isSending || currentTicket?.status === 'CLOSED') && styles.sendButtonDisabled,
                        ]}
                        onPress={handleSend}
                        disabled={!messageText.trim() || isSending || currentTicket?.status === 'CLOSED'}
                    >
                        {isSending ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <Ionicons name="send" size={20} color={Colors.white} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* Close Ticket Button */}
                {currentTicket && currentTicket.status !== 'CLOSED' && currentTicket.status !== 'RESOLVED' && (
                    <TouchableOpacity style={styles.closeTicketButton} onPress={handleClose}>
                        <Text style={styles.closeTicketButtonText}>Sorunum Çözüldü - Ticket'ı Kapat</Text>
                    </TouchableOpacity>
                )}
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
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusBadgeText: {
        color: Colors.white,
        fontSize: 12,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
        padding: Spacing.xl,
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
    retryButton: {
        marginTop: Spacing.xl,
        backgroundColor: Colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: BorderRadius.lg,
    },
    retryButtonText: {
        color: Colors.white,
        fontWeight: '600',
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingVertical: 16,
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: BorderRadius.lg,
        marginVertical: 4,
    },
    myMessage: {
        alignSelf: 'flex-end',
        backgroundColor: Colors.primary,
    },
    theirMessage: {
        alignSelf: 'flex-start',
        backgroundColor: Colors.gray100,
    },
    messageHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    senderName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.gray700,
    },
    messageTime: {
        fontSize: 10,
        color: Colors.gray500,
    },
    messageContent: {
        fontSize: 14,
    },
    myMessageText: {
        color: Colors.white,
    },
    theirMessageText: {
        color: Colors.gray900,
    },
    systemMessage: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        marginVertical: 8,
    },
    systemMessageText: {
        fontSize: 12,
        color: Colors.gray500,
        marginLeft: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        marginTop: Spacing.lg,
        fontSize: Typography.base,
        color: Colors.gray500,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.gray200,
        backgroundColor: Colors.white,
    },
    input: {
        flex: 1,
        backgroundColor: '#f8fafc', // Colors.gray50 equivalent
        borderRadius: BorderRadius.lg,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 8,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        backgroundColor: Colors.primary,
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: Colors.gray300,
    },
    closeTicketButton: {
        backgroundColor: Colors.success,
        paddingVertical: 12,
        paddingHorizontal: 16,
        margin: 12,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    closeTicketButtonText: {
        color: Colors.white,
        fontWeight: '600',
        fontSize: 14,
    },
});
