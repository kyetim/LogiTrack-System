import React, { useEffect, useRef, useState } from 'react';
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
    Linking,
    Modal,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../../../store';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchMyTicket,
    sendSupportMessage,
    closeMyTicket,
    addSupportMessage,
} from '../../../store/slices/supportSlice';
import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/theme';
import { api } from '../../../services/api';
import { io } from 'socket.io-client';
import { WS_URL } from '../../../utils/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../../../utils/constants';

export default function SupportScreen() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { currentTicket, messages, isLoading, isSending, error } = useAppSelector(
        (state) => state.support
    );
    const currentUser = useAppSelector((state) => state.auth.user);
    const [messageText, setMessageText] = useState('');
    const [selectedPriority, setSelectedPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | null>(null);
    const [showEmergencyModal, setShowEmergencyModal] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState<any>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [closedTickets, setClosedTickets] = useState<any[]>([]);
    // viewMode controls what the user sees: 'selector' = priority chooser, 'chat' = active ticket chat
    const [viewMode, setViewMode] = useState<'selector' | 'chat'>('selector');

    useEffect(() => {
        dispatch(fetchMyTicket());

        // Connect to main WebSocket namespace to receive admin replies in real-time
        let supportSocket: any = null;
        const setupSupportSocket = async () => {
            const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            if (!token) return;

            supportSocket = io(WS_URL, {
                auth: { token },
                transports: ['websocket'],
            });

            supportSocket.on('support:admin-reply', (data: any) => {
                if (data?.message) {
                    dispatch(addSupportMessage(data.message));
                }
            });
        };

        setupSupportSocket();

        return () => {
            if (supportSocket) supportSocket.disconnect();
        };
    }, [dispatch]);

    // Every time the user focuses this tab, reset to selector view
    // so they always consciously choose what to do
    useFocusEffect(
        React.useCallback(() => {
            setViewMode('selector');
            setSelectedPriority(null);
            setMessageText('');
        }, [])
    );

    const fetchClosedTickets = async () => {
        try {
            setLoadingHistory(true);
            const tickets = await api.getMyClosedTickets();
            setClosedTickets(tickets);
        } catch (error) {
            console.error('Failed to fetch closed tickets:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (showHistory) {
            fetchClosedTickets();
        }
    }, [showHistory]);

    const handleCancel = () => {
        setSelectedPriority(null);
        setMessageText('');
        setViewMode('selector');
    };

    const handleSend = async () => {
        if (!messageText.trim()) return;

        // İlk mesaj ise onay iste
        if (!currentTicket || messages.length === 0) {
            Alert.alert(
                'Destek Talebi Oluştur',
                'Destek ekibine talep oluşturmak istediğinizden emin misiniz?',
                [
                    { text: 'İptal', style: 'cancel' },
                    {
                        text: 'Oluştur',
                        onPress: async () => {
                            try {
                                await dispatch(sendSupportMessage(messageText.trim())).unwrap();
                                setMessageText('');
                            } catch (error) {
                                console.error('Failed to send message:', error);
                                Alert.alert('Hata', 'Mesaj gönderilemedi');
                            }
                        },
                    },
                ]
            );
            return;
        }

        try {
            await dispatch(sendSupportMessage(messageText.trim())).unwrap();
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

    const handleEmergency = async () => {
        Alert.alert(
            '🚨 ACİL DURUM',
            'Acil destek talebi oluşturulsun mu? Admin ekibine bildirilecek ve size acil yardım hattı bilgisi verilecek.',
            [
                { text: 'İptal', style: 'cancel' },
                {
                    text: 'Evet, ACİL!',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await api.createEmergencyTicket();
                            setEmergencyContact(response.emergencyContact);
                            setShowEmergencyModal(true);
                            dispatch(fetchMyTicket()); // Refresh ticket
                        } catch (error) {
                            console.error('Emergency ticket failed:', error);
                            Alert.alert('Hata', 'Acil talep oluşturulamadı');
                        }
                    },
                },
            ]
        );
    };

    const handleCallEmergency = () => {
        if (emergencyContact?.phone) {
            Linking.openURL(`tel:${emergencyContact.phone.replace(/\s/g, '')}`);
        }
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

        const statusColors = {
            OPEN: Colors.warning,
            ASSIGNED: Colors.primary,
            WAITING_REPLY: Colors.warning,
            IN_PROGRESS: Colors.info,
            RESOLVED: Colors.success,
            CLOSED: Colors.gray500,
        };

        const statusLabels = {
            OPEN: 'Açık',
            ASSIGNED: 'Atandı',
            WAITING_REPLY: 'Cevap Bekleniyor',
            IN_PROGRESS: 'Devam Ediyor',
            RESOLVED: 'Çözüldü',
            CLOSED: 'Kapalı',
        };

        const status = currentTicket.status as keyof typeof statusColors;
        return (
            <View style={[styles.statusBadge, { backgroundColor: statusColors[status] || Colors.gray500 }]}>
                <Text style={styles.statusBadgeText}>{statusLabels[status] || currentTicket.status}</Text>
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
            {/* Header */}
            <View style={styles.header}>
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
                {/* Emergency Modal */}
                <Modal
                    visible={showEmergencyModal}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowEmergencyModal(false)}
                >
                    <View style={styles.emergencyModalOverlay}>
                        <View style={styles.emergencyModalContent}>
                            <Ionicons name="warning" size={64} color={Colors.danger} />
                            <Text style={styles.emergencyTitle}>🚨 ACİL DURUM</Text>
                            <Text style={styles.emergencySubtitle}>
                                Destek ekibi bilgilendirildi
                            </Text>

                            <View style={styles.emergencyContactBox}>
                                <Text style={styles.emergencyContactLabel}>Acil Yardım Hattı:</Text>
                                <Text style={styles.emergencyPhone}>{emergencyContact?.phone}</Text>
                                <Text style={styles.emergencyAvailable}>
                                    {emergencyContact?.available247 ? '7/24 Hizmetinizde' : ''}
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={handleCallEmergency}
                            >
                                <Ionicons name="call" size={24} color={Colors.white} />
                                <Text style={styles.callButtonText}>HEMEN ARA</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.emergencyCloseButton}
                                onPress={() => setShowEmergencyModal(false)}
                            >
                                <Text style={styles.emergencyCloseText}>Kapat</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>

                {/* History Modal */}
                <Modal
                    visible={showHistory}
                    transparent
                    animationType="slide"
                    onRequestClose={() => setShowHistory(false)}
                >
                    <View style={styles.historyModalOverlay}>
                        <View style={styles.historyModalContent}>
                            <View style={styles.historyHeader}>
                                <Text style={styles.historyTitle}>Geçmiş Talepler</Text>
                                <TouchableOpacity onPress={() => setShowHistory(false)}>
                                    <Ionicons name="close" size={28} color={Colors.gray700} />
                                </TouchableOpacity>
                            </View>

                            {loadingHistory ? (
                                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
                            ) : closedTickets.length === 0 ? (
                                <View style={styles.emptyHistory}>
                                    <Ionicons name="folder-open-outline" size={64} color={Colors.gray300} />
                                    <Text style={styles.emptyHistoryText}>Geçmiş talep bulunamadı</Text>
                                </View>
                            ) : (
                                <ScrollView style={styles.historyList}>
                                    {closedTickets.map((ticket) => (
                                        <View key={ticket.id} style={styles.historyCard}>
                                            <View style={styles.historyCardHeader}>
                                                <Text style={styles.historyTicketNumber}>#{ticket.ticketNumber}</Text>
                                                <Text style={{
                                                    fontSize: 12,
                                                    color: ticket.status === 'CLOSED' ? Colors.gray500 : Colors.success,
                                                    fontWeight: '600'
                                                }}>
                                                    {ticket.status === 'CLOSED' ? 'KAPALI' : 'ÇÖZÜLDÜ'}
                                                </Text>
                                            </View>
                                            <Text style={styles.historySubject}>{ticket.subject}</Text>
                                            <Text style={styles.historyDate}>
                                                {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                                            </Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    </View>
                </Modal>

                {/* SELECTOR VIEW: shown when viewMode === 'selector' */}
                {viewMode === 'selector' ? (
                    <View style={styles.prioritySelectorContainer}>
                        <Text style={styles.priorityTitle}>Destek Talebi</Text>

                        {/* If there's an open/active ticket, show it as the first option */}
                        {currentTicket && currentTicket.status !== 'CLOSED' && currentTicket.status !== 'RESOLVED' && (
                            <TouchableOpacity
                                style={styles.activeTicketCard}
                                onPress={() => setViewMode('chat')}
                            >
                                <View style={styles.activeTicketIcon}>
                                    <Ionicons name="chatbubbles" size={28} color={Colors.primary} />
                                </View>
                                <View style={styles.priorityInfo}>
                                    <Text style={styles.activeTicketLabel}>Açık Destek Talebine Devam Et</Text>
                                    <Text style={styles.activeTicketSub}>Ticket #{currentTicket.ticketNumber} • {
                                        { OPEN: 'Açık', ASSIGNED: 'Atandı', WAITING_REPLY: 'Cevap Bekleniyor', IN_PROGRESS: 'Devam Ediyor' }[currentTicket.status as string] || currentTicket.status
                                    }</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={Colors.gray400} />
                            </TouchableOpacity>
                        )}

                        {/* Geçmiş Talepler Button */}
                        {currentTicket && (currentTicket.status === 'CLOSED' || currentTicket.status === 'RESOLVED') && (
                            <TouchableOpacity
                                style={styles.historyButton}
                                onPress={() => setShowHistory(true)}
                            >
                                <Ionicons name="time-outline" size={20} color={Colors.gray600} />
                                <Text style={styles.historyButtonText}>Geçmiş Talepler</Text>
                            </TouchableOpacity>
                        )}

                        <Text style={[styles.priorityTitle, { fontSize: 16, marginTop: 16, marginBottom: 12 }]}>
                            Yeni Talep Oluştur:
                        </Text>

                        {/* LOW */}
                        <TouchableOpacity
                            style={[styles.priorityCard, styles.priorityLow]}
                            onPress={() => { setSelectedPriority('LOW'); setViewMode('chat'); }}
                        >
                            <View style={styles.priorityIcon}>
                                <Text style={styles.priorityEmoji}>🟢</Text>
                            </View>
                            <View style={styles.priorityInfo}>
                                <Text style={styles.priorityLabel}>Düşük</Text>
                                <Text style={styles.priorityDescription}>Genel bilgi ve sorular</Text>
                            </View>
                        </TouchableOpacity>

                        {/* NORMAL */}
                        <TouchableOpacity
                            style={[styles.priorityCard, styles.priorityNormal]}
                            onPress={() => { setSelectedPriority('NORMAL'); setViewMode('chat'); }}
                        >
                            <View style={styles.priorityIcon}>
                                <Text style={styles.priorityEmoji}>🟡</Text>
                            </View>
                            <View style={styles.priorityInfo}>
                                <Text style={styles.priorityLabel}>Normal</Text>
                                <Text style={styles.priorityDescription}>Standart destek talebi</Text>
                            </View>
                        </TouchableOpacity>

                        {/* HIGH */}
                        <TouchableOpacity
                            style={[styles.priorityCard, styles.priorityHigh]}
                            onPress={() => { setSelectedPriority('HIGH'); setViewMode('chat'); }}
                        >
                            <View style={styles.priorityIcon}>
                                <Text style={styles.priorityEmoji}>🟠</Text>
                            </View>
                            <View style={styles.priorityInfo}>
                                <Text style={styles.priorityLabel}>Yüksek</Text>
                                <Text style={styles.priorityDescription}>Önemli sorun</Text>
                            </View>
                        </TouchableOpacity>

                        <View style={styles.divider} />

                        {/* EMERGENCY */}
                        <TouchableOpacity
                            style={styles.emergencyCard}
                            onPress={handleEmergency}
                        >
                            <Ionicons name="warning" size={32} color={Colors.white} />
                            <Text style={styles.emergencyCardTitle}>🔴 KAZA - ACİL YARDIM</Text>
                            <Text style={styles.emergencyCardSubtitle}>(Tek tuşla destek)</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    /* CHAT VIEW: shown when viewMode === 'chat' */
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
                                    Mesajınızı yazın, destek ekibi size yardımcı olacak.
                                </Text>
                            </View>
                        }
                    />
                )}

                {/* Input Area - show only in chat view */}
                {viewMode === 'chat' && (
                    <View style={styles.inputContainer}>
                        {/* Geri dön button */}
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Ionicons name="arrow-back" size={20} color={Colors.gray600} />
                        </TouchableOpacity>
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
                )}

                {/* Close Ticket Button - only in chat view */}
                {viewMode === 'chat' && currentTicket && currentTicket.status !== 'CLOSED' && currentTicket.status !== 'RESOLVED' && (
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
    cancelButton: {
        padding: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
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
        backgroundColor: Colors.gray100,
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
    // Priority Selector Styles
    prioritySelectorContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    priorityTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.gray900,
        marginBottom: 24,
        textAlign: 'center',
    },
    historyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: Colors.gray100,
        borderRadius: BorderRadius.lg,
        marginBottom: 20,
        gap: 8,
    },
    historyButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.gray600,
    },
    priorityCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: BorderRadius.lg,
        marginBottom: 12,
        borderWidth: 2,
    },
    priorityLow: {
        backgroundColor: '#F0FDF4',
        borderColor: '#10B981',
    },
    priorityNormal: {
        backgroundColor: '#FFFBEB',
        borderColor: '#F59E0B',
    },
    priorityHigh: {
        backgroundColor: '#FFF7ED',
        borderColor: '#F97316',
    },
    priorityIcon: {
        marginRight: 16,
    },
    priorityEmoji: {
        fontSize: 32,
    },
    priorityInfo: {
        flex: 1,
    },
    priorityLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.gray900,
        marginBottom: 4,
    },
    priorityDescription: {
        fontSize: 14,
        color: Colors.gray600,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.gray200,
        marginVertical: 20,
    },
    emergencyCard: {
        backgroundColor: Colors.danger,
        padding: 24,
        borderRadius: BorderRadius.xl,
        alignItems: 'center',
        marginTop: 8,
    },
    emergencyCardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: Colors.white,
        marginTop: 12,
    },
    emergencyCardSubtitle: {
        fontSize: 14,
        color: Colors.white,
        opacity: 0.9,
        marginTop: 4,
    },
    // Emergency Modal Styles
    emergencyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emergencyModalContent: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: 32,
        width: '100%',
        alignItems: 'center',
    },
    emergencyTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: Colors.danger,
        marginTop: 16,
        marginBottom: 8,
    },
    emergencySubtitle: {
        fontSize: 16,
        color: Colors.gray600,
        marginBottom: 24,
    },
    emergencyContactBox: {
        backgroundColor: Colors.gray100,
        padding: 20,
        borderRadius: BorderRadius.lg,
        width: '100%',
        alignItems: 'center',
        marginBottom: 24,
    },
    emergencyContactLabel: {
        fontSize: 14,
        color: Colors.gray600,
        marginBottom: 8,
    },
    emergencyPhone: {
        fontSize: 32,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 8,
    },
    emergencyAvailable: {
        fontSize: 12,
        color: Colors.gray500,
    },
    callButton: {
        flexDirection: 'row',
        backgroundColor: Colors.success,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        marginBottom: 16,
    },
    callButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    emergencyCloseButton: {
        padding: 12,
    },
    emergencyCloseText: {
        color: Colors.gray500,
        fontSize: 16,
    },
    // History Modal Styles
    historyModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    historyModalContent: {
        backgroundColor: Colors.white,
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
        paddingBottom: 20,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: Colors.gray200,
    },
    historyTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.gray900,
    },
    historyList: {
        padding: 16,
    },
    emptyHistory: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyHistoryText: {
        fontSize: 16,
        color: Colors.gray500,
        marginTop: 16,
    },
    historyCard: {
        backgroundColor: Colors.gray100,
        padding: 16,
        borderRadius: BorderRadius.lg,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: Colors.gray400,
    },
    historyCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyTicketNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.gray900,
    },
    historySubject: {
        fontSize: 14,
        color: Colors.gray700,
        marginBottom: 8,
    },
    historyDate: {
        fontSize: 12,
        color: Colors.gray500,
    },
    activeTicketCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: BorderRadius.lg,
        marginBottom: 16,
        borderWidth: 2,
        borderColor: Colors.primary,
        backgroundColor: '#EFF6FF',
    },
    activeTicketIcon: {
        marginRight: 16,
    },
    activeTicketLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.primary,
        marginBottom: 2,
    },
    activeTicketSub: {
        fontSize: 12,
        color: Colors.gray600,
    },
});
